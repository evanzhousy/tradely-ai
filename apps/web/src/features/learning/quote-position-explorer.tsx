import {
	ToggleGroup,
	ToggleGroupItem,
} from "@tradely/ui/components/toggle-group";
import { animate, useMotionValue, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useId, useState } from "react";
import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import {
	instantTransition,
	lessonTransition,
	useLessonMotion,
} from "./lesson-motion";

export function QuotePositionExplorer({
	quote,
	locale,
}: {
	quote: NonNullable<LearningStepView["quote"]>;
	locale: Locale;
}) {
	const text = (en: string, zh: string) => (locale === "zh" ? zh : en);
	const id = useId();
	const enabled = useLessonMotion();
	const [target, setTarget] = useState(0.5);
	const position = useMotionValue(0.5);
	const x = useTransform(position, [0, 1], [24, 296]);
	const price = useTransform(position, (at) =>
		(quote.bid + (quote.ask - quote.bid) * at).toLocaleString(locale, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 3,
		}),
	);
	useEffect(() => {
		if (!enabled) {
			position.set(target);
			return;
		}
		const animation = animate(position, target, lessonTransition);
		return () => animation.stop();
	}, [target, enabled, position]);
	const caseFraction =
		quote.ask > quote.bid
			? Math.max(
					0,
					Math.min(1, (quote.trade - quote.bid) / (quote.ask - quote.bid)),
				)
			: 0.5;
	return (
		<section className="flex min-w-0 flex-col gap-3" aria-labelledby={id}>
			<h4 id={id} className="font-medium text-sm">
				{text("Explore bid, midpoint, and ask", "探索买价、中点和卖价")}
			</h4>
			<ToggleGroup
				value={[String(target)]}
				aria-label={text("Hypothetical execution position", "假设成交位置")}
				onValueChange={(values) => {
					if (values[0]) setTarget(Number(values[0]));
				}}
			>
				<ToggleGroupItem value="0">{text("Bid", "买价")}</ToggleGroupItem>
				<ToggleGroupItem value="0.5">
					{text("Midpoint", "中点")}
				</ToggleGroupItem>
				<ToggleGroupItem value="1">{text("Ask", "卖价")}</ToggleGroupItem>
			</ToggleGroup>
			<svg viewBox="0 0 320 92" className="w-full max-w-xl" aria-hidden="true">
				<path
					d="M24 42H296 M24 34V50 M160 34V50 M296 34V50"
					fill="none"
					stroke="var(--border)"
					strokeWidth="2"
				/>
				<path
					d={`M${24 + caseFraction * 272} 20v12`}
					stroke="var(--foreground)"
					strokeWidth="3"
				/>
				{enabled ? (
					<m.circle
						cx={x}
						cy={42}
						r={7}
						fill="var(--chart-1)"
						initial={false}
						transition={instantTransition}
						data-quote-marker
					/>
				) : (
					<circle
						cx={24 + target * 272}
						cy={42}
						r={7}
						fill="var(--chart-1)"
						data-quote-marker
					/>
				)}

				<text x="24" y="76" fontSize="12" fill="var(--foreground)">
					{"$"}
					{quote.bid.toFixed(2)}
				</text>
				<text
					x="296"
					y="76"
					textAnchor="end"
					fontSize="12"
					fill="var(--foreground)"
				>
					{"$"}
					{quote.ask.toFixed(2)}
				</text>
			</svg>
			<p className="text-sm tabular-nums" data-hypothetical-price>
				{text("Illustrative price: ", "示例价格：")}
				{"$"}
				{enabled ? (
					<m.span>{price}</m.span>
				) : (
					<span>
						{(quote.bid + (quote.ask - quote.bid) * target).toLocaleString(
							locale,
							{ minimumFractionDigits: 2, maximumFractionDigits: 3 },
						)}
					</span>
				)}
			</p>
			<p className="text-muted-foreground text-xs">
				{text(
					"The moving dot is a what-if example. The fixed tick marks the case execution at ",
					"移动圆点是假设示例，固定刻线标出案例成交价格 ",
				)}
				{"$"}
				{quote.trade.toFixed(2)}
				{text(
					". These controls change no evidence or answers and cannot repair missing quote timing.",
					"。这些控件不会改变证据或答案，也无法补足缺失的报价时间。",
				)}
			</p>
		</section>
	);
}
