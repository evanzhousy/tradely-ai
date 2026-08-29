import { cpSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const funcDir = join(webRoot, ".vercel/output/functions/__server.func");

if (!existsSync(funcDir)) {
	console.log("No Vercel function output; skip React copy");
	process.exit(0);
}

const destRoot = join(funcDir, "node_modules");
mkdirSync(destRoot, { recursive: true });

for (const pkg of ["react", "react-dom", "scheduler"]) {
	let src;
	try {
		src = dirname(require.resolve(`${pkg}/package.json`));
	} catch {
		console.log(`skip ${pkg}; not resolvable`);
		continue;
	}
	cpSync(src, join(destRoot, pkg), { recursive: true, dereference: true });
	console.log(`copied ${pkg}`);
}
