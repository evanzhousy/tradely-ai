import { SignInButton } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { Button, buttonVariants } from "@tradely/ui/components/button";
import { LockKeyholeIcon, RefreshCwIcon, UserRoundIcon } from "lucide-react";

import type { LessonAccessDecision } from "@/domain/access";
import { useI18n } from "@/i18n/provider";
import { clerkIsConfigured } from "./app-providers";

export function AccessPanel({
	access,
}: {
	access: Extract<LessonAccessDecision, { allowed: false }>;
}) {
	const { t } = useI18n();
	if (access.reason === "billing-unavailable") {
		return (
			<Alert>
				<RefreshCwIcon aria-hidden="true" />
				<AlertTitle>{t("access.refreshTitle")}</AlertTitle>
				<AlertDescription className="flex flex-col items-start gap-4">
					<p>{t("access.refreshDescription")}</p>
					<Button onClick={() => window.location.reload()}>
						<RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
						{t("common.retry")}
					</Button>
				</AlertDescription>
			</Alert>
		);
	}

	if (access.reason === "signed-out") {
		return (
			<Alert>
				<UserRoundIcon aria-hidden="true" />
				<AlertTitle>{t("access.signInTitle")}</AlertTitle>
				<AlertDescription className="flex flex-col items-start gap-4">
					<p>{t("access.signInDescription")}</p>
					{clerkIsConfigured ? (
						<SignInButton mode="modal">
							<Button>{t("auth.signIn")}</Button>
						</SignInButton>
					) : (
						<Button disabled>{t("access.clerkUnavailable")}</Button>
					)}
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<Alert>
			<LockKeyholeIcon aria-hidden="true" />
			<AlertTitle>{t("access.membershipTitle")}</AlertTitle>
			<AlertDescription className="flex flex-col items-start gap-4">
				<p>{t("access.membershipDescription")}</p>
				<Link to="/pricing" className={buttonVariants()}>
					{t("access.viewMembership")}
				</Link>
			</AlertDescription>
		</Alert>
	);
}
