import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { Badge } from "@tradely/ui/components/badge";
import { Field, FieldGroup, FieldLabel } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/messages";
import {
	ChoiceField,
	Diagram,
	PlaybackButton,
	SceneLayout,
	SelectField,
	SvgText,
	useFrames,
} from "./concept-scene";
import {
	instantTransition,
	lessonTransition,
	useLessonMotion,
} from "./lesson-motion";
import {
	exerciseAmounts,
	exerciseTerms,
	type OptionRole,
	type OptionType,
	positionChange,
	type TradeSide,
	underlyingAction,
} from "./rights-concept-model";

type Props = { locale: Locale };
const text = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const money = (value: number) => `$${value.toLocaleString("en-US")}`;

function OptionTypeField({
	value,
	onChange,
	locale,
}: Props & { value: OptionType; onChange: (value: OptionType) => void }) {
	const l = text(locale);
	return (
		<ChoiceField
			label={l("Option type", "期权类型")}
			value={value}
			onChange={onChange}
			options={[
				["CALL", l("Call", "看涨")],
				["PUT", l("Put", "看跌")],
			]}
		/>
	);
}
function CountField({
	count,
	onChange,
	locale,
}: Props & { count: number; onChange: (value: number) => void }) {
	const id = useId();
	const l = text(locale);
	return (
		<Field>
			<FieldLabel htmlFor={id}>
				{l("Contract quantity", "合约张数")}:{" "}
				<output htmlFor={id}>{count}</output>
			</FieldLabel>
			<input
				className="contract-range"
				id={id}
				type="range"
				min="1"
				max="3"
				step="1"
				value={count}
				onPointerDown={() => onChange(count)}
				onChange={(event) => onChange(Number(event.target.value))}
			/>
		</Field>
	);
}

export function RightsRolesScene({ locale }: Props) {
	const l = text(locale);
	const [type, setType] = useState<OptionType>("CALL");
	const [role, setRole] = useState<OptionRole>("long");
	const motion = useLessonMotion();
	const verb = underlyingAction(type, role);
	const verbLabel = verb === "buy" ? l("buy", "买入") : l("sell", "卖出");
	const permission =
		role === "long" ? l("Right to", "有权") : l("Obligation to", "有义务");
	const summary =
		locale === "zh"
			? `${permission}${verbLabel} 100 股，价格为每股 $50。`
			: `${permission} ${verbLabel} 100 shares at $50 per share.`;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						`${type}: holder and writer responsibilities`,
						`${type}：持有人与卖方的权利义务`,
					)}
					height={352}
				>
					<rect
						x="75"
						y="14"
						width="210"
						height="61"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={40} strong>
						ALFA · {type}
					</SvgText>
					<SvgText x={180} y={63} muted>
						{l("Strike $50 · 100 shares", "行权价 $50 · 100 股")}
					</SvgText>
					<path
						d="M180 75v24H85v22M180 99h95v22"
						className="contract-svg-line"
					/>
					{(["long", "short"] as const).map((side, i) => (
						<g key={side}>
							<rect
								x={15 + i * 190}
								y="122"
								width="140"
								height="138"
								rx="12"
								className="contract-svg-paper"
							/>
							<SvgText x={85 + i * 190} y={148} strong>
								{side === "long" ? l("HOLDER", "持有人") : l("WRITER", "卖方")}
							</SvgText>
							<SvgText x={85 + i * 190} y={173} muted>
								{side === "long"
									? l("Long option", "期权多头")
									: l("Short option", "期权空头")}
							</SvgText>
							<SvgText x={85 + i * 190} y={207}>
								{side === "long"
									? l("Right to", "有权")
									: l("Obligation to", "有义务")}
							</SvgText>
							<SvgText x={85 + i * 190} y={234} strong>
								{underlyingAction(type, side) === "buy"
									? l("BUY", "买入")
									: l("SELL", "卖出")}
							</SvgText>
						</g>
					))}
					<m.rect
						y="118"
						width="148"
						height="146"
						rx="15"
						fill="none"
						stroke="var(--ring)"
						strokeWidth="3"
						animate={{ x: role === "long" ? 11 : 201 }}
						transition={motion ? lessonTransition : instantTransition}
					/>
					<SvgText x={180} y={302}>
						{role === "long"
							? l("If the holder exercises", "若持有人行权")
							: l("If the writer is assigned", "若卖方被指派")}
					</SvgText>
					<SvgText x={180} y={330} muted>
						{l("Stated physical-settlement example", "给定的实物结算示例")}
					</SvgText>
				</Diagram>
			}
		>
			<FieldGroup>
				<OptionTypeField value={type} onChange={setType} locale={locale} />
				<ChoiceField
					label={l("Your role", "你的角色")}
					value={role}
					options={[
						["long", l("Holder · long", "持有人 · 多头")],
						["short", l("Writer · short", "卖方 · 空头")],
					]}
					onChange={setRole}
				/>
			</FieldGroup>
			<div className="flex flex-col gap-3" aria-live="polite">
				<Badge variant="secondary" className="self-start">
					{role === "long"
						? l("Owns a right", "拥有权利")
						: l("Has a conditional obligation", "承担有条件的义务")}
				</Badge>
				<p
					className="font-semibold text-xl leading-relaxed"
					data-rights-summary
				>
					{summary}
				</p>
				<p className="text-muted-foreground text-sm leading-7">
					{role === "long"
						? l(
								"The holder has the exercise right under the contract terms. Buying the option does not itself exercise it or deliver the referenced shares.",
								"持有人按合约条款拥有行权权利。买入期权本身不等于行权，也不会直接交付所参考的股票。",
							)
						: l(
								"Once assigned, the writer must fulfill the contract. A short put is an obligation to buy; a long put is a right to sell.",
								"一旦被指派，卖方必须履行合约。看跌空头承担买入义务，看跌多头拥有卖出权利。",
							)}
				</p>
			</div>
			<Alert>
				<AlertTitle>
					{l(
						"Option ownership is not share ownership",
						"持有期权不等于持有股票",
					)}
				</AlertTitle>
				<AlertDescription>
					{l(
						"Call / Put describes the right. Long / Short describes your side. Neither label alone tells us about separate stock holdings or a complete trading strategy.",
						"看涨 / 看跌描述权利，多头 / 空头描述你所处的一方。这些标签本身不能说明另有的股票持仓或完整交易策略。",
					)}
				</AlertDescription>
			</Alert>
		</SceneLayout>
	);
}

const actionCopy = {
	"buy-to-open": ["Buy to open", "买入开仓"],
	"buy-to-close": ["Buy to close", "买入平仓"],
	"sell-to-open": ["Sell to open", "卖出开仓"],
	"sell-to-close": ["Sell to close", "卖出平仓"],
	"close-and-open": [
		"Close, then open the other side",
		"先平仓，再开立反向持仓",
	],
	unknown: ["Opening or closing is unknown", "无法确定开仓还是平仓"],
} as const;

export function PositionActionsScene({ locale }: Props) {
	const l = text(locale);
	const motion = useLessonMotion();
	const [before, setBefore] = useState<number | null>(3);
	const [side, setSide] = useState<TradeSide>("sell");
	const [count, setCount] = useState(1);
	const { after, action } = positionChange(before, side, count);
	const label = actionCopy[action][locale === "zh" ? 1 : 0];
	const position = (value: number | null) =>
		value === null
			? l("Unknown", "未知")
			: value === 0
				? l("Flat · 0", "空仓 · 0")
				: value > 0
					? l(`Long ${value}`, `多头 ${value} 张`)
					: l(`Short ${-value}`, `空头 ${-value} 张`);
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						`Option position: ${position(before)} to ${position(after)}`,
						`期权持仓：${position(before)} → ${position(after)}`,
					)}
					height={348}
				>
					<SvgText x={180} y={31} muted>
						{l("ALFA $50 CALL · one account", "ALFA $50 看涨 · 同一账户")}
					</SvgText>
					<rect
						x="35"
						y="54"
						width="290"
						height="52"
						rx="10"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={87}>
						{l("Before", "交易前")}: {position(before)}
					</SvgText>
					<path d="M35 181h290M180 170v22" className="contract-svg-line" />
					<SvgText x={42} y={214} muted>
						{l("Short", "空头")}
					</SvgText>
					<SvgText x={180} y={214} muted>
						0
					</SvgText>
					<SvgText x={318} y={214} muted>
						{l("Long", "多头")}
					</SvgText>
					{before !== null && after !== null ? (
						<>
							<path
								d={`M${180 + before * 23} 158V130H${180 + after * 23}v28`}
								className="contract-svg-active-line"
							/>
							<circle
								cx={180 + before * 23}
								cy="181"
								r="11"
								fill="var(--card)"
								stroke="var(--foreground)"
								strokeWidth="2"
							/>
							<m.circle
								r="8"
								cy="181"
								className="contract-svg-handle"
								animate={{ cx: 180 + after * 23 }}
								transition={motion ? lessonTransition : instantTransition}
							/>
						</>
					) : (
						<SvgText x={180} y={148}>
							{l("No starting position supplied", "未给定起始持仓")}
						</SvgText>
					)}
					<rect
						x="35"
						y="240"
						width="290"
						height="65"
						rx="10"
						className="contract-svg-wash"
					/>
					<SvgText x={180} y={267} muted>
						{side === "buy"
							? l(`Buy ${count} contract(s)`, `买入 ${count} 张`)
							: l(`Sell ${count} contract(s)`, `卖出 ${count} 张`)}
					</SvgText>
					<SvgText x={180} y={292} strong>
						{l("After", "交易后")}: {position(after)}
					</SvgText>
					<SvgText x={180} y={334} muted>
						{l(
							"Outlined = before · filled = after",
							"空心 = 交易前 · 实心 = 交易后",
						)}
					</SvgText>
				</Diagram>
			}
		>
			<FieldGroup>
				<SelectField
					label={l("Starting option position", "起始期权持仓")}
					value={before === null ? "unknown" : String(before)}
					options={[
						["3", l("Long 3 contracts", "多头 3 张")],
						["0", l("Flat (no position)", "空仓（无持仓）")],
						["-3", l("Short 3 contracts", "空头 3 张")],
						["unknown", l("Not supplied", "未提供")],
					]}
					onChange={(value) =>
						setBefore(value === "unknown" ? null : Number(value))
					}
				/>
				<ChoiceField
					label={l("Trade action", "交易动作")}
					value={side}
					options={[
						["buy", l("Buy", "买入")],
						["sell", l("Sell", "卖出")],
					]}
					onChange={setSide}
				/>
				<CountField locale={locale} count={count} onChange={setCount} />
			</FieldGroup>
			<div className="flex flex-col gap-3" aria-live="polite">
				<p className="font-semibold text-xl" data-position-action>
					{label}
				</p>
				<p className="font-mono" data-position-result>
					{position(before)} → {position(after)}
				</p>
				<p className="text-muted-foreground text-sm leading-7">
					{before === null
						? l(
								"A Buy / Sell label tells us the trade action. Without the starting position, we cannot tell whether it opened or closed a position.",
								"买入 / 卖出标签说明交易动作。缺少起始持仓，就无法判断它是开仓还是平仓。",
							)
						: l(
								"The starting position is supplied here, so we can classify this trade. A sale can reduce an existing long; a purchase can reduce an existing short.",
								"这里给定了起始持仓，因此可以分类这笔交易。卖出可以减少已有多头，买入可以减少已有空头。",
							)}
				</p>
			</div>
			<p className="text-muted-foreground text-xs leading-6">
				{l(
					"Positions refer to the same option contract in one account. These are option contracts, not shares. The supplied trades do not cross through zero into the opposite side.",
					"持仓指同一账户里的同一期权合约，单位是张，不是股。给定交易不会越过零点开立反向持仓。",
				)}
			</p>
		</SceneLayout>
	);
}

function Transfer({
	from,
	y,
	label,
	playKey,
}: {
	from: "holder" | "writer";
	y: number;
	label: string;
	playKey: string;
}) {
	const motion = useLessonMotion();
	const start = from === "holder" ? 60 : 300;
	const end = 360 - start;
	return (
		<g>
			<SvgText x={180} y={y - 16}>
				{label}
			</SvgText>
			<path
				d={`M${start} ${y}H${end}m${end > start ? -8 : 8} -5l${end > start ? 8 : -8} 5l${end > start ? -8 : 8} 5`}
				className="contract-svg-active-line"
			/>
			<m.circle
				key={playKey}
				cy={y}
				r="5"
				fill="var(--ring)"
				initial={{ cx: motion ? start : end }}
				animate={{ cx: end }}
				transition={
					motion ? { ...lessonTransition, duration: 0.65 } : instantTransition
				}
			/>
		</g>
	);
}

export function AssignmentScene({ locale }: Props) {
	const l = text(locale);
	const motion = useLessonMotion();
	const [type, setType] = useState<OptionType>("PUT");
	const [count, setCount] = useState(1);
	const playback = useFrames(3);
	const amounts = exerciseAmounts(type, count);
	const settled = playback.frame === 2;
	const phases = [
		["0", l("1. Hold", "1. 持有")],
		["1", l("2. Exercise", "2. 行权")],
		["2", l("3. Assignment", "3. 指派")],
	] as const;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(`${type} exercise and assignment`, `${type} 行权与指派`)}
					height={390}
				>
					{[0, 1].map((i) => (
						<g key={i}>
							<rect
								x={14 + i * 190}
								y="15"
								width="142"
								height="70"
								rx="12"
								className="contract-svg-paper"
							/>
							<SvgText x={85 + i * 190} y={42} strong>
								{i === 0 ? l("HOLDER", "持有人") : l("WRITER", "卖方")}
							</SvgText>
							<SvgText x={85 + i * 190} y={67} muted>
								{i === 0
									? l("May exercise", "可行权")
									: l("If assigned", "若被指派")}
							</SvgText>
						</g>
					))}
					<rect
						x="77"
						y="115"
						width="206"
						height="48"
						rx="10"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={145}>
						{l("Clearing & assignment", "清算与指派")}
					</SvgText>
					{playback.frame >= 1 ? (
						<m.path
							key={`exercise-${type}`}
							d="M85 85v17h95v13"
							className="contract-svg-active-line"
							initial={{ pathLength: motion ? 0 : 1 }}
							animate={{ pathLength: 1 }}
							transition={motion ? lessonTransition : instantTransition}
						/>
					) : null}
					{settled ? (
						<m.path
							key={`assignment-${type}`}
							d="M283 139h38V85h-46"
							className="contract-svg-active-line"
							initial={{ pathLength: motion ? 0 : 1 }}
							animate={{ pathLength: 1 }}
							transition={motion ? lessonTransition : instantTransition}
						/>
					) : null}
					<SvgText x={180} y={195} muted>
						{type} · {count} {l("contract(s) · strike $50", "张 · 行权价 $50")}
					</SvgText>
					{settled ? (
						<>
							<Transfer
								from={amounts.cashFrom}
								y={253}
								label={l(
									`Exercise cash ${money(amounts.cash)}`,
									`行权金额 ${money(amounts.cash)}`,
								)}
								playKey={`cash-${type}-${count}`}
							/>
							<Transfer
								from={amounts.sharesFrom}
								y={321}
								label={l(`${amounts.shares} shares`, `${amounts.shares} 股`)}
								playKey={`shares-${type}-${count}`}
							/>
						</>
					) : (
						<>
							<SvgText x={180} y={251} strong>
								{playback.frame === 0
									? l("Option held", "持有期权")
									: l("Exercise submitted", "已提交行权")}
							</SvgText>
							<SvgText x={180} y={283} muted>
								{l("No settlement shown yet", "尚未展示结算")}
							</SvgText>
						</>
					)}
					<SvgText x={180} y={369} muted>
						{l("Holder on left · writer on right", "左侧持有人 · 右侧卖方")}
					</SvgText>
				</Diagram>
			}
		>
			<FieldGroup>
				<OptionTypeField
					locale={locale}
					value={type}
					onChange={(value) => {
						setType(value);
						playback.select(playback.frame);
					}}
				/>
				<CountField
					locale={locale}
					count={count}
					onChange={(value) => {
						setCount(value);
						playback.select(playback.frame);
					}}
				/>
				<ChoiceField
					label={l("Exercise stage", "行权阶段")}
					value={String(playback.frame)}
					options={phases}
					onChange={(value) => playback.select(Number(value))}
				/>
			</FieldGroup>
			<div>
				<PlaybackButton
					playing={playback.playing}
					onClick={playback.toggle}
					l={l}
				/>
			</div>
			<div className="flex flex-col gap-3" aria-live="polite">
				<p className="font-semibold text-lg" data-assignment-status>
					{playback.frame === 0
						? l("Holding an option is not exercise.", "持有期权不等于行权。")
						: playback.frame === 1
							? l(
									"The holder exercises a valid right. Assignment follows through clearing.",
									"持有人使用有效行权权利，随后通过清算安排指派。",
								)
							: type === "PUT"
								? l(
										"The assigned put writer pays cash and receives shares.",
										"被指派的看跌卖方支付现金，接收股票。",
									)
								: l(
										"The assigned call writer delivers shares and receives cash.",
										"被指派的看涨卖方交付股票，接收现金。",
									)}
				</p>
				<p className="text-muted-foreground text-sm">
					{l("Gross cash if exercised / assigned", "行权 / 被指派时的总金额")}
				</p>
				<p className="font-mono text-3xl" data-exercise-cash>
					{money(amounts.cash)}
				</p>
				<p className="font-mono text-sm">
					{count} × {exerciseTerms.sharesPerContract} {l("shares", "股")} × $50
				</p>
				<p
					className="text-muted-foreground text-sm leading-6"
					data-opening-premium
				>
					{l(
						"Separate opening premium in this example",
						"本例另计的开仓权利金",
					)}
					: {money(amounts.openingPremium)} ({l("$2/share", "$2/股")}).{" "}
					{l(
						"Premium and profit are not the gross exercise amount.",
						"权利金与盈亏均不同于行权总额。",
					)}
				</p>
			</div>
			<p className="text-muted-foreground text-xs leading-6">
				{l(
					"Teaching terms: physical settlement, 100 shares per contract, valid exercise assumed. Clearing determines assignment; the writer shown need not be the holder's original trading counterparty. Exercise timing and settlement details are covered in Lesson 4.",
					"教学条款：实物结算，每张 100 股，假定行权有效。指派由清算流程决定，图中的卖方不一定是持有人原始交易的对手方。第 4 课详述行权时间与结算。",
				)}
			</p>
		</SceneLayout>
	);
}
