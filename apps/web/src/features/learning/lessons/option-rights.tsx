import { FieldGroup } from "@tradely/ui/components/field";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import {
	type Contract,
	type Copy,
	contractLabel,
	OCT_100_CALL,
	optionQuote,
	pick,
	signedUsd,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { defineScene, type Phase } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

type Right = "call" | "put";
type Side = "long" | "short";

const PUT_95: Contract = { expiry: "oct18", strike: 95, right: "put" };
const contractFor = (right: Right) =>
	right === "call" ? OCT_100_CALL : PUT_95;

// ——— Scene 1: rights and obligations ———

type CellState = { right: Right; side: Side };

const cellCopy: Record<
	Right,
	Record<
		Side,
		{ duty: Copy; terms: Copy; brief: Copy; when: Copy; premium: Copy }
	>
> = {
	call: {
		long: {
			duty: ["Right to buy", "有权买入"],
			terms: ["100 ALFA at $100", "按 $100 买 100 股"],
			brief: ["100 at $100", "100 股 · $100"],
			when: ["if you exercise", "若你行权"],
			premium: ["paid the premium", "已支付权利金"],
		},
		short: {
			duty: ["Must sell", "必须卖出"],
			terms: ["100 ALFA at $100", "按 $100 卖 100 股"],
			brief: ["100 at $100", "100 股 · $100"],
			when: ["if you're assigned", "若你被指派"],
			premium: ["received premium", "已收取权利金"],
		},
	},
	put: {
		long: {
			duty: ["Right to sell", "有权卖出"],
			terms: ["100 ALFA at $95", "按 $95 卖 100 股"],
			brief: ["100 at $95", "100 股 · $95"],
			when: ["if you exercise", "若你行权"],
			premium: ["paid the premium", "已支付权利金"],
		},
		short: {
			duty: ["Must buy", "必须买入"],
			terms: ["100 ALFA at $95", "按 $95 买 100 股"],
			brief: ["100 at $95", "100 股 · $95"],
			when: ["if you're assigned", "若你被指派"],
			premium: ["received premium", "已收取权利金"],
		},
	},
};

const CELL = 96;

function matrixLayout(width: number) {
	const narrow = width < 520;
	const labelWidth = narrow ? 0 : 60;
	const rowLabel = narrow ? 22 : 0;
	const top = 32;
	const cellWidth = (width - 16 - labelWidth - 10) / 2;
	return {
		narrow,
		cellWidth,
		colX: (j: number) => 8 + labelWidth + j * (cellWidth + 10),
		rowY: (i: number) => top + i * (rowLabel + CELL + 12) + rowLabel,
		height: top + 2 * (rowLabel + CELL + 12) - 4,
	};
}

function MatrixStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: CellState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const layout = matrixLayout(width);
	const rights: Right[] = ["call", "put"];
	const sides: Side[] = ["long", "short"];
	return (
		<g>
			{sides.map((side, j) => (
				<Label
					key={side}
					x={layout.colX(j) + layout.cellWidth / 2}
					y={18}
					anchor="middle"
					tone="muted"
				>
					{side === "long"
						? t(["Long · holder", "多头 · 持有人"])
						: t(["Short · writer", "空头 · 义务方"])}
				</Label>
			))}
			{rights.map((right, i) => (
				<Label
					key={right}
					x={8}
					y={layout.narrow ? layout.rowY(i) - 8 : layout.rowY(i) + CELL / 2 + 5}
					tone={layout.narrow ? "small" : "muted"}
				>
					{layout.narrow
						? right === "call"
							? t(["Call: the right to buy", "看涨：买入的权利"])
							: t(["Put: the right to sell", "看跌：卖出的权利"])
						: right === "call"
							? t(["Call", "看涨"])
							: t(["Put", "看跌"])}
				</Label>
			))}
			{rights.map((right, i) =>
				sides.map((side, j) => {
					const x = layout.colX(j);
					const y = layout.rowY(i);
					const active = state.right === right && state.side === side;
					const copy = cellCopy[right][side];
					return (
						<m.g
							key={`${right}-${side}`}
							initial={false}
							animate={{ opacity: active ? 1 : 0.5 }}
							transition={motion.fade}
						>
							<rect
								x={x}
								y={y}
								width={layout.cellWidth}
								height={CELL}
								rx={12}
								className={active ? "wt-focus-shape" : "wt-panel-shape"}
							/>
							<Label
								x={x + 14}
								y={y + 30}
								tone={layout.narrow ? undefined : "strong"}
								className={active ? "wt-accent" : undefined}
							>
								{t(copy.duty)}
							</Label>
							<Label x={x + 14} y={y + 54}>
								{t(layout.narrow ? copy.brief : copy.terms)}
							</Label>
							<Label x={x + 14} y={y + 73} tone="small">
								{t(copy.when)}
							</Label>
							<Label x={x + 14} y={y + 88} tone="small">
								{t(copy.premium)}
							</Label>
						</m.g>
					);
				}),
			)}
		</g>
	);
}

function MatrixView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: CellState;
	explore: CellState | null;
	setExplore: (next: CellState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const long = shown.side === "long";
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Call and put against long and short, with the right or obligation each position carries",
						"看涨、看跌与多头、空头组成的方格，以及每个位置带来的权利或义务",
					])}
					height={(width) => matrixLayout(width).height}
				>
					{(width) => (
						<MatrixStage width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={[
				{
					id: "contract",
					label: t(["Contract", "合约"]),
					value: t(contractLabel(contractFor(shown.right))),
				},
				{
					id: "position",
					label: t(["Your position", "你的持仓"]),
					value: long
						? t(["Long 1", "多头 1 张"])
						: t(["Short 1", "空头 1 张"]),
					note: long ? t(["holder", "持有人"]) : t(["writer", "义务方"]),
				},
				{
					id: "decides",
					label: t(["Who decides to exercise", "谁决定是否行权"]),
					value: long ? t(["You do", "你自己"]) : t(["The holder", "持有人"]),
					note: long
						? t(["or let it expire", "也可以任其到期"])
						: t(["you may be assigned", "你可能被指派"]),
				},
			]}
			controls={
				explore ? (
					<FieldGroup>
						<ChoiceField
							label={t(["Type", "类型"])}
							value={explore.right}
							options={[
								["call", t(["Call", "看涨"])],
								["put", t(["Put", "看跌"])],
							]}
							onChange={(right) => setExplore({ ...explore, right })}
						/>
						<ChoiceField
							label={t(["Side", "方向"])}
							value={explore.side}
							options={[
								["long", t(["Long · holder", "多头 · 持有人"])],
								["short", t(["Short · writer", "空头 · 义务方"])],
							]}
							onChange={(side) => setExplore({ ...explore, side })}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"Call or put names the right; long or short names your side of it. Buying a call does not buy shares: it buys the right to buy them later at the strike. A long put and a short call both gain when ALFA falls, but only the writer carries an obligation.",
						"看涨或看跌说明是什么权利；多头或空头说明你站在哪一方。买入看涨并没有买入股票，而是买到了日后按行权价买入的权利。看跌多头和看涨空头都在 ALFA 下跌时获利，但只有义务方承担义务。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: open and close ———

type Trade = "buy" | "sell";
type TrackState = { from: number; trade: Trade | null };

const after = ({ from, trade }: TrackState) =>
	trade === "buy" ? from + 1 : trade === "sell" ? from - 1 : from;

function tradeCopy(from: number, trade: Trade): Copy {
	if (trade === "buy")
		return from < 0
			? ["Buy to close", "买入平仓"]
			: ["Buy to open", "买入开仓"];
	return from > 0
		? ["Sell to close", "卖出平仓"]
		: ["Sell to open", "卖出开仓"];
}

function positionCopy(position: number): Copy {
	if (position > 0) return [`Long ${position} call`, `多头 ${position} 张`];
	if (position < 0) return [`Short ${-position} call`, `空头 ${-position} 张`];
	return ["Flat", "空仓"];
}

const TRACK_HEIGHT = 186;

function TrackStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: TrackState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const left = 30;
	const right = width - 30;
	const x = (position: number) => left + ((position + 2) / 4) * (right - left);
	const to = after(state);
	const axis = 100;
	return (
		<g>
			<Label x={8} y={18} tone="muted">
				{t([
					"Your position in the Oct 18 100 call",
					"你在 10月18日 100 看涨上的持仓",
				])}
			</Label>
			<rect
				x={x(-2)}
				y={axis - 18}
				width={x(0) - x(-2)}
				height={36}
				className="wt-short-soft"
			/>
			<rect
				x={x(0)}
				y={axis - 18}
				width={x(2) - x(0)}
				height={36}
				className="wt-long-soft"
			/>
			<Label x={x(-1)} y={axis - 28} anchor="middle" tone="small">
				{t(["short: you owe", "空头：你承担义务"])}
			</Label>
			<Label x={x(1)} y={axis - 28} anchor="middle" tone="small">
				{t(["long: you hold", "多头：你持有权利"])}
			</Label>
			<path d={`M${left} ${axis}H${right}`} className="wt-axis" />
			{[-2, -1, 0, 1, 2].map((position) => (
				<g key={position}>
					<path
						d={`M${x(position)} ${axis - 6}V${axis + 6}`}
						className="wt-axis"
					/>
					<Label x={x(position)} y={axis + 34} anchor="middle" tone="small">
						{position > 0 ? `+${position}` : String(position)}
					</Label>
				</g>
			))}
			<AnimatePresence initial={false}>
				{state.trade ? (
					<m.g
						key={`${state.from}-${state.trade}`}
						initial={motion.enabled ? { opacity: 0 } : false}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={motion.fade}
					>
						<circle cx={x(state.from)} cy={axis} r={9} className="wt-ghost" />
						<m.path
							d={`M${x(state.from)} ${axis + 50}H${x(to)}`}
							className="wt-bracket"
							initial={motion.enabled ? { pathLength: 0 } : false}
							animate={{ pathLength: 1 }}
							transition={motion.move}
						/>
						<Label
							x={(x(state.from) + x(to)) / 2}
							y={axis + 72}
							anchor="middle"
							tone="accent"
						>
							{t(tradeCopy(state.from, state.trade))}
						</Label>
					</m.g>
				) : null}
			</AnimatePresence>
			<m.circle
				cy={axis}
				r={10}
				className="wt-chip"
				initial={false}
				animate={{ cx: x(to) }}
				transition={motion.move}
			/>
		</g>
	);
}

function TrackView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: TrackState;
	explore: TrackState | null;
	setExplore: (next: TrackState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Your position on a line from short to long, and the trade that moves it",
						"你的持仓在从空头到多头的轴上的位置，以及改变它的交易",
					])}
					height={TRACK_HEIGHT}
				>
					{(width) => (
						<TrackStage width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={[
				{
					id: "before",
					label: t(["Before", "交易前"]),
					value: t(positionCopy(shown.from)),
				},
				{
					id: "trade",
					label: t(["Trade", "交易"]),
					value: shown.trade ? t(tradeCopy(shown.from, shown.trade)) : "—",
				},
				{
					id: "after",
					label: t(["After", "交易后"]),
					value: t(positionCopy(after(shown))),
				},
			]}
			controls={
				explore ? (
					<FieldGroup>
						<ChoiceField
							label={t(["You start", "起始持仓"])}
							value={String(explore.from) as "-1" | "0" | "1"}
							options={[
								["-1", t(["Short 1", "空头 1 张"])],
								["0", t(["Flat", "空仓"])],
								["1", t(["Long 1", "多头 1 张"])],
							]}
							onChange={(from) =>
								setExplore({ ...explore, from: Number(from) })
							}
						/>
						<ChoiceField
							label={t(["You trade", "你的交易"])}
							value={explore.trade ?? "buy"}
							options={[
								["buy", t(["Buy 1", "买入 1 张"])],
								["sell", t(["Sell 1", "卖出 1 张"])],
							]}
							onChange={(trade) => setExplore({ ...explore, trade })}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"Whether a buy or a sell opens or closes depends on what you already hold. A trade print shows only the price and size, so it cannot tell you which it was. Closing also differs from exercising: it ends your position without buying or selling any shares.",
						"买入或卖出是开仓还是平仓，取决于你原本持有什么。成交记录只显示价格和数量，无法据此判断。平仓也不同于行权：它结束你的持仓，并不涉及买卖股票。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: exercise and assignment ———

type AssignStep = "hold" | "exercise" | "assign" | "settle";
const assignSteps: readonly AssignStep[] = [
	"hold",
	"exercise",
	"assign",
	"settle",
];
type AssignState = { right: Right; step: AssignStep };

/** Everyone short the contract. Ben sold the learner theirs; the clearinghouse picks Eli. */
const writers = [
	{ id: "ben", name: "Ben", short: 1 },
	{ id: "cara", name: "Cara", short: 2 },
	{ id: "eli", name: "Eli", short: 3 },
] as const;
const ASSIGNED = "eli";

/** At expiry ALFA closes $7 below the put's strike, or $8 above the call's. Cents. */
function exerciseCase(right: Right) {
	const contract = contractFor(right);
	const close = right === "put" ? 88 : 108;
	const premium = optionQuote(contract).ask * 100;
	const cash = contract.strike * 100 * 100;
	const gain = Math.abs(cash - close * 100 * 100);
	return { contract, close, premium, cash, gain, net: gain - premium };
}

function assignLayout(width: number) {
	if (width < 560) {
		const cardWidth = (width - 32) / 3;
		return {
			narrow: true,
			you: { x: 8, y: 8, w: width - 16, h: 80 },
			house: { x: width / 2 - 76, y: 124, w: 152, h: 48 },
			writer: (i: number) => ({
				x: 8 + i * (cardWidth + 8),
				y: 208,
				w: cardWidth,
				h: 50,
			}),
			settle: 290,
			height: 330,
		};
	}
	const cardWidth = Math.min(196, width * 0.29);
	return {
		narrow: false,
		you: { x: 8, y: 24, w: cardWidth, h: 124 },
		house: { x: width / 2 - 68, y: 60, w: 136, h: 52 },
		writer: (i: number) => ({
			x: width - cardWidth - 8,
			y: 24 + i * 43,
			w: cardWidth,
			h: 38,
		}),
		settle: 186,
		height: 236,
	};
}

function AssignStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: AssignState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const layout = assignLayout(width);
	const c = exerciseCase(state.right);
	const put = state.right === "put";
	const step = assignSteps.indexOf(state.step);
	const { you, house } = layout;
	const eli = layout.writer(writers.findIndex(({ id }) => id === ASSIGNED));
	const strike = `$${c.contract.strike}`;
	const youLines =
		step === 0
			? [
					t([`paid ${usd(c.premium, 0)}`, `已付 ${usd(c.premium, 0)}`]),
					put
						? t([`may sell 100 at ${strike}`, `可按 ${strike} 卖出 100 股`])
						: t([`may buy 100 at ${strike}`, `可按 ${strike} 买入 100 股`]),
				]
			: step < 3
				? [
						t(["exercise notice sent", "已发出行权通知"]),
						t([`ALFA closed at $${c.close}`, `ALFA 收于 $${c.close}`]),
					]
				: [
						put
							? t([`sold 100 at ${strike}`, `按 ${strike} 卖出 100 股`])
							: t([`bought 100 at ${strike}`, `按 ${strike} 买入 100 股`]),
						t([
							`${signedUsd(c.gain, 0)} vs $${c.close}`,
							`较 $${c.close} ${signedUsd(c.gain, 0)}`,
						]),
					];
	const houseLine = [
		t(["no notice yet", "尚无行权通知"]),
		t(["must find a writer", "需要找到义务方"]),
		t(["picks one at random", "随机选出一位"]),
		t(["settles the exercise", "完成行权交收"]),
	][step];
	/** Narrow writer cards get the short wording. */
	const writerLine = (id: string, compact: boolean) => {
		if (id === ASSIGNED && step >= 3) {
			if (compact)
				return put
					? t(["bought 100", "买入 100 股"])
					: t(["sold 100", "卖出 100 股"]);
			return put
				? t([`bought 100 at ${strike}`, `按 ${strike} 买入`])
				: t([`sold 100 at ${strike}`, `按 ${strike} 卖出`]);
		}
		if (id === ASSIGNED && step === 2) return t(["assigned", "被指派"]);
		if (id === "ben") {
			if (compact) return t(["your seller", "卖给你的"]);
			return put
				? t(["sold you the put", "卖给你这张看跌"])
				: t(["sold you the call", "卖给你这张看涨"]);
		}
		return "";
	};
	const notice = layout.narrow
		? `M${width / 2} ${you.y + you.h + 6}V${house.y - 8}l-5 -7m5 7l5 -7`
		: `M${you.x + you.w + 8} ${house.y + house.h / 2}H${house.x - 8}l-7 -5m7 5l-7 5`;
	const pickFrom = layout.narrow
		? { x: width / 2, y: house.y + house.h + 6 }
		: { x: house.x + house.w + 8, y: house.y + house.h / 2 };
	const pickTo = layout.narrow
		? { x: eli.x + eli.w / 2, y: eli.y - 8 }
		: { x: eli.x - 8, y: eli.y + eli.h / 2 };
	const pickPath = layout.narrow
		? `M${pickFrom.x} ${pickFrom.y}V${(pickFrom.y + pickTo.y) / 2}H${pickTo.x}V${pickTo.y}l-5 -7m5 7l5 -7`
		: `M${pickFrom.x} ${pickFrom.y}H${(pickFrom.x + pickTo.x) / 2}V${pickTo.y}H${pickTo.x}l-7 -5m7 5l-7 5`;
	// Settlement: a put sends shares to the writer and cash back; a call the reverse.
	const flows = [
		{
			id: "shares",
			kind: "shares",
			toWriter: put,
			label: t(["100 shares", "100 股"]),
		},
		{ id: "cash", kind: "cash", toWriter: !put, label: usd(c.cash, 0) },
	] as const;
	return (
		<g>
			<rect
				x={you.x}
				y={you.y}
				width={you.w}
				height={you.h}
				rx={12}
				className="wt-focus-shape"
			/>
			<Label x={you.x + 14} y={you.y + 26} tone="strong">
				{t(["You", "你"])}
			</Label>
			<Label
				x={layout.narrow ? you.x + 64 : you.x + 14}
				y={layout.narrow ? you.y + 25 : you.y + 48}
				tone="muted"
			>
				{t(["long 1 ", "多头 1 张 "])}
				{t(contractLabel(c.contract, false))}
			</Label>
			{youLines.map((line, row) => (
				<m.text
					key={`${state.right}-${line}`}
					x={you.x + 14}
					y={you.y + (layout.narrow ? 50 : 78) + row * 22}
					initial={motion.enabled ? { opacity: 0 } : false}
					animate={{ opacity: 1 }}
					transition={motion.after(0.3)}
				>
					{line}
				</m.text>
			))}
			<rect
				x={house.x}
				y={house.y}
				width={house.w}
				height={house.h}
				rx={10}
				className={
					step === 1 || step === 2 ? "wt-focus-shape" : "wt-panel-shape"
				}
			/>
			<Label x={house.x + house.w / 2} y={house.y + 21} anchor="middle">
				{t(["Clearinghouse", "清算机构"])}
			</Label>
			<Label
				x={house.x + house.w / 2}
				y={house.y + 39}
				anchor="middle"
				tone="small"
			>
				{houseLine}
			</Label>
			<Label
				x={layout.narrow ? 8 : layout.writer(0).x}
				y={layout.writer(0).y - 9}
				tone="small"
			>
				{put
					? t(["Everyone short this put", "持有该看跌空头的人"])
					: t(["Everyone short this call", "持有该看涨空头的人"])}
			</Label>
			{writers.map((writer, i) => {
				const box = layout.writer(i);
				const picked = writer.id === ASSIGNED && step >= 2;
				const line = writerLine(writer.id, box.w < 130);
				return (
					<m.g
						key={writer.id}
						initial={false}
						animate={{ opacity: step >= 2 && !picked ? 0.45 : 1 }}
						transition={motion.fade}
					>
						<rect
							x={box.x}
							y={box.y}
							width={box.w}
							height={box.h}
							rx={10}
							className={picked ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<Label
							x={box.x + 10}
							y={box.y + box.h / 2 + (line ? -4 : 5)}
							tone={picked ? "accent" : undefined}
						>
							{writer.name}
							{box.w >= 130
								? t([` · short ${writer.short}`, ` · 空头 ${writer.short} 张`])
								: ""}
						</Label>
						{line ? (
							<Label x={box.x + 10} y={box.y + box.h / 2 + 13} tone="small">
								{line}
							</Label>
						) : null}
					</m.g>
				);
			})}
			{step >= 1 ? (
				<m.path
					key={`notice-${state.right}`}
					d={notice}
					className="wt-arrow wt-arrow-contract"
					initial={motion.enabled ? { pathLength: 0 } : false}
					animate={{ pathLength: 1 }}
					transition={motion.move}
				/>
			) : null}
			{step >= 2 ? (
				<m.path
					key={`pick-${state.right}`}
					d={pickPath}
					className="wt-arrow wt-arrow-contract"
					initial={motion.enabled ? { pathLength: 0 } : false}
					animate={{ pathLength: 1 }}
					transition={motion.move}
				/>
			) : null}
			<AnimatePresence initial={false}>
				{step >= 3
					? flows.map((flow, row) => {
							const y = layout.settle + row * 30;
							if (layout.narrow) {
								return (
									<m.g
										key={`${state.right}-${flow.id}`}
										initial={motion.enabled ? { opacity: 0, y: -6 } : false}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0 }}
										transition={motion.after(0.15 * row)}
									>
										<Label x={8} y={y}>
											{flow.label}
										</Label>
										<Label x={width - 120} y={y} anchor="end" tone="muted">
											{t(["you", "你"])}
										</Label>
										<path
											d={
												flow.toWriter
													? `M${width - 110} ${y - 4}H${width - 40}l-6 -4m6 4l-6 4`
													: `M${width - 40} ${y - 4}H${width - 110}l6 -4m-6 4l6 4`
											}
											className={`wt-arrow wt-arrow-${flow.kind}`}
										/>
										<Label x={width - 8} y={y} anchor="end" tone="muted">
											Eli
										</Label>
									</m.g>
								);
							}
							const from = flow.toWriter ? you.x + 24 : eli.x + eli.w - 24;
							const to = flow.toWriter ? eli.x + eli.w - 24 : you.x + 24;
							const head = flow.toWriter ? -7 : 7;
							return (
								<m.g
									key={`${state.right}-${flow.id}`}
									initial={
										motion.enabled
											? { opacity: 0, x: flow.toWriter ? -24 : 24 }
											: false
									}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0 }}
									transition={motion.after(0.2 * row)}
								>
									<path
										d={`M${from} ${y}H${to}l${head} -5m${-head} 5l${head} 5`}
										className={`wt-arrow wt-arrow-${flow.kind}`}
									/>
									<Label x={width / 2} y={y - 8} anchor="middle">
										{flow.label}
									</Label>
								</m.g>
							);
						})
					: null}
			</AnimatePresence>
		</g>
	);
}

function AssignView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: AssignState;
	explore: AssignState | null;
	setExplore: (next: AssignState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const c = exerciseCase(shown.right);
	const step = assignSteps.indexOf(shown.step);
	const put = shown.right === "put";
	const strike = c.contract.strike;
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"You exercise, the clearinghouse assigns one writer at random, and shares and cash settle between you",
						"你行权，清算机构随机指派一位义务方，股票与现金在你们之间交收",
					])}
					height={(width) => assignLayout(width).height}
				>
					{(width) => (
						<AssignStage width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={[
				step >= 3
					? {
							id: "you",
							label: t(["You · holder", "你 · 持有人"]),
							value: signedUsd(c.net, 0),
							note: t([
								`${signedUsd(c.gain, 0)} exercise − ${usd(c.premium, 0)} premium`,
								`行权 ${signedUsd(c.gain, 0)} − 权利金 ${usd(c.premium, 0)}`,
							]),
							tone: "gain",
						}
					: {
							id: "you",
							label: t(["You · holder", "你 · 持有人"]),
							value:
								step === 0
									? t([
											`paid ${usd(c.premium, 0)}`,
											`已付 ${usd(c.premium, 0)}`,
										])
									: t(["exercised", "已行权"]),
							note:
								step === 0
									? t(["for the right", "买到这项权利"])
									: t(["waiting for assignment", "等待指派"]),
						},
				step >= 3
					? {
							id: "writer",
							label: t(["Assigned writer", "被指派的义务方"]),
							value: signedUsd(-c.gain, 0),
							note: put
								? t([
										`pays $${strike} for shares worth $${c.close}`,
										`以 $${strike} 买入价值 $${c.close} 的股票`,
									])
								: t([
										`delivers shares worth $${c.close} for $${strike}`,
										`以 $${strike} 交付价值 $${c.close} 的股票`,
									]),
							tone: "loss",
						}
					: step === 2
						? {
								id: "writer",
								label: t(["Assigned writer", "被指派的义务方"]),
								value: "Eli",
								note: t(["picked at random", "随机选出"]),
							}
						: {
								id: "writer",
								label: t(["Assigned writer", "被指派的义务方"]),
								value: t(["not chosen yet", "尚未选定"]),
								evidence: "unknown",
							},
				{
					id: "ben",
					label: t(["Ben, who sold it to you", "卖给你的 Ben"]),
					value:
						step >= 2
							? t(["not assigned", "未被指派"])
							: t(["short 1", "空头 1 张"]),
					note:
						step >= 2
							? t(["the pick is random", "指派是随机的"])
							: t(["one writer among several", "众多义务方之一"]),
				},
			]}
			controls={
				explore ? (
					<FieldGroup>
						<ChoiceField
							label={t(["Type", "类型"])}
							value={explore.right}
							options={[
								["put", t(["Put", "看跌"])],
								["call", t(["Call", "看涨"])],
							]}
							onChange={(right) => setExplore({ ...explore, right })}
						/>
						<ChoiceField
							label={t(["Step", "步骤"])}
							value={explore.step}
							options={[
								["hold", t(["Hold", "持有"])],
								["exercise", t(["Exercise", "行权"])],
								["assign", t(["Assign", "指派"])],
								["settle", t(["Settle", "交收"])],
							]}
							onChange={(step) => setExplore({ ...explore, step })}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<>
					<p>
						{t([
							"Every option trade clears through a central clearinghouse, so there is no fixed counterparty. When you exercise, it assigns the obligation to a clearing firm, which passes it to one of its customers who is short that contract, usually at random.",
							"每笔期权交易都通过中央清算机构清算，因此没有固定的交易对手。你行权时，清算机构把义务指派给一家清算会员，再由它分给持有该合约空头的某位客户，通常是随机的。",
						])}
					</p>
					<p>
						{t([
							"Exercising a put delivers 100 shares. If you don't own them, you end up short 100 shares and buy them back, here at $88, for the same $700.",
							"行使看跌期权需要交付 100 股。若你没有持股，就会变成 100 股空头，再以 $88 买回，同样获得 $700。",
						])}
					</p>
				</>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<CellState, CellState>({
		id: "rights",
		label: ["Rights", "权利"],
		title: [
			"The holder has the right; the writer has the obligation",
			"持有人拥有权利，义务方承担义务",
		],
		predict: {
			prompt: [
				"You are short one Oct 18 95 put. If you are assigned, what must you do?",
				"你持有 1 张 10月18日 95 看跌空头。如果被指派，你必须做什么？",
			],
			choices: [
				{
					id: "buy",
					label: ["Buy 100 ALFA at $95", "按 $95 买入 100 股 ALFA"],
				},
				{
					id: "sell",
					label: ["Sell 100 ALFA at $95", "按 $95 卖出 100 股 ALFA"],
				},
				{
					id: "choose",
					label: ["Nothing: it's my choice", "什么都不用做，由我决定"],
				},
			],
			answer: "buy",
			revealAt: 3,
			explain: [
				"The put's holder has the right to sell at $95. As its writer you take the other side: you must buy 100 shares at $95, whatever ALFA trades at.",
				"看跌持有人有权按 $95 卖出。作为义务方，你站在另一边：无论 ALFA 价格多少，都必须按 $95 买入 100 股。",
			],
		},
		beats: [
			{
				id: "long-call",
				label: ["Long call", "看涨多头"],
				caption: [
					"Buy the Oct 18 100 call and you are long: you hold the right to buy 100 ALFA at $100, and you decide whether to use it.",
					"买入 10月18日 100 看涨，你就是多头：你持有按 $100 买入 100 股 ALFA 的权利，并决定是否使用。",
				],
				state: { right: "call", side: "long" },
			},
			{
				id: "short-call",
				label: ["Short call", "看涨空头"],
				caption: [
					"Whoever wrote that call is short. They received the premium, and if assigned they must sell 100 ALFA at $100.",
					"写出这张看涨的人是空头。他们收取了权利金，被指派时必须按 $100 卖出 100 股 ALFA。",
				],
				state: { right: "call", side: "short" },
			},
			{
				id: "long-put",
				label: ["Long put", "看跌多头"],
				caption: [
					"A put turns the right around. The holder of the Oct 18 95 put may sell 100 ALFA at $95.",
					"看跌期权的权利方向相反。10月18日 95 看跌的持有人可按 $95 卖出 100 股 ALFA。",
				],
				state: { right: "put", side: "long" },
			},
			{
				id: "short-put",
				label: ["Short put", "看跌空头"],
				caption: [
					"Its writer must buy 100 ALFA at $95 if assigned, even when ALFA trades far below $95.",
					"它的义务方被指派时必须按 $95 买入 100 股 ALFA，即使 ALFA 远低于 $95。",
				],
				state: { right: "put", side: "short" },
			},
		],
		explore: {
			prompt: [
				"Pick a type and a side to see the right or obligation it carries.",
				"选择类型与方向，看看它带来的权利或义务。",
			],
			start: (last) => last,
			task: {
				kind: "reach",
				prompt: [
					"Find the position that must sell 100 ALFA shares if it is assigned.",
					"找出被指派时必须卖出 100 股 ALFA 的持仓。",
				],
				reached: (e) => e.right === "call" && e.side === "short",
				done: [
					"The writer of a call, short the call, must deliver: sell 100 ALFA at $100 when assigned, whatever ALFA trades at.",
					"看涨期权的义务方（看涨空头）必须交付：被指派时以 $100 卖出 100 股 ALFA，不论 ALFA 当时价格多少。",
				],
			},
		},
		View: MatrixView,
	}),
	defineScene<TrackState, TrackState>({
		id: "open-close",
		label: ["Open and close", "开仓与平仓"],
		title: [
			"The same buy or sell can open or close",
			"同样的买入或卖出，可能开仓也可能平仓",
		],
		predict: {
			prompt: [
				"You hold no ALFA options and sell one Oct 18 100 call. What is your position now?",
				"你没有任何 ALFA 期权，卖出 1 张 10月18日 100 看涨。你现在的持仓是什么？",
			],
			choices: [
				{
					id: "short",
					label: [
						"Short 1 call: I owe the obligation",
						"空头 1 张：我承担义务",
					],
				},
				{
					id: "flat",
					label: ["Flat: I sold what I had", "空仓：我卖掉了持有的"],
				},
				{ id: "long", label: ["Still long 1 call", "仍是多头 1 张"] },
			],
			answer: "short",
			revealAt: 3,
			explain: [
				"Selling when you hold nothing opens a short position: you become the writer. Selling closes only when you already hold the option.",
				"没有持仓时卖出就是开立空头：你成了义务方。只有已经持有期权时，卖出才是平仓。",
			],
		},
		beats: [
			{
				id: "flat",
				label: ["Flat", "空仓"],
				caption: [
					"You start with no position in the Oct 18 100 call: flat.",
					"你在 10月18日 100 看涨上没有持仓：空仓。",
				],
				state: { from: 0, trade: null },
			},
			{
				id: "buy-open",
				label: ["Buy to open", "买入开仓"],
				caption: [
					"Buy one and you are long 1 call: you now hold the right. That buy opened a position.",
					"买入 1 张，你就是 1 张看涨多头：你现在持有权利。这笔买入是开仓。",
				],
				state: { from: 0, trade: "buy" },
			},
			{
				id: "sell-close",
				label: ["Sell to close", "卖出平仓"],
				caption: [
					"Sell it and you are flat again. That sell closed your long; the right passed to the buyer.",
					"卖出它，你又回到空仓。这笔卖出平掉了多头，权利转给了买方。",
				],
				state: { from: 1, trade: "sell" },
			},
			{
				id: "sell-open",
				label: ["Sell to open", "卖出开仓"],
				caption: [
					"Sell one while flat and you are short 1 call. The same sell now opens an obligation.",
					"空仓时卖出 1 张，你就是 1 张看涨空头。同样的卖出，这次开立了一项义务。",
				],
				state: { from: 0, trade: "sell" },
			},
			{
				id: "buy-close",
				label: ["Buy to close", "买入平仓"],
				caption: [
					"Buy one back and the obligation is gone. That buy closed your short: you are flat.",
					"再买回 1 张，义务就消失了。这笔买入平掉了空头：你回到空仓。",
				],
				state: { from: -1, trade: "buy" },
			},
		],
		explore: {
			prompt: [
				"Pick where you start and whether you buy or sell. See when the same trade opens or closes.",
				"选择起始持仓和买卖方向，看看同样的交易何时开仓、何时平仓。",
			],
			start: () => ({ from: 1, trade: "buy" }),
			task: {
				kind: "reach",
				prompt: [
					"Find the trade that removes an obligation.",
					"找出解除义务的那笔交易。",
				],
				reached: (e) => e.from === -1 && e.trade === "buy",
				done: [
					"Short one call, you carry the obligation. Buying one back closes it: buy to close. The same buy from flat would open a long instead.",
					"做空一张看涨，你就承担义务。买回一张就平掉了它：买入平仓。同样的买入如果从空仓开始，则会开出多头。",
				],
			},
		},
		View: TrackView,
	}),
	defineScene<AssignState, AssignState>({
		id: "assignment",
		label: ["Assignment", "指派"],
		title: [
			"An exercise is assigned to a writer at random",
			"行权会被随机指派给某位义务方",
		],
		predict: {
			prompt: [
				"Ben sold you an Oct 18 95 put. At expiry ALFA is $88 and you exercise. Who must buy your shares?",
				"Ben 卖给你一张 10月18日 95 看跌。到期时 ALFA 为 $88，你行权。谁必须买下你的股票？",
			],
			choices: [
				{
					id: "random",
					label: [
						"Someone short that put, picked at random",
						"持有该看跌空头的某人，随机选出",
					],
				},
				{ id: "ben", label: ["Ben, who sold it to me", "卖给我的 Ben"] },
				{ id: "broker", label: ["My broker", "我的券商"] },
			],
			answer: "random",
			revealAt: 2,
			explain: [
				"Trades clear through a clearinghouse, so your put is not tied to Ben. The clearinghouse assigns your exercise to someone short that put, usually at random.",
				"交易通过清算机构清算，你的看跌期权并不绑定 Ben。清算机构把你的行权指派给持有该看跌空头的人，通常是随机的。",
			],
		},
		beats: [
			{
				id: "hold",
				label: ["Hold", "持有"],
				caption: [
					"Oct 18, expiry day: ALFA closes at $88. The put you bought from Ben for $215 lets you sell 100 shares at $95.",
					"10月18日到期日：ALFA 收于 $88。你以 $215 从 Ben 买入的看跌期权，允许你按 $95 卖出 100 股。",
				],
				state: { right: "put", step: "hold" },
			},
			{
				id: "exercise",
				label: ["Exercise", "行权"],
				caption: [
					"You exercise rather than sell the put. The notice goes to the clearinghouse, not to Ben.",
					"你选择行权，而不是卖出看跌期权。行权通知发给清算机构，而不是 Ben。",
				],
				state: { right: "put", step: "exercise" },
			},
			{
				id: "assign",
				label: ["Assign", "指派"],
				caption: [
					"The clearinghouse assigns it at random among everyone short this put. This time it picks Eli.",
					"清算机构在所有持有该看跌空头的人中随机指派。这一次选中了 Eli。",
				],
				state: { right: "put", step: "assign" },
			},
			{
				id: "settle",
				label: ["Settle", "交收"],
				caption: [
					"Eli pays $9,500 for 100 shares worth $8,800. You gain $700, or $485 after the $215 premium.",
					"Eli 支付 $9,500 买入价值 $8,800 的 100 股。你获得 $700，扣除 $215 权利金后为 $485。",
				],
				state: { right: "put", step: "settle" },
			},
		],
		explore: {
			prompt: [
				"Switch to a call and step through again: the shares and cash flow the other way.",
				"切换到看涨再走一遍：股票和现金的方向会反过来。",
			],
			start: (last) => last,
			task: {
				kind: "answer",
				prompt: [
					"Switch to the call. When your call exercise is assigned, who hands over the shares?",
					"切换到看涨期权。你的看涨行权被指派后，由谁交出股票？",
				],
				choices: [
					{ id: "writer", label: ["The assigned writer", "被指派的义务方"] },
					{ id: "holder", label: ["You, the holder", "你，持有人"] },
					{
						id: "house",
						label: [
							"The clearinghouse, from its own shares",
							"清算所，用自己的股票",
						],
					},
				],
				answer: "writer",
				done: [
					"Exercising a call buys at the strike. The clearinghouse assigns a writer, who delivers 100 shares and receives the strike price. It matches the two sides; it doesn't supply the shares.",
					"行使看涨期权就是以行权价买入。清算所指派一名义务方，由他交付 100 股并收取行权价款。清算所只负责匹配双方，不提供股票。",
				],
			},
		},
		View: AssignView,
	}),
] as const;

export function OptionRightsWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="option-rights"
			label={[
				"Interactive lesson on holders and writers",
				"持有人与义务方互动课",
			]}
			scenes={scenes}
		/>
	);
}
