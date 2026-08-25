import { SignInButton, SignUpButton } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { Button, buttonVariants } from "@tradely/ui/components/button";
import { LockKeyholeIcon, RefreshCwIcon, UserRoundIcon } from "lucide-react";

import type { LessonAccessDecision } from "@/domain/access";
import { t } from "@/i18n/ui";
import { useLocale } from "@/i18n/use-locale";

import { clerkIsConfigured } from "./app-providers";

export function AccessPanel({
	access,
}: {
	access: Extract<LessonAccessDecision, { allowed: false }>;
}) {
	const locale = useLocale();
	if (access.reason === "billing-unavailable") {
		return (
			<Alert>
				<RefreshCwIcon />
				<AlertTitle>{t(locale, "accessRefreshTitle")}</AlertTitle>
				<AlertDescription className="flex flex-col items-start gap-4">
					<p>{t(locale, "accessRefreshBody")}</p>
					<Button onClick={() => window.location.reload()}>
						<RefreshCwIcon data-icon="inline-start" />
						{t(locale, "retry")}
					</Button>
				</AlertDescription>
			</Alert>
		);
	}

	if (access.reason === "signed-out") {
		return (
			<Alert>
				<UserRoundIcon />
				<AlertTitle>{t(locale, "signInToContinueTitle")}</AlertTitle>
				<AlertDescription className="flex flex-col items-start gap-4">
					<p>{t(locale, "signInToContinueBody")}</p>
					{clerkIsConfigured ? (
						<div className="flex flex-wrap gap-2">
							<SignInButton mode="modal">
								<Button variant="outline">{t(locale, "signIn")}</Button>
							</SignInButton>
							<SignUpButton mode="modal">
								<Button>{t(locale, "signUp")}</Button>
							</SignUpButton>
						</div>
					) : (
						<Button disabled>{t(locale, "clerkNotConfigured")}</Button>
					)}
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<Alert>
			<LockKeyholeIcon />
			<AlertTitle>{t(locale, "membershipLessonTitle")}</AlertTitle>
			<AlertDescription className="flex flex-col items-start gap-4">
				<p>{t(locale, "membershipLessonBody")}</p>
				<Link to="/pricing" className={buttonVariants()}>
					{t(locale, "viewMembership")}
				</Link>
			</AlertDescription>
		</Alert>
	);
}
