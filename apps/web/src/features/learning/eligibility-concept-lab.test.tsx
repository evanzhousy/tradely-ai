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
import { eligibilityConceptData as data } from "@/content/units/eligibility-concept.server";
import {
	activityRatio,
	assessCandidate,
	summarizeEligibility,
} from "@/domain/learning/eligibility-concept";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { EligibilityConceptLab } from "./eligibility-concept-lab";
import { LearningScreen } from "./learning-screen";

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
});
const rule = { kind: "stock" as const, session: data.session, minimum: 500 };
const read = (s: string) => document.querySelector(s)?.textContent;
const change = (name: string, value: string) =>
	fireEvent.change(screen.getByLabelText(name), { target: { value } });
const tab = (name: RegExp) =>
	fireEvent.click(screen.getByRole("tab", { name }));
const click = (name: string) =>
	fireEvent.click(screen.getByRole("button", { name }));
const lab = () => render(<EligibilityConceptLab locale="en" data={data} />);
describe("symbol universe SVG lesson", () => {
	it("derives eligibility from facts rather than ready badges", () => {
		expect(data.rows.map((r) => assessCandidate(r, rule).reason)).toEqual([
			"qualified",
			"kind",
			"session",
			"coverage",
			"qualified",
			"minimum",
		]);
		expect(
			assessCandidate({ ...data.rows[3], badge: "ready" }, rule).status,
		).toBe("unknown");
		expect(
			assessCandidate({ ...data.rows[0], volume: Number.NaN }, rule).status,
		).toBe("unknown");
		expect(assessCandidate({ ...data.rows[0], volume: -1 }, rule).status).toBe(
			"unknown",
		);
	});
	it("keeps observed subtotal separate from a complete qualifying total", () => {
		const original = summarizeEligibility(data.rows, rule);
		expect(original.eligible.map((d) => d.row.symbol)).toEqual(["A", "E"]);
		expect(original.unknown.map((d) => d.row.symbol)).toEqual(["D"]);
		expect(original.subtotal).toBe(1300);
		expect(original.completeTotal).toBeNull();
		expect(original.leaders).toEqual(["A"]);
		const corrected = summarizeEligibility(data.correctedRows, rule);
		expect(corrected.eligible).toHaveLength(3);
		expect(corrected.completeTotal).toBe(2800);
		expect(corrected.leaders).toEqual(["D"]);
	});
	it("includes the floor boundary and keeps unknown candidates even above observed maxima", () => {
		expect(assessCandidate(data.rows[4], rule).status).toBe("eligible");
		const strict = summarizeEligibility(data.rows, { ...rule, minimum: 1000 });
		expect(strict.eligible).toHaveLength(0);
		expect(strict.leaders).toEqual([]);
		expect(strict.completeTotal).toBeNull();
		expect(
			summarizeEligibility(data.rows, { ...rule, kind: "etf" }).completeTotal,
		).toBe(2000);
	});
	it("requires a positive compatible numeric baseline independently of peer count", () => {
		expect(activityRatio(800, 500)).toBe(1.6);
		expect(activityRatio(800, 250)).toBe(3.2);
		expect(activityRatio(800, 1000)).toBe(0.8);
		for (const baseline of [null, 0, -1, Number.POSITIVE_INFINITY])
			expect(activityRatio(800, baseline)).toBeNull();
		expect(activityRatio(null, 500)).toBeNull();
		expect(activityRatio(0, 500)).toBe(0);
	});
	it("makes source reasons inspectable and recomputes after rule changes", () => {
		lab();
		expect(read("[data-universe-admitted]")).toBe("2");
		click("Inspect source D");
		expect(read("[data-universe-source]")).toContain("ready");
		expect(read("[data-universe-reason]")).toContain("Unknown");
		change("Underlying type rule", "both");
		expect(read("[data-universe-admitted]")).toBe("3");
		change("Minimum contract volume", "1000");
		expect(read("[data-universe-admitted]")).toBe("1");
		click("Reset scene");
		expect(read("[data-universe-admitted]")).toBe("2");
	});
	it("plays check stages without publishing a partial admission count", () => {
		vi.useFakeTimers();
		lab();
		click("Play explanation");
		expect(read("[data-universe-admitted]")).toBe("—");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-universe-admitted]")).toBe("—");
		change("Minimum contract volume", "1000");
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-universe-admitted]")).toBe("0");
		expect(
			screen.getByRole("button", { name: "Play explanation" }),
		).toBeTruthy();
	});
	it("changes a numeric ratio without changing peer count and then reveals correction effects", () => {
		lab();
		tab(/Name the denominator/);
		expect(read("[data-universe-ratio]")).toBe("1.6×");
		expect(read("[data-universe-peer-count]")).toContain("2");
		change("Typical option-volume baseline", "small");
		expect(read("[data-universe-ratio]")).toBe("3.2×");
		expect(read("[data-universe-peer-count]")).toContain("2");
		change("Coverage snapshot", "corrected");
		expect(read("[data-universe-peer-count]")).toContain("3");
		expect(read("[data-universe-complete]")).toContain("2,800");
		change("Typical option-volume baseline", "zero");
		expect(read("[data-universe-ratio]")).toBe("—");
	});
	it("preserves historical observations while exposing membership substitutions", () => {
		lab();
		tab(/Keep historical membership/);
		expect(read("[data-universe-history-leader]")).toBe("OLD");
		change("Membership date", "current");
		expect(read("[data-universe-history-leader]")).toBe("A");
		expect(read("[data-universe-history-claim]")).toContain(
			"Changed population",
		);
		click("Inspect member NEW");
		expect(read("[data-universe-history-detail]")).toContain(
			"no supplied historical",
		);
		expect(read("[data-universe-history-detail]")).toContain("—");
		click("Inspect member OLD");
		expect(read("[data-universe-history-detail]")).toContain("1,200");
		click("Reset scene");
		expect(read("[data-universe-history-leader]")).toBe("OLD");
	});
	it("supports Chinese and guards unavailable data", () => {
		const page = render(<EligibilityConceptLab locale="zh" data={data} />);
		change("标的类型规则", "etf");
		expect(read("[data-universe-admitted]")).toBe("1");
		page.rerender(<EligibilityConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
	});
	it("preserves version 2 grading and anonymous free-preview access", () => {
		const scenario = getLessonScenarios("symbol-universe")[0];
		let state = initialAttemptState();
		const props = {
			locale: "en" as const,
			busy: false,
			error: null,
			onOpen: vi.fn(),
			onRecover: vi.fn(),
			onAction: vi.fn(),
		};
		const view = projectAttempt(scenario, state, "universe-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		change("Underlying type rule", "both");
		expect(props.onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(props.onAction).toHaveBeenCalledExactlyOnceWith({
			type: "continue",
		});
		state = transitionAttempt(scenario, state, { type: "continue" });
		const next = projectAttempt(scenario, state, "universe-test", 1);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		for (const [questionId, value] of [
			["admitted", "1"],
			["eligible-volume", "800"],
		])
			state = transitionAttempt(scenario, state, {
				type: "respond",
				questionId,
				value,
			});
		state = transitionAttempt(scenario, state, {
			type: "answer",
			questionId: "claim",
			choiceId: "limited",
		});
		state = transitionAttempt(scenario, state, { type: "submit" });
		expect(
			projectAttempt(scenario, state, "universe-test", 2).feedback.map(
				(f) => f.met,
			),
		).toEqual([true, true, true]);
		expect(
			previewLearningImpl({
				lessonId: "symbol-universe",
				variant: 0,
				actions: [],
			}),
		).toMatchObject({
			ok: true,
			view: { attemptId: "preview", step: { conceptData: data } },
		});
	});
});
