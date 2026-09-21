import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
	useLocation,
} from "@tanstack/react-router";
import { env } from "@tradely/env/web";
import { Link as HeroLink } from "@tradely/ui/components/link";
import { Toast } from "@tradely/ui/components/toast";
import { lazy, Suspense, useEffect } from "react";

import { RouteAnalytics } from "../analytics/route-analytics";
import { AppProviders } from "../components/app-providers";
import { CookieConsentBanner } from "../components/cookie-consent-banner";
import { Footer } from "../components/footer";
import Header from "../components/header";
import { useI18n } from "../i18n/provider";
import appCss from "../index.css?url";
import { localizedPageMetadata } from "../seo/pages";

const TanStackRouterDevtools = lazy(() =>
	import("@tanstack/react-router-devtools").then((module) => ({
		default: module.TanStackRouterDevtools,
	})),
);

export type RouterAppContext = Record<string, never>;

export const Route = createRootRouteWithContext<RouterAppContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ name: "theme-color", content: "#fdc700" },
			{ name: "robots", content: "noindex, follow" },
			{ title: "Tradely" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{
				rel: "icon",
				type: "image/png",
				sizes: "64x64",
				href: "/brand/tradely-favicon-64.png",
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/brand/tradely-apple-touch-icon.png",
			},
		],
	}),
	component: RootDocument,
});

function RootDocument() {
	const location = useLocation();
	const isHouseScene = location.pathname === "/house";
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body suppressHydrationWarning>
				{/*
				  THESIS: Tradely turns options concepts into a repeatable evidence workflow and refuses the generic video-grid LMS.
				  OWN-WORLD: The Night Scholar Owl, sunflower-yellow orientation, ink-black structure, clean white reading surfaces, Inter, and JetBrains Mono establish Tradely's distinct identity.
				  STORY: Orient, learn one concept, practice it in TradingFlow, record progress, and continue.
				  FIRST VIEWPORT: A clear learning thesis, study materials, one start action, sourced course figures, and the independent-practice caveat.
				  FORM: Research Notebook; the homepage uses landing-* composition and the existing desk-* curriculum from DESIGN.md.
				*/}
				<AppProviders>
					<LocalizedDocumentMetadata />
					<RouteAnalytics />
					<div className="flex min-h-svh flex-col">
						<SkipLink />
						{isHouseScene ? null : <Header />}
						<div
							id="main-content"
							tabIndex={-1}
							className="flex-1 outline-none"
						>
							<Outlet />
						</div>
						{isHouseScene ? null : <Footer />}
					</div>
					{isHouseScene ? null : <CookieConsentBanner />}
					{isHouseScene ? null : <Toast.Provider />}
					{env.VITE_ENABLE_DEVELOPER_UI ? (
						<Suspense fallback={null}>
							<TanStackRouterDevtools position="bottom-right" />
						</Suspense>
					) : null}
				</AppProviders>
				<Scripts />
			</body>
		</html>
	);
}

function LocalizedDocumentMetadata() {
	const location = useLocation();
	const { locale } = useI18n();
	useEffect(() => {
		const metadata = localizedPageMetadata(location.pathname, locale);
		const updates = [
			['meta[name="description"]', metadata.description],
			['meta[property="og:title"]', metadata.title],
			['meta[property="og:description"]', metadata.description],
			['meta[name="twitter:title"]', metadata.title],
			['meta[name="twitter:description"]', metadata.description],
		] as const;
		const applyMetadata = () => {
			if (document.title !== metadata.title) document.title = metadata.title;
			for (const [selector, content] of updates) {
				const element = document.querySelector(selector);
				if (element?.getAttribute("content") !== content)
					element?.setAttribute("content", content);
			}
		};
		applyMetadata();
		const observer = new MutationObserver(applyMetadata);
		observer.observe(document.head, {
			attributes: true,
			childList: true,
			subtree: true,
		});
		return () => observer.disconnect();
	}, [locale, location.pathname]);
	return null;
}

function SkipLink() {
	const { t } = useI18n();
	return (
		<HeroLink
			href="#main-content"
			className="sr-only fixed top-3 left-3 z-50 rounded-xl bg-background px-4 py-2 font-medium text-foreground shadow-lg focus:not-sr-only focus:outline-none focus:ring-3 focus:ring-ring/40"
		>
			{t("common.skipToContent")}
		</HeroLink>
	);
}
