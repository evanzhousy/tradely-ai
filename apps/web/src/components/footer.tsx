import { useRouterState } from "@tanstack/react-router";
import { Button, buttonVariants } from "@tradely/ui/components/button";
import { cn } from "@tradely/ui/lib/utils";
import { ArrowRightIcon } from "lucide-react";

import { useAnalytics } from "@/analytics/context";
import { AppLink } from "@/components/app-link";
import { getLocalizedCourse } from "@/i18n/course";
import { useI18n } from "@/i18n/provider";
import { TradelyBrand } from "./brand";

export function Footer() {
	const { t, locale } = useI18n();
	const isHome = useRouterState({
		select: (state) => state.location.pathname === "/",
	});
	const firstLesson = getLocalizedCourse(locale).lessons[0];
	const { isConfigured, openPreferences } = useAnalytics();
	const year = new Date().getFullYear();
	return (
		<footer
			className={cn(
				"app-footer border-border/60 border-t",
				isHome && "observatory-footer observatory-surface",
			)}
		>
			{isHome ? (
				<div className="observatory-finale">
					<div className="landing-finale-symbol" aria-hidden="true">
						↗
					</div>
					<div className="observatory-finale-copy">
						<p className="observatory-label">{t("home.finaleLabel")}</p>
						<h2>{t("home.finaleTitle")}</h2>
						<p>{t("home.finaleDescription")}</p>
						{firstLesson ? (
							<AppLink
								to="/learn/$lessonSlug"
								params={{ lessonSlug: firstLesson.slug }}
								className={buttonVariants({ size: "lg" })}
							>
								{t("home.startFree")}
								<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
							</AppLink>
						) : null}
					</div>
				</div>
			) : null}
			<div className="mx-auto grid max-w-[1480px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
				<div className="flex max-w-md flex-col gap-3">
					<TradelyBrand />
					<AppLink
						to="/pricing"
						hash="past-purchases"
						className="plain-link text-sm underline underline-offset-4"
					>
						{t("pricing.pastPurchases")}
					</AppLink>
					<AppLink
						to="/guides"
						className="plain-link text-sm underline underline-offset-4"
					>
						{t("nav.guides")}
					</AppLink>
					<AppLink
						to="/changelog"
						className="plain-link text-sm underline underline-offset-4"
					>
						{t("nav.changelog")}
					</AppLink>
					<p className="text-muted-foreground text-sm leading-6">
						{t("footer.description")}
					</p>
					<p className="text-muted-foreground text-xs leading-5">
						{t("footer.partner")}
					</p>
				</div>
				<nav aria-label={t("footer.legal")} className="flex flex-col gap-3">
					<span className="font-mono text-muted-foreground text-xs">
						{t("footer.legal")}
					</span>
					<div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
						<AppLink
							className="plain-link text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
							to="/privacy"
						>
							{t("footer.privacy")}
						</AppLink>
						<AppLink
							className="plain-link text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
							to="/terms"
						>
							{t("footer.terms")}
						</AppLink>
						<AppLink
							className="plain-link text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
							to="/risk-disclosure"
						>
							{t("footer.risk")}
						</AppLink>
						<AppLink
							className="plain-link text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
							to="/cookies"
						>
							{t("footer.cookies")}
						</AppLink>
						{isConfigured ? (
							<Button
								type="button"
								variant="link"
								size="sm"
								className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
								onClick={openPreferences}
							>
								{t("footer.privacyChoices")}
							</Button>
						) : null}
					</div>
				</nav>
			</div>
			<div className="mx-auto max-w-[1480px] px-4 pb-8 text-muted-foreground text-xs sm:px-6 lg:px-8">
				{t("footer.rights", { year })}
			</div>
		</footer>
	);
}
