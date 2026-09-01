import { BILLING_CONTRACT } from "./billing";

export type BillingEnvironment = "test" | "production";
export type BillingStage = "acceptance" | "deploy-disabled" | "launch";

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
		lifetimeCheckoutEnabled: boolean;
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
	if (
		!new Set(["acceptance", "deploy-disabled", "launch"]).has(input.stage ?? "")
	) {
		throw new Error("--stage must be acceptance, deploy-disabled, or launch");
	}
	if (input.environment === "test" && input.stage !== "acceptance") {
		throw new Error("Test preflight requires --stage acceptance");
	}
	if (input.environment === "production" && input.stage === "acceptance") {
		throw new Error("Production preflight cannot use --stage acceptance");
	}
	const proofRequired =
		input.stage === "acceptance" || input.stage === "launch";
	if (proofRequired && !input.checkoutSessionId) {
		throw new Error(`${input.stage} preflight requires --checkout-session-id`);
	}
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

function normalizedBrand(value: string | null): string {
	return value?.trim().toLowerCase().replaceAll(" ", "") ?? "";
}

function productCheck(
	name: string,
	price: PriceSnapshot,
	expected: { name: string; offer: string; courseId?: string },
): PreflightCheck[] {
	return [
		check(
			`${name}.active`,
			price.active && Boolean(price.product?.active),
			"Price and Product must be active",
		),
		check(
			`${name}.product_name`,
			price.product?.name === expected.name,
			price.product?.name ?? "missing",
		),
		check(
			`${name}.offer_metadata`,
			price.product?.metadata.tradely_offer === expected.offer,
			price.product?.metadata.tradely_offer ?? "missing",
		),
		...(expected.courseId
			? [
					check(
						`${name}.course_metadata`,
						price.product?.metadata.tradely_course_id === expected.courseId,
						price.product?.metadata.tradely_course_id ?? "missing",
					),
				]
			: []),
	];
}

export function buildBillingPreflightChecks(
	snapshot: BillingPreflightSnapshot,
): PreflightCheck[] {
	const expectedLive = snapshot.environment === "production";
	const expectedFlag = snapshot.stage !== "deploy-disabled";
	const allowedBrands = new Set([
		normalizedBrand(BILLING_CONTRACT.accountDisplayName),
		"tradely",
	]);
	const accountBrands = [
		snapshot.account.businessProfileName,
		snapshot.account.dashboardDisplayName,
	].filter((value): value is string => Boolean(value));
	let appOrigin = "invalid";
	try {
		appOrigin = new URL(snapshot.config.appUrl).origin;
	} catch {
		appOrigin = "invalid";
	}
	const canonicalProductionOrigins = new Set([
		"https://tradely.ai",
		"https://www.tradely.ai",
	]);
	const checks: PreflightCheck[] = [
		check(
			"config.production_source",
			snapshot.environment !== "production" ||
				snapshot.configSource === "injected",
			snapshot.configSource,
		),
		check(
			"config.account_id",
			snapshot.config.accountId === snapshot.account.id,
			`configured=${snapshot.config.accountId.slice(-8)} actual=${snapshot.account.id.slice(-8)}`,
		),
		check(
			"config.key_environment",
			snapshot.config.keyKind.endsWith(snapshot.environment),
			snapshot.config.keyKind,
		),
		check(
			"config.restricted_live_key",
			snapshot.environment !== "production" ||
				snapshot.config.keyKind === "restricted-production",
			snapshot.config.keyKind,
		),
		check(
			"config.app_url",
			appOrigin !== "invalid" &&
				(snapshot.environment !== "production" ||
					canonicalProductionOrigins.has(appOrigin)),
			appOrigin,
		),
		check(
			"config.lifetime_flag",
			snapshot.config.lifetimeCheckoutEnabled === expectedFlag,
			String(snapshot.config.lifetimeCheckoutEnabled),
		),
		check(
			"account.public_name",
			accountBrands.some((value) => allowedBrands.has(normalizedBrand(value))),
			accountBrands.join(" | ") || "missing",
		),
		check(
			"account.live_readiness",
			snapshot.environment !== "production" ||
				(snapshot.account.chargesEnabled && snapshot.account.detailsSubmitted),
			`charges=${snapshot.account.chargesEnabled} details=${snapshot.account.detailsSubmitted}`,
		),
		check(
			"account.brand_colors",
			snapshot.account.primaryColor ===
				BILLING_CONTRACT.checkoutBranding.button_color &&
				snapshot.account.secondaryColor === "#f2c94c",
			`primary=${snapshot.account.primaryColor ?? "missing"} secondary=${snapshot.account.secondaryColor ?? "missing"}`,
		),
		check(
			"account.brand_icon",
			snapshot.account.hasIcon,
			String(snapshot.account.hasIcon),
		),
		check(
			"account.statement_descriptor",
			snapshot.account.statementDescriptor ===
				BILLING_CONTRACT.statementDescriptor,
			snapshot.account.statementDescriptor ?? "missing",
		),
		check(
			"account.statement_prefix",
			snapshot.account.statementDescriptorPrefix ===
				BILLING_CONTRACT.statementDescriptorPrefix,
			snapshot.account.statementDescriptorPrefix ?? "missing",
		),
		check(
			"membership.livemode",
			snapshot.membership.livemode === expectedLive,
			String(snapshot.membership.livemode),
		),
		check(
			"membership.price_id",
			snapshot.membership.id === snapshot.config.membershipPriceId,
			snapshot.membership.id.slice(-8),
		),
		check(
			"membership.currency",
			snapshot.membership.currency === BILLING_CONTRACT.currency,
			snapshot.membership.currency,
		),
		check(
			"membership.amount",
			snapshot.membership.unitAmount === BILLING_CONTRACT.membership.unitAmount,
			String(snapshot.membership.unitAmount),
		),
		check(
			"membership.interval",
			snapshot.membership.interval === BILLING_CONTRACT.membership.interval,
			snapshot.membership.interval ?? "none",
		),
		...productCheck("membership", snapshot.membership, {
			name: BILLING_CONTRACT.membership.productName,
			offer: BILLING_CONTRACT.membership.offerMetadata,
		}),
		check(
			"course_pass.livemode",
			snapshot.coursePass.livemode === expectedLive,
			String(snapshot.coursePass.livemode),
		),
		check(
			"course_pass.price_id",
			snapshot.coursePass.id === snapshot.config.coursePassPriceId,
			snapshot.coursePass.id.slice(-8),
		),
		check(
			"course_pass.currency",
			snapshot.coursePass.currency === BILLING_CONTRACT.currency,
			snapshot.coursePass.currency,
		),
		check(
			"course_pass.amount",
			snapshot.coursePass.unitAmount === BILLING_CONTRACT.coursePass.unitAmount,
			String(snapshot.coursePass.unitAmount),
		),
		check(
			"course_pass.one_time",
			snapshot.coursePass.interval === null,
			snapshot.coursePass.interval ?? "one_time",
		),
		...productCheck("course_pass", snapshot.coursePass, {
			name: BILLING_CONTRACT.coursePass.productName,
			offer: BILLING_CONTRACT.coursePass.offerMetadata,
			courseId: BILLING_CONTRACT.coursePass.courseId,
		}),
	];

	if (snapshot.session) {
		checks.push(
			check(
				"checkout.livemode",
				snapshot.session.livemode === expectedLive,
				String(snapshot.session.livemode),
			),
			check(
				"checkout.brand_name",
				snapshot.session.brandingDisplayName ===
					BILLING_CONTRACT.accountDisplayName,
				snapshot.session.brandingDisplayName ?? "missing",
			),
			check(
				"checkout.exact_price",
				snapshot.session.priceIds.length === 1 &&
					new Set([
						snapshot.config.membershipPriceId,
						snapshot.config.coursePassPriceId,
					]).has(snapshot.session.priceIds[0] ?? ""),
				snapshot.session.priceIds.map((id) => id.slice(-8)).join(",") ||
					"missing",
			),
		);
	}
	return checks;
}
