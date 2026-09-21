import { useSyncExternalStore } from "react";

const key = "tradely:visual-scenes:v1";
const event = "tradely:visual-bookmark";

type VisualBookmark = {
	scene: string;
	engaged: boolean;
};

let cache = "";
let records: Record<string, VisualBookmark> = {};
let sceneSnapshot: Record<string, string> = {};
let progressSnapshot: Record<string, boolean> = {};

function readRecords() {
	try {
		const raw = localStorage.getItem(key) ?? "{}";
		if (raw !== cache) {
			const value: unknown = JSON.parse(raw);
			records =
				value && typeof value === "object" && !Array.isArray(value)
					? Object.fromEntries(
							Object.entries(value).flatMap(([lesson, bookmark]) => {
								if (typeof bookmark === "string") {
									return [[lesson, { scene: bookmark, engaged: false }]];
								}
								if (
									bookmark &&
									typeof bookmark === "object" &&
									"scene" in bookmark &&
									typeof bookmark.scene === "string"
								) {
									return [
										[
											lesson,
											{
												scene: bookmark.scene,
												engaged:
													"engaged" in bookmark && bookmark.engaged === true,
											},
										],
									];
								}
								return [];
							}),
						)
					: {};
			sceneSnapshot = Object.fromEntries(
				Object.entries(records).map(([lesson, bookmark]) => [
					lesson,
					bookmark.scene,
				]),
			);
			progressSnapshot = Object.fromEntries(
				Object.entries(records).map(([lesson, bookmark]) => [
					lesson,
					bookmark.engaged,
				]),
			);
			cache = raw;
		}
	} catch {
		/* Storage is optional; lessons remain usable. */
	}
	return records;
}

function scenes() {
	readRecords();
	return sceneSnapshot;
}

function progress() {
	readRecords();
	return progressSnapshot;
}

const emptyScenes: Record<string, string> = {};
const emptyProgress: Record<string, boolean> = {};
function subscribe(callback: () => void) {
	window.addEventListener(event, callback);
	window.addEventListener("storage", callback);
	return () => {
		window.removeEventListener(event, callback);
		window.removeEventListener("storage", callback);
	};
}
export const useVisualBookmarks = () =>
	useSyncExternalStore(subscribe, scenes, () => emptyScenes);
export const useVisualProgress = () =>
	useSyncExternalStore(subscribe, progress, () => emptyProgress);

function writeVisualBookmark(lesson: string, bookmark: VisualBookmark) {
	const current = readRecords();
	const previous = current[lesson];
	if (
		previous?.scene === bookmark.scene &&
		previous.engaged === bookmark.engaged
	)
		return;
	try {
		localStorage.setItem(
			key,
			JSON.stringify({ ...current, [lesson]: bookmark }),
		);
		window.dispatchEvent(new Event(event));
	} catch {
		/* A blocked store must never block navigation. */
	}
}

export function initializeVisualBookmark(lesson: string, scene: string) {
	const current = readRecords()[lesson];
	if (current) return;
	writeVisualBookmark(lesson, { scene, engaged: false });
}

export function saveVisualBookmark(lesson: string, scene: string) {
	writeVisualBookmark(lesson, { scene, engaged: true });
}

export function markVisualBookmarkEngaged(lesson: string, scene: string) {
	writeVisualBookmark(lesson, { scene, engaged: true });
}
