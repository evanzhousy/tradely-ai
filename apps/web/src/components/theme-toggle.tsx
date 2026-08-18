import { Button } from "@tradely/ui/components/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@tradely/ui/components/tooltip";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
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
						aria-label={dark ? "Use light theme" : "Use dark theme"}
					/>
				}
			>
				{dark ? <SunIcon /> : <MoonIcon />}
			</TooltipTrigger>
			<TooltipContent>
				{dark ? "Use light theme" : "Use dark theme"}
			</TooltipContent>
		</Tooltip>
	);
}
