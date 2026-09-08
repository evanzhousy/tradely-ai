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
import { tradingFlowCourse } from "@/content/course";
import { referenceAction } from "@/domain/learning/test-helpers";

const dependencies = vi.hoisted(() => ({
	db: vi.fn(),
	userId: null as string | null,
}));
vi.mock("@tanstack/react-start/server-only", () => ({}));
vi.mock("@tradely/db", async () => ({
	...(await import("@tradely/db/schema/index")),
	createDb: dependencies.db,
}));
vi.mock("./auth.server", () => ({
	getCurrentUserId: async () => dependencies.userId,
}));
vi.mock("./billing.server", () => ({
	getStripeBillingState: async () => "inactive",
}));
vi.mock("./media.server", () => ({ createLessonMedia: async () => null }));
vi.mock("./analytics/posthog.server", () => ({
	captureServerException: vi.fn(),
	captureServerRouteTiming: vi.fn(),
}));

import * as schema from "@tradely/db/schema/index";
import { getLessonScenarios } from "@/content/scenarios/index.server";
import type {
	LearningAction,
	LearningResponse,
	LearningView,
} from "@/domain/learning/types";
import { openLearningImpl, updateLearningImpl } from "./learning.server";
import { getLessonPageDataImpl } from "./lesson.server";
import {
	getCourseProgressImpl,
	saveLessonProgressImpl,
} from "./progress.server";

/** Real access, lesson, attempt and progress services; identity/billing/media are test boundaries. */
describe("integrated course persistence journey", () => {
	const pg = new PGlite();
	const db = drizzle(pg, { schema });
	beforeAll(async () => {
		for (const name of [
			"0000_salty_randall.sql",
			"0001_low_clea.sql",
			"0002_learning_attempts.sql",
			"0003_neon_auth_fresh_start.sql",
		])
			await pg.exec(
				readFileSync(
					new URL(
						`../../../../packages/db/src/migrations/${name}`,
						import.meta.url,
					),
					"utf8",
				),
			);
	});
	afterAll(() => pg.close());
	beforeEach(async () => {
		dependencies.userId = null;
		dependencies.db.mockReturnValue(db);
		await pg.exec("TRUNCATE lesson_attempt, lesson_progress, app_user CASCADE");
		await db.insert(schema.appUser).values({
			userId: "journey-learner",
			coursePassGrantedAt: new Date(),
		});
	});
	const viewOf = (response: LearningResponse) => {
		expect(response.ok).toBe(true);
		if (!response.ok) throw new Error(response.reason);
		return response.view;
	};
	const update = async (view: LearningView, action: LearningAction) =>
		viewOf(
			await updateLearningImpl({
				lessonId: view.lessonId,
				attemptId: view.attemptId,
				revision: view.revision,
				commandId: randomUUID(),
				action,
			}),
		);

	it.each(
		tradingFlowCourse.lessons
			.filter((lesson) => lesson.access === "paid")
			.map((lesson) => lesson.id),
	)(
		"checks access, resumes evidence and answers, and preserves completion for %s",
		async (lessonId) => {
			const open = async () => openLearningImpl({ lessonId, restart: false });
			const denied = await getLessonPageDataImpl({ slug: lessonId });
			expect(denied).toMatchObject({
				found: true,
				body: null,
				learning: null,
				access: { allowed: false, reason: "signed-out" },
			});
			expect(await open()).toEqual({ ok: false, reason: "signed_out" });
			dependencies.userId = "journey-learner";
			const allowed = await getLessonPageDataImpl({ slug: lessonId });
			expect(allowed).toMatchObject({
				found: true,
				access: { allowed: true, reason: "course-pass" },
				learning: { presentation: "primary" },
			});
			await saveLessonProgressImpl({ lessonId, lastPositionSeconds: 123 });
			let view = viewOf(await open());
			const attemptId = view.attemptId;
			const scenario = getLessonScenarios(lessonId)[0];
			for (const step of scenario.steps) {
				for (const evidenceId of step.requiredEvidence)
					view = await update(view, { type: "inspect", evidenceId });
				for (const question of step.questions)
					view = await update(view, referenceAction(question));
				// A new request after leaving or refreshing must restore the stored projection.
				expect(viewOf(await open())).toEqual(view);
				view = await update(view, { type: "submit" });
				if (view.phase !== "complete")
					view = await update(view, { type: "continue" });
			}
			expect(view.result?.status).toBe(
				view.result?.unreviewed ? "practiced" : "demonstrated",
			);
			expect(viewOf(await open())).toEqual(view);
			expect((await getCourseProgressImpl()).completed).toBe(0);
			expect(
				await saveLessonProgressImpl({ lessonId, complete: true }),
			).toMatchObject({ saved: true });
			const progress = await getCourseProgressImpl();
			expect(progress.completed).toBe(1);
			expect(progress.records[0]).toMatchObject({
				lessonId,
				lastPositionSeconds: 123,
			});
			expect(progress.records[0].completedAt).toBeTruthy();
			expect(viewOf(await open()).attemptId).toBe(attemptId);
			dependencies.userId = "another-learner";
			expect(await open()).toEqual({ ok: false, reason: "access_denied" });
			expect((await getCourseProgressImpl()).records).toEqual([]);
			dependencies.userId = null;
			expect(await open()).toEqual({ ok: false, reason: "signed_out" });
			dependencies.userId = "journey-learner";
			expect(viewOf(await open()).result).toEqual(view.result);
			expect((await getCourseProgressImpl()).completed).toBe(1);
		},
	);
});
