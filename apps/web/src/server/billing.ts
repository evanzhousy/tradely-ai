import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getPricingSummary = createServerFn({ method: "GET" }).handler(
	async () => {
		const { getOffersSummaryImpl, getPricingAccessImpl } = await import(
			"./billing.server"
		);
		const [offers, access] = await Promise.all([
			getOffersSummaryImpl(),
			getPricingAccessImpl(),
		]);
		return { offers, access };
	},
);

export const beginMembershipCheckout = createServerFn({
	method: "POST",
}).handler(async () => {
	const { beginMembershipCheckoutImpl } = await import("./billing.server");
	return beginMembershipCheckoutImpl();
});

export const beginCoursePassCheckout = createServerFn({
	method: "POST",
}).handler(async () => {
	const { beginCoursePassCheckoutImpl } = await import("./billing.server");
	return beginCoursePassCheckoutImpl();
});

export const verifyCoursePassCheckout = createServerFn({ method: "POST" })
	.validator(
		z.object({
			sessionId: z.string().startsWith("cs_").max(200),
		}),
	)
	.handler(async ({ data }) => {
		const { verifyCoursePassCheckoutImpl } = await import("./billing.server");
		return verifyCoursePassCheckoutImpl(data.sessionId);
	});

export const restoreCoursePass = createServerFn({ method: "POST" }).handler(
	async () => {
		const { restoreCoursePassImpl } = await import("./billing.server");
		return restoreCoursePassImpl();
	},
);

export const openCustomerPortal = createServerFn({ method: "POST" }).handler(
	async () => {
		const { openCustomerPortalImpl } = await import("./billing.server");
		return openCustomerPortalImpl();
	},
);
