import { useServerFn } from "@tanstack/react-start";
import { Button } from "@tradely/ui/components/button";
import { CheckIcon, CreditCardIcon, RefreshCwIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAnalytics } from "@/analytics/context";
import { billingActionFailureReason } from "@/analytics/events";
import { useI18n } from "@/i18n/provider";
import { openCustomerPortal, restoreCoursePass } from "@/server/billing";

export function PricingAccountActions({
	canManageBilling,
	canRestoreCoursePass,
	showCoursePassStatus,
	onAccessChanged,
}: {
	canManageBilling: boolean;
	canRestoreCoursePass: boolean;
	showCoursePassStatus: boolean;
	onAccessChanged: () => void | Promise<void>;
}) {
	const portal = useServerFn(openCustomerPortal);
	const restore = useServerFn(restoreCoursePass);
	const { t } = useI18n();
	const { capture, captureException } = useAnalytics();
	const [pending, setPending] = useState<"portal" | "restore" | null>(null);

	if (!canManageBilling && !canRestoreCoursePass && !showCoursePassStatus)
		return null;

	const openPortal = async () => {
		setPending("portal");
		capture("billing_action_started", { action: "portal" });
		try {
			const result = await portal();
			capture("billing_action_redirected", { action: "portal" });
			window.location.assign(result.url);
		} catch (error) {
			const reason = billingActionFailureReason(error);
			capture("billing_action_failed", { action: "portal", reason });
			if (reason === "unavailable") {
				captureException(error, { source: "billing_action", action: "portal" });
			}
			toast.error(
				error instanceof Error
					? error.message
					: t("pricing.billingUnavailable"),
			);
			setPending(null);
		}
	};

	const restorePurchase = async () => {
		setPending("restore");
		try {
			const result = await restore();
			capture("course_pass_access_verified", {
				course_id: result.courseId,
				source: result.source,
			});
			toast.success(t("pricing.restoreSuccess"));
			// Access has already been verified. Refresh failures must not turn
			// that successful restore into billing_action_failed.
			try {
				await onAccessChanged();
			} catch (error) {
				captureException(error, {
					source: "billing_action",
					action: "checkout",
				});
			}
		} catch (error) {
			const reason = billingActionFailureReason(error);
			capture("billing_action_failed", {
				action: "checkout",
				offer: "lifetime_course",
				reason,
			});
			if (reason === "unavailable") {
				captureException(error, {
					source: "billing_action",
					action: "checkout",
				});
			}
			toast.error(
				error instanceof Error
					? error.message
					: t("pricing.billingUnavailable"),
			);
		} finally {
			setPending(null);
		}
	};

	return (
		<div className="flex flex-wrap gap-3">
			{showCoursePassStatus ? (
				<div
					className="inline-flex h-9 items-center gap-1.5 rounded-4xl border border-border bg-background px-3 font-medium text-foreground text-sm"
					role="status"
				>
					<CheckIcon data-icon="inline-start" aria-hidden="true" />
					{t("pricing.coursePassActive")}
				</div>
			) : null}
			{canManageBilling ? (
				<Button
					variant="outline"
					disabled={pending !== null}
					onClick={() => void openPortal()}
				>
					<CreditCardIcon data-icon="inline-start" aria-hidden="true" />
					{t("pricing.manageBilling")}
				</Button>
			) : null}
			{canRestoreCoursePass ? (
				<Button
					variant="outline"
					disabled={pending !== null}
					onClick={() => void restorePurchase()}
				>
					<RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
					{pending === "restore"
						? t("pricing.restoringPurchase")
						: t("pricing.restorePurchase")}
				</Button>
			) : null}
		</div>
	);
}
