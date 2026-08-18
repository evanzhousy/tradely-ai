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
import appCss from "../index.css?url";

export type RouterAppContext = Record<string, never>;

export const Route = createRootRouteWithContext<RouterAppContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
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
			<body>
				{/*
				  THESIS: Tradely turns options concepts into a repeatable evidence workflow and refuses the generic video-grid LMS.
				  OWN-WORLD: TradingFlow-authorized Luma geometry, semantic light/dark surfaces, Inter, JetBrains Mono, and restrained blue action color under a distinct Tradely identity.
				  STORY: Orient, learn one concept, practice it in TradingFlow, record progress, and continue.
				  FIRST VIEWPORT: A decisive course thesis beside a real curriculum preview and existing TradingFlow media, with one clear start action.
				  FORM: Read-mode guided field manual; approved sidebar lesson structure from the product plan.
				*/}
				<AppProviders>
					<div className="grid min-h-svh grid-rows-[auto_1fr]">
						<Header />
						<Outlet />
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
