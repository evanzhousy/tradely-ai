// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
	type AssessmentRecord,
	summarizeLearningEvidence,
} from "@/domain/learning-progress";
import {
	LearningProgressCounts,
	LessonLearningStatus,
} from "./learning-progress";

const record: AssessmentRecord = {
	lessonId: "one",
	attemptId: "a",
	scenarioId: "case",
	scenarioVersion: 4,
	submittedAt: "2026-09-14T10:00:00Z",
	result: {
		status: "practiced",
		met: 1,
		total: 2,
		usedHint: true,
		unreviewed: 1,
	},
};
afterEach(cleanup);
describe("learner result labels", () => {
	it("explains hints and unreviewed writing without showing a pass badge", () => {
		render(
			<LessonLearningStatus
				locale="en"
				evidence={{ latest: record, earlier: null }}
			/>,
		);
		expect(screen.getByText("Practice submitted")).toBeTruthy();
		expect(screen.getByText("Hint used")).toBeTruthy();
		expect(screen.getByText("Written work needs review")).toBeTruthy();
		expect(screen.queryByText("Independent checks passed")).toBeNull();
	});
	it("keeps earlier-version results distinct in Chinese", () => {
		render(
			<LessonLearningStatus
				locale="zh"
				evidence={{ latest: null, earlier: record }}
			/>,
		);
		expect(screen.getByText("旧版结果已保留")).toBeTruthy();
		expect(screen.queryByText("独立检查通过")).toBeNull();
	});
	it("reports an empty practice record separately from study marks", () => {
		render(
			<LearningProgressCounts
				locale="en"
				summary={summarizeLearningEvidence(["one"], [], [])}
			/>,
		);
		expect(screen.getByText("0 lessons with practice submitted")).toBeTruthy();
		expect(screen.getByText(/Study marks are separate/)).toBeTruthy();
	});
});
