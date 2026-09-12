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
import { sourceConceptData as data } from "@/content/units/source-concept.server";
import { strategyConceptData } from "@/content/units/strategy-concept.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import { compareCohorts } from "@/domain/learning/oi-concept";
import {
	auditSource,
	observeSourceClock,
} from "@/domain/learning/source-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { SourceConceptLab } from "./source-concept-lab";

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
const click = (name: string) =>
	fireEvent.click(screen.getByRole("button", { name }));
const change = (label: string, value: string) =>
	fireEvent.change(screen.getByLabelText(label), { target: { value } });
const tab = (name: RegExp) =>
	fireEvent.click(screen.getByRole("tab", { name }));
const lab = () => render(<SourceConceptLab locale="en" data={data} />);

describe("source audit SVG lesson", () => {
	it("withholds an occurred event until receipt and exposes it exactly at receipt", () => {
		expect(observeSourceClock(data.clock, 598)).toEqual({
			occurred: false,
			received: false,
			visibleQuantity: null,
		});
		expect(observeSourceClock(data.clock, 599)).toEqual({
			occurred: true,
			received: false,
			visibleQuantity: null,
		});
		expect(observeSourceClock(data.clock, 601)).toEqual({
			occurred: true,
			received: false,
			visibleQuantity: null,
		});
		expect(observeSourceClock(data.clock, 602)).toEqual({
			occurred: true,
			received: true,
			visibleQuantity: 20,
		});
	});
	it("audits identity, date, window, unit, receipt and coverage independently", () => {
		const current = data.audit.records[0];
		const req = data.audit.requirements[0];
		const audit = (record: typeof current) =>
			auditSource(record, req, data.audit.asOf);
		expect(audit(current).accepted).toBe(true);
		for (const [field, patch] of [
			["identity", { symbol: "BETA" }],
			["session", { session: "2030-09-05" }],
			["window", { window: "09:30–16:00 ET" }],
			["unit", { unit: "shares" as const }],
			["received", { receivedAt: "2030-09-06T10:06:00-04:00" }],
			["received", { receivedAt: "invalid" }],
			["coverage", { coverage: { covered: 2, expected: 3 } }],
			["coverage", { coverage: { covered: 2, expected: 2 } }],
		] as const) {
			const result = audit({ ...current, ...patch });
			expect(result.accepted).toBe(false);
			expect(result.checks[field]).toBe(false);
			expect(Object.values(result.checks).filter((v) => !v)).toHaveLength(1);
		}
	});
	it("accepts observed zero but not missing, not-applicable or invalid values", () => {
		const record = data.audit.records[0];
		const req = data.audit.requirements[0];
		for (const value of [0, 120])
			expect(
				auditSource(
					{ ...record, measurement: { state: "observed", value } },
					req,
					data.audit.asOf,
				).accepted,
			).toBe(true);
		for (const state of ["missing", "not-applicable"] as const)
			expect(
				auditSource({ ...record, measurement: { state } }, req, data.audit.asOf)
					.checks.value,
			).toBe(false);
		for (const value of [Number.NaN, Number.POSITIVE_INFINITY, -1])
			expect(
				auditSource(
					{ ...record, measurement: { state: "observed", value } },
					req,
					data.audit.asOf,
				).checks.value,
			).toBe(false);
	});
	it("matches the explicitly selected session rather than always preferring the newest", () => {
		for (let i = 0; i < 3; i++) {
			for (let j = 0; j < 3; j++)
				expect(
					auditSource(
						data.audit.records[i],
						data.audit.requirements[j],
						data.audit.asOf,
					).accepted,
				).toBe(i === j);
		}
	});
	it("keeps calendar dates, cohort membership and the difference decomposition consistent", () => {
		for (const s of data.cohort.series)
			for (const i of [0, 1] as const)
				expect(
					(Date.parse(s.expiry) - Date.parse(data.cohort.reportDates[i])) /
						86400000,
				).toBe(s.dte[i]);
		const rolling = compareCohorts(
			data.cohort.series,
			data.cohort.dteRange,
			"rolling",
		);
		expect(rolling).toMatchObject({
			first: 1600,
			second: 2900,
			delta: 1300,
			retainedChange: -100,
			entryOi: 2000,
			exitOi: 600,
		});
		expect(rolling.before.map((s) => s.id)).toEqual(["A", "B"]);
		expect(rolling.after.map((s) => s.id)).toEqual(["B", "C"]);
		expect(
			compareCohorts(data.cohort.series, data.cohort.dteRange, "fixed"),
		).toMatchObject({
			first: 1600,
			second: 900,
			delta: -700,
			retainedChange: -700,
			entryOi: 0,
			exitOi: 0,
		});
	});
	it("replays clocks without invalidating dated context and stops on direct input", () => {
		vi.useFakeTimers();
		lab();
		expect(read("[data-source-visible]")).toBe("—");
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-source-phase]")).toBe("Occurred, not received");
		fireEvent.pointerDown(screen.getByLabelText("Source replay time"));
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-source-visible]")).toBe("—");
		expect(read("[data-source-oi]")).toBe("900 contracts");
		change("Observation time", "2");
		expect(read("[data-source-visible]")).toBe("20 contracts");
		expect(
			(screen.getByLabelText("Source replay time") as HTMLInputElement).value,
		).toBe("2");
		click("Reset scene");
		expect(read("[data-source-phase]")).toBe("Not yet occurred");
	});
	it("keeps wrong-source and selected-session decisions visible in the UI", () => {
		lab();
		tab(/Match the requirement/);
		expect(read("[data-source-verdict]")).toBe("Meets this requirement");
		change("Requested session", "historical");
		expect(read("[data-source-verdict]")).toBe(
			"Does not meet this requirement",
		);
		change("Source snapshot", "historical");
		expect(read("[data-source-verdict]")).toBe("Meets this requirement");
		change("Source snapshot", "latest");
		expect(read("[data-source-verdict]")).toBe(
			"Does not meet this requirement",
		);
		change("Requested session", "current");
		change("Source snapshot", "wrong-symbol");
		expect(read('[data-source-check="identity"]')).toContain("does not match");
		change("Source snapshot", "partial");
		expect(read('[data-source-check="coverage"]')).toContain("does not match");
	});
	it("renders zero, missing and not-applicable as separate states", () => {
		lab();
		tab(/Match the requirement/);
		change("Source snapshot", "zero");
		expect(read("[data-source-measurement]")).toBe("0");
		expect(read("[data-source-verdict]")).toBe("Meets this requirement");
		change("Source snapshot", "missing");
		expect(read("[data-source-measurement]")).toBe("Missing");
		expect(read("[data-source-verdict]")).toBe(
			"Does not meet this requirement",
		);
		change("Source snapshot", "not-applicable");
		expect(read("[data-source-measurement]")).toBe("Not applicable");
	});
	it("withholds only comparisons that need the missing series and resets local controls", () => {
		lab();
		tab(/Track the same series/);
		change("Visible report", "1");
		expect(read("[data-source-cohort-total]")).toBe("2,900 contracts");
		change("Later report visibility", "expired");
		expect(read("[data-source-delta]")).toContain("+1,300");
		click("Fixed series");
		expect(read("[data-source-after]")).toBe("Later total—");
		expect(read("[data-source-delta]")).toBe("Total difference—");
		change("Later report visibility", "all");
		expect(read("[data-source-delta]")).toContain("−700");
		click("Rolling DTE");
		change("Later report visibility", "retained");
		expect(read("[data-source-after]")).toBe("Later total—");
		click("Reset scene");
		expect(read("[data-source-cohort-total]")).toBe("1,600 contracts");
		expect(
			(screen.getByLabelText("Later report visibility") as HTMLSelectElement)
				.value,
		).toBe("all");
	});
	it("supports Chinese and rejects absent or mismatched teaching data", () => {
		const page = render(<SourceConceptLab locale="zh" data={data} />);
		change("观察时间", "2");
		expect(read("[data-source-visible]")).toBe("20 张");
		page.rerender(<SourceConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
		page.rerender(<SourceConceptLab locale="en" data={strategyConceptData} />);
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
	});
	it("preserves version 2 grading, Learn projection and paid access", () => {
		const scenario = getLessonScenarios("symbol-drawer")[0];
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
		const view = projectAttempt(scenario, state, "source-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		change("Observation time", "2");
		expect(onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(onAction).toHaveBeenCalledExactlyOnceWith({ type: "continue" });
		const next = projectAttempt(
			scenario,
			transitionAttempt(scenario, state, { type: "continue" }),
			"source-test",
			1,
		);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		expect(
			scenario.steps[1].questions.map((q) => ({
				id: q.id,
				accepted: q.accepted,
			})),
		).toEqual([
			{ id: "flow-gate", accepted: ["yes"] },
			{ id: "report-delta", accepted: ["-70"] },
		]);
		expect(
			previewLearningImpl({
				lessonId: "symbol-drawer",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
