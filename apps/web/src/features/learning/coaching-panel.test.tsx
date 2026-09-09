// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@tanstack/react-start/server-only", () => ({}));
import { coachingFixture } from "../../../learning-preview/coaching-fixture";
import { getLessonScenarios } from "@/content/scenarios/index.server";
import { exampleReason, guidedRecord } from "@/domain/coaching/test-fixtures";
import type { CoachingResponse } from "@/domain/coaching/types";
import { projectAttempt } from "@/domain/learning/engine";
import { attemptStateSchema } from "@/domain/learning/types";
import { CoachingPanel, type CoachingTransport } from "./coaching-panel";

afterEach(cleanup);
const record = guidedRecord();
const view = projectAttempt(getLessonScenarios(record.lessonId)[0], attemptStateSchema.parse(record.state), record.id, record.revision);
const initial: CoachingResponse = { ok: true, view: { available: true, reason: null, reasonQuestionId: null, session: null } };
const props = () => ({ view, locale: "en" as const, blocked: false, onHint: vi.fn(), transport: coachingFixture(() => record) });

describe("inline coaching", () => {
	it("saves, reviews, revises and deletes a complete cycle with private text masked", async () => {
		render(<CoachingPanel {...props()} />);
		const field = await screen.findByRole("textbox", { name: "Explain your judgment" });
		fireEvent.change(field, { target: { value: exampleReason } });
		expect((screen.getByRole("button", { name: "Review my reasoning" }) as HTMLButtonElement).disabled).toBe(true);
		fireEvent.click(screen.getByRole("button", { name: "Save explanation" }));
		await waitFor(() => expect((screen.getByRole("button", { name: "Review my reasoning" }) as HTMLButtonElement).disabled).toBe(false));
		fireEvent.click(screen.getByRole("button", { name: "Review my reasoning" }));
		await screen.findByText("Original explanation");
		fireEvent.click(screen.getByRole("button", { name: "Work through a contrasting case" }));
		expect(screen.getByText(/Research question: which of two/)).toBeTruthy();
		fireEvent.change(field, { target: { value: `${exampleReason} I compare each symbol with its own baseline.` } });
		fireEvent.click(screen.getByRole("button", { name: "Save explanation" }));
		await waitFor(() => expect((screen.getByRole("button", { name: "Check my revision" }) as HTMLButtonElement).disabled).toBe(false));
		fireEvent.click(screen.getByRole("button", { name: "Check my revision" }));
		await screen.findByText(/Coaching complete/);
		expect(screen.getByText("Original explanation").closest("[data-analytics-private]")).toBeTruthy();
		fireEvent.click(screen.getByRole("button", { name: "Delete coaching record" }));
		await screen.findByText(/Coaching text deleted/);
		expect(screen.queryByText(exampleReason)).toBeNull();
	});
	it("reuses saved written answers and blocks calls for unsaved lesson edits", async () => {
		const r = guidedRecord("audited-boundary");
		const v = projectAttempt(getLessonScenarios(r.lessonId)[0], attemptStateSchema.parse(r.state), r.id, 0);
		render(<CoachingPanel {...props()} view={v} blocked locale="zh" transport={coachingFixture(() => r)} />);
		await screen.findByText(/这里使用上方已保存/);
		expect(screen.queryByRole("textbox")).toBeNull();
		expect((screen.getByRole("button", { name: "检查我的判断" }) as HTMLButtonElement).disabled).toBe(true);
	});
	it("hides a disabled feature and does not offer generation on independent cases", async () => {
		const p = props();
		const transport: CoachingTransport = { read: async () => ({ ok: true, view: { available: false, reason: "disabled", reasonQuestionId: null, session: null } }), update: vi.fn() };
		const { rerender } = render(<CoachingPanel {...p} transport={transport} />);
		await act(async () => {}); expect(screen.queryByText("Check my reasoning")).toBeNull();
		rerender(<CoachingPanel {...p} key="independent" view={{ ...view, step: { ...view.step, kind: "independent" } }} />);
		await act(async () => {}); expect(screen.queryByRole("button", { name: "Review my reasoning" })).toBeNull();
	});
	it("ignores a prior account's late reply after remount", async () => {
		let resolve!: (response: CoachingResponse) => void;
		const first: CoachingTransport = { read: () => new Promise(r => { resolve = r; }), update: vi.fn() };
		const { rerender } = render(<CoachingPanel {...props()} key="account-a" transport={first} />);
		rerender(<CoachingPanel {...props()} key="account-b" transport={{ read: async () => ({ ok: false, reason: "not_eligible" }), update: vi.fn() }} />);
		await act(async () => { resolve(initial); });
		expect(screen.queryByRole("textbox")).toBeNull();
	});
	it("recovers a failed read without losing a typed explanation", async () => {
		const p = props();
		const update = vi.fn().mockRejectedValue(new Error("Disconnected"));
		render(<CoachingPanel {...p} transport={{ read: async () => initial, update }} />);
		fireEvent.change(await screen.findByRole("textbox"), { target: { value: exampleReason } });
		fireEvent.click(screen.getByRole("button", { name: "Save explanation" }));
		await screen.findByText(/Coaching is temporarily unavailable/);
		fireEvent.click(screen.getByRole("button", { name: "Check saved status" }));
		await waitFor(() => expect(screen.queryByText(/Coaching is temporarily unavailable/)).toBeNull());
		expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(exampleReason);
		expect(update).toHaveBeenCalledTimes(1);
	});
});
