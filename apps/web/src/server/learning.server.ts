import "@tanstack/react-start/server-only";
import { randomUUID } from "node:crypto";
import { createDb, type LessonAttempt, lessonAttempt } from "@tradely/db";
import { and, desc, eq } from "drizzle-orm";
import { getLessonById } from "@/content/course";
import { learningRollout } from "@/content/learning-rollout";
import {
	getLessonScenarios,
	getScenario,
} from "@/content/scenarios/index.server";
import {
	assessAttempt,
	InvalidLearningAction,
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	attemptStateSchema,
	type LearningResponse,
	learningResultSchema,
} from "@/domain/learning/types";
import { resolveCurrentLessonAccess } from "./access.server";
import { captureServerException } from "./analytics/posthog.server";
import type { OpenLearningInput, UpdateLearningInput } from "./learning";
import { ensureAppUser } from "./users.server";

async function authorize(lessonId: string) {
	const lesson = getLessonById(lessonId);
	if (!lesson || !Object.hasOwn(learningRollout, lessonId))
		return { ok: false, reason: "not_found" } as const;
	const { access, courseAccess } = await resolveCurrentLessonAccess(lesson);
	if (!courseAccess.userId) return { ok: false, reason: "signed_out" } as const;
	if (!access.allowed)
		return {
			ok: false,
			reason:
				access.reason === "billing-unavailable"
					? "unavailable"
					: "access_denied",
		} as const;
	return { ok: true, userId: courseAccess.userId } as const;
}

function projectRecord(record: LessonAttempt): LearningResponse {
	const scenario = getScenario(
		record.lessonId,
		record.scenarioId,
		record.scenarioVersion,
	);
	if (!scenario || record.status === "retired")
		return { ok: false, reason: "retired" };
	const view = projectAttempt(
		scenario,
		attemptStateSchema.parse(record.state),
		record.id,
		record.revision,
	);
	if (record.status === "submitted")
		view.result = learningResultSchema.parse(record.assessment);
	return { ok: true, view };
}

async function reportFailure(operation: string) {
	// Database errors may contain bound parameters. Never pass the raw error,
	// case text, answers, or attempt state into the analytics boundary.
	await captureServerException(new Error("Learning persistence unavailable"), {
		source: "learning",
		operation,
	});
}

export async function openLearningImpl(
	data: OpenLearningInput,
): Promise<LearningResponse> {
	try {
		const access = await authorize(data.lessonId);
		if (!access.ok) return access;
		const scenarios = getLessonScenarios(data.lessonId);
		if (!scenarios.length) return { ok: false, reason: "not_found" };
		const db = createDb();
		const owner = and(
			eq(lessonAttempt.clerkUserId, access.userId),
			eq(lessonAttempt.lessonId, data.lessonId),
		);
		const [latest] = await db
			.select()
			.from(lessonAttempt)
			.where(owner)
			.orderBy(desc(lessonAttempt.createdAt), desc(lessonAttempt.id))
			.limit(1);
		if (latest) {
			const projected = projectRecord(latest);
			if (!data.restart) return projected;
			// A second Start/Retry request reuses the active attempt, never erases it.
			if (projected.ok && latest.status === "in_progress") return projected;
			if (!projected.ok && latest.status === "in_progress") {
				await db
					.update(lessonAttempt)
					.set({ status: "retired", updatedAt: new Date() })
					.where(
						and(
							owner,
							eq(lessonAttempt.id, latest.id),
							eq(lessonAttempt.revision, latest.revision),
						),
					);
			}
		}
		const previousIndex = scenarios.findIndex(
			(scenario) => scenario.id === latest?.scenarioId,
		);
		const scenario = scenarios[(previousIndex + 1) % scenarios.length];
		await ensureAppUser(access.userId);
		const [created] = await db
			.insert(lessonAttempt)
			.values({
				id: randomUUID(),
				clerkUserId: access.userId,
				lessonId: data.lessonId,
				scenarioId: scenario.id,
				scenarioVersion: scenario.version,
				state: initialAttemptState(),
			})
			.onConflictDoNothing()
			.returning();
		if (created) return projectRecord(created);
		// The partial unique index resolves simultaneous starts from two tabs.
		const [active] = await db
			.select()
			.from(lessonAttempt)
			.where(and(owner, eq(lessonAttempt.status, "in_progress")))
			.limit(1);
		return active ? projectRecord(active) : { ok: false, reason: "conflict" };
	} catch {
		await reportFailure("learning_open");
		return { ok: false, reason: "unavailable" };
	}
}

export async function updateLearningImpl(
	data: UpdateLearningInput,
): Promise<LearningResponse> {
	try {
		const access = await authorize(data.lessonId);
		if (!access.ok) return access;
		const db = createDb();
		const owner = and(
			eq(lessonAttempt.id, data.attemptId),
			eq(lessonAttempt.clerkUserId, access.userId),
			eq(lessonAttempt.lessonId, data.lessonId),
		);
		const [record] = await db
			.select()
			.from(lessonAttempt)
			.where(owner)
			.limit(1);
		if (!record) return { ok: false, reason: "not_found" };
		const scenario = getScenario(
			data.lessonId,
			record.scenarioId,
			record.scenarioVersion,
		);
		if (!scenario || record.status === "retired")
			return { ok: false, reason: "retired" };
		if (record.lastCommandId === data.commandId) return projectRecord(record);
		if (record.revision !== data.revision)
			return { ok: false, reason: "conflict" };
		if (record.status !== "in_progress")
			return data.action.type === "submit"
				? projectRecord(record)
				: { ok: false, reason: "invalid_action" };
		const state = transitionAttempt(
			scenario,
			attemptStateSchema.parse(record.state),
			data.action,
		);
		const now = new Date();
		const [saved] = await db
			.update(lessonAttempt)
			.set({
				state,
				revision: record.revision + 1,
				lastCommandId: data.commandId,
				updatedAt: now,
				assessment: assessAttempt(scenario, state),
				status: state.phase === "complete" ? "submitted" : "in_progress",
				submittedAt: state.phase === "complete" ? now : null,
			})
			.where(
				and(
					owner,
					eq(lessonAttempt.revision, data.revision),
					eq(lessonAttempt.status, "in_progress"),
				),
			)
			.returning();
		if (saved) return projectRecord(saved);
		const [winner] = await db
			.select()
			.from(lessonAttempt)
			.where(owner)
			.limit(1);
		return winner?.lastCommandId === data.commandId
			? projectRecord(winner)
			: { ok: false, reason: "conflict" };
	} catch (error) {
		if (error instanceof InvalidLearningAction)
			return { ok: false, reason: "invalid_action" };
		await reportFailure("learning_update");
		return { ok: false, reason: "unavailable" };
	}
}
