import { Link, useRouterState } from "@tanstack/react-router";
import { buttonVariants } from "@tradely/ui/components/button";
import { cn } from "@tradely/ui/lib/utils";
import { ArrowRightIcon } from "lucide-react";

import { useAnalytics } from "@/analytics/context";
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
				"border-border/60 border-t bg-muted/20",
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
							<Link
								to="/learn/$lessonSlug"
								params={{ lessonSlug: firstLesson.slug }}
								className={buttonVariants({ size: "lg" })}
							>
								{t("home.startFree")}
								<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
							</Link>
						) : null}
					</div>
				</div>
			) : null}
			<div className="mx-auto grid max-w-[1480px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
				<div className="flex max-w-md flex-col gap-3">
					<TradelyBrand />
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
						<Link
							className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
							to="/privacy"
						>
							{t("footer.privacy")}
						</Link>
						<Link
							className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
							to="/terms"
						>
							{t("footer.terms")}
						</Link>
						<Link
							className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
							to="/risk-disclosure"
						>
							{t("footer.risk")}
						</Link>
						<Link
							className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
							to="/cookies"
						>
							{t("footer.cookies")}
						</Link>
						{isConfigured ? (
							<button
								type="button"
								className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
								onClick={openPreferences}
							>
								{t("footer.privacyChoices")}
							</button>
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
