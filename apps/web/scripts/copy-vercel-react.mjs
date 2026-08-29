import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const funcDir = join(webRoot, ".vercel/output/functions/__server.func");

if (!existsSync(funcDir)) {
	console.log("No Vercel function output; skip React patch");
	process.exit(0);
}

function walkMjs(dir) {
	const files = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === "node_modules") continue;
			files.push(...walkMjs(path));
			continue;
		}
		if (entry.name.endsWith(".mjs")) files.push(path);
	}
	return files;
}

const requireReact = /__require\(\s*["']react["']\s*\)/g;
let patched = 0;

for (const file of walkMjs(funcDir)) {
	const source = readFileSync(file, "utf8");
	const next = source.replace(requireReact, "require_react()");
	if (next === source) continue;
	if (!/\brequire_react\b/.test(source)) {
		console.error(`cannot rewrite ${file}: no require_react in scope`);
		process.exit(1);
	}
	writeFileSync(file, next);
	patched += 1;
	console.log(
		`rewrote __require("react") in ${file.slice(funcDir.length + 1)}`,
	);
}

console.log(`patched ${patched} SSR file(s) onto the inlined React instance`);
