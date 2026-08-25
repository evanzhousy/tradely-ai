import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@tradely/ui/components/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@tradely/ui/components/tooltip";
import { t } from "@/i18n/ui";
import { useLocale } from "@/i18n/use-locale";
import { setRequestLocale } from "@/server/locale";

export function LanguageSwitcher() {
	const locale = useLocale();
	const router = useRouter();
	const setLocale = useServerFn(setRequestLocale);
	const next = locale === "en" ? "zh-Hans" : "en";
	const label = next === "zh-Hans" ? "中文" : "EN";

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						variant="ghost"
						size="sm"
						aria-label={t(locale, "language")}
						onClick={() => {
							void (async () => {
								await setLocale({ data: next });
								await router.invalidate();
							})();
						}}
					/>
				}
			>
				<span className="font-mono text-xs">{label}</span>
			</TooltipTrigger>
			<TooltipContent>{t(locale, "language")}</TooltipContent>
		</Tooltip>
	);
}
