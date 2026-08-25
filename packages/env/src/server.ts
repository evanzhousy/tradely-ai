import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().min(1).optional(),
		CLERK_SECRET_KEY: z.string().min(1).optional(),
		STRIPE_API_KEY: z.string().min(1).optional(),
		STRIPE_PRICE_ID: z.string().min(1).optional(),
		MEDIA_PUBLIC_BASE_URL: z.string().min(1).default("/media/tradingflow"),
		MEDIA_SIGNING_SECRET: z.string().min(32).optional(),
		PRIVATE_MEDIA_ROOT: z.string().min(1).optional(),
		MEDIA_S3_BUCKET: z.string().min(1).optional(),
		MEDIA_S3_REGION: z.string().min(1).default("auto"),
		MEDIA_S3_ENDPOINT: z.string().url().optional(),
		MEDIA_S3_ACCESS_KEY_ID: z.string().min(1).optional(),
		MEDIA_S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
		MEDIA_S3_KEY_PREFIX: z.string().min(1).default("tradingflow-foundations"),
		APP_URL: z.string().url().default("http://localhost:8250"),
		NODE_ENV: z
			.enum(["development", "production", "test"])
			.default("development"),
	},
	runtimeEnv: process.env,
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	emptyStringAsUndefined: true,
});
