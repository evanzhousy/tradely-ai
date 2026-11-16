import type { OptionsTradersPlatform } from "@/analytics/events";

import type { TraderPlatform } from "./model";

const PLATFORM_KEYS = {
	"x.com": "x",
	"youtube.com": "youtube",
	"reddit.com": "reddit",
} as const satisfies Record<TraderPlatform, OptionsTradersPlatform>;

/** The short platform name analytics events use. */
export const analyticsPlatform = (platform: TraderPlatform) =>
	PLATFORM_KEYS[platform];
