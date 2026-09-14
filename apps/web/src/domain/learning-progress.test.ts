import { describe, expect, it } from "vitest";
import {
	type AssessmentRecord,
	independentChecksPassed,
	summarizeLearningEvidence,
} from "./learning-progress";

const current = [
	{ lessonId: "one", id: "case-one", version: 4 },
	{ lessonId: "two", id: "case-two", version: 2 },
];
const pass: AssessmentRecord = {
	lessonId: "one",
	attemptId: "a",
	scenarioId: "case-one",
	scenarioVersion: 4,
	submittedAt: "2026-09-14T10:00:00.000Z",
	result: { status: "demonstrated", met: 3, total: 3, usedHint: false },
};
describe("learning evidence separate from study marks", () => {
	it("does not infer exercise results from lesson presence or missing attempts", () => {
		expect(
			summarizeLearningEvidence(["one", "two"], current, []),
		).toMatchObject({ submitted: 0, passed: 0, reviewNeeded: 0, earlier: 0 });
	});
	it("counts each lesson once using its latest submission, independent of input order", () => {
		const newer = {
			...pass,
			attemptId: "b",
			submittedAt: "2026-09-14T11:00:00.000Z",
			result: { ...pass.result, status: "practiced" as const, met: 2 },
		};
		for (const records of [
			[pass, newer],
			[newer, pass],
		]) {
			const summary = summarizeLearningEvidence(
				["one", "two"],
				current,
				records,
			);
			expect(summary).toMatchObject({ submitted: 1, passed: 0 });
			expect(summary.lessons.one.latest?.attemptId).toBe("b");
		}
	});
	it("retains old-version work without claiming the current checks passed", () => {
		const summary = summarizeLearningEvidence(["one"], current, [
			{ ...pass, scenarioVersion: 3 },
		]);
		expect(summary).toMatchObject({ submitted: 0, passed: 0, earlier: 1 });
		expect(summary.lessons.one.latest).toBeNull();
		expect(summary.lessons.one.earlier?.scenarioVersion).toBe(3);
	});
	it("keeps current and earlier results visible together and excludes other lessons", () => {
		const summary = summarizeLearningEvidence(["one"], current, [
			pass,
			{ ...pass, scenarioVersion: 3 },
			{ ...pass, lessonId: "removed" },
		]);
		expect(summary).toMatchObject({ submitted: 1, passed: 1, earlier: 1 });
		expect(Object.keys(summary.lessons)).toEqual(["one"]);
	});
	it("does not promote hints, unreviewed prose or partial checks to an independent pass", () => {
		for (const result of [
			{ ...pass.result, usedHint: true },
			{ ...pass.result, unreviewed: 1 },
			{ ...pass.result, met: 2 },
		])
			expect(independentChecksPassed(result)).toBe(false);
		const summary = summarizeLearningEvidence(["one"], current, [
			{
				...pass,
				result: {
					status: "practiced",
					met: 2,
					total: 3,
					usedHint: false,
					unreviewed: 1,
				},
			},
		]);
		expect(summary).toMatchObject({ submitted: 1, passed: 0, reviewNeeded: 1 });
	});
});
