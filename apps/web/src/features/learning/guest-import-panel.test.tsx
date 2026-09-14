// @vitest-environment jsdom
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ submit: vi.fn(), capture: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock("@/server/learning", () => ({ importGuestLearning: mocks.submit }));
vi.mock("@/analytics/context", () => ({
	useAnalytics: () => ({ capture: mocks.capture }),
}));
vi.mock("@/i18n/provider", () => ({ useI18n: () => ({ locale: "en" }) }));

import {
	prepareGuestHandoff,
	readGuestHandoff,
	writeGuestHandoff,
} from "./guest-handoff";
import { GuestImportPanel } from "./guest-import-panel";

const work = {
	lessonId: "option-contracts",
	scenarioId: "option-contracts-practice-1",
	scenarioVersion: 3,
	contentVersion: 3,
	variant: 0,
	actions: [],
	intent: "result" as const,
};
const saved = () => ({
	ok: true,
	view: { attemptId: "test-attempt" },
	completed: true,
	replayed: false,
});
const props = () => ({
	lessonId: work.lessonId,
	userId: "account-a",
	email: "learner@example.test",
	onSaved: vi.fn(),
	onResume: vi.fn(),
	onGuest: vi.fn(),
});
afterEach(cleanup);
beforeEach(() => {
	sessionStorage.clear();
	vi.clearAllMocks();
	mocks.submit.mockReset();
});
describe("save after authentication", () => {
	it("binds, imports and clears only after server confirmation", async () => {
		const handoff = prepareGuestHandoff(work, sessionStorage);
		const options = props();
		mocks.submit.mockResolvedValue(saved());
		render(<GuestImportPanel {...options} />);
		await waitFor(() =>
			expect(options.onSaved).toHaveBeenCalledWith("test-attempt"),
		);
		expect(mocks.submit).toHaveBeenCalledTimes(1);
		expect(mocks.submit).toHaveBeenCalledWith({
			data: {
				transferId: handoff.transferId,
				expectedUserId: "account-a",
				work: handoff.work,
				saveSeparately: false,
			},
		});
		expect(readGuestHandoff(work.lessonId, sessionStorage).status).toBe(
			"missing",
		);
		expect(JSON.stringify(mocks.capture.mock.calls)).not.toContain(
			handoff.transferId,
		);
	});
	it("retains the same transfer after a lost response and retries without recreating work", async () => {
		const handoff = prepareGuestHandoff(work, sessionStorage);
		mocks.submit
			.mockRejectedValueOnce(new Error("connection"))
			.mockResolvedValueOnce({ ...saved(), replayed: true });
		const options = props();
		render(<GuestImportPanel {...options} />);
		await screen.findByRole("button", { name: "Try saving again" });
		expect(readGuestHandoff(work.lessonId, sessionStorage).status).toBe(
			"ready",
		);
		fireEvent.click(screen.getByRole("button", { name: "Try saving again" }));
		await waitFor(() => expect(options.onSaved).toHaveBeenCalled());
		expect(mocks.submit.mock.calls.map((c) => c[0].data.transferId)).toEqual([
			handoff.transferId,
			handoff.transferId,
		]);
		expect(mocks.capture).not.toHaveBeenCalledWith(
			"guest_work_import_succeeded",
			expect.anything(),
		);
	});
	it("pauses on account changes instead of silently attaching work", async () => {
		const handoff = prepareGuestHandoff(work, sessionStorage);
		writeGuestHandoff(
			{ ...handoff, boundUserId: "other-account" },
			sessionStorage,
		);
		mocks.submit.mockResolvedValue(saved());
		render(<GuestImportPanel {...props()} />);
		await screen.findByRole("button", { name: "Save to this account" });
		expect(mocks.submit).not.toHaveBeenCalled();
		fireEvent.click(
			screen.getByRole("button", { name: "Save to this account" }),
		);
		await waitFor(() => expect(mocks.submit).toHaveBeenCalledTimes(1));
	});
	it("requires an explicit choice before saving beside existing work", async () => {
		prepareGuestHandoff(work, sessionStorage);
		const options = props();
		mocks.submit
			.mockResolvedValueOnce({
				ok: false,
				reason: "existing_work",
				existingAttemptId: "existing",
				canSaveSeparately: true,
			})
			.mockResolvedValueOnce(saved());
		render(<GuestImportPanel {...options} />);
		await screen.findByRole("button", {
			name: "Save this completed result separately",
		});
		expect(mocks.submit).toHaveBeenCalledTimes(1);
		fireEvent.click(
			screen.getByRole("button", {
				name: "Save this completed result separately",
			}),
		);
		await waitFor(() => expect(options.onSaved).toHaveBeenCalled());
		expect(mocks.submit.mock.calls[1][0].data.saveSeparately).toBe(true);
	});
	it("does not offer separate saving for incomplete drafts", async () => {
		prepareGuestHandoff({ ...work, intent: "place" }, sessionStorage);
		mocks.submit.mockResolvedValue({
			ok: false,
			reason: "existing_work",
			existingAttemptId: "existing",
			canSaveSeparately: false,
		});
		render(<GuestImportPanel {...props()} />);
		await screen.findByRole("button", { name: "Resume my existing exercise" });
		expect(
			screen.queryByRole("button", {
				name: "Save this completed result separately",
			}),
		).toBeNull();
	});
	it("handles missing and expired handoffs without making a server request", async () => {
		render(<GuestImportPanel {...props()} />);
		await screen.findByText(/no pending guest exercise/);
		expect(mocks.submit).not.toHaveBeenCalled();
		cleanup();
		prepareGuestHandoff(work, sessionStorage, Date.now() - 25 * 60 * 60 * 1000);
		render(<GuestImportPanel {...props()} />);
		await screen.findByText(/expired after 24 hours/);
		expect(mocks.submit).not.toHaveBeenCalled();
	});
	it("ignores a result arriving after the account component unmounts", async () => {
		prepareGuestHandoff(work, sessionStorage);
		let resolve: (value: unknown) => void = () => {};
		mocks.submit.mockReturnValue(
			new Promise((r) => {
				resolve = r;
			}),
		);
		const options = props();
		const rendered = render(<GuestImportPanel {...options} />);
		await waitFor(() => expect(mocks.submit).toHaveBeenCalled());
		rendered.unmount();
		resolve(saved());
		await Promise.resolve();
		expect(options.onSaved).not.toHaveBeenCalled();
		expect(readGuestHandoff(work.lessonId, sessionStorage).status).toBe(
			"ready",
		);
	});
});
