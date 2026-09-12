// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start/server-only", () => ({}));

import { getLessonScenarios } from "@/content/scenarios/index.server";
import { surfaceConceptData as data } from "@/content/units/surface-concept.server";
import { volatilityConceptData } from "@/content/units/volatility-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	interpolateIv,
	surfaceCell,
	wingComparison,
} from "@/domain/learning/surface-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { SurfaceConceptLab } from "./surface-concept-lab";

beforeEach(() =>
	vi.stubGlobal("matchMedia", () => ({
		matches: true,
		addEventListener() {},
		removeEventListener() {},
	})),
);
afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});
const read = (selector: string) =>
	document.querySelector(selector)?.textContent;
const change = (name: string, value: string) =>
	fireEvent.change(screen.getByLabelText(name), { target: { value } });
const click = (name: string) =>
	fireEvent.click(screen.getByRole("button", { name }));
const tab = (name: RegExp) =>
	fireEvent.click(screen.getByRole("tab", { name }));
const lab = () => render(<SurfaceConceptLab locale="en" data={data} />);

describe("volatility surface SVG lesson", () => {
	it("keeps grid dimensions, dates and ATM anchors consistent", () => {
		for (const d of data.datasets) {
			expect(d.values).toHaveLength(data.expiries.length);
			for (const row of d.values) {
				expect(row).toHaveLength(data.strikes.length);
				for (const iv of row)
					if (iv !== null) {
						expect(iv).toBeGreaterThanOrEqual(0);
						expect(iv).toBeLessThanOrEqual(data.ivCeiling);
					}
			}
		}
		for (const expiry of data.expiries)
			expect(
				(Date.parse(expiry.date) - Date.parse(data.asOf.slice(0, 10))) /
					86400000,
			).toBe(expiry.days);
		for (const anchor of data.anchors)
			expect(
				surfaceCell(
					data,
					"quote",
					data.expiries.findIndex((e) => e.days === anchor.days),
					data.strikes.indexOf(data.spot),
				),
			).toBe(anchor.iv);
	});
	it("does not fill missing trade coverage with a quoted value or zero", () => {
		expect(surfaceCell(data, "quote", 1, 1)).toBe(24);
		expect(surfaceCell(data, "trade", 1, 1)).toBeNull();
		expect(surfaceCell(data, "quote", 1, 2)).toBeNull();
		expect(surfaceCell(data, "absent", 0, 0)).toBeNull();
		expect(surfaceCell(data, "quote", 99, 0)).toBeNull();
	});
	it("separates wing compatibility from the additional ATM requirement", () => {
		expect(wingComparison(data.wings[0], "put-call")).toEqual({
			skew: 6,
			butterfly: 5,
		});
		expect(wingComparison(data.wings[0], "call-put")).toEqual({
			skew: -6,
			butterfly: 5,
		});
		expect(wingComparison(data.wings[1], "put-call")).toEqual({
			skew: null,
			butterfly: null,
		});
		expect(wingComparison(data.wings[2], "put-call")).toEqual({
			skew: 6,
			butterfly: null,
		});
		for (const example of data.wings.slice(3))
			expect(wingComparison(example, "put-call")).toEqual({
				skew: null,
				butterfly: null,
			});
		const example = data.wings[0];
		expect(
			wingComparison(
				{ ...example, atm: { ...example.atm, source: "another source" } },
				"put-call",
			),
		).toEqual({ skew: 6, butterfly: null });
		expect(
			wingComparison(
				{ ...example, call: { ...example.call, iv: Number.NaN } },
				"put-call",
			).skew,
		).toBeNull();
	});
	it("keeps supplied tenors separate from two explicitly different interpolation rules", () => {
		expect(interpolateIv(data.anchors, 30, "none")).toMatchObject({
			iv: null,
			provenance: "unavailable",
			reason: "off",
		});
		expect(interpolateIv(data.anchors, 14, "none")).toEqual({
			iv: 28,
			provenance: "supplied",
			reason: null,
		});
		expect(interpolateIv(data.anchors, 30, "iv").iv).toBeCloseTo(
			25.714285714285715,
			8,
		);
		expect(interpolateIv(data.anchors, 30, "variance").iv).toBeCloseTo(
			24.851559307214508,
			8,
		);
		for (const method of ["iv", "variance"] as const)
			for (let days = 14; days <= 42; days++) {
				const result = interpolateIv(data.anchors, days, method);
				expect(result.iv).toBeGreaterThanOrEqual(24);
				expect(result.iv).toBeLessThanOrEqual(28);
			}
	});
	it("does not extrapolate or substitute missing anchors, but preserves an exact known node", () => {
		for (const days of [7, 70])
			expect(interpolateIv(data.anchors, days, "iv")).toMatchObject({
				iv: null,
				reason: "outside",
			});
		const missing = [data.anchors[0], { ...data.anchors[1], iv: null }];
		expect(interpolateIv(missing, 30, "variance")).toMatchObject({
			iv: null,
			reason: "missing",
		});
		expect(interpolateIv(missing, 14, "variance")).toMatchObject({
			iv: 28,
			provenance: "supplied",
		});
		expect(
			interpolateIv(
				[
					{ days: 14, iv: 0 },
					{ days: 42, iv: 0 },
				],
				30,
				"variance",
			),
		).toMatchObject({ iv: 0, provenance: "estimated" });
		expect(
			interpolateIv([data.anchors[0], data.anchors[0]], 14, "iv"),
		).toMatchObject({ iv: null, reason: "invalid" });
		expect(interpolateIv(data.anchors, 0, "variance").iv).toBeNull();
	});
	it("selects SVG cells and switches source and slice without filling gaps", () => {
		lab();
		expect(read("[data-surface-cell]")).toBe("24%");
		click("Inspect 2030-10-18 $110");
		expect(read("[data-surface-cell]")).toBe("—");
		expect(
			(screen.getByLabelText("Selected strike") as HTMLSelectElement).value,
		).toBe("2");
		change("Selected strike", "1");
		click("Term slice");
		expect(read("[data-surface-cell]")).toBe("24%");
		expect(
			Number(
				document
					.querySelector('[data-surface-point="42D"]')
					?.getAttribute("cx"),
			),
		).toBeCloseTo(65 + ((42 - 14) / (105 - 14)) * 230, 6);
		change("IV input coverage", "trade");
		expect(read("[data-surface-cell]")).toBe("—");
		click("Reset scene");
		expect(read("[data-surface-cell]")).toBe("24%");
	});
	it("shows the changed skew sign and preserves only calculable wing metrics", () => {
		lab();
		tab(/Compare the wings/);
		expect(read("[data-surface-skew]")).toBe("+6");
		expect(read("[data-surface-butterfly]")).toBe("+5");
		click("Call minus put");
		expect(read("[data-surface-skew]")).toBe("−6");
		change("Wing reference case", "atm-missing");
		expect(read("[data-surface-skew]")).toBe("−6");
		expect(read("[data-surface-butterfly]")).toBe("—");
		change("Wing reference case", "call-missing");
		expect(read("[data-surface-skew]")).toBe("—");
	});
	it("requires opt-in interpolation and marks the result's provenance", () => {
		lab();
		tab(/Inspect estimates/);
		expect(read("[data-surface-interpolated]")).toBe("—");
		expect(
			document.querySelector('[role="tabpanel"] svg path[stroke-dasharray]'),
		).toBeNull();
		change("Interpolation method", "iv");
		expect(
			document
				.querySelector('[role="tabpanel"] svg path[stroke-dasharray]')
				?.getAttribute("stroke-dasharray"),
		).toBe("5 4");
		expect(read("[data-surface-interpolated]")).toBe("25.7143%");
		expect(read("[data-surface-provenance]")).toBe(
			"Interpolated estimate · not a quote",
		);
		expect(
			document.querySelector('[role="tabpanel"] svg circle[fill="none"]'),
		).not.toBeNull();
		change("Interpolation method", "variance");
		expect(read("[data-surface-interpolated]")).toBe("24.8516%");
		change("Anchor coverage", "missing");
		expect(read("[data-surface-interpolated]")).toBe("—");
		change("Drag target tenor", "14");
		expect(read("[data-surface-interpolated]")).toBe("28%");
		expect(read("[data-surface-provenance]")).toBe("Supplied reference node");
		expect(
			(screen.getByLabelText("Target calendar days") as HTMLInputElement).value,
		).toBe("14");
		change("Target calendar days", "7");
		expect(read("[data-surface-interpolated]")).toBe("—");
		expect(read("[data-surface-provenance]")).toContain("no extrapolation");
	});
	it("supports Chinese and withholds missing or mismatched teaching data", () => {
		const page = render(<SurfaceConceptLab locale="zh" data={data} />);
		click("查看 2030-09-20 $100");
		expect(read("[data-surface-cell]")).toBe("28%");
		page.rerender(<SurfaceConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
		page.rerender(
			<SurfaceConceptLab locale="en" data={volatilityConceptData} />,
		);
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
	});
	it("keeps version 2 grading and local exploration behind the existing access boundary", () => {
		const scenario = getLessonScenarios("volatility-surface")[0];
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
		const view = projectAttempt(scenario, state, "surface-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		click("Term slice");
		expect(onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
		let nextState = transitionAttempt(scenario, state, { type: "continue" });
		const next = projectAttempt(scenario, nextState, "surface-test", 1);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		for (const [questionId, value] of [
			["skew", "6"],
			["butterfly", "2"],
		])
			nextState = transitionAttempt(scenario, nextState, {
				type: "respond",
				questionId,
				value,
			});
		nextState = transitionAttempt(scenario, nextState, { type: "submit" });
		expect(
			projectAttempt(scenario, nextState, "surface-test", 2).feedback.map(
				(f) => f.met,
			),
		).toEqual([true, true]);
		expect(
			previewLearningImpl({
				lessonId: "volatility-surface",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
