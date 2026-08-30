import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const POSTHOG_INGESTION_HOST = "https://us.i.posthog.com";
const posthogHost = z
	.string()
	.url()
	.refine(
		(value) => value.replace(/\/+$/, "") === POSTHOG_INGESTION_HOST,
		"Tradely uses the US PostHog ingestion host",
	);

export const env = createEnv({
	clientPrefix: "VITE_",
	client: {
		VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
		VITE_POSTHOG_KEY: z.string().startsWith("phc_").optional(),
		VITE_POSTHOG_HOST: posthogHost.optional(),
		VITE_APP_RELEASE: z.string().min(1).max(120).optional(),
		VITE_GOOGLE_ANALYTICS_MEASUREMENT_ID: z
			.string()
			.regex(/^G-[A-Z0-9]+$/)
			.optional(),
	},
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true,
});
