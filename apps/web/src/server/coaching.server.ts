import "@tanstack/react-start/server-only";
import { createHash, randomUUID } from "node:crypto";
import {
	type CoachingSessionRecord,
	coachingGeneration,
	coachingSession,
	createDb,
	type LessonAttempt,
	lessonAttempt,
} from "@tradely/db";
import { and, asc, eq, lt, sql } from "drizzle-orm";
import { getCoachingLesson } from "@/content/coaching/index.server";
import { sameWork } from "@/domain/coaching/policy";
import {
	type CoachingCommand,
	CoachingError,
	type CoachingIdentity,
	type CoachingResponse,
	type CoachingSnapshot,
	type CoachingView,
	coachingFailureSchema,
	coachingFeedbackSchema,
} from "@/domain/coaching/types";
import { attemptStateSchema } from "@/domain/learning/types";
import { captureServerException } from "./analytics/posthog.server";
import {
	getCoachingSettings,
	verifyCoachingPrice,
} from "./coaching-config.server";
import {
	buildCoachingSnapshot,
	requireCoachingStage,
} from "./coaching-context.server";
import {
	COACH_PROMPT_VERSION,
	type CoachingPrompt,
	generateCoachingFeedback,
	prepareCoachingPrompt,
} from "./coaching-provider.server";
import { authorizeLearning } from "./learning-access.server";

const coachingInputHash = (value: unknown) =>
	createHash("sha256").update(JSON.stringify(value)).digest("hex");

async function own(input: CoachingIdentity) {
	if (!getCoachingLesson(input.lessonId))
		throw new CoachingError("not_eligible");
	const access = await authorizeLearning(input.lessonId);
	if (!access.ok) throw new CoachingError(access.reason);
	const db = createDb();
	const [attempt] = await db
		.select()
		.from(lessonAttempt)
		.where(
			and(
				eq(lessonAttempt.id, input.attemptId),
				eq(lessonAttempt.userId, access.userId),
				eq(lessonAttempt.lessonId, input.lessonId),
			),
		)
		.limit(1);
	if (!attempt) throw new CoachingError("not_found");
	return { db, access, attempt };
}
async function sessionFor(db: ReturnType<typeof createDb>, attemptId: string) {
	const [session] = await db
		.select()
		.from(coachingSession)
		.where(eq(coachingSession.attemptId, attemptId))
		.limit(1);
	return session;
}
async function apply(
	db: ReturnType<typeof createDb>,
	userId: string,
	attemptId: string,
	kind: string,
	payload: unknown,
) {
	const result = await db.execute<{
		result: {
			ok: boolean;
			reason?: string;
			execute?: boolean;
			generationId?: string;
		};
	}>(
		sql`select tradely_coaching_command(${userId}, ${attemptId}, ${kind}, ${JSON.stringify(payload)}::jsonb) as result`,
	);
	const command = result.rows[0]?.result;
	if (!command?.ok)
		throw new CoachingError(
			coachingFailureSchema.catch("unavailable").parse(command?.reason),
		);
	return command;
}
function settingsReason(userId: string) {
	try {
		getCoachingSettings(userId);
		return null;
	} catch (error) {
		return error instanceof CoachingError
			? error.reason
			: ("unavailable" as const);
	}
}
async function viewOf(
	db: ReturnType<typeof createDb>,
	userId: string,
	attempt: LessonAttempt,
	session?: CoachingSessionRecord,
): Promise<CoachingView> {
	const config = getCoachingLesson(attempt.lessonId);
	const reason = settingsReason(userId);
	const base = {
		available: reason === null,
		reason,
		reasonQuestionId: config?.reasonQuestionId ?? null,
	};
	if (!session) return { ...base, session: null };
	await db
		.update(coachingGeneration)
		.set({ status: "indeterminate", errorCode: "indeterminate" })
		.where(
			and(
				eq(coachingGeneration.sessionId, session.id),
				eq(coachingGeneration.status, "running"),
				lt(coachingGeneration.leaseExpiresAt, new Date()),
			),
		);
	const generations = await db
		.select()
		.from(coachingGeneration)
		.where(eq(coachingGeneration.sessionId, session.id))
		.orderBy(asc(coachingGeneration.createdAt));
	const snapshot = (session.revisedSnapshot ??
		session.initialSnapshot) as CoachingSnapshot | null;
	return {
		...base,
		session: {
			id: session.id,
			revision: session.revision,
			locale: session.locale,
			draftReason: session.draftReason,
			initial: session.initialSnapshot as CoachingSnapshot | null,
			revised: session.revisedSnapshot as CoachingSnapshot | null,
			deleted: session.deletedAt !== null,
			stale:
				attempt.status !== "in_progress" ||
				(snapshot !== null && snapshot.attemptRevision !== attempt.revision),
			generations: generations.map((g) => ({
				id: g.id,
				round: g.round,
				status: g.status,
				feedback: g.feedback ? coachingFeedbackSchema.parse(g.feedback) : null,
				error: g.errorCode
					? coachingFailureSchema.catch("unavailable").parse(g.errorCode)
					: null,
			})),
		},
	};
}
async function failure(
	error: unknown,
	operation: string,
): Promise<CoachingResponse> {
	if (error instanceof CoachingError)
		return { ok: false, reason: error.reason };
	// Query/provider errors can embed private bound parameters; only fixed text crosses telemetry.
	await captureServerException(new Error("Coaching service unavailable"), {
		source: "coaching",
		operation,
	});
	return { ok: false, reason: "unavailable" };
}
export async function getCoachingImpl(
	input: CoachingIdentity,
): Promise<CoachingResponse> {
	try {
		const { db, access, attempt } = await own(input);
		let session: CoachingSessionRecord | undefined;
		try {
			session = await sessionFor(db, attempt.id);
		} catch (error) {
			// An additive feature disabled before its migration must not break course practice.
			if (settingsReason(access.userId) !== "disabled") throw error;
		}
		return {
			ok: true,
			view: await viewOf(db, access.userId, attempt, session),
		};
	} catch (error) {
		return failure(error, "coaching_read");
	}
}
export async function updateCoachingImpl(
	input: CoachingCommand,
): Promise<CoachingResponse> {
	try {
		const { db, access, attempt } = await own(input);
		const session = await sessionFor(db, attempt.id);
		if (input.action.type === "delete") {
			await apply(db, access.userId, attempt.id, "delete", {});
			return getCoachingImpl(input);
		}
		if (session?.deletedAt) throw new CoachingError("deleted");
		if (input.action.type === "review" && session) {
			const [existing] = await db
				.select()
				.from(coachingGeneration)
				.where(
					and(
						eq(coachingGeneration.sessionId, session.id),
						eq(coachingGeneration.round, input.action.round),
					),
				)
				.limit(1);
			// Every retry reads the durable execution; it cannot submit a second provider request.
			if (existing) return getCoachingImpl(input);
		}
		const settings = getCoachingSettings(access.userId);
		const config = getCoachingLesson(attempt.lessonId);
		if (!config) throw new CoachingError("not_eligible");
		const state = attemptStateSchema.parse(attempt.state);
		const locale = session?.locale ?? input.locale;
		const body = {
			sessionId: randomUUID(),
			commandId: input.commandId,
			locale,
			attemptRevision: input.attemptRevision,
			sessionRevision: input.sessionRevision,
			scenarioId: attempt.scenarioId,
			scenarioVersion: attempt.scenarioVersion,
			rubricVersion: config.version,
			stepIndex: state.step,
			...settings,
			dailyLimit: access.canAccessPaid ? 3 : 1,
		};
		if (input.action.type === "save") {
			if (config.reasonQuestionId) throw new CoachingError("invalid_action");
			// Validate the actual guided stage and the saved question answers, even for an incomplete draft.
			requireCoachingStage(attempt);
			await apply(db, access.userId, attempt.id, "save", {
				...body,
				reason: input.action.reason,
			});
			return getCoachingImpl(input);
		}
		if (
			attempt.revision !== input.attemptRevision ||
			(session?.revision ?? null) !== input.sessionRevision
		)
			throw new CoachingError("conflict");
		const snapshot = buildCoachingSnapshot(
			attempt,
			locale,
			session?.draftReason ?? "",
		);
		const original =
			(session?.initialSnapshot as CoachingSnapshot | null) ?? null;
		if (
			input.action.round === "revision" &&
			(!original || sameWork(original, snapshot))
		)
			throw new CoachingError("incomplete");
		const [first] = session
			? await db
					.select()
					.from(coachingGeneration)
					.where(
						and(
							eq(coachingGeneration.sessionId, session.id),
							eq(coachingGeneration.round, "initial"),
						),
					)
					.limit(1)
			: [];
		const prompt: CoachingPrompt = {
			snapshot,
			original,
			round: input.action.round,
			previousFeedback: first?.feedback
				? coachingFeedbackSchema.parse(first.feedback)
				: null,
		};
		prepareCoachingPrompt(prompt);
		await verifyCoachingPrice();
		const generationId = randomUUID();
		const reserved = await apply(db, access.userId, attempt.id, "review", {
			...body,
			generationId,
			round: input.action.round,
			snapshot,
			inputHash: coachingInputHash(prompt),
			promptVersion: COACH_PROMPT_VERSION,
		});
		if (!reserved.execute) return getCoachingImpl(input);
		const began = Date.now();
		let completion: Record<string, unknown>;
		try {
			const result = await generateCoachingFeedback(prompt);
			completion = { ...result, status: "succeeded", error: null };
		} catch (error) {
			// A timeout/transport failure may already have incurred cost. Never automatically resend.
			const invalid =
				error instanceof CoachingError && error.reason === "invalid_output";
			completion = {
				status: invalid ? "failed" : "indeterminate",
				error: invalid ? "invalid_output" : "indeterminate",
				feedback: null,
				costMicros: Math.ceil(settings.reservationMicros / 2),
			};
		}
		await apply(db, access.userId, attempt.id, "finish", {
			...completion,
			generationId,
			elapsedMs: Date.now() - began,
		});
		return getCoachingImpl(input); // Reauthorize; late results stay bound to their original snapshots.
	} catch (error) {
		return failure(error, "coaching_update");
	}
}
