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
import { regimeConceptData as data } from "@/content/units/regime-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	conditionalHedge,
	regimeTotals,
	sampledFlips,
} from "@/domain/learning/regime-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { RegimeConceptLab } from "./regime-concept-lab";

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
const lab = () => render(<RegimeConceptLab locale="en" data={data} />);
describe("gamma regime SVG lesson", () => {
	it("keeps local sensitivity units and offsets the delta change", () => {
		expect(conditionalHedge(200, 50)).toEqual({
			deltaChange: 100,
			hedgeChange: -100,
		});
		expect(conditionalHedge(-200, 50)).toEqual({
			deltaChange: -100,
			hedgeChange: 100,
		});
		expect(conditionalHedge(-200, -50)).toEqual({
			deltaChange: 100,
			hedgeChange: -100,
		});
		expect(conditionalHedge(null, 50)).toBeNull();
		expect(conditionalHedge(200, Number.POSITIVE_INFINITY)).toBeNull();
	});
	it("does not confuse near-zero net with low gross or incomplete positions with zero", () => {
		expect(regimeTotals(data.portfolios[2].components)).toEqual({
			net: 5,
			gross: 995,
		});
		expect(regimeTotals([400, null])).toBeNull();
		expect(regimeTotals([])).toBeNull();
		expect(regimeTotals([Number.NaN])).toBeNull();
	});
	it("finds adjacent repriced sign brackets under the specified position scope", () => {
		expect(sampledFlips(data.curves[0].points)).toEqual([
			{ lower: 95, upper: 100, estimate: 97.5, kind: "bracket" },
		]);
		expect(sampledFlips(data.curves[1].points)[0].estimate).toBeCloseTo(
			103.333333,
			5,
		);
		expect(sampledFlips(data.curves[2].points)).toEqual([]);
		expect(sampledFlips(data.curves[3].points)).toEqual([]);
	});
	it("distinguishes an exact sign-changing node from a zero touch and permits multiple crossings", () => {
		const points = (values: (number | null)[]) =>
			values.map((sensitivity, i) => ({ spot: 90 + i * 5, sensitivity }));
		expect(sampledFlips(points([-100, 0, 100]))).toEqual([
			{ lower: 95, upper: 95, estimate: 95, kind: "node" },
		]);
		expect(sampledFlips(points([100, 0, 100]))).toEqual([]);
		expect(sampledFlips(points([-100, null, 100]))).toEqual([]);
		expect(sampledFlips(points([-100, 100, -100, 100]))).toHaveLength(3);
		expect(
			sampledFlips([
				{ spot: 100, sensitivity: -1 },
				{ spot: 95, sensitivity: 1 },
			]),
		).toEqual([]);
		expect(sampledFlips(points([-1e308, 1e308]))[0].estimate).toBe(92.5);
		expect(sampledFlips(points([-1e-300, 1e-300]))[0].estimate).toBe(92.5);
	});
	it("links portfolio and move controls while preserving gross sensitivity", () => {
		lab();
		expect(read("[data-regime-result=hedge]")).toBe("-100");
		change("Stated portfolio", "short");
		expect(read("[data-regime-result=hedge]")).toBe("+100");
		change("Underlying move in cents", "-50");
		expect(read("[data-regime-result=hedge]")).toBe("-100");
		change("Stated portfolio", "balanced");
		expect(read("[data-regime-result=hedge]")).toBe("+2.5");
		expect(read("[data-regime-gross]")).toContain("995");
		change("Stated portfolio", "missing");
		expect(read("[data-regime-result=hedge]")).toBe("—");
		click("Reset scene");
		expect(read("[data-regime-result=hedge]")).toBe("-100");
	});
	it("plays the supplied moves and stops when the learner changes the move", () => {
		vi.useFakeTimers();
		lab();
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-regime-result=hedge]")).toBe("-200");
		change("Underlying move in cents", "-100");
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-regime-result=hedge]")).toBe("+200");
		expect(
			screen.getByRole("button", { name: "Play explanation" }),
		).toBeTruthy();
	});
	it("selects supplied SVG samples and changes scope without inventing gap values", () => {
		lab();
		tab(/Inspect a modeled flip/);
		expect(read("[data-regime-flips]")).toContain("97.5");
		click("Spot sample 95");
		expect(read("[data-regime-sample]")).toContain("-100");
		change("Model position and expiry scope", "b");
		expect(read("[data-regime-flips]")).toContain("103.33");
		change("Model position and expiry scope", "near");
		expect(read("[data-regime-flips]")).toContain("No supported");
		change("Model position and expiry scope", "gap");
		expect(read("[data-regime-sample]")).toContain("—");
		expect(read("[data-regime-flips]")).toContain("No supported");
		change("Spot sample index", "2");
		expect(read("[data-regime-sample]")).toContain("+100");
	});
	it("reveals fixed records independently without treating a target as a fill", () => {
		lab();
		tab(/Open the evidence/);
		expect(read("[data-regime-target]")).toContain("—");
		fireEvent.click(screen.getByRole("button", { name: /Model packet/ }));
		expect(read("[data-regime-target]")).toContain("+100");
		expect(read("[data-regime-fill]")).toContain("—");
		fireEvent.click(screen.getByRole("button", { name: /Fill record/ }));
		expect(read("[data-regime-fill]")).toContain(data.packet.fillTime);
		fireEvent.click(screen.getByRole("button", { name: /Ask-depth snapshot/ }));
		expect(read("[data-regime-depth]")).toContain("500");
		expect(read("[data-regime-depth]")).toContain(data.packet.depthTime);
		fireEvent.click(screen.getByRole("button", { name: /Model packet/ }));
		expect(read("[data-regime-target]")).toContain("—");
		expect(read("[data-regime-fill]")).toContain("+100");
		click("Reset scene");
		expect(read("[data-regime-fill]")).toContain("—");
	});
	it("supports Chinese and guards unavailable data", () => {
		const page = render(<RegimeConceptLab locale="zh" data={data} />);
		change("给定组合", "short");
		expect(read("[data-regime-result=hedge]")).toBe("+100");
		page.rerender(<RegimeConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
	});
	it("preserves authorized Learn and original version 2 grading", () => {
		const scenario = getLessonScenarios("gamma-regimes")[0];
		let state = initialAttemptState();
		const props = {
			locale: "en" as const,
			busy: false,
			error: null,
			onOpen: vi.fn(),
			onRecover: vi.fn(),
			onAction: vi.fn(),
		};
		const view = projectAttempt(scenario, state, "regime-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		change("Stated portfolio", "short");
		expect(props.onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(props.onAction).toHaveBeenCalledExactlyOnceWith({
			type: "continue",
		});
		state = transitionAttempt(scenario, state, { type: "continue" });
		const next = projectAttempt(scenario, state, "regime-test", 1);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		state = transitionAttempt(scenario, state, {
			type: "respond",
			questionId: "hedge",
			value: "-60",
		});
		state = transitionAttempt(scenario, state, {
			type: "answer",
			questionId: "certainty",
			choiceId: "no",
		});
		state = transitionAttempt(scenario, state, { type: "submit" });
		expect(
			projectAttempt(scenario, state, "regime-test", 2).feedback.map(
				(f) => f.met,
			),
		).toEqual([true, true]);
		expect(
			previewLearningImpl({
				lessonId: "gamma-regimes",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
