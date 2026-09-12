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
import { levelsConceptData as data } from "@/content/units/levels-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	concentration,
	expirationPayout,
	levelDistances,
	payoutMinima,
} from "@/domain/learning/levels-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { LevelsConceptLab } from "./levels-concept-lab";

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
const lab = () => render(<LevelsConceptLab locale="en" data={data} />);
describe("structural levels SVG lesson", () => {
	it("keeps concentration rule, option type and expiry scope explicit", () => {
		const near = data.rows.slice(0, 3);
		expect(
			concentration(
				near,
				"gamma",
				"call",
				data.strikes,
				data.expiries.slice(0, 1),
			).winners,
		).toEqual([100]);
		expect(
			concentration(near, "oi", "call", data.strikes, data.expiries.slice(0, 1))
				.winners,
		).toEqual([105]);
		expect(
			concentration(data.rows, "gamma", "call", data.strikes, data.expiries)
				.winners,
		).toEqual([105]);
		expect(
			concentration(data.rows, "gamma", "put", data.strikes, data.expiries)
				.winners,
		).toEqual([95]);
	});
	it("retains ties and rejects incomplete scope or a zero-only concentration", () => {
		const rows = data.rows.slice(0, 3).map((r) => ({ ...r, callOi: 10 }));
		expect(
			concentration(rows, "oi", "call", data.strikes, data.expiries.slice(0, 1))
				.winners,
		).toEqual([95, 100, 105]);
		expect(
			concentration(
				rows.slice(0, 2),
				"oi",
				"call",
				data.strikes,
				data.expiries.slice(0, 1),
			).complete,
		).toBe(false);
		expect(
			concentration(rows, "oi", "call", data.strikes, data.expiries).complete,
		).toBe(false);
		expect(
			concentration(
				rows.map((r) => ({ ...r, callOi: 0 })),
				"oi",
				"call",
				data.strikes,
				data.expiries.slice(0, 1),
			).winners,
		).toEqual([]);
	});
	it("calculates intrinsic payout without gamma or premiums and preserves candidate ties", () => {
		const rows = data.payoutSets[0].rows;
		expect(expirationPayout(rows, 95)).toEqual({
			calls: 0,
			puts: 10000,
			total: 10000,
		});
		expect(expirationPayout(rows, 105)).toEqual({
			calls: 5000,
			puts: 0,
			total: 5000,
		});
		expect(payoutMinima(rows, data.candidates)).toEqual([100]);
		expect(payoutMinima(data.payoutSets[1].rows, data.candidates)).toEqual([
			95, 100, 105,
		]);
		expect(expirationPayout(data.payoutSets[2].rows, 100)).toBeNull();
		expect(payoutMinima(data.payoutSets[2].rows, data.candidates)).toEqual([]);
	});
	it("keeps partial distance availability and refuses incompatible scales", () => {
		expect(levelDistances(100, 102, 2)).toMatchObject({ dollars: -2, atr: -1 });
		expect(levelDistances(100, 102, 2).percent).toBeCloseTo(-1.9607843, 6);
		expect(levelDistances(100, 102, null)).toMatchObject({
			dollars: -2,
			atr: null,
		});
		expect(levelDistances(100, 102, 0).atr).toBeNull();
		expect(levelDistances(100, 51, 1, false)).toEqual({
			dollars: null,
			percent: null,
			atr: null,
		});
		expect(levelDistances(50, 51, 1)).toMatchObject({ dollars: -1, atr: -1 });
		expect(levelDistances(100, 0, 2).percent).toBeNull();
	});
	it("updates SVG concentration and selected-strike details", () => {
		lab();
		expect(read("[data-level-winner]")).toBe("100");
		change("Concentration rule", "oi");
		expect(read("[data-level-winner]")).toBe("105");
		click("Strike 105");
		expect(read("[data-level-selected]")).toContain("105 · 100");
		change("Expiry scope", "all");
		expect(read("[data-level-winner]")).toBe("100");
		change("Concentration rule", "gamma");
		expect(read("[data-level-winner]")).toBe("105");
		change("Option type", "put");
		expect(read("[data-level-winner]")).toBe("95");
		click("Reset scene");
		expect(read("[data-level-winner]")).toBe("100");
	});
	it("plays settlement candidates and stops on direct input", () => {
		vi.useFakeTimers();
		lab();
		tab(/Explore payout minima/);
		click("Play explanation");
		expect(read("[data-level-total-payout]")).toContain("$20,000");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-level-total-payout]")).toContain("$10,000");
		change("Hypothetical settlement", "105");
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-level-total-payout]")).toContain("$5,000");
		expect(
			screen.getByRole("button", { name: "Play explanation" }),
		).toBeTruthy();
	});
	it("exposes candidate ties and withholds missing OI totals", () => {
		lab();
		tab(/Explore payout minima/);
		click("Settlement candidate 95");
		expect(read("[data-level-put-payout]")).toContain("$10,000");
		change("Payout set", "plateau");
		expect(read("[data-level-minima]")).toBe("95 / 100 / 105");
		click("Settlement candidate 100");
		expect(read("[data-level-total-payout]")).toContain("$20,000");
		change("Payout set", "missing");
		expect(read("[data-level-minima]")).toBe("—");
		expect(read("[data-level-total-payout]")).toContain("—");
		click("Reset scene");
		expect(read("[data-level-total-payout]")).toContain("$0");
	});
	it("distinguishes ATR availability from price-scale compatibility", () => {
		lab();
		tab(/Measure the distance/);
		expect(read("[data-level-distance=atr]")).toBe("-1");
		change("Supplied ATR", "4");
		expect(read("[data-level-distance=atr]")).toBe("-0.5");
		expect(read("[data-level-distance=dollars]")).toBe("-2");
		change("Reference compatibility", "missing");
		expect(read("[data-level-distance=atr]")).toBe("—");
		expect(read("[data-level-distance=percent]")).toBe("-1.96%");
		change("Reference compatibility", "unadjusted");
		expect(read("[data-level-distance=dollars]")).toBe("—");
		change("Reference compatibility", "adjusted");
		expect(read("[data-level-distance=dollars]")).toBe("-1");
		expect(read("[data-level-distance=atr]")).toBe("-1");
	});
	it("supports Chinese and guards unavailable data", () => {
		const page = render(<LevelsConceptLab locale="zh" data={data} />);
		change("集中度规则", "oi");
		expect(read("[data-level-winner]")).toBe("105");
		page.rerender(<LevelsConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
	});
	it("preserves authorized Learn and original version 2 grading", () => {
		const scenario = getLessonScenarios("structural-levels")[0];
		let state = initialAttemptState();
		const props = {
			locale: "en" as const,
			busy: false,
			error: null,
			onOpen: vi.fn(),
			onRecover: vi.fn(),
			onAction: vi.fn(),
		};
		const view = projectAttempt(scenario, state, "levels-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		change("Concentration rule", "oi");
		expect(props.onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(props.onAction).toHaveBeenCalledExactlyOnceWith({
			type: "continue",
		});
		state = transitionAttempt(scenario, state, { type: "continue" });
		const next = projectAttempt(scenario, state, "levels-test", 1);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		for (const [questionId, value] of [
			["distance", "-1"],
			["payout", "5000"],
		])
			state = transitionAttempt(scenario, state, {
				type: "respond",
				questionId,
				value,
			});
		state = transitionAttempt(scenario, state, { type: "submit" });
		expect(
			projectAttempt(scenario, state, "levels-test", 2).feedback.map(
				(f) => f.met,
			),
		).toEqual([true, true]);
		expect(
			previewLearningImpl({
				lessonId: "structural-levels",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
