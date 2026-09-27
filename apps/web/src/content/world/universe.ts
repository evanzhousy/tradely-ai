import type { Copy } from "./calendar";

export type UniverseRow = {
	symbol: string;
	type: "stock" | "etf" | "index";
	/** Industry classification; indexes and ETFs have none. */
	sector: Copy | null;
	/** Share price times shares outstanding, in dollars; none for an index. */
	marketCap: number | null;
	/** Session the option-volume figure describes. */
	session: string;
	/** Whole-symbol option volume for that session, or null when the feed sent nothing. */
	optionVolume: number | null;
	/** Dates the symbol was listed; `to` is set once it leaves. */
	listed: { from: string; to?: string };
};

/**
 * The symbols a Monday comparison might include. ALFA is the course's stock; the others are
 * its peers. EMBR's figure is Friday's, FJOR's never arrived, and HALO left on Sep 6.
 */
export const mondayUniverse: readonly UniverseRow[] = [
	{
		symbol: "ALFA",
		type: "stock",
		sector: ["Industrials", "工业"],
		marketCap: 5_000_000_000,
		session: "2030-09-16",
		optionVolume: 2_400,
		listed: { from: "2019-03-04" },
	},
	{
		symbol: "CRUX",
		type: "stock",
		sector: ["Technology", "科技"],
		marketCap: 12_000_000_000,
		session: "2030-09-16",
		optionVolume: 5_600,
		listed: { from: "2015-06-01" },
	},
	{
		symbol: "DUNE",
		type: "stock",
		sector: ["Energy", "能源"],
		marketCap: 3_000_000_000,
		session: "2030-09-16",
		optionVolume: 900,
		listed: { from: "2021-01-11" },
	},
	{
		symbol: "EMBR",
		type: "stock",
		sector: ["Health care", "医疗"],
		marketCap: 8_000_000_000,
		session: "2030-09-13",
		optionVolume: 3_100,
		listed: { from: "2017-09-18" },
	},
	{
		symbol: "FJOR",
		type: "stock",
		sector: ["Technology", "科技"],
		marketCap: 9_500_000_000,
		session: "2030-09-16",
		optionVolume: null,
		listed: { from: "2018-02-05" },
	},
	{
		symbol: "GLYN",
		type: "stock",
		sector: ["Consumer", "消费"],
		marketCap: 1_500_000_000,
		session: "2030-09-16",
		optionVolume: 300,
		listed: { from: "2022-05-02" },
	},
	{
		symbol: "BRDX",
		type: "etf",
		sector: null,
		marketCap: 2_500_000_000,
		session: "2030-09-16",
		optionVolume: 4_200,
		listed: { from: "2012-10-01" },
	},
	{
		symbol: "IDX 500",
		type: "index",
		sector: null,
		marketCap: null,
		session: "2030-09-16",
		optionVolume: 18_000,
		listed: { from: "2005-01-03" },
	},
	{
		symbol: "HALO",
		type: "stock",
		sector: ["Technology", "科技"],
		marketCap: null,
		session: "2030-09-02",
		optionVolume: 6_800,
		listed: { from: "2016-04-04", to: "2030-09-06" },
	},
];

/** Whether a symbol was listed on a date. */
export const listedOn = (row: UniverseRow, date: string) =>
	row.listed.from <= date &&
	(row.listed.to === undefined || date < row.listed.to);
