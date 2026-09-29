import { useRouterState } from "@tanstack/react-router";
import { Button } from "@tradely/ui/components/button";
import { cn } from "@tradely/ui/lib/utils";
import type { ReactNode } from "react";
import { useAnalytics } from "@/analytics/context";
import { AppLink } from "@/components/app-link";
import { useI18n } from "@/i18n/provider";
import { TradelyBrand } from "./brand";

/** Every footer link and action: muted, underlined on hover, at least 24px tall to tap. */
const footerLink =
	"plain-link min-h-6 text-muted-foreground text-sm underline-offset-4 hover:text-foreground hover:underline";

function FooterGroup({
	id,
	label,
	children,
}: {
	id: string;
	label: string;
	children: ReactNode;
}) {
	return (
		<nav aria-labelledby={id} className="flex flex-col gap-3">
			<p id={id} className="font-mono text-muted-foreground text-xs">
				{label}
			</p>
			<ul className="flex flex-col gap-1.5">{children}</ul>
		</nav>
	);
}

export function Footer() {
	const { t, locale } = useI18n();
	const isHome = useRouterState({
		select: (state) => state.location.pathname === "/",
	});
	const { isConfigured, openPreferences } = useAnalytics();
	const year = new Date().getFullYear();
	// Guides and the changelog are written in English only.
	const inEnglish =
		locale === "zh" ? <span className="ms-1 text-xs">（英文）</span> : null;
	return (
		<footer
			className={cn(
				"app-footer border-border/60 border-t",
				isHome && "observatory-footer observatory-surface",
			)}
		>
			<div className="mx-auto grid max-w-[1480px] grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] lg:px-8">
				<div className="col-span-2 flex max-w-sm flex-col gap-3 md:col-span-1">
					<TradelyBrand />
					<p className="text-muted-foreground text-sm leading-6">
						{t("footer.description")}
					</p>
					<p className="text-muted-foreground text-xs leading-5">
						{t("footer.partner")}
					</p>
				</div>
				<FooterGroup id="footer-learn" label={t("home.footerLearning")}>
					<li>
						<AppLink
							to="/courses/tradingflow-foundations"
							className={footerLink}
						>
							{t("nav.course")}
						</AppLink>
					</li>
					<li>
						<AppLink to="/guides" className={footerLink}>
							{t("nav.guides")}
							{inEnglish}
						</AppLink>
					</li>
					<li>
						<AppLink to="/changelog" className={footerLink}>
							{t("nav.changelog")}
							{inEnglish}
						</AppLink>
					</li>
					<li>
						<AppLink to="/pricing" hash="past-purchases" className={footerLink}>
							{t("pricing.pastPurchases")}
						</AppLink>
					</li>
				</FooterGroup>
				<FooterGroup id="footer-legal" label={t("footer.legal")}>
					<li>
						<AppLink to="/privacy" className={footerLink}>
							{t("footer.privacy")}
						</AppLink>
					</li>
					<li>
						<AppLink to="/terms" className={footerLink}>
							{t("footer.terms")}
						</AppLink>
					</li>
					<li>
						<AppLink to="/risk-disclosure" className={footerLink}>
							{t("footer.risk")}
						</AppLink>
					</li>
					<li>
						<AppLink to="/cookies" className={footerLink}>
							{t("footer.cookies")}
						</AppLink>
					</li>
					{isConfigured ? (
						<li>
							{/* An action, so a button, drawn like the links beside it. */}
							<Button
								type="button"
								variant="link"
								size="sm"
								className={cn(
									footerLink,
									"h-auto rounded-none p-0 font-normal [--button-bg-hover:transparent] [--button-bg-pressed:transparent] [--button-bg:transparent] active:scale-100",
								)}
								onClick={openPreferences}
							>
								{t("footer.privacyChoices")}
							</Button>
						</li>
					) : null}
				</FooterGroup>
			</div>
			<div className="mx-auto max-w-[1480px] px-4 pb-8 text-muted-foreground text-xs sm:px-6 lg:px-8">
				{t("footer.rights", { year })}
			</div>
		</footer>
	);
}
