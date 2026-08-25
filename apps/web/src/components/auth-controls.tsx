import {
	SignInButton,
	SignUpButton,
	UserButton,
	useAuth,
} from "@clerk/tanstack-react-start";
import { Badge } from "@tradely/ui/components/badge";
import { Button } from "@tradely/ui/components/button";
import { t } from "@/i18n/ui";
import { useLocale } from "@/i18n/use-locale";

import { clerkIsConfigured } from "./app-providers";

function ConfiguredAuthControls() {
	const locale = useLocale();
	const { isLoaded, isSignedIn } = useAuth();
	if (!isLoaded)
		return <span className="h-9 w-20 animate-pulse rounded-4xl bg-muted" />;
	if (isSignedIn) return <UserButton />;
	return (
		<div className="flex items-center gap-1.5">
			<SignInButton mode="modal">
				<Button variant="ghost" size="sm" className="hidden sm:inline-flex">
					{t(locale, "signIn")}
				</Button>
			</SignInButton>
			<SignUpButton mode="modal">
				<Button size="sm">{t(locale, "signUp")}</Button>
			</SignUpButton>
		</div>
	);
}

export function AuthControls() {
	const locale = useLocale();
	if (!clerkIsConfigured)
		return <Badge variant="secondary">{t(locale, "localPreview")}</Badge>;
	return <ConfiguredAuthControls />;
}
