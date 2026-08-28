import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	clientPrefix: "VITE_",
	client: {
		VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
		VITE_POSTHOG_KEY: z.string().startsWith("phc_").optional(),
		VITE_POSTHOG_HOST: z.string().url().optional(),
	},
	runtimeEnv: import.meta.env,
	emptyStringAsUndefined: true,
});
