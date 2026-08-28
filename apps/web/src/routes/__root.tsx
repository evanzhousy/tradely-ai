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
			{ name: "theme-color", content: "#ffffff" },
			{ name: "robots", content: "index, follow" },
			{ property: "og:site_name", content: "Tradely" },
			{ property: "og:type", content: "website" },
			{ title: "Tradely — Options learning with real workflow practice" },
			{
				name: "description",
				content:
					"Learn options flow, ranking, Greeks, GEX, and open interest through an ordered curriculum with TradingFlow practice.",
			},
		],
		links: [{ rel: "stylesheet", href: appCss }],
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
				  OWN-WORLD: TradingFlow-authorized Luma geometry, semantic light/dark surfaces, Inter, JetBrains Mono, and restrained blue action color under a distinct Tradely identity.
				  STORY: Orient, learn one concept, practice it in TradingFlow, record progress, and continue.
				  FIRST VIEWPORT: A decisive course thesis beside a real curriculum preview and existing TradingFlow media, with one clear start action.
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
