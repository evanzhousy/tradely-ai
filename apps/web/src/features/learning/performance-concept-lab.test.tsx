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
import { performanceConceptData as data } from "@/content/units/performance-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	attributionTotal,
	benchmarkDifferences,
	closedTradeStats,
	flowReturns,
} from "@/domain/learning/performance-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { PerformanceConceptLab } from "./performance-concept-lab";

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
const lab = () => render(<PerformanceConceptLab locale="en" data={data} />);
it("chains flow-separated returns and withholds missing or zero-base periods", () => {
	expect(flowReturns(100000, 110000, 90000, 210000).twr).toBeCloseTo(0.155);
	expect(flowReturns(100000, 110000, 0, 210000).twr).toBeCloseTo(1.1);
	expect(flowReturns(100000, 110000, 150000, 210000).twr).toBeCloseTo(
		-0.11153846,
	);
	expect(flowReturns(100000, null, 90000, 210000)).toMatchObject({
		first: null,
		second: null,
		twr: null,
		growth: 1.1,
	});
	expect(flowReturns(100000, 110000, -110000, 210000).twr).toBeNull();
	expect(flowReturns(0, 110000, 90000, 210000).twr).toBeNull();
});
it("keeps the loss size and missing outcome in the metric contract", () => {
	expect(closedTradeStats(data.trades)).toMatchObject({
		winRate: 0.8,
		total: -2000,
		profitFactor: 0.8,
		averageWin: 2000,
		averageLoss: 10000,
	});
	const rows = (v: number | null) =>
		data.trades.map((t, i) => ({ ...t, pnlCents: i === 4 ? v : t.pnlCents }));
	expect(closedTradeStats(rows(-5000))).toMatchObject({
		total: 3000,
		profitFactor: 1.6,
		winRate: 0.8,
	});
	expect(closedTradeStats(rows(0))).toMatchObject({
		total: 8000,
		profitFactor: null,
		averageLoss: null,
		winRate: 0.8,
	});
	expect(closedTradeStats(rows(null))).toMatchObject({
		total: null,
		profitFactor: null,
		winRate: null,
		subtotal: 8000,
		knownCount: 4,
	});
	expect(closedTradeStats([...data.trades, data.trades[0]]).total).toBeNull();
});
it("detects method mismatches and separates subtotal from complete attribution", () => {
	expect(benchmarkDifferences(data.flow.spec, data.benchmarks[0].spec)).toEqual(
		[],
	);
	for (const b of data.benchmarks.slice(1, 5))
		expect(benchmarkDifferences(data.flow.spec, b.spec)).toHaveLength(1);
	expect(attributionTotal(data.attribution)).toMatchObject({
		subtotal: -2000,
		total: null,
	});
	expect(attributionTotal(data.completeAttribution)).toMatchObject({
		subtotal: 3000,
		total: 3000,
	});
});
it("stops replay on input and keeps raw growth when boundary evidence is missing", () => {
	vi.useFakeTimers();
	lab();
	expect(read("[data-performance-twr]")).toBe("TWR: 15.5%");
	fireEvent.click(screen.getByRole("button", { name: "Play explanation" }));
	act(() => vi.advanceTimersByTime(1200));
	expect(read("[data-performance-twr]")).toBe("TWR: 110%");
	change("Hypothetical external flow", "150000");
	act(() => vi.advanceTimersByTime(6000));
	expect(read("[data-performance-twr]")).toBe("TWR: -11.15%");
	change("Boundary valuation evidence", "missing");
	expect(read("[data-performance-twr]")).toBe("TWR: —");
	expect(screen.getByText("Raw balance growth: 110%")).toBeTruthy();
});
it("updates payoff and evidence scenes without inventing missing totals", () => {
	lab();
	fireEvent.click(screen.getByRole("tab", { name: /Inspect the payoff/ }));
	change("Fifth lot loss", "0");
	expect(read("[data-performance-trades]")).toContain("Profit factor: —");
	change("Closed-lot coverage", "missing");
	expect(read("[data-performance-trades]")).toContain("Total P&L: —");
	fireEvent.click(screen.getByRole("tab", { name: /Check comparison/ }));
	expect(read("[data-performance-comparison]")).toContain(
		"5.5 percentage points",
	);
	for (const id of ["dates", "currency", "fees", "price", "missing"]) {
		change("Benchmark record", id);
		expect(read("[data-performance-comparison]")).toContain("difference: —");
	}
	change("Symbol attribution coverage", "complete");
	expect(read("[data-performance-attribution]")).toContain("total: $30");
});
it("preserves version 2 grading and the public Learn boundary", () => {
	const scenario = getLessonScenarios("portfolio-performance")[0];
	let state = initialAttemptState();
	const props = {
		locale: "en" as const,
		busy: false,
		error: null,
		onOpen: vi.fn(),
		onRecover: vi.fn(),
		onAction: vi.fn(),
	};
	const view = projectAttempt(scenario, state, "performance-test", 0);
	expect(view.step.conceptData).toEqual(data);
	const page = render(<LearningScreen {...props} view={view} />);
	change("Hypothetical external flow", "0");
	expect(props.onAction).not.toHaveBeenCalled();
	fireEvent.click(screen.getByRole("button", { name: "Continue to practice" }));
	expect(props.onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
	state = transitionAttempt(scenario, state, { type: "continue" });
	const next = projectAttempt(scenario, state, "performance-test", 1);
	page.rerender(<LearningScreen {...props} view={next} />);
	expect(next.step.conceptData).toBeUndefined();
	expect(scenario.version).toBe(2);
	for (const [questionId, value] of [
		["twr", "15.5"],
		["factor", "0.8"],
	])
		state = transitionAttempt(scenario, state, {
			type: "respond",
			questionId,
			value,
		});
	state = transitionAttempt(scenario, state, { type: "submit" });
	expect(
		projectAttempt(scenario, state, "performance-test", 2).feedback.map(
			(f) => f.met,
		),
	).toEqual([true, true]);
	expect(
		previewLearningImpl({
			lessonId: "portfolio-performance",
			variant: 0,
			actions: [],
		}),
	).toMatchObject({ ok: true, view: { result: null } });
});
