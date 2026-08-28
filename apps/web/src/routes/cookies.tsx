import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/cookies")({
	head: () => ({
		links: [{ rel: "canonical", href: "https://tradely.ai/cookies" }],
		meta: [
			{ title: "Cookie policy — Tradely" },
			{
				name: "description",
				content:
					"The necessary and preference browser storage used by Tradely.",
			},
		],
	}),
	component: () => <LegalPage page="cookies" />,
});
