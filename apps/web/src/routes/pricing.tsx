import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Badge } from "@tradely/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@tradely/ui/components/card";
import { CheckIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useAnalytics } from "@/analytics/context";
import type { BillingOffer } from "@/analytics/events";
import {
	PricingAccountActions,
	PricingCheckoutButton,
} from "@/components/pricing-actions";
import {
	type PricingCheckoutResult,
	parsePricingSearch,
} from "@/domain/pricing-search";
import { useI18n } from "@/i18n/provider";
import { getPricingSummary, verifyCoursePassCheckout } from "@/server/billing";

export const Route = createFileRoute("/pricing")({
	loader: () => getPricingSummary(),
	validateSearch: parsePricingSearch,
	head: () => ({
		links: [{ rel: "canonical", href: "https://tradely.ai/pricing" }],
		meta: [
			{ title: "Tradely pricing" },
			{
				name: "description",
				content:
					"Explore Tradely membership and course-access options with Stripe-hosted checkout.",
			},
		],
	}),
	component: PricingPage,
});

type PricingSummary = Awaited<ReturnType<typeof getPricingSummary>>;
type OfferSummary = PricingSummary["offers"]["membership"];

function formatOfferPrice(offer: OfferSummary, locale: "en" | "zh"): string {
	if (!offer.configured || offer.unitAmount === null)
		return locale === "zh" ? "已在 Stripe 配置" : "Configured in Stripe";
	return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
		style: "currency",
		currency: offer.currency.toUpperCase(),
		maximumFractionDigits: 2,
	}).format(offer.unitAmount / 100);
}

function OfferCard({
	offer,
	summary,
	title,
	description,
	features,
	active,
	isSignedIn,
}: {
	offer: BillingOffer;
	summary: OfferSummary;
	title: string;
	description: string;
	features: string[];
	active: boolean;
	isSignedIn: boolean;
}) {
	const { locale, t } = useI18n();
	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle className="text-2xl">{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="flex h-full flex-col gap-7">
				<div className="flex items-end gap-2">
					<span className="font-semibold text-4xl text-display">
						{formatOfferPrice(summary, locale)}
					</span>
					{summary.configured ? (
						<span className="pb-1 text-muted-foreground">
							{summary.interval ? `/${summary.interval}` : t("pricing.oneTime")}
						</span>
					) : null}
				</div>
				<ul className="flex flex-1 flex-col gap-3">
					{features.map((feature) => (
						<li key={feature} className="flex items-start gap-3 text-sm">
							<span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
								<CheckIcon className="size-3.5" aria-hidden="true" />
							</span>
							{feature}
						</li>
					))}
				</ul>
				<PricingCheckoutButton
					offer={offer}
					configured={summary.configured}
					active={active}
					isSignedIn={isSignedIn}
				/>
			</CardContent>
		</Card>
	);
}

function checkoutAnalytics(value: PricingCheckoutResult): {
	status: "success" | "cancel";
	offer: BillingOffer;
} {
	if (value === "lifetime-success" || value === "lifetime-cancel") {
		return {
			status: value === "lifetime-success" ? "success" : "cancel",
			offer: "lifetime_course",
		};
	}
	return {
		status:
			value === "success" || value === "membership-success"
				? "success"
				: "cancel",
		offer: "membership",
	};
}

function PricingPage() {
	const { offers, access } = Route.useLoaderData();
	const { checkout, session_id: sessionId } = Route.useSearch();
	const router = useRouter();
	const verifyCoursePass = useServerFn(verifyCoursePassCheckout);
	const { t } = useI18n();
	const { capture, isCapturing } = useAnalytics();
	const trackedCheckoutReturn = useRef<string | null>(null);
	const verifiedSession = useRef<string | null>(null);
	const invalidReturnReported = useRef(false);

	useEffect(() => {
		if (checkout !== "lifetime-success" || sessionId) {
			invalidReturnReported.current = false;
			return;
		}
		if (invalidReturnReported.current) return;
		invalidReturnReported.current = true;
		toast.error(t("pricing.verifyFailure"));
	}, [checkout, sessionId, t]);

	useEffect(() => {
		if (
			checkout !== "lifetime-success" ||
			!sessionId ||
			verifiedSession.current === sessionId
		)
			return;
		verifiedSession.current = sessionId;
		void verifyCoursePass({ data: { sessionId } })
			.then((result) => {
				capture("course_pass_access_verified", {
					course_id: result.courseId,
					source: result.source,
				});
				toast.success(t("pricing.verifySuccess"));
				void router.invalidate();
			})
			.catch(() => {
				verifiedSession.current = null;
				toast.error(t("pricing.verifyFailure"));
			});
	}, [capture, checkout, router, sessionId, t, verifyCoursePass]);

	useEffect(() => {
		if (!isCapturing) {
			trackedCheckoutReturn.current = null;
			return;
		}
		if (!checkout || trackedCheckoutReturn.current === checkout) return;
		const analytics = checkoutAnalytics(checkout);
		if (
			capture("billing_checkout_returned", {
				...analytics,
				estimate: true,
			})
		) {
			trackedCheckoutReturn.current = checkout;
		}
	}, [capture, checkout, isCapturing]);

	const membershipFeatures = [
		t("pricing.featureCurriculum"),
		t("pricing.featureProgress"),
		t("pricing.featureUpdates"),
		t("pricing.featurePractice"),
	];
	const coursePassFeatures = [
		t("pricing.featureCoursePassCurriculum"),
		t("pricing.featureCoursePassProgress"),
		t("pricing.featureCoursePassRevisions"),
		t("pricing.featureCoursePassPractice"),
	];

	return (
		<main className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-[1180px] flex-col gap-10 px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
			<section className="flex max-w-3xl flex-col gap-5">
				<Badge variant="secondary">{t("nav.pricing")}</Badge>
				<h1 className="font-semibold text-5xl text-display sm:text-6xl">
					{t("pricing.heading")}
				</h1>
				<p className="text-lg text-muted-foreground leading-8">
					{t(
						offers.lifetimeCheckoutEnabled
							? "pricing.description"
							: "pricing.descriptionMembershipOnly",
					)}
				</p>
			</section>

			<div className="grid gap-6 lg:grid-cols-2">
				<OfferCard
					offer="membership"
					summary={offers.membership}
					title={t("pricing.membership")}
					description={t("pricing.membershipDescription")}
					features={membershipFeatures}
					active={access.billingState === "active"}
					isSignedIn={access.isSignedIn}
				/>
				{offers.lifetimeCheckoutEnabled ? (
					<OfferCard
						offer="lifetime_course"
						summary={offers.coursePass}
						title={t("pricing.coursePass")}
						description={t("pricing.coursePassDescription")}
						features={coursePassFeatures}
						active={access.hasCoursePass}
						isSignedIn={access.isSignedIn}
					/>
				) : null}
			</div>

			<PricingAccountActions
				canManageBilling={access.billingState === "active"}
				canRestoreCoursePass={
					offers.coursePassRecoveryConfigured &&
					access.isSignedIn &&
					!access.hasCoursePass &&
					access.hasStripeCustomer
				}
				showCoursePassStatus={
					!offers.lifetimeCheckoutEnabled && access.hasCoursePass
				}
				onAccessChanged={() => void router.invalidate()}
			/>
			<p className="text-muted-foreground text-sm">{t("pricing.taxNote")}</p>
			{!offers.membership.configured ||
			(offers.lifetimeCheckoutEnabled && !offers.coursePass.configured) ? (
				<p className="text-muted-foreground text-xs">
					{t("pricing.localPreview")}
				</p>
			) : null}
		</main>
	);
}
