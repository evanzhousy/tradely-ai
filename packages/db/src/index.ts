import { neon } from "@neondatabase/serverless";
import { env } from "@tradely/env/server";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export function createDb() {
	if (!env.DATABASE_URL) {
		throw new Error(
			"DATABASE_URL is required for persistent learning progress",
		);
	}
	const sql = neon(env.DATABASE_URL);
	return drizzle(sql, { schema });
}

export * from "./schema";
