import assert from "node:assert/strict";
import test from "node:test";
import { coachingPurgeSql, purgeCoaching } from "./purge-coaching.mjs";

test("retention defaults to a dry run without connecting", async () => {
	let contacted = false;
	const result = await purgeCoaching({
		query: async () => {
			contacted = true;
			return [];
		},
	});
	assert.equal(result.applied, false);
	assert.equal(contacted, false);
});
test("retention clears only old usage and already-deleted content records", async () => {
	let executed;
	const result = await purgeCoaching({
		apply: true,
		query: async (query) => {
			executed = query;
			return [{ deleted_records: 2 }];
		},
	});
	assert.equal(executed, coachingPurgeSql);
	assert.equal(result.deleted_records, 2);
	assert.match(executed, /deleted_at < now\(\) - interval '30 days'/);
	assert.doesNotMatch(executed, /(?:UPDATE|DELETE FROM) lesson_attempt/);
	assert.doesNotMatch(executed, /reserved_micros = 0/);
});
