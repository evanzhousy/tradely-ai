// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "@/i18n/provider";
import { LandingPlatformFeatures } from "./landing-platform-features";

afterEach(cleanup);
beforeEach(() => localStorage.clear());

function renderFeatures() {
	return render(
		<LocaleProvider>
			<LandingPlatformFeatures />
		</LocaleProvider>,
	);
}

describe("landing widget demo", () => {
	it("keeps the checklist, remaining count and progress rings consistent through completion and reset", () => {
		renderFeatures();
		expect(screen.getByText("2 of 3 checked")).toBeTruthy();
		expect(
			screen
				.getByRole("progressbar", { name: "Explain the conclusion" })
				.getAttribute("aria-valuenow"),
		).toBe("0");
		fireEvent.click(
			screen.getByRole("checkbox", { name: "Explain the conclusion" }),
		);
		expect(screen.getByText("3 of 3 checked")).toBeTruthy();
		expect(screen.getByText("0 remaining")).toBeTruthy();
		for (const ring of screen.getAllByRole("progressbar"))
			expect(ring.getAttribute("aria-valuenow")).toBe("100");
		expect(screen.getByLabelText("Learning checkpoints").textContent).toBe(
			"100%",
		);
		fireEvent.click(screen.getByRole("button", { name: "Reset example" }));
		expect(screen.getByText("2 of 3 checked")).toBeTruthy();
		expect(screen.getByLabelText("Learning checkpoints").textContent).toBe(
			"67%",
		);
		expect(
			(
				screen.getByRole("checkbox", {
					name: "Explain the conclusion",
				}) as HTMLInputElement
			).checked,
		).toBe(false);
		expect(
			screen.getByText("Example only · your course progress is unchanged."),
		).toBeTruthy();
	});

	it("preserves chosen checkpoints when switching languages and keeps AI availability explicit", () => {
		renderFeatures();
		fireEvent.click(
			screen.getByRole("checkbox", { name: "Inspect the source" }),
		);
		fireEvent.click(screen.getByRole("button", { name: "Switch to Chinese" }));
		expect(screen.getByText("已勾选 1/3 项")).toBeTruthy();
		expect(
			(
				screen.getByRole("checkbox", {
					name: "检查数据来源",
				}) as HTMLInputElement
			).checked,
		).toBe(false);
		expect(
			screen
				.getByRole("progressbar", { name: "核对比较范围" })
				.getAttribute("aria-valuenow"),
		).toBe("100");
		expect(screen.getByText("辅导反馈示例")).toBeTruthy();
		expect(
			screen.getByText("仅向符合条件的试点账户开放，适用于部分引导案例。"),
		).toBeTruthy();
	});
});
