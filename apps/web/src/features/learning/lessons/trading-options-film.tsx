import {
	ALFA,
	type Copy,
	contractLabel,
	expiries,
	pick,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import type { Film, FilmContext } from "../walkthrough/film";
import {
	Backdrop,
	Brackets,
	createDirector,
	EndCard,
	filmFrame,
	Lines,
	lineCount,
	TitleCard,
	toneClass,
	Word,
} from "../walkthrough/film-kit";
import {
	chainRows,
	nov105,
	routeFacts,
	strikes,
	thin,
	thinBook,
} from "./trading-options-model";

/*
 * Trading an option, as a film. It opens on one strike, the ALFA 100 call, in two
 * expiries and asks which costs more. The two dates fly onto the chain's tabs, and the
 * chain answers with both asks held together: $4.20 for Oct 18, $5.45 for Nov 15;
 * one contract is
 * 100 shares, $545. Then a thin contract with a 45-cent spread:
 * a stationary $2.65 × 100 construction makes the $265 market premium. The hero: a limit buy at $2.40 leaves
 * the panel as a ticket and drops into the book as the new best bid, then waits, until a
 * seller accepts it: the resting bid disappears into an execution record. Last, a new
 * example, the Nov 15 105 call: sell for cash, expire worthless or buy 100 shares.
 *
 *   open      0–4        "Trading an option"
 *   question  4–8.8      Oct 18 or Nov 15: which 100 call costs more?
 *   chain     8.8–18     the dates fly to the tabs; Oct 18; Nov 15: $5.45, $545
 *   order     18–34.55  a thin book; market at the ask; hero: a limit joins, waits, fills
 *   end       34.55–39.15 sell, expire, exercise
 *   claim     39.15–43.45 pick the row, name your price, know how it ends
 *   next      43.45–45.95 Next: risk first
 */

/** Pay for the book's scaffold preview without taking time from any settled proof. */
const BOOK_PREVIEW = 0.55;
const END = 45.4 + BOOK_PREVIEW;
const TABS = ["oct18", "nov15"] as const;
const ROWS = Object.fromEntries(
	TABS.map((id) => [id, chainRows(id)]),
) as Record<(typeof TABS)[number], ReturnType<typeof chainRows>>;
const FOCUS = 100;
/** Neighbouring strikes teach the table; outer rows give way to the expiry proof. */
const CHAIN_STRIKES = strikes.filter((strike) => Math.abs(strike - FOCUS) <= 5);
const LIMIT = 240;
const ASK = thinBook.asks[0].price;
const ASKS = [...thinBook.asks].reverse();
const BIDS = thinBook.bids;
const MAX_SIZE = Math.max(
	...[...thinBook.asks, ...thinBook.bids].map((level) => level.size),
);
const END_CONTRACT = contractLabel(nov105, false);
const THIN_CONTRACT = contractLabel(thin, false);
/** The Nov 15 100 call's ask, a share and a contract. */
const NOV_ASK = ROWS.nov15.find((row) => row.strike === FOCUS)?.call.ask ?? 0;
const FOCUS_ASKS = TABS.map((id) => ({
	id,
	ask: ROWS[id].find((row) => row.strike === FOCUS)?.call.ask ?? 0,
}));
const ROUTES = ["sell", "expire", "exercise"] as const;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, margin, room } = frame;
	const rowTop = H * (narrow ? 0.4 : 0.38);
	const rowStep = H * (narrow ? 0.085 : 0.08);
	const colW = room / 5;
	const bookTop = H * (narrow ? 0.29 : 0.27);
	const bookStep = H * (narrow ? 0.075 : 0.07);
	const bookW = room * (narrow ? 0.6 : 0.56);
	const priceW = narrow ? 64 : width * 0.1;
	return {
		...frame,
		tabY: H * (narrow ? 0.27 : 0.26),
		rowY: (i: number) => rowTop + i * rowStep,
		rowStep,
		colX: (i: number) => margin + colW * (i + 0.5),
		colW,
		bookStep,
		rowH: bookStep * 0.78,
		askY: (i: number) => bookTop + i * bookStep,
		bidY: (i: number) =>
			bookTop + (ASKS.length + i) * bookStep + bookStep * 0.5,
		bookW,
		priceW,
		barX: margin + priceW + 10,
		barMax: bookW - priceW - 10 - (narrow ? 34 : 60),
		panelX: margin + room * (narrow ? 0.65 : 0.62),
		panelY: bookTop,
		cardY: H * (narrow ? 0.3 : 0.32),
		cardH: H * (narrow ? 0.16 : 0.44),
		cardW: narrow ? room : (room - 2 * 18) / 3,
		gap: narrow ? 8 : 18,
	};
}

const copy = {
	title: ["Trading an option", "交易期权"],
	titleSub: ["from chain to order", "从期权链到下单"],
	qTag: ["ALFA 100 call", "ALFA 100 看涨"],
	qLine: ["Which costs more?", "哪个更贵？"],
	chainHead: ["One row per strike.", "每个行权价一行。"],
	chainHeadShort: ["One row per strike.", "每个行权价一行。"],
	novHead: ["Later expiry, same strike.", "同一行权价，换个到期日。"],
	novHeadShort: ["Later expiry, same strike.", "同一行权价，换个到期日。"],
	contract: [
		`100 shares × ${usd(NOV_ASK)} = ${usd(NOV_ASK * 100, 0)}`,
		`100 × ${usd(NOV_ASK)} = 每张 ${usd(NOV_ASK * 100, 0)}`,
	],
	calls: ["calls", "看涨"],
	puts: ["puts", "看跌"],
	strike: ["strike", "行权价"],
	bidAsk: ["bid · ask", "买价 · 卖价"],
	ask: ["ask", "卖价"],
	thinHead: ["A thin call: a wide spread.", "冷门看涨：价差很宽。"],
	thinHeadShort: ["A thin call: a wide spread.", "冷门看涨：价差很宽。"],
	marketHead: ["A market buy pays the ask, now.", "市价买入：立即按卖价成交。"],
	marketHeadShort: ["Market: the ask, now.", "市价：立即按卖价。"],
	limitHead: ["Set a limit, then wait.", "设好限价，等待成交。"],
	limitHeadShort: ["Set a limit, then wait.", "设好限价，等待成交。"],
	fillHead: ["It fills only when a seller comes.", "有卖方来才成交。"],
	fillHeadShort: ["Fills only if a seller comes.", "有卖方才成交。"],
	chipMarket: [
		`${usd(ASK)} × ${ALFA.multiplier}`,
		`${usd(ASK)} × ${ALFA.multiplier}`,
	],
	chipLimit: [usd(LIMIT), usd(LIMIT)],
	chipSell: [`seller: 1 @ ${usd(LIMIT)}`, `卖方：1 @ ${usd(LIMIT)}`],
	asks: ["asks", "卖价"],
	bids: ["bids", "买价"],
	yours: ["1 · you", "1 · 你"],
	pay: ["premium", "权利金"],
	quantity: ["1 contract", "1 张"],
	capPremium: [`cap ${usd(LIMIT * 100, 0)}`, `上限 ${usd(LIMIT * 100, 0)}`],
	filled: ["filled at $2.40", "以 $2.40 成交"],
	endHead: ["Bought: three ways out.", "买入之后：三种结局。"],
	endHeadShort: ["Three ways out.", "三种结局。"],
	endContract: [`New example: ${END_CONTRACT[0]}`, `新例：${END_CONTRACT[1]}`],
	routes: {
		sell: {
			name: ["sell to close", "卖出平仓"],
			short: ["sell", "卖出"],
			when: ["Oct 11, at the $3.70 bid", "10月11日，买价 $3.70"],
			whenShort: ["Oct 11 · bid $3.70", "10月11日 · 买价 $3.70"],
			outcome: ["cash", "现金"],
		},
		expire: {
			name: ["let it expire", "任其到期"],
			short: ["expire", "到期"],
			when: ["Nov 15, ALFA at $103", "11月15日，ALFA 在 $103"],
			whenShort: ["Nov 15 · ALFA $103", "11月15日 · ALFA $103"],
			outcome: [
				`${usd(routeFacts("expire").cash, 0)} value`,
				`价值 ${usd(routeFacts("expire").cash, 0)}`,
			],
		},
		exercise: {
			name: ["exercise", "行权"],
			short: ["exercise", "行权"],
			when: ["ALFA at $112: pay $10,500", "ALFA 在 $112：付 $10,500"],
			whenShort: [
				`Pay ${usd(nov105.strike * 100 * ALFA.multiplier, 0)}`,
				`付 ${usd(nov105.strike * 100 * ALFA.multiplier, 0)}`,
			],
			outcome: [`${ALFA.multiplier} shares`, `${ALFA.multiplier} 股`],
		},
	},
	claimBig: [
		"Pick the row, name your price, know how it ends.",
		"选对那一行，定好价格，弄清怎么结束。",
	],
	claimSub: [
		"A limit caps the price, not the time.",
		"限价控制价格，控制不了时间。",
	],
	nextBig: ["Next: risk first", "下一课：先看风险"],
	nextSub: ["how options lose money", "期权如何亏钱"],
} as const;

function Scene({
	width,
	locale,
}: {
	width: number;
	height: number;
	locale: Locale;
}) {
	const t = (value: Copy) => pick(value, locale);
	const L = layout(width);
	const { height: H, type: T, room, narrow, margin } = L;
	const W = width;
	const headline = (name: string, text: Copy, short: Copy) => (
		<Lines
			name={name}
			text={t(narrow ? short : text)}
			x={margin}
			y={L.headY}
			size={T.head}
			maxWidth={narrow ? room : room * 0.74}
			anchor="start"
		/>
	);
	const rowText = narrow ? T.small * 1.1 : T.body;
	const heroText = rowText * 1.4;
	const contractText = T.body * 1.15;
	const [contractOperands, contractTotal] = t(copy.contract).split(" = ");
	const center = (i: number) => L.rowY(i) + L.rowStep * 0.36 + rowText * 0.36;
	const bookText = (y: number) => y + L.rowH / 2 + rowText * 0.36;
	const quote = (q: { bid: number; ask: number }) =>
		narrow
			? `${(q.bid / 100).toFixed(2)}/${(q.ask / 100).toFixed(2)}`
			: `${usd(q.bid)} · ${usd(q.ask)}`;
	const bookLevel = (
		side: "ask" | "bid",
		name: string,
		y: number,
		price: number,
		size: number,
		tone: string,
	) => (
		<g key={name} data-f={name}>
			<text
				data-f={`${name}-px`}
				x={margin + L.priceW}
				y={name === "bid-you" ? y + L.rowH / 2 + heroText * 0.36 : bookText(y)}
				textAnchor="end"
				// Your bid in the accent of the tickets that land on it.
				className={`wt-film-num ${name === "bid-you" ? "wt-film-accent" : ""}`}
				style={{ fontSize: name === "bid-you" ? heroText : rowText }}
			>
				{usd(price)}
			</text>
			<rect
				data-f={`${name}-bar`}
				x={L.barX}
				y={y + L.rowH * 0.2}
				width={(size / MAX_SIZE) * L.barMax}
				height={L.rowH * 0.6}
				rx={3}
				className="wt-film-bar"
				data-tone={tone}
			/>
			<text
				data-f={`${name}-size`}
				x={margin + L.bookW - 6}
				y={bookText(y)}
				textAnchor="end"
				className="wt-film-num wt-film-dim"
				style={{ fontSize: rowText }}
			>
				{side === "bid" && name === "bid-you" ? t(copy.yours) : String(size)}
			</text>
		</g>
	);
	const cardX = (i: number) => margin + (narrow ? 0 : i * (L.cardW + L.gap));
	const cardY = (i: number) => L.cardY + (narrow ? i * H * 0.18 : 0);
	return (
		<>
			<Backdrop frame={L} />

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-tag"
					x={W / 2}
					y={H * 0.3}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qTag).toUpperCase()}
				</Word>
				{TABS.map((id, i) => (
					<Word
						key={id}
						name={`q-${id}`}
						x={W * (narrow ? [0.27, 0.73][i] : [0.32, 0.68][i])}
						y={H * 0.3 + T.big * 1.05}
						size={Math.min(
							T.big * 0.8,
							(W * 0.3) /
								(t(expiries[id].label).length * (locale === "zh" ? 0.9 : 0.62)),
						)}
						className="wt-film-num"
					>
						{t(expiries[id].label)}
					</Word>
				))}
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={H * 0.74}
					size={T.head}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
			</g>
			{headline("c-head", copy.chainHead, copy.chainHeadShort)}
			{headline("n-head", copy.novHead, copy.novHeadShort)}

			{/* The chain. */}
			<g data-f="chain">
				{TABS.map((id, i) => (
					<g key={id}>
						<rect
							data-f={`tab-${id}`}
							x={margin + i * (narrow ? 96 : 150)}
							y={L.tabY - T.body * 1.3}
							width={narrow ? 88 : 140}
							height={T.body * 2}
							rx={T.body}
							className="wt-focus-shape"
						/>
						<text
							data-f={`tab-label-${id}`}
							x={margin + i * (narrow ? 96 : 150) + (narrow ? 44 : 70)}
							y={L.tabY}
							textAnchor="middle"
							className="wt-film-num"
							style={{ fontSize: rowText }}
						>
							{t(expiries[id].label)}
						</text>
					</g>
				))}
				<g data-f="chain-head">
					{(
						[
							[copy.calls, 0.5],
							[copy.strike, 2],
							[copy.puts, 3.5],
						] as const
					).map(([label, col]) => (
						<text
							key={label[0]}
							x={margin + (room / 5) * (col + 0.5)}
							y={L.rowY(0) - L.rowStep * 0.25 - (narrow ? T.small * 1.2 : 0)}
							textAnchor="middle"
							className="wt-film-tag"
							style={{ fontSize: T.small }}
						>
							{`${t(label).toUpperCase()}${label === copy.strike || narrow ? "" : ` · ${t(copy.bidAsk)}`}`}
						</text>
					))}
					{narrow &&
						[1, 4].map((col) => (
							<text
								key={col}
								x={margin + (room / 5) * col}
								y={L.rowY(0) - L.rowStep * 0.25}
								textAnchor="middle"
								className="wt-film-tag"
								style={{ fontSize: T.small }}
							>
								{t(copy.bidAsk)}
							</text>
						))}
				</g>
				{CHAIN_STRIKES.map((strike, i) => (
					<g key={strike}>
						<rect
							data-f={`chain-surface-${strike}`}
							x={margin}
							y={L.rowY(i)}
							width={room}
							height={L.rowStep * 0.82}
							rx={8}
							className="wt-panel-shape"
						/>
						<text
							x={L.colX(2)}
							y={center(i)}
							textAnchor="middle"
							className="wt-film-num wt-film-accent"
							style={{ fontSize: rowText }}
						>
							{strike}
						</text>
					</g>
				))}
				<rect
					data-f="focus-cell"
					x={margin + 4}
					y={L.rowY(CHAIN_STRIKES.indexOf(FOCUS)) + 3}
					width={(room / 5) * 2 - 8}
					height={L.rowStep * 0.82 - 6}
					rx={7}
					className="wt-focus-shape"
				/>
				<text
					data-f="contract-tag"
					x={margin + room * 0.75}
					y={L.rowY(strikes.length) + T.body * 1.1}
					textAnchor="middle"
					className="wt-film-num wt-film-accent"
					style={{ fontSize: contractText }}
				>
					<tspan x={margin + room * 0.75}>{contractOperands}</tspan>
					<tspan
						x={margin + room * 0.75}
						dy={contractText * 1.35}
					>{` = ${contractTotal}`}</tspan>
				</text>
				{TABS.map((id) => (
					<g key={id} data-f={`cells-${id}`}>
						{ROWS[id]
							.filter((row) => CHAIN_STRIKES.includes(row.strike))
							.map((row, i) => (
								<g key={row.strike} data-f={`cells-${id}-${row.strike}`}>
									<text
										x={margin + room / 5}
										y={center(i)}
										textAnchor="middle"
										className="wt-film-num"
										style={{ fontSize: rowText }}
									>
										{quote(row.call)}
									</text>
									<text
										x={margin + (room / 5) * 4}
										y={center(i)}
										textAnchor="middle"
										className="wt-film-num wt-film-dim"
										style={{ fontSize: rowText }}
									>
										{quote(row.put)}
									</text>
								</g>
							))}
					</g>
				))}
				<g data-f="ask-comparison">
					{FOCUS_ASKS.map(({ id, ask }, i) => {
						const x = margin + room * (i === 0 ? 0.25 : 0.75);
						const y = H * (narrow ? 0.7 : 0.64);
						return (
							<g key={id}>
								<text
									x={x}
									y={y}
									textAnchor="middle"
									className="wt-film-type wt-film-dim"
									style={{ fontSize: T.body }}
								>
									{`${t(expiries[id].label)} ${t(copy.ask)}`}
								</text>
								<text
									x={x}
									y={y + T.num * 1.25}
									textAnchor="middle"
									className={`wt-film-num ${id === "nov15" ? "wt-film-accent" : ""}`}
									style={{ fontSize: T.num }}
								>
									{usd(ask)}
								</text>
							</g>
						);
					})}
				</g>
			</g>

			{/* A thin book. */}
			{headline("t-head", copy.thinHead, copy.thinHeadShort)}
			{headline("m-head", copy.marketHead, copy.marketHeadShort)}
			{headline("l-head", copy.limitHead, copy.limitHeadShort)}
			{headline("f-head", copy.fillHead, copy.fillHeadShort)}
			<g data-f="book">
				<text
					data-f="thin-contract"
					x={margin}
					y={L.askY(0) - T.body * 2.4}
					className="wt-film-type wt-film-accent"
					style={{ fontSize: T.body }}
				>
					{t(THIN_CONTRACT)}
				</text>
				<text
					data-f="asks-tag"
					x={margin}
					y={L.askY(0) - T.small * 0.9}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.asks).toUpperCase()}
				</text>
				<rect
					data-f="ask-hit"
					x={margin}
					y={L.askY(ASKS.length - 1)}
					width={L.bookW}
					height={L.rowH}
					rx={7}
					className="wt-focus-shape"
				/>
				{ASKS.map((at, i) =>
					bookLevel(
						"ask",
						`ask-${at.price}`,
						L.askY(i),
						at.price,
						at.size,
						"neutral",
					),
				)}
				<path
					data-f="spread"
					d={`M${margin} ${L.askY(ASKS.length) + L.bookStep * 0.1}H${margin + L.bookW}`}
					className="wt-film-link"
				/>
				<rect
					data-f="bid-hit"
					x={margin}
					y={L.bidY(0)}
					width={L.bookW}
					height={L.rowH}
					rx={7}
					className="wt-focus-shape"
				/>
				{bookLevel("bid", "bid-you", L.bidY(0), LIMIT, 1, "total")}
				{BIDS.map((at, i) =>
					bookLevel(
						"bid",
						`bid-${at.price}`,
						L.bidY(i + 1),
						at.price,
						at.size,
						"neutral",
					),
				)}
				<text
					data-f="bids-tag"
					x={margin}
					y={L.bidY(BIDS.length) + L.rowH + T.small * 1.4}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.bids).toUpperCase()}
				</text>
			</g>
			<g data-f="panel">
				<text
					data-f="p-tag"
					x={L.panelX}
					y={L.panelY + T.small * 1.4}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.pay).toUpperCase()}
				</text>
				{(
					[
						["p-market", usd(ASK * ALFA.multiplier, 0), "wt-film-accent"],
						["p-limit", t(copy.capPremium), "wt-film-dim"],
						["p-filled", usd(LIMIT * 100, 0), toneClass.focus],
					] as const
				).map(([name, text, tone]) => (
					<text
						key={name}
						data-f={name}
						x={L.panelX}
						y={
							L.panelY +
							T.small * 1.4 +
							T.num * 1.25 +
							(name === "p-market" && narrow ? T.body * 0.25 : 0)
						}
						className={`wt-film-num ${tone}`}
						style={{
							fontSize:
								name === "p-market"
									? T.num * (narrow ? 1 : 0.85)
									: rowText * 0.95,
						}}
					>
						{text}
					</text>
				))}
				<text
					data-f="p-quantity"
					x={L.panelX}
					y={
						L.panelY +
						T.small * 1.4 +
						T.num * 1.25 +
						T.body * (narrow ? 4.1 : 3.6)
					}
					className="wt-film-type"
					style={{ fontSize: T.body }}
				>
					{t(copy.quantity)}
				</text>
				<text
					data-f="s-filled"
					x={L.panelX}
					y={L.panelY + T.small * 1.4 + T.num * 1.25 + T.body * 1.8}
					className="wt-film-type"
					style={{ fontSize: T.body }}
				>
					{t(copy.filled)}
				</text>
			</g>

			{/* A stationary market conversion, a carried limit, and an external seller. */}
			{(
				[
					[
						"chip-market",
						copy.chipMarket,
						L.panelX,
						L.panelY +
							T.small * 1.4 +
							T.num * 1.25 +
							T.body * (narrow ? 2.3 : 1.8),
						"start",
					],
					[
						"chip-limit",
						copy.chipLimit,
						L.panelX,
						L.panelY + T.small * 1.4 + T.num * 1.25 + T.body * 1.8,
						"start",
					],
					[
						"chip-sell",
						copy.chipSell,
						margin,
						L.bidY(BIDS.length) + L.rowH + T.small * 3.5,
						"start",
					],
				] as const
			).map(([name, label, x, y, anchor]) => (
				<text
					key={name}
					data-f={name}
					x={x}
					y={y}
					textAnchor={anchor}
					className={`wt-film-num ${name === "chip-sell" ? "" : toneClass.focus} wt-halo`}
					style={{ fontSize: rowText }}
				>
					{t(label)}
				</text>
			))}
			<Brackets name="lock-ask" />
			<Brackets name="lock-bid" glow />

			{/* Three endings. */}
			{headline("e-head", copy.endHead, copy.endHeadShort)}
			<Word
				name="end-contract"
				x={margin}
				y={H * 0.24}
				size={T.body}
				anchor="start"
				className="wt-film-type wt-film-accent"
			>
				{t(copy.endContract)}
			</Word>
			{ROUTES.map((route, i) => {
				const r = copy.routes[route];
				return (
					<g key={route} data-f={`card-${route}`}>
						<rect
							x={cardX(i)}
							y={cardY(i)}
							width={L.cardW}
							height={L.cardH}
							rx={12}
							className="wt-panel-shape"
						/>
						<text
							x={cardX(i) + (narrow ? 12 : L.cardW / 2)}
							y={cardY(i) + L.cardH * (narrow ? 0.3 : 0.2)}
							textAnchor={narrow ? "start" : "middle"}
							className="wt-film-tag"
							style={{ fontSize: T.small }}
						>
							{t(narrow ? r.short : r.name).toUpperCase()}
						</text>
						<Lines
							name={`when-${route}`}
							text={t(narrow ? r.whenShort : r.when)}
							x={cardX(i) + (narrow ? 12 : L.cardW / 2)}
							y={cardY(i) + L.cardH * (narrow ? 0.64 : 0.42)}
							size={narrow && route !== "exercise" ? T.small : T.body}
							maxWidth={narrow ? L.cardW * 0.61 : L.cardW - 12}
							anchor={narrow ? "start" : "middle"}
							className={
								narrow && route === "exercise"
									? "wt-film-type"
									: "wt-film-type wt-film-dim"
							}
						/>
						<text
							x={cardX(i) + (narrow ? L.cardW - 12 : L.cardW / 2)}
							y={
								cardY(i) +
								L.cardH * (narrow ? (route === "exercise" ? 0.64 : 0.44) : 0.8)
							}
							textAnchor={narrow ? "end" : "middle"}
							className={`wt-film-num ${route === "expire" ? "wt-film-dim" : toneClass.focus}`}
							style={{ fontSize: narrow ? T.body : T.body * 1.5 }}
						>
							{t(r.outcome)}
						</text>
					</g>
				);
			})}
			<g data-f="claim">
				<Lines
					name="z-big"
					text={t(copy.claimBig)}
					x={W / 2}
					y={H * 0.42}
					size={T.title}
					maxWidth={room}
				/>
				<Lines
					name="z-sub"
					text={t(copy.claimSub)}
					x={W / 2}
					y={
						H * 0.42 +
						T.title * 1.15 +
						(lineCount(t(copy.claimBig), room, T.title) - 1) * T.title * 1.35
					}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-dim"
				/>
			</g>
			<EndCard
				frame={L}
				locale={locale}
				next={t(copy.nextBig)}
				why={t(copy.nextSub)}
			/>
		</>
	);
}

function build(context: FilmContext) {
	const { width: W } = context;
	const L = layout(W);
	const d = createDirector(context, L, END);
	const { tl, one, kids, show, hide } = d;
	/** Every event from the market beat onward moves together; their intervals stay intact. */
	const afterBook = (source: number) => source + BOOK_PREVIEW;
	const flat = (name: string) =>
		kids(name).flatMap((el) =>
			el.tagName === "g" && !el.hasAttribute("data-f")
				? [...el.children]
				: [el],
		);
	const g = (name: string) => one<SVGGraphicsElement>(name);
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const fade = (target: Element | Element[], time: number, to = 0) =>
		tl.to(target, { opacity: to, duration: 0.3 }, time);
	const otherBids = BIDS.map((at) => one(`bid-${at.price}`));
	const nonFocusChain = CHAIN_STRIKES.filter(
		(strike) => strike !== FOCUS,
	).flatMap((strike) => [
		one(`chain-surface-${strike}`),
		...TABS.map((id) => one(`cells-${id}-${strike}`)),
	]);
	const nonExecutingRows = [
		...ASKS.filter((at) => at.price !== ASK).map((at) =>
			one(`ask-${at.price}`),
		),
		...otherBids,
	];
	const cards = ROUTES.map((route) => one(`card-${route}`));
	const heads = [
		"c-head",
		"n-head",
		"t-head",
		"m-head",
		"l-head",
		"f-head",
		"e-head",
	].map((name) => one(name));
	const chainParts = [
		...flat("chain").filter(
			(el) => !el.getAttribute("data-f")?.startsWith("cells-"),
		),
		one("cells-oct18"),
		one("cells-nov15"),
	];

	d.hidden([
		...flat("q"),
		...heads,
		...chainParts,
		...flat("book"),
		one("bid-you-px"),
		...flat("panel"),
		g("chip-market"),
		g("chip-limit"),
		g("chip-sell"),
		one("end-contract"),
		g("lock-ask"),
		g("lock-bid"),
		...cards,
		...kids("claim"),
	]);
	// The other bids start one place higher: your limit order hasn't arrived yet.
	tl.set(otherBids, { y: -L.bookStep }, 0);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: one strike, two expiries ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.4);
	word(one("q-oct18"), 4.6);
	word(one("q-nov15"), 5.0);
	show(one("q-line"), 5.3);

	// ——— chain: the two dates become its tabs ———
	tl.addLabel("chain", 8.8);
	// Clear the centred contract tag before the earlier date flights cross its lane.
	// The question itself keeps its accepted exit and reading interval.
	hide(one("q-tag"), 8.1, 0.3);
	hide(one("q-line"), 8.8);
	show(
		flat("chain").filter(
			(el) =>
				!el.getAttribute("data-f")?.startsWith("cells-") &&
				!el.getAttribute("data-f")?.startsWith("tab-") &&
				el.getAttribute("data-f") !== "focus-cell" &&
				el.getAttribute("data-f") !== "contract-tag" &&
				el.getAttribute("data-f") !== "ask-comparison",
		),
		// Once the dates have landed on their tabs, clear of the rows below.
		9.1,
		"below",
		0.3,
	);
	d.carry(g("q-oct18"), g("tab-label-oct18"), 8.45, { duration: 0.5 });
	d.carry(g("q-nov15"), g("tab-label-nov15"), 8.5, { duration: 0.6 });
	tl.to(one("tab-oct18"), { opacity: 1, duration: 0.3 }, 9.1);
	show(one("cells-oct18"), 10.4, "below", 0.3);
	show(heads[0], 9.1, "below", 0.3);
	tl.to(one("focus-cell"), { opacity: 1, duration: 0.3 }, 11.4);
	tl.fromTo(
		nonFocusChain,
		{ opacity: 1 },
		{ opacity: 0.3, duration: 0.3, ease: "power2.in", immediateRender: false },
		11.4,
	);
	// The selection and its quotes leave together, then arrive together. The table's
	// scaffold stays up, but no Nov selection ever describes the outgoing Oct quotes.
	d.swap(heads[0], heads[1], 14.0);
	tl.to(
		[one("tab-oct18"), one("cells-oct18")],
		{ opacity: 0, duration: 0.3, ease: "power2.in" },
		14.4,
	);
	tl.fromTo(
		[
			one("tab-nov15"),
			one("cells-nov15"),
			one("contract-tag"),
			one("ask-comparison"),
		],
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		14.7,
	);

	// ——— order: market or limit ———
	tl.addLabel("order", 18);
	hide([heads[1], ...chainParts], 18.0);
	show(heads[2], 18.35);
	fade(one("thin-contract"), 18.5, 1);
	show([one("asks-tag"), one("bids-tag"), one("spread")], 18.35);
	// Scaffold (including the headline) settles at 18.85, followed by a full second.
	// All six rows share one entrance; initial bid y offsets are deliberately retained.
	tl.fromTo(
		[...ASKS.map((level) => one(`ask-${level.price}`)), ...otherBids],
		{ opacity: 0, x: 18 },
		{ opacity: 1, x: 0, duration: 0.5 },
		19.85,
	);
	// Market: the per-share price and multiplier construct the settled premium.
	d.swap(heads[2], heads[3], afterBook(22.0));
	fade(one("ask-hit"), afterBook(22.4), 1);
	tl.fromTo(
		nonExecutingRows,
		{ opacity: 1 },
		{ opacity: 0.3, duration: 0.3, immediateRender: false },
		afterBook(22.4),
	);
	d.lock(g("lock-ask"), afterBook(22.4), { around: one("ask-hit"), pad: 4 });
	// Per-share quote and multiplier stay still; the settled premium is revealed,
	// rather than replacing a differently sized ticket at the end of a flight.
	fade(g("chip-market"), afterBook(22.75), 1);
	show(one("p-tag"), afterBook(22.8));
	fade(one("p-market"), afterBook(23.45), 1);
	fade(one("p-quantity"), afterBook(23.45), 1);
	// The one-contract execution and its settled premium land at the same instant.
	// These in-place value replacements are reversible when the film is scrubbed.
	tl.fromTo(
		one(`ask-${ASK}-size`),
		{ textContent: thinBook.asks[0].size },
		{
			textContent: thinBook.asks[0].size - 1,
			duration: 0,
			immediateRender: false,
		},
		afterBook(23.75),
	);
	tl.fromTo(
		one(`ask-${ASK}-bar`),
		{ attr: { width: (thinBook.asks[0].size / MAX_SIZE) * L.barMax } },
		{
			attr: { width: ((thinBook.asks[0].size - 1) / MAX_SIZE) * L.barMax },
			duration: 0,
			immediateRender: false,
		},
		afterBook(23.75),
	);
	// The hero: a limit at $2.40 leaves the panel as a ticket and drops into the book as
	// the best bid; the other bids step down for it, and it waits.
	d.swap(heads[3], heads[4], afterBook(26.0));
	tl.to(
		[one("p-quantity"), one("chip-market")],
		{ opacity: 0, duration: 0.35, ease: "power2.in" },
		afterBook(26.0),
	);
	fade([one("ask-hit"), g("lock-ask")], afterBook(26.0));
	tl.fromTo(
		[one(`ask-${ASK}`), one("spread")],
		{ opacity: 1 },
		{ opacity: 0.3, duration: 0.5, immediateRender: false },
		afterBook(26.0),
	);
	d.flip(one("p-market"), one("p-limit"), afterBook(26.2));
	tl.set(one("p-market"), { opacity: 0 }, afterBook(26.5));
	tl.fromTo(
		g("chip-limit"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		afterBook(26.35),
	);
	// Room first: the bids step down before the ticket sets off.
	tl.to(
		otherBids,
		{ y: 0, duration: 0.5, ease: "power2.inOut" },
		afterBook(26.0),
	);
	// The row appears as the ticket lands on it: it never slides across the row's own marks.
	tl.fromTo(
		one("bid-you"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		afterBook(27.55),
	);
	// Down beside the book first, then along the empty row to its price.
	d.carry(g("chip-limit"), g("bid-you-px"), afterBook(26.65), {
		duration: 1,
		arc: "y",
	});
	d.lock(g("lock-bid"), afterBook(27.7), { around: one("bid-hit"), pad: 4 });
	tl.addLabel("hero-lock", afterBook(27.7));
	// Shifted lock settles at 28.70, then stands undisturbed until 30.85.
	// A seller accepts the bid. Their cue stays below the book, clear of the hero.
	d.swap(heads[4], heads[5], afterBook(30.0));
	tl.fromTo(
		g("chip-sell"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		afterBook(30.15),
	);
	fade(g("lock-bid"), afterBook(30.3));
	// Consume the entire one-contract bid before the separate filled record unfolds.
	fade(one("bid-you"), afterBook(31.45));
	d.flip(one("p-limit"), one("p-filled"), afterBook(31.5));
	tl.set(one("p-limit"), { opacity: 0 }, afterBook(31.8));
	show(one("s-filled"), afterBook(31.85));
	fade(g("chip-sell"), afterBook(31.8));

	// ——— end: three ways out ———
	tl.addLabel("end", afterBook(34));
	hide(
		[
			heads[5],
			...flat("book"),
			one("bid-hit"),
			g("lock-bid"),
			one("p-tag"),
			one("p-filled"),
			one("s-filled"),
		],
		afterBook(34.0),
	);
	show(heads[6], afterBook(34.35));
	fade(one("end-contract"), afterBook(34.4), 1);
	cards.forEach((card, i) => {
		show(card, afterBook(34.6 + i * 0.25));
	});

	// ——— claim ———
	tl.addLabel("claim", afterBook(38.6));
	hide([heads[6], one("end-contract"), ...cards], afterBook(38.6));
	word(one("z-big"), afterBook(38.9));
	show(one("z-sub"), afterBook(39.4));

	// ——— next ———
	tl.addLabel("next", afterBook(42.9));
	hide(kids("claim"), afterBook(42.9));
	d.close(afterBook(42.9));
	return tl;
}

export const tradingOptionsFilm: Film = {
	id: "trading-options",
	label: [
		`Trading an option, as a short film: the ALFA 100 call in two expiries, $4.20 for Oct 18 and $5.45 for Nov 15, read from a chain with one row per strike, where one contract is 100 shares; a thin call quoted $2.20 bid and $2.65 ask, where a market buy pays ${usd(ASK * 100, 0)} in premium and consumes one ask, then a limit buy at $2.40 becomes the best bid until a seller accepts it and consumes the resting order; and a new example, the Nov 15 105 call: sell for cash, expire worthless with ALFA at $103, or exercise to buy 100 shares for $10,500 with ALFA at $112`,
		`交易期权短片：两个到期日的 ALFA 100 看涨，从每个行权价一行的期权链读出 10月18日 $4.20、11月15日 $5.45，一张合约是 100 股；一张报买价 $2.20、卖价 $2.65 的冷门看涨，市价买单付 ${usd(ASK * 100, 0)} 权利金并消耗一张卖单，随后 $2.40 的限价买单成为最优买价，卖方接受时待成交买单消失；新例是 11月15日 105 看涨：卖出换回现金，ALFA 在 $103 时到期归零，或在 $112 时行权，付 $10,500 买入 100 股`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Trading an option", "交易期权"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "chain", label: ["The chain", "期权链"] },
		{ id: "order", label: ["Market or limit", "市价或限价"] },
		{ id: "end", label: ["How it ends", "如何结束"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
