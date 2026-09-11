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
import { executionConceptData } from "@/content/units/execution-concept.server";
import { sideConceptData as data } from "@/content/units/side-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	assessSideReference,
	locateExecution,
	sideClaimLevel,
} from "@/domain/learning/side-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { SideConceptLab } from "./side-concept-lab";

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
const lab = () => render(<SideConceptLab locale="en" data={data} />);

describe("execution-side teaching lab", () => {
	it("classifies exact quote boundaries and the entire interior without rounding prices", () => {
		expect(
			[395, 400, 401, 407, 410, 419, 420, 425].map((p) =>
				locateExecution(p, 400, 420),
			),
		).toEqual(["BBID", "BID", "MID", "MID", "MID", "MID", "ASK", "AASK"]);
		expect(locateExecution(400.5, 400, 401)).toBe("MID");
		expect(locateExecution(400, null, 420)).toBeNull();
		expect(locateExecution(400, 400, 400)).toBeNull();
		expect(locateExecution(410, 425, 415)).toBeNull();
		expect(locateExecution(Number.NaN, 400, 420)).toBeNull();
	});
	it("withholds unreliable reference classifications with a specific reason", () => {
		expect(
			data.references.map((ref) =>
				assessSideReference(data.contract, 420, ref),
			),
		).toEqual([
			{ code: "ASK", issue: null },
			{ code: null, issue: "stale" },
			{ code: null, issue: "missing" },
			{ code: null, issue: "locked" },
			{ code: null, issue: "crossed" },
			{ code: null, issue: "complex" },
			{ code: null, issue: "mismatch" },
			{ code: null, issue: "later" },
		]);
		expect(
			assessSideReference(data.contract, 420, {
				...data.references[0],
				secondsBeforePrint: -1,
			}),
		).toEqual({ code: null, issue: "later" });
		expect(
			assessSideReference(data.contract, 420, {
				...data.references[0],
				secondsBeforePrint: Number.NaN,
			}),
		).toEqual({ code: null, issue: "invalid" });
	});
	it("separates a location observation from an inference and unavailable order or intent information", () => {
		expect(sideClaimLevel("ASK", "location")).toBe("observed");
		expect(sideClaimLevel("ASK", "initiation")).toBe("inference");
		expect(sideClaimLevel("BID", "initiation")).toBe("inference");
		for (const code of ["MID", "AASK", "BBID"] as const)
			expect(sideClaimLevel(code, "initiation")).toBe("unknown");
		for (const claim of ["order", "belief", "position"] as const)
			expect(sideClaimLevel("ASK", claim)).toBe("unknown");
		expect(sideClaimLevel(null, "location")).toBe("unknown");
	});
	it("links SVG dragging and the normal range, preserving non-midpoint MID prices", () => {
		lab();
		expect(read("[data-side-code]")).toBe("MID");
		expect(read("[data-side-midpoint]")).toContain("$4.07");
		change("Drag execution marker", "420");
		expect(read("[data-side-code]")).toBe("ASK");
		expect(
			(screen.getByLabelText("Execution price") as HTMLInputElement).value,
		).toBe("420");
		change("Execution price", "410");
		expect(read("[data-side-midpoint]")).toContain("happens to equal");
		expect(
			(screen.getByLabelText("Drag execution marker") as HTMLInputElement)
				.value,
		).toBe("410");
		click("BBID");
		expect(read("[data-side-code]")).toBe("BBID");
		click("Reset scene");
		expect(read("[data-side-code]")).toBe("MID");
		expect(
			(screen.getByLabelText("Execution price") as HTMLInputElement).value,
		).toBe("407");
	});
	it("visits all supplied regions and retains the last frame after playback completes", () => {
		vi.useFakeTimers();
		lab();
		click("Play explanation");
		expect(read("[data-side-code]")).toBe("BBID");
		for (const code of ["BID", "MID", "ASK", "AASK"]) {
			act(() => vi.advanceTimersByTime(1200));
			expect(read("[data-side-code]")).toBe(code);
		}
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-side-code]")).toBe("AASK");
		expect(
			screen.getByRole("button", { name: "Play explanation" }),
		).toBeTruthy();
	});
	it("stops playback immediately when the SVG marker is grabbed or edited", () => {
		vi.useFakeTimers();
		lab();
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		fireEvent.pointerDown(screen.getByLabelText("Drag execution marker"));
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-side-code]")).toBe("BID");
		click("Play explanation");
		change("Execution price", "413");
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-side-code]")).toBe("MID");
		expect(
			(screen.getByLabelText("Execution price") as HTMLInputElement).value,
		).toBe("413");
	});
	it("keeps the print unchanged when reference evidence changes and reset restores only this scene", () => {
		lab();
		fireEvent.click(screen.getByRole("tab", { name: /Check the reference/ }));
		expect(read("[data-reference-code]")).toBe("ASK");
		for (const id of [
			"stale",
			"missing",
			"locked",
			"crossed",
			"complex",
			"mismatch",
			"later",
		]) {
			change("Reference evidence", id);
			expect(read("[data-reference-code]")).toBe("Withheld");
			expect(read("[data-reference-print]")).toBe("20 @ $4.20");
		}
		click("Reset scene");
		expect(read("[data-reference-code]")).toBe("ASK");
	});
	it("changes the evidence level without changing the selected print, and handles outside-spread claims conservatively", () => {
		lab();
		fireEvent.click(screen.getByRole("tab", { name: /Location ≠ intent/ }));
		expect(read("[data-side-claim-level]")).toBe("Supported location");
		click("Initiator");
		expect(read("[data-side-claim-level]")).toBe(
			"Possible inference, not proof",
		);
		click("Order type");
		expect(read("[data-side-claim-level]")).toContain("Not established");
		change("Execution example", "425");
		click("Initiator");
		expect(read("[data-side-claim-level]")).toContain("Not established");
		click("Location");
		expect(read("[data-side-claim-level]")).toBe("Supported location");
		expect(
			(screen.getByLabelText("Execution example") as HTMLSelectElement).value,
		).toBe("425");
	});
	it("renders Chinese controls and rejects missing or mismatched teaching data", () => {
		const page = render(<SideConceptLab locale="zh" data={data} />);
		change("拖动成交标记", "425");
		expect(read("[data-side-code]")).toBe("AASK");
		click("重置场景");
		expect(read("[data-side-code]")).toBe("MID");
		page.rerender(<SideConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
		page.rerender(<SideConceptLab locale="en" data={executionConceptData} />);
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
	});
	it("projects paid Learn data without changing the version 2 classification assessment", () => {
		const scenario = getLessonScenarios("execution-side")[0];
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
		const view = projectAttempt(scenario, state, "side-test", 0);
		expect(view.step.conceptData).toEqual(data);
		expect(view.step.execution).toBeUndefined();
		const page = render(<LearningScreen {...props} view={view} />);
		click("AASK");
		expect(onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
		const practice = projectAttempt(
			scenario,
			transitionAttempt(scenario, state, { type: "continue" }),
			"side-test",
			1,
		);
		page.rerender(<LearningScreen {...props} view={practice} />);
		expect(practice.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		expect(
			scenario.steps.slice(1).every((s) => !s.conceptLab && !s.conceptData),
		).toBe(true);
		expect(
			scenario.steps[1].questions.map((q) => ({
				id: q.id,
				accepted: q.accepted,
			})),
		).toEqual([
			{ id: "location-0", accepted: ["AASK"] },
			{ id: "location-1", accepted: ["ASK"] },
			{ id: "location-2", accepted: ["MID"] },
			{ id: "location-3", accepted: ["BID"] },
			{ id: "location-4", accepted: ["BBID"] },
			{ id: "stale", accepted: ["unknown"] },
		]);
		expect(
			previewLearningImpl({
				lessonId: "execution-side",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
