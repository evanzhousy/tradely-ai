import { useEffect } from "react";

/**
 * Each deploy replaces the site's code files. A page opened on the previous build then asks
 * for files that no longer exist, so any lesson or route it loads on demand fails until the
 * page reloads. These helpers reload once to pick up the current build.
 */
const RELOADED_AT = "tradely:stale-build-reload";
/** A second failure this soon after reloading means the file is really missing: show the error. */
const RETRY_AFTER_MS = 30_000;

/** Browsers' messages for a module, or a stylesheet Vite preloads, that failed to load. */
const FAILED_LOAD =
	/Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i;

export function isStaleBuildError(error: unknown) {
	return FAILED_LOAD.test(
		error instanceof Error ? error.message : String(error),
	);
}

/** Reloads the page, unless it already did so for this reason moments ago. */
export function reloadForStaleBuild() {
	try {
		const last = Number(window.sessionStorage.getItem(RELOADED_AT));
		if (Date.now() - last < RETRY_AFTER_MS) return false;
		window.sessionStorage.setItem(RELOADED_AT, String(Date.now()));
	} catch {
		// Without session storage the reload could repeat forever; leave the error in place.
		return false;
	}
	window.location.reload();
	return true;
}

/** Vite reports every failed on-demand import, and its preloads, with this event. */
export function useReloadOnStaleBuild() {
	useEffect(() => {
		const reload = () => {
			reloadForStaleBuild();
		};
		window.addEventListener("vite:preloadError", reload);
		return () => window.removeEventListener("vite:preloadError", reload);
	}, []);
}
