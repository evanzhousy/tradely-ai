import { createFileRoute } from "@tanstack/react-router";

import { RedditOptionsPage } from "@/features/options-traders/reddit-options-page";
import { pageHead } from "@/seo/pages";

export const Route = createFileRoute("/options-traders_/reddit")({
	head: () => pageHead("/options-traders/reddit"),
	component: RedditOptionsPage,
});
