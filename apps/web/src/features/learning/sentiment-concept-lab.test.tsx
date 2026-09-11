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
import { sentimentConceptData as data } from "@/content/units/sentiment-concept.server";
import { sideConceptData } from "@/content/units/side-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	classifyFlow,
	evaluateFlowEvidence,
	putBuyInventory,
} from "@/domain/learning/sentiment-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { SentimentConceptLab } from "./sentiment-concept-lab";

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
const lab = () => render(<SentimentConceptLab locale="en" data={data} />);
describe("flow sentiment teaching lab", () => {
	it("maps every option/action combination from the likely aggressor's perspective", () => {
		expect(
			data.combinations.map((p) => classifyFlow(p.option, p.aggressor)),
		).toEqual(["bullish", "bearish", "bearish", "bullish"]);
		expect(classifyFlow("CALL", null)).toBe("indeterminate");
		expect(classifyFlow("PUT", null)).toBe("indeterminate");
	});
	it("requires a usable reference and keeps uncertain evidence indeterminate", () => {
		const outcomes = data.evidence.map((e) =>
			evaluateFlowEvidence(`${data.contractBase} PUT`, "PUT", e),
		);
		expect(outcomes.map((o) => o.sentiment)).toEqual([
			"bearish",
			"bullish",
			"indeterminate",
			"indeterminate",
			"indeterminate",
			"indeterminate",
		]);
		expect(outcomes.map((o) => o.aggressor)).toEqual([
			"buy",
			"sell",
			null,
			null,
			null,
			null,
		]);
		expect(outcomes.map((o) => o.issue)).toEqual([
			null,
			null,
			null,
			"stale",
			"missing",
			"complex",
		]);
		expect(
			evaluateFlowEvidence("another contract", "PUT", data.evidence[0])
				.sentiment,
		).toBe("indeterminate");
	});
	it("preserves missing inventory and distinguishes protection from closing a short", () => {
		expect(putBuyInventory(data.contexts[0], 10, true)).toEqual({
			shares: null,
			puts: null,
		});
		expect(putBuyInventory(data.contexts[1], 10, false)).toEqual({
			shares: 1000,
			puts: 0,
		});
		expect(putBuyInventory(data.contexts[1], 10, true)).toEqual({
			shares: 1000,
			puts: 10,
		});
		expect(putBuyInventory(data.contexts[2], 10, true)).toEqual({
			shares: null,
			puts: 0,
		});
	});
	it("links matrix controls, plays all four mappings, and stops when edited", () => {
		vi.useFakeTimers();
		lab();
		expect(read("[data-matrix-sentiment]")).toBe("Bullish flow");
		click("Put");
		expect(read("[data-matrix-sentiment]")).toBe("Bearish flow");
		click("Selling");
		expect(read("[data-matrix-sentiment]")).toBe("Bullish flow");
		click("Reset scene");
		click("Play explanation");
		for (const label of ["Bearish flow", "Bearish flow", "Bullish flow"]) {
			act(() => vi.advanceTimersByTime(1200));
			expect(read("[data-matrix-sentiment]")).toBe(label);
		}
		act(() => vi.advanceTimersByTime(1200));
		expect(
			screen.getByRole("button", { name: "Play explanation" }),
		).toBeTruthy();
		click("Play explanation");
		click("Put");
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-matrix-sentiment]")).toBe("Bearish flow");
		expect(read("[data-counterparty-perspective]")).toContain(
			"does not create a second print",
		);
	});
	it("teaches neutral as uncertainty without implying a flat view or neutral portfolio", () => {
		lab();
		fireEvent.click(
			screen.getByRole("tab", { name: /When direction is unknown/ }),
		);
		expect(read("[data-flow-sentiment]")).toBe("Bearish flow");
		change("Execution evidence", "inside");
		expect(read("[data-flow-aggressor]")).toBe("Unknown");
		expect(read("[data-flow-sentiment]")).toBe("Indeterminate");
		click("Expects a flat market");
		expect(screen.getByRole("status").textContent).toContain(
			"does not say that",
		);
		click("Unknown direction");
		expect(screen.getByRole("status").textContent).toContain("Supported");
		change("Execution evidence", "stale");
		expect(screen.queryByRole("status")).toBeNull();
		expect(read("[data-flow-print]")).toBe("10 @ $3.20");
		change("Execution evidence", "bid");
		expect(read("[data-flow-sentiment]")).toBe("Bullish flow");
		expect(
			screen.queryByRole("button", { name: "Unknown direction" }),
		).toBeNull();
	});
	it("withholds direction for missing and complex evidence while retaining the recorded trade", () => {
		lab();
		fireEvent.click(
			screen.getByRole("tab", { name: /When direction is unknown/ }),
		);
		for (const id of ["missing", "complex"]) {
			change("Execution evidence", id);
			expect(read("[data-flow-sentiment]")).toBe("Indeterminate");
			expect(read("[data-flow-print]")).toBe("10 @ $3.20");
		}
	});
	it("replays different position contexts without changing the flow label or inventing missing shares", () => {
		lab();
		fireEvent.click(screen.getByRole("tab", { name: /Leg versus portfolio/ }));
		change("Position replay timeline", "2");
		expect(read("[data-scope-puts]")).toBe("—");
		change("Position context", "protection");
		expect(read("[data-scope-shares]")).toBe("1,000");
		expect(read("[data-scope-puts]")).toBe("10");
		const flow = read("[data-scope-flow]");
		change("Position context", "close");
		expect(read("[data-scope-puts]")).toBe("0");
		expect(read("[data-scope-shares]")).toBe("—");
		expect(read("[data-scope-flow]")).toBe(flow);
		change("Replay step", "0");
		expect(read("[data-scope-puts]")).toBe("—");
		expect(
			(screen.getByLabelText("Position replay timeline") as HTMLInputElement)
				.value,
		).toBe("0");
		click("Reset scene");
		expect(
			(screen.getByLabelText("Position context") as HTMLSelectElement).value,
		).toBe("unknown");
	});
	it("lets native timeline input interrupt playback and supports Chinese", () => {
		vi.useFakeTimers();
		render(<SentimentConceptLab locale="zh" data={data} />);
		fireEvent.click(screen.getByRole("tab", { name: /单腿与组合/ }));
		change("持仓背景", "protection");
		click("播放讲解");
		act(() => vi.advanceTimersByTime(1200));
		fireEvent.pointerDown(screen.getByLabelText("持仓回放时间轴"));
		act(() => vi.advanceTimersByTime(5000));
		expect(
			(screen.getByLabelText("持仓回放时间轴") as HTMLInputElement).value,
		).toBe("1");
		change("持仓回放时间轴", "2");
		expect(read("[data-scope-puts]")).toBe("10");
		click("重置场景");
		expect(read("[data-scope-puts]")).toBe("—");
	});
	it("rejects absent and mismatched paid teaching data", () => {
		const page = render(<SentimentConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
		page.rerender(<SentimentConceptLab locale="en" data={sideConceptData} />);
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
	});
	it("keeps exploration local, uses authorized Learn data, and preserves version 2 grading", () => {
		const scenario = getLessonScenarios("flow-sentiment")[0];
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
		const view = projectAttempt(scenario, state, "sentiment-test", 0);
		expect(view.step.conceptData).toEqual(data);
		expect(view.step.execution).toBeUndefined();
		const page = render(<LearningScreen {...props} view={view} />);
		click("Put");
		expect(onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
		const next = projectAttempt(
			scenario,
			transitionAttempt(scenario, state, { type: "continue" }),
			"sentiment-test",
			1,
		);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		expect(
			scenario.steps.slice(1).every((s) => !s.conceptData && !s.conceptLab),
		).toBe(true);
		expect(
			scenario.steps[1].questions.map((q) => ({
				id: q.id,
				accepted: q.accepted,
			})),
		).toEqual([
			{ id: "classification-0", accepted: ["bull"] },
			{ id: "classification-1", accepted: ["bear"] },
			{ id: "classification-2", accepted: ["bear"] },
			{ id: "classification-3", accepted: ["bull"] },
			{ id: "neutral", accepted: ["unknown"] },
			{ id: "portfolio", accepted: ["no"] },
		]);
		expect(
			previewLearningImpl({
				lessonId: "flow-sentiment",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
