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

import { getLessonBody } from "@/content/lesson-content.server";
import { getLessonScenarios } from "@/content/scenarios/index.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import { LearningScreen } from "./learning-screen";
import { SettlementConceptLab } from "./settlement-concept-lab";
import {
	cashSettlement,
	exerciseWindow,
	exitOutcome,
	physicalDelivery,
} from "./settlement-concept-model";
import {
	ClosingExerciseScene,
	ExerciseTimingScene,
	SettlementComparisonScene,
} from "./settlement-concept-scenes";

beforeEach(() =>
	vi.stubGlobal("matchMedia", () => ({
		matches: true,
		addEventListener: () => {},
		removeEventListener: () => {},
	})),
);
afterEach(() => {
	cleanup();
	vi.useRealTimers();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("expiration and settlement concept lesson", () => {
	it("distinguishes a closing sale from exercising a call or put", () => {
		expect(exitOutcome("CALL", "close")).toEqual({
			remainingOptions: 0,
			exercised: false,
			sharesToHolder: 0,
			cashToHolder: 250,
		});
		expect(exitOutcome("PUT", "close").exercised).toBe(false);
		expect(exitOutcome("CALL", "exercise")).toMatchObject({
			exercised: true,
			sharesToHolder: 100,
			cashToHolder: -5000,
		});
		expect(exitOutcome("PUT", "exercise")).toMatchObject({
			exercised: true,
			sharesToHolder: -100,
			cashToHolder: 5000,
		});
		expect(physicalDelivery("CALL", 3)).toEqual({
			sharesToHolder: 300,
			cashToHolder: -15000,
		});
	});
	it("separates style, trading and calendar DTE under the stated schedule", () => {
		expect(
			[0, 1, 2, 3].map((i) => exerciseWindow("american", i).exerciseOpen),
		).toEqual([true, true, true, false]);
		expect(
			[0, 1, 2, 3].map((i) => exerciseWindow("european", i).exerciseOpen),
		).toEqual([false, false, true, false]);
		expect(exerciseWindow("european", 1)).toMatchObject({
			dte: 0,
			tradingOpen: true,
			exerciseOpen: false,
		});
		expect(exerciseWindow("european", 2)).toMatchObject({
			dte: 0,
			tradingOpen: false,
			exerciseOpen: true,
		});
		expect(exerciseWindow("american", 3)).toMatchObject({
			dte: 0,
			tradingOpen: false,
			exerciseOpen: false,
		});
		expect(() => exerciseWindow("american", 4)).toThrow(
			"Unknown teaching schedule stop",
		);
	});
	it("preserves raw negative differences, floors only payoff and retains missing references", () => {
		expect(cashSettlement("CALL", 4025, 1)).toEqual({
			difference: 25,
			payoffPoints: 25,
			cash: 2500,
		});
		expect(cashSettlement("CALL", 3990, 3)).toEqual({
			difference: -10,
			payoffPoints: 0,
			cash: 0,
		});
		expect(cashSettlement("PUT", 3990, 3)).toEqual({
			difference: -10,
			payoffPoints: 10,
			cash: 3000,
		});
		expect(cashSettlement("CALL", null, 1)).toEqual({
			difference: null,
			payoffPoints: null,
			cash: null,
		});
		expect(cashSettlement("PUT", 4000, 1).cash).toBe(0);
	});
	it("plays the closing example and switches to exercise without dispatching a real trade", () => {
		vi.useFakeTimers();
		render(<ClosingExerciseScene locale="en" />);
		fireEvent.click(screen.getByRole("button", { name: "Play explanation" }));
		act(() => vi.advanceTimersByTime(1200));
		act(() => vi.advanceTimersByTime(1200));
		expect(
			screen.getByText("The long option was sold, not exercised."),
		).toBeTruthy();
		expect(screen.getByText("No exercise delivery")).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Exercise" }));
		expect(
			screen.getByText(
				"The right was exercised; an assigned writer fulfills the obligation.",
			),
		).toBeTruthy();
		expect(screen.getByText("Holder cash: −$5,000")).toBeTruthy();
		expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: "Put" }));
		expect(screen.getByText("Deliver 100 shares")).toBeTruthy();
	});
	it("keeps 0DTE distinct from an open window and lets a timeline edit stop playback", () => {
		vi.useFakeTimers();
		const { container } = render(<ExerciseTimingScene locale="en" />);
		fireEvent.click(screen.getByRole("button", { name: "European" }));
		expect(
			container.querySelector("[data-exercise-window]")?.textContent,
		).toContain("Outside");
		fireEvent.change(screen.getByRole("slider", { name: "Expiry timeline" }), {
			target: { value: "2" },
		});
		expect(container.querySelector("[data-calendar-dte]")?.textContent).toBe(
			"0 DTE",
		);
		expect(
			container.querySelector("[data-exercise-window]")?.textContent,
		).toContain("Within");
		expect(
			container.querySelector("[data-trading-window]")?.textContent,
		).toContain("closed");
		fireEvent.click(screen.getByRole("button", { name: "Play explanation" }));
		fireEvent.pointerDown(
			screen.getByRole("slider", { name: "Expiry timeline" }),
		);
		act(() => vi.advanceTimersByTime(5000));
		expect(
			container.querySelector("[data-exercise-window]")?.textContent,
		).toContain("Within");
		fireEvent.change(screen.getByLabelText("Schedule stop"), {
			target: { value: "3" },
		});
		expect(container.querySelector("[data-calendar-dte]")?.textContent).toBe(
			"0 DTE",
		);
		expect(
			container.querySelector("[data-exercise-window]")?.textContent,
		).toContain("Outside");
	});
	it("never substitutes the inspected last display for the official settlement reference", () => {
		const { container } = render(<SettlementComparisonScene locale="en" />);
		const cash = () =>
			container.querySelector("[data-settlement-cash]")?.textContent;
		expect(cash()).toBe("$2,500");
		fireEvent.click(screen.getByRole("button", { name: "Last display" }));
		expect(
			container.querySelector("[data-inspected-reference]")?.textContent,
		).toContain("4,030");
		expect(cash()).toBe("$2,500");
		fireEvent.change(screen.getByLabelText("Official-reference example"), {
			target: { value: "2" },
		});
		expect(cash()).toBe("—");
		fireEvent.change(screen.getByLabelText("Official-reference example"), {
			target: { value: "1" },
		});
		expect(cash()).toBe("$0");
		expect(
			container.querySelector("[data-settlement-difference]")?.textContent,
		).toContain("-10 points");
		fireEvent.click(screen.getByRole("button", { name: "Put" }));
		expect(cash()).toBe("$1,000");
	});
	it("changes product units and keeps missing cash references missing after a physical comparison", () => {
		const { container } = render(<SettlementComparisonScene locale="en" />);
		fireEvent.change(screen.getByLabelText("Official-reference example"), {
			target: { value: "2" },
		});
		fireEvent.click(
			screen.getByRole("button", { name: "Physical · stock example" }),
		);
		fireEvent.change(
			screen.getByRole("slider", { name: "Contract quantity" }),
			{ target: { value: "3" } },
		);
		expect(container.querySelector("[data-settlement-cash]")?.textContent).toBe(
			"−$15,000",
		);
		expect(
			container.querySelector("[data-physical-delivery]")?.textContent,
		).toContain("receives 300 shares");
		fireEvent.click(
			screen.getByRole("button", { name: "Cash · index example" }),
		);
		expect(container.querySelector("[data-settlement-cash]")?.textContent).toBe(
			"—",
		);
	});
	it("renders Chinese scenes with reduced motion and resets the selected scene", () => {
		const { container } = render(<SettlementConceptLab locale="zh" />);
		fireEvent.click(screen.getByRole("tab", { name: /行权时间/ }));
		fireEvent.change(screen.getByRole("slider", { name: "到期时间轴" }), {
			target: { value: "3" },
		});
		expect(container.querySelector("[data-calendar-dte]")?.textContent).toBe(
			"0 DTE",
		);
		fireEvent.click(screen.getByRole("button", { name: "重置场景" }));
		expect(container.querySelector("[data-calendar-dte]")?.textContent).toBe(
			"2 DTE",
		);
		fireEvent.click(screen.getByRole("tab", { name: /结算/ }));
		expect(container.querySelector("[data-settlement-cash]")?.textContent).toBe(
			"$2,500",
		);
	});
	it("keeps exploration in Learn and preserves the existing version 2 assessment", () => {
		const scenario = getLessonScenarios("expiration-settlement")[0];
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
		const page = render(
			<LearningScreen
				{...props}
				view={projectAttempt(scenario, state, "settlement-test", 0)}
			/>,
		);
		fireEvent.click(screen.getByRole("tab", { name: /Settlement/ }));
		fireEvent.click(screen.getByRole("button", { name: "Last display" }));
		expect(onAction).not.toHaveBeenCalled();
		fireEvent.click(
			screen.getByRole("button", { name: "Continue to practice" }),
		);
		expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
		page.rerender(
			<LearningScreen
				{...props}
				view={projectAttempt(
					scenario,
					transitionAttempt(scenario, state, { type: "continue" }),
					"settlement-test",
					1,
				)}
			/>,
		);
		expect(
			screen.queryByRole("region", {
				name: "Interactive expiration and settlement lesson",
			}),
		).toBeNull();
		expect(screen.getByText("What is the cash payoff?")).toBeTruthy();
		expect(scenario.version).toBe(2);
		expect(scenario.steps.slice(1).every((step) => !step.conceptLab)).toBe(
			true,
		);
		expect(
			scenario.steps[1].questions.map((q) => ({
				id: q.id,
				accepted: q.accepted,
			})),
		).toEqual([
			{ id: "settlement-difference", accepted: ["12"] },
			{ id: "cash", accepted: ["1200"] },
			{ id: "delivery", accepted: ["cash"] },
		]);
		expect(getLessonBody("expiration-settlement")).toContain(
			"last trading time",
		);
	});
});
