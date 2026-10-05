import type { Copy } from "@/content/world";

export const STRIKES = [95, 100, 105, 110, 115, 120] as const;
export const SPOT = 100.02;
/**
 * ALFA calls, Monday option volume by expiry and strike. The Oct 18 row matches the tape
 * lessons (the 105/110 spread legs, the 120 call that only arrives on Tuesday).
 */
export const volume = {
	sep20: [0, 380, 315, 0, 0, 0],
	oct18: [45, 20, 505, 540, 0, null],
	nov15: [95, 380, 95, 70, 55, 0],
} as const satisfies Record<string, readonly (number | null)[]>;
export type ExpiryKey = keyof typeof volume;
export const expiryLabel: Record<ExpiryKey, Copy> = {
	sep20: ["Sep 20", "9月20日"],
	oct18: ["Oct 18", "10月18日"],
	nov15: ["Nov 15", "11月15日"],
};
export const MAX = 540;

export const total = (key: ExpiryKey) =>
	volume[key].reduce<number>((sum, value) => sum + (value ?? 0), 0);
export const peak = (key: ExpiryKey) =>
	Math.max(...volume[key].map((value) => value ?? 0));
export const active = (key: ExpiryKey) =>
	volume[key].filter((value) => (value ?? 0) > 0).length;

export type Candidate = {
	id: string;
	label: Copy;
	value: number | null;
	source: Copy;
	/** The first audit that removes it, if any. */
	fails?: "stale" | "scope";
};

export const candidates: readonly Candidate[] = [
	{
		id: "nov115",
		label: ["Nov 15 115 call", "11月15日 115 看涨"],
		value: 1_400,
		source: ["Friday's session", "周五时段"],
		fails: "stale",
	},
	{
		id: "put110",
		label: ["Oct 18 110 put", "10月18日 110 看跌"],
		value: 900,
		source: ["Monday · a put", "周一 · 看跌"],
		fails: "scope",
	},
	{
		id: "oct110",
		label: ["Oct 18 110 call", "10月18日 110 看涨"],
		value: 540,
		source: ["Monday", "周一"],
	},
	{
		id: "oct105",
		label: ["Oct 18 105 call", "10月18日 105 看涨"],
		value: 505,
		source: ["Monday", "周一"],
	},
	{
		id: "oct120",
		label: ["Oct 18 120 call", "10月18日 120 看涨"],
		value: null,
		source: ["Monday · not delivered", "周一 · 未送达"],
	},
];
