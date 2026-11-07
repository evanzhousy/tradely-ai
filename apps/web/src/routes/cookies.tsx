import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";
import { pageHead } from "@/seo/pages";

export const Route = createFileRoute("/cookies")({
	head: ({ matches }) => pageHead("/cookies", matches),
	component: () => <LegalPage page="cookies" />,
});
