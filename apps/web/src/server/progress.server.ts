import "@tanstack/react-start/server-only";

import { performance } from "node:perf_hooks";

import { createDb, lessonAttempt, lessonProgress } from "@tradely/db";
import { and, eq } from "drizzle-orm";

import { shouldCaptureServerTiming } from "@/analytics/server-timing";
import { getLessonById, tradingFlowCourse } from "@/content/course";
import { getLessonScenarios } from "@/content/scenarios/index.server";
import { learningResultSchema } from "@/domain/learning/types";
import {
	type AssessmentRecord,
	summarizeLearningEvidence,
} from "@/domain/learning-progress";
import { calculateCourseProgress } from "@/domain/progress";
import { getLearningIdentity } from "./access.server";
import {
	captureServerException,
	captureServerRouteTiming,
} from "./analytics/posthog.server";
import type { SaveLessonProgressInput } from "./progress";
import { ensureAppUser } from "./users.server";

export async function getCourseProgressImpl() {
	const lessonIds = tradingFlowCourse.lessons.map((lesson) => lesson.id);
	const scenarios = lessonIds.flatMap(getLessonScenarios);
	const emptyLearning = summarizeLearningEvidence(lessonIds, scenarios, []);
	const startedAt = performance.now();
	const captureSlowTiming = async (
		status: "ok" | "unavailable",
		signedIn: boolean,
	) => {
		const duration_ms = performance.now() - startedAt;
		if (!shouldCaptureServerTiming(duration_ms)) return;
		await captureServerRouteTiming({
			surface: "course_progress",
			operation: "course_progress_read",
			duration_ms,
			status,
			signed_in: signedIn,
		});
	};
	const identity = await getLearningIdentity();
	const userId = identity.userId;
	if (!userId) {
		await captureSlowTiming(identity.unavailable ? "unavailable" : "ok", false);
		return {
			signedIn: false as const,
			completed: 0,
			total: tradingFlowCourse.lessons.length,
			percentage: 0,
			records: [],
			learning: emptyLearning,
			unavailable: identity.unavailable,
		};
	}
	try {
		const db = createDb();
		const [records, submitted] = await Promise.all([
			db
				.select({
					lessonId: lessonProgress.lessonId,
					contentVersion: lessonProgress.contentVersion,
					lastPositionSeconds: lessonProgress.lastPositionSeconds,
					completedAt: lessonProgress.completedAt,
				})
				.from(lessonProgress)
				.where(eq(lessonProgress.userId, userId)),
			db
				.select({
					lessonId: lessonAttempt.lessonId,
					attemptId: lessonAttempt.id,
					scenarioId: lessonAttempt.scenarioId,
					scenarioVersion: lessonAttempt.scenarioVersion,
					submittedAt: lessonAttempt.submittedAt,
					assessment: lessonAttempt.assessment,
				})
				.from(lessonAttempt)
				.where(
					and(
						eq(lessonAttempt.userId, userId),
						eq(lessonAttempt.status, "submitted"),
					),
				),
		]);
		const normalized = records.map((record) => ({
			lessonId: record.lessonId,
			contentVersion: record.contentVersion,
			lastPositionSeconds: record.lastPositionSeconds,
			completedAt: record.completedAt?.toISOString() ?? null,
		}));
		const assessments: AssessmentRecord[] = submitted.flatMap((record) => {
			const parsed = learningResultSchema.safeParse(record.assessment);
			if (!parsed.success || !record.submittedAt) return [];
			const { assessment: _assessment, ...metadata } = record;
			return [
				{
					...metadata,
					submittedAt: record.submittedAt.toISOString(),
					result: parsed.data,
				},
			];
		});
		await captureSlowTiming("ok", true);
		return {
			signedIn: true as const,
			...calculateCourseProgress(
				tradingFlowCourse.lessons.map((lesson) => lesson.id),
				normalized,
			),
			records: normalized,
			learning: summarizeLearningEvidence(lessonIds, scenarios, assessments),
			unavailable: false,
		};
	} catch (error) {
		await captureServerException(error, {
			source: "progress",
			operation: "course_progress_read",
			userId,
		});
		await captureSlowTiming("unavailable", true);
		return {
			signedIn: true as const,
			completed: 0,
			total: tradingFlowCourse.lessons.length,
			percentage: 0,
			records: [],
			learning: emptyLearning,
			unavailable: true as const,
		};
	}
}

export async function saveLessonProgressImpl(data: SaveLessonProgressInput) {
	const lesson = getLessonById(data.lessonId);
	if (!lesson)
		return { saved: false as const, reason: "unknown-lesson" as const };
	const identity = await getLearningIdentity();
	if (identity.unavailable)
		return { saved: false as const, reason: "unavailable" as const };
	const userId = identity.userId;
	if (!userId) return { saved: false as const, reason: "signed-out" as const };
	try {
		await ensureAppUser(userId);
		const db = createDb();
		const now = new Date();
		const updateFields = {
			contentVersion: lesson.contentVersion,
			updatedAt: now,
			...(data.lastPositionSeconds !== undefined
				? { lastPositionSeconds: data.lastPositionSeconds }
				: {}),
			...(data.complete ? { completedAt: now } : {}),
		};
		await db
			.insert(lessonProgress)
			.values({
				userId: userId,
				lessonId: data.lessonId,
				contentVersion: lesson.contentVersion,
				lastPositionSeconds: data.lastPositionSeconds ?? null,
				completedAt: data.complete ? now : null,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: [lessonProgress.userId, lessonProgress.lessonId],
				set: updateFields,
			});
		const [record] = await db
			.select()
			.from(lessonProgress)
			.where(
				and(
					eq(lessonProgress.userId, userId),
					eq(lessonProgress.lessonId, data.lessonId),
				),
			)
			.limit(1);
		return {
			saved: true as const,
			completedAt: record?.completedAt?.toISOString() ?? null,
		};
	} catch (error) {
		await captureServerException(error, {
			source: "progress",
			operation: "lesson_progress_save",
			userId,
			lessonId: data.lessonId,
		});
		throw error;
	}
}
