// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
import { PayoffConceptLab } from "./payoff-concept-lab";
import {
	expirationOutcome,
	intrinsicCents,
	moneyness,
	premiumAmounts,
	premiumExamples,
	valueParts,
} from "./payoff-concept-model";
import {
	ExpirationProfitScene,
	PremiumUnitsScene,
	ValuePartsScene,
} from "./payoff-concept-scenes";

beforeEach(() =>
	vi.stubGlobal("matchMedia", () => ({
		matches: true,
		addEventListener: () => {},
		removeEventListener: () => {},
	})),
);
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe("premium and payoff concept lesson", () => {
	it("preserves an ITM loss and limits an OTM buyer's loss to the paid premium before fees", () => {
		expect(expirationOutcome("CALL", 10200, 300, 2)).toEqual({
			intrinsic: 200,
			payoff: 40000,
			premium: 60000,
			profit: -20000,
			breakEven: 10300,
			moneyness: "ITM",
		});
		expect(expirationOutcome("PUT", 9800, 300, 2)).toMatchObject({
			payoff: 40000,
			profit: -20000,
			breakEven: 9700,
			moneyness: "ITM",
		});
		expect(expirationOutcome("CALL", 9000, 300, 2)).toMatchObject({
			payoff: 0,
			profit: -60000,
			moneyness: "OTM",
		});
		expect(expirationOutcome("PUT", 11000, 300, 2)).toMatchObject({
			payoff: 0,
			profit: -60000,
			moneyness: "OTM",
		});
		expect(moneyness("CALL", 10000)).toBe("ATM");
	});
	it("keeps cent arithmetic and break-even consistent across both option types and quantity", () => {
		for (const type of ["CALL", "PUT"] as const)
			for (const paid of [100, 125, 300, 475, 600])
				for (const count of [1, 2, 3]) {
					const breakEven = expirationOutcome(
						type,
						10000,
						paid,
						count,
					).breakEven;
					expect(expirationOutcome(type, breakEven, paid, count).profit).toBe(
						0,
					);
					for (const spot of [8500, 9750, 10000, 10200, 10725, 11500]) {
						const result = expirationOutcome(type, spot, paid, count);
						expect(result.payoff).toBeGreaterThanOrEqual(0);
						expect(result.profit + result.premium).toBe(result.payoff);
						expect(result.profit).toBeGreaterThanOrEqual(-result.premium);
						expect(Number.isInteger(result.profit)).toBe(true);
					}
				}
	});
	it("uses only authored premiums and separates the expiry comparison from market-price prediction", () => {
		for (const type of ["CALL", "PUT"] as const)
			for (const example of premiumExamples) {
				const before = valueParts(type, example, false);
				const expiry = valueParts(type, example, true);
				expect(before.value).toBe(example[type]);
				expect(before.extrinsic).toBeGreaterThanOrEqual(0);
				expect(before.intrinsic + before.extrinsic).toBe(before.value);
				expect(expiry).toEqual({
					intrinsic: intrinsicCents(type, example.spotCents),
					extrinsic: 0,
					value: intrinsicCents(type, example.spotCents),
				});
			}
	});
	it("changes purchase premium without changing entry notional until quantity changes", () => {
		const { container } = render(<PremiumUnitsScene locale="en" />);
		fireEvent.change(
			screen.getByRole("slider", { name: "Option price per share" }),
			{ target: { value: "425" } },
		);
		expect(container.querySelector("[data-total-premium]")?.textContent).toBe(
			"$850",
		);
		expect(
			container.querySelector("[data-entry-notional]")?.textContent,
		).toContain("$20,000");
		fireEvent.change(
			screen.getByRole("slider", { name: "Contract quantity" }),
			{ target: { value: "3" } },
		);
		expect(container.querySelector("[data-total-premium]")?.textContent).toBe(
			"$1,275",
		);
		expect(premiumAmounts(425, 3)).toEqual({
			perContract: 42500,
			total: 127500,
			notional: 3000000,
		});
	});
	it("updates the value decomposition at the same spot for Call, Put and expiry", () => {
		const { container } = render(<ValuePartsScene locale="en" />);
		const parts = () =>
			container.querySelector("[data-value-parts]")?.textContent;
		expect(parts()).toBe("$4.00 + $1.50 = $5.50");
		fireEvent.click(screen.getByRole("button", { name: "At expiry" }));
		expect(parts()).toBe("$4.00 + $0.00 = $4.00");
		fireEvent.click(screen.getByRole("button", { name: "Put" }));
		expect(parts()).toBe("$0.00 + $0.00 = $0.00");
		fireEvent.click(screen.getByRole("button", { name: "Before expiry" }));
		expect(parts()).toBe("$0.00 + $1.50 = $1.50");
		expect(
			(
				screen.getByLabelText(
					"Supplied stock-price example",
				) as HTMLSelectElement
			).value,
		).toBe("2");
	});
	it("moves through loss, break-even and profit and keeps per-share curves independent of quantity", () => {
		const { container } = render(<ExpirationProfitScene locale="en" />);
		const profit = () =>
			container.querySelector("[data-expiration-profit]")?.textContent;
		const chart = () =>
			container
				.querySelector('[data-payoff-curve="profit"]')
				?.getAttribute("d");
		expect(profit()).toBe("−$200");
		fireEvent.change(
			screen.getByRole("slider", { name: "Expiration stock price" }),
			{ target: { value: "10300" } },
		);
		expect(profit()).toBe("$0");
		fireEvent.change(
			screen.getByRole("slider", { name: "Expiration stock price" }),
			{ target: { value: "10400" } },
		);
		expect(profit()).toBe("$200");
		const perShareCurve = chart();
		fireEvent.change(
			screen.getByRole("slider", { name: "Contract quantity" }),
			{ target: { value: "3" } },
		);
		expect(profit()).toBe("$300");
		expect(chart()).toBe(perShareCurve);
		expect(container.querySelector("[data-break-even]")?.textContent).toContain(
			"$103.00",
		);
	});
	it("shifts break-even with paid premium and correctly reverses the put example", () => {
		const { container } = render(<ExpirationProfitScene locale="en" />);
		const payoffCurve = container
			.querySelector('[data-payoff-curve="payoff"]')
			?.getAttribute("d");
		fireEvent.change(
			screen.getByRole("slider", { name: "Premium paid per share" }),
			{ target: { value: "600" } },
		);
		expect(container.querySelector("[data-break-even]")?.textContent).toContain(
			"$106.00",
		);
		expect(
			container
				.querySelector('[data-payoff-curve="payoff"]')
				?.getAttribute("d"),
		).toBe(payoffCurve);
		fireEvent.click(screen.getByRole("button", { name: "Find break-even" }));
		expect(
			container.querySelector("[data-expiration-profit]")?.textContent,
		).toBe("$0");
		fireEvent.click(screen.getByRole("button", { name: "Put" }));
		fireEvent.click(screen.getByRole("button", { name: "Show an ITM loss" }));
		expect(
			container.querySelector("[data-expiration-profit]")?.textContent,
		).toBe("−$200");
		expect(
			container.querySelector("[data-expiration-spot]")?.textContent,
		).toContain("$98.00");
		fireEvent.click(screen.getByRole("button", { name: "Find break-even" }));
		expect(container.querySelector("[data-break-even]")?.textContent).toContain(
			"$97.00",
		);
		expect(
			container.querySelector("[data-expiration-profit]")?.textContent,
		).toBe("$0");
	});
	it("provides Chinese controls and resets the chart to the worked example", () => {
		const { container } = render(<PayoffConceptLab locale="zh" />);
		fireEvent.click(screen.getByRole("tab", { name: /价值 \/ 盈亏/ }));
		fireEvent.click(screen.getByRole("button", { name: "找到盈亏平衡点" }));
		expect(
			container.querySelector("[data-expiration-profit]")?.textContent,
		).toBe("$0");
		fireEvent.click(screen.getByRole("button", { name: "重置场景" }));
		expect(
			container.querySelector("[data-expiration-profit]")?.textContent,
		).toBe("−$200");
		expect(screen.getByRole("slider", { name: "到期股价" })).toBeTruthy();
	});
	it("keeps the new lab in Learn and leaves version 2 grading and reference notes intact", () => {
		const scenario = getLessonScenarios("premium-payoff")[0];
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
				view={projectAttempt(scenario, state, "payoff-test", 0)}
			/>,
		);
		fireEvent.click(screen.getByRole("tab", { name: /Payoff \/ profit/ }));
		fireEvent.click(screen.getByRole("button", { name: "Find break-even" }));
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
					"payoff-test",
					1,
				)}
			/>,
		);
		expect(
			screen.queryByRole("region", {
				name: "Interactive premium and payoff lesson",
			}),
		).toBeNull();
		expect(screen.getByText("Total premium paid?")).toBeTruthy();
		expect(scenario.version).toBe(2);
		expect(
			scenario.steps[1].questions.map((q) => ({
				id: q.id,
				accepted: q.accepted,
			})),
		).toEqual([
			{ id: "premium", accepted: ["600"] },
			{ id: "profit", accepted: ["-200"] },
		]);
		expect(scenario.steps.slice(1).every((step) => !step.conceptLab)).toBe(
			true,
		);
		expect(getLessonBody("premium-payoff")).toContain("Underlying notional");
	});
});
