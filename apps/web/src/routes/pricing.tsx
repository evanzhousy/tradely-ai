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
import { getPlanSummary } from "@/server/billing";

export const Route = createFileRoute("/pricing")({
	loader: () => getPlanSummary(),
	head: () => ({
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

function formatPlanPrice(plan: Awaited<ReturnType<typeof getPlanSummary>>) {
	if (!plan.configured || plan.unitAmount === null)
		return "Configured in Stripe";
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: plan.currency.toUpperCase(),
		maximumFractionDigits: 2,
	}).format(plan.unitAmount / 100);
}

function PricingPage() {
	const plan = Route.useLoaderData();
	const features = [
		"Complete Evidence-Led Options Research curriculum",
		"Persistent lesson progress across devices",
		"Every future lesson and course update while active",
		"TradingFlow practice assignments and direct tool links",
	];
	return (
		<main className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-[1080px] items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
			<section className="flex flex-col gap-6">
				<Badge variant="secondary">Tradely membership</Badge>
				<div className="flex flex-col gap-4">
					<h1 className="font-semibold text-5xl text-display sm:text-6xl">
						Keep the whole learning path open.
					</h1>
					<p className="max-w-[58ch] text-lg text-muted-foreground leading-8">
						One Tradely membership unlocks the paid curriculum and your learning
						record. TradingFlow remains a separate partnered service.
					</p>
				</div>
				<p className="text-muted-foreground text-sm">
					Taxes are not enabled automatically. Tradely will configure collection
					only after applicable registrations and tax treatment are confirmed.
				</p>
			</section>

			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">
						{plan.configured ? plan.productName : "Tradely membership"}
					</CardTitle>
					<CardDescription>
						Stripe-hosted checkout and self-service billing management.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-7">
					<div className="flex items-end gap-2">
						<span className="font-semibold text-4xl text-display">
							{formatPlanPrice(plan)}
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
							Local preview: add Stripe API and Price IDs to enable checkout.
						</p>
					) : null}
				</CardContent>
			</Card>
		</main>
	);
}
