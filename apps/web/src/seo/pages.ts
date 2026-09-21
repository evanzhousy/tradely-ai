import { getLesson, tradingFlowCourse } from "@/content/course";
import { getGuide, guides } from "@/content/guides";
import { getLocalizedCourse } from "@/i18n/course";
import type { Locale } from "@/i18n/messages";
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
			"What’s new in Tradely: lesson updates, animated diagrams and improvements to the way you learn options research.",
		index: true,
		sitemap: true,
	},
	{
		path: "/",
		title: "Learn Options Flow, Greeks & Gamma Exposure | Tradely",
		description:
			"Learn to interpret options data with worked examples and animated diagrams. Explore options flow, open interest, Greeks and gamma exposure.",
		index: true,
		sitemap: true,
	},
	{
		path: "/guides",
		title: "Options Guides with Interactive Examples | Tradely",
		description:
			"Free guides to gamma exposure, open interest vs volume and IV crush. Read a worked example, explore the concept and continue learning.",
		index: true,
		sitemap: true,
	},
	{
		path: "/courses/tradingflow-foundations",
		title: "Options Research Course: Visual Lessons | Tradely",
		description:
			"Build a repeatable options research process through contracts, executions, flow, Greeks and market structure. Explore the complete free curriculum.",
		index: true,
		sitemap: true,
	},
	{
		path: "/pricing",
		title: "Free Learning & Previous Purchases | Tradely",
		description:
			"All current Tradely lessons and exercises are free. Save progress with a free account, or manage previous purchases.",
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

const chineseStaticMetadata: Record<
	string,
	Pick<SeoPage, "title" | "description">
> = {
	"/": {
		title: "免费学习期权成交流、希腊值与 Gamma Exposure | Tradely",
		description:
			"通过动画图解和完整示例学习解读期权数据，涵盖成交流、未平仓量、希腊值与 Gamma Exposure。",
	},
	"/changelog": {
		title: "更新日志 | Tradely",
		description: "查看 Tradely 课程、动画图解与期权研究学习体验的最新改进。",
	},
	"/courses/tradingflow-foundations": {
		title: "视觉化期权研究课程 | Tradely",
		description:
			"从合约、成交、成交流、希腊值到市场结构，建立可重复的期权研究流程。",
	},
	"/pricing": {
		title: "免费学习与历史购买 | Tradely",
		description:
			"Tradely 当前全部课程与练习均免费开放；免费账户可跨设备保存学习标记。",
	},
	"/privacy": {
		title: "隐私政策 | Tradely",
		description: "了解 Tradely 如何处理账户、学习进度、账单与分析数据。",
	},
	"/terms": {
		title: "服务条款 | Tradely",
		description: "使用 Tradely 课程、教育内容与学习服务的条款。",
	},
	"/cookies": {
		title: "Cookie 政策 | Tradely",
		description: "了解 Tradely 的 Cookie、分析授权与隐私选择。",
	},
	"/risk-disclosure": {
		title: "风险披露 | Tradely",
		description: "了解 Tradely 的教育范围以及期权交易相关风险。",
	},
	"/auth/sign-in": {
		title: "登录 | Tradely",
		description: "登录你的 Tradely 学习账户。",
	},
};

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
				index: true,
				sitemap: true,
			};
	}
	return undefined;
}

export function localizedPageMetadata(
	path: string,
	locale: Locale,
): Pick<SeoPage, "title" | "description"> {
	const page = seoPage(path);
	if (!page)
		return {
			title:
				locale === "zh" ? "页面未找到 | Tradely" : "Page Not Found | Tradely",
			description: "",
		};
	if (locale === "en") return page;
	const normalized = path.replace(/\/+$/, "") || "/";
	const fixed = chineseStaticMetadata[normalized];
	if (fixed) return fixed;
	if (normalized.startsWith("/learn/")) {
		const lesson = getLocalizedCourse("zh").lessons.find(
			(item) => item.slug === normalized.slice("/learn/".length),
		);
		if (lesson)
			return {
				title: `${lesson.title} | Tradely`,
				description: lesson.summary,
			};
	}
	return page;
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
