// @vitest-environment jsdom
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LearningAction } from "@/domain/learning/types";

const mocks = vi.hoisted(() => ({
	consent: "granted",
	capture: vi.fn((_event: string, _properties: unknown) => true),
	preview: vi.fn(),
}));
vi.mock("@/analytics/context", () => ({ useAnalytics: () => mocks }));
vi.mock("@/i18n/provider", () => ({ useI18n: () => ({ locale: "en" }) }));
vi.mock("@/server/learning", () => ({ previewLearning: mocks.preview }));
vi.mock("./learning-screen", () => ({
	LearningScreen: ({
		onOpen,
		onAction,
		onRecover,
		busy,
	}: {
		onOpen: (restart: boolean) => void;
		onAction: (action: LearningAction) => void;
		onRecover: () => void;
		busy: boolean;
	}) => (
		<>
			<button type="button" disabled={busy} onClick={() => onOpen(false)}>
				Open
			</button>
			<button
				type="button"
				disabled={busy}
				onClick={() => onAction({ type: "submit" })}
			>
				Submit
			</button>
			<button type="button" disabled={busy} onClick={() => onOpen(true)}>
				Restart
			</button>
			<button type="button" disabled={busy} onClick={onRecover}>
				Retry
			</button>
		</>
	),
}));

import { PreviewLearning } from "./preview-learning";

afterEach(cleanup);
beforeEach(() => {
	mocks.consent = "granted";
	mocks.capture.mockClear();
	mocks.preview.mockReset();
});
const result = (submitted = false) => ({
	ok: true,
	view: {
		scenarioId: "public-example",
		scenarioVersion: 2,
		result: submitted ? { status: "practiced" } : null,
	},
});
async function click(name: string, calls: number) {
	fireEvent.click(screen.getByRole("button", { name }));
	await waitFor(() => expect(mocks.preview).toHaveBeenCalledTimes(calls));
	await waitFor(() =>
		expect(screen.getByRole("button", { name }).hasAttribute("disabled")).toBe(
			false,
		),
	);
}

describe("anonymous preview analytics", () => {
	it("counts successful runs separately from account exercises without duplicate assessments", async () => {
		mocks.preview
			.mockResolvedValueOnce(result())
			.mockResolvedValueOnce(result(true))
			.mockResolvedValueOnce(result(true))
			.mockResolvedValueOnce(result());
		render(<PreviewLearning lessonId="audited-boundary" />);
		await click("Open", 1);
		await click("Submit", 2);
		await click("Submit", 3);
		await click("Restart", 4);
		expect(mocks.capture.mock.calls.map((call) => call[0])).toEqual([
			"preview_exercise_started",
			"preview_exercise_submitted",
			"preview_exercise_started",
		]);
		expect(mocks.capture.mock.calls[1][1]).toEqual({
			lesson_id: "audited-boundary",
			scenario_id: "public-example",
			scenario_version: 2,
			result: "practiced",
		});
	});
	it("retries the failed restart rather than replaying the previous completed history", async () => {
		mocks.preview
			.mockResolvedValueOnce(result())
			.mockResolvedValueOnce(result(true))
			.mockRejectedValueOnce(new Error("offline"))
			.mockResolvedValueOnce(result());
		render(<PreviewLearning lessonId="audited-boundary" />);
		await click("Open", 1);
		await click("Submit", 2);
		await click("Restart", 3);
		await click("Retry", 4);
		expect(mocks.preview.mock.calls[3][0]).toEqual(
			mocks.preview.mock.calls[2][0],
		);
		expect(mocks.preview.mock.calls[3][0].data.actions).toEqual([]);
		expect(mocks.capture.mock.calls.map((call) => call[0])).toEqual([
			"preview_exercise_started",
			"preview_exercise_submitted",
			"preview_exercise_started",
		]);
	});

	it("does not reconstruct a start after consent or count a failed open", async () => {
		mocks.consent = "denied";
		mocks.preview
			.mockResolvedValueOnce(result())
			.mockResolvedValueOnce(result(true))
			.mockResolvedValueOnce({ ok: false, reason: "unavailable" });
		const view = render(<PreviewLearning lessonId="audited-boundary" />);
		await click("Open", 1);
		mocks.consent = "granted";
		view.rerender(<PreviewLearning lessonId="audited-boundary" />);
		await click("Submit", 2);
		await click("Restart", 3);
		expect(mocks.capture).not.toHaveBeenCalled();
	});
});
