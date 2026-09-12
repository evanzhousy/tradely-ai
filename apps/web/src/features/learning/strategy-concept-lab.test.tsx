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
import { activityConceptData } from "@/content/units/activity-concept.server";
import { strategyConceptData as data } from "@/content/units/strategy-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	rollState,
	strategyPoints,
	valueStrategy,
} from "@/domain/learning/strategy-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { StrategyConceptLab } from "./strategy-concept-lab";

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
const change = (label: string, value: string) =>
	fireEvent.change(screen.getByLabelText(label), { target: { value } });
const click = (name: string) =>
	fireEvent.click(screen.getByRole("button", { name }));
const lab = () => render(<StrategyConceptLab locale="en" data={data} />);
describe("option strategies SVG lesson", () => {
	it("has complete example curves inside the declared shared ranges, including fee extremes", () => {
		for (const example of data.examples)
			for (const measure of ["profit", "terminal"] as const)
				for (const fees of [0, data.feeMax]) {
					const points = strategyPoints(
						example.legs,
						data.spotRange,
						fees,
						measure,
					);
					expect(points).not.toBeNull();
					const range =
						measure === "profit" ? data.profitRange : data.terminalRange;
					for (const point of points ?? []) {
						expect(point.value).toBeGreaterThanOrEqual(range[0]);
						expect(point.value).toBeLessThanOrEqual(range[1]);
					}
				}
		expect(
			strategyPoints(data.examples[0].legs, [100, 100], 0, "profit"),
		).toBeNull();
	});
	it("includes the actual strikes rather than approximating the expiry bends", () => {
		const points = strategyPoints(
			data.examples[0].legs,
			data.spotRange,
			0,
			"profit",
		);
		expect(points?.map((p) => p.spot)).toEqual([6000, 10000, 11000, 14000]);
		expect(valueStrategy(data.examples[0].legs, 11500)).toMatchObject({
			ok: true,
			terminalValue: 100000,
			entryCost: 40000,
			profit: 60000,
		});
	});
	it("records roll inventory and cash without inventing the old position's profit", () => {
		expect([0, 1, 2].map((step) => rollState(data.roll, step))).toEqual([
			{ oldQuantity: 1, newQuantity: 0, cashFlow: 0 },
			{ oldQuantity: 0, newQuantity: 0, cashFlow: 50000 },
			{ oldQuantity: 0, newQuantity: 1, cashFlow: -20000 },
		]);
	});
	it("withholds a named structure when viewing only one position", () => {
		lab();
		expect(read("[data-strategy-identity]")).toBe("Long call vertical");
		click("One position only");
		expect(read("[data-strategy-identity]")).toBe("Not established");
		change("Strategy example", "covered");
		expect(read("[data-strategy-identity]")).toBe("Not established");
		click("Linked structure");
		expect(read("[data-strategy-identity]")).toBe("Covered call");
		click("Reset scene");
		expect(read("[data-strategy-identity]")).toBe("Long call vertical");
	});
	it("links the SVG and form price controls and separates fees from terminal value", () => {
		lab();
		fireEvent.click(screen.getByRole("tab", { name: /Explore expiration/ }));
		expect(read("[data-strategy-profit]")).toContain("$600");
		change("Total fees in this example", "2500");
		expect(read("[data-strategy-profit]")).toContain("$575");
		expect(read("[data-strategy-terminal]")).toContain("$1,000");
		click("Terminal value");
		expect(read("[data-strategy-chart-value]")).toBe("$1,000");
		change("Drag expiry stock price", "10500");
		expect(
			(screen.getByLabelText("Expiry stock price") as HTMLInputElement).value,
		).toBe("10500");
		expect(read("[data-strategy-profit]")).toContain("$75");
		expect(read("[data-strategy-terminal]")).toContain("$500");
	});
	it("distinguishes covering stock from an uncovered call on the same spot and scale", () => {
		lab();
		fireEvent.click(screen.getByRole("tab", { name: /Explore expiration/ }));
		click("Shared range");
		change("Expiry stock price", "14000");
		change("Strategy example", "covered");
		expect(read("[data-strategy-profit]")).toContain("$1,200");
		change("Strategy example", "uncovered");
		expect(read("[data-strategy-profit]")).toContain("−$2,800");
		expect(screen.getByText(/Loss keeps growing/)).toBeTruthy();
	});
	it("plays roll records and stops when the native timeline is grabbed", () => {
		vi.useFakeTimers();
		lab();
		fireEvent.click(screen.getByRole("tab", { name: /Close, then open/ }));
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-roll-old]")).toContain("0");
		expect(read("[data-roll-cash]")).toBe("$500");
		fireEvent.pointerDown(screen.getByLabelText("Roll replay timeline"));
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-roll-new]")).toContain("0");
		change("Roll step", "2");
		expect(read("[data-roll-cash]")).toBe("−$200");
		expect(read("[data-roll-new]")).toContain("1");
		click("Reset scene");
		expect(read("[data-roll-cash]")).toBe("$0");
	});
	it("supports Chinese controls and missing or mismatched data", () => {
		const page = render(<StrategyConceptLab locale="zh" data={data} />);
		click("仅一个持仓");
		expect(read("[data-strategy-identity]")).toBe("无法确定");
		page.rerender(<StrategyConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
		page.rerender(
			<StrategyConceptLab locale="en" data={activityConceptData} />,
		);
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
	});
	it("preserves version 2 grading and the authorized Learn boundary", () => {
		const scenario = getLessonScenarios("option-strategies")[0];
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
		const view = projectAttempt(scenario, state, "strategy-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		click("One position only");
		expect(onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
		const next = projectAttempt(
			scenario,
			transitionAttempt(scenario, state, { type: "continue" }),
			"strategy-test",
			1,
		);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		expect(
			scenario.steps[1].questions.map((q) => ({
				id: q.id,
				accepted: q.accepted,
			})),
		).toEqual([
			{ id: "spread-profit", accepted: ["500"] },
			{ id: "isolated", accepted: ["cannot"] },
		]);
		expect(
			previewLearningImpl({
				lessonId: "option-strategies",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
