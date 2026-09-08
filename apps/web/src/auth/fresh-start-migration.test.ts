import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { expect, it } from "vitest";

function migration(name: string) {
	return readFileSync(
		new URL(`../../../../packages/db/src/migrations/${name}`, import.meta.url),
		"utf8",
	);
}

it("clears prelaunch learner data and creates provider-neutral foreign keys", async () => {
	const pg = new PGlite();
	try {
		for (const file of [
			"0000_salty_randall.sql",
			"0001_low_clea.sql",
			"0002_learning_attempts.sql",
		])
			await pg.exec(migration(file));
		await pg.exec(`INSERT INTO app_user (clerk_user_id, course_pass_granted_at) VALUES ('old-test-user', now());
			INSERT INTO lesson_progress (clerk_user_id, lesson_id, content_version) VALUES ('old-test-user', 'option-contracts', 1);`);
		await pg.exec(migration("0003_neon_auth_fresh_start.sql"));
		expect(
			(await pg.query("SELECT count(*)::int AS count FROM app_user")).rows,
		).toEqual([{ count: 0 }]);
		expect(
			(await pg.query("SELECT count(*)::int AS count FROM lesson_progress"))
				.rows,
		).toEqual([{ count: 0 }]);
		await pg.exec(`INSERT INTO app_user (user_id) VALUES ('a50d580e-fdb3-4c31-a87b-14f48d399eb9');
			INSERT INTO lesson_progress (user_id, lesson_id, content_version) VALUES ('a50d580e-fdb3-4c31-a87b-14f48d399eb9', 'option-contracts', 1);`);
		await expect(
			pg.exec(
				"INSERT INTO lesson_progress (user_id, lesson_id, content_version) VALUES ('another-user', 'option-contracts', 1)",
			),
		).rejects.toThrow(/foreign key/i);
		await pg.exec("DELETE FROM app_user");
		expect(
			(await pg.query("SELECT count(*)::int AS count FROM lesson_progress"))
				.rows,
		).toEqual([{ count: 0 }]);
	} finally {
		await pg.close();
	}
});
