import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "@tradely/ui/components/sonner";

import { RouteAnalytics } from "../analytics/route-analytics";
import { AppProviders } from "../components/app-providers";
import { CookieConsentBanner } from "../components/cookie-consent-banner";
import { Footer } from "../components/footer";
import Header from "../components/header";
import { useI18n } from "../i18n/provider";
import appCss from "../index.css?url";

export type RouterAppContext = Record<string, never>;

export const Route = createRootRouteWithContext<RouterAppContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ name: "theme-color", content: "#f2c94c" },
			{ name: "robots", content: "index, follow" },
			{ property: "og:site_name", content: "Tradely" },
			{ property: "og:type", content: "website" },
			{
				property: "og:image",
				content: "https://tradely.ai/brand/tradely-mark.png",
			},
			{ property: "og:image:width", content: "1254" },
			{ property: "og:image:height", content: "1254" },
			{ property: "og:image:alt", content: "Tradely Night Scholar Owl" },
			{ name: "twitter:card", content: "summary" },
			{
				name: "twitter:image",
				content: "https://tradely.ai/brand/tradely-mark.png",
			},
			{ title: "Tradely — Options learning with real workflow practice" },
			{
				name: "description",
				content:
					"Learn options flow, ranking, Greeks, GEX, and open interest through an ordered curriculum with TradingFlow practice.",
			},
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
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body suppressHydrationWarning>
				{/*
				  THESIS: Tradely turns options concepts into a repeatable evidence workflow and refuses the generic video-grid LMS.
				  OWN-WORLD: The Night Scholar Owl, sunflower-yellow orientation, ink-black structure, clean white reading surfaces, Luma geometry, Inter, and JetBrains Mono establish Tradely's distinct identity.
				  STORY: Orient, learn one concept, practice it in TradingFlow, record progress, and continue.
				  FIRST VIEWPORT: A decisive, single-column course thesis with one clear start action and an explicit partnered-tool path.
				  FORM: Read-mode guided field manual; approved sidebar lesson structure from the product plan.
				*/}
				<AppProviders>
					<RouteAnalytics />
					<div className="flex min-h-svh flex-col">
						<SkipLink />
						<Header />
						<div
							id="main-content"
							tabIndex={-1}
							className="flex-1 outline-none"
						>
							<Outlet />
						</div>
						<Footer />
					</div>
					<CookieConsentBanner />
					<Toaster richColors />
					{import.meta.env.DEV ? (
						<TanStackRouterDevtools position="bottom-right" />
					) : null}
				</AppProviders>
				<Scripts />
			</body>
		</html>
	);
}

function SkipLink() {
	const { t } = useI18n();
	return (
		<a
			href="#main-content"
			className="sr-only fixed top-3 left-3 z-50 rounded-xl bg-background px-4 py-2 font-medium text-foreground shadow-lg focus:not-sr-only focus:outline-none focus:ring-3 focus:ring-ring/40"
		>
			{t("common.skipToContent")}
		</a>
	);
}
