import { TooltipProvider } from "@tradely/ui/components/tooltip";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { AuthAnalyticsIdentity } from "@/analytics/auth-identity";
import { AnalyticsProvider } from "@/analytics/provider";
import { authIsConfigured } from "@/auth/client";
import { LocaleProvider } from "@/i18n/provider";

export function AppProviders({ children }: { children: ReactNode }) {
	return (
		<LocaleProvider>
			<AnalyticsProvider>
				{authIsConfigured ? <AuthAnalyticsIdentity /> : null}
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<TooltipProvider>{children}</TooltipProvider>
				</ThemeProvider>
			</AnalyticsProvider>
		</LocaleProvider>
	);
}
