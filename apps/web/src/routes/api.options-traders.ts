import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/options-traders")({
	server: {
		handlers: {
			GET: async () => {
				const { optionsTradersFeedResponse } = await import(
					"@/server/options-traders.server"
				);
				return optionsTradersFeedResponse();
			},
		},
	},
});
