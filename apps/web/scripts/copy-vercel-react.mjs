import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
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
/** How a chunk brings the inlined React into scope: `import { u as require_react } from "…";` */
const reactImport =
	/import\s*\{[^}]*?\b(\w+)\s+as\s+require_react\b[^}]*\}\s*from\s*["']([^"']+)["']/;
const files = walkMjs(funcDir);

/** The chunk and export holding the inlined React, read from any chunk that imports it. */
function findInlinedReact() {
	for (const file of files) {
		const match = readFileSync(file, "utf8").match(reactImport);
		if (match)
			return { name: match[1], path: resolve(dirname(file), match[2]) };
	}
	return null;
}

let inlined;
let patched = 0;

for (const file of files) {
	const source = readFileSync(file, "utf8");
	let next = source.replace(requireReact, "require_react()");
	if (next === source) continue;
	if (!/\brequire_react\b/.test(source)) {
		// A CJS shim split into its own chunk has no React import; give it the shared one.
		inlined ??= findInlinedReact();
		if (!inlined) {
			console.error(`cannot rewrite ${file}: no require_react in scope`);
			process.exit(1);
		}
		let specifier = relative(dirname(file), inlined.path).split(sep).join("/");
		if (!specifier.startsWith(".")) specifier = `./${specifier}`;
		next = `import { ${inlined.name} as require_react } from ${JSON.stringify(specifier)};\n${next}`;
	}
	writeFileSync(file, next);
	patched += 1;
	console.log(
		`rewrote __require("react") in ${file.slice(funcDir.length + 1)}`,
	);
}

console.log(`patched ${patched} SSR file(s) onto the inlined React instance`);
