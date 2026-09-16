"use client";

import { cn } from "@tradely/ui/lib/utils";
import {
	useMotionValue,
	useReducedMotion,
	useSpring,
	useTransform,
} from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useLayoutEffect, useState } from "react";
import { type SliderOptions, useSlider } from "@/hooks/use-slider";
import { SPRING_GLIDE } from "./beui-motion";

export interface RangeSliderProps extends SliderOptions {
	showTicks?: boolean;
	className?: string;
}

/** beUI range slider adapted to keep Tradely's existing controlled values and labels. */
export function RangeSlider({
	showTicks = true,
	className,
	...options
}: RangeSliderProps) {
	const reduce = useReducedMotion();
	const { percent, dragging, min, max, step, trackProps, sliderProps } =
		useSlider(options);
	const [trackWidth, setTrackWidth] = useState(292);

	useLayoutEffect(() => {
		const track = trackProps.ref.current;
		if (!track) return;
		const measure = () => {
			const width = track.getBoundingClientRect().width;
			if (width > 0) setTrackWidth(width);
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(track);
		return () => observer.disconnect();
	}, [trackProps.ref]);

	const target = useMotionValue(percent);
	useEffect(() => target.set(percent), [percent, target]);
	const smooth = useSpring(target, SPRING_GLIDE);
	const position = reduce ? target : smooth;
	const thumbX = useTransform(
		position,
		(value) => 8 + Math.max(0, trackWidth - 20) * (value / 100),
	);
	const fillX = useTransform(position, (value) =>
		value >= 100 ? "0%" : `calc(${value - 100}% + ${14 - 0.16 * value}px)`,
	);
	const steps = Math.floor(Number(((max - min) / step).toFixed(6)));
	const ticks =
		showTicks && steps > 0 && steps <= 50
			? Array.from({ length: steps + 1 }, (_, index) =>
					Number((min + index * step).toFixed(6)),
				)
			: [];

	return (
		<div
			{...trackProps}
			className={cn(
				"relative flex h-10 w-full touch-none items-center overflow-hidden rounded-lg bg-muted",
				options.disabled
					? "pointer-events-none opacity-50"
					: "cursor-grab active:cursor-grabbing",
				className,
			)}
		>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-[2px] inset-y-0 overflow-hidden rounded-lg"
			>
				<m.div
					className="absolute inset-0 rounded-lg bg-foreground/15"
					style={{ x: fillX }}
				/>
			</div>
			<div className="pointer-events-none absolute inset-x-[10px] inset-y-0">
				{ticks.map((tick) => {
					const tickPercent = ((tick - min) / (max - min)) * 100;
					return (
						<span
							key={tick}
							className="absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/25"
							style={{ left: `${tickPercent}%` }}
						/>
					);
				})}
			</div>
			<m.div
				{...sliderProps}
				animate={reduce ? undefined : { scaleY: dragging ? 1.35 : 1 }}
				transition={{ type: "spring", stiffness: 500, damping: 14, mass: 0.7 }}
				className="absolute top-1/2 left-0 h-6 w-1 rounded-full bg-foreground outline-none ring-foreground/30 ring-inset focus-visible:ring-4"
				style={{ x: thumbX, y: "-50%" }}
			/>
		</div>
	);
}
