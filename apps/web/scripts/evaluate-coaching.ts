import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@tradely/env/server";
import {
	COACH_MODEL,
	COACH_RESERVATION_MICROS,
	verifyCoachingPrice,
} from "../src/server/coaching-config.server";
import {
	generateCoachingFeedback,
	prepareCoachingPrompt,
} from "../src/server/coaching-provider.server";
import { coachingEvaluationFixtures } from "./coaching-fixtures";

const fixtures = coachingEvaluationFixtures();
for (const fixture of fixtures)
	prepareCoachingPrompt({
		snapshot: fixture.snapshot,
		original: null,
		previousFeedback: null,
		round: "initial",
	});
console.log(
	JSON.stringify({
		fixtures: fixtures.length,
		development: fixtures.filter((f) => f.split === "development").length,
		acceptance: fixtures.filter((f) => f.split === "acceptance").length,
		promptsValidated: true,
		providerCredentialPresent: !!env.AI_GATEWAY_API_KEY,
	}),
);
if (process.argv.includes("--run")) {
	if (!env.AI_GATEWAY_API_KEY || env.AI_COACH_MODEL !== COACH_MODEL)
		throw new Error(
			"Set AI_GATEWAY_API_KEY and the reviewed AI_COACH_MODEL before --run.",
		);
	await verifyCoachingPrice();
	const selected = fixtures.filter(
		(f) =>
			f.split ===
			(process.argv.includes("--development") ? "development" : "acceptance"),
	);
	const upperMicros = (selected.length * COACH_RESERVATION_MICROS) / 2;
	if (upperMicros > env.AI_COACH_DAILY_BUDGET_USD * 1_000_000)
		throw new Error(
			"Evaluation exceeds the configured budget. No generations started.",
		);
	const destination = path.resolve(
		"../../artifacts/coaching",
		`evaluation-${randomUUID()}`,
	);
	await mkdir(destination, { recursive: true });
	for (const fixture of selected) {
		const file = path.join(destination, `${fixture.id}.json`);
		const entry = {
			id: randomUUID(),
			fixture,
			model: COACH_MODEL,
			createdAt: new Date().toISOString(),
			humanReview: null,
		};
		await writeFile(
			file,
			JSON.stringify({ ...entry, status: "running" }, null, 2),
			{ flag: "wx" },
		);
		const started = Date.now();
		try {
			const result = await generateCoachingFeedback({
				snapshot: fixture.snapshot,
				original: null,
				previousFeedback: null,
				round: "initial",
			});
			await writeFile(
				file,
				JSON.stringify(
					{
						...entry,
						status: "succeeded",
						elapsedMs: Date.now() - started,
						...result,
					},
					null,
					2,
				),
			);
		} catch {
			await writeFile(
				file,
				JSON.stringify(
					{
						...entry,
						status: "indeterminate",
						elapsedMs: Date.now() - started,
					},
					null,
					2,
				),
			);
		}
	}
	console.log(
		JSON.stringify({
			destination,
			requiresHumanReview: true,
			learningEffectMeasured: false,
		}),
	);
}
