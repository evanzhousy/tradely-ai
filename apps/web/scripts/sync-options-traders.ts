/**
 * Refreshes the public options-trader directory from the repository that owns its private CRM.
 *
 *   pnpm --filter web options-traders:sync --source <path to that repository>
 *
 * It runs that repository's own public adapter rather than reading the CRM itself, so outreach
 * notes, scores and other private columns never reach this repository. The output is committed:
 * building or running Tradely never needs the source repository.
 */
import { execFileSync } from "node:child_process";
import {
	copyFileSync,
	mkdirSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const sourceFlag = process.argv.indexOf("--source");
const sourceArgument =
	sourceFlag === -1 ? undefined : process.argv[sourceFlag + 1];
if (!sourceArgument) {
	throw new Error(
		"Pass --source <path to the repository that owns the directory>",
	);
}
const source = resolve(sourceArgument);

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDirectory = join(webRoot, "src/features/options-traders/data");
const avatarDirectory = join(webRoot, "public/options-traders/avatars");
const AVATAR_PATH = "/options-traders/avatars";

type SourceEntry = {
	platform: "x.com" | "youtube.com" | "reddit.com";
	handle: string;
	name: string;
	type: "individual" | "institutional";
	description: string;
	focus: string[];
	cadence: string | null;
	activity: string;
	followers: number | null;
	followersAsOf: string;
	profileUrl: string;
	avatar: string | null;
	languages: string[];
};

// The adapter resolves its CRM and avatar files against the working directory.
process.chdir(source);
const adapter = (await import(
	pathToFileURL(join(source, "src/lib/options-influencers/index.ts")).href
)) as {
	getInfluencerDirectory: () => { entries: SourceEntry[] }[];
	getOptionsInfluencers: () => { handle: string; rank: number }[];
	getInitialOptionsSnapshot: () => unknown;
};

const ranks = new Map(
	adapter
		.getOptionsInfluencers()
		.map((person) => [person.handle.toLowerCase(), person.rank]),
);

/** An explicit field list: a column added upstream stays out until someone adds it here. */
const profiles = adapter.getInfluencerDirectory().flatMap((group) =>
	group.entries.map((entry) => ({
		platform: entry.platform,
		handle: entry.handle,
		name: entry.name,
		type: entry.type,
		description: entry.description,
		focus: entry.focus,
		cadence: entry.cadence,
		activity: entry.activity,
		followers: entry.followers,
		followersAsOf: entry.followersAsOf,
		profileUrl: entry.profileUrl,
		avatar: entry.avatar ? `${AVATAR_PATH}/${basename(entry.avatar)}` : null,
		languages: entry.languages,
		...(entry.platform === "x.com" && ranks.has(entry.handle.toLowerCase())
			? { rank: ranks.get(entry.handle.toLowerCase()) }
			: {}),
	})),
);

mkdirSync(dataDirectory, { recursive: true });
const profilesPath = join(dataDirectory, "profiles.json");
const postsPath = join(dataDirectory, "posts.json");
writeFileSync(profilesPath, `${JSON.stringify(profiles, null, "\t")}\n`);
writeFileSync(
	postsPath,
	`${JSON.stringify(adapter.getInitialOptionsSnapshot(), null, "\t")}\n`,
);

// Replace the folder so a retired profile's image does not stay published.
rmSync(avatarDirectory, { recursive: true, force: true });
mkdirSync(avatarDirectory, { recursive: true });
const sourceAvatars = join(source, "public/images/options-influencers/avatars");
const published = new Set(
	profiles.flatMap((profile) =>
		profile.avatar ? [basename(profile.avatar)] : [],
	),
);
for (const file of readdirSync(sourceAvatars)) {
	if (published.has(file)) {
		copyFileSync(join(sourceAvatars, file), join(avatarDirectory, file));
	}
}

execFileSync(
	"pnpm",
	["exec", "biome", "format", "--write", profilesPath, postsPath],
	{ cwd: webRoot, stdio: "inherit" },
);

console.log(
	`Synced ${profiles.length} profiles (${ranks.size} ranked) and ${published.size} avatars.`,
);
