// @vitest-environment jsdom
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start/server-only", () => ({}));

import { getLessonScenarios } from "@/content/scenarios/index.server";
import { oiConceptData as data } from "@/content/units/oi-concept.server";
import { printReviewConceptData } from "@/content/units/print-review-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	cohortMembers,
	compareCohorts,
	replayOi,
	tradeOiChange,
} from "@/domain/learning/oi-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { OiConceptLab } from "./oi-concept-lab";

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
const side = (group: string, name: string) =>
	fireEvent.click(
		within(screen.getByRole("group", { name: group })).getByRole("button", {
			name,
		}),
	);
const lab = () => render(<OiConceptLab locale="en" data={data} />);
describe("volume and open interest concept lesson", () => {
	it("counts one OI effect for each matched contract and zero for either transfer direction", () => {
		expect(
			data.combinations.map((p) => tradeOiChange(p.buyer, p.seller, 10)),
		).toEqual([10, -10, 0, 0]);
	});
	it("keeps reported OI fixed until publication while correctly accounting for trades and paired exercise", () => {
		expect(
			[0, 1, 2, 3, 4, 5].map((stage) => {
				const r = replayOi(data, stage, true);
				return [r.volume, r.calculated, r.reported];
			}),
		).toEqual([
			[0, 100, 100],
			[10, 110, 100],
			[14, 106, 100],
			[20, 106, 100],
			[20, 104, 100],
			[20, 104, 104],
		]);
		expect(replayOi(data, 4, true).asOf).toBe("2030-05-31");
		expect(replayOi(data, 5, true).asOf).toBe("2030-06-03");
	});
	it("preserves observed volume and reports when position effects are unavailable", () => {
		expect(replayOi(data, 4, false)).toMatchObject({
			volume: 20,
			calculated: null,
			reported: 100,
			published: false,
		});
		expect(replayOi(data, 5, false)).toMatchObject({
			volume: 20,
			calculated: null,
			reported: 104,
			published: true,
		});
	});
	it("separates within-series change from entry and exit in rolling buckets", () => {
		const rolling = compareCohorts(data.series, data.dteRange, "rolling");
		expect(rolling).toMatchObject({
			first: 200,
			second: 420,
			delta: 220,
			entryOi: 300,
			exitOi: 80,
			retainedChange: 0,
		});
		expect(rolling.entered.map((s) => s.id)).toEqual(["C"]);
		expect(rolling.exited.map((s) => s.id)).toEqual(["A"]);
		const fixed = compareCohorts(data.series, data.dteRange, "fixed");
		expect(fixed).toMatchObject({
			first: 200,
			second: 200,
			delta: 0,
			entryOi: 0,
			exitOi: 0,
		});
		expect(fixed.after.map((s) => s.id)).toEqual(["A", "B"]);
	});
	it("includes exact DTE boundaries and keeps incomplete reports distinct from an empty cohort", () => {
		const bounds = [
			{
				id: "low",
				expiry: "example",
				dte: [14, 13] as const,
				oi: [1, 1] as const,
			},
			{
				id: "high",
				expiry: "example",
				dte: [30, 29] as const,
				oi: [2, 2] as const,
			},
		];
		expect(cohortMembers(bounds, [14, 30], "rolling", 0).length).toBe(2);
		expect(
			cohortMembers(bounds, [14, 30], "rolling", 1).map((s) => s.id),
		).toEqual(["high"]);
		expect(
			compareCohorts(
				data.series.map((s) =>
					s.id === "B" ? { ...s, oi: [120, null] as const } : s,
				),
				data.dteRange,
				"rolling",
			),
		).toMatchObject({
			first: 200,
			second: null,
			delta: null,
			retainedChange: null,
		});
		expect(compareCohorts([], data.dteRange, "rolling")).toMatchObject({
			first: 0,
			second: 0,
			delta: 0,
		});
	});
	it("links both party controls and quantity without treating transfers as no trading", () => {
		lab();
		expect(read("[data-trade-oi-change]")).toBe("+10");
		side("Buyer position effect", "Closes");
		expect(read("[data-trade-oi-change]")).toBe("0");
		expect(read("[data-trade-volume]")).toBe("+10");
		side("Seller position effect", "Closes");
		change("Executed quantity", "20");
		expect(read("[data-trade-oi-change]")).toBe("-20");
		expect(read("[data-trade-ending-oi]")).toContain("80");
		click("Reset scene");
		expect(read("[data-trade-oi-change]")).toBe("+10");
	});
	it("plays session events, pauses on SVG input and withholds calculated OI without flags", () => {
		vi.useFakeTimers();
		lab();
		fireEvent.click(screen.getByRole("tab", { name: /Replay two ledgers/ }));
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-session-volume]")).toBe("10");
		expect(read("[data-session-reported]")).toBe("100");
		fireEvent.pointerDown(screen.getByLabelText("Session ledger timeline"));
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-session-volume]")).toBe("10");
		change("Session ledger timeline", "4");
		expect(read("[data-session-calculated]")).toBe("104");
		expect(read("[data-session-reported]")).toBe("100");
		click("Prints only");
		expect(read("[data-session-calculated]")).toBe("—");
		change("Replay stop", "5");
		expect(read("[data-session-reported]")).toBe("104");
		expect(read("[data-session-calculated]")).toBe("—");
		expect(read("[data-session-volume]")).toBe("20");
	});
	it("changes cohort membership with the report date while fixed membership remains stable", () => {
		lab();
		fireEvent.click(screen.getByRole("tab", { name: /Compare the same set/ }));
		expect(read("[data-cohort-total]")).toBe("200");
		change("Report date", "1");
		expect(read("[data-cohort-total]")).toBe("420");
		expect(
			document
				.querySelector('[data-cohort-series="A"]')
				?.getAttribute("data-cohort-included"),
		).toBe("false");
		click("Fixed members");
		expect(read("[data-cohort-total]")).toBe("200");
		expect(read("[data-cohort-delta]")).toContain("0");
		expect(
			document
				.querySelector('[data-cohort-series="A"]')
				?.getAttribute("data-cohort-included"),
		).toBe("true");
	});
	it("supports Chinese resets and rejects missing or mismatched paid data", () => {
		const page = render(<OiConceptLab locale="zh" data={data} />);
		fireEvent.click(screen.getByRole("tab", { name: /回放两本台账/ }));
		change("时段台账时间轴", "4");
		expect(read("[data-session-volume]")).toBe("20");
		click("重置场景");
		expect(read("[data-session-volume]")).toBe("0");
		page.rerender(<OiConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
		page.rerender(<OiConceptLab locale="en" data={printReviewConceptData} />);
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
	});
	it("keeps exploration separate from version 2 assessment and its reported-OI contract", () => {
		const scenario = getLessonScenarios("session-flow-vs-structure")[0];
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
		const view = projectAttempt(scenario, state, "oi-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		change("Executed quantity", "15");
		expect(onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
		const next = projectAttempt(
			scenario,
			transitionAttempt(scenario, state, { type: "continue" }),
			"oi-test",
			1,
		);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(next.step.flowStructure?.reportedOi?.value).toBe(500);
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
			{ id: "volume", accepted: ["25"] },
			{ id: "ending-oi", accepted: ["507"] },
			{ id: "no-flags", accepted: ["no"] },
		]);
		expect(
			previewLearningImpl({
				lessonId: "session-flow-vs-structure",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
