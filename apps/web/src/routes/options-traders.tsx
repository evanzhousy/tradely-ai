import { createFileRoute } from "@tanstack/react-router";

import { OptionsTradersPage } from "@/features/options-traders/options-traders-page";
import { pageHead } from "@/seo/pages";
import { optionsTradersStructuredData } from "@/seo/structured-data";

export const Route = createFileRoute("/options-traders")({
	// `head` is not code-split, so importing the directory here would load it on every page.
	loader: async () => {
		const { directoryListItems } = await import(
			"@/features/options-traders/saved-data"
		);
		return { listItems: directoryListItems() };
	},
	head: ({ loaderData, matches }) => ({
		...pageHead("/options-traders", matches),
		scripts: loaderData
			? [optionsTradersStructuredData(loaderData.listItems)]
			: [],
	}),
	component: OptionsTradersPage,
});
