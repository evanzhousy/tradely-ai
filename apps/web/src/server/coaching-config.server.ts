import "@tanstack/react-start/server-only";
import { env } from "@tradely/env/server";
import { CoachingError } from "@/domain/coaching/types";

/** Explicit, bounded non-reasoning pilot. Catalog verified 2026-09-09; no model fallback. */
export const COACH_MODEL = "anthropic/claude-haiku-4.5";
export const COACH_LIMITS = {
	inputTokens: 32_000,
	outputTokens: 1_200,
	timeoutMs: 20_000,
	inputMicros: 1.25,
	outputMicros: 5.5,
} as const;
export const COACH_RESERVATION_MICROS =
	2 *
	Math.ceil(
		COACH_LIMITS.inputTokens * COACH_LIMITS.inputMicros +
			COACH_LIMITS.outputTokens * COACH_LIMITS.outputMicros,
	);
export function getCoachingSettings(userId: string) {
	if (!env.AI_COACH_ENABLED) throw new CoachingError("disabled");
	if (
		!env.AI_COACH_USER_IDS.split(",")
			.map((id) => id.trim())
			.filter(Boolean)
			.includes(userId)
	)
		throw new CoachingError("not_eligible");
	if (!env.AI_GATEWAY_API_KEY || env.AI_COACH_MODEL !== COACH_MODEL)
		throw new CoachingError("unavailable");
	return {
		model: COACH_MODEL,
		budgetMicros: Math.floor(env.AI_COACH_DAILY_BUDGET_USD * 1_000_000),
		reservationMicros: COACH_RESERVATION_MICROS,
	};
}

let catalogVerifiedUntil = 0;
export async function verifyCoachingPrice() {
	if (Date.now() < catalogVerifiedUntil) return;
	try {
		const response = await fetch("https://ai-gateway.vercel.sh/v1/models", {
			signal: AbortSignal.timeout(3_000),
		});
		if (!response.ok) throw new Error("catalog");
		const catalog = (await response.json()) as {
			data?: Array<{
				id: string;
				pricing?: { input?: string; output?: string };
			}>;
		};
		const price = catalog.data?.find(
			(item) => item.id === COACH_MODEL,
		)?.pricing;
		if (
			!price?.input ||
			!price.output ||
			!Number.isFinite(Number(price.input)) ||
			!Number.isFinite(Number(price.output)) ||
			Number(price.input) <= 0 ||
			Number(price.output) <= 0 ||
			Number(price.input) * 1_000_000 > COACH_LIMITS.inputMicros ||
			Number(price.output) * 1_000_000 > COACH_LIMITS.outputMicros
		)
			throw new Error("price");
		catalogVerifiedUntil = Date.now() + 60_000;
	} catch {
		throw new CoachingError("unavailable");
	}
}
