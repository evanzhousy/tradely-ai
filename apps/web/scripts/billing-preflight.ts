import { fileURLToPath, pathToFileURL } from "node:url";

import { config as loadEnv } from "dotenv";
import Stripe from "stripe";

import {
	type BillingPreflightSnapshot,
	buildBillingPreflightChecks,
	type PriceSnapshot,
	parseBillingPreflightArgs,
} from "../src/domain/billing-preflight";

const HELP = `Usage:
  pnpm billing:preflight -- \\
    --environment <test|production> \\
    --stage <acceptance|deploy-disabled|launch> \\
    [--checkout-session-id <cs_test_...|cs_live_...>]

Stages:
  acceptance      Test environment with lifetime checkout enabled and a Session proof
  deploy-disabled Production configuration with lifetime checkout disabled
  launch          Production configuration with lifetime checkout enabled and a Session proof
`;

function keyKind(key: string): string {
	if (key.startsWith("rk_test_")) return "restricted-test";
	if (key.startsWith("sk_test_")) return "secret-test";
	if (key.startsWith("rk_live_")) return "restricted-production";
	if (key.startsWith("sk_live_")) return "secret-production";
	return "unknown";
}

function priceSnapshot(price: Stripe.Price): PriceSnapshot {
	const product =
		typeof price.product === "object" && !price.product.deleted
			? price.product
			: null;
	return {
		id: price.id,
		livemode: price.livemode,
		active: price.active,
		currency: price.currency,
		unitAmount: price.unit_amount,
		interval: price.recurring?.interval ?? null,
		product: product
			? {
					active: product.active,
					name: product.name,
					metadata: product.metadata,
				}
			: null,
	};
}

function requiredEnv(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) throw new Error(`${name} is required`);
	return value;
}

async function runBillingPreflight(argv: string[]): Promise<void> {
	const args = parseBillingPreflightArgs(argv);
	if (!args) {
		console.log(HELP);
		return;
	}
	const hadInjectedKey = Boolean(process.env.STRIPE_API_KEY);
	if (!hadInjectedKey) {
		loadEnv({
			path: fileURLToPath(new URL("../.env", import.meta.url)),
			quiet: true,
		});
	}
	const apiKey = requiredEnv("STRIPE_API_KEY");
	const accountId = requiredEnv("STRIPE_ACCOUNT_ID");
	const membershipPriceId = requiredEnv("STRIPE_MEMBERSHIP_PRICE_ID");
	const coursePassPriceId = requiredEnv("STRIPE_COURSE_PASS_PRICE_ID");
	const appUrl = requiredEnv("APP_URL");
	const lifetimeFlag = requiredEnv("LIFETIME_CHECKOUT_ENABLED");
	if (!new Set(["true", "false"]).has(lifetimeFlag)) {
		throw new Error("LIFETIME_CHECKOUT_ENABLED must be true or false");
	}
	const stripe = new Stripe(apiKey, { apiVersion: "2026-07-29.dahlia" });
	const [account, membershipPrice, coursePassPrice, session] =
		await Promise.all([
			stripe.accounts.retrieve(accountId),
			stripe.prices.retrieve(membershipPriceId, { expand: ["product"] }),
			stripe.prices.retrieve(coursePassPriceId, { expand: ["product"] }),
			args.checkoutSessionId
				? stripe.checkout.sessions.retrieve(args.checkoutSessionId, {
						expand: ["line_items"],
					})
				: Promise.resolve(null),
		]);
	const snapshot: BillingPreflightSnapshot = {
		environment: args.environment,
		stage: args.stage,
		configSource: hadInjectedKey ? "injected" : "apps/web/.env",
		config: {
			accountId,
			appUrl,
			keyKind: keyKind(apiKey),
			lifetimeCheckoutEnabled: lifetimeFlag === "true",
			membershipPriceId,
			coursePassPriceId,
		},
		account: {
			id: account.id,
			businessProfileName: account.business_profile?.name ?? null,
			dashboardDisplayName: account.settings?.dashboard?.display_name ?? null,
			chargesEnabled: account.charges_enabled,
			detailsSubmitted: account.details_submitted,
			primaryColor: account.settings?.branding?.primary_color ?? null,
			secondaryColor: account.settings?.branding?.secondary_color ?? null,
			hasIcon: Boolean(account.settings?.branding?.icon),
			statementDescriptor:
				account.settings?.payments?.statement_descriptor ?? null,
			statementDescriptorPrefix:
				account.settings?.card_payments?.statement_descriptor_prefix ?? null,
		},
		membership: priceSnapshot(membershipPrice),
		coursePass: priceSnapshot(coursePassPrice),
		...(session
			? {
					session: {
						id: session.id,
						livemode: session.livemode,
						brandingDisplayName:
							session.branding_settings?.display_name ?? null,
						priceIds:
							session.line_items?.data.flatMap((item) =>
								item.price ? [item.price.id] : [],
							) ?? [],
					},
				}
			: {}),
	};
	const checks = buildBillingPreflightChecks(snapshot);
	const ready = checks.every((item) => item.pass);
	console.log(
		JSON.stringify(
			{
				operation: "billing.preflight",
				environment: args.environment,
				stage: args.stage,
				ready,
				configSource: snapshot.configSource,
				account: {
					idSuffix: account.id.slice(-8),
					displayName:
						account.business_profile?.name ??
						account.settings?.dashboard?.display_name ??
						null,
				},
				prices: {
					membershipSuffix: membershipPrice.id.slice(-8),
					coursePassSuffix: coursePassPrice.id.slice(-8),
				},
				checkoutSessionSuffix: session?.id.slice(-8) ?? null,
				checks,
			},
			null,
			2,
		),
	);
	if (!ready) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	runBillingPreflight(process.argv.slice(2)).catch((error) => {
		console.error(error instanceof Error ? error.message : String(error));
		process.exitCode = 1;
	});
}
