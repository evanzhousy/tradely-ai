import "@tanstack/react-start/server-only";

import { env } from "@tradely/env/server";
import Stripe from "stripe";

import { isExpectedBillingError } from "@/analytics/redaction";
import type { BillingState } from "@/domain/billing";
import {
	COURSE_PASS_ENTITLEMENT,
	checkoutSessionGrantsCoursePass,
	subscriptionGrantsCourse,
} from "@/domain/billing";
import { captureServerException } from "./analytics/posthog.server";
import { getCurrentIdentity, getCurrentUserId } from "./auth.server";
import {
	ensureAppUser,
	findAppUser,
	grantCoursePass,
	hasActiveCoursePass,
	hasManualAllAccess,
} from "./users.server";

function stripeClient(): Stripe {
	if (!env.STRIPE_API_KEY) throw new Error("Stripe is not configured");
	return new Stripe(env.STRIPE_API_KEY, { apiVersion: "2026-07-29.dahlia" });
}

function checkoutBaseUrl(): string {
	if (env.VERCEL_ENV === "preview") {
		const hostname = env.VERCEL_URL?.trim().toLowerCase();
		if (!hostname?.endsWith(".vercel.app")) {
			throw new Error("Vercel Preview URL is not configured for billing");
		}
		const previewUrl = new URL(`https://${hostname}`);
		if (
			previewUrl.hostname !== hostname ||
			previewUrl.origin !== `https://${hostname}`
		) {
			throw new Error("Vercel Preview URL is invalid for billing");
		}
		return previewUrl.origin;
	}
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

function stripeObjectId(value: string | { id: string } | null): string | null {
	if (!value) return null;
	return typeof value === "string" ? value : value.id;
}

export async function getStripeBillingState(
	stripeCustomerId: string | null,
): Promise<BillingState> {
	if (!env.STRIPE_API_KEY || !env.STRIPE_MEMBERSHIP_PRICE_ID)
		return "unavailable";
	if (!stripeCustomerId) return "inactive";
	try {
		const stripe = stripeClient();
		for (const status of ["active", "trialing"] as const) {
			let startingAfter: string | undefined;
			for (;;) {
				const subscriptions = await stripe.subscriptions.list({
					customer: stripeCustomerId,
					status,
					limit: 100,
					...(startingAfter ? { starting_after: startingAfter } : {}),
				});
				if (
					subscriptions.data.some((subscription) =>
						subscriptionGrantsCourse({
							status: subscription.status,
							priceIds: subscription.items.data.map((item) => item.price.id),
							expectedPriceId: env.STRIPE_MEMBERSHIP_PRICE_ID as string,
						}),
					)
				) {
					return "active";
				}
				if (!subscriptions.has_more) break;
				const lastSubscription = subscriptions.data.at(-1);
				if (!lastSubscription) {
					throw new Error(
						"Stripe returned an empty subscription page with more data",
					);
				}
				startingAfter = lastSubscription.id;
			}
		}
		return "inactive";
	} catch (error) {
		await captureServerException(error, {
			source: "billing",
			operation: "subscription_status",
		});
		return "unavailable";
	}
}

export async function getOffersSummaryImpl() {
	return {
		salesRetired: true as const,
		coursePassRecoveryConfigured: Boolean(
			env.STRIPE_API_KEY && env.STRIPE_COURSE_PASS_PRICE_ID,
		),
	};
}

export async function getPricingAccessImpl() {
	const userId = await getCurrentUserId();
	if (!userId) {
		return {
			isSignedIn: false as const,
			billingState: "inactive" as const,
			hasCoursePass: false,
			hasManualGrant: false,
			hasStripeCustomer: false,
		};
	}
	try {
		const user = await findAppUser(userId);
		const billingState = await getStripeBillingState(
			user?.stripeCustomerId ?? null,
		);
		return {
			isSignedIn: true as const,
			billingState,
			hasCoursePass: hasActiveCoursePass(user),
			hasManualGrant: hasManualAllAccess(user),
			hasStripeCustomer: Boolean(user?.stripeCustomerId),
		};
	} catch (error) {
		await captureServerException(error, {
			source: "billing",
			operation: "pricing_access",
			userId,
		});
		return {
			isSignedIn: true as const,
			billingState: "unavailable" as const,
			hasCoursePass: false,
			hasManualGrant: false,
			hasStripeCustomer: false,
		};
	}
}

// Compatibility entry points reject even when old deployments' flags are still set.
export async function beginMembershipCheckoutImpl() {
	return { retired: true as const, reason: "sales_retired" as const };
}
export async function beginCoursePassCheckoutImpl() {
	return { retired: true as const, reason: "sales_retired" as const };
}

async function coursePassSessionMatchesUser(
	session: Stripe.Checkout.Session,
	input: {
		userId: string;
		stripeCustomerId: string;
		priceId: string;
	},
): Promise<boolean> {
	if (
		session.mode !== "payment" ||
		session.status !== "complete" ||
		session.payment_status !== "paid" ||
		stripeObjectId(session.customer) !== input.stripeCustomerId ||
		session.client_reference_id !== input.userId ||
		session.metadata?.tradely_user_id !== input.userId ||
		session.metadata?.tradely_entitlement !== COURSE_PASS_ENTITLEMENT
	) {
		return false;
	}
	const lineItems = await stripeClient().checkout.sessions.listLineItems(
		session.id,
		{ limit: 100 },
	);
	return checkoutSessionGrantsCoursePass({
		mode: session.mode,
		status: session.status,
		paymentStatus: session.payment_status,
		customerId: stripeObjectId(session.customer),
		expectedCustomerId: input.stripeCustomerId,
		clientReferenceId: session.client_reference_id,
		expectedUserId: input.userId,
		metadataUserId: session.metadata?.tradely_user_id ?? null,
		priceIds: lineItems.data.flatMap((item) =>
			item.price ? [item.price.id] : [],
		),
		expectedPriceId: input.priceId,
		entitlement: session.metadata?.tradely_entitlement ?? null,
	});
}

async function currentCoursePassIdentity() {
	if (!env.STRIPE_COURSE_PASS_PRICE_ID) {
		throw new Error("Lifetime course checkout is unavailable");
	}
	const identity = await getCurrentIdentity();
	if (!identity) throw new Error("Sign in to verify lifetime access");
	const user = await ensureAppUser(identity.userId);
	if (!user.stripeCustomerId) {
		throw new Error("No Stripe customer is linked to this account");
	}
	return {
		identity,
		user,
		priceId: env.STRIPE_COURSE_PASS_PRICE_ID,
		stripeCustomerId: user.stripeCustomerId,
	};
}

async function verifyCoursePassSession(sessionId: string) {
	const current = await currentCoursePassIdentity();
	const session = await stripeClient().checkout.sessions.retrieve(sessionId);
	const valid = await coursePassSessionMatchesUser(session, {
		userId: current.identity.userId,
		stripeCustomerId: current.stripeCustomerId,
		priceId: current.priceId,
	});
	if (!valid) {
		throw new Error("Course pass purchase could not be verified");
	}
	if (
		current.user.coursePassRevokedAt &&
		current.user.stripeCoursePassCheckoutSessionId === session.id
	) {
		throw new Error("This course pass purchase has been revoked");
	}
	await grantCoursePass(current.identity.userId, session.id);
	return {
		verified: true as const,
		courseId: "tradingflow-foundations" as const,
	};
}

export async function verifyCoursePassCheckoutImpl(sessionId: string) {
	try {
		return {
			...(await verifyCoursePassSession(sessionId)),
			source: "checkout_return" as const,
		};
	} catch (error) {
		if (!isExpectedBillingError(error)) {
			await captureServerException(error, {
				source: "billing",
				operation: "verify_course_pass_checkout",
				action: "checkout",
			});
		}
		throw error;
	}
}

export async function restoreCoursePassImpl() {
	try {
		const current = await currentCoursePassIdentity();
		if (hasActiveCoursePass(current.user)) {
			return {
				verified: true as const,
				courseId: "tradingflow-foundations" as const,
				source: "existing" as const,
			};
		}
		const stripe = stripeClient();
		let startingAfter: string | undefined;
		for (;;) {
			const sessions = await stripe.checkout.sessions.list({
				customer: current.stripeCustomerId,
				status: "complete",
				limit: 100,
				...(startingAfter ? { starting_after: startingAfter } : {}),
			});
			for (const session of sessions.data) {
				if (
					current.user.coursePassRevokedAt &&
					current.user.stripeCoursePassCheckoutSessionId === session.id
				) {
					continue;
				}
				if (
					await coursePassSessionMatchesUser(session, {
						userId: current.identity.userId,
						stripeCustomerId: current.stripeCustomerId,
						priceId: current.priceId,
					})
				) {
					await grantCoursePass(current.identity.userId, session.id);
					return {
						verified: true as const,
						courseId: "tradingflow-foundations" as const,
						source: "restore" as const,
					};
				}
			}
			if (!sessions.has_more) break;
			const lastSession = sessions.data.at(-1);
			if (!lastSession) {
				throw new Error(
					"Stripe returned an empty Checkout Session page with more data",
				);
			}
			startingAfter = lastSession.id;
		}
		throw new Error("No verified lifetime purchase was found");
	} catch (error) {
		if (!isExpectedBillingError(error)) {
			await captureServerException(error, {
				source: "billing",
				operation: "restore_course_pass",
				action: "checkout",
			});
		}
		throw error;
	}
}

async function openCustomerPortalCore() {
	const appUrl = checkoutBaseUrl();
	const userId = await getCurrentUserId();
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

export async function openCustomerPortalImpl() {
	try {
		return await openCustomerPortalCore();
	} catch (error) {
		if (!isExpectedBillingError(error)) {
			await captureServerException(error, {
				source: "billing",
				operation: "open_customer_portal",
				action: "portal",
			});
		}
		throw error;
	}
}
