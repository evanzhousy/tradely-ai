import { LanguagesIcon } from "lucide-react";

import { useAnalytics } from "@/analytics/context";
import { localeOptions } from "@/i18n/messages";
import { useI18n } from "@/i18n/provider";

export function LocaleSwitcher() {
	const { locale, setLocale, t } = useI18n();
	const { capture } = useAnalytics();
	return (
		<label className="relative inline-flex items-center">
			<span className="sr-only">{t("language.label")}</span>
			<LanguagesIcon
				className="pointer-events-none absolute left-2.5 size-4 text-muted-foreground"
				aria-hidden="true"
			/>
			<select
				value={locale}
				onChange={(event) => {
					const nextLocale = event.target.value as typeof locale;
					if (nextLocale !== locale) {
						capture("locale_changed", {
							from_locale: locale,
							to_locale: nextLocale,
						});
						setLocale(nextLocale);
					}
				}}
				aria-label={t("language.label")}
				className="h-9 rounded-2xl border border-border bg-background pr-7 pl-8 font-medium text-foreground text-xs outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30"
			>
				{localeOptions.map((option) => (
					<option key={option.value} value={option.value}>
						{t(option.labelKey)}
					</option>
				))}
			</select>
		</label>
	);
}
