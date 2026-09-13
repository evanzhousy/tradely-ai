import { BILLING_CONTRACT } from "./billing";

export type BillingEnvironment = "test" | "production";
export type BillingStage = "retired";

export type PreflightArgs = {
	environment: BillingEnvironment;
	stage: BillingStage;
	checkoutSessionId?: string;
};

export type PriceSnapshot = {
	id: string;
	livemode: boolean;
	active: boolean;
	currency: string;
	unitAmount: number | null;
	interval: string | null;
	product: {
		active: boolean;
		name: string;
		metadata: Record<string, string>;
	} | null;
};

export type BillingPreflightSnapshot = {
	environment: BillingEnvironment;
	stage: BillingStage;
	configSource: "injected" | "apps/web/.env";
	config: {
		accountId: string;
		appUrl: string;
		keyKind: string;
		membershipPriceId: string;
		coursePassPriceId: string;
	};
	account: {
		id: string;
		businessProfileName: string | null;
		dashboardDisplayName: string | null;
		chargesEnabled: boolean;
		detailsSubmitted: boolean;
		primaryColor: string | null;
		secondaryColor: string | null;
		hasIcon: boolean;
		statementDescriptor: string | null;
		statementDescriptorPrefix: string | null;
	};
	membership: PriceSnapshot;
	coursePass: PriceSnapshot;
	session?: {
		id: string;
		livemode: boolean;
		brandingDisplayName: string | null;
		priceIds: string[];
	};
};

export type PreflightCheck = {
	name: string;
	pass: boolean;
	detail: string;
};

function nextValue(argv: string[], index: number, flag: string): string {
	const value = argv[index + 1];
	if (!value || value.startsWith("--")) {
		throw new Error(`${flag} requires a value`);
	}
	return value;
}

export function parseBillingPreflightArgs(
	argv: string[],
): PreflightArgs | null {
	const input: Partial<PreflightArgs> = {};
	for (let index = 0; index < argv.length; index += 1) {
		const flag = argv[index];
		switch (flag) {
			case "--":
				break;
			case "--help":
			case "-h":
				return null;
			case "--environment":
				input.environment = nextValue(argv, index, flag) as BillingEnvironment;
				index += 1;
				break;
			case "--stage":
				input.stage = nextValue(argv, index, flag) as BillingStage;
				index += 1;
				break;
			case "--checkout-session-id":
				input.checkoutSessionId = nextValue(argv, index, flag);
				index += 1;
				break;
			default:
				throw new Error(`Unknown argument: ${flag}`);
		}
	}

	if (!new Set(["test", "production"]).has(input.environment ?? "")) {
		throw new Error("--environment must be test or production");
	}
	if (input.stage !== "retired")
		throw new Error("New sales are retired; use --stage retired");
	if (input.checkoutSessionId) {
		const prefix = input.environment === "production" ? "cs_live_" : "cs_test_";
		if (!input.checkoutSessionId.startsWith(prefix)) {
			throw new Error(
				`Checkout Session does not match the ${input.environment} environment`,
			);
		}
	}
	return input as PreflightArgs;
}

function check(name: string, pass: boolean, detail: string): PreflightCheck {
	return { name, pass, detail };
}

/** Historical billing recovery checks; this cannot certify subscription cancellation. */
export function buildBillingPreflightChecks(
	snapshot: BillingPreflightSnapshot,
): PreflightCheck[] {
	const live = snapshot.environment === "production";
	const checks = [
		check(
			"sales.retired",
			BILLING_CONTRACT.salesRetired,
			"New application checkouts are permanently retired",
		),
		check(
			"config.production_source",
			!live || snapshot.configSource === "injected",
			snapshot.configSource,
		),
		check(
			"config.account_id",
			snapshot.config.accountId === snapshot.account.id,
			"Expected Stripe account",
		),
		check(
			"config.key_environment",
			snapshot.config.keyKind.endsWith(snapshot.environment),
			snapshot.config.keyKind,
		),
		check(
			"config.restricted_live_key",
			!live || snapshot.config.keyKind === "restricted-production",
			"Restricted live credential required",
		),
	];
	for (const [name, price, expectedId, offer] of [
		[
			"membership",
			snapshot.membership,
			snapshot.config.membershipPriceId,
			"membership",
		],
		[
			"course_pass",
			snapshot.coursePass,
			snapshot.config.coursePassPriceId,
			"course_pass",
		],
	] as const) {
		checks.push(
			check(
				`${name}.price_id`,
				price.id === expectedId,
				"Exact historical Price",
			),
			check(
				`${name}.livemode`,
				price.livemode === live,
				"Matching Stripe mode",
			),
			check(
				`${name}.retired`,
				!price.active,
				"Price must be archived to close external sales paths",
			),
			check(
				`${name}.offer_metadata`,
				price.product?.metadata.tradely_offer === offer,
				"Tradely-owned Product",
			),
		);
	}
	if (snapshot.session)
		checks.push(
			check(
				"checkout.livemode",
				snapshot.session.livemode === live,
				"Matching Stripe mode",
			),
			check(
				"checkout.exact_price",
				snapshot.session.priceIds.length === 1 &&
					[
						snapshot.config.membershipPriceId,
						snapshot.config.coursePassPriceId,
					].includes(snapshot.session.priceIds[0]),
				"Exact historical Price",
			),
		);
	return checks;
}
