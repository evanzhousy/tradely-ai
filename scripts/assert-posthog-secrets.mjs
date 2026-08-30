import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const textExtensions = new Set([
	".cjs",
	".js",
	".json",
	".jsonc",
	".md",
	".mdx",
	".mjs",
	".sh",
	".toml",
	".ts",
	".tsx",
	".txt",
	".yaml",
	".yml",
]);
const sourceExtensions = new Set([".cjs", ".js", ".mjs", ".ts", ".tsx"]);
const sdkOwners = new Map([
	["posthog-js", "apps/web/src/analytics/client.ts"],
	["posthog-node", "apps/web/src/server/analytics/posthog.server.ts"],
]);
const safePlaceholders = new Set([
	"phc_test_placeholder",
	"phx_test_placeholder",
	"phc_...",
	"<ph_project_token>",
	"<personal_api_key>",
]);
const tokenPattern = /\bph[xc]_[A-Za-z0-9_-]{16,}\b/g;
const assignmentPattern =
	/\b(?:VITE_POSTHOG_KEY|POSTHOG_PROJECT_TOKEN|POSTHOG_CLI_API_KEY)\s*=\s*([^\s#]+)/g;
const files = execFileSync(
	"git",
	["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
	{ cwd: projectRoot, encoding: "utf8" },
)
	.split("\0")
	.filter(Boolean);
const violations = [];
let scanned = 0;

for (const relativePath of files) {
	if (!textExtensions.has(extname(relativePath))) continue;
	let contents;
	try {
		contents = readFileSync(resolve(projectRoot, relativePath), "utf8");
	} catch {
		continue;
	}
	if (contents.includes("\0")) continue;
	scanned += 1;
	const isTestFile = /\.test\.[cm]?[jt]sx?$/.test(relativePath);
	if (
		sourceExtensions.has(extname(relativePath)) &&
		relativePath !== "scripts/assert-posthog-secrets.mjs" &&
		!isTestFile
	) {
		if (
			contents.includes("process.env.POSTHOG_CLI_API_KEY") &&
			relativePath !== "apps/web/vite.config.ts"
		) {
			violations.push(
				`${relativePath}: PostHog source-map key read outside the Vite build boundary`,
			);
		}
		for (const [sdk, owner] of sdkOwners) {
			if (
				contents.includes(`from "${sdk}"`) ||
				contents.includes(`from '${sdk}'`) ||
				contents.includes(`import("${sdk}")`) ||
				contents.includes(`import('${sdk}')`)
			) {
				if (relativePath !== owner) {
					violations.push(
						`${relativePath}: direct ${sdk} import bypasses ${owner}`,
					);
				}
			}
		}
	}
	for (const [index, line] of contents.split("\n").entries()) {
		for (const match of line.matchAll(tokenPattern)) {
			if (!safePlaceholders.has(match[0])) {
				violations.push(
					`${relativePath}:${index + 1}: PostHog token-like value`,
				);
			}
		}
		for (const match of line.matchAll(assignmentPattern)) {
			const value = match[1]?.replace(/^['"]|['"]$/g, "");
			if (value && !safePlaceholders.has(value) && !value.startsWith("<")) {
				violations.push(
					`${relativePath}:${index + 1}: populated PostHog credential assignment`,
				);
			}
		}
	}
}

if (violations.length > 0) {
	console.error(
		[
			"PostHog credential scan failed; move values to ignored environment files or Vercel secrets:",
			...violations,
		].join("\n"),
	);
	process.exitCode = 1;
} else {
	console.log(`PostHog credential scan OK: scanned ${scanned} text files.`);
}
