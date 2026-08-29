import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
	server: {
		port: 8250,
	},
	resolve: {
		tsconfigPaths: true,
	},
	ssr: {
		// Local Nitro SSR leaves React to Node so CJS `react` is not evaluated as
		// ESM (`module is not defined`). Vercel functions have no node_modules, so
		// production must inline React or the SSR chunk fails with MODULE_NOT_FOUND.
		noExternal: process.env.VERCEL
			? [
					/^@tradely\//,
					"react",
					"react-dom",
					"react/jsx-runtime",
					"react/jsx-dev-runtime",
					"use-sync-external-store",
				]
			: [/^@tradely\//],
	},
	plugins: [
		tailwindcss(),
		tanstackStart(),
		nitro({ preset: "vercel" }),
		viteReact(),
	],
});
