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
import { pnlConceptData as data } from "@/content/units/pnl-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	markedAccount,
	optionValuation,
	stockAccounting,
} from "@/domain/learning/pnl-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { PnlConceptLab } from "./pnl-concept-lab";

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
const lab = () => render(<PnlConceptLab locale="en" data={data} />);
describe("portfolio P&L SVG lesson", () => {
	it("separates closed and remaining amounts with explicit fee allocation", () => {
		const c = data.stockCases[0];
		expect(
			stockAccounting(c.lots, c.close, c.finalMark, "fifo", false),
		).toMatchObject({
			remaining: 60,
			value: 132000,
			realized: 12000,
			unrealized: 12000,
			total: 24000,
		});
		expect(
			stockAccounting(c.lots, c.close, c.finalMark, "fifo", true),
		).toMatchObject({
			closedCost: 80200,
			openCost: 120300,
			realized: 11500,
			unrealized: 11700,
			total: 23200,
		});
	});
	it("changes attribution without changing same-period total and follows lot timestamps", () => {
		const c = data.stockCases[1];
		expect(
			stockAccounting(
				[...c.lots].reverse(),
				c.close,
				c.finalMark,
				"fifo",
				false,
			),
		).toMatchObject({ realized: 150000, unrealized: -20000, total: 130000 });
		expect(
			stockAccounting(c.lots, c.close, c.finalMark, "average", false),
		).toMatchObject({ realized: 100000, unrealized: 30000, total: 130000 });
		expect(
			stockAccounting(c.lots, c.close, c.finalMark, "fifo", true)?.total,
		).toBe(128500);
		expect(
			stockAccounting(c.lots, c.close, c.finalMark, "average", true)?.total,
		).toBe(128500);
	});
	it("keeps partial availability and does not infer a short from an oversell", () => {
		const c = data.stockCases[0];
		expect(stockAccounting(c.lots, c.close, null, "fifo", false)).toMatchObject(
			{ value: null, realized: 12000, unrealized: null, total: null },
		);
		expect(
			stockAccounting(
				c.lots,
				{ ...c.close, quantity: 100 },
				null,
				"fifo",
				false,
			),
		).toMatchObject({ remaining: 0, value: 0, unrealized: 0 });
		expect(
			stockAccounting(
				c.lots,
				{ ...c.close, quantity: 101 },
				2200,
				"fifo",
				false,
			),
		).toBeNull();
		expect(
			stockAccounting(
				c.lots.map((l) => ({ ...l, feeCents: null })),
				{ ...c.close, feeCents: null },
				2200,
				"fifo",
				true,
			),
		).toMatchObject({
			value: 132000,
			realized: null,
			unrealized: null,
			grossRealized: 12000,
		});
	});
	it("adds cash flow to equity without changing trading P&L and withholds incomplete allocation", () => {
		const a = data.account;
		expect(
			markedAccount(
				{ ...a, stockQuantity: Number.MAX_VALUE },
				0,
				a.stockMark,
				a.optionMark,
			),
		).toBeNull();
		expect(markedAccount(a, 0, a.stockMark, a.optionMark)).toMatchObject({
			cash: 52000,
			equity: 234000,
			totalPnl: 34000,
		});
		expect(markedAccount(a, 50000, a.stockMark, a.optionMark)).toMatchObject({
			cash: 102000,
			equity: 284000,
			totalPnl: 34000,
		});
		expect(markedAccount(a, 50000, null, a.optionMark)).toMatchObject({
			cash: 102000,
			equity: null,
			totalPnl: null,
		});
	});
	it("preserves option signs multipliers and losses larger than received premium", () => {
		expect(optionValuation(2, 100, "long", 200, 300, 10000)).toMatchObject({
			openingCash: -40000,
			value: 60000,
			unrealized: 20000,
			notional: 2000000,
		});
		expect(optionValuation(2, 100, "short", 200, 1000, 10000)).toMatchObject({
			openingCash: 40000,
			value: -200000,
			unrealized: -160000,
			notional: 2000000,
		});
		expect(
			optionValuation(2, 100, "short", 200, null, 10000)?.value,
		).toBeNull();
		expect(optionValuation(0, 100, "short", 200, null, 10000)?.value).toBe(0);
	});
	it("links stock method fees and missing marks to the displayed amounts", () => {
		lab();
		expect(read("[data-pnl-realized]")).toBe("+$120");
		change("Fee treatment", "include");
		expect(read("[data-pnl-realized]")).toBe("+$115");
		expect(read("[data-pnl-unrealized]")).toBe("+$117");
		change("Supplied stock lots", "two");
		change("Fee treatment", "exclude");
		expect(read("[data-pnl-realized]")).toBe("+$1,500");
		change("Cost attribution", "average");
		expect(read("[data-pnl-realized]")).toBe("+$1,000");
		expect(read("[data-pnl-unrealized]")).toBe("+$300");
		expect(read("[data-pnl-total]")).toContain("+$1,300");
		change("Mark evidence", "missing");
		expect(read("[data-pnl-unrealized]")).toBe("—");
		expect(read("[data-pnl-realized]")).toBe("+$1,000");
	});
	it("plays checkpoints and stops on manual mark changes", () => {
		vi.useFakeTimers();
		lab();
		click("Play explanation");
		expect(read("[data-pnl-realized]")).toBe("$0");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-pnl-realized]")).toBe("+$120");
		expect(read("[data-pnl-unrealized]")).toBe("+$180");
		change("Hypothetical stock mark", "2200");
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-pnl-unrealized]")).toBe("+$120");
		expect(
			screen.getByRole("button", { name: "Play explanation" }),
		).toBeTruthy();
	});
	it("keeps reported buying power distinct from hypothetical cash changes", () => {
		lab();
		tab(/Separate cash and profit/);
		const buying = read("[data-pnl-buying-power]");
		change("Hypothetical cash deposit", "50000");
		expect(read("[data-pnl-equity]")).toBe("$2,840");
		expect(read("[data-pnl-account-profit]")).toContain("+$340");
		expect(read("[data-pnl-buying-power]")).toBe(buying);
		change("Missing mark scenario", "stock");
		expect(read("[data-pnl-equity]")).toBe("—");
		expect(read("[data-pnl-cash]")).toContain("$1,020");
	});
	it("supports native side controls and preserves known opening cash when marks are missing", () => {
		lab();
		tab(/Value a signed option position/);
		click("Uncovered short call");
		change("Hypothetical option mark", "1000");
		expect(read("[data-pnl-option-profit]")).toBe("−$1,600");
		expect(read("[data-pnl-option-cash]")).toBe("+$400");
		change("Option mark evidence", "missing");
		expect(read("[data-pnl-option-value]")).toBe("—");
		expect(read("[data-pnl-option-cash]")).toBe("+$400");
		click("Reset scene");
		expect(read("[data-pnl-option-profit]")).toBe("+$200");
	});
	it("supports Chinese and guards unavailable data", () => {
		const page = render(<PnlConceptLab locale="zh" data={data} />);
		change("费用处理", "include");
		expect(read("[data-pnl-realized]")).toBe("+$115");
		page.rerender(<PnlConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
	});
	it("preserves version 2 grading and the paid Learn boundary", () => {
		const scenario = getLessonScenarios("portfolio-pnl")[0];
		let state = initialAttemptState();
		const props = {
			locale: "en" as const,
			busy: false,
			error: null,
			onOpen: vi.fn(),
			onRecover: vi.fn(),
			onAction: vi.fn(),
		};
		const view = projectAttempt(scenario, state, "pnl-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		change("Fee treatment", "include");
		expect(props.onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(props.onAction).toHaveBeenCalledExactlyOnceWith({
			type: "continue",
		});
		state = transitionAttempt(scenario, state, { type: "continue" });
		const next = projectAttempt(scenario, state, "pnl-test", 1);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		for (const questionId of ["realized", "unrealized"])
			state = transitionAttempt(scenario, state, {
				type: "respond",
				questionId,
				value: "120",
			});
		state = transitionAttempt(scenario, state, { type: "submit" });
		expect(
			projectAttempt(scenario, state, "pnl-test", 2).feedback.map((f) => f.met),
		).toEqual([true, true]);
		expect(
			previewLearningImpl({
				lessonId: "portfolio-pnl",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
