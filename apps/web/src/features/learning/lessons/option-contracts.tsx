import { FieldGroup } from "@tradely/ui/components/field";
import * as m from "motion/react-m";
import {
	ALFA,
	type Contract,
	type Copy,
	contractLabel,
	count,
	type ExpiryId,
	expiries,
	optionQuote,
	pick,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	ContractTicket,
	type TicketField,
	ticketHeight,
} from "../walkthrough/instruments/contract-ticket";
import { TIMELINE_HEIGHT, Timeline } from "../walkthrough/instruments/timeline";
import { Label, Stage, useTeachMotion } from "../walkthrough/stage";
import { defineScene, type Phase } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

// ——— Scene 1: anatomy ———

/** OCC-style option symbol: root padded to six characters, YYMMDD, C or P, strike × 1000. */
function symbolParts(contract: Contract) {
	const date = expiries[contract.expiry].date;
	return {
		root: `${ALFA.symbol}  `,
		date: `${date.slice(2, 4)}${date.slice(5, 7)}${date.slice(8, 10)}`,
		right: contract.right === "call" ? "C" : "P",
		strike: String(contract.strike * 1000).padStart(8, "0"),
	};
}

type AnatomyState = { contract: Contract; shown: number; focus: string };

function fieldsFor(contract: Contract, locale: Locale): TicketField[] {
	const t = tr(locale);
	const parts = symbolParts(contract);
	const expiry = expiries[contract.expiry];
	return [
		{
			id: "underlying",
			label: t(["Underlying", "标的"]),
			value: t(["ALFA shares", "ALFA 股票"]),
			segment: parts.root,
		},
		{
			id: "expiry",
			label: t(["Expiry", "到期日"]),
			value: t([`${expiry.label[0]}, 2030`, `2030年${expiry.label[1]}`]),
			segment: parts.date,
		},
		{
			id: "right",
			label: t(["Type", "类型"]),
			value:
				contract.right === "call"
					? t(["Call: right to buy", "看涨：买入权"])
					: t(["Put: right to sell", "看跌：卖出权"]),
			segment: parts.right,
		},
		{
			id: "strike",
			label: t(["Strike", "行权价"]),
			value: `$${contract.strike}`,
			segment: parts.strike,
		},
		{
			id: "multiplier",
			label: t(["Multiplier", "乘数"]),
			value: t(["100 shares per contract", "每张 100 股"]),
		},
		{
			id: "settlement",
			label: t(["Settlement", "结算"]),
			value: t(["Shares (physical)", "交付股票（实物）"]),
		},
	];
}

function AnatomyView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: AnatomyState;
	explore: AnatomyState | null;
	setExplore: (next: AnatomyState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const fields = fieldsFor(shown.contract, locale);
	const parts = symbolParts(shown.contract);
	const named = shown.shown >= 4;
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"An option contract's fields and the standard symbol they build",
						"期权合约的各个字段，以及它们组成的标准代码",
					])}
					height={ticketHeight(fields.length)}
				>
					{(width) => (
						<ContractTicket
							width={width}
							title={t(["Option contract", "期权合约"])}
							fields={fields}
							shown={shown.shown}
							focus={shown.focus}
							symbolLabel={t(["Standard option symbol", "标准期权代码"])}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "contract",
					label: t(["Contract", "合约"]),
					value: named
						? t(contractLabel(shown.contract))
						: t(["not yet named", "尚未确定"]),
					evidence: named ? undefined : "unknown",
				},
				{
					id: "symbol",
					label: t(["Symbol", "代码"]),
					value: named
						? `${parts.root.trim()}${parts.date}${parts.right}${parts.strike}`
						: "—",
				},
				{
					id: "deliverable",
					label: t(["Per contract", "每张合约"]),
					value: shown.shown >= 5 ? t(["100 shares", "100 股"]) : "—",
				},
			]}
			controls={
				explore ? (
					<FieldGroup>
						<ChoiceField
							label={t(["Expiry", "到期日"])}
							value={explore.contract.expiry}
							options={(["oct18", "nov15", "dec20"] as ExpiryId[]).map(
								(id) => [id, t(expiries[id].label)] as const,
							)}
							onChange={(expiry) =>
								setExplore({
									...explore,
									contract: { ...explore.contract, expiry },
								})
							}
						/>
						<ChoiceField
							label={t(["Type", "类型"])}
							value={explore.contract.right}
							options={[
								["call", t(["Call", "看涨"])],
								["put", t(["Put", "看跌"])],
							]}
							onChange={(right) =>
								setExplore({
									...explore,
									contract: { ...explore.contract, right },
								})
							}
						/>
						<RangeControl
							label={t(["Strike", "行权价"])}
							value={explore.contract.strike}
							display={`$${explore.contract.strike}`}
							min={90}
							max={110}
							step={5}
							onChange={(strike) =>
								setExplore({
									...explore,
									contract: { ...explore.contract, strike },
								})
							}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"The standard symbol packs the underlying, expiry (YYMMDD), type (C or P) and strike × 1,000 into one key. Read the product terms for the multiplier and settlement rather than assuming them; adjusted contracts can deliver something other than 100 shares.",
						"标准代码把标的、到期日（年月日）、类型（C 或 P）和行权价 × 1,000 组合成一个键。乘数与结算方式要看产品条款，不要想当然；经过调整的合约交付的可能不是 100 股。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: units ———

type UnitState = {
	contracts: number;
	step: "contract" | "premium" | "notional";
};
const call100: Contract = { expiry: "oct18", strike: 100, right: "call" };
const ASK = optionQuote(call100).ask;

function UnitStage({
	width,
	state,
	locale,
}: {
	width: number;
	state: UnitState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const narrow = width < 520;
	const dot = narrow ? 4 : 5;
	const block = dot * 10 + 9 * 2;
	const perRow = Math.max(1, Math.floor((width - 16) / (block + 14)));
	const premium = ASK * 100 * state.contracts;
	const shares = state.contracts * 100;
	const rows = Math.ceil(state.contracts / perRow);
	const textTop = 30 + rows * (block + 24) + 10;
	return (
		<g>
			<Label x={8} y={18} tone="muted">
				{t([
					`${state.contracts} × ${contractLabel(call100)[0]} · each dot is 1 share`,
					`${state.contracts} 张 ${contractLabel(call100)[1]} · 每点 1 股`,
				])}
			</Label>
			{Array.from({ length: state.contracts }, (_, c) => {
				const bx = 8 + (c % perRow) * (block + 14);
				const by = 30 + Math.floor(c / perRow) * (block + 24);
				return (
					<m.g
						key={c}
						initial={motion.enabled ? { opacity: 0 } : false}
						animate={{ opacity: 1 }}
						transition={motion.after(c * 0.08)}
					>
						{Array.from({ length: 100 }, (_, i) => (
							<rect
								key={i}
								x={bx + (i % 10) * (dot + 2)}
								y={by + Math.floor(i / 10) * (dot + 2)}
								width={dot}
								height={dot}
								rx={1}
								className="wt-long"
							/>
						))}
						<Label
							x={bx + block / 2}
							y={by + block + 16}
							anchor="middle"
							tone="small"
						>
							{t([`contract ${c + 1}`, `第 ${c + 1} 张`])}
						</Label>
					</m.g>
				);
			})}
			<text x={8} y={textTop + 16}>
				<tspan className="wt-muted">{t(["Premium ", "权利金 "])}</tspan>
				<tspan>
					{usd(ASK)} × 100 × {state.contracts} ={" "}
				</tspan>
				<tspan className={state.step !== "contract" ? "wt-strong" : undefined}>
					{usd(premium, 0)}
				</tspan>
			</text>
			{state.step === "notional" ? (
				<text x={8} y={textTop + 44}>
					<tspan className="wt-muted">{t(["Notional ", "名义价值 "])}</tspan>
					<tspan>{count(shares)} × $100 = </tspan>
					<tspan className="wt-strong">{usd(shares * 10_000, 0)}</tspan>
				</text>
			) : null}
		</g>
	);
}

function unitHeight(width: number, contracts: number) {
	const narrow = width < 520;
	const block = (narrow ? 4 : 5) * 10 + 18;
	const perRow = Math.max(1, Math.floor((width - 16) / (block + 14)));
	return 30 + Math.ceil(contracts / perRow) * (block + 24) + 70;
}

function UnitView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: UnitState;
	explore: UnitState | null;
	setExplore: (next: UnitState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const premium = ASK * 100 * shown.contracts;
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Contracts drawn as blocks of 100 shares, with the premium and notional they represent",
						"以每块 100 股表示的合约，以及它们对应的权利金与名义价值",
					])}
					height={(width) => unitHeight(width, Math.max(shown.contracts, 3))}
				>
					{(width) => <UnitStage width={width} state={shown} locale={locale} />}
				</Stage>
			}
			result={[
				{
					id: "quote",
					label: t(["Quote", "报价"]),
					value: usd(ASK),
					note: t(["per share, at the ask", "每股，按卖价"]),
				},
				{
					id: "premium",
					label: t(["Premium", "权利金"]),
					value: usd(premium, 0),
					note: t([`${shown.contracts} contracts`, `${shown.contracts} 张`]),
				},
				{
					id: "notional",
					label: t(["Shares controlled", "对应股数"]),
					value: count(shown.contracts * 100),
					note: t([
						`worth ${usd(shown.contracts * 100 * 10_000, 0)} at $100`,
						`按 $100 计值 ${usd(shown.contracts * 100 * 10_000, 0)}`,
					]),
				},
			]}
			controls={
				explore ? (
					<RangeControl
						label={t(["Contracts", "张数"])}
						value={explore.contracts}
						display={count(explore.contracts)}
						min={1}
						max={8}
						onChange={(contracts) =>
							setExplore({ contracts, step: "notional" })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Keep the units apart: contracts are counted in contracts, the deliverable in shares, and premium and notional in dollars. The $1,260 premium is what you pay; the $30,000 notional is the value of the shares it refers to.",
						"把单位分清：合约按张数，交付按股数，权利金和名义价值按美元。$1,260 的权利金是你支付的金额；$30,000 的名义价值是它所对应股票的价值。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: price at a time ———

type TimeState = { at: "none" | "morning" | "close" };
const observations = {
	morning: { at: 630, time: "10:30", bid: 405, ask: 420, spot: 10_002 },
	close: { at: 959, time: "15:59", bid: 465, ask: 490, spot: 10_120 },
} as const;

function TimeView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: TimeState;
	explore: TimeState | null;
	setExplore: (next: TimeState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const visible =
		shown.at === "none"
			? []
			: shown.at === "morning"
				? ["morning"]
				: ["morning", "close"];
	const current = shown.at === "none" ? null : observations[shown.at];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Two price observations of the same contract on one session's timeline",
						"同一合约的两次价格观测，标在同一交易时段的时间轴上",
					])}
					height={TIMELINE_HEIGHT + 40}
				>
					{(width) => (
						<>
							<Label x={24} y={18} tone="muted">
								{t([
									`${contractLabel(call100)[0]} · Mon Sep 16`,
									`${contractLabel(call100)[1]} · 9月16日 周一`,
								])}
							</Label>
							<g transform="translate(0 20)">
								<Timeline
									width={width}
									start={570}
									end={960}
									ticks={[
										{ at: 570, label: "09:30" },
										{ at: 720, label: "12:00" },
										{ at: 960, label: "16:00" },
									]}
									events={visible.map((id) => {
										const item = observations[id as "morning" | "close"];
										return {
											id,
											at: item.at,
											label: t([
												`${item.time} · ask ${usd(item.ask)}`,
												`${item.time} · 卖价 ${usd(item.ask)}`,
											]),
											sub: t([
												`ALFA ${usd(item.spot)}`,
												`ALFA ${usd(item.spot)}`,
											]),
											active: id === shown.at,
										};
									})}
								/>
							</g>
						</>
					)}
				</Stage>
			}
			result={[
				{
					id: "contract",
					label: t(["Contract (fixed)", "合约（不变）"]),
					value: t(contractLabel(call100)),
				},
				{
					id: "quote",
					label: t(["Quote", "报价"]),
					value: current ? `${usd(current.bid)} / ${usd(current.ask)}` : "—",
					note: current
						? t([`at ${current.time}`, `于 ${current.time}`])
						: t(["no observation yet", "尚无观测"]),
				},
				{
					id: "spot",
					label: t(["ALFA then", "当时 ALFA"]),
					value: current ? usd(current.spot) : "—",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Observation", "观测"])}
						value={explore.at === "none" ? "morning" : explore.at}
						options={[
							["morning", "10:30"],
							["close", "15:59"],
						]}
						onChange={(at) => setExplore({ at })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A contract's identity never changes; its prices, volume and open interest are observations that belong to a time. Store the timestamp with every number, and compare numbers only when their times match what you are asking.",
						"合约的身份不会改变；它的价格、成交量和未平仓量都是属于某个时间的观测。每个数字都要连同时间戳一起记录，只有当时间符合你的问题时才能比较。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<AnatomyState, AnatomyState>({
		id: "anatomy",
		label: ["Anatomy", "结构"],
		title: ["A contract is named by four facts", "一份合约由四个事实确定"],
		predict: {
			prompt: [
				"An ALFA 100 call expiring Oct 18 and one expiring Nov 15: are they the same contract?",
				"10月18日 到期与 11月15日 到期的 ALFA 100 看涨：它们是同一份合约吗？",
			],
			choices: [
				{
					id: "no",
					label: [
						"No: the expiry is part of the contract",
						"不是：到期日是合约的一部分",
					],
				},
				{
					id: "yes",
					label: ["Yes: same ticker and strike", "是：代码和行权价相同"],
				},
				{
					id: "price",
					label: ["Only if their prices match", "只有价格相同时才是"],
				},
			],
			answer: "no",
			explain: [
				"A contract is fixed by its underlying, expiry, type and strike. Change any one and you have a different contract with its own price and volume.",
				"合约由标的、到期日、类型与行权价确定。改变任何一个，就是另一份合约，有自己的价格与成交量。",
			],
		},
		beats: [
			{
				id: "underlying",
				label: ["Underlying", "标的"],
				caption: [
					"Every ALFA option starts from its underlying, ALFA shares. The ticker alone does not name a contract: there are dozens.",
					"每份 ALFA 期权都从标的 ALFA 股票出发。仅凭代码无法确定合约：同一代码下有几十份合约。",
				],
				state: { contract: call100, shown: 1, focus: "underlying" },
			},
			{
				id: "expiry",
				label: ["Expiry and type", "到期日与类型"],
				caption: [
					"Add the expiry, Oct 18, 2030, and the type, a call: the right to buy. Oct 18 and Nov 15 calls are different contracts.",
					"加上到期日 2030年10月18日 和类型看涨（买入的权利）。10月18日 与 11月15日 的看涨是不同的合约。",
				],
				state: { contract: call100, shown: 3, focus: "right" },
			},
			{
				id: "strike",
				label: ["Strike", "行权价"],
				caption: [
					"Add the strike, $100, and the contract is fully named. The standard symbol encodes all four: ALFA301018C00100000.",
					"加上行权价 $100，合约就完全确定了。标准代码包含全部四项：ALFA301018C00100000。",
				],
				state: { contract: call100, shown: 4, focus: "strike" },
			},
			{
				id: "terms",
				label: ["Product terms", "产品条款"],
				caption: [
					"The product terms add the multiplier, 100 shares per contract, and physical settlement: exercising delivers the shares.",
					"产品条款补充了乘数（每张 100 股）和实物结算：行权时交付股票。",
				],
				state: { contract: call100, shown: 6, focus: "multiplier" },
			},
		],
		explore: {
			prompt: [
				"Change the expiry, type and strike and watch the symbol change: each is a different contract.",
				"改变到期日、类型和行权价，观察代码的变化：每一种都是不同的合约。",
			],
			start: (last) => ({ ...last, shown: 6, focus: "strike" }),
		},
		View: AnatomyView,
	}),
	defineScene<UnitState, UnitState>({
		id: "units",
		label: ["Units", "单位"],
		title: [
			"Quotes are per share; contracts are 100 shares",
			"报价按每股，合约按 100 股",
		],
		predict: {
			prompt: [
				"The Oct 18 100 call is quoted $4.20. What do 3 contracts cost?",
				"10月18日 100 看涨报价 $4.20。买 3 张需要多少钱？",
			],
			choices: [
				{ id: "right", label: ["$1,260", "$1,260"] },
				{ id: "shares", label: ["$12.60", "$12.60"] },
				{ id: "tenth", label: ["$126", "$126"] },
			],
			answer: "right",
			explain: [
				"$4.20 is per share. One contract is 100 shares, so $420, and three contracts are $1,260.",
				"$4.20 是每股价格。一张合约 100 股，即 $420，三张就是 $1,260。",
			],
		},
		beats: [
			{
				id: "one",
				label: ["One contract", "一张合约"],
				caption: [
					"One contract covers 100 shares. The $4.20 quote is per share, so one contract costs $420.",
					"一张合约对应 100 股。$4.20 的报价按每股计，所以一张合约 $420。",
				],
				state: { contracts: 1, step: "premium" },
			},
			{
				id: "three",
				label: ["Three contracts", "三张合约"],
				caption: [
					"Three contracts cover 300 shares and cost 3 × $420 = $1,260 in premium.",
					"三张合约对应 300 股，权利金为 3 × $420 = $1,260。",
				],
				state: { contracts: 3, step: "premium" },
			},
			{
				id: "notional",
				label: ["Notional", "名义价值"],
				caption: [
					"Those 300 shares are worth $30,000 at $100: the notional value the $1,260 premium refers to. Keep the two apart.",
					"这 300 股按 $100 计值 $30,000，是 $1,260 权利金所对应的名义价值。两者要区分开。",
				],
				state: { contracts: 3, step: "notional" },
			},
		],
		explore: {
			prompt: [
				"Change the number of contracts and watch shares, premium and notional scale together.",
				"改变合约张数，观察股数、权利金和名义价值如何同步变化。",
			],
			start: (last) => last,
		},
		View: UnitView,
	}),
	defineScene<TimeState, TimeState>({
		id: "time",
		label: ["Price at a time", "某时的价格"],
		title: [
			"A price belongs to a time, not to the contract",
			"价格属于某个时间，而不属于合约本身",
		],
		predict: {
			prompt: [
				"The same contract's ask was $4.20 at 10:30 and $4.90 at 15:59. Which is its price?",
				"同一合约的卖价 10:30 为 $4.20，15:59 为 $4.90。它的价格是哪个？",
			],
			choices: [
				{
					id: "both",
					label: ["Each is its price at that time", "各是那个时间的价格"],
				},
				{ id: "first", label: ["$4.20: the first quote", "$4.20：第一个报价"] },
				{ id: "average", label: ["$4.55: the average", "$4.55：平均值"] },
			],
			answer: "both",
			revealAt: 2,
			explain: [
				"The contract stays the same; its quote moved as ALFA rose from $100.02 to $101.20. Each price is true only with its timestamp.",
				"合约不变；随着 ALFA 从 $100.02 涨到 $101.20，它的报价也变了。每个价格只有连同时间戳才成立。",
			],
		},
		beats: [
			{
				id: "contract",
				label: ["The contract", "合约"],
				caption: [
					"The Oct 18 100 call is the same contract all day. Its prices are observations taken at particular times.",
					"10月18日 100 看涨一整天都是同一份合约。它的价格是在某些时间点得到的观测。",
				],
				state: { at: "none" },
			},
			{
				id: "morning",
				label: ["10:30", "10:30"],
				caption: [
					"At 10:30, with ALFA at $100.02, the call is quoted $4.05 bid, $4.20 ask.",
					"10:30 ALFA 为 $100.02 时，看涨报价为买价 $4.05、卖价 $4.20。",
				],
				state: { at: "morning" },
			},
			{
				id: "close",
				label: ["15:59", "15:59"],
				caption: [
					"At 15:59 ALFA is $101.20 and the same call is $4.65 bid, $4.90 ask. Same contract, a different price at a different time.",
					"15:59 ALFA 为 $101.20，同一看涨为买价 $4.65、卖价 $4.90。同一合约，不同时间，不同价格。",
				],
				state: { at: "close" },
			},
		],
		explore: {
			prompt: ["Switch between the two observations.", "在两次观测之间切换。"],
			start: (last) => last,
		},
		View: TimeView,
	}),
] as const;

export function OptionContractsWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="option-contracts"
			label={["Interactive lesson on option contracts", "期权合约互动课"]}
			scenes={scenes}
		/>
	);
}
