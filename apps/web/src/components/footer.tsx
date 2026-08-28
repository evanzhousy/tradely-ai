import { Link } from "@tanstack/react-router";

import { useAnalytics } from "@/analytics/context";
import { useI18n } from "@/i18n/provider";

export function Footer() {
	const { t } = useI18n();
	const { isConfigured, openPreferences } = useAnalytics();
	return (
		<footer className="border-border/60 border-t bg-muted/20">
			<div className="mx-auto grid max-w-[1480px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
				<div className="flex max-w-md flex-col gap-3">
					<Link to="/" className="font-semibold text-foreground text-lg">
						Tradely
						<span className="font-mono text-muted-foreground text-xs">.ai</span>
					</Link>
					<p className="text-muted-foreground text-sm leading-6">
						{t("footer.description")}
					</p>
					<p className="text-muted-foreground text-xs leading-5">
						{t("footer.partner")}
					</p>
				</div>
				<nav aria-label={t("footer.legal")} className="flex flex-col gap-3">
					<span className="font-mono text-muted-foreground text-xs uppercase tracking-[0.12em]">
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
				{t("footer.rights", { year: new Date().getFullYear() })}
			</div>
		</footer>
	);
}
