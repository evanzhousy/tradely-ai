import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
			"@tradely/db": fileURLToPath(
				new URL("../../packages/db/src", import.meta.url),
			),
			"@tradely/env": fileURLToPath(
				new URL("../../packages/env/src", import.meta.url),
			),
			"@tradely/ui": fileURLToPath(
				new URL("../../packages/ui/src", import.meta.url),
			),
		},
	},
	test: {
		environment: "node",
		include: ["src/**/*.test.ts"],
	},
});
