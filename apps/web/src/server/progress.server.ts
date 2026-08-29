import "@tanstack/react-start/server-only";

import { createDb, lessonProgress } from "@tradely/db";
import { and, eq } from "drizzle-orm";

import { getLessonById, tradingFlowCourse } from "@/content/course";
import { calculateCourseProgress } from "@/domain/progress";
import {
	getCurrentCourseAccess,
	resolveCurrentLessonAccess,
} from "./access.server";
import { captureServerException } from "./analytics/posthog.server";
import type { SaveLessonProgressInput } from "./progress";
import { ensureAppUser } from "./users.server";

export async function getCourseProgressImpl() {
	const courseAccess = await getCurrentCourseAccess();
	const userId = courseAccess.userId;
	if (!userId) {
		return {
			signedIn: false as const,
			completed: 0,
			total: tradingFlowCourse.lessons.length,
			percentage: 0,
			records: [],
			canAccessPaid: false,
			accessUnavailable: false,
		};
	}
	try {
		const db = createDb();
		const records = await db
			.select({
				lessonId: lessonProgress.lessonId,
				contentVersion: lessonProgress.contentVersion,
				lastPositionSeconds: lessonProgress.lastPositionSeconds,
				completedAt: lessonProgress.completedAt,
			})
			.from(lessonProgress)
			.where(eq(lessonProgress.clerkUserId, userId));
		const normalized = records.map((record) => ({
			lessonId: record.lessonId,
			contentVersion: record.contentVersion,
			lastPositionSeconds: record.lastPositionSeconds,
			completedAt: record.completedAt?.toISOString() ?? null,
		}));
		return {
			signedIn: true as const,
			...calculateCourseProgress(
				tradingFlowCourse.lessons.map((lesson) => lesson.id),
				normalized,
			),
			records: normalized,
			canAccessPaid: courseAccess.canAccessPaid,
			accessUnavailable: courseAccess.billingState === "unavailable",
		};
	} catch (error) {
		await captureServerException(error, {
			source: "progress",
			operation: "course_progress_read",
			userId,
		});
		return {
			signedIn: true as const,
			completed: 0,
			total: tradingFlowCourse.lessons.length,
			percentage: 0,
			records: [],
			canAccessPaid: courseAccess.canAccessPaid,
			accessUnavailable: courseAccess.billingState === "unavailable",
			unavailable: true as const,
		};
	}
}

export async function saveLessonProgressImpl(data: SaveLessonProgressInput) {
	const lesson = getLessonById(data.lessonId);
	if (!lesson)
		return { saved: false as const, reason: "unknown-lesson" as const };
	const { access, courseAccess } = await resolveCurrentLessonAccess(lesson);
	const userId = courseAccess.userId;
	if (!userId) return { saved: false as const, reason: "signed-out" as const };
	if (!access.allowed) return { saved: false as const, reason: access.reason };
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
				clerkUserId: userId,
				lessonId: data.lessonId,
				contentVersion: lesson.contentVersion,
				lastPositionSeconds: data.lastPositionSeconds ?? null,
				completedAt: data.complete ? now : null,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: [lessonProgress.clerkUserId, lessonProgress.lessonId],
				set: updateFields,
			});
		const [record] = await db
			.select()
			.from(lessonProgress)
			.where(
				and(
					eq(lessonProgress.clerkUserId, userId),
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
