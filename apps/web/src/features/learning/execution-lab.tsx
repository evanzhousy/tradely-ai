import { Button } from "@tradely/ui/components/button";
import { Field, FieldLabel } from "@tradely/ui/components/field";
import {
	NativeSelect,
	NativeSelectOption,
} from "@tradely/ui/components/native-select";
import { useEffect, useId, useRef, useState } from "react";
import { REPLAY_RATES } from "@/domain/learning/replay";
import type { Locale } from "@/i18n/messages";
import { ChangeHighlight } from "./lesson-motion";
import { useLearningReplay } from "./use-learning-replay";

const timeline = {
	replay: {
		durationMs: 10000,
		openMinute: 0,
		closeMinute: 4,
		frames: [0, 0.25, 0.5, 0.75, 1].map((position) => ({ position })),
	},
};

/** A stated toy matching sequence, not a market feed or an assessment mutation. */
export function ExecutionLab({
	locale,
	optionType = "CALL",
	incoming = "buy",
	mode = "counterparties",
}: {
	locale: Locale;
	optionType?: "CALL" | "PUT";
	incoming?: "buy" | "sell";
	mode?: "quote" | "counterparties" | "side" | "sentiment";
}) {
	const host = useRef<HTMLElement>(null);
	const replay = useLearningReplay(timeline, host, 0);
	const touched = useRef(false);
	const id = useId();
	const [buyer, setBuyer] = useState(incoming === "buy");
	const [type, setType] = useState(optionType);
	const [orderSize, setOrderSize] = useState(
		mode === "counterparties" ? 40 : 10,
	);
	const text = (en: string, zh: string) => (locale === "zh" ? zh : en);
	useEffect(() => {
		if (replay.visible && !replay.reducedMotion && !touched.current) {
			touched.current = true;
			replay.play();
		}
	}, [replay.visible, replay.reducedMotion, replay.play]);
	const phase = Math.min(4, Math.floor(replay.position * 4 + 0.00001));
	const fillSize = Math.min(orderSize, buyer ? 30 : 40);
	const remainder = orderSize - fillSize;
	const canceledSize = Math.min(5, (buyer ? 30 : 40) - fillSize);
	const filled = phase >= 2;
	const canceled = phase >= 3;
	const stages = [
		text("Quote", "报价"),
		text("Order", "订单"),
		text("One fill", "一笔成交"),
		text(
			remainder
				? "Remainder"
				: canceledSize
					? "Cancellation"
					: "Book after fill",
			remainder ? "未成交余量" : canceledSize ? "取消" : "成交后挂单",
		),
		text("Compare", "比较"),
	];
	const amount = filled ? fillSize : 0;
	const price = buyer ? 2.1 : 2;
	const labels = [
		text(
			"Resting buyers bid $2.00 for 40 contracts; resting sellers offer $2.10 for 30. No trade yet.",
			"买方挂单 $2.00 买 40 张，卖方挂单 $2.10 卖 30 张，尚未成交。",
		),
		buyer
			? text(
					`An incoming buyer can pay $2.10 for ${orderSize} contracts. The limit is marketable.`,
					`新买方愿以 $2.10 买 ${orderSize} 张，此限价可以立即成交。`,
				)
			: text(
					`An incoming seller can accept $2.00 for ${orderSize} contracts. The resting buyer is the counterparty.`,
					`新卖方愿以 $2.00 卖 ${orderSize} 张，挂单买方是对手。`,
				),
		buyer
			? text(
					`Buyer buys at ask; resting seller sells at the SAME ask. One print: ${fillSize} contracts.`,
					`买方买在卖价，挂单卖方也卖在同一卖价。一笔成交：${fillSize} 张。`,
				)
			: text(
					`Seller sells at bid; resting buyer buys at the SAME bid. One print: ${fillSize} contracts.`,
					`卖方卖在买价，挂单买方也买在同一买价。一笔成交：${fillSize} 张。`,
				),
		remainder
			? text(
					`${remainder} requested contracts remain unfilled. No further eligible liquidity exists at this limit.`,
					`${remainder} 张请求仍未成交，此限价没有更多合格流动性。`,
				)
			: canceledSize
				? text(
						`${canceledSize} unfilled resting contracts are canceled. Quote size falls; executed volume stays at ${fillSize}.`,
						`${canceledSize} 张未成交挂单被取消，报价量下降，成交量仍为 ${fillSize}。`,
					)
				: text(
						`All ${fillSize} contracts at this opposing quote were filled. No resting quantity remains there to cancel.`,
						`对手方该报价的 ${fillSize} 张全部成交，没有剩余挂单可取消。`,
					),
		mode === "sentiment"
			? text(
					"Quote size, executed size, aggressor and inferred sentiment are separate facts or interpretations. No opening/closing or full strategy is supplied.",
					"报价数量、成交数量、主动方与推断情绪是不同事实或解读。未提供开平仓或完整策略。",
				)
			: text(
					"Quote size and executed size differ. Both counterparties participate in one print. Only the supplied order sequence identifies which party arrived first.",
					"报价数量与成交数量不同，双方参与同一笔成交。只有给定订单序列才能识别谁先挂单。",
				),
	];
	const act = (action: () => void) => {
		touched.current = true;
		action();
	};
	return (
		<section
			ref={host}
			className="flex flex-col gap-4 rounded-xl bg-muted/30 p-4"
			aria-label={text("Order to execution lab", "订单到成交实验")}
		>
			<div className="flex flex-wrap gap-3">
				<Field>
					<FieldLabel htmlFor={`${id}-incoming`}>
						{text("Incoming order", "主动订单")}
					</FieldLabel>
					<NativeSelect
						id={`${id}-incoming`}
						value={buyer ? "buy" : "sell"}
						onChange={(event) =>
							act(() => {
								setBuyer(event.target.value === "buy");
								replay.seek(0);
							})
						}
					>
						<NativeSelectOption value="buy">
							{text("Buyer takes ask", "买方接受卖价")}
						</NativeSelectOption>
						<NativeSelectOption value="sell">
							{text("Seller hits bid", "卖方接受买价")}
						</NativeSelectOption>
					</NativeSelect>
				</Field>
				<Field>
					<FieldLabel htmlFor={`${id}-size`}>
						{text("Requested contracts", "请求张数")}
					</FieldLabel>
					<NativeSelect
						id={`${id}-size`}
						value={orderSize}
						onChange={(event) =>
							act(() => {
								setOrderSize(Number(event.target.value));
								replay.seek(0);
							})
						}
					>
						{[10, 20, 40, 50].map((size) => (
							<NativeSelectOption key={size} value={size}>
								{size}
							</NativeSelectOption>
						))}
					</NativeSelect>
				</Field>
				{mode === "sentiment" ? (
					<Field>
						<FieldLabel htmlFor={`${id}-type`}>
							{text("Option type", "期权类型")}
						</FieldLabel>
						<NativeSelect
							id={`${id}-type`}
							value={type}
							onChange={(event) =>
								act(() => setType(event.target.value as "CALL" | "PUT"))
							}
						>
							<NativeSelectOption value="CALL">
								{text("Call", "看涨")}
							</NativeSelectOption>
							<NativeSelectOption value="PUT">
								{text("Put", "看跌")}
							</NativeSelectOption>
						</NativeSelect>
					</Field>
				) : null}
			</div>
			<div className="grid grid-cols-2 gap-3 text-center">
				<div className="rounded-xl bg-background p-4">
					<p>{text("Resting buyer · BID", "挂单买方 · 买价")}</p>
					<p className="font-mono text-2xl">
						$2.00 ×{" "}
						<ChangeHighlight
							value={
								40 -
								(!buyer && filled ? fillSize : 0) -
								(!buyer && canceled ? canceledSize : 0)
							}
						>
							{40 -
								(!buyer && filled ? fillSize : 0) -
								(!buyer && canceled ? canceledSize : 0)}
						</ChangeHighlight>
					</p>
				</div>
				<div className="rounded-xl bg-background p-4">
					<p>{text("Resting seller · ASK", "挂单卖方 · 卖价")}</p>
					<p className="font-mono text-2xl">
						$2.10 ×{" "}
						<ChangeHighlight
							value={
								30 -
								(buyer && filled ? fillSize : 0) -
								(buyer && canceled ? canceledSize : 0)
							}
						>
							{30 -
								(buyer && filled ? fillSize : 0) -
								(buyer && canceled ? canceledSize : 0)}
						</ChangeHighlight>
					</p>
				</div>
			</div>
			<div
				className="relative h-10 overflow-hidden rounded-lg bg-muted"
				aria-hidden="true"
			>
				<div
					className="absolute top-2 left-[5%] w-full"
					style={{
						transform: `translateX(${(buyer ? Math.max(0, Math.min(1, (replay.position - 0.25) * 4)) : 1 - Math.max(0, Math.min(1, (replay.position - 0.25) * 4))) * 65}%)`,
						opacity: phase === 1 ? 1 : 0,
					}}
				>
					<span className="rounded bg-primary px-2 font-mono text-primary-foreground text-sm">
						{orderSize} {text("contracts", "张")}
					</span>
				</div>
				{filled ? (
					<p className="p-2 text-center font-mono text-sm">
						{text(
							`One completed print · ${fillSize} contracts`,
							`一笔已完成成交 · ${fillSize} 张`,
						)}
					</p>
				) : null}
			</div>
			<p
				className="min-h-16 text-sm leading-relaxed"
				aria-live={replay.clock.playing ? "off" : "polite"}
			>
				{labels[phase]}
			</p>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-live="off">
				<div>
					<p className="text-muted-foreground text-xs">
						{text("Trade count", "成交笔数")}
					</p>
					<p className="font-mono text-xl" data-execution-count>
						{filled ? 1 : 0}
					</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{text("Executed contracts", "成交张数")}
					</p>
					<p className="font-mono text-xl" data-executed-size>
						{amount}
					</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{text("Execution premium", "成交权利金")}
					</p>
					<p className="font-mono text-xl">
						${(amount * price * 100).toLocaleString(locale)}
					</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{mode === "sentiment"
							? text("Inferred flow label", "推断成交流标签")
							: mode === "side"
								? text("Execution side", "成交位置")
								: text("Execution price", "成交价")}
					</p>
					<p className="text-sm" data-flow-classification>
						{!filled
							? "—"
							: mode === "sentiment"
								? (type === "CALL") === buyer
									? text("Bullish", "看涨")
									: text("Bearish", "看跌")
								: mode === "side"
									? buyer
										? "ASK"
										: "BID"
									: `$${price.toFixed(2)}`}
					</p>
				</div>
			</div>
			<div className="flex flex-wrap gap-2">
				<Button
					onClick={() => act(replay.clock.playing ? replay.pause : replay.play)}
				>
					{replay.clock.playing
						? text("Pause", "暂停")
						: text("Play / replay", "播放 / 重播")}
				</Button>
				<NativeSelect
					aria-label={text("Playback speed", "播放速度")}
					value={replay.clock.rate}
					onChange={(event) =>
						act(() => replay.setRate(Number(event.target.value)))
					}
				>
					{REPLAY_RATES.map((rate) => (
						<NativeSelectOption key={rate} value={rate}>
							{rate}×
						</NativeSelectOption>
					))}
				</NativeSelect>
			</div>
			<Field>
				<FieldLabel htmlFor={`${id}-position`}>
					{text("Sequence position", "序列位置")}
				</FieldLabel>
				<input
					id={`${id}-position`}
					className="h-11 w-full accent-primary"
					type="range"
					min="0"
					max="100"
					value={Math.round(replay.position * 100)}
					onChange={(event) =>
						act(() => replay.seek(Number(event.target.value) / 100))
					}
					aria-valuetext={stages[phase]}
				/>
			</Field>
			<div className="flex flex-wrap gap-2">
				{stages.map((label, index) => (
					<Button
						variant="outline"
						size="sm"
						key={label}
						onClick={() => act(() => replay.seek(index / 4))}
					>
						{index + 1}. {label}
					</Button>
				))}
			</div>
			<p className="font-mono text-sm">
				{filled
					? `${fillSize} × $${price.toFixed(2)} × 100 = $${(fillSize * price * 100).toLocaleString(locale)}`
					: text(
							"No execution premium before a fill.",
							"成交前没有执行权利金。",
						)}
			</p>
			<p className="text-muted-foreground text-xs">
				{text(
					"Editable worked illustration. Later practice cases have their own fixed evidence. Multiplier 100; only the shown order, fill and cancellation occur. This replay changes no answers.",
					"可编辑教学示例，后续练习案例有各自固定证据。乘数 100，只发生所示订单、成交与取消。回放不改变答案。",
				)}
			</p>
			{replay.reducedMotion ? (
				<p className="text-sm">
					{text(
						"Reduced motion: playback uses discrete steps.",
						"减少动态效果：播放采用离散步骤。",
					)}
				</p>
			) : null}
		</section>
	);
}
