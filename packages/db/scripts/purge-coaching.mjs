import { pathToFileURL } from "node:url";

export const coachingPurgeSql = `
WITH deleted AS (
  DELETE FROM coaching_session WHERE deleted_at < now() - interval '30 days' RETURNING id
), usage AS (
  UPDATE coaching_generation SET input_tokens = NULL, output_tokens = NULL, cost_micros = NULL, elapsed_ms = NULL
  WHERE created_at < now() - interval '30 days'
    AND NOT EXISTS (SELECT 1 FROM coaching_session s WHERE s.id = coaching_generation.session_id AND s.deleted_at < now() - interval '30 days')
    AND (input_tokens IS NOT NULL OR output_tokens IS NOT NULL OR cost_micros IS NOT NULL OR elapsed_ms IS NOT NULL)
  RETURNING id
), quota AS (
  UPDATE coaching_session SET quota_day = NULL
  WHERE quota_day IS NOT NULL AND quota_day < ((now() AT TIME ZONE 'UTC')::date - 30)::text
    AND (deleted_at IS NULL OR deleted_at >= now() - interval '30 days')
  RETURNING id
)
SELECT (SELECT count(*) FROM deleted) AS deleted_records,
       (SELECT count(*) FROM usage) AS cleared_usage,
       (SELECT count(*) FROM quota) AS cleared_quota_dates`;

export async function purgeCoaching({
	apply = false,
	databaseUrl = process.env.DATABASE_URL,
	query,
} = {}) {
	if (!apply)
		return { applied: false, retentionDays: 30, databaseContacted: false };
	if (!query) {
		if (!databaseUrl)
			throw new Error("Provide the intended target DATABASE_URL explicitly.");
		const { neon } = await import("@neondatabase/serverless");
		const sql = neon(databaseUrl);
		query = (statement) => sql.query(statement);
	}
	const rows = await query(coachingPurgeSql);
	return { applied: true, ...rows[0] };
}
if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(process.argv[1]).href
) {
	try {
		console.log(
			JSON.stringify(
				await purgeCoaching({ apply: process.argv.includes("--apply") }),
			),
		);
	} catch {
		console.error(
			"Coaching retention cleanup failed. Check the target database and migration; no private error details were logged.",
		);
		process.exitCode = 1;
	}
}
