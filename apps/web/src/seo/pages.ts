import { getLesson, tradingFlowCourse } from "@/content/course";
import { getGuide, guides } from "@/content/guides";
import { canonicalUrl, SITE_NAME, SITE_ORIGIN } from "./site";

export type SeoPage = {
	path: string;
	title: string;
	description: string;
	index: boolean;
	sitemap: boolean;
	updated?: string;
	article?: boolean;
};

const staticPages: SeoPage[] = [
	{
		path: "/changelog",
		title: "Changelog | Tradely",
		description:
			"What’s new in Tradely: lesson updates, interactive practice and improvements to the way you learn options research.",
		index: true,
		sitemap: true,
	},
	{
		path: "/",
		title: "Learn Options Flow, Greeks & Gamma Exposure | Tradely",
		description:
			"Learn to interpret options data with worked examples and interactive practice. Explore options flow, open interest, Greeks and gamma exposure.",
		index: true,
		sitemap: true,
	},
	{
		path: "/guides",
		title: "Options Guides with Interactive Examples | Tradely",
		description:
			"Free guides to gamma exposure, open interest vs volume and IV crush. Read a worked example, test your understanding and continue learning.",
		index: true,
		sitemap: true,
	},
	{
		path: "/courses/tradingflow-foundations",
		title: "Options Research Course: Concepts & Practice | Tradely",
		description:
			"Build a repeatable options research process through contracts, executions, flow, Greeks and market structure. Explore free lessons and the full curriculum.",
		index: true,
		sitemap: true,
	},
	{
		path: "/pricing",
		title: "Options Course Access & Pricing | Tradely",
		description:
			"Compare Tradely membership and course access. Start with free lessons, then choose access to the complete options research curriculum.",
		index: true,
		sitemap: true,
	},
	{
		path: "/privacy",
		title: "Privacy Policy | Tradely",
		description:
			"How Tradely handles account, learning progress, billing and analytics information.",
		index: true,
		sitemap: false,
	},
	{
		path: "/terms",
		title: "Terms of Service | Tradely",
		description:
			"Terms for using Tradely courses, educational content and learning services.",
		index: true,
		sitemap: false,
	},
	{
		path: "/cookies",
		title: "Cookie Policy | Tradely",
		description:
			"Learn about Tradely cookies, analytics consent and privacy choices.",
		index: true,
		sitemap: false,
	},
	{
		path: "/risk-disclosure",
		title: "Risk Disclosure | Tradely",
		description:
			"Understand the educational scope of Tradely and the risks associated with options trading.",
		index: true,
		sitemap: false,
	},
	{
		path: "/auth/sign-in",
		title: "Sign In | Tradely",
		description: "Sign in to your Tradely learning account.",
		index: false,
		sitemap: false,
	},
	{
		path: "/house",
		title: "8311 Kirkland — House explorer | Tradely",
		description: "Interactive house explorer.",
		index: false,
		sitemap: false,
	},
];

export function seoPage(path: string): SeoPage | undefined {
	const normalized = path.replace(/\/+$/, "") || "/";
	const fixed = staticPages.find((page) => page.path === normalized);
	if (fixed) return fixed;
	if (normalized.startsWith("/guides/")) {
		const guide = getGuide(normalized.slice("/guides/".length));
		if (guide)
			return {
				path: normalized,
				title: `${guide.title} | Tradely`,
				description: guide.description,
				index: true,
				sitemap: true,
				updated: guide.updated,
				article: true,
			};
	}
	if (normalized.startsWith("/learn/")) {
		const lesson = getLesson(normalized.slice("/learn/".length));
		if (lesson)
			return {
				path: normalized,
				title: `${lesson.title} | Tradely`,
				description: lesson.summary,
				index: lesson.access === "preview",
				sitemap: lesson.access === "preview",
			};
	}
	return undefined;
}

export function pageHead(path: string) {
	const page = seoPage(path);
	if (!page)
		return {
			meta: [
				{ title: "Page Not Found | Tradely" },
				{ name: "robots", content: "noindex, follow" },
			],
			links: [],
		};
	const index = page.index && import.meta.env.VITE_DEPLOYMENT_ENV !== "preview";
	const url = canonicalUrl(page.path);
	return {
		meta: [
			{ title: page.title },
			{ name: "description", content: page.description },
			{ name: "robots", content: index ? "index, follow" : "noindex, follow" },
			{ property: "og:site_name", content: SITE_NAME },
			{ property: "og:type", content: page.article ? "article" : "website" },
			{ property: "og:title", content: page.title },
			{ property: "og:description", content: page.description },
			{ property: "og:url", content: url },
			{
				property: "og:image",
				content: canonicalUrl("/brand/tradely-mark.png"),
			},
			{ name: "twitter:card", content: "summary" },
			{ name: "twitter:title", content: page.title },
			{ name: "twitter:description", content: page.description },
			{
				name: "twitter:image",
				content: canonicalUrl("/brand/tradely-mark.png"),
			},
		],
		links: [{ rel: "canonical", href: url }],
	};
}

export function indexablePages(): SeoPage[] {
	return [
		...staticPages,
		...guides.map((guide) => seoPage(`/guides/${guide.slug}`)),
		...tradingFlowCourse.lessons.map((lesson) =>
			seoPage(`/learn/${lesson.slug}`),
		),
	].filter((page): page is SeoPage => Boolean(page?.index && page.sitemap));
}

const escapeXml = (value: string) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");

export function sitemapXml(): string {
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexablePages()
		.map(
			(page) =>
				`  <url><loc>${escapeXml(canonicalUrl(page.path))}</loc>${page.updated ? `<lastmod>${escapeXml(page.updated)}</lastmod>` : ""}</url>`,
		)
		.join("\n")}\n</urlset>\n`;
}

export function robotsTxt(): string {
	return `User-agent: *\nDisallow:\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
}
