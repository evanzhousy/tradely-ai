import { SignInButton } from "@clerk/tanstack-react-start";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@tradely/ui/components/button";
import {
	ArrowRightIcon,
	CheckIcon,
	CreditCardIcon,
	RefreshCwIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAnalytics } from "@/analytics/context";
import {
	type BillingOffer,
	billingActionFailureReason,
} from "@/analytics/events";
import { useI18n } from "@/i18n/provider";
import {
	beginCoursePassCheckout,
	beginMembershipCheckout,
	openCustomerPortal,
	restoreCoursePass,
} from "@/server/billing";
import { clerkIsConfigured } from "./app-providers";

export function PricingCheckoutButton({
	offer,
	configured,
	active,
	isSignedIn,
}: {
	offer: BillingOffer;
	configured: boolean;
	active: boolean;
	isSignedIn: boolean;
}) {
	const membershipCheckout = useServerFn(beginMembershipCheckout);
	const coursePassCheckout = useServerFn(beginCoursePassCheckout);
	const { t } = useI18n();
	const { capture, captureException } = useAnalytics();
	const [pending, setPending] = useState(false);

	const checkout = async () => {
		setPending(true);
		capture("billing_action_started", { action: "checkout", offer });
		try {
			const result =
				offer === "membership"
					? await membershipCheckout()
					: await coursePassCheckout();
			capture("billing_action_redirected", { action: "checkout", offer });
			window.location.assign(result.url);
		} catch (error) {
			const reason = billingActionFailureReason(error);
			capture("billing_action_failed", {
				action: "checkout",
				offer,
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
			setPending(false);
		}
	};

	const contents = (
		<>
			{active ? (
				<CheckIcon data-icon="inline-start" aria-hidden="true" />
			) : null}
			{active
				? offer === "membership"
					? t("pricing.membershipActive")
					: t("pricing.coursePassActive")
				: pending
					? offer === "membership"
						? t("pricing.openingCheckout")
						: t("pricing.openingCoursePass")
					: offer === "membership"
						? t("pricing.unlock")
						: t("pricing.buyCoursePass")}
			{!active ? (
				<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
			) : null}
		</>
	);
	if (!isSignedIn && !active && clerkIsConfigured) {
		return (
			<SignInButton mode="modal">
				<Button
					disabled={!configured}
					onClick={() => capture("auth_sign_in_opened", { surface: "pricing" })}
				>
					{contents}
				</Button>
			</SignInButton>
		);
	}
	return (
		<Button
			disabled={!configured || active || pending || !clerkIsConfigured}
			onClick={() => void checkout()}
		>
			{contents}
		</Button>
	);
}

export function PricingAccountActions({
	canManageBilling,
	canRestoreCoursePass,
	onAccessChanged,
}: {
	canManageBilling: boolean;
	canRestoreCoursePass: boolean;
	onAccessChanged: () => void;
}) {
	const portal = useServerFn(openCustomerPortal);
	const restore = useServerFn(restoreCoursePass);
	const { t } = useI18n();
	const { capture, captureException } = useAnalytics();
	const [pending, setPending] = useState<"portal" | "restore" | null>(null);

	if (!canManageBilling && !canRestoreCoursePass) return null;

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
			onAccessChanged();
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
