import { Button } from "@tradely/ui/components/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@tradely/ui/components/tooltip";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { t } from "@/i18n/ui";
import { useLocale } from "@/i18n/use-locale";

export function ThemeToggle() {
	const locale = useLocale();
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	if (!mounted) return <span className="size-9" aria-hidden />;
	const dark = resolvedTheme === "dark";
	const label = dark ? t(locale, "useLightTheme") : t(locale, "useDarkTheme");
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setTheme(dark ? "light" : "dark")}
						aria-label={label}
					/>
				}
			>
				{dark ? <SunIcon /> : <MoonIcon />}
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}
