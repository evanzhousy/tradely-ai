import { SignInButton, UserButton, useAuth } from "@clerk/tanstack-react-start";
import { Badge } from "@tradely/ui/components/badge";
import { Button } from "@tradely/ui/components/button";

import { useI18n } from "@/i18n/provider";
import { clerkIsConfigured } from "./app-providers";

function ConfiguredAuthControls() {
	const { t } = useI18n();
	const { isLoaded, isSignedIn } = useAuth();
	if (!isLoaded)
		return (
			<span
				className="h-9 w-20 animate-pulse rounded-4xl bg-muted"
				role="status"
				aria-label={t("auth.loading")}
			/>
		);
	if (isSignedIn) return <UserButton />;
	return (
		<SignInButton mode="modal">
			<Button size="sm">{t("auth.signIn")}</Button>
		</SignInButton>
	);
}

export function AuthControls() {
	const { t } = useI18n();
	if (!clerkIsConfigured)
		return <Badge variant="secondary">{t("auth.localPreview")}</Badge>;
	return <ConfiguredAuthControls />;
}
