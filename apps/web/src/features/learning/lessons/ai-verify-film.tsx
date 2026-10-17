import {
	type Copy,
	contractDte,
	expiries,
	pick,
	SESSION_DATE,
	screenDefaults,
	volumeToOi,
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
	type Tone,
	toneClass,
	toneColor,
	Word,
} from "../walkthrough/film-kit";
import {
	COST,
	CRUX,
	INSIGHT_BODY,
	INSIGHT_BODY_SHORT,
	NAMES,
	NEAR,
	PASSED,
	STATEMENTS,
} from "./ai-verify-model";

/*
 * Verify an answer against focused source/result proofs, then add the actual reply
 * costs. The settled total is the hero; the final shot makes a separate private recipe.
 *
 *   open      0–4          Ask TradingFlow AI, then verify
 *   question  4–9.6        The unsupported bearish-bet sentence
 *   sort      9.6–24.3     Paired results; missing evidence; identify three near expiries
 *   credits   24.3–31.1    1 + 1 + 2 → 4 credits; lock at 28.9, settle at 29.35
 *   insight   31.1–44.65   Explain the run; branch a private draft; closing claim
 *   next      44.65–47.05  Build your own Rank column
 */

const END = 47.05;
const BET = STATEMENTS.find((item) => item.id === "bet") ?? STATEMENTS[0];
const REPLIES = [
	{ kind: "text", cost: COST.text },
	{ kind: "text", cost: COST.text },
	{ kind: "chart", cost: COST.chart },
] as const;
const TOTAL = REPLIES.reduce((sum, reply) => sum + reply.cost, 0);
const expiryDays = PASSED.map((row) => contractDte(row, SESSION_DATE));
const MISSING_FIELDS = [
	{ id: "trader", label: ["Trader", "交易者"] },
	{ id: "motive", label: ["Motive", "动机"] },
	{ id: "open-close", label: ["Open/close", "开仓/平仓"] },
] as const;
const proofs: {
	id: string;
	tag: Copy;
	source: Copy;
	basis: Copy;
	result: Copy;
	tone?: Tone;
}[] = [
	{
		id: "count",
		tag: ["Report · Monday", "报告 · 周一"],
		source: ["Report key figures", "报告关键数字"],
		basis: ["Key figures", "关键数字"],
		result: [
			`${PASSED.length} contracts · ${NAMES} names`,
			`${PASSED.length} 份合约 · ${NAMES} 个标的`,
		],
	},
	{
		id: "ratio",
		tag: ["Calculate · volume/OI", "计算 · 成交量/未平仓量"],
		source: [
			`${CRUX.symbol} · ${expiries[CRUX.expiry].label[0]} · ${CRUX.strike} put`,
			`${CRUX.symbol} · ${expiries[CRUX.expiry].label[1]} · ${CRUX.strike} 看跌`,
		],
		basis: [
			`Volume ${CRUX.volume.toLocaleString("en-US")} · OI ${CRUX.openInterest.toLocaleString("en-US")}`,
			`成交量 ${CRUX.volume.toLocaleString("en-US")} · 未平仓量 ${CRUX.openInterest.toLocaleString("en-US")}`,
		],
		result: [
			`${CRUX.volume.toLocaleString("en-US")} ÷ ${CRUX.openInterest.toLocaleString("en-US")} → ${volumeToOi(CRUX).toFixed(2)}×`,
			`${CRUX.volume.toLocaleString("en-US")} ÷ ${CRUX.openInterest.toLocaleString("en-US")} → ${volumeToOi(CRUX).toFixed(2)}倍`,
		],
		tone: "focus",
	},
	{
		id: "bet",
		tag: ["Check · the bet", "核查 · 押注"],
		source: ["A large bearish bet on CRUX", "CRUX 上的大额看空押注"],
		basis: [
			"No trader, motive, or open/close data.",
			"缺少交易者、动机与开平仓数据。",
		],
		result: ["Not supported", "无依据"],
		tone: "caution",
	},
	{
		id: "near",
		tag: ["Calculate · days to expiry", "计算 · 距到期天数"],
		source: ["Within 30 days?", "30 天内到期？"],
		basis: [`${expiryDays.join(" · ")} days`, `${expiryDays.join(" · ")} 天`],
		result: [
			`${NEAR} of ${PASSED.length} ≤ 30 days`,
			`${PASSED.length} 份中 ${NEAR} 份 ≤ 30 天`,
		],
		tone: "focus",
	},
	{
		id: "fall",
		tag: ["Check · the forecast", "核查 · 预测"],
		source: STATEMENTS.find((item) => item.id === "fall")?.text ?? BET.text,
		basis: ["No price-path evidence", "数据不含价格预测"],
		result: ["Not supported", "无依据"],
		tone: "caution",
	},
];

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, room, type: T } = frame;
	return {
		...frame,
		proofY: (id: string) => H * (id === "ratio" || id === "fall" ? 0.57 : 0.27),
		proofH: (id: string) => H * (id === "bet" ? 0.4 : 0.28),
		rowText: narrow ? T.small * 1.1 : T.body,
		ledgerW: narrow ? room : room * 0.46,
		ledgerY: (i: number) => H * 0.3 + i * H * (narrow ? 0.13 : 0.12),
		ledgerH: H * (narrow ? 0.105 : 0.095),
		totalX: narrow ? width / 2 : frame.margin + room * 0.76,
		totalY: H * (narrow ? 0.9 : 0.6),
		totalSize: narrow
			? Math.max(32, Math.min(width * 0.09, 42))
			: Math.max(40, Math.min(width * 0.065, 64)),
		formulaY: H * (narrow ? 0.77 : 0.43),
		totalTagY: H * (narrow ? 0.71 : 0.34),
		barY: H * 0.26,
		barH: H * 0.18,
		panelY: H * 0.53,
		panelW: narrow ? room : (room - 20) / 2,
		panelText: T.body,
		panelPad: narrow ? 12 : 16,
	};
}

const copy = {
	title: ["Ask TradingFlow AI, then verify", "问 TradingFlow AI，然后核查"],
	titleSub: ["sort an answer by what backs it", "按依据给回答分类"],
	qTag: [
		"TradingFlow AI · about Monday's screen",
		"TradingFlow AI · 关于周一的筛选",
	],
	qLine: [
		"What does Monday's screen actually support?",
		"周一的筛选到底支持哪部分？",
	],
	sortHead: ["Sort every sentence by what backs it.", "按依据给每句话分类。"],
	sortHeadShort: ["Sort each sentence.", "给每句话分类。"],
	betHead: ["Check what the bet would require.", "核查押注需要什么依据。"],
	betHeadShort: ["What backs the bet?", "押注的依据呢？"],
	restHead: ["Check expiry and forecast.", "核查到期日与预测。"],
	restHeadShort: ["Check expiry and forecast.", "核查到期日与预测。"],
	creditHead: ["Check the cost of each reply.", "核查每条回复的费用。"],
	billing: ["Billing · AI usage history", "账单 · AI 使用记录"],
	total: ["total", "合计"],
	screener: [
		"Unusual Options Activity Screener",
		"Unusual Options Activity Screener",
	],
	screenerShort: ["UOA Screener", "UOA Screener"],
	official: ["Official recipe · unchanged", "官方 Recipe · 未改动"],
	private: ["Your private draft", "你的私有草稿"],
	draftTools: ["Review · Undo · Save", "审阅 · 撤销 · 保存"],
	insightHead: [
		"AI Insight explains a run; nothing changes.",
		"AI Insight 解释一次运行；什么都不变。",
	],
	insightHeadShort: ["AI Insight explains.", "AI Insight 只解释。"],
	editHead: ["Where does Edit with AI work?", "Edit with AI 会改哪里？"],
	editHeadShort: ["Edit with AI: where?", "Edit with AI：改哪里？"],
	claimBig: ["The AI drafts; you verify.", "AI 起草，你来核查。"],
	claimSub: [
		"Sort sentences, count credits, edit only in drafts.",
		"给句子分类，算清积分，只在草稿里修改。",
	],
	nextBig: ["Next: build your own Rank column", "下一课：构建你自己的 Rank 列"],
	nextSub: [
		"a formula with sensible units and a floor",
		"单位合理、带门槛的公式",
	],
} as const satisfies Record<string, Copy>;

const replyLabel = (i: number, kind: "text" | "chart"): Copy =>
	kind === "chart"
		? [`Reply ${i + 1} · with a chart`, `回复 ${i + 1} · 含图表`]
		: [`Reply ${i + 1} · text`, `回复 ${i + 1} · 文字`];
const creditText = (n: number): Copy => [
	`${n} ${n === 1 ? "credit" : "credits"}`,
	`${n} 积分`,
];

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
	const claim = (name: string, big: Copy, sub: Copy) => (
		<g data-f={name}>
			<Lines
				name={`${name}-big`}
				text={t(big)}
				x={W / 2}
				y={H * 0.42}
				size={T.title}
				maxWidth={room}
			/>
			<Lines
				name={`${name}-sub`}
				text={t(sub)}
				x={W / 2}
				y={
					H * 0.42 +
					T.title * 1.15 +
					(lineCount(t(big), room, T.title) - 1) * T.title * 1.35
				}
				size={T.body}
				maxWidth={room}
				className="wt-film-type wt-film-dim"
			/>
		</g>
	);
	const insightBody = narrow ? INSIGHT_BODY_SHORT : INSIGHT_BODY;
	const panelH =
		L.panelPad * 2 +
		T.body * 2.7 +
		lineCount(t(insightBody), L.panelW - 2 * L.panelPad, L.panelText) *
			L.panelText *
			1.35;
	const recipeField: Copy = [
		`Volume/OI ≥ ${screenDefaults.minVolumeToOi}`,
		`成交量/OI ≥ ${screenDefaults.minVolumeToOi}`,
	];
	const quote = `“${t(BET.text)}”`;
	const quoteSize = narrow ? T.head * 1.2 : T.title;
	const quoteY = H * 0.28 + quoteSize * 1.5;
	const draftX = narrow ? margin : margin + L.panelW + 20;
	return (
		<>
			<Backdrop frame={L} />

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-tag"
					x={W / 2}
					y={H * 0.28}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qTag).toUpperCase()}
				</Word>
				<Lines
					name="q-big"
					text={quote}
					x={W / 2}
					y={quoteY}
					size={quoteSize}
					maxWidth={room}
				/>
				<Lines
					name="q-line"
					text={t(copy.qLine)}
					x={W / 2}
					y={
						quoteY +
						(lineCount(quote, room, quoteSize) - 1) * quoteSize * 1.35 +
						quoteSize * 1.3
					}
					size={T.body}
					maxWidth={room}
					className="wt-film-type wt-film-accent"
				/>
			</g>
			{headline("s-head", copy.sortHead, copy.sortHeadShort)}
			{headline("b-head", copy.betHead, copy.betHeadShort)}
			{headline("r-head", copy.restHead, copy.restHeadShort)}

			{/* A focused source and its settled result, in both frame shapes. */}
			<g data-f="rows">
				{proofs.map((proof) => {
					const y = L.proofY(proof.id);
					const sourceY = y + T.small * 1.6 + T.body * 1.6;
					const basisY =
						sourceY +
						lineCount(t(proof.source), room - 28, T.body) * T.body * 1.35 +
						T.body * (proof.id === "bet" ? 1.1 : 0.4);
					const resultY = Math.min(
						proof.id === "bet"
							? basisY + T.body * 4.6
							: basisY +
									lineCount(t(proof.basis), room - 28, T.body) * T.body * 1.35 +
									T.head * 1.1,
						y + L.proofH(proof.id) - Math.max(8, T.head * 0.35),
					);
					const resultSize =
						proof.id === "count" || proof.id === "near"
							? Math.min(T.body * 1.1, T.head * 0.85)
							: T.head;
					return (
						<g key={proof.id} data-f={`row-${proof.id}`}>
							<rect
								x={margin}
								y={y}
								width={room}
								height={L.proofH(proof.id)}
								rx={12}
								className="wt-panel-shape"
							/>
							<Word
								name={`source-tag-${proof.id}`}
								x={margin + 14}
								y={y + T.small * 1.6}
								size={T.small}
								anchor="start"
								className="wt-film-tag"
							>
								{t(proof.tag).toUpperCase()}
							</Word>
							<Lines
								name={`source-${proof.id}`}
								text={t(proof.source)}
								x={margin + 14}
								y={sourceY}
								size={T.body}
								maxWidth={room - 28}
								anchor="start"
							/>
							{proof.id === "count" ? (
								<g data-f="basis-count">
									{(["contracts", "names"] as const).map((kind, i) => (
										<Word
											key={kind}
											name={`count-label-${kind}`}
											x={margin + 14 + (i * (room - 28)) / 2}
											y={basisY}
											size={T.body}
											anchor="start"
											className="wt-film-type wt-film-dim"
										>
											{t(
												kind === "contracts"
													? ["Contracts", "合约"]
													: ["Names", "标的"],
											)}
										</Word>
									))}
								</g>
							) : proof.id === "bet" ? (
								<g data-f="basis-bet">
									{MISSING_FIELDS.map((field, i) => {
										const gap = 10;
										const fieldW = (room - 28 - gap * 2) / 3;
										const x = margin + 14 + i * (fieldW + gap);
										return (
											<g key={field.id} data-f={`bet-field-${field.id}`}>
												<rect
													x={x}
													y={basisY - T.body * 1.2}
													width={fieldW}
													height={T.body * 3.8}
													rx={6}
													className="wt-panel-shape"
												/>
												<Word
													name={`bet-label-${field.id}`}
													x={x + 6}
													y={basisY}
													size={T.body}
													anchor="start"
													className="wt-film-type wt-film-dim"
												>
													{t(field.label)}
												</Word>
												<Word
													name={`bet-missing-${field.id}`}
													x={x + 6}
													y={basisY + T.body * 1.6}
													size={T.body}
													anchor="start"
													className={`wt-film-type ${toneClass.caution}`}
												>
													{t(["Missing", "缺失"])}
												</Word>
											</g>
										);
									})}
								</g>
							) : proof.id === "near" ? (
								<text
									data-f="basis-near"
									x={margin + 14}
									y={basisY}
									className="wt-film-num"
									style={{
										fontSize: T.body,
										fontWeight: 500,
										letterSpacing: 0,
									}}
								>
									{expiryDays.map((days, i) => (
										<tspan
											key={PASSED[i].id}
											data-f={`expiry-day-${i}`}
											x={margin + 14 + (i * (room - 28)) / expiryDays.length}
											y={basisY}
										>
											{days}
											{i < expiryDays.length - 1 ? " " : ""}
										</tspan>
									))}
								</text>
							) : (
								<Lines
									name={`basis-${proof.id}`}
									text={t(proof.basis)}
									x={margin + 14}
									y={basisY}
									size={T.body}
									maxWidth={room - 28}
									anchor="start"
									className="wt-film-type wt-film-dim"
								/>
							)}
							{proof.id === "count" ? (
								<g data-f="result-count">
									{[PASSED.length, NAMES].map((value, i) => (
										<text
											key={i === 0 ? "contracts" : "names"}
											data-f={i === 0 ? "count-contracts" : "count-names"}
											x={margin + 14 + (i * (room - 28)) / 2}
											y={resultY}
											className="wt-film-num"
											style={{ fontSize: T.head }}
										>
											{value}
										</text>
									))}
								</g>
							) : (
								<text
									data-f={`result-${proof.id}`}
									x={margin + 14}
									y={resultY}
									className={`${proof.id === "bet" ? "wt-film-type" : "wt-film-num"} ${proof.tone ? toneClass[proof.tone] : ""}`}
									style={{ fontSize: resultSize }}
								>
									{t(proof.result)}
								</text>
							)}
						</g>
					);
				})}
			</g>

			{/* The bill. */}
			{headline("c-head", copy.creditHead, copy.creditHead)}
			<g data-f="ledger">
				<text
					data-f="billing"
					x={margin}
					y={L.ledgerY(0) - H * 0.035}
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.billing).toUpperCase()}
				</text>
				{REPLIES.map((reply, i) => (
					<g key={`reply-${i + 1}`} data-f={`reply-${i}`}>
						<rect
							x={margin}
							y={L.ledgerY(i)}
							width={L.ledgerW}
							height={L.ledgerH}
							rx={9}
							className="wt-panel-shape"
						/>
						<text
							x={margin + 14}
							y={L.ledgerY(i) + L.ledgerH / 2 + L.rowText * 0.36}
							className="wt-film-type"
							style={{ fontSize: L.rowText }}
						>
							{t(
								!narrow && reply.kind === "chart"
									? [`Reply ${i + 1} · chart`, `回复 ${i + 1} · 含图表`]
									: replyLabel(i, reply.kind),
							)}
						</text>
						<text
							data-f={`cost-${i}`}
							x={margin + L.ledgerW - 14}
							y={L.ledgerY(i) + L.ledgerH / 2 + L.rowText * 0.36}
							textAnchor="end"
							className="wt-film-num"
							style={{ fontSize: L.rowText }}
						>
							{t(creditText(reply.cost))}
						</text>
					</g>
				))}
				<g data-f="total-row">
					<text
						x={L.totalX}
						y={L.totalTagY}
						textAnchor="middle"
						className="wt-film-tag"
						style={{ fontSize: T.small }}
					>
						{t(copy.total).toUpperCase()}
					</text>
					<text
						data-f="total-formula"
						x={L.totalX}
						y={L.formulaY}
						textAnchor="middle"
						className="wt-film-num"
						style={{ fontSize: T.head }}
					>
						{`${REPLIES.map((reply) => reply.cost).join(" + ")} = ${TOTAL}`}
					</text>
				</g>
				<text
					data-f="total"
					x={L.totalX}
					y={L.totalY}
					textAnchor="middle"
					className="wt-film-num wt-film-accent"
					style={{ fontSize: L.totalSize }}
				>
					{t(creditText(TOTAL))}
				</text>
			</g>

			<Brackets name="lock-total" glow />

			{/* Insight leaves the official object intact; Edit branches a new object. */}
			{headline("i-head", copy.insightHead, copy.insightHeadShort)}
			{headline("e-head", copy.editHead, copy.editHeadShort)}
			<g data-f="recipe">
				<rect
					data-f="bar"
					x={margin}
					y={L.barY}
					width={room}
					height={L.barH}
					rx={12}
					className="wt-panel-shape"
				/>
				<Word
					name="bar-title"
					x={margin + 16}
					y={L.barY + T.body * 1.6}
					size={L.rowText * 1.05}
					anchor="start"
				>
					{t(narrow ? copy.screenerShort : copy.screener)}
				</Word>
				<Word
					name="st-official"
					x={margin + 16}
					y={L.barY + T.body * 3}
					size={T.small * 1.1}
					anchor="start"
					className="wt-film-type wt-film-dim"
				>
					{t(copy.official)}
				</Word>
				<Word
					name="official-field"
					x={margin + 16}
					y={L.barY + L.barH - T.small}
					size={T.body}
					anchor="start"
				>
					{t(recipeField)}
				</Word>
				<g data-f="p-insight">
					<rect
						x={margin}
						y={L.panelY}
						width={L.panelW}
						height={panelH}
						rx={12}
						className="wt-panel-shape"
					/>
					<Word
						name="insight-title"
						x={margin + L.panelPad}
						y={L.panelY + L.panelPad + T.body}
						size={T.body * 1.05}
						anchor="start"
					>
						AI Insight
					</Word>
					<Lines
						name="p-insight-body"
						text={t(insightBody)}
						x={margin + L.panelPad}
						y={L.panelY + L.panelPad + T.body * 2.7}
						size={L.panelText}
						maxWidth={L.panelW - 2 * L.panelPad}
						anchor="start"
						className="wt-film-type wt-film-dim"
					/>
				</g>
				<path
					data-f="draft-branch"
					d={`M ${margin + room * 0.75} ${L.barY + L.barH} V ${L.panelY - 7} m -4 -4 l 4 4 l 4 -4`}
					fill="none"
					stroke={toneColor("focus")}
					strokeWidth={2}
				/>
				<g data-f="p-edit">
					<rect
						x={draftX}
						y={L.panelY}
						width={L.panelW}
						height={H * 0.28}
						rx={12}
						className="wt-focus-shape"
					/>
					<Word
						name="draft-owner"
						x={draftX + L.panelPad}
						y={L.panelY + L.panelPad + T.body}
						size={T.body * 1.05}
						anchor="start"
						className="wt-film-type wt-film-accent"
					>
						{t(copy.private)}
					</Word>
					<Word
						name="draft-tools"
						x={draftX + L.panelPad}
						y={L.panelY + L.panelPad + T.body * 2.7}
						size={T.body}
						anchor="start"
						className="wt-film-type wt-film-dim"
					>
						{t(copy.draftTools)}
					</Word>
					<Word
						name="draft-title"
						x={draftX + L.panelPad}
						y={L.panelY + L.panelPad + T.body * 4.1}
						size={T.body}
						anchor="start"
					>
						{t(copy.screenerShort)}
					</Word>
					<Word
						name="draft-field"
						x={draftX + L.panelPad}
						y={L.panelY + L.panelPad + T.body * 5.5}
						size={T.body}
						anchor="start"
					>
						{t(recipeField)}
					</Word>
				</g>
			</g>

			{claim("claim", copy.claimBig, copy.claimSub)}
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
	const flat = (name: string) =>
		kids(name).flatMap((el) =>
			el.tagName === "g" && !el.hasAttribute("data-f")
				? [...el.children]
				: [el],
		);
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const row = (id: string) => one(`row-${id}`);
	const result = (id: string) => one(`result-${id}`);
	const fade = (targets: Element | Element[], at: number, duration = 0.5) =>
		tl.fromTo(targets, { opacity: 0 }, { opacity: 1, duration }, at);
	const replies = REPLIES.map((_, i) => one(`reply-${i}`));
	const costs = REPLIES.map((_, i) => one(`cost-${i}`));
	const total = one<SVGTextElement>("total");
	const lockTotal = one<SVGGraphicsElement>("lock-total");
	d.hidden([
		...flat("q"),
		...["s-head", "b-head", "r-head", "c-head", "i-head", "e-head"].map(
			(name) => one(name),
		),
		...proofs.flatMap((proof) => [row(proof.id), result(proof.id)]),
		...MISSING_FIELDS.map((field) => one(`bet-missing-${field.id}`)),
		one("billing"),
		...replies,
		...costs,
		one("total-row"),
		total,
		lockTotal,
		one("bar"),
		one("bar-title"),
		one("st-official"),
		one("official-field"),
		one("p-insight"),
		one("p-edit"),
		one("draft-branch"),
		one("draft-title"),
		one("draft-field"),
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question: one sentence the AI wrote ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	word(one("q-big"), 4.8);
	show(one("q-line"), 6.0);

	// ——— sort: what backs each sentence ———
	tl.addLabel("sort", 9.6);
	hide(flat("q"), 9.6);
	show(one("s-head"), 9.8, "above");
	fade([row("count"), row("ratio")], 10.1);
	fade([result("count"), result("ratio")], 10.6);
	// Related proofs settle at 11.1; preserve the original headline holds.
	d.swap(one("s-head"), one("b-head"), 13.4);
	hide([row("count"), row("ratio")], 13.65, 0.35, 0);
	fade(row("bet"), 14.0);
	// Check each missing input deliberately before the settled rejection.
	MISSING_FIELDS.forEach((field, i) => {
		fade(one(`bet-missing-${field.id}`), 14.5 + i * 1.3, 0.3);
	});
	fade(result("bet"), 17.4);
	// The completed missing-evidence proof rests from 17.9 to 19.4.
	d.swap(one("b-head"), one("r-head"), 19.4);
	hide(row("bet"), 19.4, 0.35, 0);
	fade([row("near"), row("fall")], 19.75);
	// The five distances remain visible; select the qualifying entries before the count.
	const qualifyingExpiries = expiryDays.flatMap((days, i) =>
		days <= 30 ? [one(`expiry-day-${i}`)] : [],
	);
	const otherExpiries = expiryDays.flatMap((days, i) =>
		days > 30 ? [one(`expiry-day-${i}`)] : [],
	);
	tl.set(qualifyingExpiries, { attr: { class: toneClass.focus } }, 20.25);
	tl.fromTo(
		qualifyingExpiries,
		{ fontWeight: 500 },
		{
			fontWeight: 600,
			duration: 0.3,
			ease: "none",
		},
		20.25,
	);
	tl.fromTo(
		otherExpiries,
		{ opacity: 1 },
		{ opacity: 0.3, duration: 0.3, ease: "none" },
		20.25,
	);
	fade([result("near"), result("fall")], 20.55);
	// Both conclusions settle at 21.05; preserve their 3.25 s rest until 24.3.

	// ——— credits: every reply has a price ———
	tl.addLabel("credits", 24.3);
	hide([one("r-head"), row("near"), row("fall")], 24.3);
	show(one("c-head"), 24.65, "above");
	show(one("billing"), 24.8);
	replies.forEach((reply, i) => {
		show(reply, 25.0 + i * 0.3);
	});
	// Compare all three prices together, then leave their proof quiet for a second.
	fade(costs, 25.9);
	// Prices settle at 26.4; the settled sum gets a full second before its lock.
	fade(one("total-row"), 27.4);
	tl.fromTo(
		total,
		{ opacity: 0, scale: 1.06, transformOrigin: "50% 50%" },
		{ opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" },
		27.4,
	);

	// The hero: what three replies cost.
	d.lock(lockTotal, 28.9, { around: total, pad: 6 });
	tl.addLabel("hero-lock", 28.9);

	// ——— insight: explain, or edit a draft ———
	tl.addLabel("insight", 31.1);
	hide(one("c-head"), 31.1);
	hide(
		[one("billing"), ...replies, ...costs, one("total-row"), total, lockTotal],
		31.1,
		0.5,
		0,
	);
	show(one("i-head"), 31.45, "above");
	show([one("bar"), one("bar-title")], 31.7);
	show([one("st-official"), one("official-field")], 31.9);
	show(one("p-insight"), 32.3);
	d.swap(one("i-head"), one("e-head"), 35.3);
	// Keep the official recipe visible while a separate private card is built.
	if (L.narrow) hide(one("p-insight"), 35.9, 0.35, 0);
	fade(one("p-edit"), 36.25);
	d.trace(one<SVGPathElement>("draft-branch"), L.narrow ? 36.25 : 35.85, {
		duration: 0.6,
	});
	fade(one("draft-title"), 36.45);
	// The matching field inherits its source's emphasis, then both settle together.
	const officialField = one("official-field");
	const draftField = one("draft-field");
	tl.set(
		officialField,
		{ attr: { class: `wt-film-type ${toneClass.focus}` } },
		36.35,
	);
	tl.set(
		draftField,
		{ attr: { class: `wt-film-type ${toneClass.focus}` } },
		36.45,
	);
	tl.fromTo(draftField, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 36.45);
	tl.set(
		[officialField, draftField],
		{ attr: { class: "wt-film-type" } },
		36.95,
	);
	// Cut: the claim.
	hide(
		[
			one("e-head"),
			one("bar"),
			one("bar-title"),
			one("st-official"),
			one("official-field"),
			one("draft-branch"),
			one("p-insight"),
			one("p-edit"),
		],
		40.15,
	);
	word(one("claim-big"), 40.55);
	show(one("claim-sub"), 40.95);

	// ——— next ———
	tl.addLabel("next", 44.65);
	hide(kids("claim"), 44.65);
	d.close(44.65);
	return tl;
}

export const aiVerifyFilm: Film = {
	id: "ai-verify",
	label: [
		`Verifying TradingFlow AI, as a short film: one sentence the AI wrote about Monday's screen, that someone opened a large bearish bet on CRUX ahead of news; the whole answer sorted by what backs each sentence, one in the report's key figures, two calculated from its rows, and the bet and a forecast that CRUX will fall supported by nothing in the data; a bill of two text replies and one with a chart for ${TOTAL} credits; and the recipe's two AI actions, AI Insight explaining a run without changing anything and Edit with AI opening a private draft`,
		`核查 TradingFlow AI 短片：AI 关于周一筛选写的一句话，“有人在消息公布前对 CRUX 建立了大额看空押注”；按依据给整段回答分类，一句在报告的关键数字里，两句可以从行数据算出，而押注和“CRUX 会下跌”的预测在数据里毫无依据；两条文字回复加一条含图表的回复，共 ${TOTAL} 积分；以及 Recipe 上的两种 AI 操作，AI Insight 只解释一次运行、什么都不改，Edit with AI 打开一份私有草稿`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Verify AI", "核查 AI"] },
		{ id: "question", label: ["The sentence", "那句话"] },
		{ id: "sort", label: ["Sort it", "分类"] },
		{ id: "credits", label: ["Credits", "积分"] },
		{ id: "insight", label: ["Insight vs edit", "解释与编辑"] },
		{ id: "next", label: ["Next", "下一课"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
