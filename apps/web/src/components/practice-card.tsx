import { Badge } from "@tradely/ui/components/badge";
import { buttonVariants } from "@tradely/ui/components/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@tradely/ui/components/card";
import { cn } from "@tradely/ui/lib/utils";
import { ExternalLinkIcon } from "lucide-react";

import { useAnalytics } from "@/analytics/context";
import type { TradingFlowPractice } from "@/content/course";
import { useI18n } from "@/i18n/provider";

export function PracticeCard({
	lessonId,
	practice,
}: {
	lessonId: string;
	practice: TradingFlowPractice;
}) {
	const { t } = useI18n();
	const { capture } = useAnalytics();
	const captureOpen = () =>
		capture("tradingflow_link_opened", {
			surface: "lesson_practice",
			lesson_id: lessonId,
			tool: practice.tool,
		});
	return (
		<Card className="bg-primary text-primary-foreground ring-0">
			<CardHeader>
				<div className="flex flex-wrap items-center gap-2">
					<img
						src="/partners/tradingflow-mark.webp"
						alt="TradingFlow"
						className="size-7 rounded-lg bg-white object-contain p-1"
					/>
					<Badge className="bg-primary-foreground/12 text-primary-foreground">
						{t("practice.badge")}
					</Badge>
					<span className="font-mono text-primary-foreground/70 text-xs">
						TradingFlow · {practice.tool}
					</span>
				</div>
				<CardTitle className="text-primary-foreground text-xl">
					{practice.title}
				</CardTitle>
				<CardDescription className="max-w-2xl text-primary-foreground/75">
					{practice.goal}
				</CardDescription>
				<CardAction>
					<a
						href={practice.href}
						onClick={captureOpen}
						className={cn(
							buttonVariants({ variant: "secondary", size: "sm" }),
							"hidden sm:inline-flex",
						)}
					>
						{t("practice.open")}
						<ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
					</a>
				</CardAction>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<p className="text-primary-foreground/65 text-xs">
					{t("practice.disclosure")}
				</p>
				<a
					href={practice.href}
					onClick={captureOpen}
					className={cn(buttonVariants({ variant: "secondary" }), "sm:hidden")}
				>
					{t("practice.open")}
					<ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
				</a>
			</CardContent>
		</Card>
	);
}
