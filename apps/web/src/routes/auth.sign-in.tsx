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
import { DotPattern } from "@tradely/ui/components/dot-pattern";
import {
	Field,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
} from "@tradely/ui/components/field";
import { Input } from "@tradely/ui/components/input";
import { InteractiveHoverButton } from "@tradely/ui/components/interactive-hover-button";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemMedia,
	ItemTitle,
} from "@tradely/ui/components/item";
import { StepIndicator } from "@tradely/ui/components/step-indicator";
import { BookmarkCheckIcon, BookOpenIcon, ListChecksIcon } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { authClient, authIsConfigured, useAuth } from "@/auth/client";
import { safeReturnTo } from "@/auth/redirect";
import { useI18n } from "@/i18n/provider";
import { pageHead } from "@/seo/pages";

export const Route = createFileRoute("/auth/sign-in")({
	validateSearch: (search: Record<string, unknown>) => ({
		returnTo: safeReturnTo(search.returnTo),
		oauthError: search.oauthError === "google" ? "google" : undefined,
	}),
	head: () => pageHead("/auth/sign-in"),
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
				<StepIndicator
					current={step === "email" ? 0 : 1}
					label={t("auth.welcome")}
					steps={[
						{ id: "email", label: t("auth.email") },
						{ id: "code", label: t("auth.code") },
					]}
				/>
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
				<InteractiveHoverButton
					type="submit"
					disabled={Boolean(pending)}
					className="w-full"
				>
					{pending === "email"
						? t("auth.working")
						: step === "email"
							? t("auth.sendCode")
							: t("auth.verifyCode")}
				</InteractiveHoverButton>
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
	const { t, locale } = useI18n();
	const { returnTo, oauthError } = Route.useSearch();
	return (
		<main className="page-shell sign-in-layout">
			<div className="sign-in-form">
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
			<section className="sign-in-story" aria-labelledby="sign-in-story-title">
				<DotPattern />
				<p className="page-eyebrow">
					{locale === "zh" ? "你的学习空间" : "Your learning space"}
				</p>
				<h2 id="sign-in-story-title">
					{locale === "zh"
						? "把每一次学习，连成自己的研究路径。"
						: "A place for every step of your research."}
				</h2>
				<p className="page-description">
					{locale === "zh"
						? "保存完成记录，回顾已学内容，继续你的下一节课。"
						: "Record your progress, revisit what you have learned, and return to your next lesson."}
				</p>
				<ItemGroup>
					{[
						{
							icon: BookOpenIcon,
							title: locale === "zh" ? "循序学习" : "Follow a clear path",
							description:
								locale === "zh"
									? "从基础概念到独立研究。"
									: "From foundational concepts to independent research.",
						},
						{
							icon: ListChecksIcon,
							title:
								locale === "zh"
									? "通过练习理解"
									: "Learn by working through it",
							description:
								locale === "zh"
									? "用交互案例检验自己的理解。"
									: "Check your understanding with interactive cases.",
						},
						{
							icon: BookmarkCheckIcon,
							title: locale === "zh" ? "保留完成记录" : "Keep your progress",
							description:
								locale === "zh"
									? "在账户中记录已完成的课程。"
									: "Record completed lessons in your account.",
						},
					].map((item) => (
						<Item key={item.title} render={<li />} size="sm">
							<ItemMedia variant="icon">
								<item.icon aria-hidden="true" />
							</ItemMedia>
							<ItemContent>
								<ItemTitle>{item.title}</ItemTitle>
								<ItemDescription>{item.description}</ItemDescription>
							</ItemContent>
						</Item>
					))}
				</ItemGroup>
			</section>
		</main>
	);
}
