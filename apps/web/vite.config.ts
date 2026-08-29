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
		// Bundle workspace packages, but leave React and third-party CJS packages
		// to the Node runtime so Nitro does not evaluate React's CJS entry as ESM
		// (`module is not defined` locally, invalid hook dispatcher on Vercel).
		noExternal: [/^@tradely\//],
	},
	plugins: [
		tailwindcss(),
		tanstackStart(),
		nitro({ preset: "vercel" }),
		viteReact(),
	],
});
