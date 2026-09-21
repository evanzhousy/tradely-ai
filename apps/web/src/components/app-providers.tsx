import { useRouter } from "@tanstack/react-router";
import { RouterProvider } from "@tradely/ui/components/router-provider";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { AuthAnalyticsIdentity } from "@/analytics/auth-identity";
import { AnalyticsProvider } from "@/analytics/provider";
import { authIsConfigured } from "@/auth/client";
import { LocaleProvider } from "@/i18n/provider";

export function AppProviders({ children }: { children: ReactNode }) {
	const router = useRouter();
	return (
		<RouterProvider navigate={(href) => void router.navigate({ to: href })}>
			<LocaleProvider>
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
		</RouterProvider>
	);
}
