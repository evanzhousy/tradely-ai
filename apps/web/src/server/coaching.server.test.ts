import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
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
	access: vi.fn(),
	capture: vi.fn(),
	generate: vi.fn(),
	settings: vi.fn(),
	price: vi.fn(),
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
vi.mock("./coaching-config.server", async (original) => ({
	...(await original<typeof import("./coaching-config.server")>()),
	getCoachingSettings: mocks.settings,
	verifyCoachingPrice: mocks.price,
}));
vi.mock("./coaching-provider.server", async (original) => ({
	...(await original<typeof import("./coaching-provider.server")>()),
	generateCoachingFeedback: mocks.generate,
}));

import * as schema from "@tradely/db/schema/index";
import { getLessonScenarios } from "@/content/scenarios/index.server";
import {
	exampleFeedback,
	exampleReason,
	guidedRecord,
} from "@/domain/coaching/test-fixtures";
import {
	type CoachingCommand,
	CoachingError,
	type CoachingResponse,
} from "@/domain/coaching/types";
import { transitionAttempt } from "@/domain/learning/engine";
import { attemptStateSchema } from "@/domain/learning/types";
import { getCoachingImpl, updateCoachingImpl } from "./coaching.server";

describe("coaching with actual PostgreSQL migrations", () => {
	const pg = new PGlite();
	const db = drizzle(pg, { schema });
	let record = guidedRecord();
	const resultView = (response: CoachingResponse) => {
		expect(response.ok).toBe(true);
		if (!response.ok) throw new Error(response.reason);
		return response.view;
	};
	const read = () =>
		getCoachingImpl({ lessonId: record.lessonId, attemptId: record.id });
	const command = async (
		action: CoachingCommand["action"],
	): Promise<CoachingCommand> => {
		const view = resultView(await read());
		return {
			lessonId: record.lessonId,
			attemptId: record.id,
			attemptRevision: record.revision,
			sessionRevision: view.session?.revision ?? null,
			commandId: randomUUID(),
			locale: "en",
			action,
		};
	};
	const save = async (reason = exampleReason) =>
		resultView(
			await updateCoachingImpl(await command({ type: "save", reason })),
		);
	const review = async (round: "initial" | "revision" = "initial") =>
		updateCoachingImpl(await command({ type: "review", round }));
	beforeAll(async () => {
		for (const file of [
			"0000_salty_randall",
			"0001_low_clea",
			"0002_learning_attempts",
			"0003_neon_auth_fresh_start",
			"0004_coaching_records",
		])
			await pg.exec(
				readFileSync(
					new URL(
						`../../../../packages/db/src/migrations/${file}.sql`,
						import.meta.url,
					),
					"utf8",
				),
			);
	});
	afterAll(() => pg.close());
	beforeEach(async () => {
		await pg.exec("TRUNCATE app_user CASCADE");
		vi.clearAllMocks();
		record = guidedRecord();
		mocks.db.mockReturnValue(db);
		mocks.access.mockResolvedValue({
			access: { allowed: true },
			courseAccess: { userId: "learner-a", canAccessPaid: false },
		});
		mocks.settings.mockReturnValue({
			model: "anthropic/claude-haiku-4.5",
			reservationMicros: 93_200,
			budgetMicros: 10_000_000,
		});
		mocks.price.mockResolvedValue(undefined);
		mocks.generate.mockImplementation(async (input) => ({
			feedback: exampleFeedback(input.snapshot, input.round === "revision"),
			inputTokens: 500,
			outputTokens: 100,
			costMicros: 1125,
		}));
		await db.insert(schema.appUser).values({ userId: record.userId });
		await db.insert(schema.lessonAttempt).values(record);
	});
	it("completes and resumes two rounds without touching the lesson assessment", async () => {
		const before = await db.select().from(schema.lessonAttempt);
		await save();
		const first = resultView(await review());
		expect(first.session?.initial?.reason).toBe(exampleReason);
		expect(first.session?.initial).not.toHaveProperty("criteria");
		await save(
			`${exampleReason} ALFA is at half its baseline, while BETA is at three times its baseline.`,
		);
		const final = resultView(await review("revision"));
		expect(final.session?.generations.map((g) => g.status)).toEqual([
			"succeeded",
			"succeeded",
		]);
		expect(final.session?.initial?.reason).toBe(exampleReason);
		expect(final.session?.revised?.reason).toContain("three times");
		expect(resultView(await read())).toEqual(final);
		expect(await db.select().from(schema.lessonAttempt)).toEqual(before);
		expect(mocks.generate).toHaveBeenCalledTimes(2);
	});
	it("reuses saved prose and rejects an extra competing rationale", async () => {
		await db.delete(schema.lessonAttempt);
		record = guidedRecord("audited-boundary");
		await db.insert(schema.lessonAttempt).values(record);
		expect(
			await updateCoachingImpl(
				await command({ type: "save", reason: exampleReason }),
			),
		).toEqual({ ok: false, reason: "invalid_action" });
		const first = resultView(await review());
		expect(first.session?.initial?.reason).toBe(
			attemptStateSchema.parse(record.state).answers.guided.question,
		);
	});
	it("keeps the first result and never calls twice on repeated requests", async () => {
		await save();
		const input = await command({ type: "review", round: "initial" });
		await updateCoachingImpl(input);
		await updateCoachingImpl(input);
		await review();
		expect(mocks.generate).toHaveBeenCalledTimes(1);
		expect(await db.select().from(schema.coachingGeneration)).toHaveLength(1);
	});
	it("serializes simultaneous starts and enforces a shared daily account quota", async () => {
		await save();
		const input = await command({ type: "review", round: "initial" });
		const outcomes = await Promise.all([
			updateCoachingImpl(input),
			updateCoachingImpl({ ...input, commandId: randomUUID() }),
		]);
		expect(outcomes.some((r) => r.ok)).toBe(true);
		expect(mocks.generate).toHaveBeenCalledTimes(1);
		record = guidedRecord("audited-boundary", randomUUID());
		await db.insert(schema.lessonAttempt).values(record);
		expect(await review()).toEqual({ ok: false, reason: "quota_exceeded" });
	});
	it("rejects a new session before a provider call when the global budget is exhausted", async () => {
		mocks.settings.mockReturnValue({
			model: "anthropic/claude-haiku-4.5",
			reservationMicros: 93_200,
			budgetMicros: 10,
		});
		await save();
		expect(await review()).toEqual({ ok: false, reason: "budget_exceeded" });
		expect(mocks.generate).not.toHaveBeenCalled();
	});
	it("completes a reserved revision across midnight and lowered admission budget", async () => {
		await save();
		await review();
		await pg.exec("UPDATE coaching_session SET quota_day = '2026-09-01'");
		mocks.settings.mockReturnValue({
			model: "anthropic/claude-haiku-4.5",
			reservationMicros: 93_200,
			budgetMicros: 1,
		});
		await save(`${exampleReason} I now compare baseline-normalized ratios.`);
		expect(
			resultView(await review("revision")).session?.generations[1].status,
		).toBe("succeeded");
	});
	it("rejects stale drafts, unchanged revisions and future independent cases", async () => {
		await save();
		const old = await command({ type: "save", reason: "Changed. ".repeat(10) });
		await save(`${exampleReason} First update.`);
		expect(await updateCoachingImpl(old)).toEqual({
			ok: false,
			reason: "conflict",
		});
		await review();
		expect(await review("revision")).toEqual({
			ok: false,
			reason: "incomplete",
		});
		const scenario = getLessonScenarios(record.lessonId)[0];
		const state = transitionAttempt(
			scenario,
			transitionAttempt(scenario, attemptStateSchema.parse(record.state), {
				type: "submit",
			}),
			{ type: "continue" },
		);
		await db.update(schema.lessonAttempt).set({ state, revision: 1 });
		record.revision = 1;
		expect(
			await updateCoachingImpl(
				await command({ type: "save", reason: exampleReason }),
			),
		).toEqual({ ok: false, reason: "invalid_action" });
		expect(mocks.generate).toHaveBeenCalledTimes(1);
	});
	it("isolates accounts and rechecks paid access", async () => {
		await save();
		await review();
		mocks.access.mockResolvedValue({
			access: { allowed: true },
			courseAccess: { userId: "learner-b" },
		});
		expect(await read()).toEqual({ ok: false, reason: "not_found" });
		mocks.access.mockResolvedValue({
			access: { allowed: false, reason: "billing-unavailable" },
			courseAccess: { userId: "learner-a" },
		});
		expect(await read()).toEqual({ ok: false, reason: "unavailable" });
		mocks.access.mockResolvedValue({
			access: { allowed: false, reason: "unpaid" },
			courseAccess: { userId: "learner-a" },
		});
		expect(await read()).toEqual({ ok: false, reason: "access_denied" });
		mocks.access.mockResolvedValue({
			access: { allowed: true },
			courseAccess: { userId: null },
		});
		expect(await read()).toEqual({ ok: false, reason: "signed_out" });
	});
	it("retains result retrieval and deletion when generation is switched off", async () => {
		await save();
		await review();
		mocks.settings.mockImplementation(() => {
			throw new CoachingError("disabled");
		});
		const view = resultView(await read());
		expect(view.available).toBe(false);
		expect(view.session?.generations[0].feedback).not.toBeNull();
		const deleted = resultView(
			await updateCoachingImpl(await command({ type: "delete" })),
		);
		expect(deleted.session?.initial).toBeNull();
		expect(deleted.session?.generations[0].feedback).toBeNull();
	});
	it("scrubs deletion without restoring the used quota", async () => {
		await save();
		await review();
		await updateCoachingImpl(await command({ type: "delete" }));
		expect(
			JSON.stringify(await db.select().from(schema.coachingSession)),
		).not.toContain(exampleReason);
		record = guidedRecord("audited-boundary", randomUUID());
		await db.insert(schema.lessonAttempt).values(record);
		expect(await review()).toEqual({ ok: false, reason: "quota_exceeded" });
	});
	it("does not resurrect text if deletion races a running generation", async () => {
		await save();
		let resolve!: (value: unknown) => void;
		mocks.generate.mockImplementation(
			(input) =>
				new Promise((r) => {
					resolve = () =>
						r({
							feedback: exampleFeedback(input.snapshot),
							inputTokens: 1,
							outputTokens: 1,
							costMicros: 10,
						});
				}),
		);
		const running = review();
		await vi.waitFor(() => expect(mocks.generate).toHaveBeenCalledTimes(1));
		await updateCoachingImpl(await command({ type: "delete" }));
		resolve(undefined);
		await running;
		expect(
			resultView(await read()).session?.generations[0].feedback,
		).toBeNull();
	});
	it("keeps unknown provider outcomes durable, without retries or private exception logs", async () => {
		await save();
		mocks.generate.mockRejectedValue(
			new Error(`PRIVATE_PROVIDER_BODY ${exampleReason}`),
		);
		const result = resultView(await review());
		expect(result.session?.generations[0].status).toBe("indeterminate");
		await review();
		expect(mocks.generate).toHaveBeenCalledTimes(1);
		expect(JSON.stringify(mocks.capture.mock.calls)).not.toContain(
			"PRIVATE_PROVIDER_BODY",
		);
		expect(
			JSON.stringify(await db.select().from(schema.coachingGeneration)),
		).not.toContain("PRIVATE_PROVIDER_BODY");
	});
	it("marks crashed leases indeterminate and keeps late feedback tied to its original work", async () => {
		await save();
		await review();
		await db
			.update(schema.coachingGeneration)
			.set({ status: "running", feedback: null, leaseExpiresAt: new Date(0) });
		expect(resultView(await read()).session?.generations[0].status).toBe(
			"indeterminate",
		);
		await db.update(schema.lessonAttempt).set({ revision: 2 });
		expect(resultView(await read()).session?.stale).toBe(true);
	});
	it("allows three entitled sessions and stops new calls after an access change", async () => {
		mocks.access.mockResolvedValue({
			access: { allowed: true },
			courseAccess: { userId: "learner-a", canAccessPaid: true },
		});
		for (const lesson of [
			"rank-symbols",
			"rank-contracts",
			"audited-boundary",
		]) {
			if (lesson !== "rank-symbols") {
				record = guidedRecord(lesson, randomUUID());
				await db.insert(schema.lessonAttempt).values(record);
			}
			if (lesson !== "audited-boundary") await save();
			expect((await review()).ok).toBe(true);
		}
		expect(mocks.generate).toHaveBeenCalledTimes(3);
		await db
			.update(schema.lessonAttempt)
			.set({ status: "retired" })
			.where(eq(schema.lessonAttempt.id, record.id));
		expect(
			await updateCoachingImpl(
				await command({ type: "review", round: "revision" }),
			),
		).toEqual({ ok: false, reason: "retired" });
	});
	it("purges old usage while preserving the reservation and learning text", async () => {
		await save();
		await review();
		await pg.exec(
			"UPDATE coaching_generation SET created_at = now() - interval '31 days'; UPDATE coaching_session SET quota_day = '2020-01-01'",
		);
		const moduleUrl = new URL(
			"../../../../packages/db/scripts/purge-coaching.mjs",
			import.meta.url,
		).href;
		const { coachingPurgeSql } = (await import(
			/* @vite-ignore */ moduleUrl
		)) as { coachingPurgeSql: string };
		await pg.exec(coachingPurgeSql);
		const [generation] = await db.select().from(schema.coachingGeneration);
		const [session] = await db.select().from(schema.coachingSession);
		expect(generation.costMicros).toBeNull();
		expect(generation.feedback).not.toBeNull();
		expect(session.reservedMicros).toBe(93_200);
		expect(session.quotaDay).toBeNull();
		await save(
			`${exampleReason} I added evidence after returning to this case.`,
		);
		expect(
			resultView(await review("revision")).session?.generations[1].status,
		).toBe("succeeded");
	});
	it("purges old deletion tombstones without changing the original lesson", async () => {
		await save();
		await review();
		await updateCoachingImpl(await command({ type: "delete" }));
		await pg.exec(
			"UPDATE coaching_session SET deleted_at = now() - interval '31 days', quota_day = '2020-01-01'; UPDATE coaching_generation SET created_at = now() - interval '31 days'",
		);
		const moduleUrl = new URL(
			"../../../../packages/db/scripts/purge-coaching.mjs",
			import.meta.url,
		).href;
		const { coachingPurgeSql } = (await import(
			/* @vite-ignore */ moduleUrl
		)) as { coachingPurgeSql: string };
		await pg.exec(coachingPurgeSql);
		expect(await db.select().from(schema.coachingSession)).toHaveLength(0);
		expect(await db.select().from(schema.coachingGeneration)).toHaveLength(0);
		expect(await db.select().from(schema.lessonAttempt)).toHaveLength(1);
	});
});
