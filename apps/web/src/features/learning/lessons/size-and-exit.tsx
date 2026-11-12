import { FieldGroup } from "@tradely/ui/components/field";
import {
	type Copy,
	contractLabel,
	count,
	percent,
	pick,
	signedUsd,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import { type Bar, BarChart } from "../walkthrough/instruments/bar-chart";
import {
	PayoffChart,
	type PayoffLine,
} from "../walkthrough/instruments/payoff-chart";
import { Player } from "../walkthrough/player";
import { Stage } from "../walkthrough/stage";
import { defineScene, type Phase } from "../walkthrough/types";
import { SceneFrame } from "../walkthrough/walkthrough";
import { sizeAndExitFilm } from "./size-and-exit-film";
import {
	ACCOUNT,
	afterLosses,
	BEFORE_GAP,
	BUDGET,
	CHEAP_PRICE,
	CHEAP_WORST,
	cheapCall,
	DEAR_FITS_AT,
	DEAR_PRICE,
	DEAR_WORST,
	dearCall,
	EXPIRY_LABEL,
	GAP_OPEN,
	GAP_RESULT,
	gainToRecover,
	HALF_KEPT_AT,
	LARGE_LEFT,
	LARGE_PERCENT,
	LARGE_RECOVER,
	LOSS_POINT,
	lostAfter,
	type Outcome,
	outcomes,
	PERCENT_RANGE,
	type Pick,
	PLAN_PAID,
	PLANNED_LOSS,
	PROFIT_POINT,
	PROFIT_RESULT,
	pricePerShare,
	RULE_PERCENT,
	SMALL_LEFT,
	SMALL_PERCENT,
	SMALL_RECOVER,
	SPREAD_PRICE,
	SPREAD_WORST,
	STREAK,
	sizeFacts,
	streakPath,
	TIME_STOP_DAYS_LEFT,
	TIME_STOP_LABEL,
	TIME_STOP_SPOT,
	TIME_STOP_VALUE,
	WORST_RESULT,
	worstCase,
} from "./size-and-exit-model";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);
/** Whole dollars from cents. */
const whole = (cents: number) => usd(cents, 0);
/** A rule's percentage: "2%", "4.5%". */
const rule = (value: number) => `${value}%`;

// ——— Scene 1: size ———

type SizeState = { percent: number; pick: Pick };

const pickLabel: Record<Pick, Copy> = {
	dear: contractLabel(dearCall, false),
	cheap: contractLabel(cheapCall, false),
	spread: ["Oct 18 105/110 call spread", "10月18日 105/110 看涨价差"],
};
const pickShort: Record<Pick, Copy> = {
	dear: ["100 call", "100 看涨"],
	cheap: ["110 call", "110 看涨"],
	spread: ["105/110 spread", "105/110 价差"],
};

function SizeView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SizeState;
	explore: SizeState | null;
	setExplore: (next: SizeState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const facts = sizeFacts(shown.percent, shown.pick);
	const bars: Bar[] = [
		{
			id: "rule",
			label: t(["Your limit", "你的上限"]),
			value: facts.budget / 100,
		},
		...(["dear", "cheap", "spread"] as const).map((id) => ({
			id,
			label: t(pickShort[id]),
			value: worstCase(pricePerShare[id]) / 100,
		})),
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"The most you accept losing on one trade, beside the most one contract of each candidate can lose",
						"你在一笔交易上愿意承受的最大亏损，与每个候选一张合约最多可能亏的金额并排比较",
					])}
					height={(width) => (width < 520 ? 240 : 270)}
				>
					{(width) => (
						<BarChart
							width={width}
							height={width < 520 ? 240 : 270}
							bars={bars}
							max={500}
							format={(value) => whole(value * 100)}
							title={t([
								"Worst case of one contract · premium × 100",
								"一张合约的最坏情况 · 权利金 × 100",
							])}
							focus={shown.pick}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "worst",
					label: t(["Worst case per contract", "每张最坏情况"]),
					value: whole(facts.worst),
					note: t([
						`${usd(pricePerShare[shown.pick])} a share × 100`,
						`每股 ${usd(pricePerShare[shown.pick])} × 100`,
					]),
					evidence: "calculated",
				},
				{
					id: "fits",
					label: t(["Contracts that fit", "能买的张数"]),
					value: count(facts.contracts),
					note: t([
						`${whole(facts.budget)} ÷ ${whole(facts.worst)}, rounded down`,
						`${whole(facts.budget)} ÷ ${whole(facts.worst)}，向下取整`,
					]),
					tone: "focus",
					evidence: "calculated",
				},
				{
					id: "cash",
					label: t(["Cash paid, all at risk", "支付的现金，全部有风险"]),
					value: whole(facts.atRisk),
					note: t([
						`${percent(facts.atRisk / ACCOUNT)} of ${whole(ACCOUNT)}`,
						`占 ${whole(ACCOUNT)} 的 ${percent(facts.atRisk / ACCOUNT)}`,
					]),
					evidence: "calculated",
				},
			]}
			scope={t([
				"Before fees. The percentage is an example of one common rule, not a recommendation; your own limit is yours to set.",
				"未计费用。这个百分比只是一种常见规则的示例，不是建议；你自己的上限由你来定。",
			])}
			controls={
				explore ? (
					<FieldGroup>
						<RangeControl
							label={t(["Limit per trade", "每笔交易的上限"])}
							value={explore.percent}
							display={t([
								`${rule(explore.percent)} of ${whole(ACCOUNT)} = ${whole(sizeFacts(explore.percent, explore.pick).budget)}`,
								`${whole(ACCOUNT)} 的 ${rule(explore.percent)} = ${whole(sizeFacts(explore.percent, explore.pick).budget)}`,
							])}
							min={PERCENT_RANGE.min}
							max={PERCENT_RANGE.max}
							step={PERCENT_RANGE.step}
							onChange={(value) => setExplore({ ...explore, percent: value })}
						/>
						<ChoiceField
							label={t(["Candidate", "候选"])}
							value={explore.pick}
							options={(["dear", "cheap", "spread"] as const).map(
								(id) => [id, t(pickLabel[id])] as const,
							)}
							onChange={(value) => setExplore({ ...explore, pick: value })}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"An option you buy can lose its whole premium and no more, so the premium times 100 is the worst case of one contract. The spread here buys the 105 call and sells the 110 call; the most it can lose is the net premium paid. What the account must hold: under FINRA and exchange margin rules, an option with nine months or less to expiry is paid for in full, in cash, and cannot be bought with a broker's loan the way shares can. Writing options is different. It ties up collateral or margin, writing uncovered options needs a higher level of options approval, and each broker sets its own levels and may require more than the rules' minimum.",
						"买入的期权最多亏掉全部权利金，不会更多，所以权利金乘以 100 就是一张合约的最坏情况。这里的价差是买入 105 看涨、卖出 110 看涨，它最多亏掉所付的净权利金。账户里必须有什么：按照 FINRA 和交易所的保证金规则，距到期不超过九个月的期权必须用现金全额支付，不能像买股票那样向券商借钱。卖出期权则不同：它会占用担保品或保证金，卖出未备兑期权还需要更高级别的期权权限；各券商自行设定级别，要求也可能高于规则的最低标准。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: a run of losses ———

type StreakState = { percent: number; losses: number };

const dollarsLeft = (value: number) => whole(Math.round(value));

function StreakView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: StreakState;
	explore: StreakState | null;
	setExplore: (next: StreakState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const left = afterLosses(shown.percent, shown.losses);
	const lost = lostAfter(shown.percent, shown.losses);
	const lines: PayoffLine[] = [
		{
			id: "small",
			label: t([
				`${rule(SMALL_PERCENT)} each time`,
				`每次 ${rule(SMALL_PERCENT)}`,
			]),
			points: streakPath(SMALL_PERCENT),
			tone: "reference",
			hidden: shown.percent === SMALL_PERCENT,
		},
		{
			id: "chosen",
			label: t([
				`${rule(shown.percent)} each time`,
				`每次 ${rule(shown.percent)}`,
			]),
			points: streakPath(shown.percent),
			tone: "position",
		},
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"What is left of the account after each loss in a row, at the chosen share lost each time",
						"按所选的每次亏损比例，连续亏损后账户每一步还剩多少",
					])}
					height={(width) => (width < 520 ? 250 : 290)}
				>
					{(width) => (
						<PayoffChart
							width={width}
							height={width < 520 ? 250 : 290}
							xRange={[0, STREAK]}
							yRange={[0, 11_000]}
							xTicks={[0, 2, 4, 6, 8, 10]}
							yTicks={[0, 5_000, 10_000]}
							lines={lines}
							markers={[
								{
									id: "now",
									x: shown.losses,
									y: left / 100,
									label: dollarsLeft(left),
									tone: "neutral",
								},
							]}
							xLabel={t(["Losses in a row", "连续亏损次数"])}
							title={t([
								`Account balance · starts at ${whole(ACCOUNT)}`,
								`账户余额 · 起点 ${whole(ACCOUNT)}`,
							])}
							formatY={(value) => whole(value * 100)}
							formatX={(value) => String(value)}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "left",
					label: t(["Left in the account", "账户余额"]),
					value: dollarsLeft(left),
					tween: { to: left, format: dollarsLeft },
					evidence: "calculated",
				},
				{
					id: "lost",
					label: t(["Lost so far", "已亏损"]),
					value: percent(-lost),
					tone: lost > 0 ? "loss" : undefined,
					evidence: "calculated",
				},
				{
					id: "back",
					label: t(["Gain needed to get back", "回到原点所需涨幅"]),
					value: `+${percent(gainToRecover(lost))}`,
					note: t([
						`on the ${dollarsLeft(left)} that is left`,
						`以剩下的 ${dollarsLeft(left)} 为基数`,
					]),
					evidence: "calculated",
				},
			]}
			scope={t([
				"Every trade loses the same share of what is left. Real results are uneven; this isolates what size does to a losing streak.",
				"每笔交易都亏掉余额的同一比例。真实结果参差不齐；这里只单独看仓位大小对连续亏损的影响。",
			])}
			controls={
				explore ? (
					<FieldGroup>
						<RangeControl
							label={t(["Lost on each trade", "每笔亏损"])}
							value={explore.percent}
							display={t([
								`${rule(explore.percent)} of what is left`,
								`余额的 ${rule(explore.percent)}`,
							])}
							min={1}
							max={25}
							onChange={(value) => setExplore({ ...explore, percent: value })}
						/>
						<RangeControl
							label={t(["Losses in a row", "连续亏损次数"])}
							value={explore.losses}
							display={count(explore.losses)}
							min={0}
							max={STREAK}
							onChange={(value) => setExplore({ ...explore, losses: value })}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						"Losses compound: each one is taken from a smaller account, and the gain needed to undo a loss grows faster than the loss. Losing 10% needs an 11.1% gain to get back, losing 50% needs 100%, and losing 90% needs 900%. Nobody knows in advance how long a losing streak will run, including traders whose ideas are right more often than not, which is why size is decided before the trade and not after the result.",
						"亏损会复利累积：每一次都是从更小的账户里扣，而补回亏损所需的涨幅比亏损本身增长得更快。亏 10% 要涨 11.1% 才能回来，亏 50% 要涨 100%，亏 90% 要涨 900%。没有人能事先知道连续亏损会持续多久，即使是判断对多错少的交易者也一样，所以仓位大小要在交易之前决定，而不是等结果出来之后。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: the exit plan ———

type ExitState = { outcome: Outcome };

const outcomeLabel: Record<Outcome, Copy> = {
	target: ["Profit point", "止盈点"],
	time: ["Time stop", "时间止损"],
	stop: ["Loss point", "止损点"],
	gap: ["Gap open", "跳空开盘"],
	worthless: ["Held to expiry", "持有到期"],
};
const outcomeOrder: readonly Outcome[] = [
	"target",
	"time",
	"stop",
	"gap",
	"worthless",
];
const outcomeNote: Record<Outcome, Copy> = {
	target: [
		`The call reaches ${usd(PROFIT_POINT)} and the plan sells it there.`,
		`看涨涨到 ${usd(PROFIT_POINT)}，按计划在这里卖出。`,
	],
	time: [
		`${TIME_STOP_LABEL[0]}: ALFA is $${TIME_STOP_SPOT}, neither price was reached, and the plan sells at about ${usd(TIME_STOP_VALUE)}.`,
		`${TIME_STOP_LABEL[1]}：ALFA 为 $${TIME_STOP_SPOT}，两个价格都没到，按计划以约 ${usd(TIME_STOP_VALUE)} 卖出。`,
	],
	stop: [
		`The call falls to ${usd(LOSS_POINT)} during the trading day and the plan sells it there.`,
		`看涨在交易时段内跌到 ${usd(LOSS_POINT)}，按计划在这里卖出。`,
	],
	gap: [
		`The call closes at ${usd(BEFORE_GAP)}, then opens at ${usd(GAP_OPEN)} after earnings. The order sells at the open.`,
		`看涨收在 ${usd(BEFORE_GAP)}，财报后开在 ${usd(GAP_OPEN)}。卖单在开盘价成交。`,
	],
	worthless: [
		`No exit is used and ALFA ends below $${cheapCall.strike} on ${EXPIRY_LABEL[0]}: the call expires worthless.`,
		`没有执行任何出场，ALFA 在 ${EXPIRY_LABEL[1]} 收在 $${cheapCall.strike} 以下：看涨作废。`,
	],
};

function ExitView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ExitState;
	explore: ExitState | null;
	setExplore: (next: ExitState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const facts = outcomes[shown.outcome];
	const bars: Bar[] = [
		{ id: "paid", label: t(["Paid", "已付"]), value: PLAN_PAID },
		...outcomeOrder.map((id) => ({
			id,
			label: t(outcomeLabel[id]),
			value: outcomes[id].exit,
		})),
	];
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"What one contract was bought for, and what it sells for under each way the trade can end",
						"一张合约的买入金额，以及在交易的每种结束方式下它能卖回多少",
					])}
					height={(width) => (width < 520 ? 250 : 280)}
				>
					{(width) => (
						<BarChart
							width={width}
							height={width < 520 ? 250 : 280}
							bars={bars}
							max={400}
							format={(value) => whole(value * 100)}
							title={t([
								`1 ${contractLabel(cheapCall)[0]} · money back per contract`,
								`1 张 ${contractLabel(cheapCall)[1]} · 每张收回的金额`,
							])}
							focus={shown.outcome}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "sold",
					label: t(["Sold at", "卖出价"]),
					value: t([`${usd(facts.exit)} a share`, `每股 ${usd(facts.exit)}`]),
					note: t(outcomeNote[shown.outcome]),
					evidence:
						shown.outcome === "time" || shown.outcome === "gap"
							? "modeled"
							: "calculated",
				},
				{
					id: "result",
					label: t(["Result per contract", "每张合约盈亏"]),
					value: signedUsd(facts.result, 0),
					tone: facts.result > 0 ? "gain" : "loss",
					note: t([`paid ${usd(PLAN_PAID)}`, `已付 ${usd(PLAN_PAID)}`]),
					evidence: "calculated",
				},
				{
					id: "planned",
					label: t(["Against the planned loss", "与计划亏损相比"]),
					value:
						facts.result < PLANNED_LOSS
							? t([
									`${whole(PLANNED_LOSS - facts.result)} worse`,
									`多亏 ${whole(PLANNED_LOSS - facts.result)}`,
								])
							: t(["Within the plan", "在计划之内"]),
					tone: facts.result < PLANNED_LOSS ? "caution" : undefined,
					note: t([
						`planned ${signedUsd(PLANNED_LOSS, 0)}`,
						`计划 ${signedUsd(PLANNED_LOSS, 0)}`,
					]),
				},
			]}
			scope={t([
				"Before fees. The prices at the time stop and after the gap are model values, not quotes; the exits are examples, not recommendations.",
				"未计费用。时间止损当天和跳空后的价格是模型价值，不是报价；这些出场条件只是示例，不是建议。",
			])}
			controls={
				explore ? (
					<FieldGroup>
						<ChoiceField
							label={t(["How the trade ends", "交易如何结束"])}
							value={explore.outcome}
							options={outcomeOrder.map(
								(id) => [id, t(outcomeLabel[id])] as const,
							)}
							onChange={(outcome) => setExplore({ outcome })}
						/>
					</FieldGroup>
				) : null
			}
			details={
				<p>
					{t([
						`An exit plan is written on the day of the purchase, while nothing has happened yet: a profit point, a loss point and a time stop. The time stop here is ${TIME_STOP_DAYS_LEFT} days before expiry, because time value drains fastest in the last weeks. None of the three is a guarantee. Listed stock options trade only during regular market hours, so news that arrives overnight shows up as a jump at the next open. A stop order becomes a market order once its price is reached, and it fills at the next available price, which can be far from the stop. Regulators' guidance on stop orders is written about stocks; the same mechanics apply to options, whose wider spreads make it matter more. Read Tradely's `,
						`出场计划在买入当天就写好，那时什么都还没发生：一个止盈点、一个止损点和一个时间止损。这里的时间止损定在到期前 ${TIME_STOP_DAYS_LEFT} 天，因为时间价值在最后几周流失得最快。三者都不是保证。上市股票期权只在常规交易时段交易，所以隔夜到来的消息会表现为下一次开盘时的跳空。止损单在价格触及后会变成市价单，按下一个可成交的价格成交，可能离止损价很远。监管机构关于止损单的说明是针对股票写的；同样的机制也适用于期权，而期权更宽的价差让这一点更重要。请阅读 Tradely 的`,
					])}
					<a href="/risk-disclosure" className="underline underline-offset-4">
						{t(["risk disclosure", "风险披露"])}
					</a>
					{t([".", "。"])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<SizeState, SizeState>({
		id: "size",
		label: ["Size", "仓位大小"],
		title: [
			"Size is a division you do before you buy",
			"仓位大小是买入前做的一道除法",
		],
		predict: {
			prompt: [
				"Your account holds $10,000 and your own rule, for this example, is to lose at most $200 on one trade. A call costs $4.20 a share. How many contracts fit inside the rule?",
				"你的账户有 $10,000。在这个例子里，你给自己定的规则是一笔交易最多亏 $200。一张看涨期权每股 $4.20。按这条规则能买几张？",
			],
			choices: [
				{ id: "none", label: ["None", "一张也买不了"] },
				{
					id: "one",
					label: ["1 contract", "1 张"],
					why: [
						"One contract covers 100 shares, so it costs $4.20 × 100 = $420, and a bought call can lose all of it. That is more than $200.",
						"一张合约对应 100 股，所以要花 $4.20 × 100 = $420，而买入的看涨可能全部亏光。这超过了 $200。",
					],
				},
				{
					id: "many",
					label: ["47 contracts", "47 张"],
					why: [
						"$200 ÷ $4.20 is about 47, but $4.20 is the price per share. One contract is 100 shares, $420, so 47 contracts would cost $19,740.",
						"$200 ÷ $4.20 约等于 47，但 $4.20 是每股价格。一张合约是 100 股，即 $420，所以 47 张要花 $19,740。",
					],
				},
			],
			answer: "none",
			entry: { answer: 0, unit: [" contracts", " 张"] },
			revealAt: 0,
			explain: [
				"One contract is $4.20 × 100 = $420, and all of it can be lost. $200 ÷ $420 rounds down to 0: under this rule the contract is too large.",
				"一张合约是 $4.20 × 100 = $420，而且可能全部亏掉。$200 ÷ $420 向下取整是 0：按这条规则，这张合约太大了。",
			],
		},
		beats: [
			{
				id: "dear",
				label: ["A $420 contract", "一张 $420 的合约"],
				caption: [
					`One common rule of thumb, used here as an example: lose at most ${rule(RULE_PERCENT)} of a ${whole(ACCOUNT)} account, ${whole(BUDGET)}, on one trade. The Oct 18 100 call is ${usd(DEAR_PRICE)} a share, ${whole(DEAR_WORST)} a contract: 0 contracts fit.`,
					`这里用一种常见的经验规则做例子：一笔交易最多亏掉 ${whole(ACCOUNT)} 账户的 ${rule(RULE_PERCENT)}，即 ${whole(BUDGET)}。10月18日 100 看涨每股 ${usd(DEAR_PRICE)}，每张 ${whole(DEAR_WORST)}：一张也买不了。`,
				],
				state: { percent: RULE_PERCENT, pick: "dear" },
			},
			{
				id: "cheap",
				label: ["A $180 contract", "一张 $180 的合约"],
				caption: [
					`The Nov 15 110 call is ${usd(CHEAP_PRICE)} a share, ${whole(CHEAP_WORST)} a contract. ${whole(BUDGET)} ÷ ${whole(CHEAP_WORST)} rounds down to 1 contract, paid in full with ${whole(CHEAP_WORST)} of cash.`,
					`11月15日 110 看涨每股 ${usd(CHEAP_PRICE)}，每张 ${whole(CHEAP_WORST)}。${whole(BUDGET)} ÷ ${whole(CHEAP_WORST)} 向下取整是 1 张，用 ${whole(CHEAP_WORST)} 现金全额支付。`,
				],
				state: { percent: RULE_PERCENT, pick: "cheap" },
			},
			{
				id: "spread",
				label: ["A spread", "一个价差"],
				caption: [
					`A spread has a smaller worst case: buying the Oct 18 105 call and selling the 110 call costs ${usd(SPREAD_PRICE)} a share, ${whole(SPREAD_WORST)} at most. One fits. A zero only says this contract is too large for this rule; it doesn't say what to do instead.`,
					`价差的最坏情况更小：买入 10月18日 105 看涨并卖出 110 看涨，每股花 ${usd(SPREAD_PRICE)}，最多亏 ${whole(SPREAD_WORST)}。可以做 1 个。结果为零只说明这张合约对这条规则来说太大，并不说明该改做什么。`,
				],
				state: { percent: RULE_PERCENT, pick: "spread" },
			},
		],
		explore: {
			prompt: [
				"Set the most you accept losing on one trade and pick a candidate. Read how many contracts fit and how much cash that puts at risk.",
				"设定一笔交易上你愿意承受的最大亏损，再选一个候选。看看能买几张，以及有多少现金处在风险中。",
			],
			start: () => ({ percent: RULE_PERCENT, pick: "cheap" }),
			task: {
				kind: "reach",
				prompt: [
					"Find the smallest limit at which one Oct 18 100 call fits.",
					"找出能买下 1 张 10月18日 100 看涨的最小上限。",
				],
				reached: (e) => e.pick === "dear" && e.percent === DEAR_FITS_AT,
				done: [
					`At ${rule(DEAR_FITS_AT)} the limit is ${whole(sizeFacts(DEAR_FITS_AT, "dear").budget)}, just over the ${whole(DEAR_WORST)} one contract can lose. The contract didn't change; the loss accepted on one trade more than doubled.`,
					`上限调到 ${rule(DEAR_FITS_AT)} 时是 ${whole(sizeFacts(DEAR_FITS_AT, "dear").budget)}，刚好超过一张合约可能亏掉的 ${whole(DEAR_WORST)}。合约没有变；变的是一笔交易上接受的亏损，多了一倍还不止。`,
				],
			},
		},
		View: SizeView,
	}),
	defineScene<StreakState, StreakState>({
		id: "streak",
		label: ["A losing streak", "连续亏损"],
		title: [
			"Size decides what a losing streak leaves",
			"仓位大小决定连续亏损后还剩多少",
		],
		predict: {
			prompt: [
				"An account falls from $10,000 to $5,000. What gain on the $5,000 that is left brings it back to $10,000?",
				"一个账户从 $10,000 跌到 $5,000。剩下的 $5,000 要涨多少，才能回到 $10,000？",
			],
			choices: [
				{ id: "double", label: ["100%", "100%"] },
				{
					id: "half",
					label: ["50%", "50%"],
					why: [
						"50% was lost on $10,000, but the gain is earned on the $5,000 that is left. 50% of $5,000 is $2,500, which only reaches $7,500.",
						"亏掉的 50% 是以 $10,000 为基数，而涨幅是以剩下的 $5,000 为基数。$5,000 的 50% 是 $2,500，只能回到 $7,500。",
					],
				},
				{
					id: "three-quarters",
					label: ["75%", "75%"],
					why: [
						"75% of $5,000 is $3,750, which reaches $8,750. Getting back the missing $5,000 takes a gain as large as everything that is left.",
						"$5,000 的 75% 是 $3,750，只能回到 $8,750。要补回少掉的 $5,000，涨幅必须和剩下的全部一样大。",
					],
				},
			],
			answer: "double",
			entry: { answer: 100, unit: ["%", "%"] },
			revealAt: 0,
			explain: [
				"The missing $5,000 has to be earned on the $5,000 that is left: $5,000 ÷ $5,000 = 100%. A loss always needs a larger gain to undo it.",
				"少掉的 $5,000 要靠剩下的 $5,000 赚回来：$5,000 ÷ $5,000 = 100%。亏损总是需要更大的涨幅才能补回。",
			],
		},
		beats: [
			{
				id: "half",
				label: ["Half gone", "亏掉一半"],
				caption: [
					"Lose half of $10,000 and $5,000 is left. Getting back takes $5,000 earned on $5,000: a 100% gain to undo a 50% loss.",
					"$10,000 亏掉一半，还剩 $5,000。要回到原点，得用 $5,000 再赚 $5,000：亏 50%，要涨 100% 才能补回。",
				],
				state: { percent: 50, losses: 1 },
			},
			{
				id: "large",
				label: ["Ten losses at 20%", "十连亏，每次 20%"],
				caption: [
					`Ten losses in a row, each taking ${rule(LARGE_PERCENT)} of what is left: ${whole(LARGE_LEFT)} remains of ${whole(ACCOUNT)}. Getting back from there takes a gain of +${percent(LARGE_RECOVER, 0)}.`,
					`连续亏十次，每次亏掉余额的 ${rule(LARGE_PERCENT)}：${whole(ACCOUNT)} 只剩 ${whole(LARGE_LEFT)}。从这里回到原点要涨 +${percent(LARGE_RECOVER, 0)}。`,
				],
				state: { percent: LARGE_PERCENT, losses: STREAK },
			},
			{
				id: "small",
				label: ["Ten losses at 2%", "十连亏，每次 2%"],
				caption: [
					`The same ten losses at ${rule(SMALL_PERCENT)} of what is left each time leave ${whole(SMALL_LEFT)}. Getting back takes +${percent(SMALL_RECOVER)}. The calls were just as wrong; only the size differed.`,
					`同样的十连亏，每次只亏余额的 ${rule(SMALL_PERCENT)}，还剩 ${whole(SMALL_LEFT)}。回到原点要涨 +${percent(SMALL_RECOVER)}。判断错得一样多，不同的只是仓位大小。`,
				],
				state: { percent: SMALL_PERCENT, losses: STREAK },
			},
		],
		explore: {
			prompt: [
				"Set the share lost on each trade and the number of losses in a row. Watch what is left and the gain needed to get back.",
				"设定每笔交易亏损的比例和连续亏损的次数，看看还剩多少，以及回到原点需要多大的涨幅。",
			],
			start: () => ({ percent: 10, losses: STREAK }),
			task: {
				kind: "reach",
				prompt: [
					"With ten losses in a row, find the largest share lost each time that still leaves more than half the account.",
					"在十连亏的情况下，找出每次亏损比例最大是多少，账户仍能剩下一半以上。",
				],
				reached: (e) => e.losses === STREAK && e.percent === HALF_KEPT_AT,
				done: [
					`At ${rule(HALF_KEPT_AT)} each time, ten losses leave ${dollarsLeft(afterLosses(HALF_KEPT_AT, STREAK))}; at ${rule(HALF_KEPT_AT + 1)} they leave ${dollarsLeft(afterLosses(HALF_KEPT_AT + 1, STREAK))}, under half. One percentage point of size separates the two.`,
					`每次 ${rule(HALF_KEPT_AT)} 时，十连亏后还剩 ${dollarsLeft(afterLosses(HALF_KEPT_AT, STREAK))}；每次 ${rule(HALF_KEPT_AT + 1)} 时只剩 ${dollarsLeft(afterLosses(HALF_KEPT_AT + 1, STREAK))}，不到一半。两者之间只差一个百分点的仓位。`,
				],
			},
		},
		View: StreakView,
	}),
	defineScene<ExitState, ExitState>({
		id: "exit",
		label: ["The exit plan", "出场计划"],
		title: [
			"An exit plan is written before entry, and is not a guarantee",
			"出场计划在入场前写好，但它不是保证",
		],
		predict: {
			prompt: [
				`You paid ${usd(PLAN_PAID)} a share for one call and wrote a loss point at ${usd(LOSS_POINT)}. The call closes at ${usd(BEFORE_GAP)}. ALFA reports earnings overnight and the call opens at ${usd(GAP_OPEN)}, where your order to sell fills. What does the contract lose?`,
				`你以每股 ${usd(PLAN_PAID)} 买入一张看涨，并写下止损点 ${usd(LOSS_POINT)}。这张看涨收在 ${usd(BEFORE_GAP)}。ALFA 隔夜公布财报，看涨开在 ${usd(GAP_OPEN)}，你的卖单就在这里成交。这张合约亏了多少？`,
			],
			choices: [
				{
					id: "gap",
					label: [whole(-GAP_RESULT), whole(-GAP_RESULT)],
				},
				{
					id: "planned",
					label: [whole(-PLANNED_LOSS), whole(-PLANNED_LOSS)],
					why: [
						`${whole(-PLANNED_LOSS)} was the plan: selling at ${usd(LOSS_POINT)}. But the call never traded there. It closed above the loss point and opened below it, and the order filled at ${usd(GAP_OPEN)}.`,
						`${whole(-PLANNED_LOSS)} 是计划中的亏损：在 ${usd(LOSS_POINT)} 卖出。但这张看涨从未在那个价格成交。它收在止损点之上，又开在止损点之下，卖单成交在 ${usd(GAP_OPEN)}。`,
					],
				},
				{
					id: "all",
					label: [whole(-WORST_RESULT), whole(-WORST_RESULT)],
					why: [
						`${whole(-WORST_RESULT)} is the whole premium, the most the contract could lose. Here it was sold at ${usd(GAP_OPEN)}, which brought ${whole(worstCase(GAP_OPEN))} back.`,
						`${whole(-WORST_RESULT)} 是全部权利金，也就是这张合约最多可能亏的金额。这次它在 ${usd(GAP_OPEN)} 卖出，收回了 ${whole(worstCase(GAP_OPEN))}。`,
					],
				},
			],
			answer: "gap",
			entry: {
				answer: -GAP_RESULT / 100,
				prefix: "$",
				tolerance: 0.5,
				eitherSign: true,
			},
			revealAt: 2,
			explain: [
				`(${usd(PLAN_PAID)} − ${usd(GAP_OPEN)}) × 100 = ${whole(-GAP_RESULT)}, not the ${whole(-PLANNED_LOSS)} planned. Options don't trade overnight, so the price jumped past the loss point. Sizing counts the whole ${whole(-WORST_RESULT)} for this reason.`,
				`（${usd(PLAN_PAID)} − ${usd(GAP_OPEN)}）× 100 = ${whole(-GAP_RESULT)}，而不是计划中的 ${whole(-PLANNED_LOSS)}。期权隔夜不交易，所以价格直接跳过了止损点。正因如此，计算仓位时要按全部的 ${whole(-WORST_RESULT)} 来算。`,
			],
		},
		beats: [
			{
				id: "plan",
				label: ["Three exits, written", "写下三个出场条件"],
				caption: [
					`Sep 16: you buy one Nov 15 110 call for ${usd(PLAN_PAID)} and write three exits. Profit point: sell at ${usd(PROFIT_POINT)}, ${signedUsd(PROFIT_RESULT, 0)}. Loss point: sell at ${usd(LOSS_POINT)}, ${signedUsd(PLANNED_LOSS, 0)}. Time stop: out by ${TIME_STOP_LABEL[0]}.`,
					`9月16日：你以 ${usd(PLAN_PAID)} 买入一张 11月15日 110 看涨，并写下三个出场条件。止盈点：${usd(PROFIT_POINT)} 卖出，${signedUsd(PROFIT_RESULT, 0)}。止损点：${usd(LOSS_POINT)} 卖出，${signedUsd(PLANNED_LOSS, 0)}。时间止损：${TIME_STOP_LABEL[1]} 之前离场。`,
				],
				state: { outcome: "target" },
			},
			{
				id: "stop",
				label: ["The loss point holds", "止损点如期成交"],
				caption: [
					`If the call slides to ${usd(LOSS_POINT)} while the market is open, the plan sells it there: ${signedUsd(PLANNED_LOSS, 0)}, half the premium.`,
					`如果看涨在开市期间一路跌到 ${usd(LOSS_POINT)}，就按计划在这里卖出：${signedUsd(PLANNED_LOSS, 0)}，权利金的一半。`,
				],
				state: { outcome: "stop" },
			},
			{
				id: "gap",
				label: ["A gap jumps past it", "跳空越过止损点"],
				caption: [
					`The call closes at ${usd(BEFORE_GAP)}. ALFA reports after the close and the call opens at ${usd(GAP_OPEN)}. The order sells at the open: ${signedUsd(GAP_RESULT, 0)}, not ${signedUsd(PLANNED_LOSS, 0)}.`,
					`看涨收在 ${usd(BEFORE_GAP)}。ALFA 在收盘后公布财报，看涨开在 ${usd(GAP_OPEN)}。卖单在开盘价成交：${signedUsd(GAP_RESULT, 0)}，而不是 ${signedUsd(PLANNED_LOSS, 0)}。`,
				],
				state: { outcome: "gap" },
			},
		],
		explore: {
			prompt: [
				"Step through the ways the trade can end and compare each result with the planned loss.",
				"逐一查看这笔交易的几种结束方式，把每个结果与计划亏损比较。",
			],
			start: () => ({ outcome: "time" }),
			task: {
				kind: "answer",
				prompt: [
					"Across all five endings, which is the largest loss one contract can show?",
					"在全部五种结束方式中，一张合约可能出现的最大亏损是多少？",
				],
				choices: [
					{
						id: "planned",
						label: [whole(-PLANNED_LOSS), whole(-PLANNED_LOSS)],
					},
					{ id: "gap", label: [whole(-GAP_RESULT), whole(-GAP_RESULT)] },
					{
						id: "all",
						label: [whole(-WORST_RESULT), whole(-WORST_RESULT)],
					},
				],
				answer: "all",
				done: [
					`${whole(-WORST_RESULT)}, the whole premium, when no exit is used and the call expires worthless. A planned exit can be missed or jumped past, so the size is worked out from this figure.`,
					`${whole(-WORST_RESULT)}，即全部权利金：没有执行任何出场、看涨到期作废时。计划中的出场可能没执行，也可能被跳空越过，所以仓位大小要按这个数字来算。`,
				],
			},
		},
		View: ExitView,
	}),
] as const;

export function SizeAndExitWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Player
			locale={locale}
			id="size-and-exit"
			label={[
				"Interactive lesson on sizing a trade and planning its exit",
				"仓位大小与出场计划互动课",
			]}
			film={sizeAndExitFilm}
			scenes={scenes}
		/>
	);
}
