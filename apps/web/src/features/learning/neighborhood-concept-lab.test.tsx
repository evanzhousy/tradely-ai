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
import { neighborhoodConceptData as data } from "@/content/units/neighborhood-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	neighborhoodEvidenceStatus,
	neighborhoodSummary,
} from "@/domain/learning/neighborhood-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { NeighborhoodConceptLab } from "./neighborhood-concept-lab";

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
const lab = () => render(<NeighborhoodConceptLab locale="en" data={data} />);
describe("contract neighborhood SVG lesson", () => {
	it("separates equal totals and peaks from nonzero breadth", () => {
		expect(
			neighborhoodSummary(data.snapshots[0].data, data.requiredIds),
		).toMatchObject({
			complete: true,
			total: 8000,
			peak: 3000,
			breadth: 3,
			knownCount: 9,
		});
		expect(
			neighborhoodSummary(data.snapshots[1].data, data.requiredIds),
		).toMatchObject({ complete: true, total: 8000, peak: 3000, breadth: 9 });
	});
	it("withholds complete totals and peaks for missing or prior-session required cells", () => {
		for (const i of [2, 3])
			expect(
				neighborhoodSummary(data.snapshots[i].data, data.requiredIds),
			).toMatchObject({
				complete: false,
				knownCount: 8,
				knownTotal: 7500,
				knownPeak: 3000,
				total: null,
				peak: null,
				breadth: null,
			});
		expect(
			neighborhoodEvidenceStatus(
				data.snapshots[3].data,
				data.snapshots[3].data.contracts[0],
			),
		).toBe("stale");
	});
	it("does not admit an outside-scope maximum or duplicate identities", () => {
		const outside = data.snapshots[4].data;
		expect(neighborhoodSummary(outside, data.requiredIds)).toMatchObject({
			complete: true,
			total: 8000,
			peak: 3000,
		});
		expect(
			neighborhoodEvidenceStatus(
				outside,
				outside.contracts[outside.contracts.length - 1],
			),
		).toBe("out_of_scope");
		expect(
			neighborhoodSummary(
				{ ...outside, contracts: [...outside.contracts, outside.contracts[0]] },
				data.requiredIds,
			),
		).toMatchObject({ complete: false, knownTotal: null, total: null });
	});
	it("keeps explicit zero known and rejects non-finite or negative current values", () => {
		const base = data.snapshots[0].data;
		expect(neighborhoodEvidenceStatus(base, base.contracts[0])).toBe(
			"comparable",
		);
		for (const volume of [Number.NaN, -1, Number.POSITIVE_INFINITY])
			expect(
				neighborhoodEvidenceStatus(base, { ...base.contracts[0], volume }),
			).toBe("missing");
		expect(
			neighborhoodSummary(
				{ ...base, contracts: base.contracts.slice(1) },
				data.requiredIds,
			).complete,
		).toBe(false);
	});
	it("keeps expiry focus and moneyness changes separate from full observed activity", () => {
		lab();
		expect(read("[data-neighbor-full]")).toContain("8,000");
		change("Expiry focus", "14");
		expect(read("[data-neighbor-slice]")).toContain("0");
		expect(read("[data-neighbor-full]")).toContain("8,000");
		click("30d · 105");
		expect(read("[data-neighbor-selected]")).toContain("2,500");
		expect(read("[data-neighbor-money]")).toContain("OTM");
		change("Hypothetical reference spot", "105");
		expect(read("[data-neighbor-money]")).toContain("ATM");
		change("Hypothetical reference spot", "110");
		expect(read("[data-neighbor-money]")).toContain("ITM");
		expect(read("[data-neighbor-full]")).toContain("8,000");
	});
	it("compares layouts through explicit playback without changing peak or total", () => {
		vi.useFakeTimers();
		lab();
		tab(/Compare the shapes/);
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-neighbor-breadth]")).toBe("Complete nonzero count: 9");
		expect(read("[data-neighbor-total]")).toBe("Complete total: 8,000");
		expect(read("[data-neighbor-peak]")).toBe("Complete peak: 3,000");
		change("Supplied layout", "0");
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-neighbor-breadth]")).toBe("Complete nonzero count: 3");
	});
	it("exposes missing and stale evidence without promoting a known peak to the complete peak", () => {
		lab();
		tab(/Audit the candidates/);
		change("Evidence snapshot", "missing");
		click("60d · 105");
		expect(read("[data-neighbor-status]")).toBe("Missing required observation");
		expect(read("[data-neighbor-complete]")).toBe("Complete scope total: —");
		expect(read("[data-neighbor-known-peak]")).toBe(
			"Known eligible peak: 3,000",
		);
		expect(read("[data-neighbor-complete-peak]")).toBe(
			"Complete scope peak: —",
		);
		change("Evidence snapshot", "prior");
		expect(read("[data-neighbor-quality-detail]")).toContain("12,000");
		expect(read("[data-neighbor-status]")).toBe("Prior-session observation");
	});
	it("makes the out-of-scope attraction directly inspectable while preserving the fixed scope", () => {
		lab();
		tab(/Audit the candidates/);
		change("Evidence snapshot", "outside");
		fireEvent.click(
			screen.getByRole("button", { name: /Inspect outside-scope row/ }),
		);
		expect(read("[data-neighbor-quality-detail]")).toContain("20,000");
		expect(read("[data-neighbor-status]")).toBe("Outside declared scope");
		expect(read("[data-neighbor-complete]")).toBe(
			"Complete scope total: 8,000",
		);
		click("Reset scene");
		expect(read("[data-neighbor-status]")).toBe("Eligible current observation");
	});
	it("supports Chinese and guards unavailable data", () => {
		const page = render(<NeighborhoodConceptLab locale="zh" data={data} />);
		change("到期聚焦", "14");
		expect(read("[data-neighbor-full]")).toContain("8,000");
		page.rerender(<NeighborhoodConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
	});
	it("preserves version 2 grading, neighborhood investigation and paid access", () => {
		const scenario = getLessonScenarios("rank-contracts")[0];
		let state = initialAttemptState();
		const props = {
			locale: "en" as const,
			busy: false,
			error: null,
			onOpen: vi.fn(),
			onRecover: vi.fn(),
			onAction: vi.fn(),
		};
		const view = projectAttempt(scenario, state, "neighbor-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		change("Expiry focus", "14");
		expect(props.onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(props.onAction).toHaveBeenCalledExactlyOnceWith({
			type: "continue",
		});
		state = transitionAttempt(scenario, state, { type: "continue" });
		const next = projectAttempt(scenario, state, "neighbor-test", 1);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(next.step.neighborhoodPair?.cases).toHaveLength(2);
		expect(scenario.version).toBe(2);
		state = transitionAttempt(scenario, state, {
			type: "respond",
			questionId: "breadth-a",
			value: "3",
		});
		state = transitionAttempt(scenario, state, {
			type: "answer",
			questionId: "moneyness",
			choiceId: "otm",
		});
		state = transitionAttempt(scenario, state, { type: "submit" });
		expect(
			projectAttempt(scenario, state, "neighbor-test", 2).feedback.map(
				(f) => f.met,
			),
		).toEqual([true, true]);
		expect(
			previewLearningImpl({
				lessonId: "rank-contracts",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
