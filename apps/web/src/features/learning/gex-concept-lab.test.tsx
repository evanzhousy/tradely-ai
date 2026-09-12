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
import { gexConceptData as data } from "@/content/units/gex-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import { contractGex, summarizeGex } from "@/domain/learning/gex-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { GexConceptLab } from "./gex-concept-lab";
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
const lab = () => render(<GexConceptLab locale="en" data={data} />);
describe("gamma exposure SVG lesson", () => {
	it("scales the stated dollar per 1 percent expression and keeps assumed sign explicit", () => {
		expect(contractGex(data.contract)).toBe(200000);
		expect(contractGex({ ...data.contract, spot: 200 })).toBe(800000);
		expect(contractGex({ ...data.contract, oi: 2000 })).toBe(400000);
		expect(contractGex({ ...data.contract, sign: -1 })).toBe(-200000);
		expect(contractGex({ ...data.contract, sign: null })).toBeNull();
		expect(contractGex({ ...data.contract, oi: 0 })).toBe(0);
	});
	it("withholds invalid and missing inputs", () => {
		for (const gamma of [null, -1, Number.NaN, Number.POSITIVE_INFINITY])
			expect(contractGex({ ...data.contract, gamma })).toBeNull();
		for (const oi of [null, -1, 1.5, Number.POSITIVE_INFINITY])
			expect(contractGex({ ...data.contract, oi })).toBeNull();
		expect(contractGex({ ...data.contract, spot: 0 })).toBeNull();
		expect(contractGex({ ...data.contract, multiplier: 0 })).toBeNull();
	});
	it("distinguishes equal net totals from gross and local distribution", () => {
		const [a, b] = data.snapshots;
		expect(summarizeGex(a.cells, data.requiredIds)).toMatchObject({
			complete: true,
			net: 100,
			gross: 400,
		});
		expect(summarizeGex(b.cells, data.requiredIds)).toMatchObject({
			complete: true,
			net: 100,
			gross: 100,
		});
		const ids = data.requiredIds.slice(0, 3);
		expect(summarizeGex(a.cells.slice(0, 3), ids).net).toBe(-150);
		expect(summarizeGex(b.cells.slice(0, 3), ids).net).toBe(100);
	});
	it("retains zero observations but never substitutes missing or excluded values", () => {
		expect(
			summarizeGex(data.snapshots[2].cells, data.requiredIds),
		).toMatchObject({
			complete: false,
			knownCount: 5,
			knownNet: -20,
			net: null,
			gross: null,
		});
		expect(
			summarizeGex(
				data.snapshots[0].cells.filter((c) => c.traded),
				data.requiredIds,
			),
		).toMatchObject({
			complete: false,
			knownCount: 4,
			knownNet: 60,
			knownGross: 200,
			net: null,
		});
		expect(
			summarizeGex(data.snapshots[1].cells, data.requiredIds).knownCount,
		).toBe(6);
		expect(summarizeGex([], data.requiredIds)).toMatchObject({
			complete: false,
			knownNet: 0,
			net: null,
		});
	});
	it("rejects duplicate or foreign identities instead of double counting", () => {
		const cells = data.snapshots[0].cells;
		for (const invalid of [
			[...cells, cells[0]],
			[...cells, { ...cells[0], id: "foreign" }],
		])
			expect(summarizeGex(invalid, data.requiredIds)).toMatchObject({
				complete: false,
				knownNet: null,
				net: null,
			});
		expect(
			summarizeGex(cells, [...data.requiredIds, data.requiredIds[0]]).complete,
		).toBe(false);
	});
	it("links formula controls, absent assumptions and reset", () => {
		lab();
		expect(read("[data-gex-formula]")).toBe("+200,000");
		change("Hypothetical spot", "200");
		expect(read("[data-gex-formula]")).toBe("+800,000");
		change("Assumed position sign", "-1");
		expect(read("[data-gex-formula]")).toBe("-800,000");
		change("Assumed position sign", "unknown");
		expect(read("[data-gex-formula]")).toBe("—");
		click("Reset scene");
		expect(read("[data-gex-formula]")).toBe("+200,000");
	});
	it("plays OI steps and stops when the learner changes an input", () => {
		vi.useFakeTimers();
		lab();
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-gex-formula]")).toBe("+300,000");
		change("Open interest contracts", "2000");
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-gex-formula]")).toBe("+400,000");
		expect(
			screen.getByRole("button", { name: "Play explanation" }),
		).toBeTruthy();
	});
	it("selects SVG cells without confusing the expiry slice with full totals", () => {
		lab();
		tab(/Inspect the distribution/);
		expect(read("[data-gex-net]")).toContain("+100");
		expect(read("[data-gex-gross]")).toContain("400");
		expect(read("[data-gex-slice]")).toBe("-150");
		click("2030-10-18 · 100");
		expect(read("[data-gex-slice]")).toBe("+250");
		expect(read("[data-gex-cell]")).toContain("+120");
		expect(read("[data-gex-net]")).toContain("+100");
		change("Distribution", "b");
		expect(read("[data-gex-slice]")).toBe("0");
		expect(read("[data-gex-gross]")).toContain("100");
		change("Inspect cell", data.requiredIds[0]);
		expect(read("[data-gex-slice]")).toBe("+100");
	});
	it("makes coverage and explicit zero distinctions inspectable", () => {
		lab();
		tab(/Check the whole chain/);
		change("Coverage view", "traded");
		expect(read("[data-gex-known]")).toBe("+60");
		expect(read("[data-gex-complete]")).toBe("—");
		change("Inspect required cell", data.requiredIds[1]);
		expect(read("[data-gex-coverage-cell]")).toContain("Excluded");
		change("Coverage view", "gap");
		expect(read("[data-gex-known]")).toBe("-20");
		expect(read("[data-gex-complete]")).toBe("—");
		change("Coverage view", "zeros");
		expect(read("[data-gex-complete]")).toBe("+100");
		expect(read("[data-gex-coverage-status]")).toContain("Complete");
		click("Reset scene");
		expect(read("[data-gex-complete-gross]")).toContain("400");
	});
	it("supports Chinese and guards unavailable teaching data", () => {
		const page = render(<GexConceptLab locale="zh" data={data} />);
		change("假设持仓符号", "-1");
		expect(read("[data-gex-formula]")).toBe("-200,000");
		page.rerender(<GexConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
	});
	it("preserves authorized Learn and original version 2 grading", () => {
		const scenario = getLessonScenarios("gamma-exposure")[0];
		let state = initialAttemptState();
		const props = {
			locale: "en" as const,
			busy: false,
			error: null,
			onOpen: vi.fn(),
			onRecover: vi.fn(),
			onAction: vi.fn(),
		};
		const view = projectAttempt(scenario, state, "gex-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		change("Open interest contracts", "2000");
		expect(props.onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(props.onAction).toHaveBeenCalledExactlyOnceWith({
			type: "continue",
		});
		state = transitionAttempt(scenario, state, { type: "continue" });
		const next = projectAttempt(scenario, state, "gex-test", 1);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		for (const [questionId, value] of [
			["net", "60"],
			["gross", "160"],
		])
			state = transitionAttempt(scenario, state, {
				type: "respond",
				questionId,
				value,
			});
		state = transitionAttempt(scenario, state, {
			type: "answer",
			questionId: "compare",
			choiceId: "equal",
		});
		state = transitionAttempt(scenario, state, { type: "submit" });
		expect(
			projectAttempt(scenario, state, "gex-test", 2).feedback.map((f) => f.met),
		).toEqual([true, true, true]);
		expect(
			previewLearningImpl({
				lessonId: "gamma-exposure",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
