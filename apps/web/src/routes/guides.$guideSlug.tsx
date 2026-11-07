import { createFileRoute, notFound } from "@tanstack/react-router";
import { GuideArticle } from "@/components/guide-article";
import { getGuide } from "@/content/guides";
import { pageHead } from "@/seo/pages";
import { guideStructuredData } from "@/seo/structured-data";

export const Route = createFileRoute("/guides/$guideSlug")({
	loader: ({ params }) => {
		const guide = getGuide(params.guideSlug);
		if (!guide) throw notFound();
		return guide;
	},
	head: ({ loaderData, matches }) =>
		loaderData
			? {
					...pageHead(`/guides/${loaderData.slug}`, matches),
					scripts: [guideStructuredData(loaderData)],
				}
			: pageHead("/404", matches),
	component: GuidePage,
});

function GuidePage() {
	const guide = Route.useLoaderData();
	return <GuideArticle key={guide.slug} guide={guide} />;
}
