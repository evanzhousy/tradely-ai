import { fileURLToPath } from "node:url";
import tailwind from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const path = (relative: string) =>
	fileURLToPath(new URL(relative, import.meta.url));

/**
 * The lesson view for AI assistants (MCP Apps). An assistant renders it from one HTML string in a
 * sandbox that blocks every outside origin, so scripts and styles are inlined into a single file.
 * `pnpm --filter web build` builds it before the app, which serves it from /mcp.
 */
export default defineConfig({
	root: path("./"),
	base: "./",
	cacheDir: path("./node_modules/.vite"),
	resolve: {
		// The MCP packages resolve their own zod; one copy keeps the bundle smaller and lets the
		// view's `jitless` setting reach the schemas they parse.
		dedupe: ["zod"],
		alias: {
			"@tanstack/react-start/server-only": path("./server-only.ts"),
			"@fontsource-variable/inter": path("./no-fonts.css"),
			"@fontsource-variable/jetbrains-mono": path("./no-fonts.css"),
			"@": path("../src"),
			"@tradely/ui/globals.css": path(
				"../../../packages/ui/src/styles/globals.css",
			),
			"@tradely/ui": path("../../../packages/ui/src"),
		},
	},
	build: {
		outDir: path("./dist"),
		emptyOutDir: true,
	},
	plugins: [react(), tailwind(), viteSingleFile()],
});
