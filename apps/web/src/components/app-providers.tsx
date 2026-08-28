import { ClerkProvider } from "@clerk/tanstack-react-start";
import { env } from "@tradely/env/web";
import { TooltipProvider } from "@tradely/ui/components/tooltip";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { ClerkAnalyticsIdentity } from "@/analytics/clerk-identity";
import { AnalyticsProvider } from "@/analytics/provider";
import { LocaleProvider } from "@/i18n/provider";

export function AppProviders({ children }: { children: ReactNode }) {
	const content = (
		<LocaleProvider>
			<AnalyticsProvider>
				{env.VITE_CLERK_PUBLISHABLE_KEY ? <ClerkAnalyticsIdentity /> : null}
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
	if (!env.VITE_CLERK_PUBLISHABLE_KEY) return content;
	return (
		<ClerkProvider publishableKey={env.VITE_CLERK_PUBLISHABLE_KEY}>
			{content}
		</ClerkProvider>
	);
}

export const clerkIsConfigured = Boolean(env.VITE_CLERK_PUBLISHABLE_KEY);
