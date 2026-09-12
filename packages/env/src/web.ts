import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const POSTHOG_PROXY_HOST = "https://z.tradely.ai";
const posthogHost = z
	.string()
	.url()
	.refine(
		(value) => value.replace(/\/+$/, "") === POSTHOG_PROXY_HOST,
		"Tradely uses its managed PostHog reverse proxy",
	);

export const env = createEnv({
	clientPrefix: "VITE_",
	client: {
		VITE_AUTH_ENABLED: z
			.enum(["true", "false"])
			.default("false")
			.transform((value) => value === "true"),
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
