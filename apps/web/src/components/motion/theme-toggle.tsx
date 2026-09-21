"use client";

import { Button, type ButtonProps } from "@tradely/ui/components/button";
import { cn } from "@tradely/ui/lib/utils";
import { Moon, Sun } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import { forwardRef, useEffect, useState } from "react";
import { ActionSwapIcon } from "./action-swap-icon";
import { EASE_OUT_CSS } from "./beui-motion";

export type ThemeVariant = "rectangle" | "circle" | "circle-blur" | "blinds";
export type ThemeToggleStart =
	| "top-left"
	| "top-right"
	| "bottom-left"
	| "bottom-right"
	| "center"
	| "bottom-up";

export interface ThemeToggleProps
	extends Omit<ButtonProps, "children" | "size" | "variant"> {
	variant?: ThemeVariant;
	start?: ThemeToggleStart;
	iconClassName?: string;
}

const VT_STYLE_ID = "tradely-theme-toggle-vt";
const VT_CSS = `
@property --tradely-vt-slat { syntax: "<length>"; inherits: false; initial-value: 72px; }
html[data-tradely-vt="rect"]::view-transition-old(root) { animation: none; mix-blend-mode: normal; }
html[data-tradely-vt="rect"]::view-transition-new(root) { mix-blend-mode: normal; animation: tradely-rect-reveal 400ms ease-out; }
html[data-tradely-vt="circle"]::view-transition-old(root),
html[data-tradely-vt="circle-blur"]::view-transition-old(root) { animation: none; mix-blend-mode: normal; }
html[data-tradely-vt="circle"]::view-transition-new(root) { mix-blend-mode: normal; animation: tradely-circle-reveal 700ms cubic-bezier(0.4, 0, 0.2, 1); }
html[data-tradely-vt="circle-blur"]::view-transition-new(root) { mix-blend-mode: normal; animation: tradely-circle-blur-reveal 700ms cubic-bezier(0.4, 0, 0.2, 1); }
html[data-tradely-vt="blinds"]::view-transition-old(root) { animation: none; mix-blend-mode: normal; }
html[data-tradely-vt="blinds"]::view-transition-new(root) {
  mix-blend-mode: normal;
  mask-image: linear-gradient(90deg, #000 0 var(--tradely-vt-slat), transparent calc(var(--tradely-vt-slat) + 20px));
  mask-size: 72px 100%;
  mask-repeat: repeat;
  animation: tradely-blinds-reveal 700ms ${EASE_OUT_CSS};
}
@keyframes tradely-rect-reveal { from { clip-path: var(--tradely-vt-from, inset(100% 0 0 0)); } to { clip-path: inset(0 0 0 0); } }
@keyframes tradely-circle-reveal { from { clip-path: circle(0% at var(--tradely-vt-origin, 50% 100%)); } to { clip-path: circle(150% at var(--tradely-vt-origin, 50% 100%)); } }
@keyframes tradely-circle-blur-reveal { from { clip-path: circle(0% at var(--tradely-vt-origin, 50% 100%)); filter: blur(8px); } to { clip-path: circle(150% at var(--tradely-vt-origin, 50% 100%)); filter: blur(0px); } }
@keyframes tradely-blinds-reveal { from { --tradely-vt-slat: -20px; } to { --tradely-vt-slat: 72px; } }
`;

const RECT_FROM: Record<ThemeToggleStart, string> = {
	"top-left": "inset(0 100% 100% 0)",
	"top-right": "inset(0 0 100% 100%)",
	"bottom-left": "inset(100% 100% 0 0)",
	"bottom-right": "inset(100% 0 0 100%)",
	center: "inset(50% 50% 50% 50%)",
	"bottom-up": "inset(100% 0 0 0)",
};

const CIRCLE_ORIGIN: Record<ThemeToggleStart, string> = {
	"top-left": "0% 0%",
	"top-right": "100% 0%",
	"bottom-left": "0% 100%",
	"bottom-right": "100% 100%",
	center: "50% 50%",
	"bottom-up": "50% 100%",
};

export function useThemeToggle({
	variant = "rectangle",
	start = "bottom-up",
}: {
	variant?: ThemeVariant;
	start?: ThemeToggleStart;
} = {}) {
	const { setTheme, resolvedTheme } = useTheme();
	const reduce = useReducedMotion() ?? false;
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);
	useEffect(() => {
		if (document.getElementById(VT_STYLE_ID)) return;
		const style = document.createElement("style");
		style.id = VT_STYLE_ID;
		style.textContent = VT_CSS;
		document.head.appendChild(style);
	}, []);

	const isDark = mounted && resolvedTheme === "dark";
	const toggle = () => {
		const next = isDark ? "light" : "dark";
		if (reduce || !("startViewTransition" in document)) {
			setTheme(next);
			return;
		}

		const root = document.documentElement;
		if (variant === "rectangle") {
			root.style.setProperty("--tradely-vt-from", RECT_FROM[start]);
			root.dataset.tradelyVt = "rect";
		} else if (variant === "blinds") {
			root.dataset.tradelyVt = "blinds";
		} else {
			root.style.setProperty("--tradely-vt-origin", CIRCLE_ORIGIN[start]);
			root.dataset.tradelyVt = variant;
		}

		const transition = (
			document as Document & {
				startViewTransition(callback: () => void): { finished: Promise<void> };
			}
		).startViewTransition(() => setTheme(next));
		transition.finished.finally(() => {
			delete root.dataset.tradelyVt;
		});
	};

	return { isDark, mounted, toggle };
}

export const ThemeToggle = forwardRef<HTMLButtonElement, ThemeToggleProps>(
	function ThemeToggle(
		{
			variant = "rectangle",
			start = "bottom-up",
			className,
			iconClassName,
			onClick: onClickProp,
			...rest
		},
		ref,
	) {
		const { isDark, mounted, toggle } = useThemeToggle({ variant, start });
		return (
			<Button
				ref={ref}
				type="button"
				variant="ghost"
				size="icon"
				aria-label={
					rest["aria-label"] ??
					(mounted && isDark ? "Switch to light mode" : "Switch to dark mode")
				}
				onClick={(event) => {
					toggle();
					onClickProp?.(event);
				}}
				className={cn("flex items-center justify-center", className)}
				{...rest}
			>
				{mounted ? (
					<ActionSwapIcon value={isDark ? "dark" : "light"}>
						{isDark ? (
							<Sun className={iconClassName} aria-hidden="true" />
						) : (
							<Moon className={iconClassName} aria-hidden="true" />
						)}
					</ActionSwapIcon>
				) : (
					<span className={iconClassName} aria-hidden="true" />
				)}
			</Button>
		);
	},
);
