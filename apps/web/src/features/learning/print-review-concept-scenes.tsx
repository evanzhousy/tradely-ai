import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { Button } from "@tradely/ui/components/button";
import { FieldGroup } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import { createContext, useContext, useState } from "react";
import {
	assessPrint,
	type EvidenceBucket,
	type EvidenceRequest,
	followUpPacket,
	type PrintReviewConceptData,
	type ReviewGap,
	type ReviewPacketId,
	type ReviewStatement,
	reviewGaps,
	statementBucket,
} from "@/domain/learning/print-review-concept";
import { quoteMoney as money } from "@/domain/learning/quote-concept";
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
export const PrintReviewData = createContext<PrintReviewConceptData | null>(
	null,
);
function useReviewData() {
	const data = useContext(PrintReviewData);
	if (!data)
		throw new Error("Print review scenes require authorized teaching data");
	return data;
}
type Props = { locale: Locale };
const text = (locale: Locale) => (en: string, zh: string) =>
	locale === "zh" ? zh : en;
const amount = (value: number | null) =>
	value === null
		? "—"
		: `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
const number = (value: number | null) =>
	value === null ? "—" : value.toLocaleString("en-US");
const buckets: readonly EvidenceBucket[] = [
	"observed",
	"calculated",
	"inferred",
	"unknown",
];
const bucketCopy: Record<EvidenceBucket, readonly [string, string]> = {
	observed: ["Observed", "观测"],
	calculated: ["Calculated", "计算"],
	inferred: ["Inferred", "推断"],
	unknown: ["Unknown", "未知"],
};
function Snapshot({ locale }: Props) {
	const { print } = useReviewData();
	const l = text(locale);
	return (
		<p className="font-mono text-muted-foreground text-xs leading-relaxed">
			{print.contract}
			<br />
			{print.date} · {print.at}
			<br />
			{l(
				"Fictional evidence · prices in USD per quoted unit",
				"虚构证据 · 每报价单位价格以美元计",
			)}
		</p>
	);
}
function PacketField({
	locale,
	id,
	onChange,
}: Props & { id: ReviewPacketId; onChange: (id: ReviewPacketId) => void }) {
	const data = useReviewData();
	const l = text(locale);
	return (
		<SelectField
			label={l("Evidence packet", "证据资料")}
			value={id}
			options={Object.entries(data.packets).map(([key, p]) => [
				key,
				p.label[locale === "zh" ? 1 : 0],
			])}
			onChange={(value) => {
				if (Object.hasOwn(data.packets, value))
					onChange(value as ReviewPacketId);
			}}
		/>
	);
}
const inspectionFields = [
	[
		"Contract identity",
		"合约身份",
		"Read the underlying, expiry, strike and call/put together. A ticker alone does not identify the contract.",
		"同时阅读标的、到期、行权价与看涨/看跌。仅有代码不能确定合约。",
	],
	[
		"Execution time",
		"成交时间",
		"This is the execution's timestamp. A reference quote needs its own timestamp and matching evidence.",
		"这是成交的时间戳。参考报价需要自身时间与匹配证据。",
	],
	[
		"Price per unit",
		"单位价格",
		"Use the recorded execution price, not a last, midpoint or mark from another observation.",
		"使用记录中的成交价格，而非另一条观测的最新价、中点或估值价。",
	],
	[
		"Contract count",
		"合约张数",
		"Count executed contracts once. Quoted size, share count and both counterparties are different quantities.",
		"成交合约只计一次。报价数量、股票股数与双方参与不是同一种计数。",
	],
	[
		"Stated multiplier",
		"给定乘数",
		"The product terms supply the conversion per contract. Without that evidence, the cash amount stays unavailable.",
		"产品条款提供每张合约的换算关系。缺少该证据，金额仍不可确定。",
	],
] as const;

export function PrintInspectorScene({ locale }: Props) {
	const data = useReviewData();
	const l = text(locale);
	const language = locale === "zh" ? 1 : 0;
	const motion = useLessonMotion();
	const playback = useFrames(inspectionFields.length);
	const [known, setKnown] = useState("supplied");
	const packet =
		data.packets[known === "supplied" ? "original" : "missing-multiplier"];
	const result = assessPrint(data.print, packet);
	const values = [
		data.print.contract,
		data.print.at,
		`${money(data.print.price)} / ${l("unit", "单位")}`,
		`${number(data.print.quantity)} ${l("contracts", "张")}`,
		packet.multiplier === null
			? l("Multiplier unavailable", "乘数不可用")
			: `${number(packet.multiplier)} ${l("units / contract", "单位 / 张")}`,
	];
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"Inspect the execution fields before calculating its cash amount",
						"计算金额前检查成交字段",
					)}
					height={550}
				>
					<rect
						x="14"
						y="12"
						width="332"
						height="281"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={36} muted>
						{l("Execution", "成交")} {data.print.id}
					</SvgText>
					{values.map((value, i) => (
						<g key={inspectionFields[i][0]}>
							<rect
								x="25"
								y={50 + i * 44}
								width="310"
								height="38"
								rx="8"
								className={
									playback.frame === i
										? "contract-svg-wash"
										: "contract-svg-paper"
								}
							/>
							<SvgText x={180} y={75 + i * 44} muted>
								{value}
							</SvgText>
						</g>
					))}
					<m.g
						initial={false}
						animate={{ x: 25, y: 50 + playback.frame * 44 }}
						transition={motion ? lessonTransition : instantTransition}
					>
						<rect
							x="0"
							y="0"
							width="310"
							height="38"
							rx="8"
							className="contract-svg-active-line"
						/>
					</m.g>
					<SvgText x={180} y={324} muted>
						{l("Price × count × multiplier", "价格 × 张数 × 乘数")}
					</SvgText>
					<SvgText x={180} y={351}>
						{money(data.print.price)} × {number(data.print.quantity)} ×{" "}
						{number(packet.multiplier)}
					</SvgText>
					<rect
						x="30"
						y="370"
						width="300"
						height="65"
						rx="12"
						className={
							result.premium === null
								? "contract-svg-paper"
								: "contract-svg-wash"
						}
					/>
					<SvgText x={180} y={394} muted>
						{l("Execution cash amount", "成交总权利金")}
					</SvgText>
					<g data-review-premium>
						<SvgText x={180} y={423} strong>
							{result.premium === null
								? l("Unavailable", "不可确定")
								: amount(result.premium)}
						</SvgText>
					</g>
					<path d="M40 480H320" className="contract-svg-line" />
					{inspectionFields.map((field, i) => (
						<circle
							key={field[0]}
							cx={40 + i * 70}
							cy="480"
							r="5"
							className="contract-svg-dot"
						/>
					))}
					<m.circle
						initial={false}
						cx={40 + playback.frame * 70}
						cy="480"
						r="10"
						className="contract-svg-handle"
						animate={{ cx: 40 + playback.frame * 70 }}
						transition={
							playback.playing && motion ? lessonTransition : instantTransition
						}
					/>
					<foreignObject x="20" y="440" width="320" height="80">
						<input
							type="range"
							className="contract-range contract-svg-range"
							aria-label={l("Print inspection timeline", "成交检查时间轴")}
							aria-valuetext={inspectionFields[playback.frame][language]}
							min={0}
							max={4}
							step={1}
							value={playback.frame}
							onPointerDown={() => playback.select(playback.frame)}
							onKeyDown={() => playback.select(playback.frame)}
							onChange={(e) => playback.select(Number(e.target.value))}
						/>
					</foreignObject>
					<SvgText x={180} y={536} muted>
						{inspectionFields[playback.frame][language]}
					</SvgText>
				</Diagram>
			}
		>
			<Snapshot locale={locale} />
			<FieldGroup>
				<SelectField
					label={l("Inspection step", "检查步骤")}
					value={String(playback.frame)}
					options={inspectionFields.map((field, i) => [
						String(i),
						field[language],
					])}
					onChange={(value) => playback.select(Number(value))}
				/>
				<ChoiceField
					label={l("Multiplier evidence", "乘数证据")}
					value={known}
					options={[
						["supplied", l("Supplied", "已提供")],
						["missing", l("Missing", "缺失")],
					]}
					onChange={(value) => {
						playback.select(playback.frame);
						setKnown(value);
					}}
				/>
			</FieldGroup>
			<PlaybackButton
				playing={playback.playing}
				onClick={playback.toggle}
				l={l}
			/>
			<Alert role="note">
				<AlertTitle>{inspectionFields[playback.frame][language]}</AlertTitle>
				<AlertDescription>
					{inspectionFields[playback.frame][language + 2]}
				</AlertDescription>
			</Alert>
			<p className="text-sm">
				{l(
					"A stale quote can block an aggressor inference while this amount remains calculable. Dollar size is not conviction, profit or a net market inflow.",
					"过时报价可阻止主动方推断，但金额仍可计算。金额大小不是确信程度、利润或市场净流入。",
				)}
			</p>
		</SceneLayout>
	);
}

const statements: Record<ReviewStatement, readonly [string, string]> = {
	contract: ["Contract identity", "合约身份"],
	premium: ["Execution premium", "成交总权利金"],
	aggressor: ["Likely aggressor", "可能的主动方"],
	opening: ["Opening / closing status", "开仓 / 平仓状态"],
	strategy: ["Complete strategy", "完整策略"],
};
export function EvidenceBucketsScene({ locale }: Props) {
	const data = useReviewData();
	const l = text(locale);
	const language = locale === "zh" ? 1 : 0;
	const motion = useLessonMotion();
	const [id, setId] = useState<ReviewPacketId>("original");
	const [statement, setStatement] = useState<ReviewStatement>("aggressor");
	const [chosen, setChosen] = useState<EvidenceBucket | null>(null);
	const packet = data.packets[id];
	const result = assessPrint(data.print, packet);
	const expected = statementBucket(statement, data.print, packet);
	const values = [
		`${number(data.print.quantity)} @ ${money(data.print.price)}`,
		amount(result.premium),
		result.aggressor === null
			? l("Unavailable", "不可确定")
			: result.aggressor === "buyer"
				? l("Likely buyer", "可能由买方发起")
				: l("Likely seller", "可能由卖方发起"),
		l("Full strategy / belief", "完整策略 / 观点"),
	];
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"One evidence packet separated into four knowledge categories",
						"将一份证据分为四类认知状态",
					)}
					height={438}
				>
					{buckets.map((bucket, i) => (
						<g key={bucket}>
							<rect
								x="14"
								y={15 + i * 100}
								width="332"
								height="84"
								rx="12"
								className={
									chosen === bucket ? "contract-svg-wash" : "contract-svg-paper"
								}
							/>
							<SvgText x={180} y={38 + i * 100} muted>
								{bucketCopy[bucket][language]}
							</SvgText>
							<g data-bucket-value={bucket}>
								<SvgText x={180} y={67 + i * 100} strong>
									{values[i]}
								</SvgText>
							</g>
							<SvgText x={180} y={88 + i * 100} muted>
								{i === 0
									? `${l("Opening flag", "开平仓标记")}: ${packet.opening?.toUpperCase() ?? "—"}`
									: i === 1
										? l("Price × count × multiplier", "价格 × 张数 × 乘数")
										: i === 2
											? result.reference.issue
												? l("Reference not usable", "参考不可用")
												: l(
														"Quote supports inference, not intent",
														"报价支持推断，不证明意图",
													)
											: packet.linked
												? l(
														"Linked leg supplied; portfolio unknown",
														"已提供关联单腿，组合仍未知",
													)
												: l("Position linkage not supplied", "未提供持仓关联")}
							</SvgText>
						</g>
					))}
					{chosen ? (
						<m.g
							initial={false}
							animate={{ x: 14, y: 15 + buckets.indexOf(chosen) * 100 }}
							transition={motion ? lessonTransition : instantTransition}
						>
							<rect
								x="0"
								y="0"
								width="332"
								height="84"
								rx="12"
								className="contract-svg-active-line"
							/>
						</m.g>
					) : null}
					<SvgText x={180} y={430} muted>
						{l(
							"More evidence changes specific claims",
							"新增证据改变的是具体结论",
						)}
					</SvgText>
				</Diagram>
			}
		>
			<Snapshot locale={locale} />
			<FieldGroup>
				<PacketField
					locale={locale}
					id={id}
					onChange={(value) => {
						setId(value);
						setChosen(null);
					}}
				/>
				<SelectField
					label={l("Inspect a statement", "检查陈述")}
					value={statement}
					options={Object.entries(statements).map(([key, copy]) => [
						key,
						copy[language],
					])}
					onChange={(value) => {
						if (Object.hasOwn(statements, value)) {
							setStatement(value as ReviewStatement);
							setChosen(null);
						}
					}}
				/>
				<ChoiceField
					label={l("Which evidence category?", "属于哪类证据？")}
					value={chosen ?? "unanswered"}
					options={buckets.map((bucket) => [
						bucket,
						bucketCopy[bucket][language],
					])}
					onChange={(value) => {
						const bucket = buckets.find((b) => b === value);
						if (bucket) setChosen(bucket);
					}}
				/>
			</FieldGroup>
			<p className="font-mono text-muted-foreground text-xs">
				{l("Quote timestamp", "报价时间")}: {packet.reference.at ?? "—"}
				<br />
				{packet.reference.condition === "complex"
					? l(
							"Complex leg: condition review required",
							"复杂单腿：需要审查成交条件",
						)
					: l("No special-condition flag supplied", "未提供特殊成交条件标记")}
			</p>
			<Alert role={chosen ? "status" : "note"}>
				<AlertTitle>
					{chosen
						? chosen === expected
							? l("Supported by this packet", "得到当前资料支持")
							: l("Recheck what is supplied", "重新检查已提供的证据")
						: l("Classify the statement", "判断陈述类别")}
				</AlertTitle>
				<AlertDescription>
					{chosen ? (
						<>
							<p data-bucket-feedback>
								{statements[statement][language]} →{" "}
								{bucketCopy[expected][language]}
							</p>
							<p>
								{statement === "premium"
									? result.premium === null
										? l(
												"A required multiplier is absent. Do not substitute an assumed 100.",
												"缺少必要乘数，不应自行假定为 100。",
											)
										: l(
												"The amount is calculated from the execution and stated multiplier, independently of the quote's age.",
												"金额由成交与给定乘数计算，与参考报价是否过时是两回事。",
											)
									: statement === "aggressor"
										? result.aggressor === null
											? l(
													"The reference cannot support a reliable aggressor inference. The execution amount can still be known.",
													"参考证据无法支持可靠主动方推断，但成交金额仍可能已知。",
												)
											: l(
													"The matched quote supports a likely aggressor. It does not reveal opening intent or a complete strategy.",
													"匹配报价支持推断可能主动方，不揭示开仓意图或完整策略。",
												)
										: statement === "opening"
											? packet.opening
												? l(
														"An explicit opening/closing record is supplied for this leg. That is additional observed evidence.",
														"此单腿已提供明确开平仓记录，这是新增的观测证据。",
													)
												: l(
														"No opening/closing record is supplied. Price, size and quote-side location cannot replace it.",
														"未提供开平仓记录，价格、数量与报价侧位置不能替代该记录。",
													)
											: statement === "strategy"
												? l(
														"Even a linked-leg flag does not describe the complete strategy, portfolio or investor belief.",
														"即使有关联单腿标记，也无法描述完整策略、组合或投资者观点。",
													)
												: l(
														"The contract identifier is part of the supplied execution record.",
														"合约标识是给定成交记录的一部分。",
													)}
							</p>
						</>
					) : (
						l(
							"Choose a category using this packet. New records can change which category a statement belongs in.",
							"根据当前资料选择类别。新增记录可能改变陈述所属的证据类别。",
						)
					)}
				</AlertDescription>
			</Alert>
		</SceneLayout>
	);
}

const gapCopy: Record<ReviewGap, readonly [string, string]> = {
	timing: ["Quote timing", "报价时间"],
	multiplier: ["Missing multiplier", "乘数缺失"],
	opening: ["Opening / closing", "开仓 / 平仓"],
	linkage: ["Position linkage", "持仓关联"],
};
const requestCopy: Record<EvidenceRequest, readonly [string, string]> = {
	quote: ["Get a matched quote", "获取匹配报价"],
	terms: ["Read contract terms", "读取合约条款"],
	position: ["Inspect opening/closing record", "检查开平仓记录"],
	linkage: ["Inspect linked-leg record", "检查关联单腿记录"],
	larger: ["Find a larger print", "寻找更大成交"],
	wait: ["Wait for a price move", "等待价格变动"],
};
export function FollowUpScene({ locale }: Props) {
	const data = useReviewData();
	const l = text(locale);
	const language = locale === "zh" ? 1 : 0;
	const motion = useLessonMotion();
	const [gap, setGap] = useState<ReviewGap>("timing");
	const [request, setRequest] = useState<EvidenceRequest>("larger");
	const [inspected, setInspected] = useState<EvidenceRequest | null>(null);
	const packet = data.packets[followUpPacket(gap, inspected)];
	const result = assessPrint(data.print, packet);
	const resolved = inspected === reviewGaps[gap].request;
	const outcome =
		gap === "timing"
			? result.aggressor === null
				? l("Aggressor unavailable", "主动方不可确定")
				: l("Likely buyer", "可能由买方发起")
			: gap === "multiplier"
				? amount(result.premium)
				: gap === "opening"
					? packet.opening
						? l("OPEN record supplied", "已提供 OPEN 记录")
						: l("Opening status unknown", "开平仓状态未知")
					: packet.linked
						? l("Linked leg supplied", "已提供关联单腿")
						: l("Linkage unknown", "关联未知");
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"A targeted follow-up resolves one evidence gap",
						"针对性后续检查解决一个证据缺口",
					)}
					height={453}
				>
					<rect
						x="32"
						y="15"
						width="296"
						height="68"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={39} muted>
						{l("Same recorded execution", "同一已记录成交")}
					</SvgText>
					<SvgText x={180} y={69} strong>
						{number(data.print.quantity)} @ {money(data.print.price)}
					</SvgText>
					<path
						d="M180 83v27M180 176v28M180 270v30"
						className="contract-svg-line"
					/>
					<rect
						x="32"
						y="110"
						width="296"
						height="66"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={133} muted>
						{l("Selected evidence gap", "选定证据缺口")}
					</SvgText>
					<SvgText x={180} y={159}>
						{gapCopy[gap][language]}
					</SvgText>
					<rect
						x="14"
						y="204"
						width="332"
						height="66"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={228} muted>
						{l("Follow-up inspected", "已检查的后续证据")}
					</SvgText>
					<SvgText x={180} y={255} muted>
						{inspected
							? requestCopy[inspected][language]
							: l("Choose and inspect a request", "选择并检查一项请求")}
					</SvgText>
					{inspected ? (
						<m.path
							key={`${gap}:${inspected}`}
							d="M180 83v27m0 66v28m0 66v30"
							className={
								resolved ? "contract-svg-active-line" : "contract-svg-line"
							}
							strokeDasharray={resolved ? undefined : "5 5"}
							initial={{ pathLength: motion ? 0 : 1 }}
							animate={{ pathLength: 1 }}
							transition={
								motion
									? { ...lessonTransition, duration: 0.45 }
									: instantTransition
							}
						/>
					) : null}
					<rect
						x="14"
						y="300"
						width="332"
						height="76"
						rx="12"
						className={resolved ? "contract-svg-wash" : "contract-svg-paper"}
					/>
					<SvgText x={180} y={325} muted>
						{resolved
							? l("This gap is resolved", "此缺口已解决")
							: l("This gap remains", "此缺口仍存在")}
					</SvgText>
					<g data-followup-result>
						<SvgText x={180} y={357} strong>
							{outcome}
						</SvgText>
					</g>
					<SvgText x={180} y={414} muted>
						{l(
							"Premium retained when units are known",
							"单位已知时，金额仍可计算",
						)}
					</SvgText>
					<g data-followup-premium>
						<SvgText x={180} y={441}>
							{amount(result.premium)}
						</SvgText>
					</g>
				</Diagram>
			}
		>
			<Snapshot locale={locale} />
			<FieldGroup>
				<SelectField
					label={l("Investigate one gap", "调查一个缺口")}
					value={gap}
					options={Object.entries(gapCopy).map(([key, copy]) => [
						key,
						copy[language],
					])}
					onChange={(value) => {
						if (Object.hasOwn(gapCopy, value)) {
							setGap(value as ReviewGap);
							setInspected(null);
						}
					}}
				/>
				<SelectField
					label={l("Choose a follow-up", "选择后续检查")}
					value={request}
					options={Object.entries(requestCopy).map(([key, copy]) => [
						key,
						copy[language],
					])}
					onChange={(value) => {
						if (Object.hasOwn(requestCopy, value)) {
							setRequest(value as EvidenceRequest);
							setInspected(null);
						}
					}}
				/>
			</FieldGroup>
			<Button variant="outline" onClick={() => setInspected(request)}>
				{l("Inspect this evidence", "检查这项证据")}
			</Button>
			<Alert role={inspected ? "status" : "note"}>
				<AlertTitle>
					{inspected
						? resolved
							? l("A specific missing fact is supplied", "已补充具体缺失事实")
							: l(
									"This choice does not close this gap",
									"此选择没有填补当前缺口",
								)
						: l("Choose the useful next check", "选择有用的下一项检查")}
				</AlertTitle>
				<AlertDescription>
					{inspected
						? resolved
							? l(
									"The supplied follow-up answers this selected question. Other unknowns remain: a matched quote does not supply opening intent, and linkage alone does not establish a full strategy or belief.",
									"给定后续记录回答了选定问题，其他未知仍然存在：匹配报价不提供开仓意图，仅有关联也不确定完整策略或观点。",
								)
							: l(
									"This request does not answer the selected question. A larger print or later price move cannot fill a missing fact; a record about another issue may add context but leaves this gap unresolved.",
									"此请求没有回答选定问题。更大成交或之后的价格变化不能补齐缺失事实；其他问题的记录可能增加背景，却未解决当前缺口。",
								)
						: l(
								"Inspect one candidate request, then compare what became known with what remains unknown.",
								"检查一个候选请求，再比较哪些信息已知、哪些仍未知。",
							)}
				</AlertDescription>
			</Alert>
			<p className="text-muted-foreground text-xs">
				{l(
					"Each comparison starts from the selected gap's original packet. Resolving one gap is not an all-clear for the trade.",
					"每次比较从该缺口的原始资料开始。解决一个缺口不代表整笔成交已全部验证。",
				)}
			</p>
		</SceneLayout>
	);
}
