import { buttonVariants } from "@tradely/ui/components/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@tradely/ui/components/tooltip";
import { cn } from "@tradely/ui/lib/utils";
import { useTheme } from "next-themes";
import { useI18n } from "@/i18n/provider";
import { ThemeToggle as BeUiThemeToggle } from "./motion/theme-toggle";

export function ThemeToggle() {
	const { t } = useI18n();
	const { resolvedTheme } = useTheme();
	const dark = resolvedTheme === "dark";
	const label = dark ? t("theme.light") : t("theme.dark");
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<BeUiThemeToggle
						className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
						iconClassName="size-4"
						aria-label={label}
					/>
				}
			/>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}
