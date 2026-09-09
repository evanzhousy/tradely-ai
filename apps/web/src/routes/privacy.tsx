import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { pageHead } from "@/seo/pages";

export const Route = createFileRoute("/privacy")({
	head: () => pageHead("/privacy"),
	component: () => <LegalPage page="privacy" />,
});
