// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
	InteractiveHoverButton,
	InteractiveHoverLink,
} from "@tradely/ui/components/interactive-hover-button";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);

describe("community action semantics", () => {
	it("keeps navigational actions as links with a single accessible label", () => {
		render(
			<InteractiveHoverLink render={<a href="/learn/audited-boundary" />}>
				Start learning free
			</InteractiveHoverLink>,
		);
		const link = screen.getByRole("link", { name: "Start learning free" });
		expect(link.getAttribute("href")).toBe("/learn/audited-boundary");
		expect(screen.queryByRole("button")).toBeNull();
	});
	it("keeps form actions as disabled native buttons while pending", () => {
		const click = vi.fn();
		render(
			<InteractiveHoverButton disabled onClick={click} type="submit">
				Verify code
			</InteractiveHoverButton>,
		);
		const button = screen.getByRole("button", { name: "Verify code" });
		expect(button.tagName).toBe("BUTTON");
		fireEvent.click(button);
		expect(click).not.toHaveBeenCalled();
	});
});
