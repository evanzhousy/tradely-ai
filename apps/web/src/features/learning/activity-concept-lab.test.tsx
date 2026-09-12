// @vitest-environment jsdom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start/server-only", () => ({}));

import { getLessonScenarios } from "@/content/scenarios/index.server";
import { activityConceptData as data } from "@/content/units/activity-concept.server";
import { tapeConceptData } from "@/content/units/tape-concept.server";
import {
	activityRatio,
	compareActivityWindow,
	summarizeActivity,
} from "@/domain/learning/activity-concept";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { ActivityConceptLab } from "./activity-concept-lab";
import { LearningScreen } from "./learning-screen";

beforeEach(() =>
	vi.stubGlobal("matchMedia", () => ({
		matches: true,
		addEventListener() {},
		removeEventListener() {},
	})),
);
afterEach(() => {
	cleanup();
	vi.useRealTimers();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});
const read = (s: string) => document.querySelector(s)?.textContent;
const change = (name: string, value: string) =>
	fireEvent.change(screen.getByLabelText(name), { target: { value } });
const click = (name: string) =>
	fireEvent.click(screen.getByRole("button", { name }));
const lab = () => render(<ActivityConceptLab locale="en" data={data} />);
describe("unusual activity SVG lesson", () => {
	it("distinguishes valid zero activity from missing or invalid denominators", () => {
		expect(activityRatio(200, 100)).toBe(2);
		expect(activityRatio(200, 1000)).toBe(0.2);
		expect(activityRatio(10, 1)).toBe(10);
		expect(activityRatio(0, 100)).toBe(0);
		for (const d of [null, 0, -1, Number.NaN, Number.POSITIVE_INFINITY])
			expect(activityRatio(200, d)).toBeNull();
		expect(activityRatio(null, 100)).toBeNull();
	});
	it("requires matching windows, population and coverage", () => {
		expect(data.windows.map((w) => compareActivityWindow(w))).toEqual([
			{ ratio: 2, issue: null },
			{ ratio: null, issue: "window" },
			{ ratio: 2, issue: null },
			{ ratio: null, issue: "coverage" },
			{ ratio: null, issue: "scope" },
			{ ratio: null, issue: "values" },
		]);
	});
	it("separates equal-row means, pooled ratios and selected populations", () => {
		const relative = summarizeActivity(data.samples, "relative", 2, false);
		expect(relative.mean).toBe(1.5);
		expect(relative.pooled).toBeCloseTo(210 / 110);
		expect(relative.rows.map((r) => r.passes)).toEqual([true, false]);
		const turnover = summarizeActivity(data.samples, "turnover", 2, false);
		expect(turnover.mean).toBe(5.1);
		expect(turnover.pooled).toBeCloseTo(210 / 1001);
		expect(turnover.rows.map((r) => r.passes)).toEqual([false, true]);
		expect(summarizeActivity(data.samples, "turnover", 2, true)).toMatchObject({
			mean: 10,
			pooled: 10,
			selectedCount: 1,
		});
	});
	it("does not manufacture a summary for empty or incomplete selected data", () => {
		expect(summarizeActivity(data.samples, "relative", 5, true)).toMatchObject({
			mean: null,
			pooled: null,
			selectedCount: 0,
		});
		expect(
			summarizeActivity(
				[{ ...data.samples[0], typical: null }, data.samples[1]],
				"relative",
				2,
				false,
			),
		).toMatchObject({ mean: null, pooled: null });
	});
	it("links the SVG denominator to ratio controls while keeping volume fixed", () => {
		lab();
		expect(read("[data-activity-ratio]")).toBe("2×");
		click("Volume / OI");
		expect(read("[data-activity-ratio]")).toBe("0.2×");
		change("Compare a record", "B");
		expect(read("[data-activity-ratio]")).toBe("10×");
		change("Drag the denominator", "0");
		expect(read("[data-activity-ratio]")).toBe("Unavailable");
		expect(read("[data-activity-volume]")).toBe("10");
		click("Missing");
		expect(screen.queryByLabelText("Drag the denominator")).toBeNull();
		click("Reset scene");
		expect(read("[data-activity-ratio]")).toBe("2×");
	});
	it("plays comparison cases and stops when the source window is edited", () => {
		vi.useFakeTimers();
		lab();
		fireEvent.click(screen.getByRole("tab", { name: /Match the window/ }));
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-window-ratio]")).toBe("Unavailable");
		change("Window evidence", "2");
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-window-ratio]")).toBe("2×");
		expect(
			screen.getByRole("button", { name: "Play explanation" }),
		).toBeTruthy();
		change("Window evidence", "3");
		expect(read("[data-window-ratio]")).toBe("Unavailable");
	});
	it("makes screening and the choice of metric affect the explicit summary population", () => {
		lab();
		fireEvent.click(screen.getByRole("tab", { name: /Inspect the screen/ }));
		expect(read("[data-screen-mean]")).toBe("1.5×");
		expect(read("[data-screen-pooled]")).toBe("1.9091×");
		click("Screened only");
		expect(read("[data-screen-mean]")).toBe("2×");
		change("Declared screening threshold", "3");
		expect(read("[data-screen-pooled]")).toBe("—");
		click("Volume / OI");
		expect(read("[data-screen-pooled]")).toBe("10×");
		expect(
			document
				.querySelector('[data-screen-row="A"]')
				?.getAttribute("data-screen-included"),
		).toBe("false");
		click("All rows");
		expect(read("[data-screen-pooled]")).toBe("0.2098×");
	});
	it("supports Chinese controls and reset", () => {
		render(<ActivityConceptLab locale="zh" data={data} />);
		change("拖动分母", "1");
		expect(read("[data-activity-ratio]")).toBe("200×");
		click("重置场景");
		expect(read("[data-activity-ratio]")).toBe("2×");
	});
	it("rejects absent or mismatched authorized data", () => {
		const page = render(<ActivityConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
		page.rerender(<ActivityConceptLab locale="en" data={tapeConceptData} />);
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
	});
	it("preserves version 2 assessment and the paid lesson boundary", () => {
		const scenario = getLessonScenarios("unusual-activity")[0];
		const state = initialAttemptState();
		const onAction = vi.fn();
		const props = {
			locale: "en" as const,
			busy: false,
			error: null,
			onOpen: vi.fn(),
			onRecover: vi.fn(),
			onAction,
		};
		const view = projectAttempt(scenario, state, "activity-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		click("Volume / OI");
		expect(onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
		const next = projectAttempt(
			scenario,
			transitionAttempt(scenario, state, { type: "continue" }),
			"activity-test",
			1,
		);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		expect(
			scenario.steps[1].questions.map((q) => ({
				id: q.id,
				accepted: q.accepted,
			})),
		).toEqual([
			{ id: "relative", accepted: ["3"] },
			{ id: "turnover", accepted: ["0.5"] },
		]);
		expect(
			scenario.steps.slice(1).every((s) => !s.conceptLab && !s.conceptData),
		).toBe(true);
		expect(
			previewLearningImpl({
				lessonId: "unusual-activity",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
