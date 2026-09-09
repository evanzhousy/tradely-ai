import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { pageHead } from "@/seo/pages";

export const Route = createFileRoute("/risk-disclosure")({
	head: () => pageHead("/risk-disclosure"),
	component: () => <LegalPage page="risk-disclosure" />,
});
