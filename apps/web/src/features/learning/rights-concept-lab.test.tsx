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
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import { LearningScreen } from "./learning-screen";
import { RightsConceptLab } from "./rights-concept-lab";
import {
	exerciseAmounts,
	positionChange,
	underlyingAction,
} from "./rights-concept-model";
import {
	AssignmentScene,
	PositionActionsScene,
	RightsRolesScene,
} from "./rights-concept-scenes";

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

describe("rights concept lesson", () => {
	it("keeps all four rights correct and reverses cash and shares for puts", () => {
		expect(underlyingAction("CALL", "long")).toBe("buy");
		expect(underlyingAction("CALL", "short")).toBe("sell");
		expect(underlyingAction("PUT", "long")).toBe("sell");
		expect(underlyingAction("PUT", "short")).toBe("buy");
		expect(exerciseAmounts("PUT", 2)).toEqual({
			shares: 200,
			cash: 10000,
			openingPremium: 400,
			cashFrom: "writer",
			sharesFrom: "holder",
		});
		expect(exerciseAmounts("CALL", 2)).toMatchObject({
			cash: 10000,
			cashFrom: "holder",
			sharesFrom: "writer",
		});
	});
	it("distinguishes all four position actions and preserves an unknown initial position", () => {
		expect(positionChange(0, "buy", 2)).toEqual({
			after: 2,
			action: "buy-to-open",
		});
		expect(positionChange(0, "sell", 2)).toEqual({
			after: -2,
			action: "sell-to-open",
		});
		expect(positionChange(3, "sell", 2)).toEqual({
			after: 1,
			action: "sell-to-close",
		});
		expect(positionChange(-3, "buy", 3)).toEqual({
			after: 0,
			action: "buy-to-close",
		});
		expect(positionChange(null, "sell", 2)).toEqual({
			after: null,
			action: "unknown",
		});
		expect(positionChange(1, "sell", 2).action).toBe("close-and-open");
	});
	it("lets students compare all roles without clearing the current choice", () => {
		const { container } = render(<RightsRolesScene locale="en" />);
		const summary = () =>
			container.querySelector("[data-rights-summary]")?.textContent;
		expect(summary()).toBe("Right to buy 100 shares at $50 per share.");
		fireEvent.click(screen.getByRole("button", { name: "Put", exact: true }));
		expect(summary()).toBe("Right to sell 100 shares at $50 per share.");
		fireEvent.click(screen.getByRole("button", { name: "Writer · short" }));
		expect(summary()).toBe("Obligation to buy 100 shares at $50 per share.");
		fireEvent.click(screen.getByRole("button", { name: "Call", exact: true }));
		expect(summary()).toBe("Obligation to sell 100 shares at $50 per share.");
		fireEvent.click(screen.getByRole("button", { name: "Call", exact: true }));
		expect(summary()).toBe("Obligation to sell 100 shares at $50 per share.");
	});
	it("updates signed inventory and removes any claimed result when the starting position is missing", () => {
		const { container } = render(<PositionActionsScene locale="en" />);
		expect(screen.getByText("Sell to close")).toBeTruthy();
		fireEvent.change(
			screen.getByRole("slider", { name: /Contract quantity/ }),
			{ target: { value: "3" } },
		);
		expect(container.querySelector("[data-position-result]")?.textContent).toBe(
			"Long 3 → Flat · 0",
		);
		fireEvent.change(screen.getByLabelText("Starting option position"), {
			target: { value: "-3" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Buy", exact: true }));
		expect(screen.getByText("Buy to close")).toBeTruthy();
		fireEvent.change(screen.getByLabelText("Starting option position"), {
			target: { value: "unknown" },
		});
		expect(container.querySelector("[data-position-result]")?.textContent).toBe(
			"Unknown → Unknown",
		);
		expect(screen.getByText("Opening or closing is unknown")).toBeTruthy();
	});
	it("separates premium from exercise cash, reverses the current comparison and pauses on direct selection", () => {
		vi.useFakeTimers();
		const { container } = render(<AssignmentScene locale="en" />);
		expect(container.querySelector("[data-exercise-cash]")?.textContent).toBe(
			"$5,000",
		);
		expect(
			container.querySelector("[data-opening-premium]")?.textContent,
		).toContain("$200");
		fireEvent.click(screen.getByRole("button", { name: "Play explanation" }));
		act(() => vi.advanceTimersByTime(1200));
		expect(screen.getByText("Exercise submitted")).toBeTruthy();
		act(() => vi.advanceTimersByTime(1200));
		expect(
			screen.getByText(
				"The assigned put writer pays cash and receives shares.",
			),
		).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Call", exact: true }));
		expect(
			screen.getByText(
				"The assigned call writer delivers shares and receives cash.",
			),
		).toBeTruthy();
		expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
		fireEvent.change(
			screen.getByRole("slider", { name: /Contract quantity/ }),
			{ target: { value: "3" } },
		);
		fireEvent.click(screen.getByRole("button", { name: "3. Assignment" }));
		expect(container.querySelector("[data-exercise-cash]")?.textContent).toBe(
			"$15,000",
		);
		expect(
			container.querySelector("[data-opening-premium]")?.textContent,
		).toContain("$600");
		expect(
			screen.getByText(
				"The assigned call writer delivers shares and receives cash.",
			),
		).toBeTruthy();
	});
	it("provides Chinese scenes, stops playback on hide and restores scene defaults on reset", () => {
		vi.useFakeTimers();
		render(<RightsConceptLab locale="zh" />);
		fireEvent.click(screen.getByRole("tab", { name: /指派/ }));
		fireEvent.click(screen.getByRole("button", { name: "播放讲解" }));
		vi.spyOn(document, "hidden", "get").mockReturnValue(true);
		fireEvent(document, new Event("visibilitychange"));
		act(() => vi.advanceTimersByTime(5000));
		expect(screen.getByText("持有期权不等于行权。")).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "3. 指派" }));
		fireEvent.click(screen.getByRole("button", { name: "重置场景" }));
		expect(screen.getByText("持有期权不等于行权。")).toBeTruthy();
	});
	it("adds a Learn-only lab without changing the assessment or dispatching exploration as answers", () => {
		const scenario = getLessonScenarios("option-rights")[0];
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
				view={projectAttempt(scenario, state, "rights-test", 0)}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: "Put", exact: true }));
		fireEvent.click(screen.getByRole("tab", { name: /Assignment/ }));
		fireEvent.click(screen.getByRole("button", { name: "3. Assignment" }));
		expect(onAction).not.toHaveBeenCalled();
		fireEvent.click(
			screen.getByRole("button", { name: "Continue to practice" }),
		);
		expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
		const next = transitionAttempt(scenario, state, { type: "continue" });
		page.rerender(
			<LearningScreen
				{...props}
				view={projectAttempt(scenario, next, "rights-test", 1)}
			/>,
		);
		expect(
			screen.queryByRole("region", { name: "Interactive rights lesson" }),
		).toBeNull();
		expect(
			screen.getByText("What gross cash amount must the writer pay?"),
		).toBeTruthy();
		expect(scenario.version).toBe(2);
		expect(scenario.steps.slice(1).every((step) => !step.conceptLab)).toBe(
			true,
		);
		expect(scenario.steps[1].questions.map((q) => q.id)).toEqual([
			"obligation",
			"role",
		]);
	});
});
