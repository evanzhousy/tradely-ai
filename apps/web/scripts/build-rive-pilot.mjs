import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Rive CLI: https://rive.app/docs/cli/getting-started
// No scripts are embedded, so this asset needs no signed script payload. Review builds before deploying.
const cli = process.env.RIVE_CLI || "rive";
const version = execFileSync(cli, ["--version"], { encoding: "utf8" }).trim();
if (version !== "rive 1.0.3")
	throw new Error(`Expected Rive CLI 1.0.3; got ${version}`);
const source = fileURLToPath(
	new URL("../src/features/learning/rive/liquidity/", import.meta.url),
);
const temporary = mkdtempSync(join(tmpdir(), "tradely-rive-build-"));
try {
	for (const name of ["scene.rml", "rive.yaml"])
		copyFileSync(join(source, name), join(temporary, name));
	execFileSync(cli, [temporary, "--verify"], { stdio: "inherit" });
	const inspection = JSON.parse(
		execFileSync(cli, ["inspect", temporary, "--json"], { encoding: "utf8" }),
	);
	if (inspection.problems.length)
		throw new Error(JSON.stringify(inspection.problems));
	execFileSync(cli, [temporary, "--once"], { stdio: "inherit" });
	copyFileSync(
		join(temporary, "build/liquidity.riv"),
		join(source, "liquidity.riv"),
	);
	console.log(
		"Built the liquidity animation; source and runtime asset are ready.",
	);
} finally {
	rmSync(temporary, { recursive: true, force: true });
}
