// @vitest-environment jsdom

import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	save: vi.fn(),
	invalidate: vi.fn(),
	capture: vi.fn(),
	captureException: vi.fn(),
	success: vi.fn(),
	error: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: () => mocks.save }));
vi.mock("@tanstack/react-router", () => ({
	useRouter: () => ({ invalidate: mocks.invalidate }),
}));
vi.mock("@/server/progress", () => ({ saveLessonProgress: vi.fn() }));
vi.mock("@/analytics/context", () => ({ useAnalytics: () => mocks }));
vi.mock("@/i18n/provider", () => ({
	useI18n: () => ({ t: (key: string) => key }),
}));
vi.mock("sonner", () => ({
	toast: { success: mocks.success, error: mocks.error },
}));

import { getLessonById, type Lesson } from "@/content/course";
import { CompleteLessonButton } from "./complete-lesson-button";

const lesson = getLessonById("option-contracts") as Lesson;

describe("lesson completion outcomes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.save.mockResolvedValue({ saved: true });
		mocks.invalidate.mockResolvedValue(undefined);
	});
	afterEach(cleanup);

	it("emits completion only after the server confirms the save", async () => {
		let resolveSave: (value: { saved: true }) => void = () => {};
		mocks.save.mockReturnValue(
			new Promise((resolve) => {
				resolveSave = resolve;
			}),
		);
		const { rerender } = render(<CompleteLessonButton lesson={lesson} />);
		fireEvent.click(screen.getByRole("button"));
		expect(screen.queryByText("complete.success")).toBeNull();
		expect(mocks.capture).not.toHaveBeenCalled();
		resolveSave({ saved: true });
		await waitFor(() =>
			expect(mocks.capture).toHaveBeenCalledWith("lesson_completed", {
				lesson_id: lesson.id,
				lesson_order: lesson.order + 1,
			}),
		);
		expect(screen.getByText("complete.success")).toBeTruthy();
		rerender(<CompleteLessonButton lesson={{ ...lesson, id: "delta" }} />);
		expect(screen.queryByText("complete.success")).toBeNull();
	});

	it("keeps a confirmed save successful when refreshing the page fails", async () => {
		const error = new Error("Refresh unavailable");
		mocks.invalidate.mockRejectedValue(error);
		render(<CompleteLessonButton lesson={lesson} />);
		fireEvent.click(screen.getByRole("button"));
		await waitFor(() =>
			expect(mocks.captureException).toHaveBeenCalledWith(error, {
				source: "lesson_completion",
				lesson_id: lesson.id,
			}),
		);
		expect(mocks.capture.mock.calls.map((call) => call[0])).toEqual([
			"lesson_completed",
		]);
		expect(mocks.error).not.toHaveBeenCalled();
	});

	it.each([
		["signed-out", "signed_out"],
		["access-denied", "access_denied"],
	])(
		"reports a rejected save (%s) without a completion event",
		async (reason, eventReason) => {
			mocks.save.mockResolvedValue({ saved: false, reason });
			render(<CompleteLessonButton lesson={lesson} />);
			fireEvent.click(screen.getByRole("button"));
			await waitFor(() =>
				expect(mocks.capture).toHaveBeenCalledWith(
					"lesson_progress_save_failed",
					{
						lesson_id: lesson.id,
						reason: eventReason,
					},
				),
			);
			expect(mocks.capture).toHaveBeenCalledOnce();
			expect(mocks.captureException).not.toHaveBeenCalled();
			expect(screen.queryByText("complete.success")).toBeNull();
		},
	);

	it("reports an unexpected save failure as a failed save and an exception", async () => {
		mocks.save.mockRejectedValue(new Error("Persistence unavailable"));
		render(<CompleteLessonButton lesson={lesson} />);
		fireEvent.click(screen.getByRole("button"));
		await waitFor(() => expect(mocks.captureException).toHaveBeenCalledOnce());
		expect(mocks.capture).toHaveBeenCalledWith("lesson_progress_save_failed", {
			lesson_id: lesson.id,
			reason: "unavailable",
		});
		expect(mocks.capture).toHaveBeenCalledOnce();
		expect(screen.queryByText("complete.success")).toBeNull();
	});
});
