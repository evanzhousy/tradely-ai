import { Link } from "@tanstack/react-router";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { Button, buttonVariants } from "@tradely/ui/components/button";
import { LockKeyholeIcon, RefreshCwIcon, UserRoundIcon } from "lucide-react";
import { useBillingStatusAnalytics } from "@/analytics/billing-status";
import { useAnalytics } from "@/analytics/context";
import { authIsConfigured } from "@/auth/client";
import type { LessonAccessDecision } from "@/domain/access";
import { useI18n } from "@/i18n/provider";
import { SignInLink } from "./sign-in-link";

export function AccessPanel({
	access,
	lessonId,
}: {
	access: Extract<LessonAccessDecision, { allowed: false }>;
	lessonId?: string;
}) {
	const { t } = useI18n();
	const { capture } = useAnalytics();
	useBillingStatusAnalytics(
		access.reason === "billing-unavailable",
		"lesson_access",
	);
	if (access.reason === "billing-unavailable") {
		return (
			<Alert className="access-panel">
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
			<Alert className="access-panel">
				<UserRoundIcon aria-hidden="true" />
				<AlertTitle>{t("access.signInTitle")}</AlertTitle>
				<AlertDescription className="flex flex-col items-start gap-4">
					<p>{t("access.signInDescription")}</p>
					{authIsConfigured ? (
						<SignInLink
							onClick={() =>
								capture("auth_sign_in_opened", {
									surface: "lesson_access",
								})
							}
						>
							{t("auth.signIn")}
						</SignInLink>
					) : (
						<Button disabled>{t("access.authUnavailable")}</Button>
					)}
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<Alert className="access-panel">
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
