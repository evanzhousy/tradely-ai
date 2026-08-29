import posthog from "@posthog/rollup-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

function posthogSourceMapsPlugin() {
	if (process.env.POSTHOG_SOURCEMAPS_ENABLED !== "true") return null;
	const personalApiKey = process.env.POSTHOG_CLI_API_KEY;
	const projectId = process.env.POSTHOG_CLI_PROJECT_ID;
	if (!personalApiKey || !projectId) {
		throw new Error(
			"PostHog source maps are enabled but build credentials are incomplete",
		);
	}
	return posthog({
		personalApiKey,
		projectId,
		host: process.env.POSTHOG_CLI_HOST ?? "https://us.posthog.com",
		sourcemaps: {
			enabled: true,
			releaseName: "tradely-web",
			releaseVersion: process.env.VERCEL_GIT_COMMIT_SHA,
			build: process.env.VERCEL_DEPLOYMENT_ID,
			deleteAfterUpload: true,
		},
	});
}

const sourceMapsPlugin = posthogSourceMapsPlugin();

export default defineConfig({
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
