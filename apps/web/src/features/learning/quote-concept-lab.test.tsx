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
import { quoteConceptData as data } from "@/content/units/quote-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	bestQuotes,
	bookOutcome,
	quoteMeasures,
	quoteMoney,
} from "@/domain/learning/quote-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { QuoteConceptLab } from "./quote-concept-lab";

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
describe("quotes, orders and trades teaching lab", () => {
	it("keeps exact half-cent midpoints and measures spreads in cents", () => {
		expect(quoteMeasures(200, 209)).toEqual({ spread: 9, midpoint: 204.5 });
		expect(quoteMoney(204.5)).toBe("$2.045");
	});
	it("requires confirmation, distinguishing an added order, a cancellation and a trade", () => {
		for (const event of ["add", "cancel", "trade"] as const)
			expect(bookOutcome(data, event, 10, false)).toEqual({
				askSize: 30,
				volume: 0,
				prints: 0,
				last: data.last,
			});
		expect(bookOutcome(data, "add", 10, true)).toMatchObject({
			askSize: 40,
			volume: 0,
			last: data.last,
		});
		expect(bookOutcome(data, "cancel", 10, true)).toMatchObject({
			askSize: 20,
			volume: 0,
			last: data.last,
		});
		expect(bookOutcome(data, "trade", 10, true)).toEqual({
			askSize: 20,
			volume: 10,
			prints: 1,
			last: { price: 210, at: data.outcomeAt },
		});
		expect(bookOutcome(data, "trade", 100, true).volume).toBe(10);
		expect(bookOutcome(data, "trade", 0, true).last).toEqual(data.last);
	});
	it("combines eligible venues, preserves ties and leaves missing prices unknown", () => {
		expect(bestQuotes(data.venues)).toMatchObject({
			bid: 200,
			ask: 210,
			bidVenues: ["B"],
			askVenues: ["C"],
			spread: 10,
		});
		expect(bestQuotes(data.venues.filter((v) => v.id !== "C"))).toMatchObject({
			ask: 212,
			askVenues: ["B"],
			spread: 12,
		});
		expect(bestQuotes([])).toBeNull();
		expect(
			bestQuotes([...data.venues, { ...data.venues[1], id: "D" }])?.bidVenues,
		).toEqual(["B", "D"]);
	});
	it("changes quote references without fabricating a new last trade and resets the scene", () => {
		render(<QuoteConceptLab locale="en" data={data} />);
		change("What-if ask price", "209");
		expect(read("[data-quote-midpoint]")).toBe("$2.045");
		change("Mark convention", "last");
		expect(read("[data-quote-mark]")).toContain("$2.08");
		change("What-if ask price", "230");
		expect(read("[data-quote-spread]")).toBe("$0.30");
		expect(read("[data-quote-mark]")).toContain("$2.08");
		fireEvent.click(screen.getByRole("button", { name: "Reset scene" }));
		expect(read("[data-quote-midpoint]")).toBe("$2.05");
	});
	it("plays supplied outcomes, pauses on direct edits and compares equal size decreases", () => {
		vi.useFakeTimers();
		render(<QuoteConceptLab locale="en" data={data} />);
		fireEvent.click(screen.getByRole("tab", { name: /Order → trade/ }));
		fireEvent.click(screen.getByRole("button", { name: "Play explanation" }));
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-book-ask]")).toBe("30 contracts");
		expect(read("[data-book-volume]")).toBe("0 contracts");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-book-ask]")).toBe("20 contracts");
		expect(read("[data-book-volume]")).toBe("0 contracts");
		fireEvent.click(screen.getByRole("button", { name: "Trade" }));
		expect(read("[data-book-ask]")).toBe("20 contracts");
		expect(read("[data-book-volume]")).toBe("10 contracts");
		expect(read("[data-book-last]")).toContain("$2.10");
		fireEvent.click(screen.getByRole("button", { name: "Play explanation" }));
		change("Order quantity", "5");
		act(() => vi.advanceTimersByTime(5000));
		expect(read("[data-book-volume]")).toBe("0 contracts");
		expect(
			screen.getByRole("button", { name: "Play explanation" }),
		).toBeTruthy();
	});
	it("changes eligibility independently from venue inspection in Chinese", () => {
		render(<QuoteConceptLab locale="zh" data={data} />);
		fireEvent.click(screen.getByRole("tab", { name: /跨场所比较/ }));
		fireEvent.click(screen.getByRole("button", { name: "B" }));
		expect(read("[data-best-ask]")).toBe("$2.10");
		change("报价资格", "stale");
		expect(read("[data-best-ask]")).toBe("$2.12");
		change("报价资格", "none");
		expect(read("[data-best-ask]")).toBe("—");
		expect(read("[data-best-spread]")).toContain("未知");
		fireEvent.click(screen.getByRole("button", { name: "重置场景" }));
		expect(read("[data-best-ask]")).toBe("$2.10");
	});
	it("does not ship a fallback fixture when authorized data is absent", () => {
		const { container } = render(<QuoteConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
		expect(container.querySelector("svg")).toBeNull();
	});
	it("projects authored data only into Learn and preserves the existing version 2 assessment", () => {
		const scenario = getLessonScenarios("quotes-orders-trades")[0];
		const state = initialAttemptState();
		const view = projectAttempt(scenario, state, "quotes-test", 0);
		const onAction = vi.fn();
		const props = {
			locale: "en" as const,
			busy: false,
			error: null,
			onOpen: vi.fn(),
			onRecover: vi.fn(),
			onAction,
		};
		const page = render(<LearningScreen {...props} view={view} />);
		expect(view.step.conceptData).toEqual(data);
		expect(view.step.execution).toBeUndefined();
		change("What-if ask price", "230");
		expect(onAction).not.toHaveBeenCalled();
		fireEvent.click(
			screen.getByRole("button", { name: "Continue to practice" }),
		);
		expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
		const practice = projectAttempt(
			scenario,
			transitionAttempt(scenario, state, { type: "continue" }),
			"quotes-test",
			1,
		);
		page.rerender(<LearningScreen {...props} view={practice} />);
		expect(practice.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		expect(
			scenario.steps.slice(1).every((s) => !s.conceptLab && !s.conceptData),
		).toBe(true);
		expect(
			scenario.steps[1].questions.map((q) => ({
				id: q.id,
				accepted: q.accepted,
			})),
		).toEqual([
			{ id: "midpoint", accepted: ["2.05"] },
			{ id: "event", accepted: ["quote"] },
		]);
		expect(
			previewLearningImpl({
				lessonId: "quotes-orders-trades",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
