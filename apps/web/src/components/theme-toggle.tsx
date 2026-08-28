import { Button } from "@tradely/ui/components/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@tradely/ui/components/tooltip";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { useI18n } from "@/i18n/provider";

export function ThemeToggle() {
	const { t } = useI18n();
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	if (!mounted) return <span className="size-9" aria-hidden />;
	const dark = resolvedTheme === "dark";
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setTheme(dark ? "light" : "dark")}
						aria-label={dark ? t("theme.light") : t("theme.dark")}
					/>
				}
			>
				{dark ? (
					<SunIcon aria-hidden="true" />
				) : (
					<MoonIcon aria-hidden="true" />
				)}
			</TooltipTrigger>
			<TooltipContent>
				{dark ? t("theme.light") : t("theme.dark")}
			</TooltipContent>
		</Tooltip>
	);
}
