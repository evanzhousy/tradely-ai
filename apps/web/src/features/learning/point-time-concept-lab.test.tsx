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
import { pointTimeConceptData as data } from "@/content/units/point-time-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	describeScore,
	evaluationMatches,
	knownContractSum,
	knownRecords,
	recencyWeight,
} from "@/domain/learning/point-time-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { PointTimeConceptLab } from "./point-time-concept-lab";

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
const lab = () => render(<PointTimeConceptLab locale="en" data={data} />);
describe("point-in-time research SVG lesson", () => {
	it("uses availability as well as event time and replaces superseded versions", () => {
		expect(knownRecords(data.records, 120).map((r) => r.id)).toEqual(["early"]);
		expect(knownContractSum(knownRecords(data.records, 120))).toBe(40);
		expect(knownRecords(data.records, 240).map((r) => r.id)).toEqual([
			"early",
			"late",
		]);
		expect(knownContractSum(knownRecords(data.records, 240))).toBe(140);
		expect(knownRecords(data.records, 300).map((r) => r.id)).toEqual([
			"early",
			"correction",
		]);
		expect(knownContractSum(knownRecords(data.records, 300))).toBe(110);
		const outOfOrder = data.records.map((r) =>
			r.id === "late"
				? { ...r, receivedSeconds: 300 }
				: r.id === "correction"
					? { ...r, receivedSeconds: 250 }
					: r,
		);
		expect(knownRecords(outOfOrder, 300).map((r) => r.id)).toEqual([
			"early",
			"correction",
		]);
	});
	it("does not revive an older quantity when the latest available correction has an unknown amount", () => {
		const rows = data.records.map((r) =>
			r.id === "correction" ? { ...r, contracts: null } : r,
		);
		const active = knownRecords(rows, 300);
		expect(active.map((r) => r.id)).toEqual(["early", "correction"]);
		expect(knownContractSum(active)).toBeNull();
		expect(knownRecords(data.records, Number.NaN)).toEqual([]);
		expect(
			knownRecords([{ ...data.records[0], receivedSeconds: 10 }], 300),
		).toEqual([]);
	});
	it("applies a positive half-life without deleting raw events", () => {
		expect([0, 60, 120, 180].map((t) => recencyWeight(80, t, 60))).toEqual([
			80, 40, 20, 10,
		]);
		expect(recencyWeight(80, 60, 30)).toBe(20);
		expect(recencyWeight(80, 60, 120)).toBeCloseTo(56.568542, 5);
		for (const h of [null, 0, -1, Number.POSITIVE_INFINITY])
			expect(recencyWeight(80, 60, h)).toBeNull();
		expect(recencyWeight(80, -1, 60)).toBeNull();
	});
	it("keeps descriptive scores separate and respects the declared baseline protocol", () => {
		expect(describeScore(data.reports[0])).toEqual({
			reason: null,
			percentile: 90,
			z: 2,
		});
		expect(describeScore(data.reports[1]).reason).toBe("baseline");
		expect(describeScore(data.reports[2]).reason).toBe("coverage");
		expect(describeScore(data.reports[3]).reason).toBe("sample-policy");
		expect(describeScore(data.reports[4])).toEqual({
			reason: null,
			percentile: 100,
			z: null,
		});
	});
	it("counts toy outcome matches without interpreting them as probabilities", () => {
		expect(evaluationMatches(data.evaluation.heldout, 80)).toBe(1);
		expect(evaluationMatches(data.evaluation.heldout, 70)).toBe(2);
		expect(evaluationMatches(data.evaluation.development, 80)).toBe(4);
		expect(evaluationMatches([], 80)).toBeNull();
	});
	it("makes the availability cutoff and superseded versions inspectable", () => {
		lab();
		expect(read("[data-pit-total]")).toContain("40");
		expect(read("[data-pit-status]")).toContain("Not yet available");
		change("Decision cutoff seconds after 09:58", "240");
		expect(read("[data-pit-total]")).toContain("140");
		change("Decision cutoff seconds after 09:58", "300");
		expect(
			document.querySelector("svg line[stroke-dasharray]")?.getAttribute("x1"),
		).toBe("325");
		expect(read("[data-pit-total]")).toContain("110");
		expect(read("[data-pit-status]")).toContain("Superseded");
		change("Inspect source revision", "unknown");
		expect(read("[data-pit-status]")).toContain("Availability not established");
		click("Reset scene");
		expect(read("[data-pit-total]")).toBe("Active known subtotal: 40");
	});
	it("plays decay and stops when the half-life is changed", () => {
		vi.useFakeTimers();
		lab();
		tab(/Let weight decay/);
		const raw = read("[data-pit-raw]");
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-pit-weight]")).toBe("40");
		change("Half-life", "30");
		expect(document.querySelector("svg circle")?.getAttribute("cy")).toBe(
			"242.5",
		);
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-pit-weight]")).toBe("20");
		expect(read("[data-pit-raw]")).toBe(raw);
		change("Half-life", "missing");
		expect(read("[data-pit-weight]")).toBe("—");
	});
	it("uses native score cards and preserves a valid percentile when z is undefined", () => {
		lab();
		tab(/Read score meaning/);
		fireEvent.click(
			screen.getByRole("button", { name: /Outcome probability/ }),
		);
		expect(screen.getByText(/An outcome probability requires/)).toBeTruthy();
		change("Baseline report", "flat");
		expect(read("[data-pit-percentile]")).toBe("Percentile: 100%");
		expect(read("[data-pit-z]")).toBe("z: —");
		change("Baseline report", "small");
		expect(read("[data-pit-percentile]")).toBe("Percentile: —");
		expect(read("[data-pit-score-status]")).toContain("sample minimum");
	});
	it("preserves the first frozen result and irreversibly marks subsequent tuning within the walkthrough", () => {
		lab();
		tab(/Protect the holdout/);
		expect(read("[data-pit-first]")).toContain("—");
		expect(document.body.textContent).not.toContain("1/2 matches");
		expect(document.body.textContent).not.toContain("replay 2/2");
		click("Freeze rule and reveal outcomes");
		expect(read("[data-pit-frozen]")).toContain("80");
		expect(read("[data-pit-first]")).toContain("1 / 2");
		change("Toy decision threshold", "70");
		expect(read("[data-pit-current]")).toContain("2 / 2");
		expect(read("[data-pit-first]")).toContain("1 / 2");
		expect(read("[data-pit-holdout-status]")).toContain("development reuse");
		change("Toy decision threshold", "80");
		expect(read("[data-pit-holdout-status]")).toContain("development reuse");
		click("Reset scene");
		expect(read("[data-pit-first]")).toContain("—");
	});
	it("allows development edits before the first outcome reveal", () => {
		lab();
		tab(/Protect the holdout/);
		change("Toy decision threshold", "70");
		click("Freeze rule and reveal outcomes");
		expect(read("[data-pit-frozen]")).toContain("70");
		expect(read("[data-pit-first]")).toContain("2 / 2");
		expect(read("[data-pit-holdout-status]")).toContain(
			"no subsequent tuning yet",
		);
	});
	it("supports Chinese and guards unavailable data", () => {
		const page = render(<PointTimeConceptLab locale="zh" data={data} />);
		change("09:58 后的决策截止秒数", "300");
		expect(read("[data-pit-total]")).toContain("110");
		page.rerender(<PointTimeConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
	});
	it("preserves version 2 grading and the paid Learn boundary", () => {
		const scenario = getLessonScenarios("point-in-time-research")[0];
		let state = initialAttemptState();
		const props = {
			locale: "en" as const,
			busy: false,
			error: null,
			onOpen: vi.fn(),
			onRecover: vi.fn(),
			onAction: vi.fn(),
		};
		const view = projectAttempt(scenario, state, "pit-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		change("Decision cutoff seconds after 09:58", "300");
		expect(props.onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(props.onAction).toHaveBeenCalledExactlyOnceWith({
			type: "continue",
		});
		state = transitionAttempt(scenario, state, { type: "continue" });
		const next = projectAttempt(scenario, state, "pit-test", 1);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		state = transitionAttempt(scenario, state, {
			type: "respond",
			questionId: "weight",
			value: "20",
		});
		state = transitionAttempt(scenario, state, {
			type: "answer",
			questionId: "cutoff",
			choiceId: "no",
		});
		state = transitionAttempt(scenario, state, { type: "submit" });
		expect(
			projectAttempt(scenario, state, "pit-test", 2).feedback.map((f) => f.met),
		).toEqual([true, true]);
		expect(
			previewLearningImpl({
				lessonId: "point-in-time-research",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
