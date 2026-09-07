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
vi.mock("./three/contract-scene", () => ({ mountContractScene: mocks.mount }));

import { contractNeighborhoodScenarios } from "@/content/scenarios/contract-neighborhood";
import { ContractExplorer } from "./contract-explorer";

describe("optional contract renderer", () => {
	const data = contractNeighborhoodScenarios[0].steps[0].neighborhood;
	if (!data) throw new Error("Missing case");
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
	it("loads Three.js only when requested and preserves selection in both directions", async () => {
		render(<ContractExplorer autoPlay={false} data={data} locale="en" />);
		expect(mocks.mount).not.toHaveBeenCalled();
		const cell = screen.getByRole("button", {
			name: "ALFA 100 call, 14 days, 3,200, Comparable",
		});
		fireEvent.click(cell);
		expect(cell.getAttribute("aria-pressed")).toBe("true");
		fireEvent.click(screen.getByRole("button", { name: "3D + map" }));
		await waitFor(() => expect(mocks.mount).toHaveBeenCalledTimes(1));
		expect(mocks.update).toHaveBeenLastCalledWith(
			expect.objectContaining({
				selectedId: "c-100-14",
				scopeOnly: false,
				expiry: null,
			}),
		);
		act(() => mocks.mount.mock.calls[0][3]("c-95-14"));
		expect(
			screen
				.getByRole("button", {
					name: "ALFA 95 call, 14 days, 6,000, Prior-session data",
				})
				.getAttribute("aria-pressed"),
		).toBe("true");
		fireEvent.click(screen.getByRole("button", { name: "2D map" }));
		expect(mocks.dispose).toHaveBeenCalledTimes(1);
		expect(
			screen
				.getByRole("button", {
					name: "ALFA 95 call, 14 days, 6,000, Prior-session data",
				})
				.getAttribute("aria-pressed"),
		).toBe("true");
	});
	it("falls back on context loss without losing the selected observation", async () => {
		render(
			<ContractExplorer
				autoPlay={false}
				data={data}
				locale="en"
				initialRenderer="3d"
			/>,
		);
		await waitFor(() => expect(mocks.mount).toHaveBeenCalledTimes(1));
		fireEvent.click(
			screen.getByRole("button", {
				name: "ALFA 100 call, 14 days, 3,200, Comparable",
			}),
		);
		act(() => mocks.mount.mock.calls[0][4]());
		expect(await screen.findByText(/3D is unavailable/)).toBeTruthy();
		expect(
			screen
				.getByRole("button", {
					name: "ALFA 100 call, 14 days, 3,200, Comparable",
				})
				.getAttribute("aria-pressed"),
		).toBe("true");
		expect(mocks.dispose).toHaveBeenCalledTimes(1);
	});
	it("removes a hidden selection without treating missing volume as zero", () => {
		render(<ContractExplorer autoPlay={false} data={data} locale="en" />);
		fireEvent.click(
			screen.getByRole("button", {
				name: "ALFA 100 call, 60 days, 8,400, Outside boundary",
			}),
		);
		fireEvent.click(screen.getByRole("button", { name: "Declared scope" }));
		expect(
			screen.queryByRole("button", {
				name: "ALFA 100 call, 60 days, 8,400, Outside boundary",
			}),
		).toBeNull();
		expect(
			screen.getByRole("button", {
				name: "ALFA 105 call, 14 days, —, Missing volume",
			}),
		).toBeTruthy();
		expect(screen.getByText(/Select a column or map cell/)).toBeTruthy();
	});
	it("starts motion on the first 3D view, lets the learner pause, and restores exact closing numbers", async () => {
		const request = vi
			.spyOn(window, "requestAnimationFrame")
			.mockReturnValue(100);
		const cancel = vi
			.spyOn(window, "cancelAnimationFrame")
			.mockImplementation(() => {});
		const visibility = vi
			.spyOn(document, "hidden", "get")
			.mockReturnValue(false);
		try {
			render(<ContractExplorer data={data} locale="en" />);
			fireEvent.click(screen.getByRole("button", { name: "3D + map" }));
			await screen.findByRole("button", { name: "Pause" });
			fireEvent.click(screen.getByRole("button", { name: "Pause" }));
			expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
			fireEvent.click(screen.getByRole("button", { name: "View 16:00 ET" }));
			expect(
				screen.getByRole("button", {
					name: "ALFA 100 call, 14 days, 3,200, Comparable",
				}),
			).toBeTruthy();
			fireEvent.click(screen.getByRole("button", { name: "2D map" }));
			fireEvent.click(screen.getByRole("button", { name: "3D + map" }));
			await waitFor(() => expect(mocks.mount).toHaveBeenCalledTimes(2));
			expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
		} finally {
			cleanup();
			request.mockRestore();
			cancel.mockRestore();
			visibility.mockRestore();
		}
	});
});
