import { useServerFn } from "@tanstack/react-start";
import { Button } from "@tradely/ui/components/button";
import { ArrowRightIcon, CreditCardIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { beginCheckout, openCustomerPortal } from "@/server/billing";

export function PricingActions({ configured }: { configured: boolean }) {
	const checkout = useServerFn(beginCheckout);
	const portal = useServerFn(openCustomerPortal);
	const [pending, setPending] = useState<"checkout" | "portal" | null>(null);

	const navigate = async (kind: "checkout" | "portal") => {
		setPending(kind);
		try {
			const result = kind === "checkout" ? await checkout() : await portal();
			window.location.assign(result.url);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Billing is unavailable",
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
				{pending === "checkout" ? "Opening checkout…" : "Unlock the curriculum"}
				<ArrowRightIcon data-icon="inline-end" />
			</Button>
			<Button
				variant="outline"
				disabled={!configured || pending !== null}
				onClick={() => void navigate("portal")}
			>
				<CreditCardIcon data-icon="inline-start" />
				Manage billing
			</Button>
		</div>
	);
}
