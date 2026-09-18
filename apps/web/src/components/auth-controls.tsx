import { Button } from "@tradely/ui/components/button";
import {
	Menu,
	MenuContent,
	MenuItem,
	MenuTrigger,
} from "@tradely/ui/components/menu";
import { ChevronDownIcon, LogOutIcon, UserRoundIcon } from "lucide-react";
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
		<Menu>
			<MenuTrigger
				render={
					<Button
						size="sm"
						variant="ghost"
						className="max-w-44 gap-1.5 px-2"
						aria-label={
							email ? `${t("auth.account")}: ${email}` : t("auth.account")
						}
					/>
				}
			>
				<UserRoundIcon aria-hidden="true" />
				<span className="hidden max-w-32 truncate text-muted-foreground sm:inline">
					{email}
				</span>
				<ChevronDownIcon
					className="size-3.5 text-muted-foreground"
					aria-hidden="true"
				/>
			</MenuTrigger>
			<MenuContent>
				<div className="px-2.5 py-2">
					<p className="font-medium text-xs">{t("auth.account")}</p>
					<p
						className="mt-0.5 max-w-52 truncate text-muted-foreground text-xs"
						title={email ?? undefined}
					>
						{email}
					</p>
				</div>
				<div className="my-1 border-border border-t" />
				<MenuItem
					disabled={pending}
					closeOnClick={false}
					onClick={() => void signOut()}
				>
					<LogOutIcon className="size-4" aria-hidden="true" />
					{t("auth.signOut")}
				</MenuItem>
				{failed ? (
					<p role="alert" className="px-2.5 py-2 text-destructive text-xs">
						{t("auth.retry")}
					</p>
				) : null}
			</MenuContent>
		</Menu>
	);
}

export function AuthControls() {
	return authIsConfigured ? <ConfiguredAuthControls /> : null;
}
