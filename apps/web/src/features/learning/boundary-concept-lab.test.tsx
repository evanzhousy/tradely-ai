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
import { boundaryConceptData as data } from "@/content/units/boundary-concept.server";
import {
	changedQuestionFields,
	questionDeclaration,
	requiredQuestionFields,
} from "@/domain/learning/boundary-concept";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { BoundaryConceptLab } from "./boundary-concept-lab";
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
const read = (s: string) => document.querySelector(s)?.textContent;
const change = (name: string, value: string) =>
	fireEvent.change(screen.getByLabelText(name), { target: { value } });
const tab = (name: RegExp) =>
	fireEvent.click(screen.getByRole("tab", { name }));
const click = (name: string) =>
	fireEvent.click(screen.getByRole("button", { name }));
const lab = () => render(<BoundaryConceptLab locale="en" data={data} />);
describe("audited research SVG lesson", () => {
	it("requires explicit baseline and additional forecast design fields without double counting", () => {
		expect(questionDeclaration(["subject", "subject"], false).declared).toBe(1);
		expect(
			questionDeclaration(requiredQuestionFields(false), false).missing,
		).toEqual([]);
		expect(
			questionDeclaration(requiredQuestionFields(false), true).missing,
		).toEqual(["outcome", "horizon", "evaluation"]);
		expect(
			questionDeclaration(requiredQuestionFields(true), true).declared,
		).toBe(9);
	});
	it("distinguishes changed identity from corrected observations or coverage", () => {
		expect(
			changedQuestionFields(data.original.identity, data.revisions[0].identity),
		).toEqual([]);
		expect(
			changedQuestionFields(data.original.identity, data.revisions[1].identity),
		).toEqual(["population"]);
		expect(
			changedQuestionFields(data.original.identity, data.revisions[2].identity),
		).toEqual(["quantity", "method"]);
		expect(
			changedQuestionFields(data.original.identity, data.revisions[3].identity),
		).toEqual([]);
	});
	it("makes required declarations inspectable through native SVG fields", () => {
		lab();
		expect(read("[data-boundary-declared]")).toContain("3 / 6");
		fireEvent.click(screen.getByRole("button", { name: /Session \/ cutoff/ }));
		fireEvent.click(
			screen.getByRole("button", { name: /Evidence requirements/ }),
		);
		fireEvent.click(screen.getByRole("button", { name: /Revision rule/ }));
		expect(read("[data-boundary-declared]")).toContain("6 / 6");
		expect(read("[data-boundary-missing]")).toContain("no finding or forecast");
		change("Question type", "forecast");
		expect(read("[data-boundary-declared]")).toContain("3 / 9");
		expect(read("[data-boundary-missing]")).toContain("Held-out evaluation");
	});
	it("plays declarations and stops when a learner changes one", () => {
		vi.useFakeTimers();
		lab();
		click("Play explanation");
		expect(read("[data-boundary-declared]")).toContain("0 / 6");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-boundary-declared]")).toContain("1 / 6");
		fireEvent.click(screen.getByRole("button", { name: /Session \/ cutoff/ }));
		act(() => vi.advanceTimersByTime(10000));
		expect(read("[data-boundary-declared]")).toContain("2 / 6");
		expect(
			screen.getByRole("button", { name: "Play explanation" }),
		).toBeTruthy();
	});
	it("keeps classification feedback local and distinguishes observations from interpretations", () => {
		lab();
		tab(/Sort the evidence/);
		click("Interpretation");
		expect(read("[data-boundary-category]")).toContain("does not capture");
		click("Observation");
		expect(read("[data-boundary-category]")).toContain("fits");
		change("Evidence statement", "story");
		expect(read("[data-boundary-category]")).toContain("Choose");
		click("Interpretation");
		expect(read("[data-boundary-category]")).toContain("fits");
	});
	it("accepts multiple evidence roles without converting missing values to zero", () => {
		lab();
		tab(/Sort the evidence/);
		change("Evidence statement", "correction");
		click("Observation");
		expect(read("[data-boundary-category]")).toContain("fits");
		click("Contradiction");
		expect(read("[data-boundary-category]")).toContain("fits");
		change("Evidence statement", "gap");
		click("Unknown");
		expect(read("[data-boundary-category]")).toContain("fits");
		expect(screen.getByText(/Its volume is unknown, not zero/)).toBeTruthy();
	});
	it("preserves the original through same-question revisions and new question drafts", () => {
		lab();
		tab(/Preserve the revision/);
		const original = data.original.claim[0];
		expect(screen.getByText(original)).toBeTruthy();
		click("Record decision");
		expect(read("[data-boundary-decision]")).toContain("Same question");
		change("Revision proposal", "puts");
		expect(read("[data-boundary-decision]")).toContain("pending");
		click("Record decision");
		expect(read("[data-boundary-decision]")).toBe("New question; retain Q1");
		expect(screen.getByText(original)).toBeTruthy();
		change("Revision proposal", "coverage");
		click("Record decision");
		expect(read("[data-boundary-decision]")).toContain("Same question");
		expect(screen.getByText(data.revisions[3].claim[0])).toBeTruthy();
	});
	it("plays revision stages with no premature new conclusion", () => {
		vi.useFakeTimers();
		lab();
		tab(/Preserve the revision/);
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-boundary-decision]")).toContain("pending");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-boundary-decision]")).toContain("Same question");
		click("Reset scene");
		expect(read("[data-boundary-decision]")).toContain("pending");
	});
	it("supports Chinese and guards unavailable data", () => {
		const page = render(<BoundaryConceptLab locale="zh" data={data} />);
		change("问题类型", "forecast");
		expect(read("[data-boundary-declared]")).toContain("3 / 9");
		page.rerender(<BoundaryConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
	});
	it("preserves version 2 grading and reflective self-review without granting mastery", () => {
		const scenario = getLessonScenarios("audited-boundary")[0];
		let state = initialAttemptState();
		const props = {
			locale: "en" as const,
			busy: false,
			error: null,
			onOpen: vi.fn(),
			onRecover: vi.fn(),
			onAction: vi.fn(),
		};
		const view = projectAttempt(scenario, state, "boundary-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		change("Question type", "forecast");
		expect(props.onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(props.onAction).toHaveBeenCalledExactlyOnceWith({
			type: "continue",
		});
		state = transitionAttempt(scenario, state, { type: "continue" });
		const next = projectAttempt(scenario, state, "boundary-test", 1);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		state = transitionAttempt(scenario, state, {
			type: "answer",
			questionId: "change",
			choiceId: "same",
		});
		state = transitionAttempt(scenario, state, {
			type: "respond",
			questionId: "question",
			value:
				"Compare BETA October 16 calls during September 3 using tape-B through the complete session cutoff; missing required coverage withholds the full-population leader.",
		});
		state = transitionAttempt(scenario, state, { type: "submit" });
		const feedback = projectAttempt(
			scenario,
			state,
			"boundary-test",
			2,
		).feedback;
		expect(feedback[0].met).toBe(true);
		expect(feedback[1]).toMatchObject({ met: false, reviewRequired: true });
		expect(
			previewLearningImpl({
				lessonId: "audited-boundary",
				variant: 0,
				actions: [],
			}),
		).toMatchObject({
			ok: true,
			view: {
				attemptId: "preview",
				step: { conceptLab: "audited-boundary", conceptData: data },
			},
		});
	});
});
