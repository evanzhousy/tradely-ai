import "@tanstack/react-start/server-only";
import { createHash, randomUUID } from "node:crypto";
import { createDb, lessonAttempt } from "@tradely/db";
import { and, eq, sql } from "drizzle-orm";
import { getLessonById } from "@/content/course";
import { getLessonScenarios } from "@/content/scenarios/index.server";
import {
	type GuestImportInput,
	type GuestImportResponse,
	guestImportSchema,
} from "@/domain/guest-learning";
import {
	assessAttempt,
	InvalidLearningAction,
	initialAttemptState,
	transitionAttempt,
} from "@/domain/learning/engine";
import { captureServerException } from "./analytics/posthog.server";
import { projectRecord } from "./learning.server";
import { authorizeLearning } from "./learning-access.server";
import { ensureAppUser } from "./users.server";

export async function importGuestLearningImpl(
	input: GuestImportInput,
): Promise<GuestImportResponse> {
	const parsed = guestImportSchema.safeParse(input);
	if (!parsed.success) return { ok: false, reason: "invalid_action" };
	const { work, transferId, expectedUserId, saveSeparately } = parsed.data;
	try {
		const access = await authorizeLearning(work.lessonId);
		if (!access.ok) return access;
		if (access.userId !== expectedUserId)
			return { ok: false, reason: "account_changed" };
		const payloadHash = createHash("sha256")
			.update(JSON.stringify(work))
			.digest("hex");
		const db = createDb();
		const [prior] = await db
			.select()
			.from(lessonAttempt)
			.where(eq(lessonAttempt.guestImportId, transferId))
			.limit(1);
		if (prior) {
			if (
				prior.userId !== access.userId ||
				prior.guestImportHash !== payloadHash
			)
				return { ok: false, reason: "transfer_conflict" };
			const projected = projectRecord(prior);
			return projected.ok
				? {
						...projected,
						completed: prior.status === "submitted",
						replayed: true,
					}
				: projected;
		}
		const lesson = getLessonById(work.lessonId);
		const scenario = getLessonScenarios(work.lessonId)[work.variant];
		if (
			!lesson ||
			lesson.contentVersion !== work.contentVersion ||
			!scenario ||
			scenario.id !== work.scenarioId ||
			scenario.version !== work.scenarioVersion
		)
			return { ok: false, reason: "retired" };
		const state = work.actions.reduce(
			(state, action) => transitionAttempt(scenario, state, action),
			initialAttemptState(),
		);
		if (
			(work.intent === "result" || saveSeparately) &&
			state.phase !== "complete"
		)
			return { ok: false, reason: "invalid_action" };
		const assessment = assessAttempt(scenario, state);
		await ensureAppUser(access.userId);
		const command = {
			transferId,
			payloadHash,
			attemptId: randomUUID(),
			lessonId: lesson.id,
			scenarioId: scenario.id,
			scenarioVersion: scenario.version,
			contentVersion: lesson.contentVersion,
			revision: work.actions.length,
			state,
			assessment,
			saveSeparately,
		};
		const rows = await db.execute<{
			result: {
				ok: boolean;
				attemptId?: string;
				reason?: string;
				existingAttemptId?: string;
				replayed?: boolean;
			};
		}>(
			sql`select tradely_import_guest_attempt(${access.userId}, ${JSON.stringify(command)}::jsonb) as result`,
		);
		const result = rows.rows[0]?.result;
		if (!result?.ok)
			return {
				ok: false,
				reason:
					result?.reason === "existing_work"
						? "existing_work"
						: result?.reason === "transfer_conflict"
							? "transfer_conflict"
							: "unavailable",
				existingAttemptId: result?.existingAttemptId,
				canSaveSeparately: state.phase === "complete",
			};
		if (!result.attemptId) return { ok: false, reason: "unavailable" };
		const [saved] = await db
			.select()
			.from(lessonAttempt)
			.where(
				and(
					eq(lessonAttempt.id, result.attemptId),
					eq(lessonAttempt.userId, access.userId),
				),
			)
			.limit(1);
		if (!saved) return { ok: false, reason: "unavailable" };
		const projected = projectRecord(saved);
		return projected.ok
			? {
					...projected,
					completed: saved.status === "submitted",
					replayed: result.replayed === true,
				}
			: projected;
	} catch (error) {
		if (error instanceof InvalidLearningAction)
			return { ok: false, reason: "invalid_action" };
		await captureServerException(new Error("Guest learning save unavailable"), {
			source: "learning",
			operation: "guest_learning_import",
		});
		return { ok: false, reason: "unavailable" };
	}
}
