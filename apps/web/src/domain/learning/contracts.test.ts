import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start/server-only", () => ({}));

import { contractNeighborhoodScenarios } from "@/content/scenarios/contract-neighborhood";
import {
	contractLayout,
	contractStatus,
	inContractScope,
	visibleContracts,
} from "./contracts";
import {
	assessAttempt,
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "./engine";

describe("contract neighborhood evidence", () => {
	const data = contractNeighborhoodScenarios[0].steps[0].neighborhood;
	if (!data) throw new Error("Missing authored neighborhood");
	const findContract = (id: string) => {
		const contract = data.contracts.find((row) => row.id === id);
		if (!contract) throw new Error(`Missing authored contract: ${id}`);
		return contract;
	};
	it("keeps scope, stale observations, and missing data distinct", () => {
		expect(contractStatus(data, findContract("c-100-60"))).toBe("out_of_scope");
		expect(contractStatus(data, findContract("c-95-14"))).toBe("stale");
		expect(contractStatus(data, findContract("c-105-14"))).toBe("missing");
		expect(contractStatus(data, findContract("c-100-14"))).toBe("comparable");
		const scoped = visibleContracts(data, {
			selectedId: null,
			scopeOnly: true,
			expiry: null,
		});
		expect(scoped).toHaveLength(6);
		expect(scoped.find((row) => row.id === "c-105-14")?.volume).toBeNull();
		expect(
			visibleContracts(data, { selectedId: null, scopeOnly: true, expiry: 7 }),
		).toHaveLength(0);
	});
	it("uses numeric expiry distance and a volume scale independent of view filters", () => {
		const layout = contractLayout(data);
		expect(
			(layout.z(14) - layout.z(7)) / (layout.z(60) - layout.z(7)),
		).toBeCloseTo(7 / 53);
		expect(layout.x(105) - layout.x(100)).toBeCloseTo(
			layout.x(100) - layout.x(95),
		);
		expect(layout.volumeMax).toBeGreaterThanOrEqual(8400);
		expect(layout.y(3200) / layout.y(8400)).toBeCloseTo(3200 / 8400);
		const original = JSON.stringify(data);
		visibleContracts(data, { selectedId: null, scopeOnly: true, expiry: 14 });
		expect(JSON.stringify(data)).toBe(original);
	});
	it("each independent case identifies the highest fresh candidate inside its own boundary", () => {
		for (const [index, scenario] of contractNeighborhoodScenarios.entries()) {
			const last = scenario.steps.find(
				(step) => step.id === "neighborhood-independent",
			);
			if (!last?.neighborhood) throw new Error("Missing independent grid");
			const grid = last.neighborhood;
			const ranked = grid.contracts
				.filter(
					(row) =>
						inContractScope(grid, row) && row.fresh && row.volume !== null,
				)
				.sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
			expect(ranked[0].id).toBe(index === 0 ? "c-105-30" : "c-100-60");
			expect(last.questions[0].accepted).toEqual([ranked[0].id]);
			for (const row of grid.contracts)
				if (row.volume !== null)
					expect(Number.isInteger(row.volume) && row.volume >= 0).toBe(true);
		}
	});
	it("projects only the current grid and grades both variants with the common attempt engine", () => {
		for (const scenario of contractNeighborhoodScenarios) {
			let state = initialAttemptState();
			const first = JSON.stringify(projectAttempt(scenario, state, "id", 0));
			expect(first).toContain("alfa-neighborhood-v3");
			expect(first).not.toContain("beta-neighborhood");
			expect(first).not.toContain('"accepted"');
			for (const step of scenario.steps) {
				for (const evidence of step.evidence)
					state = transitionAttempt(scenario, state, {
						type: "inspect",
						evidenceId: evidence.id,
					});
				for (const question of step.questions)
					state = transitionAttempt(scenario, state, {
						type: "answer",
						questionId: question.id,
						choiceId: question.accepted[0],
					});
				state = transitionAttempt(scenario, state, { type: "submit" });
				if (state.phase !== "complete")
					state = transitionAttempt(scenario, state, { type: "continue" });
			}
			expect(assessAttempt(scenario, state)).toEqual({
				status: "demonstrated",
				met: 5,
				total: 5,
				usedHint: false,
			});
		}
	});
});
