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
import { rankSymbolConceptData as data } from "@/content/units/rank-symbol-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	rankActivity,
	rankSigned,
} from "@/domain/learning/rank-symbol-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { RankSymbolConceptLab } from "./rank-symbol-concept-lab";

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
});
const read = (s: string) => document.querySelector(s)?.textContent;
const change = (name: string, value: string) =>
	fireEvent.change(screen.getByLabelText(name), { target: { value } });
const tab = (name: RegExp) =>
	fireEvent.click(screen.getByRole("tab", { name }));
const click = (name: string) =>
	fireEvent.click(screen.getByRole("button", { name }));
const lab = () => render(<RankSymbolConceptLab locale="en" data={data} />);
describe("symbol ranking SVG lesson", () => {
	it("distinguishes signed and absolute order while retaining original sign", () => {
		expect(
			rankSigned(data.signedFrames[0], false).map((r) => r.symbol),
		).toEqual(["A", "C", "B"]);
		const absolute = rankSigned(data.signedFrames[0], true);
		expect(absolute.map((r) => r.symbol)).toEqual(["B", "A", "C"]);
		expect(absolute[0]).toMatchObject({ value: -100, score: 100 });
	});
	it("preserves tied ranks and changes rank without changing the focal value", () => {
		expect(
			rankSigned(
				[
					{ symbol: "B", value: 10 },
					{ symbol: "A", value: 10 },
					{ symbol: "C", value: 2 },
				],
				false,
			).map((r) => [r.symbol, r.rank]),
		).toEqual([
			["A", 1],
			["B", 1],
			["C", 3],
		]);
		expect(
			data.signedFrames.map(
				(rows) => rankSigned(rows, false).find((r) => r.symbol === "A")?.value,
			),
		).toEqual([60, 60, 60]);
		expect(
			data.signedFrames.map(
				(rows) => rankSigned(rows, false).find((r) => r.symbol === "A")?.rank,
			),
		).toEqual([1, 2, 1]);
	});
	it("separates raw and relative metrics and discloses missing or incomparable baselines", () => {
		expect(rankActivity(data.activity, false, 100).ranked[0].symbol).toBe("A");
		const relative = rankActivity(data.activity, true, 100);
		expect(relative.ranked.map((r) => r.symbol)).toEqual(["B", "A"]);
		expect(relative.excluded.map((d) => [d.row.symbol, d.reason])).toEqual([
			["C", "floor"],
			["D", "baseline"],
			["E", "coverage"],
			["F", "baseline"],
		]);
		expect(rankActivity(data.activity, true, 0).ranked[0]).toMatchObject({
			symbol: "C",
			value: 50,
		});
	});
	it("withholds invalid values instead of treating them as zero", () => {
		const base = data.activity[0];
		for (const volume of [null, Number.NaN, -1])
			expect(rankActivity([{ ...base, volume }], false, 0).ranked).toHaveLength(
				0,
			);
		for (const baseline of [null, 0, -1, Number.POSITIVE_INFINITY])
			expect(
				rankActivity([{ ...base, baseline }], true, 0).ranked,
			).toHaveLength(0);
		expect(
			rankActivity([{ ...base, volume: 0 }], false, 0).ranked[0].value,
		).toBe(0);
	});
	it("reorders native SVG rows and keeps the selected source sign visible", () => {
		lab();
		expect(read("[data-rank-focal]")).toBe("Rank: 1");
		change("Signed metric ordering", "magnitude");
		expect(read("[data-rank-focal]")).toBe("Rank: 2");
		click("Inspect symbol B");
		expect(read("[data-rank-selected]")).toContain("-100");
		change("Peer snapshot", "1");
		expect(read("[data-rank-focal]")).toBe("Rank: 3");
		click("Reset scene");
		expect(read("[data-rank-focal]")).toBe("Rank: 1");
	});
	it("plays only peer changes and stops on snapshot selection", () => {
		vi.useFakeTimers();
		lab();
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-rank-focal]")).toBe("Rank: 2");
		expect(read("[data-rank-selected]")).toContain("+60");
		change("Peer snapshot", "0");
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-rank-focal]")).toBe("Rank: 1");
		expect(
			screen.getByRole("button", { name: "Play explanation" }),
		).toBeTruthy();
	});
	it("exposes small-baseline extremes and exclusions when the volume floor changes", () => {
		lab();
		tab(/Choose the activity metric/);
		expect(read("[data-rank-activity-leader]")).toContain("B");
		change("Activity metric", "raw");
		expect(read("[data-rank-activity-leader]")).toContain("A");
		change("Activity metric", "relative");
		change("Declared volume floor", "0");
		expect(read("[data-rank-activity-leader]")).toContain("C");
		change("Inspect source row", "F");
		expect(read("[data-rank-activity-detail]")).toContain(
			"Missing or incomparable baseline",
		);
		change("Inspect source row", "E");
		expect(read("[data-rank-activity-detail]")).toContain(
			"Incomplete session observation",
		);
	});
	it("keeps candidate B while separating peer baseline and coverage revisions", () => {
		lab();
		tab(/Carry the candidate forward/);
		expect(read("[data-rank-handoff-exclusions]")).toContain(
			"D: Missing or incomparable baseline",
		);
		expect(read("[data-rank-handoff-rank]")).toBe("1");
		change("Handoff evidence snapshot", "peer");
		expect(read("[data-rank-handoff-rank]")).toBe("2");
		expect(read("[data-rank-handoff-value]")).toContain("3×");
		change("Handoff evidence snapshot", "baseline");
		expect(read("[data-rank-handoff-value]")).toContain("0.3×");
		change("Handoff evidence snapshot", "coverage");
		expect(read("[data-rank-handoff-rank]")).toBe("—");
		expect(read("[data-rank-handoff-value]")).toContain("—");
		fireEvent.click(screen.getByRole("button", { name: /Revision trigger/ }));
		expect(screen.getByText(/Revisit priority if peers change/)).toBeTruthy();
		click("Reset scene");
		expect(read("[data-rank-handoff-rank]")).toBe("1");
	});
	it("supports Chinese and guards unavailable data", () => {
		const page = render(<RankSymbolConceptLab locale="zh" data={data} />);
		change("有符号指标排序", "magnitude");
		expect(read("[data-rank-focal]")).toBe("名次: 2");
		page.rerender(<RankSymbolConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
	});
	it("preserves version 2 grading and anonymous free-preview access", () => {
		const scenario = getLessonScenarios("rank-symbols")[0];
		let state = initialAttemptState();
		const props = {
			locale: "en" as const,
			busy: false,
			error: null,
			onOpen: vi.fn(),
			onRecover: vi.fn(),
			onAction: vi.fn(),
		};
		const view = projectAttempt(scenario, state, "rank-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		change("Signed metric ordering", "magnitude");
		expect(props.onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(props.onAction).toHaveBeenCalledExactlyOnceWith({
			type: "continue",
		});
		state = transitionAttempt(scenario, state, { type: "continue" });
		const next = projectAttempt(scenario, state, "rank-test", 1);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		state = transitionAttempt(scenario, state, {
			type: "respond",
			questionId: "ratio-a",
			value: "0.5",
		});
		state = transitionAttempt(scenario, state, {
			type: "answer",
			questionId: "leader",
			choiceId: "b",
		});
		state = transitionAttempt(scenario, state, { type: "submit" });
		expect(
			projectAttempt(scenario, state, "rank-test", 2).feedback.map(
				(f) => f.met,
			),
		).toEqual([true, true]);
		expect(
			previewLearningImpl({
				lessonId: "rank-symbols",
				variant: 0,
				actions: [],
			}),
		).toMatchObject({
			ok: true,
			view: { attemptId: "preview", step: { conceptData: data } },
		});
	});
});
