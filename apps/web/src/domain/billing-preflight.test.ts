import { describe, expect, it } from "vitest";

import {
	buildBillingPreflightChecks,
	parseBillingPreflightArgs,
} from "./billing-preflight";

const snapshot = {
	environment: "test" as const,
	stage: "acceptance" as const,
	configSource: "apps/web/.env" as const,
	config: {
		accountId: "acct_tradely",
		appUrl: "http://localhost:8250",
		keyKind: "secret-test",
		lifetimeCheckoutEnabled: true,
		membershipPriceId: "price_membership",
		coursePassPriceId: "price_course",
	},
	account: {
		id: "acct_tradely",
		businessProfileName: null,
		dashboardDisplayName: "Tradely.ai",
		chargesEnabled: true,
		detailsSubmitted: true,
		primaryColor: "#111111",
		secondaryColor: "#f2c94c",
		hasIcon: true,
		statementDescriptor: "TRADELYAI",
		statementDescriptorPrefix: "TRADELY",
	},
	membership: {
		id: "price_membership",
		livemode: false,
		active: true,
		currency: "usd",
		unitAmount: 990,
		interval: "month",
		product: {
			active: true,
			name: "Tradely Membership",
			metadata: { tradely_offer: "membership" },
		},
	},
	coursePass: {
		id: "price_course",
		livemode: false,
		active: true,
		currency: "usd",
		unitAmount: 4900,
		interval: null,
		product: {
			active: true,
			name: "Evidence-Led Options Research — Lifetime Course Pass",
			metadata: {
				tradely_offer: "course_pass",
				tradely_course_id: "tradingflow-foundations",
			},
		},
	},
	session: {
		id: "cs_test_tradely",
		livemode: false,
		brandingDisplayName: "Tradely.ai",
		priceIds: ["price_course"],
	},
};

describe("billing preflight arguments", () => {
	it("parses test acceptance with a Session proof", () => {
		expect(
			parseBillingPreflightArgs([
				"--environment",
				"test",
				"--stage",
				"acceptance",
				"--checkout-session-id",
				"cs_test_tradely",
			]),
		).toEqual({
			environment: "test",
			stage: "acceptance",
			checkoutSessionId: "cs_test_tradely",
		});
	});

	it("requires a Session proof for launch", () => {
		expect(() =>
			parseBillingPreflightArgs([
				"--environment",
				"production",
				"--stage",
				"launch",
			]),
		).toThrow(/requires --checkout-session-id/);
	});
});

describe("billing preflight checks", () => {
	it("passes the complete test acceptance contract", () => {
		const checks = buildBillingPreflightChecks(snapshot);
		expect(checks.filter((item) => !item.pass)).toEqual([]);
	});

	it("detects a mismatched account and stale Checkout brand", () => {
		const checks = buildBillingPreflightChecks({
			...snapshot,
			account: { ...snapshot.account, id: "acct_shared" },
			session: {
				...snapshot.session,
				brandingDisplayName: "TradingMap AI",
			},
		});
		expect(
			checks.filter((item) => !item.pass).map((item) => item.name),
		).toEqual(["config.account_id", "checkout.brand_name"]);
	});

	it("enforces production source, key, URL, and disabled rollout flag", () => {
		const checks = buildBillingPreflightChecks({
			...snapshot,
			environment: "production",
			stage: "deploy-disabled",
			configSource: "injected",
			config: {
				...snapshot.config,
				appUrl: "https://tradely.ai",
				keyKind: "restricted-production",
				lifetimeCheckoutEnabled: false,
			},
			membership: { ...snapshot.membership, livemode: true },
			coursePass: { ...snapshot.coursePass, livemode: true },
			session: undefined,
		});
		expect(checks.filter((item) => !item.pass)).toEqual([]);
	});
});
