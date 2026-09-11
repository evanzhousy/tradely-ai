// @vitest-environment jsdom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start/server-only", () => ({}));

import { getLessonScenarios } from "@/content/scenarios/index.server";
import { oiConceptData } from "@/content/units/oi-concept.server";
import { tapeConceptData as data } from "@/content/units/tape-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	aggregateTape,
	conditionSupports,
	replayTape,
	type TapeMessage,
} from "@/domain/learning/tape-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { TapeConceptLab } from "./tape-concept-lab";

beforeEach(() =>
	vi.stubGlobal("matchMedia", () => ({
		matches: true,
		addEventListener() {},
		removeEventListener() {},
	})),
);
afterEach(() => {
	cleanup();
	vi.useRealTimers();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});
const read = (selector: string) =>
	document.querySelector(selector)?.textContent;
const change = (name: string, value: string) =>
	fireEvent.change(screen.getByLabelText(name), { target: { value } });
const click = (name: string) =>
	fireEvent.click(screen.getByRole("button", { name }));
const lab = () => render(<TapeConceptLab locale="en" data={data} />);
describe("tape record concept lesson", () => {
	it("separates quantity, execution count, premium and quantity-weighted price", () => {
		expect(aggregateTape([data.records.A, data.records.B])).toEqual({
			ok: true,
			count: 2,
			quantity: 40,
			premium: 11000,
			weightedPrice: 275,
			meanPrice: 250,
		});
		expect(aggregateTape([data.records.B])).toMatchObject({
			ok: true,
			count: 1,
			quantity: 30,
			premium: 9000,
			weightedPrice: 300,
			meanPrice: 300,
		});
	});
	it("rejects incompatible or duplicated records and leaves missing premium evidence missing", () => {
		expect(aggregateTape([data.records.A, data.records.C])).toEqual({
			ok: false,
			issue: "contract",
		});
		expect(aggregateTape([data.records.A, data.records.U])).toEqual({
			ok: false,
			issue: "unit",
		});
		expect(aggregateTape([data.records.A, data.records.A])).toEqual({
			ok: false,
			issue: "duplicate",
		});
		expect(
			aggregateTape([data.records.A, { ...data.records.B, multiplier: 50 }]),
		).toEqual({ ok: false, issue: "multiplier" });
		expect(aggregateTape([])).toEqual({ ok: false, issue: "empty" });
		expect(aggregateTape([{ ...data.records.A, quantity: 0 }])).toEqual({
			ok: false,
			issue: "invalid",
		});
		expect(
			aggregateTape([data.records.A, { ...data.records.B, multiplier: null }]),
		).toMatchObject({
			ok: true,
			quantity: 40,
			weightedPrice: 275,
			premium: null,
		});
	});
	it("counts messages separately while duplicates, corrections and cancellations update the current view", () => {
		const results = [0, 1, 2, 3, 4, 5].map((stage) => {
			const state = replayTape(data.messages, stage);
			const aggregate = aggregateTape(state.active);
			return [
				state.messages,
				state.active.length,
				aggregate.ok ? aggregate.quantity : 0,
				aggregate.ok ? aggregate.premium : 0,
			];
		});
		expect(results).toEqual([
			[0, 0, 0, 0],
			[1, 1, 10, 2000],
			[2, 2, 40, 11000],
			[3, 2, 40, 11000],
			[4, 2, 30, 7600],
			[5, 1, 20, 5600],
		]);
		expect(replayTape(data.messages, 3).duplicates).toBe(1);
		expect(data.records.B.quantity).toBe(30);
		expect(data.records.B.price).toBe(300);
		expect(data.messages[1].executionAt < data.messages[0].executionAt).toBe(
			true,
		);
		expect(data.messages[1].receivedAt > data.messages[0].receivedAt).toBe(
			true,
		);
	});
	it("does not invent executions for orphan revisions or resurrect a canceled execution ID", () => {
		const orphan: TapeMessage = {
			id: "X",
			kind: "correct",
			receivedAt: "later",
			executionAt: "earlier",
			targetId: "absent",
			replacement: { ...data.records.A, id: "absent" },
		};
		expect(replayTape([orphan], 1)).toMatchObject({
			active: [],
			unresolved: 1,
		});
		const mismatch: TapeMessage = { ...orphan, targetId: data.records.A.id };
		expect(replayTape([data.messages[0], mismatch], 2)).toMatchObject({
			unresolved: 1,
		});
		expect(
			replayTape(
				[...data.messages, { ...data.messages[0], id: "replayed" }],
				6,
			).active.map((p) => p.id),
		).toEqual([data.records.B.id]);
	});
	it("allows only a documented condition-meaning claim and never derives identity from condition size", () => {
		for (const condition of data.conditions) {
			expect(conditionSupports(condition, true, "meaning")).toBe(
				condition.meaning !== null,
			);
			expect(conditionSupports(condition, false, "meaning")).toBe(false);
			for (const claim of [
				"owner",
				"institution",
				"inside",
				"strategy",
			] as const)
				expect(conditionSupports(condition, true, claim)).toBe(false);
		}
	});
	it("updates the aggregate display and explicitly blocks wrong contracts or units", () => {
		lab();
		expect(read("[data-tape-quantity]")).toBe("40");
		expect(read("[data-tape-count]")).toBe("2");
		expect(read("[data-tape-weighted]")).toBe("$2.75");
		expect(read("[data-tape-mean]")).toContain("$2.50");
		change("Grouping candidate", "contract");
		expect(read("[data-tape-eligibility]")).toBe("Different contracts");
		expect(read("[data-tape-weighted]")).toBe("—");
		change("Grouping candidate", "unit");
		expect(read("[data-tape-eligibility]")).toBe("Quote units differ");
		change("Grouping candidate", "b");
		expect(read("[data-tape-count]")).toBe("1");
		expect(read("[data-tape-weighted]")).toBe("$3.00");
		click("Reset scene");
		expect(read("[data-tape-weighted]")).toBe("$2.75");
	});
	it("plays, pauses and rewinds message history without double-counting a repeated print", () => {
		vi.useFakeTimers();
		lab();
		fireEvent.click(screen.getByRole("tab", { name: /Replay the messages/ }));
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		fireEvent.pointerDown(screen.getByLabelText("Message replay timeline"));
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-tape-messages]")).toBe("1");
		change("Message replay timeline", "3");
		expect(read("[data-tape-messages]")).toBe("3");
		expect(read("[data-tape-active]")).toBe("2");
		expect(read("[data-tape-current-quantity]")).toBe("40");
		change("Received message", "4");
		expect(read("[data-tape-current-premium]")).toBe("$7,600");
		change("Received message", "5");
		expect(read("[data-tape-active]")).toBe("1");
		expect(read("[data-tape-current-premium]")).toBe("$5,600");
		expect(read("[data-tape-active-records]")).not.toContain(data.records.A.id);
		change("Received message", "1");
		expect(read("[data-tape-current-quantity]")).toBe("10");
		click("Reset scene");
		expect(read("[data-tape-messages]")).toBe("0");
	});
	it("keeps unknown and undocumented condition claims unresolved", () => {
		lab();
		fireEvent.click(screen.getByRole("tab", { name: /Read the condition/ }));
		expect(read("[data-tape-condition-support]")).toBe("Definition only");
		change("Test a claim", "institution");
		expect(read("[data-tape-condition-support]")).toBe("Not established");
		change("Test a claim", "meaning");
		click("Unavailable");
		expect(read("[data-tape-condition-support]")).toBe("Not established");
		click("Supplied");
		change("Condition example", "unknown");
		expect(read("[data-tape-condition-support]")).toBe("Not established");
	});
	it("supports Chinese reset and rejects missing or mismatched paid teaching data", () => {
		const page = render(<TapeConceptLab locale="zh" data={data} />);
		change("候选分组", "b");
		expect(read("[data-tape-weighted]")).toBe("$3.00");
		click("重置场景");
		expect(read("[data-tape-weighted]")).toBe("$2.75");
		page.rerender(<TapeConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
		page.rerender(<TapeConceptLab locale="en" data={oiConceptData} />);
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
	});
	it("uses authorized Learn data without changing version 2 aggregation assessment", () => {
		const scenario = getLessonScenarios("trade-records")[0];
		const state = initialAttemptState();
		const onAction = vi.fn();
		const props = {
			locale: "en" as const,
			busy: false,
			error: null,
			onOpen: vi.fn(),
			onRecover: vi.fn(),
			onAction,
		};
		const view = projectAttempt(scenario, state, "tape-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		change("Grouping candidate", "b");
		expect(onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
		const next = projectAttempt(
			scenario,
			transitionAttempt(scenario, state, { type: "continue" }),
			"tape-test",
			1,
		);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		expect(
			scenario.steps.slice(1).every((s) => !s.conceptData && !s.conceptLab),
		).toBe(true);
		expect(
			scenario.steps[1].questions.map((q) => ({
				id: q.id,
				accepted: q.accepted,
			})),
		).toEqual([
			{ id: "premium", accepted: ["11000"] },
			{ id: "weighted", accepted: ["2.75"] },
			{ id: "link", accepted: ["no"] },
		]);
		expect(
			previewLearningImpl({
				lessonId: "trade-records",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
