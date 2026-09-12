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
import { gammaConceptData } from "@/content/units/gamma-concept.server";
import { timeVolRateConceptData as data } from "@/content/units/time-vol-rate-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import { signedPositionUnits } from "@/domain/learning/local-greeks";
import {
	combineGreekShock,
	greekContribution,
	inputDifference,
} from "@/domain/learning/time-vol-rate-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { TimeVolRateConceptLab } from "./time-vol-rate-concept-lab";

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
const lab = () => render(<TimeVolRateConceptLab locale="en" data={data} />);

describe("time volatility and rates SVG lesson", () => {
	it("separates point changes from relative percentages and elapsed calendar days", () => {
		expect(inputDifference(20, 23)).toEqual({ change: 3, relativePercent: 15 });
		expect(inputDifference(4, 4.5)).toEqual({
			change: 0.5,
			relativePercent: 12.5,
		});
		expect(inputDifference(0, 2)).toEqual({ change: 2, relativePercent: null });
		expect(inputDifference(Number.NaN, 2)).toBeNull();
		expect(inputDifference(-Number.MAX_VALUE, Number.MAX_VALUE)).toBeNull();
		expect(greekContribution(10, 3)).toBe(30);
		expect(greekContribution(-4, 2)).toBe(-8);
		expect(greekContribution(3, 0.5)).toBe(1.5);
	});
	it("scales each contribution once and preserves the supplied long/short signs", () => {
		const final = data.shocks[4];
		expect(signedPositionUnits(2, 100, "short")).toBe(-200);
		expect(combineGreekShock(data.options[0], final, 2, 100, "long")).toEqual({
			contributions: { spot: 4000, theta: -1600, vega: -6000, rho: 300 },
			totalCents: -3300,
		});
		expect(combineGreekShock(data.options[0], final, 2, 100, "short")).toEqual({
			contributions: { spot: -4000, theta: 1600, vega: 6000, rho: -300 },
			totalCents: 3300,
		});
		expect(
			combineGreekShock(data.options[1], final, 2, 100, "long")?.totalCents,
		).toBe(-11800);
		expect(
			combineGreekShock(
				data.options[0],
				{ ...data.shocks[3], spotCents: 0 },
				2,
				100,
				"long",
			)?.totalCents,
		).toBe(-7600);
	});
	it("reconciles all build-up stages on the declared common dollar scale", () => {
		expect(
			data.shocks.map(
				(shock) =>
					combineGreekShock(data.options[0], shock, 2, 100, "long")?.totalCents,
			),
		).toEqual([0, 4000, 2400, -3600, -3300]);
		for (const option of data.options)
			for (const shock of data.shocks)
				for (const side of ["long", "short"] as const) {
					const result = combineGreekShock(option, shock, 2, 100, side);
					expect(result).not.toBeNull();
					for (const value of Object.values(result?.contributions ?? {}))
						expect(Math.abs(value as number)).toBeLessThanOrEqual(
							data.contributionLimitCents,
						);
				}
	});
	it("keeps observed zero valid while withholding missing and invalid contributions", () => {
		expect(greekContribution(0, 2)).toBe(0);
		expect(greekContribution(10, 0)).toBe(0);
		for (const coefficient of [null, Number.NaN, Number.POSITIVE_INFINITY])
			expect(greekContribution(coefficient, 2)).toBeNull();
		expect(greekContribution(10, Number.POSITIVE_INFINITY)).toBeNull();
		expect(greekContribution(Number.MAX_VALUE, 2)).toBeNull();
		const missing = {
			...data.options[0],
			greeks: { ...data.options[0].greeks, vega: null },
		};
		expect(combineGreekShock(missing, data.shocks[4], 2, 100, "long")).toEqual({
			contributions: { spot: 4000, theta: -1600, vega: null, rho: 300 },
			totalCents: null,
		});
		expect(
			combineGreekShock(data.options[0], data.shocks[4], -1, 100, "long"),
		).toBeNull();
		expect(
			combineGreekShock(data.options[0], data.shocks[4], 2, 0, "long"),
		).toBeNull();
		expect(
			combineGreekShock(
				data.options[0],
				{ ...data.shocks[4], changes: { theta: -1, vega: 0, rho: 0 } },
				2,
				100,
				"long",
			),
		).toBeNull();
	});
	it("links the SVG input and displays days, IV points and rate points correctly", () => {
		lab();
		expect(read("[data-tvr-unit-effect]")).toBe("−$0.08");
		change("Sensitivity to inspect", "vega");
		expect(read("[data-tvr-input-change]")).toBe("+3 IV points");
		expect(read("[data-tvr-unit-effect]")).toBe("+$0.30");
		change("Drag Greek input", "25");
		expect(read("[data-tvr-input-change]")).toBe("+5 IV points");
		expect(
			(screen.getByLabelText("Input after change") as HTMLInputElement).value,
		).toBe("25");
		change("Sensitivity to inspect", "rho");
		expect(read("[data-tvr-input-change]")).toBe("+0.5 rate points");
		expect(read("[data-tvr-unit-effect]")).toBe("+$0.015");
		click("Reset scene");
		expect(read("[data-tvr-unit-effect]")).toBe("−$0.08");
	});
	it("reverses the position sensitivities without treating them as addable quantities", () => {
		lab();
		tab(/Scale the position/);
		expect(read('[data-tvr-sensitivity="theta"]')).toBe("−$8.00");
		expect(read('[data-tvr-sensitivity="vega"]')).toBe("+$20.00");
		expect(read('[data-tvr-sensitivity="rho"]')).toBe("+$6.00");
		click("Short");
		expect(read('[data-tvr-sensitivity="theta"]')).toBe("+$8.00");
		expect(read('[data-tvr-sensitivity="vega"]')).toBe("−$20.00");
		change("Supplied option", "put");
		expect(read('[data-tvr-sensitivity="rho"]')).toBe("+$4.00");
		change("Drag position size", "5");
		expect(read('[data-tvr-sensitivity="theta"]')).toBe("+$15.00");
		expect(read('[data-tvr-sensitivity="vega"]')).toBe("−$60.00");
		expect(
			(screen.getByLabelText("Number of contracts") as HTMLInputElement).value,
		).toBe("5");
	});
	it("plays the attribution and stops when the native timeline is grabbed", () => {
		vi.useFakeTimers();
		lab();
		tab(/Build the contributions/);
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-tvr-net]")).toBe("+$40.00");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-tvr-net]")).toBe("+$24.00");
		fireEvent.pointerDown(
			screen.getByLabelText("Contribution build-up timeline"),
		);
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-tvr-net]")).toBe("+$24.00");
		change("Build-up step", "3");
		expect(read("[data-tvr-net]")).toBe("−$36.00");
		change("Build-up step", "4");
		expect(read("[data-tvr-net]")).toBe("−$33.00");
		click("Short");
		expect(read("[data-tvr-net]")).toBe("+$33.00");
		click("Reset scene");
		expect(read("[data-tvr-net]")).toBe("$0.00");
	});
	it("withholds incomplete totals but retains unaffected components", () => {
		lab();
		tab(/Build the contributions/);
		change("Build-up step", "4");
		// $60 is 75% of the $80 half-axis (140 SVG units).
		expect(
			document
				.querySelector('[data-tvr-contribution="vega"]')
				?.closest("g")
				?.querySelector("rect")
				?.getAttribute("width"),
		).toBe("105");
		change("Visible inputs", "vega");
		expect(read('[data-tvr-contribution="vega"]')).toBe("—");
		expect(read('[data-tvr-contribution="spot"]')).toBe("+$40.00");
		expect(read("[data-tvr-net]")).toBe("—");
		expect(read("[data-tvr-coverage]")).toContain("Incomplete inputs");
		change("Visible inputs", "rho");
		expect(read('[data-tvr-contribution="vega"]')).toBe("−$60.00");
		expect(read('[data-tvr-contribution="rho"]')).toBe("—");
		change("Visible inputs", "all");
		expect(read("[data-tvr-net]")).toBe("−$33.00");
	});
	it("supports Chinese and rejects missing or mismatched teaching data", () => {
		const page = render(<TimeVolRateConceptLab locale="zh" data={data} />);
		change("查看的敏感度", "vega");
		expect(read("[data-tvr-input-change]")).toBe("+3 IV 点");
		page.rerender(<TimeVolRateConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
		page.rerender(
			<TimeVolRateConceptLab locale="en" data={gammaConceptData} />,
		);
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
	});
	it("preserves grading version 2, access and local-only exploration", () => {
		const scenario = getLessonScenarios("theta-vega-rho")[0];
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
		const view = projectAttempt(scenario, state, "tvr-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		change("Sensitivity to inspect", "vega");
		expect(onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
		let nextState = transitionAttempt(scenario, state, { type: "continue" });
		const next = projectAttempt(scenario, nextState, "tvr-test", 1);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		for (const [questionId, value] of [
			["vega-effect", "-0.24"],
			["combined", "-34"],
		])
			nextState = transitionAttempt(scenario, nextState, {
				type: "respond",
				questionId,
				value,
			});
		nextState = transitionAttempt(scenario, nextState, { type: "submit" });
		expect(
			projectAttempt(scenario, nextState, "tvr-test", 2).feedback.map(
				(f) => f.met,
			),
		).toEqual([true, true]);
		expect(
			previewLearningImpl({
				lessonId: "theta-vega-rho",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
