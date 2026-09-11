import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { Badge } from "@tradely/ui/components/badge";
import { Button } from "@tradely/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import { useId, useState } from "react";
import type { Locale } from "@/i18n/messages";
import { CalculationTrace } from "./calculation-trace";
import {
	Diagram,
	PlaybackButton,
	SceneLayout,
	SelectField,
	SvgText,
	useFrames,
} from "./concept-scene";
import {
	type ContractIdentity,
	contractAmounts,
	contractDifferences,
	contractFields,
	type TeachingProduct,
	teachingContract,
	teachingProducts,
	teachingSnapshots,
} from "./contract-concept-model";
import {
	instantTransition,
	lessonTransition,
	useLessonMotion,
} from "./lesson-motion";

type Props = { locale: Locale };
type Copy = (en: string, zh: string) => string;
const copy =
	(locale: Locale): Copy =>
	(en, zh) =>
		locale === "zh" ? zh : en;
const fieldLabels = {
	underlying: ["Underlying", "标的"],
	type: ["Type", "类型"],
	strike: ["Strike", "行权价"],
	expiry: ["Expiration", "到期日"],
	terms: ["Product terms", "产品条款"],
} as const;
const anatomyFields = [...contractFields, "terms"] as const;
const fieldLabel = (field: keyof typeof fieldLabels, locale: Locale) =>
	fieldLabels[field][locale === "zh" ? 1 : 0];

export function AnatomyScene({ locale }: Props) {
	const l = copy(locale);
	const [product, setProduct] = useState<TeachingProduct>("stock");
	const playback = useFrames(anatomyFields.length);
	const field = anatomyFields[playback.frame];
	const terms = teachingProducts[product];
	const motion = useLessonMotion();
	const descriptions = {
		underlying: l(
			"The underlying is the stock, ETF or index referenced by the option. Its ticker alone does not identify a contract.",
			"标的是期权参考的股票、ETF 或指数。仅凭代码不能确定一张合约。",
		),
		type: l(
			"CALL and PUT describe different rights. They identify different contracts even when strike and expiration match. You will explore those rights in Lesson 2.",
			"CALL（看涨）和 PUT（看跌）描述不同权利。即使行权价与到期日相同，它们也是不同合约。第 2 课会进一步讲解权利。",
		),
		strike: l(
			"The strike is the price specified by the contract. It is separate from the option's quoted price and the underlying's market price.",
			"行权价是合约约定的价格，与期权报价、标的市场价格不同。",
		),
		expiry: l(
			"Expiration identifies when this contract expires. A different expiration means a different contract; the quote timestamp is a separate field.",
			"到期日说明该合约何时到期。到期日不同，就是不同合约；报价时间则是另一个字段。",
		),
		terms:
			product === "index"
				? l(
						"This example specifies cash settlement and $100 per index point. There are no deliverable shares. Read the actual product's terms.",
						"本示例约定现金结算，每指数点 100 美元，不交付股票。应阅读实际产品条款。",
					)
				: l(
						"This example states 100 shares per contract and physical settlement. Owning the option does not mean already owning those shares. Other products can have different terms.",
						"本示例约定每张 100 股、实物结算。持有期权不等于已持有这些股票，其他产品的条款可能不同。",
					),
	};
	return (
		<SceneLayout
			diagram={
				<div className="contract-anatomy-map">
					<svg
						viewBox="0 0 360 410"
						preserveAspectRatio="none"
						className="contract-anatomy-lines"
						aria-hidden="true"
					>
						<path d="M180 69V87H24V338H50" className="contract-svg-line" />
						<m.path
							key={field}
							d={`M180 69V87H24V${122 + playback.frame * 54}H50`}
							className="contract-svg-active-line"
							initial={{ pathLength: motion ? 0 : 1 }}
							animate={{ pathLength: 1 }}
							transition={
								motion
									? { ...lessonTransition, duration: 0.4 }
									: instantTransition
							}
						/>
					</svg>
					<div className="contract-anatomy-underlying">
						<p className="font-mono font-semibold">
							{terms.symbol} ·{" "}
							{l(
								product === "stock"
									? "STOCK"
									: product === "etf"
										? "ETF"
										: "INDEX",
								product === "stock"
									? "股票"
									: product === "etf"
										? "ETF"
										: "指数",
							)}
						</p>
						<p className="text-muted-foreground text-xs">
							{l("Referenced underlying", "参考标的")}
						</p>
					</div>
					<div className="contract-anatomy-fields">
						{anatomyFields.map((item, index) => (
							<div key={item}>
								<Button
									variant={field === item ? "secondary" : "outline"}
									className="h-12 w-full justify-between gap-2 rounded-lg px-2"
									aria-pressed={field === item}
									onClick={() => playback.select(index)}
								>
									<span className="min-w-0 whitespace-normal text-left">
										{fieldLabel(item, locale)}
									</span>{" "}
									<span className="font-mono">
										{item === "underlying"
											? terms.symbol
											: item === "type"
												? "CALL"
												: item === "strike"
													? product === "index"
														? "4,000"
														: "$100"
													: item === "expiry"
														? "2026-10-16"
														: product === "index"
															? l("Cash", "现金")
															: l("100 shares", "100 股")}
									</span>
								</Button>
							</div>
						))}
					</div>
					<p className="contract-anatomy-caption text-muted-foreground text-xs">
						{l("One contract, explicit terms", "一张合约，明确的条款")}
					</p>
				</div>
			}
		>
			<FieldGroup>
				<SelectField
					label={l("Teaching product", "教学产品")}
					value={product}
					options={[
						["stock", l("Stock option · ALFA", "股票期权 · ALFA")],
						["etf", l("ETF option · BASK", "ETF 期权 · BASK")],
						[
							"index",
							l("Cash-settled index option · IDX", "现金结算指数期权 · IDX"),
						],
					]}
					onChange={(value) => {
						setProduct(value as TeachingProduct);
						playback.select(0);
					}}
				/>
			</FieldGroup>
			<div className="flex flex-col gap-2" aria-live="polite">
				<p className="font-mono text-muted-foreground text-xs">
					{String(playback.frame + 1).padStart(2, "0")} / 05
				</p>
				<h5 className="font-semibold text-lg">{fieldLabel(field, locale)}</h5>
				<p className="text-muted-foreground text-sm leading-7">
					{descriptions[field]}
				</p>
			</div>
			<div>
				<PlaybackButton
					playing={playback.playing}
					onClick={playback.toggle}
					l={l}
				/>
			</div>
			<details className="text-sm leading-7">
				<summary className="cursor-pointer font-medium">
					{l("Explore the underlying profile", "探索标的资料")}
				</summary>
				<div className="mt-3 flex flex-col gap-3 text-muted-foreground">
					<p>
						{product === "stock"
							? l(
									"ALFA is a fictional company. Its sector is an industry classification. At a $40 share price and 3 million shares outstanding, market capitalization is $120 million.",
									"ALFA 是虚构公司。行业是产业分类。给定股价 40 美元、发行在外 300 万股，市值为 1.2 亿美元。",
								)
							: product === "etf"
								? l(
										"BASK is a fictional ETF. A fund share represents an interest in a fund. Company sector and earnings fields are not supplied for this example.",
										"BASK 是虚构 ETF。基金份额代表基金权益。本例未提供公司行业与财报字段。",
									)
								: l(
										"IDX is a fictional index, not a company share. Company sector, market capitalization and an earnings date are not applicable here; that does not make the contract identity unknown.",
										"IDX 是虚构指数，不是公司股票。公司行业、市值与财报日期在此不适用，并不意味着合约身份未知。",
									)}
					</p>
					<p>
						{l(
							"Share volume counts shares; option volume counts contracts. An earnings date describes an underlying event, not option expiration or guaranteed news timing. Always retain the source date of each observation.",
							"股票成交量按股计，期权成交量按张计。财报日期是标的事件，不是期权到期日，也不保证消息公布时刻。应保留每项观测的来源日期。",
						)}
					</p>
					<p className="font-mono text-xs">
						{l(
							"Profile teaching snapshot · Sep 11, 2026",
							"资料教学快照 · 2026-09-11",
						)}
					</p>
				</div>
			</details>
		</SceneLayout>
	);
}

function IdentityCard({
	identity,
	differences = [],
	label,
	locale,
}: {
	identity: ContractIdentity;
	differences?: string[];
	label: string;
	locale: Locale;
}) {
	const motion = useLessonMotion();
	return (
		<Diagram label={label} height={276}>
			<rect
				x="12"
				y="10"
				width="336"
				height="254"
				rx="16"
				className="contract-svg-paper"
			/>
			<SvgText x={180} y={43} strong>
				{label}
			</SvgText>
			{contractFields.map((field, index) => (
				<g key={field}>
					<m.rect
						x="24"
						y={61 + index * 48}
						width="312"
						height="43"
						rx="7"
						animate={{ opacity: differences.includes(field) ? 1 : 0 }}
						transition={motion ? lessonTransition : instantTransition}
						className="contract-svg-wash"
					/>
					<text x="34" y={88 + index * 48} className="contract-svg-muted">
						{fieldLabel(field, locale)}
					</text>
					<text x="325" y={88 + index * 48} textAnchor="end">
						{identity[field]}
					</text>
				</g>
			))}
		</Diagram>
	);
}

export function IdentityScene({ locale }: Props) {
	const l = copy(locale);
	const [identity, setIdentity] = useState<ContractIdentity>({
		...teachingContract,
		expiry: "2026-11-20",
	});
	const [snapshot, setSnapshot] = useState("0");
	const differences = contractDifferences(teachingContract, identity);
	const observation = teachingSnapshots[Number(snapshot)];
	return (
		<div className="flex flex-col gap-5">
			<div className="contract-comparison">
				<IdentityCard
					identity={teachingContract}
					label={l("Contract A · Reference", "合约 A · 参照")}
					locale={locale}
				/>
				<IdentityCard
					identity={identity}
					differences={differences}
					label={l("Contract B · Your changes", "合约 B · 你的修改")}
					locale={locale}
				/>
			</div>
			<div className="contract-scene-layout">
				<FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					{contractFields.map((field) => (
						<SelectField
							key={field}
							label={`${fieldLabel(field, locale)} B`}
							value={identity[field]}
							options={(field === "underlying"
								? ["ALFA", "BETA"]
								: field === "type"
									? ["CALL", "PUT"]
									: field === "strike"
										? ["$95", "$100", "$105"]
										: ["2026-10-16", "2026-11-20"]
							).map((value) => [value, value] as const)}
							onChange={(value) =>
								setIdentity((previous) => ({ ...previous, [field]: value }))
							}
						/>
					))}
				</FieldGroup>
				<div className="flex flex-col gap-4">
					<Alert>
						<AlertTitle>
							{differences.length
								? l("Different contracts", "不同合约")
								: l("Same contract", "同一合约")}
						</AlertTitle>
						<AlertDescription>
							<p data-contract-identity-status aria-live="polite">
								{differences.length
									? `${l("Fields that differ", "不同字段")}: ${differences.map((field) => fieldLabel(field, locale)).join(", ")}.`
									: l(
											"All four identity fields match. Price and source time can change while identity stays the same.",
											"四个身份字段全部一致。价格和来源时间可以改变，合约身份保持不变。",
										)}
							</p>
						</AlertDescription>
					</Alert>
					<FieldGroup>
						<SelectField
							label={l("B's teaching observation", "B 的教学观测")}
							value={snapshot}
							options={teachingSnapshots.map(
								(item, i) =>
									[String(i), `${item.time} · $${item.price}/share`] as const,
							)}
							onChange={setSnapshot}
						/>
					</FieldGroup>
					<p
						className="text-muted-foreground text-sm leading-6"
						data-contract-observation
					>
						{l("Selected observation", "所选观测")}: ${observation.price}
						{l("/share", "/股")} · {observation.time} · 2026-09-11.{" "}
						{l(
							"An observation is not an identity field. These are authored snapshots, not a pricing model.",
							"观测不属于身份字段。这些是编写的快照，不是定价模型。",
						)}
					</p>
				</div>
			</div>
		</div>
	);
}

export function UnitsScene({ locale }: Props) {
	const l = copy(locale);
	const id = useId();
	const [count, setCount] = useState(3);
	const [cents, setCents] = useState(200);
	const [termsKnown, setTermsKnown] = useState("known");
	const terms = {
		multiplier: termsKnown === "known" ? 100 : null,
		deliverableShares: termsKnown === "known" ? 100 : null,
		settlement: "physical" as const,
	};
	const amounts = contractAmounts(count, cents, terms);
	const motion = useLessonMotion();
	const money = (value: number) =>
		`$${value.toLocaleString(locale === "zh" ? "zh-CN" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						`${count} contracts and their stated deliverable`,
						`${count} 张合约及其给定交付数量`,
					)}
					height={392}
				>
					<SvgText x={180} y={27} muted>
						{l("ALFA · Physical settlement", "ALFA · 实物结算")}
					</SvgText>
					{[0, 1, 2, 3, 4].map((i) => (
						<m.g
							key={i}
							aria-hidden={i >= count}
							animate={{ opacity: i < count ? 1 : 0, y: i < count ? 0 : 5 }}
							transition={motion ? lessonTransition : instantTransition}
						>
							<rect
								x={14 + i * 69}
								y="62"
								width="58"
								height="67"
								rx="9"
								className="contract-svg-paper"
							/>
							<SvgText x={43 + i * 69} y={89} strong>
								{i + 1}
							</SvgText>
							<text
								x={43 + i * 69}
								y={113}
								textAnchor="middle"
								className="contract-svg-muted"
								style={{ fontSize: 11 }}
							>
								{l("contract", "张")}
							</text>
							<path
								d={`M${43 + i * 69} 133v25`}
								className="contract-svg-line"
							/>
							{termsKnown === "known" ? (
								Array.from({ length: 100 }, (_, dot) => (
									<circle
										key={`share-${i}-${dot}`}
										cx={19 + i * 69 + (dot % 10) * 5.3}
										cy={174 + Math.floor(dot / 10) * 5.3}
										r="1.8"
										className="contract-svg-dot"
									/>
								))
							) : (
								<SvgText x={43 + i * 69} y={200}>
									?
								</SvgText>
							)}
							<SvgText x={43 + i * 69} y={248} muted>
								{termsKnown === "known" ? l("100 sh.", "100 股") : "—"}
							</SvgText>
						</m.g>
					))}
					<path
						d={`M43 267v15h${(count - 1) * 69}v-15M${43 + (count - 1) * 34.5} 282H180v20`}
						className="contract-svg-line"
					/>
					<SvgText x={180} y={329} strong>
						{amounts.shares === null
							? l("Terms needed", "需要条款")
							: l(
									`${amounts.shares} deliverable shares`,
									`${amounts.shares} 股交付数量`,
								)}
					</SvgText>
					<SvgText x={180} y={367} muted>
						{l("Each dot = one deliverable share", "每个点 = 一股交付数量")}
					</SvgText>
				</Diagram>
			}
		>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor={`${id}-count`}>
						{l("Contracts", "合约张数")}
					</FieldLabel>
					<div className="flex items-center gap-3">
						<Button
							variant="outline"
							size="sm"
							aria-label={l("Remove one contract", "减少一张合约")}
							disabled={count === 1}
							onClick={() => setCount((n) => n - 1)}
						>
							−
						</Button>
						<output
							className="min-w-8 text-center font-mono text-lg"
							htmlFor={`${id}-count`}
						>
							{count}
						</output>
						<Button
							variant="outline"
							size="sm"
							aria-label={l("Add one contract", "增加一张合约")}
							disabled={count === 5}
							onClick={() => setCount((n) => n + 1)}
						>
							+
						</Button>
					</div>
					<input
						id={`${id}-count`}
						className="contract-range"
						type="range"
						min="1"
						max="5"
						step="1"
						value={count}
						onChange={(event) => setCount(Number(event.target.value))}
					/>
				</Field>
				<Field>
					<FieldLabel htmlFor={`${id}-price`}>
						{l("Option price per share", "每股期权价格")}
					</FieldLabel>
					<output className="font-mono text-lg" htmlFor={`${id}-price`}>
						{money(cents / 100)}
					</output>
					<input
						id={`${id}-price`}
						className="contract-range"
						type="range"
						min="50"
						max="500"
						step="25"
						value={cents}
						aria-valuetext={`${money(cents / 100)} ${l("per share", "每股")}`}
						onChange={(event) => setCents(Number(event.target.value))}
					/>
				</Field>
				<SelectField
					label={l("Supplied product terms", "给定产品条款")}
					value={termsKnown}
					options={[
						[
							"known",
							l(
								"100 shares/contract · multiplier 100",
								"每张 100 股 · 乘数 100",
							),
						],
						["missing", l("Terms missing", "条款缺失")],
					]}
					onChange={setTermsKnown}
				/>
			</FieldGroup>
			<div aria-live="polite" className="flex flex-col gap-2">
				<p className="text-muted-foreground text-sm">
					{l("Total premium · before fees", "总权利金 · 不含费用")}
				</p>
				<p className="font-mono text-3xl tracking-tight" data-contract-premium>
					{amounts.premium === null ? "—" : money(amounts.premium)}
				</p>
				<p className="text-muted-foreground text-sm" data-contract-deliverable>
					{amounts.shares === null
						? l(
								"Product terms needed. No multiplier is assumed.",
								"需要产品条款，不假定乘数。",
							)
						: l(
								`${count} × 100 = ${amounts.shares} deliverable shares.`,
								`${count} × 100 = ${amounts.shares} 股交付数量。`,
							)}
				</p>
			</div>
			<p className="text-muted-foreground text-sm leading-6">
				{l(
					"Premium is the amount at the selected option price, not profit. Contractual deliverable is not shares already owned or delta-equivalent exposure.",
					"权利金是按所选期权价格计算的金额，不是利润。交付股数不等于已经持有的股票或 Delta 等价敞口。",
				)}
			</p>
			{amounts.premium !== null ? (
				<CalculationTrace
					locale={locale}
					terms={[
						{
							id: "price",
							label: l("Price / share", "价格 / 股"),
							value: money(cents / 100),
						},
						{
							id: "multiplier",
							label: l("Shares / contract", "股 / 张"),
							value: "100",
						},
						{
							id: "contracts",
							label: l("Contracts", "张"),
							value: String(count),
						},
						{
							id: "total",
							label: l("Total premium", "总权利金"),
							value: money(amounts.premium),
						},
					]}
				/>
			) : null}
		</SceneLayout>
	);
}

export function SourceTimeScene({ locale }: Props) {
	const l = copy(locale);
	const id = useId();
	const playback = useFrames(teachingSnapshots.length);
	const [position, setPosition] = useState<number | null>(null);
	const selected = position === null ? playback.frame : Math.round(position);
	const snapshot = teachingSnapshots[selected];
	const seek = (value: number) => {
		playback.select(Math.round(value));
		setPosition(value);
	};
	return (
		<SceneLayout
			diagram={
				<Diagram
					label={l(
						"A fixed contract with three dated quote observations",
						"固定合约与三个带日期的报价观测",
					)}
					height={360}
				>
					<rect
						x="15"
						y="12"
						width="330"
						height="80"
						rx="12"
						className="contract-svg-paper"
					/>
					<SvgText x={180} y={39} muted>
						{l("CONTRACT IDENTITY · FIXED", "合约身份 · 固定")}
					</SvgText>
					<SvgText x={180} y={64} strong>
						ALFA / CALL / $100
					</SvgText>
					<SvgText x={180} y={84}>
						2026-10-16
					</SvgText>
					<path d="M180 92v28" className="contract-svg-line" />
					<rect
						x="15"
						y="122"
						width="330"
						height="114"
						rx="12"
						className="contract-svg-wash"
					/>
					<SvgText x={180} y={150} muted>
						{l("QUOTE OBSERVATION", "报价观测")}
					</SvgText>
					<SvgText x={180} y={185} strong>
						${snapshot.price}
						{l(" / share", " / 股")}
					</SvgText>
					<SvgText x={180} y={216}>
						2026-09-11 · {snapshot.time}
					</SvgText>
					<path d="M45 287h270" className="contract-svg-line" />
					{teachingSnapshots.map((item, i) => (
						<g key={item.time}>
							<circle
								cx={45 + i * 135}
								cy="287"
								r="5"
								className="contract-svg-dot"
							/>
							<SvgText x={45 + i * 135} y={322} muted>
								{item.time}
							</SvgText>
						</g>
					))}
					<circle
						cx={45 + (position ?? playback.frame) * 135}
						cy="287"
						r="11"
						className="contract-svg-handle"
					/>
					<foreignObject x="25" y="247" width="310" height="80">
						<input
							id={id}
							className="contract-range contract-svg-range"
							aria-label={l("Observation timeline", "观测时间轴")}
							type="range"
							min="0"
							max="2"
							step="0.01"
							value={position ?? playback.frame}
							aria-valuetext={`${snapshot.time}, $${snapshot.price} ${l("per share", "每股")}`}
							onChange={(event) => seek(Number(event.target.value))}
							onPointerDown={() => playback.select(selected)}
							onPointerUp={() => setPosition(null)}
							onPointerCancel={() => setPosition(null)}
							onBlur={() => setPosition(null)}
							onKeyDown={(event) => {
								if (
									[
										"ArrowLeft",
										"ArrowDown",
										"ArrowRight",
										"ArrowUp",
										"Home",
										"End",
									].includes(event.key)
								) {
									event.preventDefault();
									const next =
										event.key === "Home"
											? 0
											: event.key === "End"
												? 2
												: selected +
													(["ArrowRight", "ArrowUp"].includes(event.key)
														? 1
														: -1);
									playback.select(Math.max(0, Math.min(2, next)));
									setPosition(null);
								}
							}}
						/>
					</foreignObject>
				</Diagram>
			}
		>
			<Badge variant="outline" className="self-start">
				{l("Same contract throughout", "全程为同一合约")}
			</Badge>

			<div className="flex flex-wrap gap-2">
				<Button
					size="sm"
					variant="outline"
					disabled={selected === 0}
					onClick={() => {
						playback.select(selected - 1);
						setPosition(null);
					}}
				>
					{l("Previous snapshot", "上一快照")}
				</Button>
				<PlaybackButton
					playing={playback.playing}
					l={l}
					onClick={() => {
						setPosition(null);
						playback.toggle();
					}}
				/>
				<Button
					size="sm"
					variant="outline"
					disabled={selected === 2}
					onClick={() => {
						playback.select(selected + 1);
						setPosition(null);
					}}
				>
					{l("Next snapshot", "下一快照")}
				</Button>
			</div>
			<div aria-live="polite" className="flex flex-col gap-3 text-sm leading-7">
				<p className="font-mono" data-contract-snapshot>
					{snapshot.time} · ${snapshot.price}
					{l("/share", "/股")}
				</p>
				<p className="text-muted-foreground">
					{l(
						"The quote changed; expiration stayed October 16, 2026. The source time belongs to this observation, not to the contract's permanent identity.",
						"报价变了，到期日仍是 2026 年 10 月 16 日。来源时间属于该条观测，不属于合约固定身份。",
					)}
				</p>
			</div>
			<p className="text-muted-foreground text-xs leading-6">
				{l(
					"Source: three authored teaching snapshots, September 11, 2026 (ET). Between markers, the nearest supplied snapshot is shown. Prices are never interpolated.",
					"来源：2026 年 9 月 11 日（美东时间）的三个编写教学快照。标记之间显示最近的给定快照，不插值生成价格。",
				)}
			</p>
		</SceneLayout>
	);
}
