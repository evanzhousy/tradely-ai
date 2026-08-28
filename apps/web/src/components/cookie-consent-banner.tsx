import { Link } from "@tanstack/react-router";
import { Button } from "@tradely/ui/components/button";
import { XIcon } from "lucide-react";

import { useAnalytics } from "@/analytics/context";
import { useI18n } from "@/i18n/provider";

export function CookieConsentBanner() {
	const {
		closePreferences,
		consent,
		isConsentResolved,
		isConfigured,
		preferencesOpen,
		setConsent,
	} = useAnalytics();
	const { t } = useI18n();
	if (
		!isConfigured ||
		!isConsentResolved ||
		(consent !== "unknown" && !preferencesOpen)
	) {
		return null;
	}

	return (
		<section
			className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-3xl border border-border bg-background/95 p-5 shadow-2xl backdrop-blur-xl sm:inset-x-6 sm:p-6"
			aria-labelledby="analytics-consent-title"
			aria-describedby="analytics-consent-description"
			aria-live="polite"
		>
			{preferencesOpen ? (
				<Button
					variant="ghost"
					size="icon-sm"
					className="absolute top-3 right-3"
					onClick={closePreferences}
					aria-label={t("common.close")}
				>
					<XIcon aria-hidden="true" />
				</Button>
			) : null}
			<div className="flex flex-col gap-4 pr-8">
				<div className="flex flex-col gap-2">
					<h2 id="analytics-consent-title" className="font-semibold text-lg">
						{t("analytics.consentTitle")}
					</h2>
					<p
						id="analytics-consent-description"
						className="text-muted-foreground text-sm leading-6"
					>
						{t("analytics.consentDescription")}{" "}
						<Link className="underline underline-offset-4" to="/privacy">
							{t("footer.privacy")}
						</Link>
						{" · "}
						<Link className="underline underline-offset-4" to="/cookies">
							{t("footer.cookies")}
						</Link>
					</p>
				</div>
				<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
					<Button variant="outline" onClick={() => setConsent("denied")}>
						{t("analytics.necessaryOnly")}
					</Button>
					<Button onClick={() => setConsent("granted")}>
						{t("analytics.allow")}
					</Button>
				</div>
			</div>
		</section>
	);
}
