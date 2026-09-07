// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start/server-only", () => ({}));

import { sessionFlowScenarios } from "@/content/scenarios/session-flow";
import { FlowStructureExplorer } from "./flow-structure-explorer";

afterEach(cleanup);
describe("flow comparison controls", () => {
	it("starts at the fastest speed and changes only volume when seeking", () => {
		const data = sessionFlowScenarios[0].steps[0].flowStructure;
		if (!data) throw new Error("Missing fixture");
		const { container } = render(
			<FlowStructureExplorer data={data} locale="en" autoPlay={false} />,
		);
		expect(
			(
				screen.getByRole("combobox", {
					name: "Replay speed",
				}) as HTMLSelectElement
			).value,
		).toBe("2");
		for (const [time, value] of [
			["09:30", "0"],
			["12:00", "2,100"],
			["16:00", "8,400"],
		]) {
			fireEvent.click(screen.getByRole("button", { name: `View ${time} ET` }));
			expect(container.querySelector("[data-flow-volume]")?.textContent).toBe(
				value,
			);
			expect(container.querySelector("[data-flow-oi]")?.textContent).toBe(
				"12,000",
			);
			expect(container.querySelector("[data-flow-delta]")?.textContent).toBe(
				"-200",
			);
			expect(container.querySelector("[data-flow-gex]")?.textContent).toBe(
				"+1.8",
			);
		}
	});
	it("keeps unavailable comparisons and model values explicit in Chinese", () => {
		const data = sessionFlowScenarios[1].steps[2].flowStructure;
		if (!data) throw new Error("Missing fixture");
		const { container } = render(
			<FlowStructureExplorer data={data} locale="zh" autoPlay={false} />,
		);
		expect(screen.getByText("没有可比报告对")).toBeTruthy();
		expect(screen.getByText("未提供")).toBeTruthy();
		expect(container.querySelector("[data-flow-delta]")?.textContent).toBe("—");
		expect(container.querySelector("[data-flow-gex]")?.textContent).toBe("—");
	});
});
