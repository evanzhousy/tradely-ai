import { z } from "zod";

const checkoutResultSchema = z.enum([
	"success",
	"cancel",
	"membership-success",
	"membership-cancel",
	"lifetime-success",
	"lifetime-cancel",
]);

const checkoutSessionIdSchema = z.string().startsWith("cs_").max(200);

export type PricingCheckoutResult = z.infer<typeof checkoutResultSchema>;

export type PricingSearch = {
	checkout?: PricingCheckoutResult;
	session_id?: string;
};

export function parsePricingSearch(
	search: Record<string, unknown>,
): PricingSearch {
	const checkout = checkoutResultSchema.safeParse(search.checkout);
	const sessionId = checkoutSessionIdSchema.safeParse(search.session_id);
	return {
		checkout: checkout.success ? checkout.data : undefined,
		session_id: sessionId.success ? sessionId.data : undefined,
	};
}
