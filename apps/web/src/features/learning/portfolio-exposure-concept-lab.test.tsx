// @vitest-environment jsdom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start/server-only", () => ({}));

import { getLessonScenarios } from "@/content/scenarios/index.server";
import { portfolioExposureData as data } from "@/content/units/portfolio-exposure-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	exposureSum,
	localExposureScenario,
	positionExposure,
} from "@/domain/learning/portfolio-exposure-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { PortfolioExposureConceptLab } from "./portfolio-exposure-concept-lab";

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
const lab = () =>
	render(<PortfolioExposureConceptLab locale="en" data={data} />);
it("scales signed Greeks independently and keeps missing and stale inputs unavailable", () => {
	expect(positionExposure(data.calls, data.at)).toEqual({
		delta: -80,
		gamma: -4,
		theta: 6,
		vega: -24,
	});
	expect(
		positionExposure(
			{
				...data.calls,
				greeks: { ...data.calls.greeks, vega: 12 },
				vegaScale: "unit",
			},
			data.at,
		).vega,
	).toBe(-24);
	expect(positionExposure({ ...data.calls, at: "stale" }, data.at)).toEqual({
		delta: null,
		gamma: null,
		theta: null,
		vega: null,
	});
	expect(
		positionExposure(
			{ ...data.calls, greeks: { ...data.calls.greeks, vega: null } },
			data.at,
		),
	).toMatchObject({ delta: -80, vega: null });
	expect(
		positionExposure({ ...data.calls, quantity: -2 }, data.at).delta,
	).toBeNull();
});
it("distinguishes covered neutral delta from complete portfolio delta", () => {
	expect(exposureSum([100, -80, null])).toEqual({
		subtotal: 20,
		total: null,
		known: 2,
		required: 3,
	});
	expect(exposureSum([80, -80, null]).total).toBeNull();
	expect(exposureSum([80, -80, -30]).total).toBe(-30);
	expect(exposureSum([0, -24, 10]).total).toBe(-14);
});
it("shows curvature, IV and time independently at initially neutral delta", () => {
	expect(localExposureScenario(0, -4, 6, -24, 1, 0, 0)).toMatchObject({
		deltaTerm: 0,
		gammaTerm: -2,
		total: -2,
		nextDelta: -4,
	});
	expect(localExposureScenario(0, -4, 6, -24, -1, 0, 0)).toMatchObject({
		total: -2,
		nextDelta: 4,
	});
	expect(localExposureScenario(0, -4, 6, -24, 0, 1, 0).total).toBe(-24);
	expect(localExposureScenario(0, -4, 6, -24, 0, 0, 1).total).toBe(6);
});
it("plays the hedge and stops on direct input without filling the missing put", () => {
	vi.useFakeTimers();
	lab();
	expect(read("[data-exposure-coverage]")).toContain("Covered delta: 20");
	fireEvent.click(screen.getByRole("button", { name: "Play explanation" }));
	act(() => vi.advanceTimersByTime(1200));
	expect(read("[data-exposure-coverage]")).toContain("Covered delta: 10");
	change("Hypothetical stock adjustment", "-20");
	act(() => vi.advanceTimersByTime(6000));
	expect(read("[data-exposure-coverage]")).toContain("Covered delta: 0");
	expect(read("[data-exposure-coverage]")).toContain("Complete delta: —");
	change("Third holding evidence", "known");
	expect(read("[data-exposure-coverage]")).toContain("Complete delta: -30");
});
it("keeps local stress separate from coverage and converts equivalent vega quotes", () => {
	lab();
	tab(/Stress local neutrality/);
	change("Small underlying move", "1");
	expect(read("[data-exposure-risk]")).toContain("Gamma: −$2");
	change("IV change in percentage points", "1");
	expect(read("[data-exposure-risk]")).toContain("approximation: −$26");
	change("Elapsed calendar days", "1");
	expect(read("[data-exposure-risk]")).toContain("approximation: −$20");
	tab(/Align units and timestamps/);
	expect(read("[data-exposure-units]")).toContain("Complete current vega: -14");
	change("Call vega quote scale", "unit");
	expect(read("[data-exposure-units]")).toContain("Complete current vega: -14");
	change("Call snapshot evidence", "stale");
	expect(read("[data-exposure-units]")).toContain("Complete current vega: —");
	expect(read("[data-exposure-units]")).toContain("subtotal: 10");
});
it("supports Chinese and missing teaching data", () => {
	const p = render(<PortfolioExposureConceptLab locale="zh" data={data} />);
	change("假设股票调整", "-20");
	expect(read("[data-exposure-coverage]")).toContain("已覆盖 Delta: 0");
	p.rerender(<PortfolioExposureConceptLab locale="en" />);
	expect(screen.getByRole("status").textContent).toContain("unavailable");
});
it("preserves the original assessment and only dispatches Continue", () => {
	const scenario = getLessonScenarios("portfolio-exposure")[0];
	let state = initialAttemptState();
	const props = {
		locale: "en" as const,
		busy: false,
		error: null,
		onOpen: vi.fn(),
		onRecover: vi.fn(),
		onAction: vi.fn(),
	};
	const view = projectAttempt(scenario, state, "exposure-test", 0);
	expect(view.step.conceptData).toEqual(data);
	const page = render(<LearningScreen {...props} view={view} />);
	change("Hypothetical stock adjustment", "-20");
	expect(props.onAction).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole("button", { name: "Continue to practice" }));
	expect(props.onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
	state = transitionAttempt(scenario, state, { type: "continue" });
	const next = projectAttempt(scenario, state, "exposure-test", 1);
	page.rerender(<LearningScreen {...props} view={next} />);
	expect(next.step.conceptData).toBeUndefined();
	expect(scenario.version).toBe(2);
	for (const [questionId, value] of [
		["net", "20"],
		["hedge", "-20"],
	])
		state = transitionAttempt(scenario, state, {
			type: "respond",
			questionId,
			value,
		});
	state = transitionAttempt(scenario, state, {
		type: "answer",
		questionId: "coverage",
		choiceId: "no",
	});
	state = transitionAttempt(scenario, state, { type: "submit" });
	expect(
		projectAttempt(scenario, state, "exposure-test", 2).feedback.map(
			(f) => f.met,
		),
	).toEqual([true, true, true]);
	expect(
		previewLearningImpl({
			lessonId: "portfolio-exposure",
			variant: 0,
			actions: [],
		}),
	).toMatchObject({ ok: true, view: { result: null } });
});
