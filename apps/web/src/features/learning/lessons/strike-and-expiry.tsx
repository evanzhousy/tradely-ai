import { type Copy, count, percent, pick } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField, RangeControl } from "../concept-scene";
import { Player } from "../walkthrough/player";
import { Label, Stage } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame } from "../walkthrough/walkthrough";
import { strikeAndExpiryFilm } from "./strike-and-expiry-film";
import {
	bidOn,
	breakEven,
	CHECK_DATE,
	daysLeft,
	decayPerDay,
	deltaOf,
	dollars,
	EXPIRY_SPOT,
	type ExpiryRowId,
	exact,
	expiryCall,
	expiryCalls,
	expiryName,
	fixed2,
	LATER_RANGE,
	NEAR_LEADS_AT,
	OTM_LEADS_AT,
	paid,
	perShare,
	type QuoteRowId,
	quoteRow,
	quoteRows,
	resultAtExpiry,
	resultOnCheck,
	resultSoon,
	returnOn,
	roundTrip,
	SOON_SPOT,
	SPOT,
	SPOT_RANGE,
	type StrikeId,
	signedDollars,
	signedPercent,
	spreadOf,
	spreadShare,
	stock,
	strikeCall,
	strikeCalls,
	TASK_CONTRACTS,
	worthAtExpiry,
} from "./strike-and-expiry-model";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

// ——— A small table drawn on the stage: one row per contract ———

type Cell = { text: string; under?: string; tone?: "gain" | "loss" | "muted" };
type Row = {
	id: string;
	name: string;
	under?: string;
	cells: readonly Cell[];
	focus?: boolean;
};

const ROW = 48;
const TOP = 58;
const tableHeight = (rows: number) => TOP + rows * (ROW + 6) + 2;
const nameWidth = (width: number, wide = 190, narrow = 112) =>
	width < 520 ? narrow : wide;

function ContractTable({
	width,
	title,
	heads,
	rows,
	names,
}: {
	width: number;
	title: string;
	/** Column headers; a long one is given as two short lines for a phone. */
	heads: readonly (readonly string[])[];
	rows: readonly Row[];
	/** Width of the name column. */
	names: number;
}) {
	const column = (width - 8 - names) / heads.length;
	return (
		<g>
			<Label x={8} y={16} tone="muted" maxWidth={width - 16}>
				{title}
			</Label>
			{heads.map((lines, j) =>
				lines.map((line, k) => (
					<Label
						key={`${j}-${line}`}
						x={names + column * (j + 0.5)}
						y={TOP - 10 - (lines.length - 1 - k) * 13}
						anchor="middle"
						tone="small"
						maxWidth={column - 4}
					>
						{line}
					</Label>
				)),
			)}
			{rows.map((row, i) => {
				const y = TOP + i * (ROW + 6);
				return (
					<g key={row.id}>
						<rect
							x={4}
							y={y}
							width={width - 8}
							height={ROW}
							rx={8}
							className={row.focus ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<Label
							x={14}
							y={y + (row.under ? 20 : ROW / 2 + 5)}
							maxWidth={names - 16}
						>
							{row.name}
						</Label>
						{row.under ? (
							<Label x={14} y={y + 36} tone="small" maxWidth={names - 16}>
								{row.under}
							</Label>
						) : null}
						{row.cells.map((cell, j) => (
							<g key={heads[j].join(" ")}>
								<Label
									x={names + column * (j + 0.5)}
									y={y + (cell.under ? 20 : ROW / 2 + 5)}
									anchor="middle"
									tone={cell.tone}
									maxWidth={column - 4}
								>
									{cell.text}
								</Label>
								{cell.under ? (
									<Label
										x={names + column * (j + 0.5)}
										y={y + 36}
										anchor="middle"
										tone="small"
										maxWidth={column - 4}
									>
										{cell.under}
									</Label>
								) : null}
							</g>
						))}
					</g>
				);
			})}
		</g>
	);
}

const toneOf = (value: number) =>
	value > 0 ? "gain" : value < 0 ? "loss" : "muted";
const resultTone = (value: number) =>
	value > 0 ? "gain" : value < 0 ? "loss" : "neutral";

// ——— Scene 1: strike sets how far ———

type StrikeState = { when: "entry" | "soon" | "expiry"; spot: number };

const callName = (id: StrikeId): Copy => {
	const { strike } = strikeCall(id).contract;
	return [`${strike} call`, `${strike} 看涨`];
};
const strikeResult = (id: StrikeId, state: StrikeState) => {
	const { contract } = strikeCall(id);
	return state.when === "soon"
		? resultSoon(contract, state.spot)
		: resultAtExpiry(contract, state.spot);
};
/** The calls that share the largest value, by name. */
const leaders = (
	value: (id: StrikeId) => number,
	locale: Locale,
	format: (value: number) => string,
) => {
	const top = Math.max(...strikeCalls.map((row) => value(row.id)));
	const names = strikeCalls
		.filter((row) => Math.abs(value(row.id) - top) < 1e-9)
		.map((row) => pick(callName(row.id), locale));
	return {
		names: names.length === strikeCalls.length ? null : names.join(" · "),
		figure: format(top),
	};
};

function StrikeView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: StrikeState;
	explore: StrikeState | null;
	setExplore: (next: StrikeState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const open = shown.when === "entry";
	const rows: Row[] = strikeCalls.map(({ id, contract, moneyness }) => {
		const result = strikeResult(id, shown);
		return {
			id,
			name: t(callName(id)),
			under: t(moneyness),
			cells: [
				{
					text: dollars(paid(contract)),
					under: `${perShare(paid(contract))} × 100`,
				},
				{
					text: exact(breakEven(contract)),
					under: `Delta ${fixed2(deltaOf(contract))}`,
				},
				open
					? { text: "—", tone: "muted" }
					: {
							text: signedDollars(result),
							under: signedPercent(returnOn(contract, result)),
							tone: toneOf(result),
						},
			],
		};
	});
	const inDollars = leaders(
		(id) => strikeResult(id, shown),
		locale,
		(value) => signedDollars(value),
	);
	const perDollar = leaders(
		(id) => returnOn(strikeCall(id).contract, strikeResult(id, shown)),
		locale,
		signedPercent,
	);
	const result: ResultItem[] = [
		{
			id: "spot",
			label: t(["ALFA", "ALFA"]),
			value: stock(shown.spot),
			note: open
				? t(["Sep 16, when you buy", "9月16日，买入时"])
				: shown.when === "soon"
					? t(["Sep 17, sold at the model bid", "9月17日，按模型买价卖出"])
					: t(["Oct 18, at expiry", "10月18日，到期时"]),
			evidence: shown.when === "soon" ? "modeled" : "calculated",
		},
	];
	if (!open)
		result.push(
			{
				id: "dollars",
				label: t(["Largest result in dollars", "按金额，结果最大的"]),
				value: inDollars.names ?? t(["all equal", "三张相同"]),
				note: inDollars.figure,
				evidence: shown.when === "soon" ? "modeled" : "calculated",
			},
			{
				id: "percent",
				label: t([
					"Largest result per dollar paid",
					"按每付出一美元，结果最大的",
				]),
				value: perDollar.names ?? t(["all equal", "三张相同"]),
				note: perDollar.figure,
				evidence: shown.when === "soon" ? "modeled" : "calculated",
			},
		);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Three ALFA Oct 18 calls bought on Sep 16, the 95, the 100 and the 105, each with its cost per contract, its break-even price, its delta and its result for one price of ALFA",
						"9月16日 买入的三张 ALFA 10月18日 看涨：95、100 与 105，各自的每张成本、盈亏平衡点、Delta，以及 ALFA 在某个价格时的结果",
					])}
					height={tableHeight(strikeCalls.length)}
				>
					{(width) => (
						<ContractTable
							width={width}
							names={nameWidth(width)}
							title={t([
								`ALFA Oct 18 calls · bought Sep 16 with ALFA at ${stock(SPOT)}`,
								`ALFA 10月18日 看涨 · 9月16日 买入，ALFA ${stock(SPOT)}`,
							])}
							heads={[
								[t(["Cost", "成本"])],
								[t(["Break-even", "盈亏平衡"])],
								open
									? [t(["Result", "结果"])]
									: [
											t(["Result", "结果"]),
											t([
												`ALFA ${stock(shown.spot)}`,
												`ALFA ${stock(shown.spot)}`,
											]),
										],
							]}
							rows={rows}
						/>
					)}
				</Stage>
			}
			result={result}
			scope={t([
				"One contract each, bought at the ask. Commissions and fees are left out, and a sale before expiry uses a model quote with implied volatility unchanged.",
				"每种各一张，按卖价买入。未计佣金与费用；到期前卖出用的是隐含波动率不变时的模型报价。",
			])}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["Look at", "查看"])}
							value={explore.when === "soon" ? "soon" : "expiry"}
							options={[
								["soon", t(["Sep 17, model", "9月17日（模型）"])],
								["expiry", t(["Oct 18, expiry", "10月18日 到期"])],
							]}
							onChange={(when) => setExplore({ ...explore, when })}
						/>
						<RangeControl
							label={t(["ALFA price", "ALFA 价格"])}
							value={explore.spot}
							display={stock(explore.spot)}
							min={SPOT_RANGE[0]}
							max={SPOT_RANGE[1]}
							step={1}
							onChange={(spot) => setExplore({ ...explore, spot })}
						/>
					</>
				) : null
			}
			details={
				<p>
					{t([
						"A call is in the money when its strike is below the stock's price, at the money when the two are about equal, and out of the money when the strike is above the price. A lower strike costs more because part of its price is value the call already has; a higher strike costs less and needs a bigger move, because at expiry the stock must be above the strike by the premium paid before the buyer is ahead. So the cheaper call ends worthless at more prices, and gains more per dollar paid when a large move does come. Before expiry all three move with the stock, the larger delta by more dollars. None of this says which strike to buy: each is a different bet on how far ALFA goes.",
						"看涨期权的行权价低于股价时是实值，两者大致相等时是平值，行权价高于股价时是虚值。行权价越低越贵，因为价格里有一部分是它已经具备的价值；行权价越高越便宜，但需要更大的涨幅：到期时，股价要比行权价高出所付的权利金，买方才开始盈利。所以便宜的看涨在更多的价格上到期归零，而大行情真的出现时，每付出一美元赚得更多。到期之前，三张都随股价变动，Delta 越大，变动的金额越多。这些都不说明该买哪个行权价：每一张都是对 ALFA 能涨多远的一种不同押注。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: expiry sets how long ———

type ExpiryState = { show: "cost" | "decay" | "later"; spot: number };

const NEAR = expiryCall("near").contract;
const MID = expiryCall("mid").contract;
const FAR = expiryCall("far").contract;
const laterDays = daysLeft(FAR) - daysLeft(MID);

function ExpiryView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ExpiryState;
	explore: ExpiryState | null;
	setExplore: (next: ExpiryState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const later = shown.show === "later";
	const laterCell = (id: ExpiryRowId): Cell => {
		const result = resultOnCheck(id, shown.spot);
		if (!later) return { text: "—", tone: "muted" };
		if (result === null)
			return {
				text: "—",
				under: t(["expired Sep 20", "已于 9月20日 到期"]),
				tone: "muted",
			};
		return {
			text: signedDollars(result),
			under:
				id === "mid"
					? t(["at expiry", "到期时"])
					: t(["model bid", "模型买价"]),
			tone: toneOf(result),
		};
	};
	const rows: Row[] = expiryCalls.map(({ id, contract }) => ({
		id,
		name: t(expiryName(contract)),
		under: t([
			`${daysLeft(contract)} days left`,
			`${daysLeft(contract)} 天后到期`,
		]),
		cells: [
			{
				text: dollars(paid(contract)),
				under: `${perShare(paid(contract))} × 100`,
			},
			shown.show === "cost"
				? { text: "—", tone: "muted" }
				: {
						text: exact(decayPerDay(contract)),
						under: t(["model", "模型"]),
						tone: "loss",
					},
			laterCell(id),
		],
	}));
	const mid = resultOnCheck("mid", shown.spot) ?? 0;
	const far = resultOnCheck("far", shown.spot) ?? 0;
	const result: ResultItem[] = [
		{
			id: "extra",
			label: t([`${laterDays} more days cost`, `多 ${laterDays} 天的代价`]),
			value: dollars(paid(FAR) - paid(MID)),
			note: t([
				`${dollars(paid(FAR))} against ${dollars(paid(MID))}, same strike`,
				`${dollars(paid(FAR))} 对 ${dollars(paid(MID))}，行权价相同`,
			]),
			evidence: "calculated",
		},
	];
	if (later)
		result.push(
			{
				id: "spot",
				label: t(["ALFA on Oct 18", "10月18日 的 ALFA"]),
				value: stock(shown.spot),
				evidence: "calculated",
			},
			{
				id: "mid",
				label: t(["Oct 18 call, at expiry", "10月18日 看涨，到期时"]),
				value: signedDollars(mid),
				note: t([
					`${dollars(worthAtExpiry(MID, shown.spot))} − ${dollars(paid(MID))}`,
					`${dollars(worthAtExpiry(MID, shown.spot))} − ${dollars(paid(MID))}`,
				]),
				tone: resultTone(mid),
				evidence: "calculated",
			},
			{
				id: "far",
				label: t([
					`Nov 15 call, ${laterDays} days left`,
					`11月15日 看涨，还剩 ${laterDays} 天`,
				]),
				value: signedDollars(far),
				note: t([
					`${dollars(bidOn(FAR, shown.spot, CHECK_DATE))} − ${dollars(paid(FAR))}`,
					`${dollars(bidOn(FAR, shown.spot, CHECK_DATE))} − ${dollars(paid(FAR))}`,
				]),
				tone: resultTone(far),
				evidence: "modeled",
			},
		);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"ALFA 100 calls for three expiries, Sep 20, Oct 18 and Nov 15, each with its cost per contract, its modeled time decay per day and its result on Oct 18",
						"三个到期日的 ALFA 100 看涨：9月20日、10月18日 与 11月15日，各自的每张成本、模型的每天时间损耗，以及 10月18日 的结果",
					])}
					height={tableHeight(expiryCalls.length)}
				>
					{(width) => (
						<ContractTable
							width={width}
							names={nameWidth(width, 190, 96)}
							title={t([
								`ALFA 100 calls · bought Sep 16 with ALFA at ${stock(SPOT)}`,
								`ALFA 100 看涨 · 9月16日 买入，ALFA ${stock(SPOT)}`,
							])}
							heads={[
								[t(["Cost", "成本"])],
								[t(["Time decay", "时间损耗"]), t(["a day", "每天"])],
								[t(["Result on", "结果"]), t(["Oct 18", "10月18日"])],
							]}
							rows={rows}
						/>
					)}
				</Stage>
			}
			result={result}
			scope={t([
				"One contract each, bought at the ask. The Nov 15 call's Oct 18 price is a model bid with implied volatility unchanged; a real quote that day could be higher or lower.",
				"每种各一张，按卖价买入。11月15日 看涨在 10月18日 的价格是隐含波动率不变时的模型买价；当天的真实报价可能更高，也可能更低。",
			])}
			controls={
				explore ? (
					<RangeControl
						label={t(["ALFA on Oct 18", "10月18日 的 ALFA"])}
						value={explore.spot}
						display={stock(explore.spot)}
						min={LATER_RANGE[0]}
						max={LATER_RANGE[1]}
						step={1}
						onChange={(spot) => setExplore({ ...explore, spot })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"With the same strike, a later expiry costs more: there is more time for the stock to move, and that time has a price. It also raises the break-even, so the view has to be right by more. In return the later contract loses less to time decay each day and is still alive when the nearer one has expired. A near expiry is cheaper and decays faster, and it needs the move to come soon. Time decay speeds up as expiry gets close, so today's daily figure is a model reading for today, not a constant. Neither choice is better in advance: one pays less and needs the move sooner, the other pays more and waits longer.",
						"行权价相同时，到期越晚越贵：股票有更多时间变动，而这段时间是有价格的。它也抬高了盈亏平衡点，所以看法要对得更多才行。换来的是：较晚到期的合约每天的时间损耗更小，较近的那张到期时它还在。近到期更便宜，损耗更快，需要行情很快出现。时间损耗在临近到期时会加快，所以今天的每日数字是模型对今天的读数，不是常数。事先看，两种选择没有哪个更好：一个付得少、要行情来得快，另一个付得多、等得更久。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: check the quote before choosing ———

type QuoteState = { pick: QuoteRowId; contracts: number; cost: boolean };

const quoteName = (id: QuoteRowId): Copy => {
	const { contract } = quoteRow(id);
	const date = expiryName(contract);
	return [`${date[0]} ${contract.strike}`, `${date[1]} ${contract.strike}`];
};
const LIQUID = quoteRow("c105");
const THIN = quoteRow("dec110");

function QuoteView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: QuoteState;
	explore: QuoteState | null;
	setExplore: (next: QuoteState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const picked = quoteRow(shown.pick);
	const rows: Row[] = quoteRows.map((row) => ({
		id: row.id,
		name: t(quoteName(row.id)),
		under: t(["call", "看涨"]),
		focus: row.id === shown.pick,
		cells: [
			{ text: perShare(row.bid) },
			{ text: perShare(row.ask) },
			{ text: perShare(spreadOf(row)) },
			{ text: count(row.openInterest) },
		],
	}));
	const result: ResultItem[] = [
		{
			id: "spread",
			label: t(["Ask minus bid", "卖价减买价"]),
			value: t([
				`${perShare(spreadOf(picked))} a share`,
				`每股 ${perShare(spreadOf(picked))}`,
			]),
			note: `${perShare(picked.ask)} − ${perShare(picked.bid)}`,
			evidence: "calculated",
		},
	];
	if (shown.cost)
		result.push(
			{
				id: "round-trip",
				label: t([
					`Bought and sold at once, ${shown.contracts === 1 ? "1 contract" : `${shown.contracts} contracts`}`,
					`买入后立刻卖出，${shown.contracts} 张`,
				]),
				value: signedDollars(-roundTrip(picked, shown.contracts)),
				note: `${perShare(spreadOf(picked))} × 100 × ${shown.contracts}`,
				tone: "loss",
				evidence: "calculated",
			},
			{
				id: "share",
				label: t(["As a share of the price paid", "占所付价格的比例"]),
				value: percent(spreadShare(picked)),
				note: t([
					`${perShare(spreadOf(picked))} of ${perShare(picked.ask)}`,
					`${perShare(picked.ask)} 中的 ${perShare(spreadOf(picked))}`,
				]),
				evidence: "calculated",
			},
			{
				id: "open-interest",
				label: t(["Open interest", "未平仓量"]),
				value: count(picked.openInterest),
				note: t([
					"contracts open at Friday's close",
					"上周五收盘时未平仓的张数",
				]),
				evidence: "observed",
			},
		);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Four ALFA calls with their bid, ask, the difference between the two and their open interest; the selected contract is highlighted",
						"四张 ALFA 看涨的买价、卖价、两者之差与未平仓量；选中的合约被突出显示",
					])}
					height={tableHeight(quoteRows.length)}
				>
					{(width) => (
						<ContractTable
							width={width}
							names={nameWidth(width, 170, 92)}
							title={t([
								"ALFA calls · quotes on Sep 16, per share",
								"ALFA 看涨 · 9月16日 报价，每股",
							])}
							heads={[
								[t(["Bid", "买价"])],
								[t(["Ask", "卖价"])],
								[t(["Ask − bid", "卖价 − 买价"])],
								[t(["Open", "未平仓量"]), t(["interest", "（张）"])],
							]}
							rows={rows}
						/>
					)}
				</Stage>
			}
			result={result}
			scope={t([
				"A round trip at an unchanged quote: buy at the ask, sell at the bid. Commissions and fees come on top and differ by broker.",
				"报价不变时的一进一出：按卖价买入，按买价卖出。佣金与费用另计，各家券商不同。",
			])}
			controls={
				explore ? (
					<>
						<ChoiceField
							label={t(["Contract", "合约"])}
							value={explore.pick}
							options={quoteRows.map(
								(row) => [row.id, t(quoteName(row.id))] as const,
							)}
							onChange={(pick) => setExplore({ ...explore, pick })}
						/>
						<RangeControl
							label={t(["Contracts", "张数"])}
							value={explore.contracts}
							display={String(explore.contracts)}
							min={1}
							max={5}
							step={1}
							onChange={(contracts) => setExplore({ ...explore, contracts })}
						/>
					</>
				) : null
			}
			details={
				<p>
					{t([
						"Every contract in a chain has its own quote. You buy at the ask and sell at the bid, so the gap between them is a cost paid on the way in and again on the way out, before the stock has moved at all. Open interest is the number of contracts that exist right now: opened and not yet closed. A contract with a wide gap and little open interest usually has few people quoting it, so it costs more to enter and to leave, and a large order can move its price. A limit order between the bid and the ask may fill or may not. Quotes and open interest change through the day and from day to day, so this is a check to repeat at the moment of the trade, for whichever contract is being considered.",
						"期权链上的每张合约都有自己的报价。买入按卖价，卖出按买价，所以两者之差是一笔进场付一次、出场再付一次的成本，而这时股价还一点没动。未平仓量是此刻存在的合约张数：已经开仓、尚未平仓。价差宽、未平仓量少的合约，通常报价的人也少，进出的成本更高，较大的订单还可能推动它的价格。挂在买价和卖价之间的限价单可能成交，也可能不成交。报价和未平仓量在一天之内、在不同日子都会变，所以无论考虑哪张合约，这都是下单那一刻要再做一次的检查。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const ITM = strikeCall("itm").contract;
const ATM = strikeCall("atm").contract;
const OTM = strikeCall("otm").contract;
const otmLoss = dollars(-resultAtExpiry(OTM, EXPIRY_SPOT));

const scenes = [
	defineScene<StrikeState, StrikeState>({
		id: "strike",
		label: ["Compare three strikes", "比较三个行权价"],
		title: ["Strike sets how far ALFA must go", "行权价决定 ALFA 要涨多远"],
		predict: {
			prompt: [
				`ALFA is ${stock(SPOT)} on Sep 16. You buy one Oct 18 call at the ask: the ${ITM.strike} for ${dollars(paid(ITM))}, the ${ATM.strike} for ${dollars(paid(ATM))} or the ${OTM.strike} for ${dollars(paid(OTM))}. ALFA closes at ${stock(EXPIRY_SPOT)} on Oct 18. Which of the three ends with a loss?`,
				`9月16日 ALFA 为 ${stock(SPOT)}。你按卖价买入一张 10月18日 看涨：${ITM.strike} 的 ${dollars(paid(ITM))}、${ATM.strike} 的 ${dollars(paid(ATM))}，或 ${OTM.strike} 的 ${dollars(paid(OTM))}。10月18日 ALFA 收在 ${stock(EXPIRY_SPOT)}。三张里哪一张以亏损收场？`,
			],
			choices: [
				{
					id: "otm",
					label: [`The ${OTM.strike} call`, `${OTM.strike} 看涨`],
				},
				{
					id: "none",
					label: [
						"None: ALFA rose, so every call gains",
						"都不亏：ALFA 涨了，每张看涨都赚",
					],
					why: [
						`A call gains at expiry only if the stock ends above its strike by more than the premium paid. The ${OTM.strike} call is worth ${dollars(worthAtExpiry(OTM, EXPIRY_SPOT))} at ${stock(EXPIRY_SPOT)} and cost ${dollars(paid(OTM))}.`,
						`到期时，股价要比行权价高出所付的权利金，看涨才盈利。${stock(EXPIRY_SPOT)} 时 ${OTM.strike} 看涨值 ${dollars(worthAtExpiry(OTM, EXPIRY_SPOT))}，而它的成本是 ${dollars(paid(OTM))}。`,
					],
				},
				{
					id: "itm",
					label: [
						`The ${ITM.strike} call: it cost the most`,
						`${ITM.strike} 看涨：它最贵`,
					],
					why: [
						`It cost the most, but it is worth the most at expiry too: ${dollars(worthAtExpiry(ITM, EXPIRY_SPOT))} at ${stock(EXPIRY_SPOT)} against the ${dollars(paid(ITM))} paid.`,
						`它最贵，但到期时也最值钱：${stock(EXPIRY_SPOT)} 时值 ${dollars(worthAtExpiry(ITM, EXPIRY_SPOT))}，而付出的是 ${dollars(paid(ITM))}。`,
					],
				},
			],
			answer: "otm",
			revealAt: 2,
			explain: [
				`At ${stock(EXPIRY_SPOT)} the ${OTM.strike} call is worth ${dollars(worthAtExpiry(OTM, EXPIRY_SPOT))} and cost ${dollars(paid(OTM))}: a loss of ${otmLoss}. Its break-even is ${exact(breakEven(OTM))}, and ALFA stopped short of it.`,
				`${stock(EXPIRY_SPOT)} 时 ${OTM.strike} 看涨值 ${dollars(worthAtExpiry(OTM, EXPIRY_SPOT))}，成本 ${dollars(paid(OTM))}：亏 ${otmLoss}。它的盈亏平衡点是 ${exact(breakEven(OTM))}，ALFA 没有涨到。`,
			],
		},
		beats: [
			{
				id: "three",
				label: ["Three calls", "三张看涨"],
				caption: [
					`You think ALFA, ${stock(SPOT)} today, will be higher in a month. Three Oct 18 calls fit that view. The ${ITM.strike} call is in the money (its strike is below ALFA's price) and costs ${dollars(paid(ITM))}; the ${ATM.strike} is at the money and costs ${dollars(paid(ATM))}; the ${OTM.strike} is out of the money (strike above the price) and costs ${dollars(paid(OTM))}.`,
					`你认为今天 ${stock(SPOT)} 的 ALFA 一个月后会更高。三张 10月18日 看涨都能表达这个看法。${ITM.strike} 看涨是实值（行权价低于 ALFA 的价格），成本 ${dollars(paid(ITM))}；${ATM.strike} 是平值，成本 ${dollars(paid(ATM))}；${OTM.strike} 是虚值（行权价高于价格），成本 ${dollars(paid(OTM))}。`,
				],
				state: { when: "entry", spot: SPOT },
			},
			{
				id: "soon",
				label: ["A day later", "一天之后"],
				caption: [
					`Suppose ALFA is ${stock(SOON_SPOT)} the next day. At the model's bid each call could be sold for more than it cost: ${signedDollars(resultSoon(ITM))}, ${signedDollars(resultSoon(ATM))} and ${signedDollars(resultSoon(OTM))}. The larger delta moves by more dollars; the cheaper call gains more per dollar paid.`,
					`假设第二天 ALFA 到了 ${stock(SOON_SPOT)}。按模型的买价，每张都能以高于成本的价格卖出：${signedDollars(resultSoon(ITM))}、${signedDollars(resultSoon(ATM))} 和 ${signedDollars(resultSoon(OTM))}。Delta 越大，变动的金额越多；越便宜的看涨，每付出一美元赚得越多。`,
				],
				state: { when: "soon", spot: SOON_SPOT },
			},
			{
				id: "expiry",
				label: ["At expiry", "到期时"],
				caption: [
					`Suppose instead you hold to Oct 18 and ALFA closes at ${stock(EXPIRY_SPOT)}. The results are ${signedDollars(resultAtExpiry(ITM, EXPIRY_SPOT))}, ${signedDollars(resultAtExpiry(ATM, EXPIRY_SPOT))} and ${signedDollars(resultAtExpiry(OTM, EXPIRY_SPOT))}. ALFA rose ${stock(EXPIRY_SPOT - SPOT)} and the ${OTM.strike} call still lost: its break-even is ${exact(breakEven(OTM))}.`,
					`假设你改为持有到 10月18日，ALFA 收在 ${stock(EXPIRY_SPOT)}。结果是 ${signedDollars(resultAtExpiry(ITM, EXPIRY_SPOT))}、${signedDollars(resultAtExpiry(ATM, EXPIRY_SPOT))} 和 ${signedDollars(resultAtExpiry(OTM, EXPIRY_SPOT))}。ALFA 涨了 ${stock(EXPIRY_SPOT - SPOT)}，${OTM.strike} 看涨仍然亏损：它的盈亏平衡点是 ${exact(breakEven(OTM))}。`,
				],
				state: { when: "expiry", spot: EXPIRY_SPOT },
			},
		],
		explore: {
			prompt: [
				"Move ALFA's price and switch between the day after and expiry.",
				"移动 ALFA 的价格，并在第二天与到期日之间切换。",
			],
			start: () => ({ when: "expiry", spot: SPOT + 3 }),
			task: {
				kind: "reach",
				prompt: [
					`At expiry, find the lowest price at which the ${OTM.strike} call gains more per dollar paid than the ${ITM.strike} call.`,
					`在到期日，找出 ${OTM.strike} 看涨按每付出一美元计比 ${ITM.strike} 看涨赚得更多的最低价格。`,
				],
				reached: (e) => e.when === "expiry" && e.spot === OTM_LEADS_AT,
				done: [
					`At ${stock(OTM_LEADS_AT)} the ${OTM.strike} call returns ${signedPercent(returnOn(OTM, resultAtExpiry(OTM, OTM_LEADS_AT)))} on ${dollars(paid(OTM))} and the ${ITM.strike} call ${signedPercent(returnOn(ITM, resultAtExpiry(ITM, OTM_LEADS_AT)))} on ${dollars(paid(ITM))}. Below ${exact(breakEven(OTM))} the ${OTM.strike} call lost while the ${ITM.strike} call was already ahead. The cheaper call needs the bigger move and pays more per dollar when it comes.`,
					`${stock(OTM_LEADS_AT)} 时，${OTM.strike} 看涨在 ${dollars(paid(OTM))} 上的回报是 ${signedPercent(returnOn(OTM, resultAtExpiry(OTM, OTM_LEADS_AT)))}，${ITM.strike} 看涨在 ${dollars(paid(ITM))} 上是 ${signedPercent(returnOn(ITM, resultAtExpiry(ITM, OTM_LEADS_AT)))}。在 ${exact(breakEven(OTM))} 以下，${OTM.strike} 看涨是亏的，而 ${ITM.strike} 看涨早已盈利。越便宜的看涨需要越大的涨幅，行情到来时每一美元赚得也越多。`,
				],
			},
		},
		View: StrikeView,
	}),
	defineScene<ExpiryState, ExpiryState>({
		id: "expiry",
		label: ["Compare three expiries", "比较三个到期日"],
		title: ["Expiry sets how long ALFA has", "到期日决定 ALFA 有多久"],
		predict: {
			prompt: [
				`The Oct 18 ${MID.strike} call costs ${dollars(paid(MID))} a contract. The Nov 15 ${FAR.strike} call has the same strike and ${laterDays} more days. How do its price and its daily time decay compare?`,
				`10月18日 ${MID.strike} 看涨每张 ${dollars(paid(MID))}。11月15日 ${FAR.strike} 看涨行权价相同，多 ${laterDays} 天。它的价格和每天的时间损耗相比如何？`,
			],
			choices: [
				{
					id: "more-slower",
					label: ["It costs more and loses less a day", "更贵，每天损耗更少"],
				},
				{
					id: "more-faster",
					label: ["It costs more and loses more a day", "更贵，每天损耗也更多"],
					why: [
						`It holds more time value in total, but spread over many more days: the model has it losing ${exact(-decayPerDay(FAR))} a day against ${exact(-decayPerDay(MID))} for the Oct 18 call.`,
						`它的时间价值总量更多，但摊在多得多的天数上：模型中它每天损耗 ${exact(-decayPerDay(FAR))}，而 10月18日 看涨是 ${exact(-decayPerDay(MID))}。`,
					],
				},
				{
					id: "same",
					label: [
						"The same price: the strike is the same",
						"价格相同：行权价一样",
					],
					why: [
						`A price also pays for time. With ${laterDays} more days for ALFA to move, the Nov 15 call costs ${dollars(paid(FAR))} against ${dollars(paid(MID))}.`,
						`价格里还包含时间。ALFA 多了 ${laterDays} 天可以变动，11月15日 看涨要 ${dollars(paid(FAR))}，而不是 ${dollars(paid(MID))}。`,
					],
				},
			],
			answer: "more-slower",
			revealAt: 1,
			explain: [
				`The Nov 15 call costs ${dollars(paid(FAR))}, ${dollars(paid(FAR) - paid(MID))} more, and the model has it losing ${exact(-decayPerDay(FAR))} a day against ${exact(-decayPerDay(MID))}. More time costs more and wears away more slowly.`,
				`11月15日 看涨要 ${dollars(paid(FAR))}，贵 ${dollars(paid(FAR) - paid(MID))}；模型中它每天损耗 ${exact(-decayPerDay(FAR))}，而 10月18日 的是 ${exact(-decayPerDay(MID))}。时间越多越贵，损耗也越慢。`,
			],
		},
		beats: [
			{
				id: "cost",
				label: ["Cost", "成本"],
				caption: [
					`The same ${MID.strike} strike, three expiries. Sep 20, ${daysLeft(NEAR)} days away, costs ${dollars(paid(NEAR))}; Oct 18, ${daysLeft(MID)} days, ${dollars(paid(MID))}; Nov 15, ${daysLeft(FAR)} days, ${dollars(paid(FAR))}. More time costs more, and lifts the break-even: ${exact(breakEven(NEAR))}, ${exact(breakEven(MID))}, ${exact(breakEven(FAR))}.`,
					`同样是 ${MID.strike} 的行权价，三个到期日。9月20日 还有 ${daysLeft(NEAR)} 天，成本 ${dollars(paid(NEAR))}；10月18日 ${daysLeft(MID)} 天，${dollars(paid(MID))}；11月15日 ${daysLeft(FAR)} 天，${dollars(paid(FAR))}。时间越多越贵，盈亏平衡点也越高：${exact(breakEven(NEAR))}、${exact(breakEven(MID))}、${exact(breakEven(FAR))}。`,
				],
				state: { show: "cost", spot: SPOT },
			},
			{
				id: "decay",
				label: ["Decay", "损耗"],
				caption: [
					`Time decay (theta) is what a day takes from the price if nothing else changes. In the model one contract loses about ${exact(-decayPerDay(NEAR))} a day for Sep 20, ${exact(-decayPerDay(MID))} for Oct 18 and ${exact(-decayPerDay(FAR))} for Nov 15. The nearest expiry is the cheapest and decays the fastest.`,
					`时间损耗（Theta）是其他条件不变时，一天从价格里拿走的部分。模型中，一张合约每天大约损耗：9月20日 ${exact(-decayPerDay(NEAR))}，10月18日 ${exact(-decayPerDay(MID))}，11月15日 ${exact(-decayPerDay(FAR))}。最近的到期日最便宜，损耗也最快。`,
				],
				state: { show: "decay", spot: SPOT },
			},
			{
				id: "later",
				label: ["On Oct 18", "10月18日"],
				caption: [
					`Suppose ALFA is still ${stock(SPOT)} on Oct 18. The Oct 18 call expires worthless: ${signedDollars(resultOnCheck("mid", SPOT) ?? 0)}. The Nov 15 call still has ${laterDays} days, and at the model's bid of ${dollars(bidOn(FAR, SPOT, CHECK_DATE))} it is ${signedDollars(resultOnCheck("far", SPOT) ?? 0)}. The later expiry gave the view more time, at a higher price.`,
					`假设 10月18日 ALFA 仍是 ${stock(SPOT)}。10月18日 看涨到期归零：${signedDollars(resultOnCheck("mid", SPOT) ?? 0)}。11月15日 看涨还剩 ${laterDays} 天，按模型买价 ${dollars(bidOn(FAR, SPOT, CHECK_DATE))} 计是 ${signedDollars(resultOnCheck("far", SPOT) ?? 0)}。较晚的到期日给了这个看法更多时间，价格也更高。`,
				],
				state: { show: "later", spot: SPOT },
			},
		],
		explore: {
			prompt: [
				"Move ALFA's price on Oct 18 and compare the two longer calls.",
				"移动 10月18日 的 ALFA 价格，比较两张期限较长的看涨。",
			],
			start: () => ({ show: "later", spot: SPOT + 3 }),
			task: {
				kind: "reach",
				prompt: [
					"Find the lowest price on Oct 18 at which the Oct 18 call's result is ahead of the Nov 15 call's.",
					"找出 10月18日 这天，10月18日 看涨的结果超过 11月15日 看涨的最低价格。",
				],
				reached: (e) => e.spot === NEAR_LEADS_AT,
				done: [
					`At ${stock(NEAR_LEADS_AT)} the Oct 18 call is ${signedDollars(resultOnCheck("mid", NEAR_LEADS_AT) ?? 0)} and the Nov 15 call ${signedDollars(resultOnCheck("far", NEAR_LEADS_AT) ?? 0)} in the model. When the move came in time, the cheaper, shorter call did as well for ${dollars(paid(FAR) - paid(MID))} less; when ALFA stalled, only the later call had anything left. More time is something you pay for, not something that is better.`,
					`${stock(NEAR_LEADS_AT)} 时，模型中 10月18日 看涨是 ${signedDollars(resultOnCheck("mid", NEAR_LEADS_AT) ?? 0)}，11月15日 看涨是 ${signedDollars(resultOnCheck("far", NEAR_LEADS_AT) ?? 0)}。行情及时到来时，更便宜、期限更短的看涨少付 ${dollars(paid(FAR) - paid(MID))} 也做到了同样的结果；ALFA 停滞时，只有较晚到期的那张还剩价值。更多的时间是花钱买来的，并不意味着更好。`,
				],
			},
		},
		View: ExpiryView,
	}),
	defineScene<QuoteState, QuoteState>({
		id: "liquidity",
		label: ["Check the quote", "检查报价"],
		title: [
			"A wide quote makes any contract cost more",
			"报价越宽，任何合约的成本都越高",
		],
		predict: {
			prompt: [
				`The Oct 18 ${LIQUID.contract.strike} call is quoted ${perShare(LIQUID.bid)} bid and ${perShare(LIQUID.ask)} ask. You buy one contract at the ask and sell it at the bid a moment later, with the quote unchanged. What is your result?`,
				`10月18日 ${LIQUID.contract.strike} 看涨的报价是买价 ${perShare(LIQUID.bid)}、卖价 ${perShare(LIQUID.ask)}。你按卖价买入一张，片刻后按买价卖出，报价没有变。结果是多少？`,
			],
			choices: [
				{
					id: "spread",
					label: [
						signedDollars(-roundTrip(LIQUID, 1)),
						signedDollars(-roundTrip(LIQUID, 1)),
					],
				},
				{
					id: "zero",
					label: ["$0: the price did not move", "$0：价格没有变"],
					why: [
						`The quote did not move, but you bought at its higher side and sold at its lower side: ${perShare(LIQUID.ask)} paid, ${perShare(LIQUID.bid)} received, per share.`,
						`报价没有变，但你在它较高的一侧买入、较低的一侧卖出：每股付出 ${perShare(LIQUID.ask)}，收回 ${perShare(LIQUID.bid)}。`,
					],
				},
				{
					id: "premium",
					label: [
						`${signedDollars(-paid(LIQUID.contract))}: the premium is gone`,
						`${signedDollars(-paid(LIQUID.contract))}：权利金没了`,
					],
					why: [
						`The premium is not lost when you sell: the sale brings back ${dollars(LIQUID.bid)} of the ${dollars(LIQUID.ask)} paid. Only the difference is gone.`,
						`卖出时权利金并没有全部损失：卖出收回了所付 ${dollars(LIQUID.ask)} 中的 ${dollars(LIQUID.bid)}，损失的只是差额。`,
					],
				},
			],
			answer: "spread",
			entry: {
				answer: roundTrip(LIQUID, 1),
				tolerance: 0.5,
				eitherSign: true,
				prefix: "$",
			},
			revealAt: 1,
			explain: [
				`${perShare(LIQUID.ask)} − ${perShare(LIQUID.bid)} = ${perShare(spreadOf(LIQUID))} a share, × 100 shares = ${dollars(roundTrip(LIQUID, 1))} a contract, lost before ALFA moves at all.`,
				`${perShare(LIQUID.ask)} − ${perShare(LIQUID.bid)} = 每股 ${perShare(spreadOf(LIQUID))}，× 100 股 = 每张 ${dollars(roundTrip(LIQUID, 1))}，ALFA 还没动就已经亏掉。`,
			],
		},
		beats: [
			{
				id: "quote",
				label: ["The quote", "报价"],
				caption: [
					`Whatever strike and expiry you look at, the contract has its own quote. The Oct 18 ${LIQUID.contract.strike} call: ${perShare(LIQUID.bid)} bid, ${perShare(LIQUID.ask)} ask. You buy at the ask and sell at the bid, as the quotes lesson showed.`,
					`无论看哪个行权价和到期日，合约都有自己的报价。10月18日 ${LIQUID.contract.strike} 看涨：买价 ${perShare(LIQUID.bid)}，卖价 ${perShare(LIQUID.ask)}。买入按卖价，卖出按买价，报价那一课讲过。`,
				],
				state: { pick: "c105", contracts: 1, cost: false },
			},
			{
				id: "cost",
				label: ["In and out", "一进一出"],
				caption: [
					`Bought and sold at once, one contract loses ${perShare(spreadOf(LIQUID))} × 100 = ${dollars(roundTrip(LIQUID, 1))}: ${percent(spreadShare(LIQUID))} of the ${dollars(LIQUID.ask)} paid. Its open interest, the contracts opened and not yet closed, is ${count(LIQUID.openInterest)}.`,
					`买入后立刻卖出，一张合约亏 ${perShare(spreadOf(LIQUID))} × 100 = ${dollars(roundTrip(LIQUID, 1))}：是所付 ${dollars(LIQUID.ask)} 的 ${percent(spreadShare(LIQUID))}。它的未平仓量，也就是已开仓、尚未平仓的张数，是 ${count(LIQUID.openInterest)}。`,
				],
				state: { pick: "c105", contracts: 1, cost: true },
			},
			{
				id: "thin",
				label: ["A thin contract", "冷清的合约"],
				caption: [
					`The Dec 20 ${THIN.contract.strike} call costs about as much, ${dollars(THIN.ask)}, but its quote is ${perShare(THIN.bid)} bid, ${perShare(THIN.ask)} ask, with an open interest of ${count(THIN.openInterest)}. The same round trip loses ${dollars(roundTrip(THIN, 1))}: ${percent(spreadShare(THIN))} of the price.`,
					`12月20日 ${THIN.contract.strike} 看涨的价格差不多，${dollars(THIN.ask)}，但报价是买价 ${perShare(THIN.bid)}、卖价 ${perShare(THIN.ask)}，未平仓量只有 ${count(THIN.openInterest)}。同样一进一出要亏 ${dollars(roundTrip(THIN, 1))}：是价格的 ${percent(spreadShare(THIN))}。`,
				],
				state: { pick: "dec110", contracts: 1, cost: true },
			},
		],
		explore: {
			prompt: [
				"Pick a contract and a number of contracts.",
				"选一张合约和张数。",
			],
			start: () => ({ pick: "c105", contracts: 1, cost: true }),
			task: {
				kind: "answer",
				prompt: [
					`You buy ${TASK_CONTRACTS} Dec 20 ${THIN.contract.strike} calls at the ask and sell them at the bid with the quote unchanged. What does that cost?`,
					`你按卖价买入 ${TASK_CONTRACTS} 张 12月20日 ${THIN.contract.strike} 看涨，再按买价卖出，报价不变。这要花多少？`,
				],
				choices: [
					{
						id: "all",
						label: [
							dollars(roundTrip(THIN, TASK_CONTRACTS)),
							dollars(roundTrip(THIN, TASK_CONTRACTS)),
						],
					},
					{
						id: "one",
						label: [dollars(roundTrip(THIN, 1)), dollars(roundTrip(THIN, 1))],
					},
					{
						id: "share",
						label: [
							exact((spreadOf(THIN) * TASK_CONTRACTS) / 100),
							exact((spreadOf(THIN) * TASK_CONTRACTS) / 100),
						],
					},
				],
				answer: "all",
				done: [
					`${perShare(spreadOf(THIN))} a share × 100 shares × ${TASK_CONTRACTS} contracts = ${dollars(roundTrip(THIN, TASK_CONTRACTS))}, before ALFA moves. The same ${TASK_CONTRACTS} contracts of the Oct 18 ${LIQUID.contract.strike} call would cost ${dollars(roundTrip(LIQUID, TASK_CONTRACTS))}. The quote is part of what any contract costs.`,
					`每股 ${perShare(spreadOf(THIN))} × 100 股 × ${TASK_CONTRACTS} 张 = ${dollars(roundTrip(THIN, TASK_CONTRACTS))}，ALFA 还没动。同样 ${TASK_CONTRACTS} 张 10月18日 ${LIQUID.contract.strike} 看涨只要 ${dollars(roundTrip(LIQUID, TASK_CONTRACTS))}。报价本身就是任何合约成本的一部分。`,
				],
			},
		},
		View: QuoteView,
	}),
] as const;

export function StrikeAndExpiryWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Player
			locale={locale}
			id="strike-and-expiry"
			label={[
				"Interactive lesson on choosing a strike and an expiry",
				"选择行权价与到期日互动课",
			]}
			film={strikeAndExpiryFilm}
			scenes={scenes}
		/>
	);
}
