// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuestSaveControl } from "./guest-save-control";

afterEach(cleanup);
describe("contextual free registration", () => {
	const control = () => ({
		onSave: vi.fn(),
		onDismiss: vi.fn(),
		prominent: true,
		storageError: false,
	});
	it("prompts after a result while keeping guest continuation available", () => {
		const c = control();
		render(
			<GuestSaveControl
				control={c}
				locale="en"
				complete
				research={false}
				disabled={false}
				dirty={false}
			/>,
		);
		fireEvent.click(
			screen.getByRole("button", {
				name: "Save my result — create a free account",
			}),
		);
		expect(c.onSave).toHaveBeenCalledWith("result");
		fireEvent.click(screen.getByRole("button", { name: "Continue as guest" }));
		expect(c.onDismiss).toHaveBeenCalled();
	});
	it("keeps manual saving after dismissal without repeating the callout", () => {
		render(
			<GuestSaveControl
				control={{ ...control(), prominent: false }}
				locale="en"
				complete
				research={false}
				disabled={false}
				dirty={false}
			/>,
		);
		expect(screen.queryByText("Keep what you just learned")).toBeNull();
		expect(screen.getByRole("button", { name: /Save my result/ })).toBeTruthy();
	});
	it("blocks saving unsaved edits and offers research-specific copy in Chinese", () => {
		const c = control();
		render(
			<GuestSaveControl
				control={c}
				locale="zh"
				complete={false}
				research
				disabled={false}
				dirty
			/>,
		);
		const button = screen.getByRole("button", {
			name: "保存这份研究",
		}) as HTMLButtonElement;
		expect(button.disabled).toBe(true);
		fireEvent.click(button);
		expect(c.onSave).not.toHaveBeenCalled();
		expect(screen.getByText(/请先保存正在编辑/)).toBeTruthy();
	});
});
