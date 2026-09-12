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
import { charmVannaConceptData as data } from "@/content/units/charm-vanna-concept.server";
import {
	crossDeltaTerms,
	crossPositionChange,
} from "@/domain/learning/charm-vanna-concept";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { CharmVannaConceptLab } from "./charm-vanna-concept-lab";
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
});
const read = (s: string) => document.querySelector(s)?.textContent;
const change = (name: string, value: string) =>
	fireEvent.change(screen.getByLabelText(name), { target: { value } });
const tab = (name: RegExp) =>
	fireEvent.click(screen.getByRole("tab", { name }));
const click = (name: string) =>
	fireEvent.click(screen.getByRole("button", { name }));
const lab = () => render(<CharmVannaConceptLab locale="en" data={data} />);
describe("charm and vanna SVG lesson", () => {
	it("multiplies matching changes before addition and retains cancellation", () => {
		expect(crossDeltaTerms(data.conventions[0], 1, 2)).toEqual({
			timeChange: 1,
			volChange: 2,
			charm: -0.01,
			vanna: 0.04,
			total: 0.03,
		});
		expect(crossDeltaTerms(data.conventions[0], 2, 1).total).toBe(0);
		expect(crossDeltaTerms(data.conventions[0], 1, -2).total).toBe(-0.05);
	});
	it("preserves equivalent elapsed remaining and decimal-volatility representations", () => {
		for (const c of data.conventions.slice(0, 3))
			expect(crossDeltaTerms(c, 1, 2).total).toBe(0.03);
		expect(crossDeltaTerms(data.conventions[1], 1, 2).timeChange).toBe(-1);
		expect(crossDeltaTerms(data.conventions[2], 1, 2).volChange).toBe(0.02);
	});
	it("retains partial terms without inventing unknown units or inputs", () => {
		expect(crossDeltaTerms(data.conventions[3], 1, 2)).toMatchObject({
			charm: null,
			vanna: 0.04,
			total: null,
		});
		expect(crossDeltaTerms(data.conventions[4], 1, 2)).toMatchObject({
			charm: -0.01,
			vanna: null,
			total: null,
		});
		expect(crossDeltaTerms(data.conventions[0], -1, 2).charm).toBeNull();
		expect(
			crossDeltaTerms(
				{ ...data.conventions[0], charm: Number.POSITIVE_INFINITY },
				1,
				2,
			).charm,
		).toBeNull();
		expect(
			crossDeltaTerms(data.conventions[0], 1, Number.NaN).vanna,
		).toBeNull();
	});
	it("uses signed position units without changing option delta or filling missing evidence", () => {
		expect(crossPositionChange(0.03, 2, 100, "long")).toBe(6);
		expect(crossPositionChange(0.03, 2, 100, "short")).toBe(-6);
		expect(crossPositionChange(0.03, 0, 100, "long")).toBe(0);
		expect(crossPositionChange(0.03, 2.5, 100, "long")).toBeNull();
		expect(crossPositionChange(null, 0, 100, "long")).toBeNull();
		expect(crossPositionChange(0.03, 2, 100, "long", false)).toBeNull();
	});
	it("links independent event controls to the combined result", () => {
		lab();
		expect(read("[data-cross-effect=total]")).toBe("+0.03");
		change("IV percentage-point change", "0");
		expect(read("[data-cross-effect=total]")).toBe("-0.01");
		change("Elapsed calendar days", "2");
		change("IV percentage-point change", "1");
		expect(read("[data-cross-effect=total]")).toBe("0");
		expect(read("[data-cross-effect=time]")).toBe("-0.02");
		expect(read("[data-cross-effect=vol]")).toBe("+0.02");
		click("Reset scene");
		expect(read("[data-cross-next]")).toContain("0.48");
	});
	it("plays controlled events and stops on direct input", () => {
		vi.useFakeTimers();
		lab();
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-cross-effect=total]")).toBe("-0.01");
		change("IV percentage-point change", "3");
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-cross-effect=total]")).toBe("+0.05");
		expect(
			screen.getByRole("button", { name: "Play explanation" }),
		).toBeTruthy();
	});
	it("supports native SVG unit inspection and honest partial totals", () => {
		lab();
		tab(/Read the convention/);
		change("Derivative convention", "remaining");
		expect(read("[data-cross-unit-total]")).toBe("+0.03");
		click("Inspect volatility units");
		change("Derivative convention", "decimal");
		expect(read("[data-cross-unit-total]")).toBe("+0.03");
		change("Derivative convention", "time-unknown");
		expect(read("[data-cross-unit-total]")).toBe("—");
		expect(read("[data-cross-unit-vol]")).toBe("Vanna: +0.04");
		change("Derivative convention", "vol-unknown");
		expect(read("[data-cross-unit-time]")).toBe("Charm: -0.01");
		click("Reset scene");
		expect(read("[data-cross-unit-total]")).toBe("+0.03");
	});
	it("separates option and position changes across signed sides and missing holdings", () => {
		lab();
		tab(/Scale the position/);
		expect(read("[data-cross-position]")).toBe("+6");
		click("Short (−)");
		expect(read("[data-cross-position]")).toBe("-6");
		expect(read("[data-cross-position-next]")).toContain("0.48");
		change("Position contracts", "5");
		expect(read("[data-cross-position]")).toBe("-15");
		change("Input event", "cancel");
		expect(read("[data-cross-position]")).toBe("0");
		change("Position evidence", "missing");
		expect(read("[data-cross-position]")).toBe("—");
		expect(read("[data-cross-option]")).toBe("0");
		click("Reset scene");
		expect(read("[data-cross-position]")).toBe("+6");
	});
	it("supports Chinese and guards unavailable data", () => {
		const page = render(<CharmVannaConceptLab locale="zh" data={data} />);
		change("IV 百分点变化", "0");
		expect(read("[data-cross-effect=total]")).toBe("-0.01");
		page.rerender(<CharmVannaConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
	});
	it("preserves authorized Learn and original version 2 grading", () => {
		const scenario = getLessonScenarios("charm-vanna")[0];
		let state = initialAttemptState();
		const props = {
			locale: "en" as const,
			busy: false,
			error: null,
			onOpen: vi.fn(),
			onRecover: vi.fn(),
			onAction: vi.fn(),
		};
		const view = projectAttempt(scenario, state, "cross-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		change("IV percentage-point change", "0");
		expect(props.onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(props.onAction).toHaveBeenCalledExactlyOnceWith({
			type: "continue",
		});
		state = transitionAttempt(scenario, state, { type: "continue" });
		const next = projectAttempt(scenario, state, "cross-test", 1);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		for (const [questionId, value] of [
			["delta-change", "0"],
			["position-change", "0"],
		])
			state = transitionAttempt(scenario, state, {
				type: "respond",
				questionId,
				value,
			});
		state = transitionAttempt(scenario, state, { type: "submit" });
		expect(
			projectAttempt(scenario, state, "cross-test", 2).feedback.map(
				(f) => f.met,
			),
		).toEqual([true, true]);
		expect(
			previewLearningImpl({ lessonId: "charm-vanna", variant: 0, actions: [] }),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
