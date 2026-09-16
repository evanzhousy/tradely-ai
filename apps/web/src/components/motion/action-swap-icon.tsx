"use client";

import { cn } from "@tradely/ui/lib/utils";
import {
	AnimatePresence,
	motion,
	useReducedMotion,
	type Variants,
} from "motion/react";
import type { ReactNode } from "react";
import { EASE_OUT, SPRING_SWAP } from "./beui-motion";

type ActionSwapIconProps = {
	value: string;
	children: ReactNode;
	className?: string;
};

const ICON_VARIANTS: Record<"blur" | "roll", Variants> = {
	blur: {
		initial: { opacity: 0, scale: 0.25, filter: "blur(8px)" },
		animate: {
			opacity: 1,
			scale: 1,
			filter: "blur(0px)",
			transition: { duration: 0.2, ease: "easeInOut" },
		},
		exit: {
			opacity: 0,
			scale: 0.25,
			filter: "blur(8px)",
			transition: { duration: 0.2, ease: "easeInOut" },
		},
	},
	roll: {
		initial: { opacity: 0, y: 12, filter: "blur(3px)" },
		animate: {
			opacity: 1,
			y: 0,
			filter: "blur(0px)",
			transition: SPRING_SWAP,
		},
		exit: {
			opacity: 0,
			y: -12,
			filter: "blur(3px)",
			transition: { duration: 0.14, ease: EASE_OUT },
		},
	},
};

/** beUI's icon-only action-swap primitive, kept local for the theme toggle. */
export function ActionSwapIcon({
	value,
	children,
	className,
}: ActionSwapIconProps) {
	const reduce = useReducedMotion();
	return (
		<span
			className={cn(
				"relative inline-grid shrink-0 place-items-center overflow-hidden",
				className,
			)}
		>
			<AnimatePresence mode="popLayout" initial={false}>
				<motion.span
					key={value}
					aria-hidden="true"
					variants={ICON_VARIANTS.blur}
					initial={reduce ? false : "initial"}
					animate={
						reduce
							? { opacity: 1, filter: "blur(0px)", scale: 1, y: 0 }
							: "animate"
					}
					exit={reduce ? undefined : "exit"}
					className="col-start-1 row-start-1 inline-flex items-center justify-center"
				>
					{children}
				</motion.span>
			</AnimatePresence>
		</span>
	);
}
