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
import { printReviewConceptData as data } from "@/content/units/print-review-concept.server";
import { sentimentConceptData } from "@/content/units/sentiment-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	assessPrint,
	executionPremium,
	followUpPacket,
	reviewGaps,
	statementBucket,
} from "@/domain/learning/print-review-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { PrintReviewConceptLab } from "./print-review-concept-lab";

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
const lab = () => render(<PrintReviewConceptLab locale="en" data={data} />);
describe("execution review teaching lab", () => {
	it("calculates dollars from execution units without assuming a missing multiplier", () => {
		expect(executionPremium(205, 500, 100)).toBe(102500);
		expect(executionPremium(205, 500, 50)).toBe(51250);
		expect(executionPremium(205, 500, null)).toBeNull();
		expect(executionPremium(205, 500, 0)).toBeNull();
		expect(executionPremium(Number.NaN, 500, 100)).toBeNull();
	});
	it("keeps quote inference and cash arithmetic independent", () => {
		expect(assessPrint(data.print, data.packets.original)).toMatchObject({
			premium: 102500,
			aggressor: null,
			reference: { issue: "stale" },
		});
		expect(assessPrint(data.print, data.packets.aligned)).toMatchObject({
			premium: 102500,
			aggressor: "buyer",
			reference: { code: "ASK", issue: null },
		});
		expect(
			assessPrint(data.print, data.packets["missing-multiplier"]),
		).toMatchObject({ premium: null, aggressor: "buyer" });
	});
	it("separates observations, calculations, inferences and unknowns as records are added", () => {
		expect(assessPrint(data.print, data.packets.complex)).toMatchObject({
			premium: 102500,
			aggressor: null,
			reference: { issue: "complex" },
		});
		expect(statementBucket("contract", data.print, data.packets.original)).toBe(
			"observed",
		);
		expect(statementBucket("premium", data.print, data.packets.original)).toBe(
			"calculated",
		);
		expect(
			statementBucket(
				"premium",
				data.print,
				data.packets["missing-multiplier"],
			),
		).toBe("unknown");
		expect(
			statementBucket("aggressor", data.print, data.packets.original),
		).toBe("unknown");
		expect(statementBucket("aggressor", data.print, data.packets.aligned)).toBe(
			"inferred",
		);
		expect(statementBucket("opening", data.print, data.packets.aligned)).toBe(
			"unknown",
		);
		expect(statementBucket("opening", data.print, data.packets.opening)).toBe(
			"observed",
		);
		expect(statementBucket("strategy", data.print, data.packets.linked)).toBe(
			"unknown",
		);
	});
	it("matches each evidence gap to a targeted follow-up without repairing it with a larger print or price move", () => {
		for (const gap of ["timing", "multiplier", "opening", "linkage"] as const) {
			expect(followUpPacket(gap, null)).toBe(reviewGaps[gap].before);
			expect(followUpPacket(gap, "larger")).toBe(reviewGaps[gap].before);
			expect(followUpPacket(gap, "wait")).toBe(reviewGaps[gap].before);
			expect(followUpPacket(gap, reviewGaps[gap].request)).toBe(
				reviewGaps[gap].after,
			);
		}
		expect(followUpPacket("timing", "position")).toBe("original");
		expect(followUpPacket("opening", "quote")).toBe("aligned");
	});
	it("plays the inspection, interrupts on native SVG input, and retains unknown cash amounts", () => {
		vi.useFakeTimers();
		lab();
		expect(read("[data-review-premium]")).toBe("$102,500");
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		fireEvent.pointerDown(screen.getByLabelText("Print inspection timeline"));
		act(() => vi.advanceTimersByTime(6000));
		expect(
			(screen.getByLabelText("Print inspection timeline") as HTMLInputElement)
				.value,
		).toBe("1");
		change("Print inspection timeline", "4");
		expect(
			(screen.getByLabelText("Inspection step") as HTMLSelectElement).value,
		).toBe("4");
		click("Missing");
		expect(read("[data-review-premium]")).toBe("Unavailable");
		click("Reset scene");
		expect(read("[data-review-premium]")).toBe("$102,500");
	});
	it("reclassifies a selected statement after new evidence and clears prior feedback", () => {
		lab();
		fireEvent.click(screen.getByRole("tab", { name: /Sort the evidence/ }));
		click("Inferred");
		expect(screen.getByRole("status").textContent).toContain("Recheck");
		expect(read("[data-bucket-feedback]")).toContain("Unknown");
		change("Evidence packet", "aligned");
		expect(screen.queryByRole("status")).toBeNull();
		click("Inferred");
		expect(screen.getByRole("status").textContent).toContain("Supported");
		change("Inspect a statement", "opening");
		click("Observed");
		expect(read("[data-bucket-feedback]")).toContain("Unknown");
		change("Evidence packet", "opening");
		click("Observed");
		expect(read("[data-bucket-feedback]")).toContain("Observed");
		change("Evidence packet", "linked");
		change("Inspect a statement", "strategy");
		click("Unknown");
		expect(screen.getByRole("status").textContent).toContain("Supported");
	});
	it("shows what a follow-up actually resolves, preserving unrelated unknowns and original print amounts", () => {
		lab();
		fireEvent.click(screen.getByRole("tab", { name: /Choose the next check/ }));
		click("Inspect this evidence");
		expect(read("[data-followup-result]")).toBe("Aggressor unavailable");
		expect(read("[data-followup-premium]")).toBe("$102,500");
		change("Choose a follow-up", "quote");
		click("Inspect this evidence");
		expect(read("[data-followup-result]")).toBe("Likely buyer");
		change("Investigate one gap", "multiplier");
		expect(read("[data-followup-premium]")).toBe("—");
		change("Choose a follow-up", "terms");
		click("Inspect this evidence");
		expect(read("[data-followup-result]")).toBe("$102,500");
		change("Investigate one gap", "opening");
		change("Choose a follow-up", "quote");
		click("Inspect this evidence");
		expect(read("[data-followup-result]")).toBe("Opening status unknown");
		change("Choose a follow-up", "position");
		click("Inspect this evidence");
		expect(read("[data-followup-result]")).toBe("OPEN record supplied");
	});
	it("supports Chinese keyboard-ready controls and selected-scene reset", () => {
		render(<PrintReviewConceptLab locale="zh" data={data} />);
		change("成交检查时间轴", "3");
		expect((screen.getByLabelText("检查步骤") as HTMLSelectElement).value).toBe(
			"3",
		);
		click("缺失");
		expect(read("[data-review-premium]")).toBe("不可确定");
		click("重置场景");
		expect(read("[data-review-premium]")).toBe("$102,500");
	});
	it("does not substitute a client fixture when authorized teaching data is missing or mismatched", () => {
		const page = render(<PrintReviewConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
		page.rerender(
			<PrintReviewConceptLab locale="en" data={sentimentConceptData} />,
		);
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
	});
	it("uses only the authorized Learn projection and preserves the version 2 premium/inference assessment", () => {
		const scenario = getLessonScenarios("validate-option-print")[0];
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
		const view = projectAttempt(scenario, state, "review-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		click("Missing");
		expect(onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
		const next = projectAttempt(
			scenario,
			transitionAttempt(scenario, state, { type: "continue" }),
			"review-test",
			1,
		);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
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
			{ id: "premium", accepted: ["63000"] },
			{ id: "inference", accepted: ["seller"] },
		]);
		expect(
			previewLearningImpl({
				lessonId: "validate-option-print",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
