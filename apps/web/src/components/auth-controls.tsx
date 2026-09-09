import { Button } from "@tradely/ui/components/button";
import { Skeleton } from "@tradely/ui/components/skeleton";
import { useState } from "react";
import { useAnalytics } from "@/analytics/context";
import { authClient, authIsConfigured, useAuth } from "@/auth/client";
import { useI18n } from "@/i18n/provider";
import { SignInLink } from "./sign-in-link";

function ConfiguredAuthControls() {
	const { t } = useI18n();
	const { capture } = useAnalytics();
	const { isLoaded, isSignedIn, email } = useAuth();
	const [pending, setPending] = useState(false);
	const [failed, setFailed] = useState(false);
	if (!isLoaded)
		return (
			<div role="status">
				<Skeleton className="h-8 w-20" aria-hidden="true" />
				<span className="sr-only">{t("auth.loading")}</span>
			</div>
		);
	if (!isSignedIn) {
		return (
			<SignInLink
				size="sm"
				onClick={() => capture("auth_sign_in_opened", { surface: "header" })}
			>
				{t("auth.signIn")}
			</SignInLink>
		);
	}
	async function signOut() {
		setPending(true);
		setFailed(false);
		try {
			const { error } = await authClient.signOut();
			if (error) {
				setFailed(true);
				return;
			}
			window.location.assign("/");
		} catch {
			setFailed(true);
		} finally {
			setPending(false);
		}
	}
	return (
		<div className="flex items-center gap-2">
			<span
				className="hidden max-w-36 truncate text-muted-foreground text-sm lg:inline"
				title={email ?? undefined}
			>
				{email}
			</span>
			<Button
				size="sm"
				variant="outline"
				disabled={pending}
				onClick={() => void signOut()}
			>
				{t("auth.signOut")}
			</Button>
			{failed ? (
				<span role="alert" className="text-destructive text-sm">
					{t("auth.retry")}
				</span>
			) : null}
		</div>
	);
}

export function AuthControls() {
	return authIsConfigured ? <ConfiguredAuthControls /> : null;
}
