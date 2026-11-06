import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/reddit-options")({
	server: {
		handlers: {
			GET: async () => {
				const { redditOptionsFeedResponse } = await import(
					"@/server/reddit-options.server"
				);
				return redditOptionsFeedResponse();
			},
		},
	},
});
