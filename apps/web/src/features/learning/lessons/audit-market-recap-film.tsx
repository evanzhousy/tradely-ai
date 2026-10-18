import {
	type Copy,
	count,
	mondayPacket,
	pick,
	rowContracts,
	rowPremium,
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
import { textWidth } from "../walkthrough/text-measure";
import {
	CONTRACTS,
	claims,
	dollars,
	PREMIUM,
	premiumProof,
	REPORTED,
	type Status,
	sections,
} from "./audit-market-recap-model";

/*
 * Audits, as a film. A colleague's recap puts Monday's premium at $1,655.20, and its
 * contracts and prices match the tape: does it pass? The rows answer: recomputed from the
 * trades, covered amounts lack the ×100 multiplier; the covered subtotal is
 * $165,520. The hero audits the recap's five claims: one supported, three repaired, and
 * the forecast cut, where glowing brackets lock. Last, the signoff: what passed, what
 * changed, what is still open, and what would reopen it.
 *
 *   open      0–4        "Audits"
 *   question  4–8.6      $1,655.20 in premium: pass it?
 *   amount    8.6–22.60  headers, focused 105 proof, comparison group, subtotal
 *   claims    22.60–34.20 original inventory; stable repairs; lock at 30.20 after 1 s quiet
 *   signoff   34.20–40.60  compact findings, open items, reopening conditions
 *   claim     40.60–45.00  find it, fix it, say what's open
 *   next      45.00–47.50  Next: the module checkpoint
 */

const END = 47.5;
const ROWS = mondayPacket;
const POSITION_CONTRACTS = rowContracts(ROWS[2]);
if (POSITION_CONTRACTS === null)
	throw new Error("The positions repair needs the covered 110-call row.");
const statusTone: Record<Status, string> = {
	supported: "wt-film-dim",
	repaired: toneClass.caution,
	removed: toneClass.caution,
};
const sectionTone: Readonly<Record<string, string>> = {
	supported: "wt-film-dim",
	repaired: "wt-film-dim",
	open: toneClass.caution,
	reopen: "wt-film-dim",
} as const;

function layout(width: number) {
	const frame = filmFrame(width);
	const { height: H, narrow, room } = frame;
	return {
		...frame,
		rowY: (i: number) =>
			H * (narrow ? 0.29 : 0.29) + i * H * (narrow ? 0.075 : 0.075),
		rowH: H * 0.06,
		colReport: narrow ? 0.62 : 0.6,
		totalY: H * 0.9,
		claimY: (i: number) =>
			H * (narrow ? 0.26 : 0.27) + i * H * (narrow ? 0.12 : 0.12),
		claimH: H * (narrow ? 0.1 : 0.1),
		secY: (i: number) =>
			H * (narrow ? 0.235 : 0.25) + i * H * (narrow ? 0.18 : 0.165),
		secH: H * (narrow ? 0.17 : 0.15),
		labelW: narrow ? room * 0.3 : room * 0.18,
	};
}

const copy = {
	title: ["Audits", "审核"],
	titleSub: ["find and fix a flawed recap", "发现并修复有缺陷的复盘"],
	qTag: ["a colleague's recap · Monday", "同事的复盘 · 周一"],
	qLabel: ["Reported premium", "所报权利金"],
	qMatch: ["Contracts and prices match tape.", "张数和价格与成交记录一致。"],
	qBig: ["Pass it?", "通过吗？"],
	mHead: ["Recompute from the trades.", "按成交重算。"],
	m2Head: [
		"Covered rows: ×100; missing stays missing.",
		"有数据行补回 ×100；缺失仍缺失。",
	],
	covered: ["covered subtotal · 4/5 strikes", "覆盖小计 · 4/5 行权价"],
	multiplier: [
		`× ${premiumProof.multiplier} shares/contract =`,
		`× ${premiumProof.multiplier} 股/张 =`,
	],
	report: ["report", "报告"],
	recomputed: ["recomputed", "重算"],
	noData: ["no data", "无数据"],
	cHead: ["Then check all five claims.", "再检查全部五个结论。"],
	c2Head: [
		"One holds; three repaired, one cut.",
		"一个成立；三个修复，一个删除。",
	],
	supported: ["supported", "有依据"],
	scopeShort: ["Oct 18 calls, 100–120, Mon", "10月18日 看涨 100–120，周一"],
	repaired: ["repaired", "已修复"],
	removed: ["Forecast removed", "预测已删除"],
	forecastLead: ["Traders expect", "交易者预期"],
	forecastLabel: ["ALFA above", "ALFA 在10月18日前高于"],
	forecastFigure: ["$110", "$110"],
	forecastDeadline: ["by Oct 18", ""],
	sHead: [
		"Sign off with gaps and reopening conditions.",
		"签核，写明缺口与重审条件。",
	],
	claimBig: ["Find. Fix. Disclose gaps.", "找出问题，修正错误，说明待核事项。"],
	claimSub: [
		"Show source, cutoff, and open items.",
		"标明来源、截止与待核项。",
	],
	nextBig: ["Next: the module checkpoint", "下一步：模块检查点"],
	nextSub: [
		"producing and auditing research, on a new day",
		"在新的一天里运用研究的产出与审核",
	],
} as const satisfies Record<string, Copy>;

/** Film-only phone summaries; the shared playground copy stays unchanged. */
const phoneSections: Readonly<Record<string, Copy>> = {
	supported: [
		`P1 · ${dollars(PREMIUM)} premium · ${count(CONTRACTS)} contracts traded · 4/5 strikes`,
		`P1 · 权利金 ${dollars(PREMIUM)} · 成交 ${count(CONTRACTS)} 张 · 覆盖 4/5 行权价`,
	],
	repaired: [
		"×100 restored · volume, not positions · 120 missing · forecast cut",
		"补回 ×100 · 成交≠持仓 · 120 缺失 · 删除预测",
	],
	reopen: [
		"Mon tape corrected or 120 data changes a claim",
		"周一成交更正，或 120 数据改变结论",
	],
};

/** Film-only signoff copy; the model's shared playground wording stays unchanged. */
const signoffCopy: Readonly<Record<string, Copy>> = {
	supported: [
		`P1 · ${dollars(PREMIUM)} premium · ${count(CONTRACTS)} contracts traded · 4/5 strikes.`,
		`P1 · 权利金 ${dollars(PREMIUM)} · 成交 ${count(CONTRACTS)} 张 · 覆盖 4/5 行权价。`,
	],
	repaired: [
		"×100 restored · volume, not positions · 120 missing · forecast cut.",
		"补回 ×100 · 成交≠持仓 · 120 缺失 · 删除预测。",
	],
	open: [
		"120 Monday tape · Tue 09:00; 110 open-interest change · Tuesday report.",
		"120 周一成交 · 周二 09:00；110 未平仓量变化 · 周二报告。",
	],
	reopen: [
		"Monday tape corrected or 120 data changes a claim.",
		"周一成交记录更正，或 120 数据改变结论。",
	],
};

/** Each phone open item owns its complete evidence deadline. */
const phoneOpenLines: readonly Copy[] = [
	["120 tape due Tue 09:00", "120 成交：周二09:00"],
	["110 OI change: Tue report", "110 未平仓量变化：周二报告"],
];

/** Compact film repairs carry the same quantities and cutoff as the shared claims. */
const repairCopy: Readonly<Record<string, Copy>> = {
	premium: [
		`${dollars(PREMIUM)} premium · 4/5 strikes`,
		`权利金 ${dollars(PREMIUM)} · 4/5 行权价`,
	],
	missing: ["120 call: no data at cutoff", "120 看涨：截止时无数据"],
};

const positionsRepairParts = {
	lead: ["→ 110: ", "→ 110："],
	traded: [
		`${count(POSITION_CONTRACTS)} traded`,
		`成交 ${count(POSITION_CONTRACTS)} 张`,
	],
	separator: ["; ", "；"],
	unknown: ["new positions unknown", "新增仓位未知"],
} as const satisfies Record<string, Copy>;

/** False claims show their reported figures as separate marks beside compact labels. */
const falseClaimFacts: Readonly<Record<string, { label: Copy; figure: Copy }>> =
	{
		premium: {
			label: ["reported premium", "原报权利金"],
			figure: [usd(REPORTED), usd(REPORTED)],
		},
		positions: {
			label: ["new positions · 110 call", "新增仓位 · 110 看涨"],
			figure: [count(POSITION_CONTRACTS), count(POSITION_CONTRACTS)],
		},
		missing: {
			label: ["120 call · traded", "120 看涨 · 成交"],
			figure: ["0", "0"],
		},
	};

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
	const totalReportFontSize = narrow ? T.body * 1.1 : T.head;
	const totalReportX = margin + room * L.colReport;
	const totalReportWidth = textWidth(usd(REPORTED), totalReportFontSize);
	const totalStrikeStartX = totalReportX - totalReportWidth - 3;
	const totalStrikeEndX = totalReportX + 2;
	const totalStrikeY = L.totalY - totalReportFontSize * 0.35;
	const positionsRepairX = margin + 14;
	const positionsRepairY = L.claimY(2) + L.claimH * 0.78;
	const positionsRepairFontSize = T.body;
	const positionsMeasureSize =
		positionsRepairFontSize * (locale === "zh" ? 0.95 : 0.86);
	const positionsLeadWidth = textWidth(
		t(positionsRepairParts.lead),
		positionsMeasureSize,
	);
	const positionsTradedWidth = textWidth(
		t(positionsRepairParts.traded),
		positionsMeasureSize,
	);
	const positionsSeparatorWidth = textWidth(
		t(positionsRepairParts.separator),
		positionsMeasureSize,
	);
	const positionsUnknownWidth = textWidth(
		t(positionsRepairParts.unknown),
		positionsMeasureSize,
	);
	const positionsTradedStartX = positionsRepairX + positionsLeadWidth;
	const positionsUnknownStartX =
		positionsTradedStartX + positionsTradedWidth + positionsSeparatorWidth;
	const positionsEvidenceY = positionsRepairY + positionsRepairFontSize * 0.28;
	const headline = (name: string, text: Copy) => (
		<Lines
			name={name}
			text={t(text)}
			x={margin}
			y={L.headY}
			size={T.head}
			maxWidth={narrow ? room : room * 0.74}
			anchor="start"
		/>
	);
	const text = narrow ? T.small * 1.1 : T.body;
	const proofOperands = premiumProof.trades.map(
		(trade, i) =>
			`${i === 0 ? "(" : "+ "}${trade.quantity} × ${usd(trade.price)}${i === premiumProof.trades.length - 1 ? ")" : ""}`,
	);
	return (
		<>
			<Backdrop frame={L} />

			{/* The claims. */}
			<TitleCard frame={L} title={t(copy.title)} sub={t(copy.titleSub)} />
			<g data-f="q">
				<Word
					name="q-tag"
					x={W / 2}
					y={H * 0.27}
					size={T.small}
					className="wt-film-tag"
				>
					{t(copy.qTag).toUpperCase()}
				</Word>
				{/* Label, figure and note stack with room between them; the question sits clear below. */}
				<g data-f="q-copy">
					<Word
						name="q-label"
						x={W / 2}
						y={H * 0.345}
						size={T.body}
						className="wt-film-tag"
					>
						{t(copy.qLabel)}
					</Word>
					<Word
						name="q-amount"
						x={W / 2}
						y={H * 0.455}
						size={T.title}
						className={`wt-film-num ${toneClass.focus}`}
					>
						{usd(REPORTED)}
					</Word>
					<Lines
						name="q-match"
						text={t(copy.qMatch)}
						x={W / 2}
						y={H * 0.53}
						size={narrow ? T.small : T.body}
						maxWidth={room}
						className="wt-film-type wt-film-dim"
					/>
				</g>
				<Lines
					name="q-big"
					text={t(copy.qBig)}
					x={W / 2}
					y={H * 0.66}
					size={T.title}
					maxWidth={room}
				/>
			</g>

			{/* The amount, row by row. */}
			{headline("m-head", copy.mHead)}
			{/* Each answer, a line under its headline, as the stage makes it. */}
			<Lines
				name="m2-head"
				text={t(copy.m2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.mHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			<g data-f="cols">
				<text
					x={margin + room * L.colReport}
					y={L.rowY(0) - T.small * 0.9}
					textAnchor="end"
					className="wt-film-tag"
					style={{ fontSize: T.small }}
				>
					{t(copy.report).toUpperCase()}
				</text>
			</g>
			<text
				data-f="col-fixed"
				x={margin + room - 12}
				y={L.rowY(0) - T.small * 0.9}
				textAnchor="end"
				className="wt-film-tag"
				style={{ fontSize: T.small }}
			>
				{t(copy.recomputed).toUpperCase()}
			</text>
			{ROWS.map((row, i) => {
				const premium = rowPremium(row);
				return (
					<g key={row.id}>
						<g data-f={`row-${i}`}>
							<rect
								data-f={`row-${i}-box`}
								x={margin}
								y={L.rowY(i)}
								width={room}
								height={L.rowH}
								rx={9}
								className="wt-panel-shape"
								style={
									premium === null ? { strokeDasharray: "4 3" } : undefined
								}
							/>
							<text
								x={margin + 12}
								y={L.rowY(i) + L.rowH / 2 + text * 0.36}
								className="wt-film-type"
								style={{ fontSize: text }}
							>
								{t([`${row.strike} call`, `${row.strike} 看涨`])}
							</text>
							<text
								x={margin + room * L.colReport}
								y={L.rowY(i) + L.rowH / 2 + text * 0.36}
								textAnchor="end"
								className={`wt-film-num ${premium === null ? toneClass.caution : premium === 0 ? "wt-film-dim" : ""}`}
								style={{ fontSize: text }}
							>
								{premium === null ? t(copy.noData) : usd(premium / 100)}
							</text>
						</g>
						{premium === null ? null : (
							<text
								data-f={`fixed-${i}`}
								x={margin + room - 12}
								y={L.rowY(i) + L.rowH / 2 + text * 0.36}
								textAnchor="end"
								className={`wt-film-num ${premium === 0 ? "wt-film-dim" : ""}`}
								style={{ fontSize: text }}
							>
								{dollars(premium)}
							</text>
						)}
					</g>
				);
			})}
			{/* Build the 105 row from the packet's two executions, never count an equality. */}
			<Word
				name="proof-label"
				x={margin + 14}
				y={H * 0.68}
				size={T.small}
				anchor="start"
				className="wt-film-tag wt-film-accent"
			>
				{t([
					`${premiumProof.strike} call · source trades`,
					`${premiumProof.strike} 看涨 · 源成交`,
				])}
			</Word>
			{premiumProof.trades.map((trade, i) => (
				<Word
					key={trade.id}
					name={`proof-trade-${i}`}
					x={
						margin +
						14 +
						proofOperands
							.slice(0, i)
							.reduce(
								(sum, operand) => sum + textWidth(operand, T.body) + T.body,
								0,
							)
					}
					y={H * 0.735}
					size={T.body}
					anchor="start"
					className="wt-film-num"
				>
					{proofOperands[i]}
				</Word>
			))}
			<Word
				name="proof-multiplier"
				x={margin + 14}
				y={H * 0.79}
				size={T.small}
				anchor="start"
				className="wt-film-num"
			>
				{t(copy.multiplier)}
			</Word>
			<Word
				name="proof-result"
				x={margin + 14 + textWidth(t(copy.multiplier), T.small) + 14}
				y={H * 0.79}
				size={T.body}
				anchor="start"
				className={`wt-film-num ${toneClass.focus}`}
			>
				{dollars(premiumProof.premium)}
			</Word>
			<Word
				name="total-label"
				x={margin + room - 12}
				y={H * 0.83}
				size={T.small}
				anchor="end"
				className={`wt-film-tag ${toneClass.focus}`}
			>
				{t(copy.covered)}
			</Word>
			<text
				data-f="total-report"
				x={totalReportX}
				y={L.totalY}
				textAnchor="end"
				className="wt-film-num"
				style={{
					fontSize: totalReportFontSize,
				}}
			>
				{usd(REPORTED)}
			</text>
			<path
				data-f="total-strike"
				d={`M ${totalStrikeStartX} ${totalStrikeY + 1} L ${totalStrikeEndX} ${totalStrikeY - 1}`}
				fill="none"
				stroke="var(--tone-caution)"
				strokeLinecap="round"
				strokeWidth={narrow ? 1.5 : 2}
			/>
			<text
				data-f="total-fixed"
				x={margin + room - 12}
				y={L.totalY}
				textAnchor="end"
				className={`wt-film-num ${toneClass.focus}`}
				style={{ fontSize: narrow ? T.head : T.num }}
			>
				{dollars(PREMIUM)}
			</text>

			{/* Five claims. */}
			{headline("c-head", copy.cHead)}
			<Lines
				name="c2-head"
				text={t(copy.c2Head)}
				x={margin}
				y={
					L.headY +
					lineCount(t(copy.cHead), narrow ? room : room * 0.74, T.head) *
						T.head *
						1.35
				}
				size={T.head}
				maxWidth={narrow ? room : room * 0.74}
				anchor="start"
			/>
			{claims.map((claim, i) => (
				<g key={claim.id}>
					<g data-f={`claim-${i}`}>
						<rect
							data-f={`claim-${i}-box`}
							x={margin}
							y={L.claimY(i)}
							width={room}
							height={claim.status === "removed" ? H * 0.2 : L.claimH}
							rx={10}
							className="wt-panel-shape"
						/>
						{claim.status === "removed" ? (
							<g data-f={`claim-${i}-text`}>
								<text
									x={margin + 14}
									y={L.claimY(i) + (narrow ? text : L.claimH * 0.42)}
									className="wt-film-type"
									style={{ fontSize: text }}
								>
									{t(copy.forecastLead)}
								</text>
								<text
									x={margin + 14}
									y={
										L.claimY(i) +
										(narrow ? text : L.claimH * 0.42) +
										text * 1.15
									}
									className="wt-film-type"
									style={{ fontSize: text }}
								>
									{t(copy.forecastLabel)}
								</text>
								<text
									data-f={`claim-${i}-figure`}
									x={margin + 14 + textWidth(t(copy.forecastLabel), text) + 6}
									y={
										L.claimY(i) +
										(narrow ? text : L.claimH * 0.42) +
										text * 1.15
									}
									className="wt-film-num"
									style={{ fontSize: T.body }}
								>
									{t(copy.forecastFigure)}
								</text>
								{t(copy.forecastDeadline) ? (
									<text
										x={
											margin +
											14 +
											textWidth(t(copy.forecastLabel), text) +
											textWidth(t(copy.forecastFigure), T.body) +
											12
										}
										y={
											L.claimY(i) +
											(narrow ? text : L.claimH * 0.42) +
											text * 1.15
										}
										className="wt-film-type"
										style={{ fontSize: text }}
									>
										{t(copy.forecastDeadline)}
									</text>
								) : null}
							</g>
						) : falseClaimFacts[claim.id] ? (
							<g data-f={`claim-${i}-text`}>
								<text
									data-f={`claim-${i}-figure`}
									x={margin + 14}
									y={L.claimY(i) + L.claimH * 0.42}
									className="wt-film-num"
									style={{ fontSize: T.body }}
								>
									{t(falseClaimFacts[claim.id].figure)}
								</text>
								<text
									x={
										margin +
										14 +
										textWidth(t(falseClaimFacts[claim.id].figure), T.body) +
										8
									}
									y={L.claimY(i) + L.claimH * 0.42}
									className="wt-film-type"
									style={{ fontSize: text }}
								>
									{t(falseClaimFacts[claim.id].label)}
								</text>
							</g>
						) : (
							<text
								data-f={`claim-${i}-text`}
								x={margin + 14}
								y={L.claimY(i) + L.claimH * 0.42}
								className="wt-film-type"
								style={{ fontSize: text }}
							>
								{t(
									narrow && claim.id === "scope" ? copy.scopeShort : claim.text,
								)}
							</text>
						)}
					</g>
					<text
						data-f={`tag-${i}`}
						x={margin + room - 14}
						y={L.claimY(i) + L.claimH * (narrow ? 0.78 : 0.42)}
						textAnchor="end"
						className={`wt-film-tag ${statusTone[claim.status]}`}
						style={{ fontSize: T.small * 0.95 }}
					>
						{t(claim.defect ?? copy.supported).toUpperCase()}
					</text>
					{claim.repair || claim.status === "removed" ? (
						<text
							data-f={`fix-${i}`}
							x={claim.status === "removed" ? margin + room / 2 : margin + 14}
							textAnchor={claim.status === "removed" ? "middle" : "start"}
							y={
								L.claimY(i) +
								(claim.status === "removed" ? H * 0.12 : L.claimH * 0.78)
							}
							className={`wt-film-type ${claim.status === "removed" ? toneClass.focus : claim.id === "premium" || claim.id === "positions" ? "" : toneClass.caution}`}
							style={{
								fontSize:
									claim.status === "removed"
										? narrow
											? T.head * 1.5
											: T.num
										: T.body,
							}}
						>
							{claim.repair ? (
								claim.id === "positions" ? (
									<>
										<tspan>{t(positionsRepairParts.lead)}</tspan>
										<tspan>{t(positionsRepairParts.traded)}</tspan>
										<tspan>{t(positionsRepairParts.separator)}</tspan>
										<tspan className={toneClass.caution}>
											{t(positionsRepairParts.unknown)}
										</tspan>
									</>
								) : (
									`→ ${t(repairCopy[claim.id] ?? claim.repair)}`
								)
							) : (
								t(copy.removed)
							)}
						</text>
					) : null}
					{claim.id === "positions" ? (
						<g data-f="positions-evidence" fill="none">
							<circle
								cx={positionsTradedStartX - 2}
								cy={positionsEvidenceY}
								r={narrow ? 1.8 : 2.2}
								fill="var(--tone-ink)"
							/>
							<line
								x1={positionsTradedStartX + 3}
								x2={positionsTradedStartX + positionsTradedWidth}
								y1={positionsEvidenceY}
								y2={positionsEvidenceY}
								stroke="var(--tone-ink)"
								strokeLinecap="round"
								strokeWidth={narrow ? 1.2 : 1.7}
							/>
							<rect
								x={positionsUnknownStartX - 3}
								y={positionsRepairY - positionsRepairFontSize * 0.9 - 3}
								width={positionsUnknownWidth + 6}
								height={positionsRepairFontSize * 1.2 + 6}
								rx={3}
								stroke="var(--tone-caution)"
								strokeWidth={narrow ? 1 : 1.4}
							/>
						</g>
					) : null}
				</g>
			))}
			<Brackets name="lock-cut" glow />

			{/* The signoff. */}
			{headline("s-head", copy.sHead)}
			{sections.map((section, i) => (
				<g key={section.id} data-f={`sec-${i}`}>
					<rect
						x={margin}
						y={L.secY(i)}
						width={room}
						height={L.secH}
						rx={12}
						className={
							section.id === "open" ? "wt-focus-shape" : "wt-panel-shape"
						}
					/>
					<text
						x={margin + 14}
						y={L.secY(i) + T.small * 1.7}
						className={`wt-film-tag ${sectionTone[section.id]}`}
						style={{ fontSize: T.small }}
					>
						{t(section.label).toUpperCase()}
					</text>
					{narrow && section.id === "open" ? (
						<text
							data-f={`sec-${i}-text`}
							x={margin + 14}
							y={L.secY(i) + T.small * 3.05}
							textAnchor="start"
							className="wt-film-type"
							style={{ fontSize: T.body }}
						>
							{phoneOpenLines.map((line, j) => (
								<tspan key={j} x={margin + 14} dy={j === 0 ? 0 : T.body * 1.35}>
									{`${j === 0 ? "" : " "}${t(line)}`}
								</tspan>
							))}
						</text>
					) : (
						<Lines
							name={`sec-${i}-text`}
							text={t(
								narrow
									? (phoneSections[section.id] ?? signoffCopy[section.id])
									: signoffCopy[section.id],
							)}
							x={margin + 14}
							y={L.secY(i) + T.small * 1.7 + T.small * (narrow ? 1.35 : 1.6)}
							size={T.body}
							maxWidth={room - 28}
							anchor="start"
							className="wt-film-type"
						/>
					)}
				</g>
			))}

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
	const { tl, one, kids, show, hide, trace } = d;
	const flat = (name: string) =>
		kids(name).flatMap((el) =>
			el.tagName === "g" && !el.hasAttribute("data-f")
				? [...el.children]
				: [el],
		);
	/** A figure lands slightly large and settles, without overshoot: it is data. */
	const word = (target: Element, time: number) =>
		tl.fromTo(
			target,
			{ opacity: 0, scale: 1.08, transformOrigin: "50% 50%" },
			{ opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
			time,
		);
	const heads = ["m-head", "m2-head", "c-head", "c2-head", "s-head"].map(
		(name) => one(name),
	);
	const proof = [
		one("proof-label"),
		...premiumProof.trades.map((_, i) => one(`proof-trade-${i}`)),
		one("proof-multiplier"),
		one("proof-result"),
	];
	const lockCut = one<SVGGraphicsElement>("lock-cut");
	const rows = ROWS.map((_, i) => one(`row-${i}`));
	const fixed = ROWS.flatMap((_, i) => {
		const el = one(`fixed-${i}`);
		return el ? [el] : [];
	});
	const claimRows = claims.map((_, i) => one(`claim-${i}`));
	const tags = claims.map((_, i) => one(`tag-${i}`));
	const fixes = claims.flatMap((_, i) => {
		const el = one(`fix-${i}`);
		return el ? [el] : [];
	});
	const totalStrike = one<SVGPathElement>("total-strike");
	const positionsEvidence = one("positions-evidence");
	const secs = sections.map((_, i) => one(`sec-${i}`));

	d.hidden([
		...flat("q"),
		...heads,
		...kids("cols"),
		one("col-fixed"),
		...rows,
		...fixed,
		...proof,
		one("total-label"),
		one("total-report"),
		totalStrike,
		one("total-fixed"),
		...claimRows,
		...tags,
		...fixes,
		positionsEvidence,
		...secs,
		lockCut,
		...kids("claim"),
	]);

	// ——— open ———
	tl.addLabel("open", 0);
	d.open(0);

	// ——— question ———
	tl.addLabel("question", 4);
	d.tag(4.0);
	show(one("q-tag"), 4.6);
	tl.fromTo(
		one("q-copy"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5, ease: "power2.out" },
		4.8,
	);
	word(one("q-big"), 5.1);

	// ——— amount: recompute from the rows ———
	tl.addLabel("amount", 8.6);
	hide(flat("q"), 8.6);
	show(heads[0], 8.8);
	show(kids("cols"), 8.95, "below", 0.3);
	rows.forEach((row, i) => {
		const at = 10.25 + i * 0.12;
		if (i === 1 || i === 4) show(row, at, "right");
		else
			tl.fromTo(
				row,
				{ opacity: 0, x: 18, y: 0 },
				{ opacity: 0.28, x: 0, y: 0, duration: 0.5 },
				at,
			);
	});
	// Context enters subdued; the 105 subject and missing-row warning stay fully emphasized.
	tl.set(one("row-1-box"), { attr: { class: "wt-focus-shape" } }, 11.1);
	tl.fromTo(
		one("total-report"),
		{ opacity: 0, y: 14 },
		{ opacity: 0.28, y: 0, duration: 0.5 },
		11.05,
	);
	show(one("proof-label"), 10.85);
	// Each operand enters in place; the expression is readable before its result lands.
	premiumProof.trades.forEach((_, i) => {
		tl.fromTo(
			one(`proof-trade-${i}`),
			{ opacity: 0 },
			{ opacity: 1, duration: 0.5 },
			11.1 + i * 0.4,
		);
	});
	show(one("col-fixed"), 11.0);
	tl.fromTo(
		one("proof-multiplier"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		11.9,
	);
	fixed.forEach((el, i) => {
		word(el, i === 1 ? 12.5 : 14.05);
	});
	word(one("proof-result"), 12.5);
	// The worked result settles at 13.05, then stands for 1 s before the other rows return.
	tl.to(
		[rows[0], rows[2], rows[3], one("total-report")],
		{ opacity: 1, duration: 0.35 },
		14.05,
	);
	tl.set(one("row-1-box"), { attr: { class: "wt-panel-shape" } }, 14.05);
	// After the comparison settles at 14.60, scaffold the subtotal label at 15.60.
	tl.fromTo(
		one("total-label"),
		{ opacity: 0 },
		{ opacity: 1, duration: 0.3 },
		15.6,
	);
	// Strike the false report by itself, then let the corrected figure land on its own.
	trace(totalStrike, 15.95, { duration: 0.4, ease: "none" });
	word(one("total-fixed"), 16.35);
	// Subtotal settles at 16.90; the scoped answer follows after 1.3 s quiet.
	show(heads[1], 18.2);

	// ——— claims: the hero. All five, audited and repaired. ———
	tl.addLabel("claims", 22.6);
	// The headline leads the cut: it changes while the table is still in place.
	d.swap([heads[0], heads[1]], heads[2], 22.3);
	hide(
		[
			...kids("cols"),
			one("col-fixed"),
			...rows,
			...fixed,
			...proof,
			one("total-label"),
			one("total-report"),
			totalStrike,
			one("total-fixed"),
		],
		22.6,
	);
	claimRows.forEach((row, i) => {
		show(row, 23.1 + i * 0.125, "right");
	});
	tags.forEach((tag, i) => {
		word(tag, 23.8 + i * 0.3);
	});
	tl.set(one("claim-0-box"), { attr: { class: "wt-focus-shape" } }, 23.8);
	claims.forEach((claim, i) => {
		if (claim.status === "supported") return;
		const at = 27.5 + (i - 1) * 0.3;
		// Keep every original claim readable for at least 3.5 s before dimming.
		// The phone defect then clears before its repair enters the same line.
		if (L.narrow) hide(tags[i], at, 0.3, 0);
		tl.to(
			one(`claim-${i}-text`),
			{ opacity: claim.status === "removed" ? 0.18 : 0.4, duration: 0.3 },
			at,
		);
	});
	fixes.forEach((fix, i) => {
		// Fade in place: enlarged verdict and phone repairs share crowded card lanes.
		tl.fromTo(
			fix,
			{ opacity: 0 },
			{ opacity: 1, duration: 0.5 },
			27.8 + i * 0.3,
		);
	});
	const positionsClaimIndex = claims.findIndex(
		(claim) => claim.id === "positions",
	);
	const positionsFixOrder = claims
		.slice(0, positionsClaimIndex)
		.filter((claim) => claim.repair || claim.status === "removed").length;
	tl.fromTo(
		positionsEvidence,
		{ opacity: 0 },
		{ opacity: 1, duration: 0.5 },
		27.8 + positionsFixOrder * 0.3,
	);

	// Keep the repairs as one stable group; only the scope background steps back.
	tl.set(one("claim-0-box"), { attr: { class: "wt-panel-shape" } }, 27.8);

	// The forecast, cut: the repair that removes a claim outright.
	const cut = claims.findIndex((claim) => claim.status === "removed");
	const verdict = one<SVGTextElement>(`fix-${cut}`);
	const cardBox = one<SVGRectElement>(`claim-${cut}-box`).getBBox();
	// Fit the kit's largest lock scale inside the card. Eleven pixels cover the 8 px
	// clearance plus both strokes; measure the actual EN/ZH font bounds.
	const pad = 10;
	let verdictBox = verdict.getBBox();
	for (let attempt = 0; attempt < 8; attempt++) {
		const width = verdictBox.width + pad * 2;
		const height = verdictBox.height + pad * 2;
		const scale = Math.min(1.4, 1 + 48 / Math.max(width, height));
		const fit = Math.min(
			(cardBox.width - 22) / (width * scale),
			(cardBox.height - 22) / (height * scale),
		);
		if (fit >= 1) break;
		verdict.style.fontSize = `${Number.parseFloat(verdict.style.fontSize) * Math.min(0.98, fit)}px`;
		verdictBox = verdict.getBBox();
	}
	verdict.setAttribute(
		"y",
		String(
			Number(verdict.getAttribute("y")) +
				cardBox.y +
				cardBox.height / 2 -
				(verdictBox.y + verdictBox.height / 2),
		),
	);
	d.lock(lockCut, 30.2, { around: verdict, pad });
	tl.addLabel("hero-lock", 30.2);
	show(heads[3], 30.2);

	// ——— signoff ———
	tl.addLabel("signoff", 34.2);
	d.swap([heads[2], heads[3]], heads[4], 34.2);
	hide([...claimRows, ...tags, ...fixes, positionsEvidence, lockCut], 34.2);
	secs.forEach((sec, i) => {
		show(sec, 35.0 + i * 0.6, "right");
	});

	// ——— claim ———
	tl.addLabel("claim", 40.6);
	hide([heads[4], ...secs], 40.6);
	word(one("z-big"), 40.9);
	show(one("z-sub"), 41.3);

	// ——— next ———
	tl.addLabel("next", 45.0);
	hide(kids("claim"), 45.0);
	d.close(45.0);
	return tl;
}

export const auditMarketRecapFilm: Film = {
	id: "audit-market-recap",
	label: [
		`Audits, as a short film: a colleague's recap that puts Monday's premium at ${usd(REPORTED)}, whose covered rows restore the ×100 multiplier, with a worked 105-call trade calculation and a covered subtotal of ${dollars(PREMIUM)}; its five claims audited, the scope supported, the units, new positions and missing strike repaired, and the forecast removed; and a signoff listing what is supported, what was repaired, what is still open and what would reopen it`,
		`审核短片：一篇把周一权利金写成 ${usd(REPORTED)} 的同事复盘，用 105 看涨的源成交演算，有数据的行补回 ×100 乘数后，覆盖小计为 ${dollars(PREMIUM)}；它的五个结论逐一审核：范围有依据，单位、新增仓位和缺失的行权价已修复，预测被删除；以及一份签核，列出有依据的内容、已修复的内容、仍未解决的问题和重新审查的条件`,
	],
	stage: "dark",
	shots: [
		{ id: "open", label: ["Audits", "审核"] },
		{ id: "question", label: ["The question", "问题"] },
		{ id: "amount", label: ["The amount", "金额"] },
		{ id: "claims", label: ["Five claims", "五个结论"] },
		{ id: "signoff", label: ["The signoff", "签核"] },
		{ id: "claim", label: ["The claim", "结论"] },
		{ id: "next", label: ["Next", "下一步"] },
	],
	height: (width) => layout(width).height,
	Scene,
	build,
};
