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

import { PricingActions } from "@/components/pricing-actions";
import { t } from "@/i18n/ui";
import { useLocale } from "@/i18n/use-locale";
import { getPlanSummary } from "@/server/billing";

export const Route = createFileRoute("/pricing")({
	loader: () => getPlanSummary(),
	head: () => ({
		meta: [
			{ title: t("en", "metaPricingTitle") },
			{
				name: "description",
				content: t("en", "metaPricingDescription"),
			},
		],
	}),
	component: PricingPage,
});

function formatPlanPrice(
	plan: Awaited<ReturnType<typeof getPlanSummary>>,
	locale: ReturnType<typeof useLocale>,
) {
	if (!plan.configured || plan.unitAmount === null)
		return t(locale, "configuredInStripe");
	return new Intl.NumberFormat(locale === "zh-Hans" ? "zh-CN" : "en-US", {
		style: "currency",
		currency: plan.currency.toUpperCase(),
		maximumFractionDigits: 2,
	}).format(plan.unitAmount / 100);
}

function PricingPage() {
	const locale = useLocale();
	const plan = Route.useLoaderData();
	const features = [
		t(locale, "pricingFeature1"),
		t(locale, "pricingFeature2"),
		t(locale, "pricingFeature3"),
		t(locale, "pricingFeature4"),
	];
	return (
		<main className="mx-auto grid h-full w-full max-w-[1080px] items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
			<section className="flex flex-col gap-6">
				<Badge variant="secondary">{t(locale, "membershipBadge")}</Badge>
				<div className="flex flex-col gap-4">
					<h1 className="font-semibold text-5xl text-display sm:text-6xl">
						{t(locale, "pricingTitle")}
					</h1>
					<p className="max-w-[58ch] text-lg text-muted-foreground leading-8">
						{t(locale, "pricingBody")}
					</p>
				</div>
				<p className="text-muted-foreground text-sm">
					{t(locale, "pricingTax")}
				</p>
			</section>

			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">
						{t(locale, "membershipBadge")}
					</CardTitle>
					<CardDescription>
						{t(locale, "pricingCardDescription")}
					</CardDescription>
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
									<CheckIcon className="size-3.5" />
								</span>
								{feature}
							</li>
						))}
					</ul>
					<PricingActions configured={plan.configured} />
					{!plan.configured ? (
						<p className="text-muted-foreground text-xs">
							{t(locale, "localStripePreview")}
						</p>
					) : null}
				</CardContent>
			</Card>
		</main>
	);
}
