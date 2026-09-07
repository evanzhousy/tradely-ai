import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
	db: vi.fn(),
	access: vi.fn(),
	capture: vi.fn(),
}));
vi.mock("@tanstack/react-start/server-only", () => ({}));
vi.mock("@tradely/db", async () => ({
	...(await import("@tradely/db/schema/index")),
	createDb: mocks.db,
}));
vi.mock("./access.server", () => ({
	resolveCurrentLessonAccess: mocks.access,
}));
vi.mock("./analytics/posthog.server", () => ({
	captureServerException: mocks.capture,
}));

import * as schema from "@tradely/db/schema/index";
import { eq } from "drizzle-orm";
import { optionPrintScenarios } from "@/content/scenarios/option-print";
import type {
	LearningAction,
	LearningResponse,
	LearningView,
} from "@/domain/learning/types";
import { openLearningSchema, updateLearningSchema } from "./learning";
import { openLearningImpl, updateLearningImpl } from "./learning.server";

describe("learning persistence and authorization (isolated PostgreSQL)", () => {
	const pg = new PGlite();
	const db = drizzle(pg, { schema });
	const lessonId = "validate-option-print";
	const open = (restart = false) => openLearningImpl({ lessonId, restart });
	const viewOf = (response: LearningResponse): LearningView => {
		expect(response.ok).toBe(true);
		if (!response.ok) throw new Error(response.reason);
		return response.view;
	};
	const command = (view: LearningView, action: LearningAction) => ({
		lessonId,
		attemptId: view.attemptId,
		revision: view.revision,
		commandId: randomUUID(),
		action,
	});
	beforeAll(async () => {
		for (const filename of [
			"0000_salty_randall.sql",
			"0001_low_clea.sql",
			"0002_learning_attempts.sql",
		])
			await pg.exec(
				readFileSync(
					new URL(
						`../../../../packages/db/src/migrations/${filename}`,
						import.meta.url,
					),
					"utf8",
				),
			);
	});
	afterAll(async () => {
		await pg.close();
	});
	beforeEach(async () => {
		await pg.exec("TRUNCATE lesson_attempt, lesson_progress, app_user CASCADE");
		vi.clearAllMocks();
		mocks.db.mockReturnValue(db);
		mocks.access.mockResolvedValue({
			access: { allowed: true, reason: "course-pass" },
			courseAccess: { userId: "learner-a" },
		});
	});

	it("applies the real migration, saves/resumes a choice, and retries a lost response exactly once", async () => {
		const initial = viewOf(await open());
		const payload = command(initial, {
			type: "answer",
			questionId: "first-claim",
			choiceId: "execution",
		});
		const saved = viewOf(await updateLearningImpl(payload));
		expect(saved.revision).toBe(1);
		expect(viewOf(await updateLearningImpl(payload))).toEqual(saved);
		expect(viewOf(await open()).answers).toEqual({
			"first-claim": "execution",
		});
		expect(
			await updateLearningImpl(
				command(initial, {
					type: "answer",
					questionId: "first-claim",
					choiceId: "bullish",
				}),
			),
		).toEqual({ ok: false, reason: "conflict" });
	});

	it("allows one active attempt under simultaneous starts and preserves it on a repeated retry", async () => {
		const views = (await Promise.all([open(), open()])).map(viewOf);
		expect(views[0].attemptId).toBe(views[1].attemptId);
		expect(viewOf(await open(true)).attemptId).toBe(views[0].attemptId);
		expect((await db.select().from(schema.lessonAttempt)).length).toBe(1);
	});
	it("keeps the contract lab and print exercise independent for the same learner", async () => {
		const print = viewOf(await open());
		const contract = viewOf(
			await openLearningImpl({ lessonId: "rank-contracts", restart: false }),
		);
		expect(contract.attemptId).not.toBe(print.attemptId);
		expect(contract.step.neighborhood?.id).toBe("alfa-neighborhood-v2");
		const saved = viewOf(
			await updateLearningImpl({
				...command(contract, {
					type: "answer",
					questionId: "research-boundary",
					choiceId: "scope",
				}),
				lessonId: "rank-contracts",
			}),
		);
		expect(saved.answers).toEqual({ "research-boundary": "scope" });
		expect(viewOf(await open()).answers).toEqual({});
	});

	it("atomically resolves concurrent decisions without overwriting the winner", async () => {
		const first = viewOf(await open());
		const results = await Promise.all([
			updateLearningImpl(
				command(first, {
					type: "answer",
					questionId: "first-claim",
					choiceId: "execution",
				}),
			),
			updateLearningImpl(
				command(first, {
					type: "answer",
					questionId: "first-claim",
					choiceId: "bullish",
				}),
			),
		]);
		expect(results.filter((result) => result.ok).length).toBe(1);
		expect(results).toContainEqual({ ok: false, reason: "conflict" });
		expect(viewOf(await open()).revision).toBe(1);
	});

	it("checks identity and paid access on every request and never returns someone else's attempt", async () => {
		const first = viewOf(await open());
		const payload = command(first, { type: "hint" });
		mocks.access.mockResolvedValue({
			access: { allowed: true },
			courseAccess: { userId: "learner-b" },
		});
		expect(await updateLearningImpl(payload)).toEqual({
			ok: false,
			reason: "not_found",
		});
		mocks.access.mockResolvedValue({
			access: { allowed: false, reason: "payment-required" },
			courseAccess: { userId: "learner-a" },
		});
		expect(await updateLearningImpl(payload)).toEqual({
			ok: false,
			reason: "access_denied",
		});
		expect(await open()).toEqual({ ok: false, reason: "access_denied" });
		mocks.access.mockResolvedValue({
			access: { allowed: false, reason: "billing-unavailable" },
			courseAccess: { userId: "learner-a" },
		});
		expect(await open()).toEqual({ ok: false, reason: "unavailable" });
		mocks.access.mockResolvedValue({
			access: { allowed: false, reason: "signed-out" },
			courseAccess: { userId: null },
		});
		expect(await open()).toEqual({ ok: false, reason: "signed_out" });
		expect(
			await openLearningImpl({ lessonId: "audited-boundary", restart: false }),
		).toEqual({ ok: false, reason: "not_found" });
	});

	it("requires an explicit restart for retired content and preserves the old attempt", async () => {
		const first = viewOf(await open());
		await db
			.update(schema.lessonAttempt)
			.set({ scenarioVersion: 999 })
			.where(eq(schema.lessonAttempt.id, first.attemptId));
		expect(await open()).toEqual({ ok: false, reason: "retired" });
		const restarted = viewOf(await open(true));
		expect(restarted.attemptId).not.toBe(first.attemptId);
		const [old] = await db
			.select()
			.from(schema.lessonAttempt)
			.where(eq(schema.lessonAttempt.id, first.attemptId));
		expect(old.status).toBe("retired");
		expect(old.scenarioVersion).toBe(999);
	});

	it("saves the complete result, alternates retry cases, and preserves legacy progress", async () => {
		let view = viewOf(await open());
		await db.insert(schema.lessonProgress).values({
			clerkUserId: "learner-a",
			lessonId,
			contentVersion: 1,
			lastPositionSeconds: 123,
			completedAt: new Date("2026-09-01T00:00:00Z"),
		});
		const scenario = optionPrintScenarios[0];
		for (const step of scenario.steps) {
			for (const evidence of step.evidence)
				view = viewOf(
					await updateLearningImpl(
						command(view, { type: "inspect", evidenceId: evidence.id }),
					),
				);
			for (const question of step.questions)
				view = viewOf(
					await updateLearningImpl(
						command(view, {
							type: "answer",
							questionId: question.id,
							choiceId: question.accepted[0],
						}),
					),
				);
			view = viewOf(
				await updateLearningImpl(command(view, { type: "submit" })),
			);
			if (view.phase !== "complete")
				view = viewOf(
					await updateLearningImpl(command(view, { type: "continue" })),
				);
		}
		expect(view.result).toMatchObject({ status: "demonstrated", met: 3 });
		expect(viewOf(await open()).result).toEqual(view.result);
		expect(
			viewOf(await updateLearningImpl(command(view, { type: "submit" }))),
		).toEqual(view);
		const retry = viewOf(await open(true));
		expect(retry.scenarioId).toBe("option-print-b");
		expect((await db.select().from(schema.lessonAttempt)).length).toBe(2);
		const [legacy] = await db.select().from(schema.lessonProgress);
		expect(legacy.lastPositionSeconds).toBe(123);
		expect(legacy.completedAt?.toISOString()).toBe("2026-09-01T00:00:00.000Z");
	});

	it("rejects forged results and early completion without logging answers", async () => {
		const first = viewOf(await open());
		expect(
			await updateLearningImpl(command(first, { type: "submit" })),
		).toEqual({ ok: false, reason: "invalid_action" });
		expect(
			updateLearningSchema.safeParse({
				...command(first, { type: "hint" }),
				result: { status: "demonstrated" },
			}).success,
		).toBe(false);
		expect(
			openLearningSchema.safeParse({ lessonId, userId: "other-user" }).success,
		).toBe(false);
		mocks.db.mockImplementation(() => {
			throw new Error("SQL with PRIVATE ANSWER and lesson content");
		});
		expect(await open()).toEqual({ ok: false, reason: "unavailable" });
		expect(mocks.capture).toHaveBeenCalled();
		expect(mocks.capture.mock.calls[0][0].message).toBe(
			"Learning persistence unavailable",
		);
		expect(JSON.stringify(mocks.capture.mock.calls)).not.toContain(
			"PRIVATE ANSWER",
		);
	});
});
