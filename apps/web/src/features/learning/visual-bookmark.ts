import { useSyncExternalStore } from "react";

const key = "tradely:visual-scenes:v1";
const event = "tradely:visual-bookmark";
let cache = "";
let parsed: Record<string, string> = {};
function snapshot() {
	try {
		const raw = localStorage.getItem(key) ?? "{}";
		if (raw !== cache) {
			const value: unknown = JSON.parse(raw);
			parsed =
				value && typeof value === "object" && !Array.isArray(value)
					? Object.fromEntries(
							Object.entries(value).filter(
								(entry): entry is [string, string] =>
									typeof entry[1] === "string",
							),
						)
					: {};
			cache = raw;
		}
	} catch {
		/* Storage is optional; lessons remain usable. */
	}
	return parsed;
}
const empty: Record<string, string> = {};
function subscribe(callback: () => void) {
	window.addEventListener(event, callback);
	window.addEventListener("storage", callback);
	return () => {
		window.removeEventListener(event, callback);
		window.removeEventListener("storage", callback);
	};
}
export const useVisualBookmarks = () =>
	useSyncExternalStore(subscribe, snapshot, () => empty);
export function saveVisualBookmark(lesson: string, scene: string) {
	try {
		localStorage.setItem(
			key,
			JSON.stringify({ ...snapshot(), [lesson]: scene }),
		);
		window.dispatchEvent(new Event(event));
	} catch {
		/* A blocked store must never block navigation. */
	}
}
