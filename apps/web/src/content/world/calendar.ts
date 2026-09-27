/**
 * The course's fictional market calendar. Every walkthrough draws dates from here so lessons
 * share one week: the teaching session is Monday 2030-09-16, and listed expiries are Fridays.
 */
export type Copy = readonly [en: string, zh: string];

export type ExpiryId =
	| "sep20"
	| "sep27"
	| "oct4"
	| "oct11"
	| "oct18"
	| "nov15"
	| "dec20";

export type Expiry = {
	id: ExpiryId;
	date: string;
	label: Copy;
	/** Third-Friday monthly contracts; the others are weeklies. */
	monthly: boolean;
};

export const SESSION_DATE = "2030-09-16";
export const PREVIOUS_SESSION_DATE = "2030-09-13";
export const NEXT_SESSION_DATE = "2030-09-17";
export const SESSION_OPEN = "09:30";
export const SESSION_CLOSE = "16:00";

export const expiries: Record<ExpiryId, Expiry> = {
	sep20: {
		id: "sep20",
		date: "2030-09-20",
		label: ["Sep 20", "9月20日"],
		monthly: true,
	},
	sep27: {
		id: "sep27",
		date: "2030-09-27",
		label: ["Sep 27", "9月27日"],
		monthly: false,
	},
	oct4: {
		id: "oct4",
		date: "2030-10-04",
		label: ["Oct 4", "10月4日"],
		monthly: false,
	},
	oct11: {
		id: "oct11",
		date: "2030-10-11",
		label: ["Oct 11", "10月11日"],
		monthly: false,
	},
	oct18: {
		id: "oct18",
		date: "2030-10-18",
		label: ["Oct 18", "10月18日"],
		monthly: true,
	},
	nov15: {
		id: "nov15",
		date: "2030-11-15",
		label: ["Nov 15", "11月15日"],
		monthly: true,
	},
	dec20: {
		id: "dec20",
		date: "2030-12-20",
		label: ["Dec 20", "12月20日"],
		monthly: true,
	},
};

const DAY_MS = 86_400_000;
const utc = (date: string) => Date.parse(`${date}T00:00:00Z`);

/** Calendar days from one ISO date to another. */
export function daysBetween(from: string, to: string) {
	return Math.round((utc(to) - utc(from)) / DAY_MS);
}

/** Calendar days to expiry, counted from a session date. */
export function daysToExpiry(expiry: ExpiryId, on: string = SESSION_DATE) {
	return daysBetween(on, expiries[expiry].date);
}

const weekdays: readonly Copy[] = [
	["Sun", "周日"],
	["Mon", "周一"],
	["Tue", "周二"],
	["Wed", "周三"],
	["Thu", "周四"],
	["Fri", "周五"],
	["Sat", "周六"],
];
const months = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

/** "Mon Sep 16" / "9月16日 周一". */
export function dayLabel(date: string): Copy {
	const value = new Date(utc(date));
	const weekday = weekdays[value.getUTCDay()];
	const month = value.getUTCMonth();
	const day = value.getUTCDate();
	return [
		`${weekday[0]} ${months[month]} ${day}`,
		`${month + 1}月${day}日 ${weekday[1]}`,
	];
}
