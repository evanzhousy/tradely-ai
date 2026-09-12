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
import { auditRecapConceptData as data } from "@/content/units/audit-recap-concept.server";
import { packetTeachingSource } from "@/content/units/packet-concept.server";
import { packetData } from "@/content/units/production.server";
import {
	unresolvedAuditChecks,
	workingAuditPremium,
} from "@/domain/learning/audit-recap-concept";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import { packetTotals } from "@/domain/learning/packet-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { AuditRecapConceptLab } from "./audit-recap-concept-lab";
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
const lab = () => render(<AuditRecapConceptLab locale="en" data={data} />);
describe("market recap audit SVG lesson", () => {
	it("reproduces flawed and repaired dollars without changing source rows", () => {
		expect(data.packet).toEqual(packetTeachingSource);
		expect(
			workingAuditPremium(data.packet, data.requiredIds, [], 1).subtotal,
		).toBe(8000);
		expect(
			workingAuditPremium(data.packet, data.requiredIds, ["R1"], 1).subtotal,
		).toBe(206000);
		expect(
			workingAuditPremium(data.packet, data.requiredIds, ["R1", "R2"], 1),
		).toMatchObject({ subtotal: 800000, fullTotal: null, missingIds: ["R3"] });
		expect(packetTotals(data.packet.rows, data.requiredIds).subtotal).toBe(
			800000,
		);
		expect(data.packet.rows[0].priceCents).toBe(200);
	});
	it("finds the first unresolved fixed example and retains supported identity", () => {
		expect(unresolvedAuditChecks(data.checks, []).map((c) => c.id)).toEqual([
			"time",
			"scope",
			"scale",
			"coverage",
			"inference",
		]);
		expect(unresolvedAuditChecks(data.checks, ["inference"])[0].id).toBe(
			"time",
		);
		expect(unresolvedAuditChecks(data.checks, ["time"])[0].id).toBe("scope");
		expect(
			unresolvedAuditChecks(
				data.checks,
				data.checks.map((c) => c.id),
			),
		).toEqual([]);
	});
	it("restores row factors through native controls while retaining the valid price", () => {
		lab();
		expect(read("[data-audit-working]")).toBe("$80");
		click("Toggle multiplier repair R1");
		expect(read("[data-audit-working]")).toBe("$2,060");
		click("Toggle multiplier repair R2");
		expect(read("[data-audit-working]")).toBe("$8,000");
		expect(read("[data-audit-retained]")).toContain("$2");
		expect(read("[data-audit-amount-status]")).toContain("other report claims");
	});
	it("plays partial repairs and stops on manual row selection", () => {
		vi.useFakeTimers();
		lab();
		click("Play explanation");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-audit-working]")).toBe("$2,060");
		click("Toggle multiplier repair R2");
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-audit-working]")).toBe("$8,000");
		expect(
			screen.getByRole("button", { name: "Play explanation" }),
		).toBeTruthy();
		click("Reset scene");
		expect(read("[data-audit-working]")).toBe("$80");
	});
	it("does not let a later repair conceal an earlier unsupported check", () => {
		lab();
		tab(/Find the first defect/);
		change("Audit check", "inference");
		click("Repair selected issue");
		expect(read("[data-audit-first]")).toBe(
			"First unresolved check: Source date",
		);
		change("Audit check", "time");
		click("Repair selected issue");
		expect(read("[data-audit-first]")).toBe(
			"First unresolved check: Expiry scope",
		);
		change("Audit check", "identity");
		expect(
			screen
				.getByRole("button", { name: "Supported or repaired · retain" })
				.hasAttribute("disabled"),
		).toBe(true);
	});
	it("repairs the actual cropped chart and its claim together", () => {
		lab();
		tab(/Find the first defect/);
		change("Audit check", "scale");
		expect(read("[data-audit-chart]")).toContain("11×");
		click("Repair selected issue");
		expect(read("[data-audit-chart]")).toContain("Height ratio: 2×");
		expect(read("[data-audit-report]")).toContain("zero-based");
		expect(read("[data-audit-first]")).toContain("Source date");
	});
	it("keeps unknown evidence explicit after all scripted repairs", () => {
		lab();
		tab(/Find the first defect/);
		for (const id of ["time", "scope", "scale", "coverage", "inference"]) {
			change("Audit check", id);
			click("Repair selected issue");
		}
		expect(read("[data-audit-first]")).toBe(
			"Scripted defects repaired; unknown evidence still remains",
		);
		expect(read("[data-audit-report]")).toContain(
			"opening intent remains unknown",
		);
	});
	it("builds a bounded signoff that includes retained facts unknowns and reopen conditions", () => {
		lab();
		tab(/Write a bounded signoff/);
		expect(read("[data-audit-signoff]")).toContain("R1 price/share is $2");
		expect(read("[data-audit-signoff-status]")).toContain("Still unknown");
		fireEvent.click(screen.getByRole("button", { name: /Still unknown/ }));
		fireEvent.click(screen.getByRole("button", { name: /Reopen conditions/ }));
		expect(read("[data-audit-signoff]")).toContain("R3 is still missing");
		expect(read("[data-audit-signoff-status]")).toContain(
			"Ready for human review",
		);
		click("Reset scene");
		expect(read("[data-audit-signoff-status]")).toContain("Still unknown");
	});
	it("supports Chinese and guards unavailable data", () => {
		const page = render(<AuditRecapConceptLab locale="zh" data={data} />);
		click("切换乘数修复 R1");
		expect(read("[data-audit-working]")).toBe("$2,060");
		page.rerender(<AuditRecapConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
	});
	it("preserves version 2 grading and audit/signoff self-review", () => {
		const shared = packetData(0);
		const scenario = getLessonScenarios("audit-market-recap")[0];
		let state = initialAttemptState();
		const props = {
			locale: "en" as const,
			busy: false,
			error: null,
			onOpen: vi.fn(),
			onRecover: vi.fn(),
			onAction: vi.fn(),
		};
		const view = projectAttempt(scenario, state, "audit-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		click("Toggle multiplier repair R1");
		expect(props.onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(props.onAction).toHaveBeenCalledExactlyOnceWith({
			type: "continue",
		});
		state = transitionAttempt(scenario, state, { type: "continue" });
		const next = projectAttempt(scenario, state, "audit-test", 1);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		for (const [questionId, value] of [
			["correct-premium", "108000"],
			[
				"audit",
				"R1/R2 require multiplier 100. R3 is missing rather than zero. Opening intent and common ownership are unknown; retain R1 at $1.80.",
			],
			[
				"signoff",
				"R1/R2 support observed premium $108,000; full totals and opening intent remain unknown. Reopen review when R3 or linkage evidence arrives.",
			],
		])
			state = transitionAttempt(scenario, state, {
				type: "respond",
				questionId,
				value,
			});
		state = transitionAttempt(scenario, state, { type: "submit" });
		const feedback = projectAttempt(scenario, state, "audit-test", 2).feedback;
		expect(feedback.find((f) => f.questionId === "correct-premium")?.met).toBe(
			true,
		);
		expect(feedback.filter((f) => f.reviewRequired)).toHaveLength(2);
		expect(feedback.filter((f) => f.reviewRequired).every((f) => !f.met)).toBe(
			true,
		);
		expect(packetData(0)).toEqual(shared);
		expect(
			previewLearningImpl({
				lessonId: "audit-market-recap",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
