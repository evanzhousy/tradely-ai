import { createFileRoute } from "@tanstack/react-router";
import { sitemapXml } from "@/seo/pages";

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: async () => {
				// Loaded here, on the server only: the directory's date is its last weekly sync.
				const { freshness } = await import(
					"@/features/options-traders/data/posts.json"
				);
				return new Response(
					sitemapXml({
						"/options-traders": freshness.dataSyncedAt.slice(0, 10),
					}),
					{ headers: { "Content-Type": "application/xml; charset=utf-8" } },
				);
			},
		},
	},
});
