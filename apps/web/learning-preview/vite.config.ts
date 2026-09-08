import { fileURLToPath } from "node:url";
import tailwind from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const path = (relative: string) =>
	fileURLToPath(new URL(relative, import.meta.url));
/** Explicit local fixture entry; never imported by the application build. */
export default defineConfig({
	root: path("./"),
	// The fixture and real app run together; they must not overwrite optimized deps.
	cacheDir: path("./node_modules/.vite"),
	server: {
		host: "127.0.0.1",
		port: 8261,
		strictPort: true,
		fs: { allow: [path("../../../")] },
	},
	resolve: {
		alias: {
			"@tanstack/react-start/server-only": path("./server-only.ts"),
			"@": path("../src"),
			"@tradely/ui/globals.css": path(
				"../../../packages/ui/src/styles/globals.css",
			),
			"@tradely/ui": path("../../../packages/ui/src"),
		},
	},
	plugins: [react(), tailwind()],
});
