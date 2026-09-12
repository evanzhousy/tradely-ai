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
import { deltaConceptData as data } from "@/content/units/delta-concept.server";
import { sourceConceptData } from "@/content/units/source-concept.server";
import {
	illustrativeDeltaCurve,
	localDeltaChange,
} from "@/domain/learning/delta-concept";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { DeltaConceptLab } from "./delta-concept-lab";
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
const lab = () => render(<DeltaConceptLab locale="en" data={data} />);

describe("delta SVG lesson", () => {
	it("applies cents, quantity, multiplier and position sign exactly once", () => {
		expect(localDeltaChange(0.5, 40, 2, 100, "long")).toEqual({
			unitChangeCents: 20,
			positionDelta: 100,
			positionChangeCents: 4000,
		});
		expect(localDeltaChange(0.5, 40, 2, 100, "short")).toEqual({
			unitChangeCents: 20,
			positionDelta: -100,
			positionChangeCents: -4000,
		});
		expect(localDeltaChange(-0.4, 40, 2, 100, "long")).toEqual({
			unitChangeCents: -16,
			positionDelta: -80,
			positionChangeCents: -3200,
		});
		expect(localDeltaChange(-0.4, -40, 2, 10, "short")).toEqual({
			unitChangeCents: 16,
			positionDelta: 8,
			positionChangeCents: -320,
		});
		expect(localDeltaChange(0.5, 45, 1, 1, "long")?.unitChangeCents).toBe(22.5);
	});
	it("preserves valid zero while rejecting missing, nonfinite or invalid inputs", () => {
		expect(localDeltaChange(0, 40, 2, 100, "long")?.positionChangeCents).toBe(
			0,
		);
		expect(localDeltaChange(0.5, 0, 2, 100, "long")?.positionChangeCents).toBe(
			0,
		);
		expect(localDeltaChange(0.5, 40, 0, 100, "long")?.positionDelta).toBe(0);
		for (const delta of [null, Number.NaN, Number.POSITIVE_INFINITY])
			expect(localDeltaChange(delta, 40, 2, 100, "long")).toBeNull();
		expect(
			localDeltaChange(0.5, Number.POSITIVE_INFINITY, 2, 100, "long"),
		).toBeNull();
		for (const quantity of [-1, 0.5, Number.POSITIVE_INFINITY])
			expect(localDeltaChange(0.5, 40, quantity, 100, "long")).toBeNull();
		for (const multiplier of [0, -1, Number.POSITIVE_INFINITY])
			expect(localDeltaChange(0.5, 40, 2, multiplier, "long")).toBeNull();
		expect(localDeltaChange(1, Number.MAX_VALUE, 2, 100, "long")).toBeNull();
	});
	it("uses a declared curve tangent at the anchor and exposes wider-move error", () => {
		expect(illustrativeDeltaCurve(data.curve, 0)).toEqual({
			linearPriceCents: 400,
			curvedPriceCents: 400,
			localDelta: 0.5,
		});
		const small = illustrativeDeltaCurve(data.curve, 40);
		expect(small.linearPriceCents).toBe(420);
		expect(small.curvedPriceCents).toBeCloseTo(420.32);
		const large = illustrativeDeltaCurve(data.curve, 800);
		expect(large.linearPriceCents).toBe(800);
		expect(large.curvedPriceCents).toBeCloseTo(928);
		expect(large.localDelta).toBeCloseTo(0.82);
		expect(
			illustrativeDeltaCurve(data.curve, -800).curvedPriceCents,
		).toBeCloseTo(128);
		for (let move = -800; move <= 800; move += 5) {
			const point = illustrativeDeltaCurve(data.curve, move);
			expect(point.curvedPriceCents).toBeGreaterThanOrEqual(
				data.curve.priceRange[0],
			);
			expect(point.curvedPriceCents).toBeLessThanOrEqual(
				data.curve.priceRange[1],
			);
			expect(point.localDelta).toBeGreaterThanOrEqual(0);
			expect(point.localDelta).toBeLessThanOrEqual(1);
		}
	});
	it("keeps supplied local price lines inside the chart at either move extreme", () => {
		for (const option of data.options)
			for (const move of data.localMoveRange) {
				const price = option.priceCents + option.delta * move;
				expect(price).toBeGreaterThanOrEqual(data.localPriceRange[0]);
				expect(price).toBeLessThanOrEqual(data.localPriceRange[1]);
			}
	});
	it("links the SVG move control to the form and preserves fractional-cent estimates", () => {
		lab();
		expect(read("[data-delta-estimate]")).toBe("$4.20");
		change("Drag underlying move", "45");
		expect(read("[data-delta-estimate]")).toBe("$4.225");
		expect(read("[data-delta-unit-change]")).toContain("+$0.225");
		expect(
			(screen.getByLabelText("Underlying price change") as HTMLInputElement)
				.value,
		).toBe("45");
		change("Underlying price change", "40");
		change("Supplied option", "put");
		expect(read("[data-delta-estimate]")).toBe("$2.34");
		expect(read("[data-delta-unit-change]")).toContain("−$0.16");
		click("Reset scene");
		expect(read("[data-delta-estimate]")).toBe("$4.20");
	});
	it("reverses position exposure without changing the option delta", () => {
		lab();
		tab(/Build position exposure/);
		expect(read("[data-delta-position]")).toBe("+100");
		expect(read("[data-delta-position-change]")).toContain("+$40.00");
		click("Short");
		expect(read("[data-delta-option-sign]")).toBe("+0.5");
		expect(read("[data-delta-position]")).toBe("−100");
		expect(read("[data-delta-position-change]")).toContain("−$40.00");
		change("Supplied option", "put");
		expect(read("[data-delta-option-sign]")).toBe("−0.4");
		expect(read("[data-delta-position]")).toBe("+80");
		change("Illustrative contract size", "10");
		expect(read("[data-delta-position]")).toBe("+8");
		expect(read("[data-delta-position-change]")).toContain("+$3.20");
		change("Drag contract quantity", "5");
		expect(read("[data-delta-position]")).toBe("+20");
		expect(
			(screen.getByLabelText("Number of contracts") as HTMLInputElement).value,
		).toBe("5");
	});
	it("withholds total estimates for changed inputs and also the spot calculation for missing delta", () => {
		lab();
		tab(/Test the limits/);
		change("Stress-test underlying move", "800");
		expect(read("[data-delta-reference]")).toContain("$9.28");
		expect(read("[data-delta-gap]")).toContain("+$1.28");
		for (const condition of ["volatility", "time"]) {
			change("Estimate conditions", condition);
			expect(read("[data-delta-reference]")).toBe("Curve price / unit—");
			expect(read("[data-delta-spot-only]")).toContain("+$4.00");
			expect(screen.getByText("Total change unavailable")).toBeTruthy();
		}
		change("Estimate conditions", "missing");
		expect(read("[data-delta-spot-only]")).toBe(
			"Old-delta spot calculation / unit—",
		);
		change("Estimate conditions", "fixed");
		change("Stress-test underlying move", "40");
		expect(read("[data-delta-gap]")).toContain("+$0.0032");
	});
	it("plays the declared move sequence and stops when the SVG control is grabbed", () => {
		vi.useFakeTimers();
		lab();
		tab(/Test the limits/);
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-delta-reference]")).toContain("$4.2032");
		fireEvent.pointerDown(screen.getByLabelText("Drag stress move"));
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-delta-reference]")).toContain("$4.2032");
		change("Drag stress move", "800");
		expect(read("[data-delta-reference]")).toContain("$9.28");
		click("Reset scene");
		expect(read("[data-delta-reference]")).toContain("$4.00");
	});
	it("supports Chinese and withholds missing or mismatched teaching data", () => {
		const page = render(<DeltaConceptLab locale="zh" data={data} />);
		change("给定期权", "put");
		expect(read("[data-delta-estimate]")).toBe("$2.34");
		page.rerender(<DeltaConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
		page.rerender(<DeltaConceptLab locale="en" data={sourceConceptData} />);
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
	});
	it("preserves version 2 grading and the authorized Learn boundary", () => {
		const scenario = getLessonScenarios("delta")[0];
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
		const view = projectAttempt(scenario, state, "delta-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		change("Underlying price change", "80");
		expect(onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
		const next = projectAttempt(
			scenario,
			transitionAttempt(scenario, state, { type: "continue" }),
			"delta-test",
			1,
		);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		expect(scenario.steps[1].questions.map((q) => q.id)).toEqual([
			"position-delta",
			"change",
		]);
		let answered = transitionAttempt(scenario, state, { type: "continue" });
		for (const [questionId, value] of [
			["position-delta", "120"],
			["change", "60"],
		]) {
			answered = transitionAttempt(scenario, answered, {
				type: "respond",
				questionId,
				value,
			});
		}
		answered = transitionAttempt(scenario, answered, { type: "submit" });
		expect(
			projectAttempt(scenario, answered, "delta-test", 2).feedback.map(
				(item) => item.met,
			),
		).toEqual([true, true]);
		expect(
			previewLearningImpl({ lessonId: "delta", variant: 0, actions: [] }),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
