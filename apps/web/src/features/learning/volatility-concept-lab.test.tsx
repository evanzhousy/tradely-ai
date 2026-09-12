// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start/server-only", () => ({}));

import { getLessonScenarios } from "@/content/scenarios/index.server";
import { timeVolRateConceptData } from "@/content/units/time-vol-rate-concept.server";
import { volatilityConceptData as data } from "@/content/units/volatility-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	compareVolatility,
	inferAtmIv,
	priceAtmCall,
	realizedVolatility,
} from "@/domain/learning/volatility-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { VolatilityConceptLab } from "./volatility-concept-lab";

beforeEach(() =>
	vi.stubGlobal("matchMedia", () => ({
		matches: true,
		addEventListener() {},
		removeEventListener() {},
	})),
);
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});
const read = (selector: string) =>
	document.querySelector(selector)?.textContent;
const change = (name: string, value: string) =>
	fireEvent.change(screen.getByLabelText(name), { target: { value } });
const click = (name: string) =>
	fireEvent.click(screen.getByRole("button", { name }));
const tab = (name: RegExp) =>
	fireEvent.click(screen.getByRole("tab", { name }));
const lab = () => render(<VolatilityConceptLab locale="en" data={data} />);

describe("implied and realized volatility SVG lesson", () => {
	it("matches independent Python math.erf price benchmarks to much less than one cent", () => {
		for (const [days, iv, expectedCents] of [
			[30, 20, 228.7150628044969],
			[15, 40, 323.4076455685251],
			[60, 80, 1288.3350566075794],
		])
			expect(
				Math.abs((priceAtmCall(10000, days, iv) as number) - expectedCents),
			).toBeLessThan(0.002);
		expect(priceAtmCall(10000, 30, 0)).toBe(0);
		for (const days of data.model.days)
			for (const iv of data.model.ivRange)
				expect(
					priceAtmCall(data.model.spotCents, days, iv),
				).toBeLessThanOrEqual(data.model.priceCeilingCents);
	});
	it("inverts price under the stated assumptions and responds to price source and maturity", () => {
		for (const days of data.model.days)
			for (const quote of data.model.prices.filter((p) => p.cents !== null)) {
				const iv = inferAtmIv(10000, days, quote.cents, data.model.ivRange);
				expect(iv).not.toBeNull();
				expect(priceAtmCall(10000, days, iv as number)).toBeCloseTo(
					quote.cents as number,
					7,
				);
				expect(
					Math.abs(
						(priceAtmCall(
							10000,
							days,
							Math.round((iv as number) * 100) / 100,
						) as number) - (quote.cents as number),
					),
				).toBeLessThan(0.5);
			}
		expect(inferAtmIv(10000, 30, 252, data.model.ivRange)).toBeGreaterThan(
			inferAtmIv(10000, 30, 228, data.model.ivRange) as number,
		);
		expect(inferAtmIv(10000, 60, 240, data.model.ivRange)).toBeLessThan(
			inferAtmIv(10000, 30, 240, data.model.ivRange) as number,
		);
	});
	it("rejects missing prices, invalid terms and targets outside the search interval", () => {
		expect(inferAtmIv(10000, 30, 0, [0, 80])).toBe(0);
		for (const price of [null, -1, Number.POSITIVE_INFINITY, 9000])
			expect(inferAtmIv(10000, 30, price, [0, 80])).toBeNull();
		expect(inferAtmIv(10000, 0, 0, [0, 80])).toBeNull();
		expect(inferAtmIv(10000, 30, 240, [80, 0])).toBeNull();
		expect(priceAtmCall(0, 30, 20)).toBeNull();
		expect(priceAtmCall(10000, 30, Number.NaN)).toBeNull();
		expect(priceAtmCall(10000, 30, -1)).toBeNull();
	});
	it("uses sample variance, compounding and frequency-matched annualization", () => {
		const returns = data.returns.values.map((r) => r.percent);
		expect(realizedVolatility(returns, 1, 252)?.annualized).toBeCloseTo(
			21.213203435596427,
			8,
		);
		expect(
			realizedVolatility(returns.slice(-4), 1, 252)?.annualized,
		).toBeCloseTo(14.49137674618944, 8);
		const coarse = realizedVolatility(returns, 2, 252);
		expect(coarse?.sampled[0]).toBeCloseTo(-0.01, 10);
		expect(coarse?.periodsPerYear).toBe(126);
		expect(coarse?.annualized).toBeCloseTo(0.1866731769697349, 8);
		expect(
			realizedVolatility(returns.slice(-4), 2, 252)?.annualized,
		).toBeCloseTo(0.05952940449881455, 8);
		for (const window of data.returns.windows)
			for (const last of data.returns.changeRange)
				for (const sample of [1, 2] as const) {
					const inputs = returns.slice(-window);
					inputs[inputs.length - 1] = last;
					for (const value of realizedVolatility(inputs, sample, 252)
						?.sampled ?? [])
						expect(Math.abs(value as number)).toBeLessThanOrEqual(
							data.returns.chartLimit,
						);
				}
	});
	it("preserves zero dispersion and missing observations instead of dropping them", () => {
		expect(realizedVolatility([1, 1, 1, 1], 1, 252)).toMatchObject({
			mean: 1,
			standardDeviation: 0,
			annualized: 0,
		});
		expect(realizedVolatility([1, null, 1, -1], 2, 252)).toMatchObject({
			sampled: [null, expect.any(Number)],
			annualized: null,
		});
		expect(realizedVolatility([1], 1, 252)?.annualized).toBeNull();
		expect(realizedVolatility([], 1, 252)?.annualized).toBeNull();
		expect(realizedVolatility([1, 2, 3], 2, 252)).toBeNull();
		expect(realizedVolatility([1, -101], 1, 252)?.annualized).toBeNull();
		expect(realizedVolatility([1, 2], 0 as 1, 252)).toBeNull();
		expect(realizedVolatility([1, 2], 1, 0)).toBeNull();
	});
	it("distinguishes points from relative percentages and rejects incomplete pair definitions", () => {
		expect(compareVolatility(data.pairs[0])).toEqual({
			issue: null,
			points: 6,
			relativePercent: 25,
		});
		expect(compareVolatility(data.pairs[1]).points).toBe(-4);
		for (const [index, issue] of [
			[2, "missing"],
			[3, "identity"],
			[4, "date"],
			[5, "definition"],
			[6, "definition"],
		] as const)
			expect(compareVolatility(data.pairs[index])).toMatchObject({
				issue,
				points: null,
				relativePercent: null,
			});
		expect(
			compareVolatility({
				...data.pairs[0],
				rv: { ...data.pairs[0].rv, value: 0 },
			}),
		).toMatchObject({ points: 30, relativePercent: null });
		expect(
			compareVolatility({
				...data.pairs[0],
				rv: { ...data.pairs[0].rv, annualized: false },
			}).issue,
		).toBe("definition");
		expect(
			compareVolatility({
				...data.pairs[0],
				rv: { ...data.pairs[0].rv, periodsPerYear: 365 },
			}).issue,
		).toBe("definition");
	});
	it("fits the price in the UI and does not infer IV from an absent price", () => {
		lab();
		click("Fit IV to this price");
		expect(read("[data-vol-model-price]")).toBe("Model price$2.40");
		expect(read("[data-vol-fit-status]")).toBe(
			"Matches to the supplied cent precision",
		);
		change("Price input", "bid");
		click("Fit IV to this price");
		expect(read("[data-vol-model-price]")).toBe("Model price$2.28");
		change("Assumed calendar days to expiry", "60");
		click("Fit IV to this price");
		expect(read("[data-vol-model-price]")).toBe("Model price$2.28");
		change("Price input", "missing");
		expect(
			(
				screen.getByRole("button", {
					name: "Fit IV to this price",
				}) as HTMLButtonElement
			).disabled,
		).toBe(true);
		expect(read("[data-vol-fit-status]")).toContain("cannot be inferred");
	});
	it("changes the realized estimator's window and sampling while retaining missingness", () => {
		lab();
		tab(/Measure past returns/);
		expect(read("[data-vol-rv]")).toBe("21.2132%");
		change("Lookback window", "4");
		expect(read("[data-vol-rv]")).toBe("14.4914%");
		change("Sampling interval", "2");
		expect(read("[data-vol-rv]")).toBe("0.0595%");
		change("Return coverage", "missing");
		expect(read("[data-vol-rv]")).toBe("—");
		expect(
			(screen.getByLabelText("Drag final daily return") as HTMLInputElement)
				.disabled,
		).toBe(true);
		click("Reset scene");
		expect(read("[data-vol-rv]")).toBe("21.2132%");
	});
	it("does not initialize a missing authored final return as zero", () => {
		const missing = {
			...data,
			returns: {
				...data.returns,
				values: data.returns.values.map((r, i) =>
					i === data.returns.values.length - 1 ? { ...r, percent: null } : r,
				),
			},
		};
		render(<VolatilityConceptLab locale="en" data={missing} />);
		tab(/Measure past returns/);
		expect(read("[data-vol-rv]")).toBe("—");
	});
	it("keeps unspecified historical volatility separate from the required RV20", () => {
		lab();
		tab(/Compare the horizons/);
		expect(read("[data-vol-spread]")).toBe("+6");
		expect(read("[data-vol-relative]")).toContain("+25");
		change("Reference comparison", "negative");
		expect(read("[data-vol-spread]")).toBe("−4");
		change("Reference comparison", "definition");
		expect(read("[data-vol-spread]")).toBe("—");
		expect(
			document.querySelector('[role="tabpanel"] svg')?.textContent,
		).toContain("Historical vol");
		change("Reference comparison", "sampling");
		expect(read("[data-vol-spread]")).toBe("—");
		expect(
			screen.getByText(/Sampling and estimator not supplied/),
		).toBeTruthy();
		change("Reference comparison", "identity");
		expect(read("[data-vol-comparison-status]")).toBe(
			"Underlying identities differ",
		);
	});
	it("supports Chinese and rejects missing or mismatched teaching data", () => {
		const page = render(<VolatilityConceptLab locale="zh" data={data} />);
		click("拟合此价格的 IV");
		expect(read("[data-vol-model-price]")).toBe("模型价格$2.40");
		page.rerender(<VolatilityConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
		page.rerender(
			<VolatilityConceptLab locale="en" data={timeVolRateConceptData} />,
		);
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
	});
	it("preserves grading version 2 and the authorized Learn projection", () => {
		const scenario = getLessonScenarios("implied-realized-volatility")[0];
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
		const view = projectAttempt(scenario, state, "vol-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		click("Fit IV to this price");
		expect(onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
		let nextState = transitionAttempt(scenario, state, { type: "continue" });
		const next = projectAttempt(scenario, nextState, "vol-test", 1);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		nextState = transitionAttempt(scenario, nextState, {
			type: "respond",
			questionId: "spread",
			value: "8",
		});
		nextState = transitionAttempt(scenario, nextState, {
			type: "answer",
			questionId: "interpretation",
			choiceId: "context",
		});
		nextState = transitionAttempt(scenario, nextState, { type: "submit" });
		expect(
			projectAttempt(scenario, nextState, "vol-test", 2).feedback.map(
				(f) => f.met,
			),
		).toEqual([true, true]);
		expect(
			previewLearningImpl({
				lessonId: "implied-realized-volatility",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
