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
import { packetConceptData as data } from "@/content/units/packet-concept.server";
import { packetData } from "@/content/units/production.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "@/domain/learning/engine";
import {
	changedPacketMethod,
	packetRowPremium,
	packetTotals,
} from "@/domain/learning/packet-concept";
import { previewLearningImpl } from "@/server/preview-learning.server";
import { LearningScreen } from "./learning-screen";
import { PacketConceptLab } from "./packet-concept-lab";

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
const lab = () => render(<PacketConceptLab locale="en" data={data} />);
describe("reproducible packet SVG lesson", () => {
	it("calculates exact premium cents and retains actual row IDs and missingness", () => {
		expect(packetRowPremium(data.original.rows[0])).toBe(200000);
		expect(packetRowPremium(data.original.rows[1])).toBe(600000);
		expect(packetTotals(data.original.rows, data.requiredIds)).toEqual({
			usedIds: ["R1", "R2"],
			missingIds: ["R3"],
			subtotal: 800000,
			fullTotal: null,
		});
	});
	it("distinguishes zero observations from missing inputs and rejects ambiguous identities", () => {
		expect(
			packetRowPremium({
				id: "Z",
				contracts: 0,
				priceCents: 0,
				multiplier: 100,
			}),
		).toBe(0);
		expect(
			packetRowPremium({
				id: "Z",
				contracts: 0,
				priceCents: null,
				multiplier: 100,
			}),
		).toBeNull();
		expect(
			packetRowPremium({
				id: "Z",
				contracts: 1.5,
				priceCents: 200,
				multiplier: 100,
			}),
		).toBeNull();
		expect(
			packetRowPremium({
				id: "Z",
				contracts: Number.MAX_SAFE_INTEGER,
				priceCents: 200,
				multiplier: 100,
			}),
		).toBeNull();
		const rows = data.original.rows;
		expect(
			packetTotals([...rows, rows[0]], data.requiredIds).subtotal,
		).toBeNull();
		expect(packetTotals(rows.slice(0, 1), data.requiredIds)).toMatchObject({
			usedIds: ["R1"],
			missingIds: ["R2", "R3"],
			subtotal: 200000,
			fullTotal: null,
		});
	});
	it("allows only the declared replay parameter without silently changing the method", () => {
		expect(
			changedPacketMethod(data.original.method, data.reruns[0].record.method),
		).toEqual([]);
		expect(
			packetTotals(data.reruns[0].record.rows, data.requiredIds).subtotal,
		).toBe(690000);
		for (const [index, field] of [
			[1, "cutoff"],
			[2, "universe"],
			[3, "source"],
			[4, "transformation"],
		] as const) {
			expect(
				changedPacketMethod(
					data.original.method,
					data.reruns[index].record.method,
				),
			).toEqual([field]);
		}
	});
	it("exposes source formulas and the unavailable full total through native rows", () => {
		lab();
		expect(read("[data-packet-subtotal]")).toBe("$8,000");
		click("Inspect row R2");
		expect(read("[data-packet-row]")).toBe("R2 · premium: $6,000");
		click("Inspect row R3");
		expect(read("[data-packet-row]")).toBe("R3 · premium: —");
		expect(read("[data-packet-used]")).toContain("R1 / R2");
		expect(read("[data-packet-full]")).toContain("—");
	});
	it("plays calculation stages and stops when a stage is selected directly", () => {
		vi.useFakeTimers();
		lab();
		click("Play explanation");
		expect(read("[data-packet-subtotal]")).toBe("—");
		act(() => vi.advanceTimersByTime(1200));
		expect(read("[data-packet-subtotal]")).toBe("—");
		click("Subtotal");
		act(() => vi.advanceTimersByTime(6000));
		expect(read("[data-packet-subtotal]")).toBe("$8,000");
		expect(
			screen.getByRole("button", { name: "Play explanation" }),
		).toBeTruthy();
	});
	it("records concrete fields while keeping omitted metadata visibly absent", () => {
		lab();
		tab(/Make the packet readable/);
		expect(read("[data-packet-field-value]")).toContain("Not recorded");
		fireEvent.click(
			screen.getByRole("button", { name: /Coverage and claim limit/ }),
		);
		expect(read("[data-packet-field-value]")).toContain("R3 is missing");
		expect(read("[data-packet-field-status]")).toContain(
			"requires self or human review",
		);
		fireEvent.click(
			screen.getByRole("button", { name: /Units and multiplier/ }),
		);
		expect(read("[data-packet-field-value]")).toContain("Not recorded");
		expect(read("[data-packet-field-status]")).toContain(
			"Units and multiplier",
		);
		change("Inspect packet field", "source");
		expect(read("[data-packet-field-value]")).toContain("TEACH-P1");
		expect(read("[data-packet-field-value]")).toContain("used R1, R2");
	});
	it("preserves the original while showing a new dated subtotal and its row inputs", () => {
		lab();
		tab(/Preserve each rerun/);
		click("Review");
		expect(read("[data-packet-rerun-status]")).toContain("Allowed dated rerun");
		expect(read("[data-packet-rerun-total]")).toContain("$6,900");
		expect(read("[data-packet-rerun-rows]")).toContain(
			"R1: 12 × $2 × 100 = $2,400",
		);
		expect(read("[data-packet-original]")).toContain("$8,000");
	});
	it("does not publish a new result for undeclared source universe or transformation changes", () => {
		lab();
		tab(/Preserve each rerun/);
		for (const id of ["cutoff", "puts", "source", "exclude"]) {
			change("Rerun proposal", id);
			click("Review");
			expect(read("[data-packet-rerun-status]")).toContain(
				"explicit revision required",
			);
			expect(read("[data-packet-rerun-total]")).toContain("—");
			expect(read("[data-packet-original]")).toContain("$8,000");
		}
		click("Reset scene");
		expect(read("[data-packet-rerun-status]")).toBe("Review pending");
	});
	it("supports Chinese and guards unavailable data", () => {
		const page = render(<PacketConceptLab locale="zh" data={data} />);
		change("来源行", "R3");
		expect(read("[data-packet-row]")).toContain("—");
		page.rerender(<PacketConceptLab locale="en" />);
		expect(screen.getByRole("status").textContent).toContain("unavailable");
	});
	it("preserves shared capstone data, version 2 grading and writing self-review", () => {
		const shared = packetData(0);
		expect(shared.premium).toBe(108000);
		const scenario = getLessonScenarios("cookbook-research-packet")[0];
		let state = initialAttemptState();
		const props = {
			locale: "en" as const,
			busy: false,
			error: null,
			onOpen: vi.fn(),
			onRecover: vi.fn(),
			onAction: vi.fn(),
		};
		const view = projectAttempt(scenario, state, "packet-test", 0);
		expect(view.step.conceptData).toEqual(data);
		const page = render(<LearningScreen {...props} view={view} />);
		change("Source row", "R3");
		expect(props.onAction).not.toHaveBeenCalled();
		click("Continue to practice");
		expect(props.onAction).toHaveBeenCalledExactlyOnceWith({
			type: "continue",
		});
		state = transitionAttempt(scenario, state, { type: "continue" });
		const next = projectAttempt(scenario, state, "packet-test", 1);
		page.rerender(<LearningScreen {...props} view={next} />);
		expect(next.step.conceptData).toBeUndefined();
		expect(document.querySelector("[data-concept-lab]")).toBeNull();
		expect(scenario.version).toBe(2);
		for (const [questionId, value] of [
			[
				"scope",
				"ALFA October 16 calls at strikes 100 through 110, September 3 through the complete session close.",
			],
			[
				"method",
				"Use source packet P0 and rows R1 and R2; sum contracts times price per share times 100. R3 remains missing.",
			],
			["observed-premium", "108000"],
			[
				"replay",
				"Rerun a separately saved session date with the same universe and formula; changing source requires a method revision.",
			],
		])
			state = transitionAttempt(scenario, state, {
				type: "respond",
				questionId,
				value,
			});
		state = transitionAttempt(scenario, state, { type: "submit" });
		const feedback = projectAttempt(scenario, state, "packet-test", 2).feedback;
		expect(feedback.find((f) => f.questionId === "observed-premium")?.met).toBe(
			true,
		);
		expect(feedback.filter((f) => f.reviewRequired)).toHaveLength(3);
		expect(feedback.filter((f) => f.reviewRequired).every((f) => !f.met)).toBe(
			true,
		);
		expect(packetData(0)).toEqual(shared);
		expect(
			previewLearningImpl({
				lessonId: "cookbook-research-packet",
				variant: 0,
				actions: [],
			}),
		).toEqual({ ok: false, reason: "access_denied" });
	});
});
