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
import {
	getLessonScenarios,
	getScenario,
} from "@/content/scenarios/index.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import { ContractConceptLab } from "./contract-concept-lab";
import { contractAmounts, teachingProducts } from "./contract-concept-model";
import {
	AnatomyScene,
	SourceTimeScene,
	UnitsScene,
} from "./contract-concept-scenes";
import { LearningScreen } from "./learning-screen";

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
});

describe("contract concept lab", () => {
	it("calculates units from explicit terms and never invents shares for cash settlement", () => {
		expect(contractAmounts(3, 200, teachingProducts.stock)).toEqual({
			premium: 600,
			shares: 300,
		});
		expect(contractAmounts(5, 75, teachingProducts.stock)).toEqual({
			premium: 375,
			shares: 500,
		});
		expect(contractAmounts(3, 200, teachingProducts.index)).toEqual({
			premium: 600,
			shares: null,
		});
		expect(
			contractAmounts(3, 200, {
				multiplier: null,
				deliverableShares: null,
				settlement: "physical",
			}),
		).toEqual({ premium: null, shares: null });
	});
	it("updates a contract comparison independently of the selected observation and resets the scene", () => {
		const { container } = render(<ContractConceptLab locale="en" />);
		fireEvent.click(screen.getByRole("tab", { name: /Identity/ }));
		fireEvent.change(screen.getByLabelText("Expiration B"), {
			target: { value: "2026-10-16" },
		});
		expect(screen.getByText("Same contract")).toBeTruthy();
		fireEvent.change(screen.getByLabelText("B's teaching observation"), {
			target: { value: "2" },
		});
		expect(screen.getByText("Same contract")).toBeTruthy();
		expect(
			container.querySelector("[data-contract-observation]")?.textContent,
		).toContain("$1.90");
		fireEvent.change(screen.getByLabelText("Type B"), {
			target: { value: "PUT" },
		});
		expect(
			container.querySelector("[data-contract-identity-status]")?.textContent,
		).toBe("Fields that differ: Type.");
		fireEvent.click(screen.getByRole("button", { name: "Reset scene" }));
		expect((screen.getByLabelText("Type B") as HTMLSelectElement).value).toBe(
			"CALL",
		);
		expect(
			container.querySelector("[data-contract-identity-status]")?.textContent,
		).toContain("Expiration");
	});
	it("keeps cards and premium synchronized and removes unsupported results when terms are missing", () => {
		const { container } = render(<UnitsScene locale="en" />);
		fireEvent.click(screen.getByRole("button", { name: "Add one contract" }));
		expect(
			container.querySelector("[data-contract-premium]")?.textContent,
		).toBe("$800.00");
		fireEvent.change(screen.getByLabelText("Option price per share"), {
			target: { value: "75" },
		});
		expect(
			container.querySelector("[data-contract-premium]")?.textContent,
		).toBe("$300.00");
		expect(
			container.querySelector("[data-contract-deliverable]")?.textContent,
		).toContain("400 deliverable shares");
		fireEvent.change(screen.getByLabelText("Supplied product terms"), {
			target: { value: "missing" },
		});
		expect(
			container.querySelector("[data-contract-premium]")?.textContent,
		).toBe("—");
		expect(
			screen.queryByRole("button", { name: "Trace the calculation" }),
		).toBeNull();
	});
	it("shows cash terms, provides selectable diagram fields, and stops playback on direct input", () => {
		vi.useFakeTimers();
		render(<AnatomyScene locale="en" />);
		fireEvent.change(screen.getByLabelText("Teaching product"), {
			target: { value: "index" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Product terms Cash" }));
		expect(screen.getByText(/There are no deliverable shares/)).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Play explanation" }));
		act(() => vi.advanceTimersByTime(1200));
		expect(
			screen
				.getByRole("button", { name: "Type CALL" })
				.getAttribute("aria-pressed"),
		).toBe("true");
		fireEvent.click(
			screen.getByRole("button", { name: "Expiration 2026-10-16" }),
		);
		act(() => vi.advanceTimersByTime(5000));
		expect(
			screen
				.getByRole("button", { name: "Expiration 2026-10-16" })
				.getAttribute("aria-pressed"),
		).toBe("true");
		expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
	});
	it("scrubs only supplied observations, supports keyboard reversal, and cancels playback", () => {
		vi.useFakeTimers();
		const { container } = render(<SourceTimeScene locale="en" />);
		const timeline = screen.getByRole("slider", {
			name: "Observation timeline",
		});
		fireEvent.change(timeline, { target: { value: "0.7" } });
		expect(
			container.querySelector("[data-contract-snapshot]")?.textContent,
		).toBe("10:31 ET · $2.10/share");
		fireEvent.keyDown(timeline, { key: "End" });
		expect(
			container.querySelector("[data-contract-snapshot]")?.textContent,
		).toContain("$1.90");
		fireEvent.keyDown(timeline, { key: "ArrowLeft" });
		expect(
			container.querySelector("[data-contract-snapshot]")?.textContent,
		).toContain("$2.10");
		fireEvent.click(screen.getByRole("button", { name: "Play explanation" }));
		fireEvent.pointerDown(timeline);
		act(() => vi.advanceTimersByTime(5000));
		expect(
			container.querySelector("[data-contract-snapshot]")?.textContent,
		).toContain("$2.10");
		fireEvent.click(screen.getByRole("button", { name: "Play explanation" }));
		fireEvent.change(timeline, { target: { value: "0" } });
		act(() => vi.advanceTimersByTime(5000));
		expect(
			container.querySelector("[data-contract-snapshot]")?.textContent,
		).toContain("$2.00");
		expect(screen.getByText("2026-10-16")).toBeTruthy();
	});
	it("renders all four scenes in Chinese with reduced motion", () => {
		render(<ContractConceptLab locale="zh" />);
		for (const label of ["构成", "身份", "单位", "来源时间"]) {
			fireEvent.click(screen.getByRole("tab", { name: new RegExp(label) }));
			expect(screen.getAllByRole("group").length).toBeGreaterThan(0);
		}
		expect(screen.getByRole("slider", { name: "观测时间轴" })).toBeTruthy();
	});
	it("mounts only in Learn, keeps exploration out of grading, and preserves notes and older work", () => {
		const scenario = getLessonScenarios("option-contracts")[0];
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
		const result = render(
			<LearningScreen
				{...props}
				view={projectAttempt(scenario, state, "lab-test", 0)}
			/>,
		);
		fireEvent.click(screen.getByRole("tab", { name: /Units/ }));
		fireEvent.click(screen.getByRole("button", { name: "Add one contract" }));
		expect(onAction).not.toHaveBeenCalled();
		fireEvent.click(
			screen.getByRole("button", { name: "Continue to practice" }),
		);
		expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
		const next = transitionAttempt(scenario, state, { type: "continue" });
		result.rerender(
			<LearningScreen
				{...props}
				view={projectAttempt(scenario, next, "lab-test", 1)}
			/>,
		);
		expect(
			screen.queryByRole("region", { name: "Interactive contract lesson" }),
		).toBeNull();
		expect(
			screen.getByText("Can A and B be treated as the same contract?"),
		).toBeTruthy();
		expect(scenario.steps.slice(1).every((step) => !step.conceptLab)).toBe(
			true,
		);
		expect(
			getScenario("option-contracts", scenario.id, 2)?.steps[0].conceptLab,
		).toBeUndefined();
		expect(getLessonBody("option-contracts")).toContain(
			"market capitalization",
		);
		expect(scenario.version).toBe(3);
	});
});
