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
import { flowImpactConceptData as data } from "@/content/units/flow-impact-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	effectiveVolume,
	flowImpact,
	summarizeFlow,
	tradeMagnitude,
} from "@/domain/learning/flow-impact-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { FlowImpactConceptLab } from "./flow-impact-concept-lab";
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
const lab = () => render(<FlowImpactConceptLab locale="en" data={data} />);
describe("flow impact SVG lesson", () => {
	it("uses absolute trade delta and stated classification, retaining neutral coverage", () => {
		expect(tradeMagnitude(data.prints[1])).toBe(20000);
		expect(summarizeFlow(data.prints)).toEqual({
			net: 40000,
			gross: 90000,
			neutral: 10000,
			premium: 40000,
		});
		expect(
			summarizeFlow(
				data.prints.map((p) => ({ ...p, classification: "neutral" })),
			),
		).toEqual({ net: 0, gross: 90000, neutral: 90000, premium: 0 });
	});
	it("can cancel or reverse net flow without erasing gross activity", () => {
		const alter = (contracts: number) =>
			data.prints.map((p, i) => (i === 1 ? { ...p, contracts } : p));
		expect(summarizeFlow(alter(1500))).toMatchObject({ net: 0, gross: 130000 });
		expect(summarizeFlow(alter(2000))).toMatchObject({
			net: -20000,
			gross: 150000,
		});
		expect(flowImpact(-20000, data.references[0])).toBe(2);
	});
	it("does not replace unknown magnitude or directional premium with zero", () => {
		for (const delta of [null, Number.NaN, Number.POSITIVE_INFINITY, 1.1])
			expect(tradeMagnitude({ ...data.prints[0], delta })).toBeNull();
		expect(tradeMagnitude({ ...data.prints[0], contracts: 1.5 })).toBeNull();
		expect(summarizeFlow([{ ...data.prints[0], delta: null }])).toMatchObject({
			net: null,
			gross: null,
			premium: 120000,
		});
		expect(summarizeFlow([{ ...data.prints[0], premium: null }])).toMatchObject(
			{ net: 60000, premium: null },
		);
		expect(summarizeFlow([])).toEqual({
			net: null,
			gross: null,
			neutral: null,
			premium: null,
		});
	});
	it("requires positive volume and a declared proxy scale and method", () => {
		expect(effectiveVolume(data.references[0])).toBe(1000000);
		expect(effectiveVolume(data.references[1])).toBe(1000000);
		for (const ref of data.references.slice(2)) {
			expect(effectiveVolume(ref)).toBeNull();
			expect(flowImpact(40000, ref)).toBeNull();
		}
		expect(flowImpact(40000, { ...data.references[0], volume: 2000000 })).toBe(
			2,
		);
		expect(flowImpact(0, data.references[0])).toBe(0);
		expect(flowImpact(null, data.references[0])).toBeNull();
		expect(
			effectiveVolume({
				...data.references[1],
				scale: Number.POSITIVE_INFINITY,
			}),
		).toBeNull();
	});
	it("does not silently route OI or GEX into tape DEI", () => {
		expect(flowImpact(40000, data.references[0], "tape")).toBe(4);
		expect(flowImpact(40000, data.references[0], "oi")).toBeNull();
		expect(flowImpact(40000, data.references[0], "gex")).toBeNull();
	});
	it("links contract size, classification, gross and premium independently", () => {
		lab();
		expect(read("[data-flow-net]")).toBe("+40,000");
		change("Print B contracts", "1500");
		expect(read("[data-flow-net]")).toBe("0");
		expect(read("[data-flow-gross]")).toContain("130,000");
		expect(read("[data-flow-premium]")).toContain("$-120,000");
		change("Print B inferred flow", "bullish");
		expect(read("[data-flow-net]")).toBe("+120,000");
		expect(read("[data-flow-premium]")).toContain("$+360,000");
		change("Print B inferred flow", "neutral");
		expect(read("[data-flow-net]")).toBe("+60,000");
		expect(read("[data-flow-gross]")).toContain("130,000");
		click("Reset scene");
		expect(read("[data-flow-net]")).toBe("+40,000");
	});
	it("plays size changes and stops on direct input", () => {
		vi.useFakeTimers();
		lab();
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-flow-net]")).toBe("+20,000");
		change("Print B contracts", "2000");
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-flow-net]")).toBe("-20,000");
		expect(
			screen.getByRole("button", { name: "Play explanation" }),
		).toBeTruthy();
	});
	it("changes DEI while keeping independent GEX fixed and rejects incomplete references", () => {
		lab();
		tab(/Change the denominator/);
		const gex = read("[data-flow-fixed-gex]");
		expect(read("[data-flow-dei]")).toBe("4%");
		change("Typical share volume", "2000000");
		expect(read("[data-flow-dei]")).toBe("2%");
		expect(read("[data-flow-fixed-gex]")).toBe(gex);
		change("Volume reference", "proxy");
		expect(read("[data-flow-dei]")).toBe("4%");
		for (const id of ["unscaled", "undocumented", "missing", "zero"]) {
			change("Volume reference", id);
			expect(read("[data-flow-dei]")).toBe("—");
		}
		click("Reset scene");
		expect(read("[data-flow-dei]")).toBe("4%");
	});
	it("supports SVG report selection and equivalent form controls", () => {
		lab();
		tab(/Trace the source/);
		expect(read("[data-flow-source-dei]")).toBe("4%");
		fireEvent.click(screen.getByRole("button", { name: /Reported ΔOI/ }));
		expect(read("[data-flow-source-dei]")).toBe("—");
		expect(read("[data-flow-source-detail]")).toContain(data.oi.asOf);
		change("Numerator source", "gex");
		expect(read("[data-flow-source-dei]")).toBe("—");
		expect(read("[data-flow-source-detail]")).toContain(data.gex.source);
		click("Reset scene");
		expect(read("[data-flow-source-dei]")).toBe("4%");
	});
	it("supports Chinese and guards unavailable data", () => {
		const page = render(<FlowImpactConceptLab locale="zh" data={data} />);
		change("成交 B 张数", "1500");
		expect(read("[data-flow-net]")).toBe("0");
		page.rerender(<FlowImpactConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
	});
	it("preserves authorized Learn and original version 2 grading", () => {
		const scenario = getLessonScenarios("dex-dei-gex")[0];
		let state = initialAttemptState();
		const props = {
			locale: "en" as const,
			busy: false,
			error: null,
			onOpen: vi.fn(),
			onRecover: vi.fn(),
			onAction: vi.fn(),
		};
		const view = projectAttempt(scenario, state, "flow-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		change("Print B contracts", "1500");
		expect(props.onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(props.onAction).toHaveBeenCalledExactlyOnceWith({
			type: "continue",
		});
		state = transitionAttempt(scenario, state, { type: "continue" });
		const next = projectAttempt(scenario, state, "flow-test", 1);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		for (const [questionId, value] of [
			["net-premium", "40000"],
			["net", "40000"],
			["dei", "4"],
		])
			state = transitionAttempt(scenario, state, {
				type: "respond",
				questionId,
				value,
			});
		state = transitionAttempt(scenario, state, { type: "submit" });
		expect(
			projectAttempt(scenario, state, "flow-test", 2).feedback.map(
				(f) => f.met,
			),
		).toEqual([true, true, true]);
		expect(
			previewLearningImpl({ lessonId: "dex-dei-gex", variant: 0, actions: [] }),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
