import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/risk-disclosure")({
	head: () => ({
		links: [{ rel: "canonical", href: "https://tradely.ai/risk-disclosure" }],
		meta: [
			{ title: "Options risk disclosure — Tradely" },
			{
				name: "description",
				content:
					"Important options, leverage, assignment, and data limitations.",
			},
		],
	}),
	component: () => <LegalPage page="risk-disclosure" />,
});
