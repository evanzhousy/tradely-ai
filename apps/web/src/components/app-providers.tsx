import { ClerkProvider } from "@clerk/tanstack-react-start";
import { env } from "@tradely/env/web";
import { TooltipProvider } from "@tradely/ui/components/tooltip";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
	const content = (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
		>
			<TooltipProvider>{children}</TooltipProvider>
		</ThemeProvider>
	);
	if (!env.VITE_CLERK_PUBLISHABLE_KEY) return content;
	return (
		<ClerkProvider publishableKey={env.VITE_CLERK_PUBLISHABLE_KEY}>
			{content}
		</ClerkProvider>
	);
}

export const clerkIsConfigured = Boolean(env.VITE_CLERK_PUBLISHABLE_KEY);
