import {
	listedOn,
	mondayUniverse,
	SESSION_DATE,
	type UniverseRow,
} from "@/content/world";

export const THRESHOLD = 500;
/** Symbols listed on the teaching Monday: the candidates a Monday comparison starts from. */
export const CANDIDATES = mondayUniverse.filter((row) =>
	listedOn(row, SESSION_DATE),
);

export type Check = "type" | "session" | "data" | "threshold";
export const CHECKS: readonly Check[] = [
	"type",
	"session",
	"data",
	"threshold",
];

/** "pass", "fail", or "unknown" when the check can't be made. */
export function checkResult(
	row: UniverseRow,
	check: Check,
): "pass" | "fail" | "unknown" {
	switch (check) {
		case "type":
			return row.type === "stock" ? "pass" : "fail";
		case "session":
			return row.session === SESSION_DATE ? "pass" : "fail";
		case "data":
			return row.optionVolume === null ? "unknown" : "pass";
		case "threshold":
			return row.optionVolume === null
				? "unknown"
				: row.optionVolume >= THRESHOLD
					? "pass"
					: "fail";
	}
}

/** The first check a row fails, or null if it hasn't failed any of the first `applied`. */
export function firstFail(row: UniverseRow, applied: number) {
	for (let i = 0; i < applied; i++)
		if (checkResult(row, CHECKS[i]) === "fail") return i;
	return null;
}

export const FJOR_LATE = 7_300;

export const SEP_2 = "2030-09-02";
/** Option volume on Monday Sep 2 for the stocks listed then. */
export const sep2Volume: Record<string, number> = {
	HALO: 6_800,
	CRUX: 4_900,
	ALFA: 1_800,
	DUNE: 700,
};
