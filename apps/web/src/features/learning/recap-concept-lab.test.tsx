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
import { packetTeachingSource } from "@/content/units/packet-concept.server";
import { packetData } from "@/content/units/production.server";
import { recapConceptData as data } from "@/content/units/recap-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import { apparentBarRatio, recapSeries } from "@/domain/learning/recap-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { RecapConceptLab } from "./recap-concept-lab";

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
const lab = () => render(<RecapConceptLab locale="en" data={data} />);
describe("market recap SVG lesson", () => {
	it("uses the same teaching packet and keeps volume and premium units separate", () => {
		expect(data.packet).toEqual(packetTeachingSource);
		const volume = recapSeries(data.packet, data.series, "volume");
		expect(volume.rows.map((r) => r.value)).toEqual([10, 20, null]);
		expect(volume).toMatchObject({
			subtotal: 30,
			fullTotal: null,
			missing: ["R3"],
		});
		expect(recapSeries(data.packet, data.series, "premium")).toMatchObject({
			subtotal: 800000,
			fullTotal: null,
			missing: ["R3"],
		});
	});
	it("keeps volume available when price is unknown and distinguishes missing from zero", () => {
		const packet = {
			...data.packet,
			rows: data.packet.rows.map((r) =>
				r.id === "R1"
					? { ...r, priceCents: null }
					: r.id === "R3"
						? { ...r, contracts: 0, priceCents: 0 }
						: r,
			),
		};
		expect(recapSeries(packet, data.series, "volume")).toMatchObject({
			subtotal: 30,
			fullTotal: 30,
			missing: [],
		});
		expect(recapSeries(packet, data.series, "premium")).toMatchObject({
			subtotal: 600000,
			fullTotal: null,
			missing: ["R1"],
		});
		expect(
			recapSeries(
				{ ...packet, rows: [...packet.rows, packet.rows[0]] },
				data.series,
				"volume",
			).subtotal,
		).toBeNull();
	});
	it("quantifies axis distortion without changing the source ratio", () => {
		expect(apparentBarRatio(20, 10, 0)).toBe(2);
		expect(apparentBarRatio(20, 10, 5)).toBe(3);
		expect(apparentBarRatio(20, 10, 9)).toBe(11);
		expect(apparentBarRatio(20, 10, 10)).toBeNull();
		expect(apparentBarRatio(20, 10, Number.NaN)).toBeNull();
	});
	it("distinguishes a supported packet fact from a mismatched chart quantity", () => {
		lab();
		expect(read("[data-recap-match]")).toContain("matches");
		change("Chart metric", "premium");
		expect(read("[data-recap-match]")).toContain("packet supports");
		expect(read("[data-recap-claim]")).toContain("30 contracts");
		click("Inspect chart row R2");
		expect(read("[data-recap-row]")).toContain("$6,000");
		change("Claim quantity", "premium");
		expect(read("[data-recap-match]")).toContain("matches");
		expect(read("[data-recap-claim]")).toContain("$8,000");
		click("Inspect chart row R3");
		expect(read("[data-recap-row]")).toContain("—");
	});
	it("changes only geometry when the axis minimum changes", () => {
		lab();
		tab(/Inspect the scale/);
		change("Bar-axis minimum", "9");
		expect(read("[data-recap-height-ratio]")).toContain("11×");
		expect(read("[data-recap-actual-ratio]")).toContain("2×");
		expect(read("[data-recap-axis-total]")).toContain("30");
		click("Reset scene");
		expect(read("[data-recap-height-ratio]")).toContain("2×");
	});
	it("plays marked crop examples and stops on direct axis input", () => {
		vi.useFakeTimers();
		lab();
		tab(/Inspect the scale/);
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-recap-height-ratio]")).toContain("3×");
		change("Bar-axis minimum", "9");
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-recap-height-ratio]")).toContain("11×");
		expect(
			screen.getByRole("button", { name: "Play explanation" }),
		).toBeTruthy();
	});
	it("repairs fixed overclaim examples while retaining the valid observed quantity", () => {
		lab();
		tab(/Build a bounded recap/);
		for (const [value, message] of [
			["full", "Overstates coverage"],
			["positions", "participant intent"],
			["forecast", "No validated forecast"],
		]) {
			change("Sample headline", value);
			expect(read("[data-recap-verdict]")).toContain(message);
		}
		click("Repair to the supported sample");
		expect(read("[data-recap-verdict]")).toContain("Supported as a bounded");
		expect(
			screen.getByText(
				"30 contracts observed in covered TAU calls; R3 is missing.",
			),
		).toBeTruthy();
	});
	it("assembles concrete caption fields without pretending metadata certifies prose", () => {
		lab();
		tab(/Build a bounded recap/);
		expect(read("[data-recap-caption-status]")).toContain(
			"Missingness boundary",
		);
		fireEvent.click(
			screen.getByRole("button", { name: /Missingness boundary/ }),
		);
		expect(read("[data-recap-caption]")).toContain("R3 is missing, not zero");
		expect(read("[data-recap-caption-status]")).toContain("review wording");
		fireEvent.click(screen.getByRole("button", { name: /Source and rows/ }));
		expect(read("[data-recap-caption]")).not.toContain("TEACH-P1");
		expect(read("[data-recap-caption-status]")).toContain("Source and rows");
	});
	it("supports Chinese and guards unavailable data", () => {
		const page = render(<RecapConceptLab locale="zh" data={data} />);
		change("图表指标", "premium");
		expect(read("[data-recap-match]")).toContain("另一种量");
		page.rerender(<RecapConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
	});
	it("preserves version 2 grading, shared capstone data and writing self-review", () => {
		const shared = packetData(0);
		expect(shared.volume).toBe(500);
		const scenario = getLessonScenarios("market-recap")[0];
		let state = initialAttemptState();
		const props = {
			locale: "en" as const,
			busy: false,
			error: null,
			onOpen: vi.fn(),
			onRecover: vi.fn(),
			onAction: vi.fn(),
		};
		const view = projectAttempt(scenario, state, "recap-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		change("Chart metric", "premium");
		expect(props.onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(props.onAction).toHaveBeenCalledExactlyOnceWith({
			type: "continue",
		});
		state = transitionAttempt(scenario, state, { type: "continue" });
		const next = projectAttempt(scenario, state, "recap-test", 1);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		for (const [questionId, value] of [
			["volume", "500"],
			[
				"headline",
				"500 contracts observed in covered ALFA October 16 calls on September 3; strike 110 is missing.",
			],
			[
				"caption",
				"Strike on the category axis; observed contracts from zero on the value axis. Packet P0, tape-A, September 3; R1/R2 observed, R3 missing.",
			],
		])
			state = transitionAttempt(scenario, state, {
				type: "respond",
				questionId,
				value,
			});
		state = transitionAttempt(scenario, state, {
			type: "answer",
			questionId: "full-total",
			choiceId: "unknown",
		});
		state = transitionAttempt(scenario, state, { type: "submit" });
		const feedback = projectAttempt(scenario, state, "recap-test", 2).feedback;
		expect(feedback.filter((f) => !f.reviewRequired).every((f) => f.met)).toBe(
			true,
		);
		expect(feedback.filter((f) => f.reviewRequired)).toHaveLength(2);
		expect(feedback.filter((f) => f.reviewRequired).every((f) => !f.met)).toBe(
			true,
		);
		expect(packetData(0)).toEqual(shared);
		expect(
			previewLearningImpl({
				lessonId: "market-recap",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
