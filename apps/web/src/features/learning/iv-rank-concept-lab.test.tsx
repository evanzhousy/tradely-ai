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
import { ivRankConceptData as data } from "@/content/units/iv-rank-concept.server";
import { surfaceConceptData } from "@/content/units/surface-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	inspectIvHistory,
	ivRankStatistics,
} from "@/domain/learning/iv-rank-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { IvRankConceptLab } from "./iv-rank-concept-lab";
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
const read = (selector: string) =>
	document.querySelector(selector)?.textContent;
const change = (name: string, value: string) =>
	fireEvent.change(screen.getByLabelText(name), { target: { value } });
const click = (name: string) =>
	fireEvent.click(screen.getByRole("button", { name }));
const tab = (name: RegExp) =>
	fireEvent.click(screen.getByRole("tab", { name }));
const lab = () => render(<IvRankConceptLab locale="en" data={data} />);

describe("IV rank and percentile SVG lesson", () => {
	it("separates range position from frequency and retains ties in the denominator", () => {
		const values = data.experiment.observations.map((o) => o.iv);
		expect(ivRankStatistics(values, 30)).toMatchObject({
			minimum: 10,
			maximum: 100,
			count: 5,
			below: 3,
			equal: 1,
			above: 1,
			percentile: 60,
		});
		expect(ivRankStatistics(values, 30)?.rank).toBeCloseTo(22.2222222222, 8);
		expect(ivRankStatistics(values, 20)).toMatchObject({
			below: 1,
			equal: 2,
			above: 2,
			percentile: 20,
		});
		expect(ivRankStatistics(values, 100)).toMatchObject({
			rank: 100,
			percentile: 80,
			equal: 1,
		});
	});
	it("changes rank with a high outlier while preserving membership counts", () => {
		const ranks = data.outlierFrames.map((high) =>
			ivRankStatistics([10, 20, 20, 30, high], 30),
		);
		for (const value of ranks)
			expect(value).toMatchObject({
				below: 3,
				equal: 1,
				above: 1,
				percentile: 60,
			});
		expect(ranks[0]?.rank).toBeCloseTo(66.6666666667, 8);
		expect(ranks[4]?.rank).toBeCloseTo(18.1818181818, 8);
		for (let i = 1; i < ranks.length; i++)
			expect(ranks[i]?.rank).toBeLessThan(ranks[i - 1]?.rank as number);
	});
	it("keeps percentile defined on a zero range and rejects missing values instead of dropping them", () => {
		expect(ivRankStatistics([20, 20, 20], 30)).toMatchObject({
			rank: null,
			percentile: 100,
		});
		expect(ivRankStatistics([20, 20, 20], 20)).toMatchObject({
			rank: null,
			percentile: 0,
			equal: 3,
		});
		expect(ivRankStatistics([0, 0], 0)).toMatchObject({
			rank: null,
			percentile: 0,
		});
		for (const values of [
			[],
			[10, null, 20],
			[Number.NaN, 20],
			[-1, 20],
			[Number.POSITIVE_INFINITY, 20],
		])
			expect(ivRankStatistics(values, 20)).toBeNull();
		expect(ivRankStatistics([10, 20], null)).toBeNull();
	});
	it("checks reference, earlier window, declared count and distinct observation dates", () => {
		expect(inspectIvHistory(data.samples[0]).statistics?.percentile).toBe(60);
		expect(inspectIvHistory(data.samples[1]).statistics?.rank).toBe(12.5);
		for (const [id, issue] of [
			["missing", "values"],
			["reference", "reference"],
			["coverage", "coverage"],
			["current-in-history", "window"],
		])
			expect(
				inspectIvHistory(
					data.samples.find((s) => s.id === id) as (typeof data.samples)[0],
				),
			).toMatchObject({ issue, statistics: null });
		const base = data.samples[0];
		expect(
			inspectIvHistory({
				...base,
				history: { ...base.history, expectedCount: 6 },
			}).issue,
		).toBe("coverage");
		expect(
			inspectIvHistory({
				...base,
				history: {
					...base.history,
					observations: base.history.observations.map((o, i) =>
						i === 1 ? base.history.observations[0] : o,
					),
				},
			}).issue,
		).toBe("coverage");
		expect(
			inspectIvHistory({
				...base,
				current: { ...base.current, date: "2030-02-30" },
			}).issue,
		).toBe("window");
	});
	it("links the native current-IV controls and exposes tie changes", () => {
		lab();
		expect(read("[data-ivr-rank]")).toBe("22.22%");
		expect(read("[data-ivr-percentile]")).toBe("60%");
		change("Drag current IV", "20");
		expect(read("[data-ivr-rank]")).toBe("11.11%");
		expect(read("[data-ivr-percentile]")).toBe("20%");
		expect(read("[data-ivr-counts]")).toContain("1 / 2 / 2");
		expect(
			(screen.getByLabelText("Hypothetical current IV") as HTMLInputElement)
				.value,
		).toBe("20");
		change("Hypothetical current IV", "100");
		expect(read("[data-ivr-rank]")).toBe("100%");
		expect(read("[data-ivr-percentile]")).toBe("80%");
		click("Reset scene");
		expect(read("[data-ivr-percentile]")).toBe("60%");
	});
	it("plays the controlled outlier sequence and stops on direct input", () => {
		vi.useFakeTimers();
		lab();
		tab(/Change one extreme/);
		expect(read("[data-ivr-outlier-rank]")).toBe("66.67%");
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-ivr-outlier-rank]")).toBe("40%");
		expect(read("[data-ivr-outlier-percentile]")).toBe("60%");
		fireEvent.pointerDown(screen.getByLabelText("Drag historical high"));
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-ivr-outlier-rank]")).toBe("40%");
		change("Drag historical high", "100");
		expect(read("[data-ivr-outlier-rank]")).toBe("22.22%");
		expect(read("[data-ivr-outlier-percentile]")).toBe("60%");
		click("Reset scene");
		expect(read("[data-ivr-outlier-rank]")).toBe("66.67%");
	});
	it("preserves a valid percentile when flat histories make rank undefined", () => {
		lab();
		tab(/Audit the sample/);
		change("History sample", "flat");
		expect(read("[data-ivr-sample-rank]")).toBe("—");
		expect(read("[data-ivr-sample-percentile]")).toBe("100%");
		expect(read("[data-ivr-sample-status]")).toContain("Zero historical range");
		change("History sample", "flat-tie");
		expect(read("[data-ivr-sample-percentile]")).toBe("0%");
		change("History sample", "short");
		expect(read("[data-ivr-sample-rank]")).toBe("12.5%");
		expect(read("[data-ivr-sample-percentile]")).toBe("33.33%");
	});
	it("withholds unsupported sample statistics and restores them on reset", () => {
		lab();
		tab(/Audit the sample/);
		for (const id of [
			"missing",
			"reference",
			"coverage",
			"current-in-history",
		]) {
			change("History sample", id);
			expect(read("[data-ivr-sample-rank]")).toBe("—");
			expect(read("[data-ivr-sample-percentile]")).toBe("—");
		}
		click("Reset scene");
		expect(read("[data-ivr-sample-rank]")).toBe("22.22%");
	});
	it("supports Chinese and rejects missing or mismatched teaching data", () => {
		const page = render(<IvRankConceptLab locale="zh" data={data} />);
		change("假设当前 IV", "20");
		expect(read("[data-ivr-percentile]")).toBe("20%");
		page.rerender(<IvRankConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
		page.rerender(<IvRankConceptLab locale="en" data={surfaceConceptData} />);
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
	});
	it("preserves version 2 grading and the authorized Learn boundary", () => {
		const scenario = getLessonScenarios("iv-rank-percentile")[0];
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
		const view = projectAttempt(scenario, state, "rank-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		change("Hypothetical current IV", "20");
		expect(onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
		let nextState = transitionAttempt(scenario, state, { type: "continue" });
		const next = projectAttempt(scenario, nextState, "rank-test", 1);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		for (const [questionId, value] of [
			["rank", "25"],
			["percentile", "40"],
		])
			nextState = transitionAttempt(scenario, nextState, {
				type: "respond",
				questionId,
				value,
			});
		nextState = transitionAttempt(scenario, nextState, { type: "submit" });
		expect(
			projectAttempt(scenario, nextState, "rank-test", 2).feedback.map(
				(f) => f.met,
			),
		).toEqual([true, true]);
		expect(
			previewLearningImpl({
				lessonId: "iv-rank-percentile",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
