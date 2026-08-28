import { useServerFn } from "@tanstack/react-start";
import { Button } from "@tradely/ui/components/button";
import { ArrowRightIcon, CreditCardIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAnalytics } from "@/analytics/context";
import { billingActionFailureReason } from "@/analytics/events";
import { useI18n } from "@/i18n/provider";
import { beginCheckout, openCustomerPortal } from "@/server/billing";

export function PricingActions({ configured }: { configured: boolean }) {
	const checkout = useServerFn(beginCheckout);
	const portal = useServerFn(openCustomerPortal);
	const { t } = useI18n();
	const { capture, captureException } = useAnalytics();
	const [pending, setPending] = useState<"checkout" | "portal" | null>(null);

	const navigate = async (kind: "checkout" | "portal") => {
		setPending(kind);
		capture("billing_action_started", { action: kind });
		try {
			const result = kind === "checkout" ? await checkout() : await portal();
			capture("billing_action_redirected", { action: kind });
			window.location.assign(result.url);
		} catch (error) {
			const reason = billingActionFailureReason(error);
			capture("billing_action_failed", {
				action: kind,
				reason,
			});
			if (reason === "unavailable") {
				captureException(error, { source: "billing_action", action: kind });
			}
			toast.error(
				error instanceof Error
					? error.message
					: t("pricing.billingUnavailable"),
			);
			setPending(null);
		}
	};

	return (
		<div className="flex flex-col gap-3 sm:flex-row">
			<Button
				disabled={!configured || pending !== null}
				onClick={() => void navigate("checkout")}
			>
				{pending === "checkout"
					? t("pricing.openingCheckout")
					: t("pricing.unlock")}
				<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
			</Button>
			<Button
				variant="outline"
				disabled={!configured || pending !== null}
				onClick={() => void navigate("portal")}
			>
				<CreditCardIcon data-icon="inline-start" aria-hidden="true" />
				{t("pricing.manageBilling")}
			</Button>
		</div>
	);
}
