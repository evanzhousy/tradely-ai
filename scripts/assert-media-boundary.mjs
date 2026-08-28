import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(
	readFileSync(join(projectRoot, "scripts/media-manifest.json"), "utf8"),
);
const requireLocal = process.argv.includes("--require-local");
const errors = [];
const missingSources = [];

function fail(message) {
	errors.push(message);
}

function walk(directory) {
	const files = [];
	for (const entry of readdirSync(directory, { withFileTypes: true })) {
		if (
			["node_modules", "dist", ".git", ".vite", ".turbo"].includes(entry.name)
		)
			continue;
		const absolute = join(directory, entry.name);
		if (entry.isDirectory()) files.push(...walk(absolute));
		else files.push(absolute);
	}
	return files;
}

const keys = new Set();
for (const asset of manifest.assets ?? []) {
	if (keys.has(asset.key)) fail(`duplicate manifest key: ${asset.key}`);
	keys.add(asset.key);
	if (asset.visibility !== "private")
		fail(`non-private Tradely asset: ${asset.id}`);
	if (asset.source.includes("tradingflow-web-landingpage")) {
		fail(`cross-repository source: ${asset.source}`);
	}
	if (asset.source.startsWith("apps/web/public/")) {
		fail(`private source under public: ${asset.source}`);
	}
	if (!existsSync(resolve(projectRoot, asset.source))) {
		if (requireLocal) fail(`missing manifest source: ${asset.source}`);
		else missingSources.push(asset.source);
	}
	if (
		!asset.key.startsWith("tradingflow-foundations/") &&
		!asset.key.startsWith("tradingflow-concepts/")
	) {
		fail(`unowned key prefix: ${asset.key}`);
	}
}

const courseSource = readFileSync(
	join(projectRoot, "apps/web/src/content/course.ts"),
	"utf8",
);
for (const asset of manifest.assets ?? []) {
	for (const requirement of asset.requiredBy ?? []) {
		if (!requirement.startsWith("course:")) continue;
		const lessonId = requirement.split("/")[1];
		const lessonBlock = new RegExp(
			`id: "${lessonId}"[\\s\\S]{0,900}?access: "paid"`,
		);
		if (!lessonBlock.test(courseSource)) {
			fail(
				`manifest course asset is not a paid lesson: ${asset.id} -> ${lessonId}`,
			);
		}
	}
}

const paidBasenames = new Set(
	(manifest.assets ?? [])
		.filter(
			(asset) =>
				asset.key.startsWith("tradingflow-foundations/") &&
				asset.key.endsWith(".mp4"),
		)
		.map((asset) => basename(asset.key)),
);
for (const name of paidBasenames) {
	const publicPath = join(
		projectRoot,
		"apps/web/public/media/tradingflow",
		name,
	);
	if (existsSync(publicPath))
		fail(`paid video is publicly staged: ${publicPath}`);
}

const importer = readFileSync(
	join(projectRoot, "scripts/import-course-media.mjs"),
	"utf8",
);
if (importer.includes("tradingflow-web-landingpage")) {
	fail("course importer still references the Landing repository");
}

for (const root of ["scripts", "apps", "packages", "docs"]) {
	for (const file of walk(join(projectRoot, root))) {
		if (!/\.(mjs|js|ts|tsx|md|mdx|json|jsonc|toml|yaml|yml)$/.test(file))
			continue;
		if (
			file.endsWith("scripts/assert-media-boundary.mjs") ||
			file.endsWith("apps/web/scripts/upload-course-media.mjs")
		)
			continue;
		if (readFileSync(file, "utf8").includes("tradingflow-web-landingpage")) {
			fail(`cross-repository reference: ${file}`);
		}
	}
}

if (errors.length > 0) {
	console.error(errors.join("\n"));
	process.exitCode = 1;
} else {
	console.log(
		`Tradely media boundary OK: ${manifest.assets.length} owned assets, ${keys.size} unique R2 keys.`,
	);
	if (missingSources.length > 0) {
		console.warn(
			`Local media sources are not present (${missingSources.length}); run pnpm media:import before upload/verification.`,
		);
	}
}
