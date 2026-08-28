import { createFileRoute } from "@tanstack/react-router";
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
import { z } from "zod";

import { useAnalytics } from "@/analytics/context";
import { PricingActions } from "@/components/pricing-actions";
import { useI18n } from "@/i18n/provider";
import { getPlanSummary } from "@/server/billing";

export const Route = createFileRoute("/pricing")({
	loader: () => getPlanSummary(),
	validateSearch: z.object({
		checkout: z.enum(["success", "cancel"]).optional(),
	}),
	head: () => ({
		links: [{ rel: "canonical", href: "https://tradely.ai/pricing" }],
		meta: [
			{ title: "Tradely membership" },
			{
				name: "description",
				content:
					"Unlock the complete Tradely options-learning curriculum with Stripe-hosted checkout.",
			},
		],
	}),
	component: PricingPage,
});

function formatPlanPrice(
	plan: Awaited<ReturnType<typeof getPlanSummary>>,
	locale: "en" | "zh",
) {
	if (!plan.configured || plan.unitAmount === null)
		return locale === "zh" ? "已在 Stripe 配置" : "Configured in Stripe";
	return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
		style: "currency",
		currency: plan.currency.toUpperCase(),
		maximumFractionDigits: 2,
	}).format(plan.unitAmount / 100);
}

function PricingPage() {
	const plan = Route.useLoaderData();
	const { checkout } = Route.useSearch();
	const { locale, t } = useI18n();
	const { capture, isCapturing } = useAnalytics();
	const trackedCheckoutReturn = useRef<string | null>(null);
	useEffect(() => {
		if (!isCapturing) {
			trackedCheckoutReturn.current = null;
			return;
		}
		if (!checkout || trackedCheckoutReturn.current === checkout) return;
		if (
			capture("billing_checkout_returned", {
				status: checkout,
				estimate: true,
			})
		) {
			trackedCheckoutReturn.current = checkout;
		}
	}, [capture, checkout, isCapturing]);
	const features = [
		t("pricing.featureCurriculum"),
		t("pricing.featureProgress"),
		t("pricing.featureUpdates"),
		t("pricing.featurePractice"),
	];
	return (
		<main className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-[1080px] items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
			<section className="flex flex-col gap-6">
				<Badge variant="secondary">{t("pricing.membership")}</Badge>
				<div className="flex flex-col gap-4">
					<h1 className="font-semibold text-5xl text-display sm:text-6xl">
						{t("pricing.heading")}
					</h1>
					<p className="max-w-[58ch] text-lg text-muted-foreground leading-8">
						{t("pricing.description")}
					</p>
				</div>
				<p className="text-muted-foreground text-sm">{t("pricing.taxNote")}</p>
			</section>

			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">
						{plan.configured ? plan.productName : t("pricing.membership")}
					</CardTitle>
					<CardDescription>{t("pricing.checkoutDescription")}</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-7">
					<div className="flex items-end gap-2">
						<span className="font-semibold text-4xl text-display">
							{formatPlanPrice(plan, locale)}
						</span>
						{plan.configured && plan.interval ? (
							<span className="pb-1 text-muted-foreground">
								/{plan.interval}
							</span>
						) : null}
					</div>
					<ul className="flex flex-col gap-3">
						{features.map((feature) => (
							<li key={feature} className="flex items-start gap-3 text-sm">
								<span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
									<CheckIcon className="size-3.5" aria-hidden="true" />
								</span>
								{feature}
							</li>
						))}
					</ul>
					<PricingActions configured={plan.configured} />
					{!plan.configured ? (
						<p className="text-muted-foreground text-xs">
							{t("pricing.localPreview")}
						</p>
					) : null}
				</CardContent>
			</Card>
		</main>
	);
}
