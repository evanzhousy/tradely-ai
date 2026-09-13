import { describe, expect, it } from "vitest";

import {
	buildBillingPreflightChecks,
	parseBillingPreflightArgs,
} from "./billing-preflight";

const snapshot = {
	environment: "test" as const,
	stage: "retired" as const,
	configSource: "apps/web/.env" as const,
	config: {
		accountId: "acct_tradely",
		appUrl: "http://localhost:8250",
		keyKind: "secret-test",
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
		active: false,
		currency: "usd",
		unitAmount: 6900,
		interval: "month",
		product: {
			active: false,
			name: "Tradely Membership",
			metadata: { tradely_offer: "membership" },
		},
	},
	coursePass: {
		id: "price_course",
		livemode: false,
		active: false,
		currency: "usd",
		unitAmount: 4900,
		interval: null,
		product: {
			active: false,
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

describe("retired billing checks", () => {
	it("accepts only retirement checks, without requiring a new purchase", () => {
		expect(
			parseBillingPreflightArgs([
				"--environment",
				"test",
				"--stage",
				"retired",
			]),
		).toEqual({ environment: "test", stage: "retired" });
		expect(() =>
			parseBillingPreflightArgs(["--environment", "test", "--stage", "launch"]),
		).toThrow(/retired/);
	});
	it("validates archived exact owned Prices", () => {
		expect(
			buildBillingPreflightChecks(snapshot).filter((c) => !c.pass),
		).toEqual([]);
	});
	it("rejects active external sales and wrong ownership", () => {
		const checks = buildBillingPreflightChecks({
			...snapshot,
			account: { ...snapshot.account, id: "acct_else" },
			membership: {
				...snapshot.membership,
				active: true,
				product: {
					...snapshot.membership.product,
					metadata: { tradely_offer: "else" },
				},
			},
		});
		expect(checks.filter((c) => !c.pass).map((c) => c.name)).toEqual([
			"config.account_id",
			"membership.retired",
			"membership.offer_metadata",
		]);
	});
	it("rejects live key and account mode mismatches", () => {
		const checks = buildBillingPreflightChecks({
			...snapshot,
			environment: "production",
			configSource: "injected",
		});
		expect(checks.find((c) => c.name === "config.key_environment")?.pass).toBe(
			false,
		);
		expect(checks.find((c) => c.name === "membership.livemode")?.pass).toBe(
			false,
		);
	});
});
