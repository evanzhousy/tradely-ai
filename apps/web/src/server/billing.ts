import { createServerFn } from "@tanstack/react-start";

export const getPlanSummary = createServerFn({ method: "GET" }).handler(
	async () => {
		const { getPlanSummaryImpl } = await import("./billing.server");
		return getPlanSummaryImpl();
	},
);

export const beginCheckout = createServerFn({ method: "POST" }).handler(
	async () => {
		const { beginCheckoutImpl } = await import("./billing.server");
		return beginCheckoutImpl();
	},
);

export const openCustomerPortal = createServerFn({ method: "POST" }).handler(
	async () => {
		const { openCustomerPortalImpl } = await import("./billing.server");
		return openCustomerPortalImpl();
	},
);
