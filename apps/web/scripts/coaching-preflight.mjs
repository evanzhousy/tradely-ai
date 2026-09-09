import dotenv from "dotenv";

dotenv.config({ path: ".env", quiet: true });

const model = "anthropic/claude-haiku-4.5";
const checks = {
	enabled: process.env.AI_COACH_ENABLED === "true",
	credentialPresent: Boolean(process.env.AI_GATEWAY_API_KEY),
	modelConfigured: process.env.AI_COACH_MODEL === model,
	cohortConfigured: Boolean(
		process.env.AI_COACH_USER_IDS?.split(",").some((value) => value.trim()),
	),
	databaseConfigured: Boolean(process.env.DATABASE_URL),
	catalogWithinReservation: false,
};
try {
	const response = await fetch("https://ai-gateway.vercel.sh/v1/models", {
		signal: AbortSignal.timeout(10_000),
	});
	const catalog = await response.json();
	const price = catalog.data?.find((entry) => entry.id === model)?.pricing;
	checks.catalogWithinReservation =
		response.ok &&
		Number(price?.input) > 0 &&
		Number(price.input) <= 0.00000125 &&
		Number(price?.output) > 0 &&
		Number(price.output) <= 0.0000055;
} catch {
	/* Presence-only report; never print credentials or provider errors. */
}
console.log(
	JSON.stringify(
		{
			...checks,
			model,
			generationCalled: false,
			databaseContacted: false,
			next: "Apply the reviewed migration to preview, run synthetic model evaluation, review provider data settings, then enable the pilot.",
		},
		null,
		2,
	),
);
if (!Object.values(checks).every(Boolean)) process.exitCode = 1;
