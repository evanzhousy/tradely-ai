import { FieldGroup } from "@tradely/ui/components/field";
import {
	type Contract,
	type Copy,
	contractLabel,
	optionQuote,
	pick,
	signedUsd,
	usd,
	valueAtExpiry,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import {
	PayoffChart,
	type PayoffLine,
	type PayoffMarker,
} from "../walkthrough/instruments/payoff-chart";
import {
	PRICE_LINE_HEIGHT,
	PriceLine,
} from "../walkthrough/instruments/price-line";
import {
	type FlowParty,
	type FlowTransfer,
	TransferFlow,
	transferFlowHeight,
} from "../walkthrough/instruments/transfer-flow";
import { Stage } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const call100: Contract = { expiry: "oct18", strike: 100, right: "call" };
const put100: Contract = { expiry: "oct18", strike: 100, right: "put" };
const put95: Contract = { expiry: "oct18", strike: 95, right: "put" };
const call105: Contract = { expiry: "oct18", strike: 105, right: "call" };
const call110: Contract = { expiry: "oct18", strike: 110, right: "call" };

// ——— Scene 1: the right ———

type RightState = { right: "call" | "put"; spot: number | null };

function RightView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: RightState;
	explore: RightState | null;
	setExplore: (next: RightState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const contract = shown.right === "call" ? call100 : put100;
	const paid = optionQuote(contract).ask * 100;
	const expired = shown.spot !== null;
	const spot = shown.spot ?? 100;
	const value = expired ? valueAtExpiry(contract, spot * 100) * 100 : null;
	const result: ResultItem[] = [
		{
			id: "value",
			label: t(["Value at expiry", "到期价值"]),
			value: value === null ? t(["not yet", "尚未到期"]) : usd(value, 0),
			tween:
				value === null ? undefined : { to: value, format: (v) => usd(v, 0) },
			note:
				value === null
					? t(["expires Oct 18", "10月18日 到期"])
					: t([
							`ALFA ${usd(spot * 100, 0)} on Oct 18`,
							`10月18日 ALFA ${usd(spot * 100, 0)}`,
						]),
			evidence: value === null ? "unknown" : undefined,
		},
		{
			id: "paid",
			label: t(["You paid", "已付权利金"]),
			value: usd(paid, 0),
			note: t([
				`${usd(optionQuote(contract).ask)} × 100 shares`,
				`${usd(optionQuote(contract).ask)} × 100 股`,
			]),
		},
		{
			id: "result",
			label: t(["Result", "结果"]),
			value: value === null ? "—" : signedUsd(value - paid, 0),
			tween:
				value === null
					? undefined
					: { to: value - paid, format: (v) => signedUsd(v, 0) },
			tone: value === null ? undefined : value - paid > 0 ? "gain" : "loss",
			note: t(["value minus premium", "价值减权利金"]),
		},
	];
	const worth =
		value === null
			? undefined
			: value > 0
				? t([`worth ${usd(value, 0)}`, `价值 ${usd(value, 0)}`])
				: t(["worth $0", "价值 $0"]);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"ALFA's price on a line, with the strike and the region where the option is worth using",
						"ALFA 价格轴，标出行权价与期权值得行使的区域",
					])}
					height={PRICE_LINE_HEIGHT}
				>
					{(width) => (
						<PriceLine
							width={width}
							min={80}
							max={120}
							ticks={[80, 90, 100, 110, 120]}
							header={t(contractLabel(contract))}
							strike={{ value: 100, label: t(["strike $100", "行权价 $100"]) }}
							zone={
								shown.right === "call"
									? {
											from: 100,
											to: 120,
											label: t(["worth using", "值得行使"]),
										}
									: { from: 80, to: 100, label: t(["worth using", "值得行使"]) }
							}
							marker={{
								value: spot,
								label: expired
									? t([
											`ALFA ${usd(spot * 100, 0)} on Oct 18`,
											`10月18日 ${usd(spot * 100, 0)}`,
										])
									: t(["ALFA today $100", "ALFA 今天 $100"]),
								tone: value === null ? "neutral" : value > 0 ? "gain" : "loss",
							}}
							note={worth}
							drag={
								explore
									? {
											min: 80,
											max: 120,
											step: 1,
											onChange: (next) =>
												setExplore({ ...explore, spot: next }),
										}
									: undefined
							}
						/>
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<FieldGroup>
						<ChoiceField
							label={t(["Option", "期权"])}
							value={explore.right}
							options={[
								["call", t(["Call: right to buy", "看涨：买入的权利"])],
								["put", t(["Put: right to sell", "看跌：卖出的权利"])],
							]}
							onChange={(right) => setExplore({ ...explore, right })}
						/>
						<RangeControl
							label={t(["ALFA on Oct 18", "10月18日 ALFA"])}
							value={explore.spot ?? 100}
							display={usd((explore.spot ?? 100) * 100, 0)}
							min={80}
							max={120}
							onChange={(spot) => setExplore({ ...explore, spot })}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"At expiry a call is worth the amount ALFA is above the strike, and a put the amount it is below, times 100 shares. It is never worth less than zero; the premium is spent either way. Quotes come from the course's fictional ALFA world; fees are ignored.",
						"到期时，看涨期权的价值等于 ALFA 高于行权价的部分，看跌期权等于低于行权价的部分，再乘以 100 股。价值不会低于零；无论结果如何，权利金都已付出。报价来自课程中虚构的 ALFA 市场；未计费用。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: three uses ———

type Use = "shares" | "protect" | "earn" | "view";
type UseState = { use: Use };

const SPOTS = [80, 85, 90, 95, 100, 105, 110, 115, 120];
const shares = (spot: number) => (spot - 100) * 100;
const putCost = optionQuote(put95).ask;
const callIncome = optionQuote(call110).bid;
const viewCost = optionQuote(call105).ask;
const positionPayoff: Record<
	Exclude<Use, "shares">,
	(spot: number) => number
> = {
	protect: (spot) => shares(spot) + valueAtExpiry(put95, spot * 100) - putCost,
	earn: (spot) =>
		shares(spot) - valueAtExpiry(call110, spot * 100) + callIncome,
	view: (spot) => valueAtExpiry(call105, spot * 100) - viewCost,
};

function useFacts(use: Use, locale: Locale) {
	const t = tr(locale);
	if (use === "protect")
		return {
			premium: t([
				`paid ${usd(putCost * 100, 0)}`,
				`支付 ${usd(putCost * 100, 0)}`,
			]),
			worst: signedUsd(positionPayoff.protect(80) * 100, 0),
			worstNote: t(["at or below $95", "在 $95 及以下"]),
			best: t(["uncapped", "不封顶"]),
		};
	if (use === "earn")
		return {
			premium: t([
				`received ${usd(callIncome * 100, 0)}`,
				`收取 ${usd(callIncome * 100, 0)}`,
			]),
			worst: t(["the shares' fall", "股价下跌部分"]),
			worstNote: t([
				`only ${usd(callIncome * 100, 0)} cushion`,
				`仅有 ${usd(callIncome * 100, 0)} 缓冲`,
			]),
			best: signedUsd(positionPayoff.earn(120) * 100, 0),
		};
	if (use === "view")
		return {
			premium: t([
				`paid ${usd(viewCost * 100, 0)}`,
				`支付 ${usd(viewCost * 100, 0)}`,
			]),
			worst: signedUsd(-viewCost * 100, 0),
			worstNote: t(["the premium", "即权利金"]),
			best: t(["uncapped", "不封顶"]),
		};
	return {
		premium: "—",
		worst: t(["the whole fall", "全部跌幅"]),
		worstNote: t(["no floor", "没有下限"]),
		best: t(["uncapped", "不封顶"]),
	};
}

function UsesView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: UseState;
	explore: UseState | null;
	setExplore: (next: UseState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const sharesLine: PayoffLine = {
		id: "shares",
		label: t(["100 shares alone", "仅持有 100 股"]),
		points: SPOTS.map((spot) => [spot, shares(spot)] as const),
		tone: "reference",
	};
	const lines: PayoffLine[] =
		shown.use === "shares"
			? [{ ...sharesLine, tone: "long" }]
			: shown.use === "view"
				? [
						{
							id: "position",
							label: t(["105 call", "105 看涨"]),
							points: [80, 105, 120].map(
								(spot) => [spot, positionPayoff.view(spot)] as const,
							),
							tone: "position",
						},
					]
				: [
						sharesLine,
						{
							id: "position",
							label:
								shown.use === "protect"
									? t(["shares + 95 put", "股票 + 95 看跌"])
									: t(["shares − 110 call", "股票 − 110 看涨"]),
							points: [80, 95, 100, 110, 120].map(
								(spot) =>
									[
										spot,
										positionPayoff[shown.use as "protect" | "earn"](spot),
									] as const,
							),
							tone: "position",
						},
					];
	const markers: PayoffMarker[] =
		shown.use === "protect"
			? [
					{
						id: "floor",
						x: 95,
						y: positionPayoff.protect(95),
						label: t([
							`floor ${signedUsd(positionPayoff.protect(95) * 100, 0)}`,
							`下限 ${signedUsd(positionPayoff.protect(95) * 100, 0)}`,
						]),
						tone: "loss",
					},
				]
			: shown.use === "earn"
				? [
						{
							id: "cap",
							x: 110,
							y: positionPayoff.earn(110),
							label: t([
								`cap ${signedUsd(positionPayoff.earn(110) * 100, 0)}`,
								`上限 ${signedUsd(positionPayoff.earn(110) * 100, 0)}`,
							]),
							tone: "gain",
						},
					]
				: shown.use === "view"
					? [
							{
								id: "loss",
								x: 95,
								y: -viewCost * 100,
								label: t([
									`max loss ${signedUsd(-viewCost * 100, 0)}`,
									`最大亏损 ${signedUsd(-viewCost * 100, 0)}`,
								]),
								tone: "loss",
							},
						]
					: [];
	const facts = useFacts(shown.use, locale);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Profit or loss at expiry against ALFA's price for each use of an option",
						"每种期权用途在到期时的盈亏与 ALFA 价格的关系",
					])}
					height={(width) => (width < 520 ? 260 : 300)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 260 : 300}
							xRange={[80, 120]}
							yRange={[-2_200, 2_200]}
							xTicks={[80, 90, 100, 110, 120]}
							yTicks={[-2_000, -1_000, 0, 1_000, 2_000]}
							lines={lines}
							markers={markers}
							xLabel={t(["ALFA on Oct 18", "10月18日 ALFA"])}
							title={t(["Profit or loss at expiry", "到期盈亏"])}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "premium",
					label: t(["Premium", "权利金"]),
					value: facts.premium,
				},
				{
					id: "worst",
					label: t(["Worst case", "最坏情况"]),
					value: facts.worst,
					note: facts.worstNote,
					tone: "loss",
				},
				{ id: "best", label: t(["Best case", "最好情况"]), value: facts.best },
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Use", "用途"])}
						value={explore.use}
						options={[
							["shares", t(["Shares only", "仅持股"])],
							["protect", t(["Protect", "保护"])],
							["earn", t(["Earn", "收入"])],
							["view", t(["View", "看法"])],
						]}
						onChange={(use) => setExplore({ use })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Each use gives something up: protection costs a premium, income caps your gain, and a limited-cost view can lose its whole premium. Writing options without owning the shares carries much larger risks, covered in the risk lesson.",
						"每种用途都要放弃一些东西：保护要付权利金，收入会限制收益上限，成本有限的看法可能损失全部权利金。不持有股票而卖出期权的风险要大得多，风险一课会讲到。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: two sides ———

type SidesState = { stage: "buy" | "exercise" | "net"; spot: 95 | 110 };

function SidesView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SidesState;
	explore: SidesState | null;
	setExplore: (next: SidesState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const premium = optionQuote(call100).ask * 100;
	const exercised = shown.stage !== "buy" && shown.spot === 110;
	// Cents: the exercise gain is $10 a share on 100 shares.
	const net = exercised ? (110 - 100) * 100 * 100 - premium : -premium;
	const transfers: FlowTransfer[] = [
		{
			id: "premium",
			from: "you",
			to: "ben",
			label: t([`premium ${usd(premium, 0)}`, `权利金 ${usd(premium, 0)}`]),
			kind: "cash",
		},
		...(exercised
			? ([
					{
						id: "cash",
						from: "you",
						to: "ben",
						label: t(["$10,000", "$10,000"]),
						kind: "cash",
					},
					{
						id: "shares",
						from: "ben",
						to: "you",
						label: t(["100 shares", "100 股"]),
						kind: "shares",
					},
				] satisfies FlowTransfer[])
			: []),
	];
	const netLine = (value: number) =>
		t([`net ${signedUsd(value, 0)}`, `净额 ${signedUsd(value, 0)}`]);
	const youLines =
		shown.stage === "buy"
			? [
					t(["right to buy", "买入的权利"]),
					t([
						`cash ${signedUsd(-premium, 0)}`,
						`现金 ${signedUsd(-premium, 0)}`,
					]),
				]
			: !exercised
				? [t(["call unused", "期权未行使"]), netLine(net)]
				: shown.stage === "exercise"
					? [
							t(["paid $10,000", "支付 $10,000"]),
							t(["got 100 shares", "收到 100 股"]),
						]
					: [t(["shares: $11,000", "股票值 $11,000"]), netLine(net)];
	const benLines =
		shown.stage === "buy"
			? [
					t(["must sell if asked", "被要求时须卖出"]),
					t([`cash ${signedUsd(premium, 0)}`, `现金 ${signedUsd(premium, 0)}`]),
				]
			: !exercised
				? [
						t([`kept ${usd(premium, 0)}`, `保留 ${usd(premium, 0)}`]),
						netLine(-net),
					]
				: shown.stage === "exercise"
					? [
							t(["got $10,000", "收到 $10,000"]),
							t(["gave 100 shares", "交付 100 股"]),
						]
					: [
							t([
								`kept ${usd(premium, 0)} premium`,
								`保留 ${usd(premium, 0)} 权利金`,
							]),
							netLine(-net),
						];
	const parties: [FlowParty, FlowParty] = [
		{
			id: "you",
			name: t(["You", "你"]),
			role: t(["holder · long 1 call", "持有人 · 多头 1 张"]),
			holdings: youLines,
		},
		{
			id: "ben",
			name: "Ben",
			role: t(["writer · short 1 call", "义务方 · 空头 1 张"]),
			holdings: benLines,
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The holder and the writer of one call, and the premium, cash and shares that move between them",
						"一张看涨期权的持有人与义务方，以及二者之间流动的权利金、现金与股票",
					])}
					height={(width) => transferFlowHeight(width, 3)}
				>
					{(width) => (
						<TransferFlow
							width={width}
							parties={parties}
							transfers={transfers}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "you",
					label: t(["You (holder)", "你（持有人）"]),
					value:
						shown.stage === "exercise"
							? t(["settling", "结算中"])
							: signedUsd(net, 0),
					tone:
						shown.stage === "exercise" ? undefined : net > 0 ? "gain" : "loss",
				},
				{
					id: "ben",
					label: t(["Ben (writer)", "Ben（义务方）"]),
					value:
						shown.stage === "exercise"
							? t(["settling", "结算中"])
							: signedUsd(-net, 0),
					tone:
						shown.stage === "exercise" ? undefined : -net > 0 ? "gain" : "loss",
				},
				{
					id: "decides",
					label: t(["Who decides", "由谁决定"]),
					value: t(["The holder", "持有人"]),
				},
			]}
			controls={
				explore ? (
					<FieldGroup>
						<ChoiceField
							label={t(["ALFA on Oct 18", "10月18日 ALFA"])}
							value={String(explore.spot) as "95" | "110"}
							options={[
								["95", "$95"],
								["110", "$110"],
							]}
							onChange={(value) =>
								setExplore({ stage: "net", spot: value === "95" ? 95 : 110 })
							}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"Every option has a holder and a writer. The holder pays for a right and decides whether to use it; the writer is paid to accept an obligation and has no choice once assigned. Here the most the writer can gain is the premium.",
						"每份期权都有持有人和义务方。持有人为权利付费，并决定是否行使；义务方收取费用承担义务，一旦被指派便别无选择。这里义务方最多只能赚到权利金。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<RightState, RightState>({
		id: "right",
		label: ["The right", "权利"],
		title: ["An option is a right with a deadline", "期权是有期限的权利"],
		predict: {
			prompt: [
				"On Oct 18 ALFA ends at $95. What is your $100 call worth then?",
				"10月18日 ALFA 收在 $95。你的 $100 看涨期权届时值多少？",
			],
			choices: [
				{ id: "zero", label: ["$0: it expires worthless", "$0：作废"] },
				{ id: "five", label: ["$500", "$500"] },
				{ id: "minus", label: ["−$500", "−$500"] },
			],
			answer: "zero",
			explain: [
				"A call is a right to buy at $100. At $95 you can buy shares cheaper in the market, so the right is worth nothing. You lose the premium, but no more.",
				"看涨期权是以 $100 买入的权利。股价 $95 时在市场上买更便宜，这项权利一文不值。你损失权利金，但不会更多。",
			],
		},
		beats: [
			{
				id: "buy",
				label: ["Buy the call", "买入看涨"],
				caption: [
					"An Oct 18 100 call is the right to buy 100 ALFA shares at $100 until Oct 18. It costs $4.20 a share: $420.",
					"10月18日 100 看涨是在 10月18日 前以 $100 买入 100 股 ALFA 的权利，每股 $4.20，共 $420。",
				],
				state: { right: "call", spot: null },
			},
			{
				id: "below",
				label: ["Ends at $95", "收在 $95"],
				caption: [
					"On Oct 18 ALFA is $95. Nobody pays $100 for a $95 stock, so the call expires worthless and the $420 is gone.",
					"10月18日 ALFA 为 $95。没人会用 $100 去买 $95 的股票，看涨期权作废，$420 全部损失。",
				],
				state: { right: "call", spot: 95 },
			},
			{
				id: "above",
				label: ["Ends at $110", "收在 $110"],
				caption: [
					"If ALFA ends at $110 instead, the right to buy at $100 is worth $10 a share: $1,000, or $580 more than you paid.",
					"如果 ALFA 收在 $110，以 $100 买入的权利每股值 $10：共 $1,000，比你付出的多 $580。",
				],
				state: { right: "call", spot: 110 },
			},
			{
				id: "put",
				label: ["A put", "看跌期权"],
				caption: [
					"A put is the opposite right: to sell at $100. With ALFA at $90 on Oct 18 it is worth $1,000, against its own $420 premium.",
					"看跌期权是相反的权利：以 $100 卖出。10月18日 ALFA 为 $90 时它值 $1,000，其权利金同样是 $420。",
				],
				state: { right: "put", spot: 90 },
			},
		],
		explore: {
			prompt: [
				"Choose a call or a put and drag along the price line to move ALFA's price on Oct 18. Watch where the right is worth using.",
				"选择看涨或看跌，并在价格轴上左右拖动来移动 10月18日 的 ALFA 价格，看看权利在哪里值得行使。",
			],
			start: () => ({ right: "call", spot: 105 }),
		},
		View: RightView,
	}),
	defineScene<UseState, UseState>({
		id: "uses",
		label: ["Three uses", "三种用途"],
		title: [
			"People use options to protect, to earn, or to take a view",
			"人们用期权来保护、赚取收入或表达看法",
		],
		predict: {
			prompt: [
				"You own 100 ALFA shares and worry about a fall before Oct 18. Which option protects them?",
				"你持有 100 股 ALFA，担心 10月18日 前下跌。哪种期权能保护它们？",
			],
			choices: [
				{ id: "put", label: ["Buy a put", "买入看跌"] },
				{ id: "call", label: ["Buy a call", "买入看涨"] },
				{ id: "sellput", label: ["Sell a put", "卖出看跌"] },
			],
			answer: "put",
			explain: [
				"A put is the right to sell at its strike, so below $95 it gains what the shares lose. It costs a premium; the other choices add risk to the downside instead.",
				"看跌期权是以行权价卖出的权利，所以在 $95 以下，它的收益弥补股票的损失。它要付权利金；另外两个选择反而会增加下跌风险。",
			],
		},
		beats: [
			{
				id: "shares",
				label: ["Shares alone", "仅持股"],
				caption: [
					"Own 100 ALFA at $100: every $1 move is ±$100, with no floor below and no cap above.",
					"以 $100 持有 100 股 ALFA：每变动 $1 就是 ±$100，下不保底，上不封顶。",
				],
				state: { use: "shares" },
			},
			{
				id: "protect",
				label: ["Protect", "保护"],
				caption: [
					"Protect: add an Oct 18 95 put for $2.15. Below $95 the put makes up the loss, so the worst case is −$715.",
					"保护：再买入 10月18日 95 看跌，$2.15。在 $95 以下看跌期权弥补损失，最坏情况为 −$715。",
				],
				state: { use: "protect" },
			},
			{
				id: "earn",
				label: ["Earn", "收入"],
				caption: [
					"Earn: sell an Oct 18 110 call for $0.85. You collect $85 now, but gains above $110 go to the buyer.",
					"收入：卖出 10月18日 110 看涨，$0.85。你现在收取 $85，但 $110 以上的收益归买方。",
				],
				state: { use: "earn" },
			},
			{
				id: "view",
				label: ["Take a view", "表达看法"],
				caption: [
					"Take a view without shares: buy an Oct 18 105 call for $2.15. It pays above $107.15; the most you can lose is $215.",
					"不持股表达看法：买入 10月18日 105 看涨，$2.15。股价高于 $107.15 才盈利，最多亏 $215。",
				],
				state: { use: "view" },
			},
		],
		explore: {
			prompt: [
				"Switch between the uses and compare each line with owning the shares alone.",
				"切换不同用途，把每条线与仅持股比较。",
			],
			start: (last) => last,
		},
		View: UsesView,
	}),
	defineScene<SidesState, SidesState>({
		id: "sides",
		label: ["Two sides", "双方"],
		title: [
			"Every option has a holder and a writer",
			"每份期权都有持有人和义务方",
		],
		predict: {
			prompt: [
				"You bought the call from Ben. On Oct 18 ALFA is $110 and you exercise. What must Ben do?",
				"你从 Ben 手中买入看涨期权。10月18日 ALFA 为 $110，你行权。Ben 必须做什么？",
			],
			choices: [
				{
					id: "sell",
					label: ["Sell you 100 shares at $100", "以 $100 卖给你 100 股"],
				},
				{ id: "pay", label: ["Pay you $110 a share", "每股付你 $110"] },
				{
					id: "refuse",
					label: ["Nothing; he can refuse", "什么都不用做，他可以拒绝"],
				},
			],
			answer: "sell",
			explain: [
				"The writer took on the obligation when he sold the call. Once you exercise he must deliver 100 shares at $100, even though they are worth $110.",
				"义务方卖出看涨时就承担了义务。你一行权，他就必须以 $100 交付 100 股，即使股票价值 $110。",
			],
		},
		beats: [
			{
				id: "buy",
				label: ["The trade", "成交"],
				caption: [
					"You buy the call from Ben and pay him $420. You now hold the right; Ben holds the obligation.",
					"你从 Ben 手中买入看涨期权，付给他 $420。现在你持有权利，Ben 承担义务。",
				],
				state: { stage: "buy", spot: 110 },
			},
			{
				id: "exercise",
				label: ["Exercise", "行权"],
				caption: [
					"On Oct 18 ALFA is $110 and you exercise: you pay $10,000 and Ben must deliver 100 shares worth $11,000.",
					"10月18日 ALFA 为 $110，你行权：你支付 $10,000，Ben 必须交付价值 $11,000 的 100 股。",
				],
				state: { stage: "exercise", spot: 110 },
			},
			{
				id: "net",
				label: ["Net result", "净结果"],
				caption: [
					"Net, you are up $580 and Ben is down $580. The $420 premium was the most Ben could ever gain.",
					"净额上你赚 $580，Ben 亏 $580。$420 权利金是 Ben 能赚到的最多金额。",
				],
				state: { stage: "net", spot: 110 },
			},
		],
		explore: {
			prompt: [
				"Change ALFA's price on Oct 18 and see what moves between you and Ben.",
				"改变 10月18日 的 ALFA 价格，看看你和 Ben 之间有什么流动。",
			],
			start: () => ({ stage: "net", spot: 95 }),
		},
		View: SidesView,
	}),
] as const;

export function WhatOptionsAreWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="what-options-are"
			label={["Interactive lesson on what options are", "期权是什么互动课"]}
			scenes={scenes}
		/>
	);
}
