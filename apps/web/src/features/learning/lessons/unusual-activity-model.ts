import {
	mondayActivity,
	oct105CallBlock,
	oct105CallLast,
	typicalVolumeProfile,
} from "@/content/world";

export type ActivityId = (typeof mondayActivity)[number]["id"];
export const byId = (id: ActivityId) =>
	mondayActivity.find(
		(row) => row.id === id,
	) as (typeof mondayActivity)[number];

/** "4.2×", or "0.42×" below one so small ratios keep two digits. */
export const ratio = (value: number) => `${value.toFixed(value < 1 ? 2 : 1)}×`;

export const CALL_105 = byId("oct18-105");
export const minutesAfterOpen = (time: string) => {
	const [hour, minute] = time.split(":").map(Number);
	return hour * 60 + minute - 570;
};
export const T1_MINUTE = minutesAfterOpen(oct105CallLast.time);
export const BLOCK_MINUTE = minutesAfterOpen(oct105CallBlock.time.slice(0, 5));

export function typicalBy(minute: number) {
	const points = typicalVolumeProfile;
	for (let i = 1; i < points.length; i++) {
		const [x0, y0] = points[i - 1];
		const [x1, y1] = points[i];
		if (minute <= x1)
			return CALL_105.typical * (y0 + ((minute - x0) / (x1 - x0)) * (y1 - y0));
	}
	return CALL_105.typical;
}

export function todayBy(minute: number) {
	if (minute >= BLOCK_MINUTE) return CALL_105.volume;
	if (minute >= T1_MINUTE) return oct105CallLast.size;
	return 0;
}

export const clock = (minute: number) => {
	const total = 570 + minute;
	return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

export const ALL: readonly ActivityId[] = mondayActivity.map((row) => row.id);
