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
import { deltaConceptData } from "@/content/units/delta-concept.server";
import { gammaConceptData as data } from "@/content/units/gamma-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	gammaApproximation,
	gammaHedge,
} from "@/domain/learning/gamma-concept";
import { gammaTerms } from "@/domain/learning/local-greeks";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { GammaConceptLab } from "./gamma-concept-lab";
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
const lab = () => render(<GammaConceptLab locale="en" data={data} />);

describe("gamma SVG lesson", () => {
	it("separates delta change from the half-gamma squared price term in cents", () => {
		const rise = gammaTerms(0.5, 0.04, 200);
		expect(rise?.deltaChange).toBeCloseTo(0.08);
		expect(rise?.nextDelta).toBeCloseTo(0.58);
		expect(rise?.deltaPriceCents).toBe(100);
		expect(rise?.gammaPriceCents).toBe(8);
		expect(rise?.totalPriceCents).toBe(108);
		const fall = gammaTerms(0.5, 0.04, -200);
		expect(fall?.deltaChange).toBeCloseTo(-0.08);
		expect(fall?.nextDelta).toBeCloseTo(0.42);
		expect(fall?.gammaPriceCents).toBe(8);
		expect(fall?.totalPriceCents).toBe(-92);
		const put = gammaTerms(-0.4, 0.03, 200);
		expect(put?.nextDelta).toBeCloseTo(-0.34);
		expect(put?.totalPriceCents).toBeCloseTo(-74);
	});
	it("preserves zero gamma and withholds missing, invalid or out-of-bounds estimates without clamping", () => {
		expect(
			gammaApproximation({ ...data.options[0], gamma: 0 }, 200),
		).toMatchObject({
			ok: true,
			terms: { nextDelta: 0.5, gammaPriceCents: 0 },
		});
		for (const gamma of [null, Number.NaN, Number.POSITIVE_INFINITY, -1])
			expect(gammaApproximation({ ...data.options[0], gamma }, 200).ok).toBe(
				false,
			);
		expect(gammaTerms(0.5, 0.04, Number.POSITIVE_INFINITY)).toBeNull();
		expect(gammaTerms(null, 0.04, 100)).toBeNull();
		expect(gammaTerms(0.5, Number.MAX_VALUE, 400)).toBeNull();
		const raw = gammaApproximation(data.sensitivity[1], 400);
		expect(raw.ok).toBe(false);
		expect(raw.terms?.nextDelta).toBeCloseTo(1.3);
		expect(
			gammaApproximation(data.sensitivity[1], -400).terms?.nextDelta,
		).toBeCloseTo(-0.3);
		expect(gammaApproximation(data.options[1], 2000).ok).toBe(false);
	});
	it("rebalances the known hedge with the correct long/short and move signs", () => {
		const [call, put] = data.options;
		const hedge = (
			stage: number,
			side: "long" | "short" = "long",
			move = 200,
		) => gammaHedge(call, move, 2, 100, side, true, stage);
		expect(hedge(0)).toMatchObject({
			optionDelta: 100,
			stock: -100,
			netDelta: 0,
			positionGamma: 8,
		});
		expect(hedge(1)?.optionDelta).toBeCloseTo(116);
		expect(hedge(1)?.netDelta).toBeCloseTo(16);
		expect(hedge(1)?.trade).toBeCloseTo(-16);
		expect(hedge(2)?.netDelta).toBe(0);
		expect(hedge(2)?.stock).toBeCloseTo(-116);
		expect(hedge(1, "short")?.trade).toBeCloseTo(16);
		expect(hedge(1, "short")?.positionGamma).toBe(-8);
		expect(hedge(1, "long", -200)?.trade).toBeCloseTo(16);
		expect(gammaHedge(put, 200, 2, 100, "long", true, 1)?.trade).toBeCloseTo(
			-12,
		);
		expect(gammaHedge(call, 200, 2, 10, "long", true, 1)?.trade).toBeCloseTo(
			-1.6,
		);
	});
	it("does not invent hedge instructions for absent positions or invalid quantities", () => {
		expect(
			gammaHedge(data.options[0], 200, 2, 100, "long", false, 1),
		).toBeNull();
		expect(
			gammaHedge(data.options[0], 200, -1, 100, "long", true, 1),
		).toBeNull();
		expect(gammaHedge(data.options[0], 200, 2, 0, "long", true, 1)).toBeNull();
		expect(
			gammaHedge(data.sensitivity[1], 400, 2, 100, "long", true, 1),
		).toBeNull();
	});
	it("preserves dates and bounds for the authored sensitivity comparison", () => {
		for (const snapshot of data.sensitivity) {
			const expiry = snapshot.contract.split(" ")[1];
			expect((Date.parse(expiry) - Date.parse("2030-09-06")) / 86400000).toBe(
				snapshot.dte,
			);
			if (snapshot.gamma !== null)
				expect(snapshot.gamma).toBeLessThanOrEqual(data.maximumShownGamma);
		}
		for (const snapshot of data.options)
			for (const move of data.moveRange) {
				const result = gammaApproximation(snapshot, move);
				expect(result.ok).toBe(true);
				expect(result.terms?.gammaPriceCents).toBeLessThanOrEqual(40);
			}
	});
	it("links chart/form controls while distinguishing the two quantities", () => {
		lab();
		expect(read("[data-gamma-next]")).toContain("+0.58");
		expect(read("[data-gamma-quadratic]")).toContain("+$0.08");
		click("Gamma price term");
		expect(read("[data-gamma-focal]")).toBe("+$0.08");
		change("Drag gamma stock move", "-200");
		expect(read("[data-gamma-next]")).toContain("+0.42");
		expect(read("[data-gamma-focal]")).toBe("+$0.08");
		expect(read("[data-gamma-total]")).toContain("−$0.92");
		expect(
			(screen.getByLabelText("Underlying price change") as HTMLInputElement)
				.value,
		).toBe("-200");
		change("Supplied option", "put");
		change("Underlying price change", "200");
		expect(read("[data-gamma-next]")).toContain("−0.34");
		expect(read("[data-gamma-total]")).toContain("−$0.74");
	});
	it("plays the hedge, pauses on direct input and withholds unknown holdings", () => {
		vi.useFakeTimers();
		lab();
		tab(/Replay a hedge/);
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		expect(read('[data-gamma-hedge="net"]')).toBe("+16");
		expect(
			screen.getByText("The old hedge leaves residual delta"),
		).toBeTruthy();
		expect(read("[data-gamma-trade]")).toContain("Sell 16 shares");
		fireEvent.pointerDown(screen.getByLabelText("Hedge replay timeline"));
		act(() => vi.advanceTimersByTime(6000));
		expect(read('[data-gamma-hedge="net"]')).toBe("+16");
		change("Hedge step", "2");
		expect(read('[data-gamma-hedge="net"]')).toBe("0");
		expect(screen.getByText("Delta-neutral at this snapshot")).toBeTruthy();
		expect(read('[data-gamma-hedge="stock"]')).toBe("−116");
		click("Short");
		expect(read("[data-gamma-trade]")).toContain("Buy 16 shares");
		expect(read("[data-gamma-position-gamma]")).toContain("−8");
		click("Greeks only");
		expect(read('[data-gamma-hedge="net"]')).toBe("—");
		expect(read("[data-gamma-trade]")).toContain("Not established");
		expect(screen.queryByRole("button", { name: "Short" })).toBeNull();
		click("Reset scene");
		expect(read('[data-gamma-hedge="net"]')).toBe("0");
	});
	it("selects snapshots directly in SVG and rejects raw extrapolation beyond delta bounds", () => {
		lab();
		tab(/Inspect sensitivity/);
		expect(read("[data-gamma-sensitivity-next]")).toContain("+0.6");
		change("Drag sensitivity move", "400");
		expect(read("[data-gamma-raw]")).toBe("+1.3");
		expect(read("[data-gamma-sensitivity-next]")).toBe(
			"Approximate next delta: —",
		);
		expect(read("[data-gamma-validity]")).toContain("Outside delta bounds");
		fireEvent.click(screen.getByRole("button", { name: /Inspect A/ }));
		expect(read("[data-gamma-sensitivity-next]")).toContain("+0.66");
		change("Sensitivity snapshot", "C");
		expect(read("[data-gamma-sensitivity-next]")).toContain("+0.04");
		change("Sensitivity snapshot", "E");
		expect(read("[data-gamma-raw]")).toBe("—");
		expect(read("[data-gamma-validity]")).toBe("Missing or invalid Greeks");
	});
	it("supports Chinese and rejects absent or mismatched teaching data", () => {
		const page = render(<GammaConceptLab locale="zh" data={data} />);
		click("Gamma 价格项");
		expect(read("[data-gamma-focal]")).toBe("+$0.08");
		page.rerender(<GammaConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
		page.rerender(<GammaConceptLab locale="en" data={deltaConceptData} />);
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
	});
	it("keeps grading version 2 and routes only Continue into assessment state", () => {
		const scenario = getLessonScenarios("gamma")[0];
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
		const view = projectAttempt(scenario, state, "gamma-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		change("Underlying price change", "100");
		expect(onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
		let nextState = transitionAttempt(scenario, state, { type: "continue" });
		const next = projectAttempt(scenario, nextState, "gamma-test", 1);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		for (const [questionId, value] of [
			["next-delta", "0.48"],
			["hedge-change", "-6"],
		])
			nextState = transitionAttempt(scenario, nextState, {
				type: "respond",
				questionId,
				value,
			});
		nextState = transitionAttempt(scenario, nextState, { type: "submit" });
		expect(
			projectAttempt(scenario, nextState, "gamma-test", 2).feedback.map(
				(f) => f.met,
			),
		).toEqual([true, true]);
		expect(
			previewLearningImpl({ lessonId: "gamma", variant: 0, actions: [] }),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
