import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
	head: () => ({
		links: [{ rel: "canonical", href: "https://tradely.ai/privacy" }],
		meta: [
			{ title: "Privacy policy — Tradely" },
			{
				name: "description",
				content:
					"How Tradely handles account, progress, billing, and media information.",
			},
		],
	}),
	component: () => <LegalPage page="privacy" />,
});
