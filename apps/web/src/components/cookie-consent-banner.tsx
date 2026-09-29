import { Button } from "@tradely/ui/components/button";
import { CloseButton } from "@tradely/ui/components/close-button";
import { DisclosurePanel } from "@tradely/ui/components/disclosure";
import { useEffect, useRef } from "react";

import { useAnalytics } from "@/analytics/context";
import { AppLink } from "@/components/app-link";
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
	const title = useRef<HTMLHeadingElement>(null);
	// Opened from "Privacy choices", the panel takes focus so the reader knows it opened, and
	// gives it back to that control when it closes. The first-visit banner never takes focus.
	useEffect(() => {
		if (!preferencesOpen) return;
		const opener =
			document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;
		title.current?.focus();
		return () => {
			const lost =
				!document.activeElement || document.activeElement === document.body;
			if (lost && opener?.isConnected) opener.focus();
		};
	}, [preferencesOpen]);
	if (
		!isConfigured ||
		!isConsentResolved ||
		(consent !== "unknown" && !preferencesOpen)
	) {
		return null;
	}

	return (
		<section
			className="consent-surface fixed inset-x-3 bottom-3 z-50 rounded-3xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur-xl sm:right-6 sm:left-auto sm:max-w-md"
			aria-labelledby="analytics-consent-title"
			aria-describedby="analytics-consent-summary"
			aria-live="polite"
		>
			{preferencesOpen ? (
				<CloseButton
					className="absolute top-3 right-3"
					onPress={closePreferences}
					aria-label={t("common.close")}
				/>
			) : null}
			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-2">
					<h2
						id="analytics-consent-title"
						ref={title}
						tabIndex={-1}
						className="pr-8 font-semibold text-sm outline-none"
					>
						{t("analytics.consentTitle")}
					</h2>
					<p
						id="analytics-consent-summary"
						className="text-muted-foreground text-sm"
					>
						{t("analytics.consentSummary")}
					</p>
					<DisclosurePanel
						defaultExpanded={preferencesOpen}
						summary={t("analytics.details")}
						triggerClassName="text-sm underline underline-offset-4"
						bodyClassName="pt-2"
					>
						<p
							id="analytics-consent-description"
							className="text-muted-foreground text-sm leading-6"
						>
							{t("analytics.consentDescription")}{" "}
							<AppLink
								className="plain-link underline underline-offset-4"
								to="/privacy"
							>
								{t("footer.privacy")}
							</AppLink>
							{" · "}
							<AppLink
								className="plain-link underline underline-offset-4"
								to="/cookies"
							>
								{t("footer.cookies")}
							</AppLink>
						</p>
					</DisclosurePanel>
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
