import "@tanstack/react-start/server-only";

import { createHash } from "node:crypto";

import { env } from "@tradely/env/server";
import Stripe from "stripe";

import type { BillingState } from "@/domain/access";
import { subscriptionGrantsCourse } from "@/domain/billing";
import { getCurrentClerkIdentity, getCurrentClerkUserId } from "./auth.server";
import {
	ensureAppUser,
	findAppUser,
	updateStripeCustomerId,
} from "./users.server";

function stripeClient(): Stripe {
	if (!env.STRIPE_API_KEY) throw new Error("Stripe is not configured");
	return new Stripe(env.STRIPE_API_KEY, { apiVersion: "2026-07-29.dahlia" });
}

function checkoutBaseUrl(): string {
	const url = new URL(env.APP_URL);
	if (
		env.NODE_ENV === "production" &&
		(url.hostname === "localhost" || url.hostname === "127.0.0.1")
	) {
		throw new Error(
			"APP_URL must be the production Tradely origin before billing is enabled",
		);
	}
	return url.origin;
}

export async function getStripeBillingState(
	stripeCustomerId: string | null,
): Promise<BillingState> {
	if (!env.STRIPE_API_KEY || !env.STRIPE_PRICE_ID) return "unavailable";
	if (!stripeCustomerId) return "inactive";
	try {
		const subscriptions = await stripeClient().subscriptions.list({
			customer: stripeCustomerId,
			status: "all",
			limit: 10,
		});
		return subscriptions.data.some((subscription) =>
			subscriptionGrantsCourse({
				status: subscription.status,
				priceIds: subscription.items.data.map((item) => item.price.id),
				expectedPriceId: env.STRIPE_PRICE_ID as string,
			}),
		)
			? "active"
			: "inactive";
	} catch {
		return "unavailable";
	}
}

async function ensureStripeCustomer(): Promise<{
	clerkUserId: string;
	stripeCustomerId: string;
}> {
	const identity = await getCurrentClerkIdentity();
	if (!identity) throw new Error("Sign in before starting checkout");
	const user = await ensureAppUser(identity.userId);
	if (user.stripeCustomerId) {
		return {
			clerkUserId: identity.userId,
			stripeCustomerId: user.stripeCustomerId,
		};
	}
	const userKey = createHash("sha256")
		.update(identity.userId)
		.digest("hex")
		.slice(0, 24);
	const customer = await stripeClient().customers.create(
		{
			email: identity.email ?? undefined,
			metadata: { tradely_clerk_user_id: identity.userId },
		},
		{ idempotencyKey: `tradely-customer-${userKey}` },
	);
	await updateStripeCustomerId(identity.userId, customer.id);
	return { clerkUserId: identity.userId, stripeCustomerId: customer.id };
}

export async function getPlanSummaryImpl() {
	if (!env.STRIPE_API_KEY || !env.STRIPE_PRICE_ID) {
		return { configured: false as const };
	}
	try {
		const price = await stripeClient().prices.retrieve(env.STRIPE_PRICE_ID, {
			expand: ["product"],
		});
		return {
			configured: true as const,
			currency: price.currency,
			unitAmount: price.unit_amount,
			interval: price.recurring?.interval ?? null,
			productName:
				typeof price.product === "string" || price.product.deleted
					? "Tradely membership"
					: price.product.name,
		};
	} catch {
		return { configured: false as const };
	}
}

export async function beginCheckoutImpl() {
	if (!env.STRIPE_PRICE_ID) throw new Error("Stripe price is not configured");
	const appUrl = checkoutBaseUrl();
	const { clerkUserId, stripeCustomerId } = await ensureStripeCustomer();
	const billingState = await getStripeBillingState(stripeCustomerId);
	if (billingState === "active") {
		throw new Error(
			"This membership is already active. Use Manage billing instead.",
		);
	}
	if (billingState === "unavailable") {
		throw new Error(
			"Billing status could not be confirmed. Please retry before checking out.",
		);
	}
	const userKey = createHash("sha256")
		.update(clerkUserId)
		.digest("hex")
		.slice(0, 24);
	const priceKey = createHash("sha256")
		.update(env.STRIPE_PRICE_ID)
		.digest("hex")
		.slice(0, 12);
	const timeBucket = Math.floor(Date.now() / (30 * 60 * 1000));
	const session = await stripeClient().checkout.sessions.create(
		{
			mode: "subscription",
			customer: stripeCustomerId,
			client_reference_id: clerkUserId,
			line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
			success_url: `${appUrl}/pricing?checkout=success`,
			cancel_url: `${appUrl}/pricing?checkout=cancel`,
			subscription_data: {
				metadata: { tradely_clerk_user_id: clerkUserId },
			},
		},
		{ idempotencyKey: `tradely-checkout-${userKey}-${priceKey}-${timeBucket}` },
	);
	if (!session.url) throw new Error("Stripe did not return a checkout URL");
	return { url: session.url };
}

export async function openCustomerPortalImpl() {
	const appUrl = checkoutBaseUrl();
	const userId = await getCurrentClerkUserId();
	if (!userId) throw new Error("Sign in to manage billing");
	const user = await findAppUser(userId);
	if (!user?.stripeCustomerId)
		throw new Error("No Stripe customer is linked to this account");
	const session = await stripeClient().billingPortal.sessions.create({
		customer: user.stripeCustomerId,
		return_url: `${appUrl}/pricing`,
	});
	return { url: session.url };
}
