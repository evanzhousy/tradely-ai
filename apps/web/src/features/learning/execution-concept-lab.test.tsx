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
import { executionConceptData as data } from "@/content/units/execution-concept.server";
import { quoteConceptData } from "@/content/units/quote-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	executionRoles,
	matchDisplayedBook,
} from "@/domain/learning/execution-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { ExecutionConceptLab } from "./execution-concept-lab";
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
const change = (name: string, value: string) =>
	fireEvent.change(screen.getByLabelText(name), { target: { value } });
const click = (name: string) =>
	fireEvent.click(screen.getByRole("button", { name }));
const lab = () => render(<ExecutionConceptLab locale="en" data={data} />);

describe("execution counterparties SVG lesson", () => {
	it("counts both parties as one execution and one traded quantity", () => {
		expect(executionRoles(data, "buy", false)).toMatchObject({
			prints: 0,
			volume: 0,
		});
		expect(executionRoles(data, "buy", true)).toEqual({
			buyer: "incoming",
			seller: "resting",
			price: 210,
			location: "ASK",
			prints: 1,
			volume: 10,
		});
		expect(executionRoles(data, "sell", true)).toEqual({
			buyer: "resting",
			seller: "incoming",
			price: 200,
			location: "BID",
			prints: 1,
			volume: 10,
		});
	});
	it("fills in price order without violating a buy or sell limit", () => {
		const buy = matchDisplayedBook([...data.asks].reverse(), "buy", 40, 210);
		expect(buy).toMatchObject({ filled: 30, unfilled: 10, average: 210 });
		expect(buy.rows.map((r) => r.filled)).toEqual([30, 0, 0]);
		expect(matchDisplayedBook(data.asks, "buy", 40, 215)).toMatchObject({
			filled: 40,
			unfilled: 0,
			average: 211.25,
		});
		expect(matchDisplayedBook(data.bids, "sell", 40, 195)).toMatchObject({
			filled: 40,
			unfilled: 0,
			average: 198.75,
		});
		expect(matchDisplayedBook(data.bids, "sell", 40, 200)).toMatchObject({
			filled: 30,
			unfilled: 10,
		});
	});
	it("keeps no-fill averages missing and cannot invent liquidity beyond the displayed book", () => {
		expect(matchDisplayedBook(data.asks, "buy", 40, 209)).toMatchObject({
			filled: 0,
			unfilled: 40,
			average: null,
		});
		expect(matchDisplayedBook(data.bids, "sell", 40, 201)).toMatchObject({
			filled: 0,
			unfilled: 40,
			average: null,
		});
		expect(matchDisplayedBook(data.asks, "buy", 100, null)).toMatchObject({
			filled: 90,
			unfilled: 10,
		});
		expect(matchDisplayedBook([], "buy", 40, null)).toMatchObject({
			filled: 0,
			unfilled: 40,
			average: null,
		});
		expect(matchDisplayedBook(data.asks, "buy", 0, null)).toMatchObject({
			filled: 0,
			unfilled: 0,
			average: null,
		});
	});
	it("shows how market and marketable limit instructions yield identical small fills", () => {
		const outcomes = data.records.map((r) =>
			matchDisplayedBook(data.asks, "buy", data.unitTradeSize, r.limit),
		);
		expect(
			outcomes.map((o) => ({ filled: o.filled, average: o.average })),
		).toEqual([
			{ filled: 10, average: 210 },
			{ filled: 10, average: 210 },
		]);
	});
	it("plays a single match, reverses the incoming side, and keeps put volume undoubled", () => {
		vi.useFakeTimers();
		lab();
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-execution-volume]")).toBe("0 contracts");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-execution-volume]")).toBe("10 contracts");
		expect(read("[data-execution-prints]")).toBe("1 print");
		click("Sell");
		click("Put");
		expect(read("[data-execution-aggressor]")).toContain("incoming seller");
		expect(read("[data-execution-volume]")).toBe("10 contracts");
		click("Play explanation");
		change("Match stage", "1");
		act(() => vi.advanceTimersByTime(5000));
		expect(read("[data-execution-volume]")).toBe("0 contracts");
		expect(
			screen.getByRole("button", { name: "Play explanation" }),
		).toBeTruthy();
	});
	it("updates partial fills directly and distinguishes an ineligible price from unused depth", () => {
		lab();
		fireEvent.click(screen.getByRole("tab", { name: /Limits & liquidity/ }));
		expect(read("[data-depth-total]")).toBe("30");
		expect(read("[data-depth-unfilled]")).toBe("10");
		change("Limit price", "215");
		expect(read("[data-depth-total]")).toBe("40");
		expect(read("[data-depth-average]")).toContain("$2.1125");
		expect(
			document
				.querySelector('[data-depth-price="215"]')
				?.getAttribute("data-depth-filled"),
		).toBe("10");
		change("Limit price", "200");
		expect(read("[data-depth-average]")).toContain("—");
		click("Market");
		change("Requested quantity", "100");
		expect(read("[data-depth-total]")).toBe("90");
		expect(read("[data-depth-unfilled]")).toBe("10");
		expect(screen.queryByLabelText("Limit price")).toBeNull();
		click("Limit");
		click("Sell");
		expect(
			(screen.getByLabelText("Limit price") as HTMLInputElement).value,
		).toBe("200");
		change("Limit price", "201");
		expect(read("[data-depth-total]")).toBe("0");
		click("Reset scene");
		expect(read("[data-depth-total]")).toBe("30");
		expect(read("[data-depth-unfilled]")).toBe("10");
	});
	it("requires additional evidence to establish the order instruction, and clears stale revelations", () => {
		lab();
		fireEvent.click(screen.getByRole("tab", { name: /What a print reveals/ }));
		const print = read("[data-evidence-print]");
		click("Market");
		expect(screen.getByRole("status").textContent).toContain(
			"Look at the evidence boundary",
		);
		click("Cannot tell");
		expect(screen.getByRole("status").textContent).toContain("Supported");
		click("Reveal order record");
		expect(read("[data-evidence-instruction]")).toBe("Buy limit");
		click("Example B");
		expect(read("[data-evidence-instruction]")).toBe("Unknown from print");
		expect(screen.queryByRole("status")).toBeNull();
		expect(read("[data-evidence-print]")).toBe(print);
		click("Reveal order record");
		expect(read("[data-evidence-instruction]")).toBe("Market buy");
		click("Hide order record");
		expect(read("[data-evidence-instruction]")).toBe("Unknown from print");
	});
	it("supports Chinese controls and selected-scene reset", () => {
		render(<ExecutionConceptLab locale="zh" data={data} />);
		fireEvent.click(screen.getByRole("tab", { name: /限价与流动性/ }));
		change("限价价格", "215");
		expect(read("[data-depth-total]")).toBe("40");
		click("重置场景");
		expect(read("[data-depth-total]")).toBe("30");
	});
	it("does not use missing or mismatched paid fixture data", () => {
		const page = render(<ExecutionConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
		page.rerender(<ExecutionConceptLab locale="en" data={quoteConceptData} />);
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		page.rerender(<QuoteConceptLab locale="en" data={data} />);
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
	});
	it("uses authorized Learn data without changing version 2 assessment answers or progress", () => {
		const scenario = getLessonScenarios("execution-counterparties")[0];
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
		const view = projectAttempt(scenario, state, "execution-test", 0);
		expect(view.step.conceptData).toEqual(data);
		expect(view.step.execution).toBeUndefined();
		const page = render(<LearningScreen {...props} view={view} />);
		click("Sell");
		expect(onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
		const next = projectAttempt(
			scenario,
			transitionAttempt(scenario, state, { type: "continue" }),
			"execution-test",
			1,
		);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
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
			{ id: "unfilled", accepted: ["10"] },
			{ id: "aggressor", accepted: ["buyer"] },
		]);
		expect(
			previewLearningImpl({
				lessonId: "execution-counterparties",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
