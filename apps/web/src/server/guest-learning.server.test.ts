import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { eq } from "drizzle-orm";
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
	userId: "guest-owner",
	capture: vi.fn(),
}));
vi.mock("@tanstack/react-start/server-only", () => ({}));
vi.mock("@tradely/db", async () => ({
	...(await import("@tradely/db/schema/index")),
	createDb: mocks.db,
}));
vi.mock("./auth.server", () => ({
	getCurrentUserId: async () => mocks.userId || null,
}));
vi.mock("./analytics/posthog.server", () => ({
	captureServerException: mocks.capture,
}));

import * as schema from "@tradely/db/schema/index";
import { getLessonById, tradingFlowCourse } from "@/content/course";
import { getLessonScenarios } from "@/content/scenarios/index.server";
import type { GuestImportInput } from "@/domain/guest-learning";
import { referenceAction } from "@/domain/learning/test-helpers";
import type { LearningAction } from "@/domain/learning/types";
import { importGuestLearningImpl as save } from "./guest-learning.server";
import { previewLearningSchema } from "./learning";
import { openLearningImpl } from "./learning.server";
import { previewLearningImpl } from "./preview-learning.server";
import { applyTestMigrations } from "./test-database";

function input(
	lessonId = "option-contracts",
	variant = 0,
	complete = true,
): GuestImportInput {
	const lesson = getLessonById(lessonId);
	if (!lesson) throw new Error("Unknown fixture");
	const scenario = getLessonScenarios(lessonId)[variant];
	const actions: LearningAction[] = [];
	if (complete)
		for (const [i, step] of scenario.steps.entries()) {
			for (const evidenceId of step.requiredEvidence)
				actions.push({ type: "inspect", evidenceId });
			for (const question of step.questions)
				actions.push(referenceAction(question));
			actions.push({ type: "submit" });
			if (i < scenario.steps.length - 1) actions.push({ type: "continue" });
		}
	return {
		transferId: randomUUID(),
		expectedUserId: mocks.userId,
		saveSeparately: false,
		work: {
			lessonId,
			variant,
			scenarioId: scenario.id,
			scenarioVersion: scenario.version,
			contentVersion: lesson.contentVersion,
			actions,
			intent: complete ? "result" : "place",
		},
	};
}

describe("guest save with real PostgreSQL commands", () => {
	const pg = new PGlite();
	const db = drizzle(pg, { schema });
	beforeAll(() => applyTestMigrations(pg));
	afterAll(() => pg.close());
	beforeEach(async () => {
		mocks.userId = "guest-owner";
		mocks.db.mockReturnValue(db);
		mocks.capture.mockClear();
		await pg.exec("TRUNCATE app_user CASCADE");
	});
	it.each(
		tradingFlowCourse.lessons.flatMap((l) =>
			[0, 1].map((v) => [l.id, v] as const),
		),
	)(
		"saves the exact result and completion for %s variant %s",
		async (lessonId, variant) => {
			const request = input(lessonId, variant);
			expect(
				previewLearningSchema.safeParse({
					lessonId,
					variant,
					actions: request.work.actions,
				}).success,
			).toBe(true);
			const guest = previewLearningImpl({
				lessonId,
				variant,
				actions: request.work.actions,
			});
			const result = await save(request);
			expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
			if (!result.ok || !guest.ok) throw new Error("Fixture failed");
			expect(result.view.result).toEqual(guest.view.result);
			expect(result.view.scenarioId).toBe(guest.view.scenarioId);
			expect(result.view.scenarioVersion).toBe(guest.view.scenarioVersion);
			expect(result.completed).toBe(true);
			expect(await db.select().from(schema.lessonProgress)).toMatchObject([
				{
					lessonId,
					contentVersion: request.work.contentVersion,
					completedAt: expect.any(Date),
				},
			]);
			expect(
				await openLearningImpl({
					lessonId,
					restart: false,
					attemptId: result.view.attemptId,
				}),
			).toEqual({ ok: true, view: result.view });
		},
	);
	it("preserves drafts without marking a lesson complete", async () => {
		const result = await save(input("rank-symbols", 0, false));
		expect(result).toMatchObject({
			ok: true,
			completed: false,
			view: { phase: "answer", result: null },
		});
		expect(await db.select().from(schema.lessonProgress)).toEqual([]);
	});
	it("makes duplicate and lost-response retries return one durable attempt", async () => {
		const request = input();
		const results = await Promise.all([
			save(request),
			save(request),
			save(request),
		]);
		expect(results.every((r) => r.ok)).toBe(true);
		const attempts = await db.select().from(schema.lessonAttempt);
		expect(attempts).toHaveLength(1);
		expect(await db.select().from(schema.lessonProgress)).toHaveLength(1);
		expect(await save(request)).toMatchObject({
			ok: true,
			replayed: true,
			view: { attemptId: attempts[0].id },
		});
		expect(mocks.capture).not.toHaveBeenCalled();
	});
	it("does not attach another account's transfer or accept changed content", async () => {
		const request = input();
		await save(request);
		expect(
			await save({ ...request, work: { ...request.work, intent: "research" } }),
		).toMatchObject({ ok: false, reason: "transfer_conflict" });
		mocks.userId = "another-account";
		expect(await save(request)).toEqual({
			ok: false,
			reason: "account_changed",
		});
		expect(
			await save({ ...request, expectedUserId: mocks.userId }),
		).toMatchObject({ ok: false, reason: "transfer_conflict" });
		expect(await db.select().from(schema.lessonAttempt)).toHaveLength(1);
	});
	it("never overwrites an existing active attempt and requires explicit separate saving", async () => {
		const existing = await openLearningImpl({
			lessonId: "option-contracts",
			restart: false,
		});
		if (!existing.ok) throw new Error("fixture");
		const before = await db.select().from(schema.lessonAttempt);
		const request = input();
		expect(await save(request)).toMatchObject({
			ok: false,
			reason: "existing_work",
			existingAttemptId: existing.view.attemptId,
			canSaveSeparately: true,
		});
		expect(await db.select().from(schema.lessonAttempt)).toEqual(before);
		const saved = await save({ ...request, saveSeparately: true });
		expect(saved.ok).toBe(true);
		expect(
			await db
				.select()
				.from(schema.lessonAttempt)
				.where(eq(schema.lessonAttempt.id, existing.view.attemptId)),
		).toEqual(before);
		expect(
			await save({
				...input("option-contracts", 0, false),
				saveSeparately: true,
			}),
		).toMatchObject({ ok: false, reason: "invalid_action" });
	});
	it("keeps one active draft under simultaneous ordinary starts and imports", async () => {
		const request = input("rank-symbols", 0, false);
		await Promise.all([
			save(request),
			openLearningImpl({ lessonId: "rank-symbols", restart: false }),
		]);
		expect(
			await db
				.select()
				.from(schema.lessonAttempt)
				.where(eq(schema.lessonAttempt.status, "in_progress")),
		).toHaveLength(1);
	});
	it("rolls back the attempt when saving course completion fails", async () => {
		await pg.exec(
			"CREATE FUNCTION fail_test_progress() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test progress unavailable'; END; $$; CREATE TRIGGER fail_test_progress BEFORE INSERT ON lesson_progress FOR EACH ROW EXECUTE FUNCTION fail_test_progress();",
		);
		try {
			expect(await save(input())).toMatchObject({
				ok: false,
				reason: "unavailable",
			});
			expect(await db.select().from(schema.lessonAttempt)).toEqual([]);
		} finally {
			await pg.exec(
				"DROP TRIGGER fail_test_progress ON lesson_progress; DROP FUNCTION fail_test_progress();",
			);
		}
	});
	it("rejects stale versions, invalid histories, unknown lessons and forged scores", async () => {
		const request = input();
		expect(
			await save({
				...request,
				work: { ...request.work, contentVersion: 999 },
			}),
		).toMatchObject({ ok: false, reason: "retired" });
		expect(
			await save({
				...request,
				work: { ...request.work, scenarioVersion: 999 },
			}),
		).toMatchObject({ ok: false, reason: "retired" });
		expect(
			await save({
				...request,
				work: { ...request.work, lessonId: "unknown" },
			}),
		).toMatchObject({ ok: false, reason: "not_found" });
		expect(
			await save({
				...request,
				work: {
					...request.work,
					actions: [
						{ type: "answer", questionId: "forged", choiceId: "forged" },
					],
				},
			}),
		).toMatchObject({ ok: false, reason: "invalid_action" });
		expect(
			await save({ ...request, score: 100 } as GuestImportInput),
		).toMatchObject({ ok: false, reason: "invalid_action" });
		expect(await db.select().from(schema.lessonAttempt)).toEqual([]);
	});
	it("requires a complete import receipt at the database boundary", async () => {
		const started = await openLearningImpl({
			lessonId: "option-contracts",
			restart: false,
		});
		if (!started.ok) throw new Error("fixture");
		await expect(
			db
				.update(schema.lessonAttempt)
				.set({ guestImportId: randomUUID() })
				.where(eq(schema.lessonAttempt.id, started.view.attemptId)),
		).rejects.toThrow();
	});

	it("rejects unauthenticated imports without writing records", async () => {
		const request = input();
		mocks.userId = "";
		expect(await save(request)).toMatchObject({
			ok: false,
			reason: "signed_out",
		});
		expect(await db.select().from(schema.lessonAttempt)).toEqual([]);
	});
	it("keeps imported research usable as the same user's recap source", async () => {
		const request = input("cookbook-research-packet", 1);
		expect((await save(request)).ok).toBe(true);
		const recap = await openLearningImpl({
			lessonId: "market-recap",
			restart: false,
		});
		expect(recap).toMatchObject({
			ok: true,
			view: {
				sourceWork: { lessonId: "cookbook-research-packet", caseVariant: 2 },
			},
		});
	});
});
