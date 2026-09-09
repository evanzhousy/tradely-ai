import type { Guide } from "@/content/guides";
import { canonicalUrl, SITE_NAME, SITE_ORIGIN, serializeJsonLd } from "./site";

const organization = {
	"@type": "Organization",
	"@id": `${SITE_ORIGIN}/#organization`,
	name: SITE_NAME,
	url: `${SITE_ORIGIN}/`,
	logo: canonicalUrl("/brand/tradely-mark.png"),
};

export function guideStructuredData(guide: Guide) {
	const url = canonicalUrl(`/guides/${guide.slug}`);
	return {
		type: "application/ld+json",
		children: serializeJsonLd({
			"@context": "https://schema.org",
			"@graph": [
				organization,
				{
					"@type": "Article",
					headline: guide.title,
					description: guide.description,
					inLanguage: "en",
					dateModified: guide.updated,
					mainEntityOfPage: url,
					author: { "@id": organization["@id"] },
					publisher: { "@id": organization["@id"] },
				},
				{
					"@type": "BreadcrumbList",
					itemListElement: [
						{
							"@type": "ListItem",
							position: 1,
							name: "Home",
							item: `${SITE_ORIGIN}/`,
						},
						{
							"@type": "ListItem",
							position: 2,
							name: "Guides",
							item: canonicalUrl("/guides"),
						},
						{ "@type": "ListItem", position: 3, name: guide.title, item: url },
					],
				},
			],
		}),
	};
}

export function organizationStructuredData() {
	return {
		type: "application/ld+json",
		children: serializeJsonLd({
			"@context": "https://schema.org",
			...organization,
		}),
	};
}
