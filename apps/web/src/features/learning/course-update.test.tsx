// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start/server-only", () => ({}));

import { getLessonScenarios } from "@/content/scenarios/index.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import { referenceAction, required } from "@/domain/learning/test-helpers";
import { ExecutionLab } from "./execution-lab";
import { LearningScreen } from "./learning-screen";
import { Worksheet, workMarkdown } from "./work-document";

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

describe("new course learning surfaces", () => {
	it("distinguishes one fill, canceled liquidity and inferred sentiment at the fastest default", () => {
		const { container } = render(<ExecutionLab locale="en" mode="sentiment" />);
		expect(
			(screen.getByLabelText("Playback speed") as HTMLSelectElement).value,
		).toBe("2");
		fireEvent.click(screen.getByRole("button", { name: "1. Quote" }));
		expect(container.querySelector("[data-execution-count]")?.textContent).toBe(
			"0",
		);
		fireEvent.click(screen.getByRole("button", { name: "3. One fill" }));
		expect(container.querySelector("[data-execution-count]")?.textContent).toBe(
			"1",
		);
		expect(container.querySelector("[data-executed-size]")?.textContent).toBe(
			"10",
		);
		expect(
			container.querySelector("[data-flow-classification]")?.textContent,
		).toBe("Bullish");
		fireEvent.change(screen.getByLabelText("Option type"), {
			target: { value: "PUT" },
		});
		expect(
			container.querySelector("[data-flow-classification]")?.textContent,
		).toBe("Bearish");
		fireEvent.click(screen.getByRole("button", { name: "4. Cancellation" }));
		expect(container.querySelector("[data-executed-size]")?.textContent).toBe(
			"10",
		);
		expect(
			screen.getByText(/Quote size falls; executed volume stays at 10/),
		).toBeTruthy();
		fireEvent.change(screen.getByLabelText("Incoming order"), {
			target: { value: "sell" },
		});
		fireEvent.click(screen.getByRole("button", { name: "3. One fill" }));
		expect(
			container.querySelector("[data-flow-classification]")?.textContent,
		).toBe("Bullish");
	});
	it("teaches a partial fill without displaying premature sentiment concepts", () => {
		const { container } = render(
			<ExecutionLab locale="en" mode="counterparties" />,
		);
		fireEvent.click(screen.getByRole("button", { name: "3. One fill" }));
		expect(container.querySelector("[data-executed-size]")?.textContent).toBe(
			"30",
		);
		expect(screen.queryByLabelText("Option type")).toBeNull();
		expect(screen.queryByText("Inferred flow label")).toBeNull();
		fireEvent.click(screen.getByRole("button", { name: "4. Remainder" }));
		expect(
			screen.getByText(/10 requested contracts remain unfilled/),
		).toBeTruthy();
		fireEvent.change(screen.getByLabelText("Incoming order"), {
			target: { value: "sell" },
		});
		fireEvent.click(screen.getByRole("button", { name: "4. Book after fill" }));
		expect(
			screen.getByText(/No resting quantity remains there to cancel/),
		).toBeTruthy();
		expect(container.querySelector("[data-executed-size]")?.textContent).toBe(
			"40",
		);
	});
	it("keeps a numeric edit unsaved until explicit save and blocks submission while it is dirty", () => {
		const scenario = getLessonScenarios("execution-counterparties")[0];
		function Harness() {
			const [state, setState] = useState(() => {
				let state = transitionAttempt(scenario, initialAttemptState(), {
					type: "continue",
				});
				for (const q of scenario.steps[1].questions)
					state = transitionAttempt(scenario, state, referenceAction(q));
				return state;
			});
			return (
				<LearningScreen
					locale="en"
					view={projectAttempt(scenario, state, "test", 0)}
					busy={false}
					error={null}
					onOpen={() => {}}
					onRecover={() => {}}
					onAction={(action) =>
						setState((previous) =>
							transitionAttempt(scenario, previous, action),
						)
					}
				/>
			);
		}
		render(<Harness />);
		expect(
			(
				screen.getByRole("button", {
					name: "Review my reasoning",
				}) as HTMLButtonElement
			).disabled,
		).toBe(false);
		const input = screen.getByLabelText(
			"How many requested contracts cannot immediately fill?",
		);
		fireEvent.change(input, { target: { value: "12" } });
		expect(
			(
				screen.getByRole("button", {
					name: "Review my reasoning",
				}) as HTMLButtonElement
			).disabled,
		).toBe(true);
		fireEvent.click(screen.getByRole("button", { name: "Save response" }));
		expect(
			(
				screen.getByRole("button", {
					name: "Review my reasoning",
				}) as HTMLButtonElement
			).disabled,
		).toBe(false);
		fireEvent.click(
			screen.getByRole("button", { name: "Review my reasoning" }),
		);
		expect(screen.getByText("Revisit this reasoning")).toBeTruthy();
	});
	it("preserves a missing source row in the chart and exports learner work without a mastery claim", () => {
		const scenario = getLessonScenarios("cookbook-research-packet")[0];
		let state = initialAttemptState();
		for (const step of scenario.steps) {
			for (const q of step.questions)
				state = transitionAttempt(scenario, state, referenceAction(q));
			state = transitionAttempt(scenario, state, { type: "submit" });
			if (state.phase !== "complete")
				state = transitionAttempt(scenario, state, { type: "continue" });
		}
		const view = projectAttempt(scenario, state, "packet-id", 5);
		expect(view.result?.unreviewed).toBe(3);
		const markdown = workMarkdown(required(view.work), "en");
		expect(markdown).toContain("not a mastery certificate");
		expect(markdown).toContain("R3 | 110 | — | —");
		expect(markdown).toContain("108000");
		render(
			<LearningScreen
				locale="en"
				view={view}
				busy={false}
				error={null}
				onOpen={() => {}}
				onRecover={() => {}}
				onAction={() => {}}
			/>,
		);
		expect(
			screen.getByText("Automatically checked criteria met: 1 / 1"),
		).toBeTruthy();
		cleanup();
		render(
			<Worksheet data={required(required(view.work).evidence)} locale="zh" />,
		);
		expect(screen.getByText("缺失")).toBeTruthy();
		expect(screen.getByRole("img").getAttribute("aria-label")).toContain(
			"110: —",
		);
	});
});
