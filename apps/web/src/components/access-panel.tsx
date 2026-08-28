import { SignInButton } from "@clerk/tanstack-react-start";
import { Link } from "@tanstack/react-router";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { Button, buttonVariants } from "@tradely/ui/components/button";
import { LockKeyholeIcon, RefreshCwIcon, UserRoundIcon } from "lucide-react";
import { useEffect } from "react";

import { useAnalytics } from "@/analytics/context";
import type { LessonAccessDecision } from "@/domain/access";
import { useI18n } from "@/i18n/provider";
import { clerkIsConfigured } from "./app-providers";

export function AccessPanel({
	access,
	lessonId,
}: {
	access: Extract<LessonAccessDecision, { allowed: false }>;
	lessonId?: string;
}) {
	const { t } = useI18n();
	const { capture } = useAnalytics();
	useEffect(() => {
		if (access.reason === "billing-unavailable") {
			capture("billing_status_unavailable", { surface: "lesson_access" });
		}
	}, [access.reason, capture]);
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
							<Button
								onClick={() =>
									capture("auth_sign_in_opened", {
										surface: "lesson_access",
									})
								}
							>
								{t("auth.signIn")}
							</Button>
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
				<Link
					to="/pricing"
					className={buttonVariants()}
					onClick={() =>
						capture("membership_cta_clicked", {
							surface: "lesson_access",
							lesson_id: lessonId,
						})
					}
				>
					{t("access.viewMembership")}
				</Link>
			</AlertDescription>
		</Alert>
	);
}
