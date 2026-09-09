import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/callback")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const { completeOAuthRequest } = await import("@/auth/neon.server");
				return completeOAuthRequest(request);
			},
		},
	},
});
