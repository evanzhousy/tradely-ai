import { readFileSync } from "node:fs";
/** Apply the same ordered forward migrations as deployment, in isolated tests. */
export async function applyTestMigrations(db: {
	exec: (query: string) => Promise<unknown>;
}) {
	const root = new URL(
		"../../../../packages/db/src/migrations/",
		import.meta.url,
	);
	const journal = JSON.parse(
		readFileSync(new URL("meta/_journal.json", root), "utf8"),
	) as { entries: { tag: string }[] };
	for (const entry of journal.entries)
		await db.exec(readFileSync(new URL(`${entry.tag}.sql`, root), "utf8"));
}
