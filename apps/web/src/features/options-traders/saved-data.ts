import posts from "./data/posts.json";
import profiles from "./data/profiles.json";
import { formatHandle, type PostSnapshot, type TraderProfile } from "./model";

/** Written by `scripts/sync-options-traders.ts`, which validates both against their source. */
export const savedProfiles = profiles as TraderProfile[];
export const savedSnapshot = posts as PostSnapshot;

/** Only the Top 30 shows before a reader filters, so structured data lists only what is on screen. */
export const directoryListItems = () =>
	savedProfiles
		.filter((profile) => profile.rank !== undefined)
		.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
		.map((profile) => ({
			name: `${profile.name} (${formatHandle(profile)})`,
			url: profile.profileUrl,
		}));
