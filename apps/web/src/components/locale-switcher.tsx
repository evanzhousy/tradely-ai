import { localeOptions } from "@/i18n/messages";
import { useI18n } from "@/i18n/provider";

export function LocaleSwitcher() {
	const { locale, setLocale, t } = useI18n();
	return (
		<label className="inline-flex items-center">
			<span className="sr-only">{t("language.label")}</span>
			<select
				value={locale}
				onChange={(event) => setLocale(event.target.value as typeof locale)}
				aria-label={t("language.label")}
				className="h-9 rounded-2xl border border-border bg-background px-2.5 font-medium text-foreground text-xs outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30"
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
