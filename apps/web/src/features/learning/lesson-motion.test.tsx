// @vitest-environment jsdom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start/server-only", () => ({}));

import { getLessonScenarios } from "@/content/scenarios/index.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import { CalculationTrace } from "./calculation-trace";
import { LessonMotion, LessonReveal } from "./lesson-motion";
import { QuotePositionExplorer } from "./quote-position-explorer";
import { ResearchConnections } from "./research-connections";
import { UniverseExplorer } from "./universe-explorer";

let reduced = false;
let listeners: Set<() => void>;
beforeEach(() => {
	reduced = false;
	listeners = new Set();
	vi.stubGlobal("matchMedia", () => ({
		get matches() {
			return reduced;
		},
		addEventListener: (_event: string, callback: () => void) =>
			listeners.add(callback),
		removeEventListener: (_event: string, callback: () => void) =>
			listeners.delete(callback),
		addListener: () => {},
		removeListener: () => {},
	}));
});
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe("lesson presentation motion", () => {
	it("keeps initial content visible and disables incidental motion for keyboard and reduced-motion changes", async () => {
		const { container } = render(
			<LessonMotion>
				<LessonReveal>
					<button type="button">Inspect</button>
				</LessonReveal>
			</LessonMotion>,
		);
		const root = container.querySelector("[data-lesson-motion]");
		if (!root) throw new Error("Missing motion boundary");
		expect(root.getAttribute("data-lesson-motion")).toBe("off");
		expect(
			screen.getByRole("button", { name: "Inspect" }).parentElement?.style
				.opacity,
		).toBe("1");
		fireEvent.pointerDown(screen.getByRole("button", { name: "Inspect" }));
		await waitFor(() =>
			expect(root.getAttribute("data-lesson-motion")).toBe("on"),
		);
		fireEvent.keyDown(root, { key: "Tab" });
		expect(root.getAttribute("data-lesson-motion")).toBe("off");
		fireEvent.pointerDown(root);
		expect(root.getAttribute("data-lesson-motion")).toBe("on");
		reduced = true;
		fireEvent.pointerDown(root);
		expect(root.getAttribute("data-lesson-motion")).toBe("off");
		act(() => {
			reduced = true;
			for (const callback of listeners) callback();
		});
		expect(root.getAttribute("data-lesson-motion")).toBe("off");
	});
	it("reorders rows while preserving the focal observation and the fixed scenario", () => {
		const data = getLessonScenarios("rank-symbols")[0].steps[1].universe;
		if (!data) throw new Error("Missing universe");
		const original = JSON.stringify(data);
		const { container } = render(
			<LessonMotion>
				<UniverseExplorer data={data} locale="en" />
			</LessonMotion>,
		);
		fireEvent.click(screen.getByRole("button", { name: "OUTSIDE" }));
		expect(
			[...container.querySelectorAll("[data-rank-symbol]")].map((row) =>
				row.getAttribute("data-rank-symbol"),
			),
		).toEqual(["BETA", "GAMMA", "ALFA", "ZETA"]);
		fireEvent.click(
			screen.getByRole("button", {
				name: "Change peers; hold focal symbol fixed",
			}),
		);
		expect(
			[...container.querySelectorAll("[data-rank-symbol]")].map((row) =>
				row.getAttribute("data-rank-symbol"),
			),
		).toEqual(["ALFA", "ZETA", "GAMMA", "BETA"]);
		expect(container.querySelector("[data-focal-volume]")?.textContent).toBe(
			"1,000",
		);
		expect(JSON.stringify(data)).toBe(original);
	});
	it("changes only the illustrative quote position and resolves instantly with reduced motion", async () => {
		reduced = true;
		const quote = getLessonScenarios("validate-option-print")[0].steps[0].quote;
		if (!quote) throw new Error("Missing quote");
		const original = JSON.stringify(quote);
		const { container } = render(
			<LessonMotion>
				<QuotePositionExplorer quote={quote} locale="en" />
			</LessonMotion>,
		);
		expect(
			container.querySelector("[data-hypothetical-price]")?.textContent,
		).toContain("$2.025");
		fireEvent.click(screen.getByRole("button", { name: "Bid" }));
		await waitFor(() =>
			expect(
				container.querySelector("[data-hypothetical-price]")?.textContent,
			).toContain("$2.00"),
		);
		fireEvent.click(screen.getByRole("button", { name: "Ask" }));
		await waitFor(() =>
			expect(
				container.querySelector("[data-hypothetical-price]")?.textContent,
			).toContain("$2.05"),
		);
		expect(
			screen.getByText(/fixed tick marks the case execution at \$2.05/),
		).toBeTruthy();
		expect(JSON.stringify(quote)).toBe(original);
	});
	it("replays calculation emphasis without altering exact terms", () => {
		render(
			<LessonMotion>
				<CalculationTrace
					locale="en"
					terms={[
						{ id: "dex", label: "|DEX|", value: "50,000" },
						{ id: "denominator", label: "Denominator", value: "1,000,000" },
						{ id: "scale", label: "Scale", value: "100" },
						{ id: "dei", label: "DEI", value: "5%" },
					]}
				/>
			</LessonMotion>,
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Trace the calculation" }),
		);
		expect(screen.getByText("5%")).toBeTruthy();
		expect(screen.getByText("1,000,000")).toBeTruthy();
	});
	it("draws only inspected source links and labels an ungraded wrong answer as a draft", () => {
		const scenario = getLessonScenarios("market-recap")[0];
		let state = initialAttemptState();
		for (const question of scenario.steps[0].questions)
			state = transitionAttempt(scenario, state, {
				type: "answer",
				questionId: question.id,
				choiceId: question.accepted[0],
			});
		state = transitionAttempt(scenario, state, { type: "submit" });
		state = transitionAttempt(scenario, state, { type: "continue" });
		const { container, rerender } = render(
			<ResearchConnections
				view={projectAttempt(scenario, state, "attempt", 0)}
				locale="en"
			/>,
		);
		expect(container.textContent).toBe("");
		state = transitionAttempt(scenario, state, {
			type: "inspect",
			evidenceId: "packet-record",
		});
		state = transitionAttempt(scenario, state, {
			type: "answer",
			questionId: "claim-chart",
			choiceId: "b",
		});
		rerender(
			<ResearchConnections
				view={projectAttempt(scenario, state, "attempt", 2)}
				locale="en"
			/>,
		);
		expect(
			screen.getByText(/Correctness is checked when you submit/),
		).toBeTruthy();
		expect(
			screen.getByText("Chart B, using its stated source and quantity."),
		).toBeTruthy();
		expect(
			container
				.querySelector("[data-draft-link=claim-chart]")
				?.getAttribute("stroke"),
		).toBe("var(--chart-1)");
		expect(projectAttempt(scenario, state, "attempt", 2).feedback).toEqual([]);
	});
});
