import { Button } from "@tradely/ui/components/button";
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
			<div
				role="status"
				aria-label={t("auth.loading")}
				className="inline-flex h-8 w-16 items-center justify-center gap-1 rounded-full border border-border/70 bg-muted/80 sm:w-20"
			>
				{[0, 1, 2].map((index) => (
					<span
						key={index}
						aria-hidden="true"
						className="size-1.5 animate-pulse rounded-full bg-muted-foreground/70"
						style={{ animationDelay: `${index * 120}ms` }}
					/>
				))}
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
