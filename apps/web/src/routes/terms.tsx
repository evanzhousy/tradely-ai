import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
	head: () => ({
		links: [{ rel: "canonical", href: "https://tradely.ai/terms" }],
		meta: [
			{ title: "Terms of service — Tradely" },
			{
				name: "description",
				content:
					"Terms governing use of the Tradely learning hub and membership.",
			},
		],
	}),
	component: () => <LegalPage page="terms" />,
});
