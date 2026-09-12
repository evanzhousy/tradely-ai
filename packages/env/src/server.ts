import "dotenv/config";
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
	server: {
		AI_COACH_ENABLED: z
			.enum(["true", "false"])
			.default("false")
			.transform((value) => value === "true"),
		AI_COACH_USER_IDS: z.string().default(""),
		AI_COACH_MODEL: z.string().optional(),
		AI_GATEWAY_API_KEY: z.string().min(1).optional(),
		AI_COACH_DAILY_BUDGET_USD: z.coerce
			.number()
			.positive()
			.max(100)
			.default(10),
		DATABASE_URL: z.string().min(1).optional(),
		NEON_AUTH_BASE_URL: z.string().url().optional(),
		NEON_AUTH_COOKIE_SECRET: z.string().min(32).optional(),
		POSTHOG_PROJECT_TOKEN: z.string().startsWith("phc_").optional(),
		POSTHOG_HOST: posthogHost.default(POSTHOG_PROXY_HOST),
		STRIPE_API_KEY: z.string().min(1).optional(),
		STRIPE_ACCOUNT_ID: z.string().startsWith("acct_").optional(),
		STRIPE_MEMBERSHIP_PRICE_ID: z.string().startsWith("price_").optional(),
		STRIPE_COURSE_PASS_PRICE_ID: z.string().startsWith("price_").optional(),
		LIFETIME_CHECKOUT_ENABLED: z
			.enum(["true", "false"])
			.default("false")
			.transform((value) => value === "true"),
		MEDIA_PUBLIC_BASE_URL: z.string().min(1).default("/media/tradingflow"),
		MEDIA_SIGNING_SECRET: z.string().min(32).optional(),
		PRIVATE_MEDIA_ROOT: z.string().min(1).optional(),
		MEDIA_S3_BUCKET: z.string().min(1).optional(),
		MEDIA_S3_REGION: z.string().min(1).default("auto"),
		MEDIA_S3_ENDPOINT: z.string().url().optional(),
		MEDIA_S3_ACCESS_KEY_ID: z.string().min(1).optional(),
		MEDIA_S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
		MEDIA_S3_KEY_PREFIX: z.string().min(1).default("tradingflow-foundations"),
		APP_URL: z.string().url().default("http://localhost:3001"),
		VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
		VERCEL_URL: z.string().min(1).optional(),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},
	runtimeEnv: process.env,
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
