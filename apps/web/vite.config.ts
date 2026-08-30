import posthog from "@posthog/rollup-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

import {
	normalizePostHogHost,
	POSTHOG_CONTROL_HOST,
	POSTHOG_INGESTION_HOST,
} from "./src/analytics/posthog-config.ts";
import { resolveAnalyticsRelease } from "./src/analytics/release.ts";

const appRelease = resolveAnalyticsRelease(
	process.env.VERCEL_GIT_COMMIT_SHA,
	process.env.VITE_APP_RELEASE,
);
const isProductionBuild = process.env.VERCEL_ENV === "production";
const posthogProjectToken = process.env.VITE_POSTHOG_KEY?.trim();
const posthogIngestionHost = normalizePostHogHost(
	process.env.VITE_POSTHOG_HOST,
);
const posthogServerHost = normalizePostHogHost(process.env.POSTHOG_HOST);
const posthogControlHost = normalizePostHogHost(
	process.env.POSTHOG_CLI_HOST,
	POSTHOG_CONTROL_HOST,
);

if (isProductionBuild && appRelease === "local") {
	throw new Error(
		"Production builds require VERCEL_GIT_COMMIT_SHA or VITE_APP_RELEASE for PostHog release correlation",
	);
}

if (isProductionBuild && !posthogProjectToken?.startsWith("phc_")) {
	throw new Error(
		"Production builds require a valid VITE_POSTHOG_KEY for PostHog capture",
	);
}

if (
	isProductionBuild &&
	(posthogIngestionHost !== POSTHOG_INGESTION_HOST ||
		posthogServerHost !== POSTHOG_INGESTION_HOST ||
		posthogControlHost !== POSTHOG_CONTROL_HOST)
) {
	throw new Error(
		"Production builds must use Tradely's US PostHog ingestion and control hosts",
	);
}

function posthogSourceMapsPlugin() {
	const sourceMapsEnabled = process.env.POSTHOG_SOURCEMAPS_ENABLED === "true";
	if (!sourceMapsEnabled) {
		if (isProductionBuild) {
			throw new Error(
				"Production builds require POSTHOG_SOURCEMAPS_ENABLED=true for Error Tracking source maps",
			);
		}
		return null;
	}
	const personalApiKey = process.env.POSTHOG_CLI_API_KEY;
	const projectId = process.env.POSTHOG_CLI_PROJECT_ID?.trim();
	if (!personalApiKey || !projectId) {
		throw new Error(
			"PostHog source maps are enabled but build credentials are incomplete",
		);
	}
	if (projectId !== "582920") {
		throw new Error(
			"PostHog source maps must target the Tradely project (582920)",
		);
	}
	return posthog({
		personalApiKey,
		projectId,
		host: posthogControlHost,
		sourcemaps: {
			enabled: true,
			releaseName: "tradely-web",
			releaseVersion: appRelease,
			build: process.env.VERCEL_DEPLOYMENT_ID,
			deleteAfterUpload: true,
		},
	});
}

const sourceMapsPlugin = posthogSourceMapsPlugin();

export default defineConfig({
	define: {
		"import.meta.env.VITE_APP_RELEASE": JSON.stringify(appRelease),
	},
	server: {
		port: 8250,
	},
	resolve: {
		tsconfigPaths: true,
	},
	ssr: {
		// Workspace packages must be bundled. React itself is inlined by Nitro into
		// `_libs/@tanstack/react-router+[...].mjs` as `require_react`. CJS shims such
		// as use-sync-external-store still emit `__require("react")`; copy-vercel-react.mjs
		// rewrites those onto the inlined instance so Clerk/Base UI share one dispatcher.
		noExternal: [/^@tradely\//],
	},
	plugins: [
		tailwindcss(),
		tanstackStart(),
		nitro({ preset: "vercel" }),
		viteReact(),
		...(sourceMapsPlugin ? [sourceMapsPlugin] : []),
	],
});
