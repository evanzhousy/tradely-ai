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

const mocks = vi.hoisted(() => ({
	mount: vi.fn(),
	update: vi.fn(),
	dispose: vi.fn(),
}));
vi.mock("@tanstack/react-start/server-only", () => ({}));
vi.mock("./three/gex-scene", () => ({ mountGexScene: mocks.mount }));

import { contractNeighborhoodScenarios } from "@/content/scenarios/contract-neighborhood";
import { metricLensScenarios } from "@/content/scenarios/metric-lenses";
import { optionPrintScenarios } from "@/content/scenarios/option-print";
import { researchWorkflowScenarios } from "@/content/scenarios/research-workflow";

// Preserve renderer coverage with the archived fixtures as well as the new unit tests.
const getLessonScenarios = (id: string) =>
	[
		...metricLensScenarios,
		...optionPrintScenarios,
		...contractNeighborhoodScenarios,
		...researchWorkflowScenarios,
	].filter((item) => item.lessonId === id);

import { initialAttemptState, projectAttempt } from "@/domain/learning/engine";
import { LearningScreen } from "./learning-screen";
import { MetricsExplorer } from "./metrics-explorer";
import { NeighborhoodComparison } from "./neighborhood-comparison";

describe("metric teaching controls", () => {
	const data = getLessonScenarios("dex-dei-gex")[0].steps[1].metrics;
	if (!data) throw new Error("Missing metrics fixture");
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.mount.mockReturnValue({
			update: mocks.update,
			dispose: mocks.dispose,
			reset: vi.fn(),
			rotate: vi.fn(),
		});
	});
	afterEach(cleanup);
	it("honors the lesson capability while keeping its 2D evidence available", () => {
		render(<MetricsExplorer data={data} locale="en" allowThree={false} />);
		expect(
			screen.queryByRole("button", { name: "3D + comparison" }),
		).toBeNull();
		expect(
			screen.getByRole("table", { name: "Signed GEX contributions" }),
		).toBeTruthy();
		expect(mocks.mount).not.toHaveBeenCalled();
	});
	it("changes only normalization and exposes unavailable denominators", () => {
		const { container } = render(<MetricsExplorer data={data} locale="en" />);
		expect(container.querySelector("[data-dei]")?.textContent).toBe("5%");
		fireEvent.change(screen.getByLabelText("Effective denominator (shares)"), {
			target: { value: "2000000" },
		});
		expect(container.querySelector("[data-dei]")?.textContent).toBe("2.5%");
		expect(container.querySelector("[data-net-dex]")?.textContent).toBe(
			"+50,000",
		);
		expect(screen.getByText(/Full-scope total: \+100/)).toBeTruthy();
		fireEvent.change(screen.getByLabelText("Effective denominator (shares)"), {
			target: { value: "0" },
		});
		expect(container.querySelector("[data-dei]")?.textContent).toBe("Unknown");
		expect(mocks.mount).not.toHaveBeenCalled();
	});
	it("shares signed selection, preserves the scene on answer saves, and recovers from context loss", async () => {
		const { rerender } = render(<MetricsExplorer data={data} locale="en" />);
		fireEvent.click(screen.getByRole("button", { name: "$100 · 7 days" }));
		fireEvent.click(screen.getByRole("button", { name: "3D + comparison" }));
		await waitFor(() => expect(mocks.mount).toHaveBeenCalledTimes(1));
		expect(mocks.update).toHaveBeenLastCalledWith(
			expect.objectContaining({ selectedId: "gex-100-7" }),
		);
		act(() => mocks.mount.mock.calls[0][3]("gex-105-30"));
		expect(
			screen
				.getByRole("button", { name: "$105 · 30 days" })
				.getAttribute("aria-pressed"),
		).toBe("true");
		rerender(<MetricsExplorer data={structuredClone(data)} locale="en" />);
		expect(mocks.mount).toHaveBeenCalledTimes(1);
		act(() => mocks.mount.mock.calls[0][4]());
		expect(await screen.findByText(/3D is unavailable/)).toBeTruthy();
		expect(
			screen
				.getByRole("button", { name: "$105 · 30 days" })
				.getAttribute("aria-pressed"),
		).toBe("true");
		expect(mocks.dispose).toHaveBeenCalledTimes(1);
	});
	it("separates a filtered subtotal from the full scope, including unknown totals", () => {
		const alternate = getLessonScenarios("dex-dei-gex")[1].steps[2].metrics;
		if (!alternate) throw new Error("Missing alternate");
		render(<MetricsExplorer data={alternate} locale="en" />);
		fireEvent.click(screen.getByRole("button", { name: "Distribution B" }));
		expect(screen.getByText(/Full-scope total: Unknown/)).toBeTruthy();
		fireEvent.change(screen.getByLabelText("Expiry slice"), {
			target: { value: "7" },
		});
		expect(
			screen.getByText(
				/Full-scope total: Unknown · Visible slice subtotal: \+40/,
			),
		).toBeTruthy();
	});
	it("renders all five contract stages and changes the paired observations", () => {
		const scenario = getLessonScenarios("rank-contracts")[0];
		const view = projectAttempt(scenario, initialAttemptState(), "test", 0);
		const { container, unmount } = render(
			<LearningScreen
				lessonId="rank-contracts"
				locale="en"
				view={view}
				busy={false}
				error={null}
				onOpen={vi.fn()}
				onAction={vi.fn()}
				onRecover={vi.fn()}
			/>,
		);
		expect(
			container.querySelectorAll('ol[aria-label="Practice stages"] li').length,
		).toBe(5);
		unmount();
		const pair = scenario.steps[2].neighborhoodPair;
		if (!pair) throw new Error("Missing comparison");
		render(<NeighborhoodComparison data={pair} locale="en" />);
		expect(
			screen.getByRole("button", {
				name: "ALFA 95 call, 14 days, 0, Comparable",
			}),
		).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Case B" }));
		expect(
			screen.getByRole("button", {
				name: "ALFA 95 call, 14 days, 500, Comparable",
			}),
		).toBeTruthy();
	});
});
