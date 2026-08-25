import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Toaster } from "@tradely/ui/components/sonner";
import { AppProviders } from "../components/app-providers";
import Header from "../components/header";
import { SiteFooter } from "../components/site-footer";
import { htmlLang, type Locale } from "../i18n/locale";
import { t } from "../i18n/ui";
import appCss from "../index.css?url";
import { getRequestLocale } from "../server/locale";

export type RouterAppContext = {
	locale: Locale;
};

export const Route = createRootRouteWithContext<RouterAppContext>()({
	beforeLoad: async () => ({
		locale: await getRequestLocale(),
	}),
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: t("en", "metaTitle") },
			{
				name: "description",
				content: t("en", "metaDescription"),
			},
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	component: RootDocument,
});

function RootDocument() {
	const { locale } = Route.useRouteContext();
	return (
		<html lang={htmlLang(locale)} suppressHydrationWarning>
			<head>
				<title>{t(locale, "metaTitle")}</title>
				<meta name="description" content={t(locale, "metaDescription")} />
				<HeadContent />
			</head>
			<body>
				{/*
				  THESIS: Tradely turns options concepts into a repeatable evidence workflow and refuses the generic video-grid LMS.
				  OWN-WORLD: Official shadcn Base Luma geometry, semantic light/dark surfaces, Inter with CJK fallbacks, and JetBrains Mono for metadata.
				  STORY: Orient, learn one concept, practice it in TradingFlow, record progress, and continue.
				  FIRST VIEWPORT: A decisive course thesis beside the opening lesson, with one start or continue action.
				  FORM: Read-mode guided field manual; stage-grouped lesson path; TradingFlow only in partner/practice surfaces.
				*/}
				<AppProviders locale={locale}>
					<div className="grid min-h-svh grid-rows-[auto_1fr_auto]">
						<Header />
						<Outlet />
						<SiteFooter />
					</div>
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
