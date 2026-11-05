import posts from "./data/posts.json";
import profiles from "./data/profiles.json";
import { formatHandle, type PostSnapshot, type TraderProfile } from "./model";

/** Written by `scripts/sync-options-traders.ts`, which validates both against their source. */
export const savedProfiles = profiles as TraderProfile[];
export const savedSnapshot = posts as PostSnapshot;

export const directoryListItems = () =>
	savedProfiles.map((profile) => ({
		name: `${profile.name} (${formatHandle(profile)})`,
		url: profile.profileUrl,
	}));
