import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { RouterProvider } from "@tradely/ui/components/router-provider";
import { ThemeProvider } from "next-themes";
import { type ReactNode, useState } from "react";
import { AuthAnalyticsIdentity } from "@/analytics/auth-identity";
import { AnalyticsProvider } from "@/analytics/provider";
import { authIsConfigured } from "@/auth/client";
import type { Locale } from "@/i18n/messages";
import { LocaleProvider } from "@/i18n/provider";

export function AppProviders({
	children,
	locale,
}: {
	children: ReactNode;
	locale: Locale;
}) {
	const router = useRouter();
	const [queryClient] = useState(() => new QueryClient());
	return (
		<RouterProvider navigate={(href) => void router.navigate({ to: href })}>
			<QueryClientProvider client={queryClient}>
				<LocaleProvider initialLocale={locale}>
					<AnalyticsProvider>
						{authIsConfigured ? <AuthAnalyticsIdentity /> : null}
						<ThemeProvider
							attribute="class"
							defaultTheme="system"
							enableSystem
							disableTransitionOnChange
						>
							{children}
						</ThemeProvider>
					</AnalyticsProvider>
				</LocaleProvider>
			</QueryClientProvider>
		</RouterProvider>
	);
}
