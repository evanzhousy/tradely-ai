import {
	NativeSelect,
	NativeSelectOption,
} from "@tradely/ui/components/native-select";
import { LanguagesIcon } from "lucide-react";

import { useAnalytics } from "@/analytics/context";
import { localeOptions } from "@/i18n/messages";
import { useI18n } from "@/i18n/provider";

export function LocaleSwitcher() {
	const { locale, setLocale, t } = useI18n();
	const { capture } = useAnalytics();
	return (
		<NativeSelect
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
			// Sits among the header's buttons, so it takes the small outline button's look.
			variant="outline"
			icon={<LanguagesIcon aria-hidden="true" />}
		>
			{localeOptions.map((option) => (
				// Each language is named in itself, so it is read in its own language.
				<NativeSelectOption
					key={option.value}
					value={option.value}
					lang={option.value}
				>
					{t(option.labelKey)}
				</NativeSelectOption>
			))}
		</NativeSelect>
	);
}
