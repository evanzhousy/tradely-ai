import { createFileRoute } from "@tanstack/react-router";
import { Alert, AlertDescription } from "@tradely/ui/components/alert";
import { Button, buttonVariants } from "@tradely/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@tradely/ui/components/card";
import {
	Field,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
} from "@tradely/ui/components/field";
import { Input } from "@tradely/ui/components/input";
import { type FormEvent, useEffect, useState } from "react";
import { authClient, authIsConfigured, useAuth } from "@/auth/client";
import { safeReturnTo } from "@/auth/redirect";
import { useI18n } from "@/i18n/provider";

export const Route = createFileRoute("/auth/sign-in")({
	validateSearch: (search: Record<string, unknown>) => ({
		returnTo: safeReturnTo(search.returnTo),
		oauthError: search.oauthError === "google" ? "google" : undefined,
	}),
	head: () => ({
		meta: [
			{ title: "Sign in · Tradely" },
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
	component: SignInPage,
});

function SignInForm({
	returnTo,
	oauthFailed,
}: {
	returnTo: string;
	oauthFailed: boolean;
}) {
	const { t } = useI18n();
	const { isLoaded, isSignedIn } = useAuth();
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [step, setStep] = useState<"email" | "code">("email");
	const [pending, setPending] = useState<"email" | "google" | null>(null);
	const [error, setError] = useState<string | null>(
		oauthFailed ? t("auth.googleFailed") : null,
	);
	const [cooldown, setCooldown] = useState(0);
	useEffect(() => {
		if (isLoaded && isSignedIn) window.location.replace(returnTo);
	}, [isLoaded, isSignedIn, returnTo]);
	useEffect(() => {
		if (cooldown <= 0) return;
		const timer = window.setTimeout(
			() => setCooldown((value) => Math.max(0, value - 1)),
			1000,
		);
		return () => window.clearTimeout(timer);
	}, [cooldown]);

	async function sendCode() {
		setPending("email");
		setError(null);
		try {
			const result = await authClient.emailOtp.sendVerificationOtp({
				email: email.trim(),
				type: "sign-in",
			});
			if (result.error) {
				setError(t("auth.sendFailed"));
				return;
			}
			setEmail(email.trim());
			setStep("code");
			setCode("");
			setCooldown(30);
		} catch {
			setError(t("auth.sendFailed"));
		} finally {
			setPending(null);
		}
	}
	async function signInWithGoogle() {
		if (pending) return;
		setPending("google");
		setError(null);
		const callback = new URL("/auth/callback", window.location.origin);
		callback.searchParams.set("returnTo", safeReturnTo(returnTo));
		try {
			const result = await authClient.signIn.social({
				provider: "google",
				callbackURL: callback.toString(),
				newUserCallbackURL: callback.toString(),
				errorCallbackURL: callback.toString(),
			});
			if (result.error) setError(t("auth.googleFailed"));
		} catch {
			setError(t("auth.googleFailed"));
		} finally {
			setPending(null);
		}
	}
	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (pending) return;
		if (step === "email") {
			await sendCode();
			return;
		}
		setPending("email");
		setError(null);
		try {
			const result = await authClient.signIn.emailOtp({
				email,
				otp: code.trim(),
			});
			if (result.error || !result.data?.user?.emailVerified) {
				setError(t("auth.codeFailed"));
				return;
			}
			window.location.assign(returnTo);
		} catch {
			setError(t("auth.codeFailed"));
		} finally {
			setPending(null);
		}
	}
	return (
		<form onSubmit={(event) => void submit(event)}>
			<FieldGroup>
				{step === "email" ? (
					<>
						<Button
							type="button"
							variant="outline"
							size="lg"
							disabled={Boolean(pending) || !isLoaded}
							aria-busy={pending === "google"}
							onClick={() => void signInWithGoogle()}
						>
							<img
								src="/google-g.png"
								alt=""
								width={18}
								height={18}
								className="size-[18px]"
							/>
							{pending === "google" ? t("auth.working") : t("auth.google")}
						</Button>
						<FieldSeparator>{t("auth.orEmail")}</FieldSeparator>
					</>
				) : null}
				{step === "email" ? (
					<Field>
						<FieldLabel htmlFor="auth-email">{t("auth.email")}</FieldLabel>
						<Input
							id="auth-email"
							name="email"
							type="email"
							autoComplete="email"
							required
							maxLength={254}
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							disabled={Boolean(pending)}
						/>
					</Field>
				) : (
					<>
						<p className="text-muted-foreground text-sm">
							{t("auth.codeSent", { email })}
						</p>
						<Field data-invalid={Boolean(error)}>
							<FieldLabel htmlFor="auth-code">{t("auth.code")}</FieldLabel>
							<Input
								id="auth-code"
								name="code"
								autoComplete="one-time-code"
								inputMode="numeric"
								pattern="[0-9]{6}"
								maxLength={6}
								required
								value={code}
								onChange={(event) =>
									setCode(event.target.value.replace(/\D/g, ""))
								}
								disabled={Boolean(pending)}
								aria-invalid={Boolean(error)}
								aria-describedby={error ? "auth-error" : undefined}
							/>
						</Field>
					</>
				)}
				{error ? (
					<Alert variant="destructive" id="auth-error">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				) : null}
				<Button type="submit" disabled={Boolean(pending)} className="w-full">
					{pending === "email"
						? t("auth.working")
						: step === "email"
							? t("auth.sendCode")
							: t("auth.verifyCode")}
				</Button>
				{step === "code" ? (
					<div className="flex flex-wrap justify-between gap-2">
						<Button
							type="button"
							variant="ghost"
							disabled={Boolean(pending)}
							onClick={() => {
								setStep("email");
								setCode("");
								setError(null);
							}}
						>
							{t("auth.changeEmail")}
						</Button>
						<Button
							type="button"
							variant="ghost"
							disabled={Boolean(pending) || cooldown > 0}
							onClick={() => void sendCode()}
						>
							{cooldown > 0
								? t("auth.resendIn", { seconds: cooldown })
								: t("auth.resend")}
						</Button>
					</div>
				) : (
					<p className="text-muted-foreground text-sm">
						{t("auth.newAccount")}
					</p>
				)}
			</FieldGroup>
		</form>
	);
}

export function SignInPage() {
	const { t } = useI18n();
	const { returnTo, oauthError } = Route.useSearch();
	return (
		<div className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 py-16 sm:py-24">
			<Card>
				<CardHeader>
					<CardTitle>
						<h1>{t("auth.welcome")}</h1>
					</CardTitle>
					<CardDescription>{t("auth.description")}</CardDescription>
				</CardHeader>
				<CardContent>
					{authIsConfigured ? (
						<SignInForm
							returnTo={returnTo}
							oauthFailed={oauthError === "google"}
						/>
					) : (
						<p role="status">{t("access.authUnavailable")}</p>
					)}
				</CardContent>
			</Card>
			<p className="text-center text-muted-foreground text-sm">
				{t("auth.termsPrefix")}{" "}
				<a href="/terms" className="underline">
					{t("footer.terms")}
				</a>{" "}
				·{" "}
				<a href="/privacy" className="underline">
					{t("footer.privacy")}
				</a>
			</p>
			<a href={returnTo} className={buttonVariants({ variant: "ghost" })}>
				{t("auth.back")}
			</a>
		</div>
	);
}
