import * as m from "motion/react-m";
import {
	type Copy,
	count,
	mondayPacket,
	type PacketRow,
	packetContracts,
	packetPremium,
	pick,
	rowContracts,
	rowPremium,
	usd,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import { Label, Stage, useStage, useTeachMotion } from "../walkthrough/stage";
import { textWidth, wrapText } from "../walkthrough/text-measure";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);
const dollars = (cents: number) => usd(cents, 0);

const PREMIUM = packetPremium(mondayPacket);
/** The report dropped the 100 shares per contract, so every amount is a hundredth. */
const REPORTED = PREMIUM / 100;
const CONTRACTS = packetContracts(mondayPacket);
const rowById = (id: string) => mondayPacket.find((row) => row.id === id);

// ——— Scene 1: recalculate the number ———

type AmountState = { repaired: "none" | "row" | "all"; row: string | null };
type AmountExplore = { row: string };

type WorkLine = {
	text: string;
	lead?: string;
	tone?: "accent" | "small" | "loss";
};

const TABLE_TOP = 48;
const TABLE_ROW = 30;
const TABLE_BOTTOM = TABLE_TOP + mondayPacket.length * TABLE_ROW;
const WORK_TOP = TABLE_BOTTOM + 38;
const WORK_LINE = 18;
const WORK_LINES = 6;
const amountHeight = WORK_TOP + 20 + WORK_LINES * WORK_LINE;

function rowLines(row: PacketRow, locale: Locale): WorkLine[] {
	const t = tr(locale);
	const head: WorkLine = {
		text: t([
			`${row.id} · ${row.strike} call`,
			`${row.id} · ${row.strike} 看涨`,
		]),
		tone: "accent",
	};
	if (row.trades === null)
		return [
			head,
			{ text: t(["no data at the cutoff", "截止时没有数据"]) },
			{
				text: t(["the report left it blank", "报告也留空了"]),
				tone: "small",
			},
		];
	if (row.trades.length === 0)
		return [
			head,
			{ text: t(["no trades: $0 either way", "无成交：怎么算都是 $0"]) },
		];
	const premium = rowPremium(row) ?? 0;
	return [
		head,
		...row.trades.map((trade) => ({
			lead: trade.time,
			text: `${trade.quantity} × ${usd(trade.price)} × 100 = ${dollars(
				trade.price * trade.quantity * 100,
			)}`,
		})),
		{
			text: t([
				`= ${dollars(premium)} · report ${usd(premium / 100)}`,
				`= ${dollars(premium)} · 报告 ${usd(premium / 100)}`,
			]),
			tone: "accent",
		},
	];
}

function amountLines(state: AmountState, locale: Locale): WorkLine[] {
	const t = tr(locale);
	const focus = state.row ? rowById(state.row) : undefined;
	if (state.repaired === "row" && focus) return rowLines(focus, locale);
	if (state.repaired === "all")
		return [
			{ text: t(["R1–R4, each × 100", "R1–R4，各乘 100"]), tone: "accent" },
			{
				text: `= ${mondayPacket
					.filter((row) => row.trades !== null)
					.map((row) => dollars(rowPremium(row) ?? 0))
					.join(" + ")}`,
			},
			{
				text: t([
					`= ${dollars(PREMIUM)} · report ${usd(REPORTED)}`,
					`= ${dollars(PREMIUM)} · 报告 ${usd(REPORTED)}`,
				]),
				tone: "accent",
			},
			{
				text: t([
					"counts and prices match: keep them",
					"张数和价格与成交记录一致：保留",
				]),
				tone: "small",
			},
		];
	return [
		{ text: t(["the report's working", "报告的算法"]), tone: "small" },
		{
			text: t(["price × contracts, summed", "价格 × 张数，求和"]),
			tone: "loss",
		},
		{ text: `= ${usd(REPORTED)}` },
	];
}

function AuditTable({
	width,
	state,
	locale,
}: {
	width: number;
	state: AmountState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const { hatch } = useStage();
	const narrow = width < 520;
	// On a phone the report column moves left so "$1,085.00" and "$108,500" keep a gap.
	const contractsX = narrow ? 100 : width - 280;
	const reportX = narrow ? 186 : width - 150;
	const fixedX = width - 12;
	const lines = amountLines(state, locale);
	const repairedRow = (row: PacketRow) =>
		state.repaired === "all" ||
		(state.repaired === "row" && row.id === state.row);
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t([
					"Report vs packet P1 · premium by strike",
					"报告对照研究包 P1 · 各行权价权利金",
				])}
			</Label>
			<Label x={12} y={40} tone="small">
				{t(["strike", "行权价"])}
			</Label>
			<Label x={contractsX} y={40} anchor="end" tone="small">
				{t([narrow ? "count" : "contracts", "张数"])}
			</Label>
			<Label x={reportX} y={40} anchor="end" tone="small">
				{t(["report", "报告"])}
			</Label>
			<Label x={fixedX} y={40} anchor="end" tone="small">
				{t(["recomputed", "重算"])}
			</Label>
			{mondayPacket.map((row, i) => {
				const y = TABLE_TOP + i * TABLE_ROW;
				const focus = row.id === state.row;
				const premium = rowPremium(row);
				const contracts = rowContracts(row);
				return (
					<g key={row.id}>
						<rect
							x={4}
							y={y}
							width={width - 8}
							height={TABLE_ROW - 4}
							rx={7}
							className={focus ? "wt-focus-shape" : "wt-panel-shape"}
						/>
						<Label x={12} y={y + 18} tone={focus ? "accent" : "muted"}>
							{row.strike}
						</Label>
						{contracts === null ? (
							<Label x={contractsX} y={y + 18} anchor="end" tone="small">
								—
							</Label>
						) : (
							<Label x={contractsX} y={y + 18} anchor="end">
								{count(contracts)}
							</Label>
						)}
						<Label
							x={reportX}
							y={y + 18}
							anchor="end"
							tone={premium === null ? "small" : "loss"}
						>
							{premium === null ? "—" : usd(premium / 100)}
						</Label>
						{premium === null ? (
							<g>
								<rect
									x={fixedX - 44}
									y={y + 3}
									width={44}
									height={20}
									rx={5}
									className="wt-panel-shape"
									style={{ fill: hatch }}
								/>
								<Label
									x={fixedX - 22}
									y={y + 17}
									anchor="middle"
									tone="accent"
									className="wt-halo"
								>
									?
								</Label>
							</g>
						) : repairedRow(row) ? (
							<m.text
								x={fixedX}
								y={y + 18}
								textAnchor="end"
								className="wt-gain"
								initial={motion.enabled ? { opacity: 0 } : false}
								animate={{ opacity: 1 }}
								transition={motion.after(0.05 * i)}
							>
								{dollars(premium)}
							</m.text>
						) : (
							<Label x={fixedX} y={y + 18} anchor="end" tone="small">
								—
							</Label>
						)}
					</g>
				);
			})}
			<path d={`M12 ${TABLE_BOTTOM + 2}H${width - 12}`} className="wt-axis" />
			<Label x={12} y={TABLE_BOTTOM + 24} tone="muted">
				{t(["total", "合计"])}
			</Label>
			<Label x={reportX} y={TABLE_BOTTOM + 24} anchor="end" tone="loss">
				{usd(REPORTED)}
			</Label>
			<Label
				x={fixedX}
				y={TABLE_BOTTOM + 25}
				anchor="end"
				tone={narrow ? undefined : "strong"}
			>
				{state.repaired === "all" ? dollars(PREMIUM) : "—"}
			</Label>
			<rect
				x={4}
				y={WORK_TOP}
				width={width - 8}
				height={amountHeight - WORK_TOP - 4}
				rx={10}
				className="wt-panel-shape"
			/>
			<m.g
				key={`${state.repaired}-${state.row}`}
				initial={motion.enabled ? { opacity: 0 } : false}
				animate={{ opacity: 1 }}
				transition={motion.fade}
			>
				{lines.map((line, i) => (
					<g key={line.text}>
						{line.lead ? (
							<Label x={16} y={WORK_TOP + 22 + i * WORK_LINE} tone="small">
								{line.lead}
							</Label>
						) : null}
						<Label
							x={line.lead ? 64 : 16}
							y={WORK_TOP + 22 + i * WORK_LINE}
							tone={line.tone}
						>
							{line.text}
						</Label>
					</g>
				))}
			</m.g>
		</g>
	);
}

function AmountView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: AmountState;
	explore: AmountExplore | null;
	setExplore: (next: AmountExplore) => void;
}) {
	const t = tr(locale);
	const shown: AmountState =
		phase === "explore" && explore
			? { repaired: "row", row: explore.row }
			: state;
	const focus = shown.row ? rowById(shown.row) : undefined;
	const result: ResultItem[] = [
		{
			id: "report",
			label: t(["Report says", "报告写的是"]),
			value: usd(REPORTED),
			note: t(["price × contracts", "价格 × 张数"]),
			tone: "loss",
		},
	];
	if (shown.repaired === "row" && focus) {
		const premium = rowPremium(focus);
		result.push({
			id: "row",
			label: t([
				`${focus.strike} call, recomputed`,
				`${focus.strike} 看涨，重算`,
			]),
			value: premium === null ? "?" : dollars(premium),
			note:
				premium === null
					? t(["no data at the cutoff", "截止时没有数据"])
					: t([`report: ${usd(premium / 100)}`, `报告：${usd(premium / 100)}`]),
			evidence: premium === null ? "unknown" : "calculated",
		});
	}
	if (shown.repaired === "all")
		result.push(
			{
				id: "fixed",
				label: t(["Recomputed", "重算结果"]),
				value: dollars(PREMIUM),
				note: t(["× 100 shares per contract", "× 每张 100 股"]),
				tone: "gain",
				evidence: "calculated",
			},
			{
				id: "kept",
				label: t(["Kept from the report", "保留报告中的"]),
				value: t([`${count(CONTRACTS)} contracts`, `${count(CONTRACTS)} 张`]),
				note: t(["and every price", "以及每个价格"]),
				evidence: "observed",
			},
		);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"A report's premium by strike beside the amounts recomputed from packet P1, with the working for one row",
						"报告中各行权价的权利金与根据研究包 P1 重算的金额并列，并展示一行的计算过程",
					])}
					height={amountHeight}
				>
					{(width) => (
						<AuditTable width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Recompute strike", "重算行权价"])}
						value={explore.row}
						options={mondayPacket.map(
							(row) => [row.id, String(row.strike)] as const,
						)}
						onChange={(row) => setExplore({ row })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Recalculate from the sources rather than judging the prose. Here the report's contracts and prices are right and only the transformation is wrong: it left out the 100 shares per contract. Repair the step, keep the correct inputs, and leave the 120 call missing rather than filling it in.",
						"从来源重新计算，而不是评判文字。这里报告的张数和价格都对，只有变换错了：它漏掉了每张合约的 100 股。修复这一步，保留正确的输入，并让 120 看涨保持缺失，而不是把它补上。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: audit every claim ———

type Status = "supported" | "repaired" | "removed";
type ClaimsState = { stage: 0 | 1 | 2 };

const claims: readonly {
	id: string;
	text: Copy;
	status: Status;
	defect?: Copy;
	repair?: Copy;
}[] = [
	{
		id: "scope",
		text: [
			"ALFA Oct 18 calls, strikes 100–120, Mon Sep 16",
			"ALFA 10月18日 看涨，行权价 100–120，9月16日周一",
		],
		status: "supported",
	},
	{
		id: "premium",
		text: [`${usd(REPORTED)} in premium`, `权利金 ${usd(REPORTED)}`],
		status: "repaired",
		defect: ["units", "单位"],
		repair: [
			`${dollars(PREMIUM)} in premium, 4 of 5 strikes`,
			`权利金 ${dollars(PREMIUM)}，5 个行权价中的 4 个`,
		],
	},
	{
		id: "positions",
		text: ["540 new positions in the 110 call", "110 看涨新增 540 个仓位"],
		status: "repaired",
		defect: ["volume ≠ positions", "成交 ≠ 持仓"],
		repair: ["540 contracts traded in the 110 call", "110 看涨成交 540 张"],
	},
	{
		id: "missing",
		text: ["The 120 call traded 0", "120 看涨成交 0 张"],
		status: "repaired",
		defect: ["missing as zero", "缺失当作零"],
		repair: ["The 120 call: no data at the cutoff", "120 看涨：截止时没有数据"],
	},
	{
		id: "forecast",
		text: [
			"Traders expect ALFA above $110 by Oct 18",
			"交易者预期 ALFA 在 10月18日 前高于 $110",
		],
		status: "removed",
		defect: ["no evidence", "没有证据"],
	},
];

const CLAIM_PAD = 10;

/** Room for the widest tag a claim shows at any stage, beside its text on wide stages. */
const tagRoom = (claim: (typeof claims)[number], locale: Locale) =>
	Math.max(
		...[0, 1, 2].map((stage) =>
			textWidth(
				pick(tagFor(claim.status, stage, claim.defect).text, locale),
				13,
			),
		),
	) + 12;

function claimRows(width: number, locale: Locale, stage: number) {
	const narrow = width < 520;
	let y = 30;
	return claims.map((claim) => {
		const textWidthMax = width - 40 - (narrow ? 0 : tagRoom(claim, locale));
		const original = wrapText(pick(claim.text, locale), textWidthMax, 13);
		const repaired =
			stage >= 2 && claim.repair
				? wrapText(pick(claim.repair, locale), textWidthMax, 13)
				: [];
		const tagLine = narrow ? 1 : 0;
		const lines = original.length + repaired.length + tagLine;
		const height = lines * 17 + CLAIM_PAD * 2 - 2;
		const row = { claim, original, repaired, y, height };
		y += height + 6;
		return row;
	});
}

const claimsHeight = (width: number, locale: Locale) => {
	const rows = claimRows(width, locale, 2);
	const last = rows[rows.length - 1];
	return last.y + last.height + 4;
};

function tagFor(
	status: Status,
	stage: number,
	defect: Copy | undefined,
): {
	text: Copy;
	tone: "muted" | "gain" | "loss" | "accent";
} {
	if (stage === 0) return { text: ["unchecked", "未检查"], tone: "muted" };
	if (status === "supported")
		return { text: ["supported", "有依据"], tone: "gain" };
	if (stage === 1) return { text: defect ?? ["defect", "缺陷"], tone: "loss" };
	return status === "removed"
		? { text: ["removed", "已删除"], tone: "loss" }
		: { text: ["repaired", "已修复"], tone: "accent" };
}

function ClaimAudit({
	width,
	state,
	locale,
}: {
	width: number;
	state: ClaimsState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const narrow = width < 520;
	const rows = claimRows(width, locale, state.stage);
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t(["A colleague's recap of packet P1", "同事根据研究包 P1 写的复盘"])}
			</Label>
			{rows.map((row) => {
				const tag = tagFor(row.claim.status, state.stage, row.claim.defect);
				const struck = state.stage >= 2 && row.claim.status !== "supported";
				const textTop = row.y + CLAIM_PAD + 13;
				return (
					<m.g
						key={row.claim.id}
						initial={false}
						animate={{ opacity: 1 }}
						transition={motion.fade}
					>
						<rect
							x={4}
							y={row.y}
							width={width - 8}
							height={row.height}
							rx={9}
							className={
								state.stage === 1 && row.claim.status !== "supported"
									? "wt-focus-shape"
									: "wt-panel-shape"
							}
						/>
						{row.original.map((line, i) => (
							<g key={line}>
								<Label
									x={16}
									y={textTop + i * 17}
									tone={struck ? "small" : undefined}
								>
									{line}
								</Label>
								{struck ? (
									<path
										d={`M16 ${textTop + i * 17 - 4}h${textWidth(line, 11)}`}
										className="wt-axis"
									/>
								) : null}
							</g>
						))}
						{row.repaired.map((line, i) => (
							<m.text
								key={line}
								x={16}
								y={textTop + (row.original.length + i) * 17}
								className="wt-gain"
								initial={motion.enabled ? { opacity: 0 } : false}
								animate={{ opacity: 1 }}
								transition={motion.fade}
							>
								{line}
							</m.text>
						))}
						<Label
							x={narrow ? 16 : width - 16}
							y={
								narrow
									? textTop + (row.original.length + row.repaired.length) * 17
									: textTop
							}
							anchor={narrow ? "start" : "end"}
							tone={tag.tone}
						>
							{t(tag.text)}
						</Label>
					</m.g>
				);
			})}
		</g>
	);
}

function ClaimsView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ClaimsState;
	explore: ClaimsState | null;
	setExplore: (next: ClaimsState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const tally = (status: Status) =>
		claims.filter((claim) => claim.status === status).length;
	const result: ResultItem[] =
		shown.stage === 0
			? [
					{
						id: "claims",
						label: t(["Claims in the recap", "复盘中的结论"]),
						value: String(claims.length),
						note: t([
							"the premium figure is one of them",
							"权利金数字只是其中之一",
						]),
					},
				]
			: [
					{
						id: "supported",
						label: t(["Supported", "有依据"]),
						value: String(tally("supported")),
						note: t(["kept as written", "按原文保留"]),
						tone: "gain",
					},
					{
						id: "defects",
						label:
							shown.stage >= 2
								? t(["Repaired", "已修复"])
								: t(["Defects", "缺陷"]),
						value: String(
							tally("repaired") + (shown.stage >= 2 ? 0 : tally("removed")),
						),
						note:
							shown.stage >= 2
								? t(["rewritten to what P1 shows", "改写为 P1 显示的内容"])
								: t([
										"units, positions, missing, forecast",
										"单位、持仓、缺失、预测",
									]),
						tone: shown.stage >= 2 ? undefined : "loss",
					},
				];
	if (shown.stage >= 2)
		result.push({
			id: "removed",
			label: t(["Removed", "已删除"]),
			value: String(tally("removed")),
			note: t(["the forecast has no evidence here", "这里没有支持预测的证据"]),
			tone: "loss",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Each claim in a colleague's recap with its audit status: supported, repaired or removed",
						"同事复盘中的每条结论及其审计状态：有依据、已修复或已删除",
					])}
					height={(width) => claimsHeight(width, locale)}
				>
					{(width) => (
						<ClaimAudit width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Show", "显示"])}
						value={String(explore.stage) as "0" | "1" | "2"}
						options={[
							["0", t(["Recap", "复盘"])],
							["1", t(["Audit", "审计"])],
							["2", t(["Repairs", "修复"])],
						]}
						onChange={(value) =>
							setExplore({ stage: Number(value) as ClaimsState["stage"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Check identity, units, time, coverage and inference claim by claim. Volume counts trades, not new positions: that needs Tuesday's open-interest report. A missing row isn't a zero. A forecast needs evidence the packet doesn't have. Repair each defect where it sits and keep the claims that hold, rather than approving or rejecting the whole report.",
						"逐条检查身份、单位、时间、覆盖和推断。成交量统计的是成交，不是新增持仓：那需要周二的未平仓报告。缺失的行不是零。预测需要研究包里没有的证据。在原处修复每个缺陷，保留成立的结论，而不是整份通过或整份否决。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: a bounded signoff ———

type SignoffState = { shown: 1 | 2 | 3 | 4 };

const sections: readonly {
	id: string;
	label: Copy;
	tone: "gain" | "accent" | "loss" | "muted";
	text: Copy;
}[] = [
	{
		id: "supported",
		label: ["Supported", "有依据"],
		tone: "gain",
		text: [
			`ALFA Oct 18 calls, Mon Sep 16: ${dollars(PREMIUM)} in premium and ${count(CONTRACTS)} contracts over 4 of 5 strikes (packet P1)`,
			`ALFA 10月18日 看涨，9月16日周一：权利金 ${dollars(PREMIUM)}，成交 ${count(CONTRACTS)} 张，覆盖 5 个行权价中的 4 个（研究包 P1）`,
		],
	},
	{
		id: "repaired",
		label: ["Repaired", "已修复"],
		tone: "accent",
		text: [
			"× 100 restored; new positions → contracts traded; the 120 call's 0 → no data; forecast removed",
			"补回 × 100；新增仓位 → 成交张数；120 看涨的 0 → 无数据；删除预测",
		],
	},
	{
		id: "open",
		label: ["Open", "未解决"],
		tone: "loss",
		text: [
			"The 120 call's Monday trades, delivered Tue 09:00; the 110 call's open-interest change, in Tuesday's report",
			"120 看涨的周一成交（周二 09:00 送达）；110 看涨的未平仓变化（见周二的报告）",
		],
	},
	{
		id: "reopen",
		label: ["Reopen if", "重新审查的条件"],
		tone: "muted",
		text: [
			"Monday's tape is corrected, or the 120 call's data changes a claim",
			"周一的成交记录被更正，或 120 看涨的数据改变了某个结论",
		],
	},
];

function signoffLayout(width: number, locale: Locale) {
	let y = 30;
	return sections.map((section) => {
		const lines = wrapText(pick(section.text, locale), width - 40, 12);
		const height = 30 + lines.length * 16 + 6;
		const block = { section, lines, y, height };
		y += height + 6;
		return block;
	});
}
const signoffHeight = (width: number, locale: Locale) => {
	const blocks = signoffLayout(width, locale);
	const last = blocks[blocks.length - 1];
	return last.y + last.height + 4;
};

function SignoffCard({
	width,
	state,
	locale,
}: {
	width: number;
	state: SignoffState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const { hatch } = useStage();
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{t([
					"Audit signoff · recap of packet P1",
					"审计签核 · 研究包 P1 的复盘",
				])}
			</Label>
			{signoffLayout(width, locale).map((block, i) => {
				const visible = i < state.shown;
				return (
					<g key={block.section.id}>
						<rect
							x={4}
							y={block.y}
							width={width - 8}
							height={block.height}
							rx={9}
							className={
								i === state.shown - 1 ? "wt-focus-shape" : "wt-panel-shape"
							}
						/>
						<Label x={16} y={block.y + 20} tone={block.section.tone}>
							{t(block.section.label)}
						</Label>
						{visible ? (
							<m.g
								initial={motion.enabled ? { opacity: 0 } : false}
								animate={{ opacity: 1 }}
								transition={motion.fade}
							>
								{block.lines.map((line, j) => (
									<text
										key={line}
										x={16}
										y={block.y + 40 + j * 16}
										style={{ fontSize: 12 }}
									>
										{line}
									</text>
								))}
							</m.g>
						) : (
							<rect
								x={16}
								y={block.y + 28}
								width={width - 40}
								height={block.lines.length * 16}
								rx={4}
								className="wt-ghost"
								style={{ fill: hatch }}
							/>
						)}
					</g>
				);
			})}
		</g>
	);
}

function SignoffView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: SignoffState;
	explore: SignoffState | null;
	setExplore: (next: SignoffState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const result: ResultItem[] = [
		{
			id: "verdict",
			label: t(["Signoff", "签核"]),
			value:
				shown.shown >= 3
					? t(["pass, with open items", "通过，附未解决事项"])
					: t(["in progress", "进行中"]),
			tone: shown.shown >= 3 ? "gain" : undefined,
		},
	];
	if (shown.shown >= 3)
		result.push({
			id: "open",
			label: t(["Still unknown", "仍然未知"]),
			value: "2",
			note: t(["named, with where they'll come from", "已列明，并写明来源"]),
			evidence: "unknown",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"An audit signoff with four parts: what is supported, what was repaired, what remains open, and what would reopen the review",
						"一份审计签核，包含四部分：有依据的内容、已修复的内容、仍未解决的事项，以及重新审查的条件",
					])}
					height={(width) => signoffHeight(width, locale)}
				>
					{(width) => (
						<SignoffCard width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Sections", "部分"])}
						value={String(explore.shown) as "1" | "2" | "3" | "4"}
						options={[
							["1", "1"],
							["2", "2"],
							["3", "3"],
							["4", "4"],
						]}
						onChange={(value) =>
							setExplore({ shown: Number(value) as SignoffState["shown"] })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A useful signoff says what is supported, which defects were repaired, what is still unknown and what would reopen the review. Repairs don't create missing evidence: the 120 call stays open until its data is reviewed, named with where it will come from.",
						"有用的签核要说明哪些有依据、修复了哪些缺陷、哪些仍然未知，以及什么情况会重新开启审查。修复不会凭空产生缺失的证据：120 看涨在其数据被审查之前一直是未解决事项，并写明数据将从哪里来。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<AmountState, AmountExplore>({
		id: "amount",
		label: ["Recalculate the number", "重算数值"],
		title: ["Repair the step, keep the source facts", "修复变换，保留来源事实"],
		predict: {
			prompt: [
				`A colleague's recap puts Monday's premium at ${usd(REPORTED)}, summing price × contracts for the four strikes with data. Its contracts and prices match the tape. What should the premium be?`,
				`同事的复盘按价格 × 张数，把有数据的四个行权价加总，得出周一的权利金是 ${usd(REPORTED)}。其中的张数和价格都与成交记录一致。权利金应该是多少？`,
			],
			choices: [
				{
					id: "multiplier",
					label: [
						`${dollars(PREMIUM)}: each contract is 100 shares`,
						`${dollars(PREMIUM)}：每张合约是 100 股`,
					],
				},
				{
					id: "trades",
					label: [
						`${usd(REPORTED)}: it matches the tape`,
						`${usd(REPORTED)}：与成交记录一致`,
					],
				},
				{
					id: "prices",
					label: [
						"Unknown until the 120 call arrives",
						"要等 120 看涨的数据到了才知道",
					],
				},
			],
			answer: "multiplier",
			entry: { answer: PREMIUM / 100, tolerance: 1, prefix: "$" },
			explain: [
				`Recomputing the 105 call with × 100 gives $108,500 against the report's $1,085.00. Every row is off by exactly 100 times: ${dollars(PREMIUM)}, not ${usd(REPORTED)}.`,
				`用 × 100 重算 105 看涨得到 $108,500，而报告是 $1,085.00。每一行都正好差 100 倍：应为 ${dollars(PREMIUM)}，而不是 ${usd(REPORTED)}。`,
			],
		},
		beats: [
			{
				id: "report",
				label: ["The report", "报告"],
				caption: [
					`The report's contracts match packet P1, but its premium is ${usd(REPORTED)}. Start from the source rows, not the prose.`,
					`报告的张数与研究包 P1 一致，但权利金是 ${usd(REPORTED)}。从来源行出发，而不是从文字出发。`,
				],
				state: { repaired: "none", row: null },
			},
			{
				id: "row",
				label: ["One row", "一行"],
				caption: [
					"Recompute the 105 call from its trades: $108,500. The report has $1,085.00, a hundredth. The multiplier is missing.",
					"根据成交重算 105 看涨：$108,500。报告写的是 $1,085.00，只有百分之一。乘数漏掉了。",
				],
				state: { repaired: "row", row: "R2" },
			},
			{
				id: "all",
				label: ["Every row", "每一行"],
				caption: [
					`Restore × 100 on every row: ${dollars(PREMIUM)}. Contracts and prices stay as reported, and the 120 call stays missing.`,
					`每一行补回 × 100：${dollars(PREMIUM)}。张数和价格保持报告中的值，120 看涨仍然缺失。`,
				],
				state: { repaired: "all", row: null },
			},
		],
		explore: {
			prompt: [
				"Pick a strike and recompute it from its trades.",
				"选择一个行权价，根据成交重算。",
			],
			start: () => ({ row: "R3" }),
			task: {
				kind: "reach",
				prompt: [
					"Find the strike whose reported premium is off by the most dollars.",
					"找出报告中权利金偏差金额最大的行权价。",
				],
				reached: (e) => e.row === "R2",
				done: [
					"The 105 call: $108,500 recomputed against $1,085.00 reported, $107,415 short. Every row is off by the same factor of 100; the biggest row loses the most dollars.",
					"105 看涨：重算为 $108,500，报告为 $1,085.00，少了 $107,415。每一行都差了同样的 100 倍；金额最大的那一行差得最多。",
				],
			},
		},
		View: AmountView,
	}),
	defineScene<ClaimsState, ClaimsState>({
		id: "claims",
		label: ["Audit every claim", "审计每条结论"],
		title: [
			"One repair doesn't approve the whole report",
			"一处修复不代表整份报告通过",
		],
		predict: {
			prompt: [
				"With the premium figure fixed, does the rest of the recap pass?",
				"权利金数字修好之后，复盘的其余部分能通过吗？",
			],
			choices: [
				{
					id: "check",
					label: [
						"Not yet: check every other claim",
						"还不能：检查其余每条结论",
					],
				},
				{
					id: "pass",
					label: ["Yes: the number was the error", "能：错误就在那个数字"],
				},
				{
					id: "reject",
					label: ["No: throw the recap out", "不能：整篇复盘作废"],
				},
			],
			answer: "check",
			revealAt: 1,
			explain: [
				"Three more claims fail: volume isn't new positions, a missing row isn't zero, and the forecast has no evidence. The scope line holds and stays.",
				"还有三条结论不成立：成交量不是新增持仓，缺失的行不是零，预测没有证据。范围那一条成立，予以保留。",
			],
		},
		beats: [
			{
				id: "recap",
				label: ["The recap", "复盘"],
				caption: [
					"The recap makes five claims. The premium figure is only one of them.",
					"这篇复盘提出了五条结论，权利金数字只是其中之一。",
				],
				state: { stage: 0 },
			},
			{
				id: "audit",
				label: ["Audit", "审计"],
				caption: [
					"Check each against packet P1: the scope holds; units, positions, the missing strike and the forecast don't.",
					"逐条对照研究包 P1：范围成立；单位、持仓、缺失的行权价和预测都不成立。",
				],
				state: { stage: 1 },
			},
			{
				id: "repair",
				label: ["Repair", "修复"],
				caption: [
					"Rewrite each defect to what P1 shows and cut the forecast. The supported claim stays as written.",
					"把每个缺陷改写为 P1 显示的内容，删掉预测。有依据的结论按原文保留。",
				],
				state: { stage: 2 },
			},
		],
		explore: {
			prompt: [
				"Step between the recap, the audit and the repairs.",
				"在复盘、审计和修复之间切换。",
			],
			start: () => ({ stage: 2 }),
			task: {
				kind: "answer",
				prompt: [
					"Which claim passed the audit exactly as written?",
					"哪条结论原样通过了审核？",
				],
				choices: [
					{
						id: "scope",
						label: [
							"The scope line: ALFA Oct 18 calls, strikes 100–120, Mon Sep 16",
							"范围说明：ALFA 10月18日 看涨，行权价 100–120，9月16日 周一",
						],
					},
					{
						id: "positions",
						label: [
							"540 new positions in the 110 call",
							"110 看涨新增 540 个持仓",
						],
					},
					{ id: "zero", label: ["The 120 call traded 0", "120 看涨成交 0 张"] },
				],
				answer: "scope",
				done: [
					"The scope matches packet P1, so it stays. Volume isn't new positions, a missing row isn't zero, and the premium needed its × 100 back: those were repaired, and the forecast cut.",
					"范围与资料包 P1 一致，所以保留。成交量不等于新持仓，缺失的行不等于零，权利金需要补回 × 100：这些都已修复，预测则被删除。",
				],
			},
		},
		View: ClaimsView,
	}),
	defineScene<SignoffState, SignoffState>({
		id: "signoff",
		label: ["Write a bounded signoff", "写有边界的签核"],
		title: [
			"Say what passed and what remains open",
			"说明通过了什么、还有什么未解决",
		],
		predict: {
			prompt: [
				"The 120 call's trades arrived after the packet's cutoff and haven't been reviewed. Where do they go in the signoff?",
				"120 看涨的成交在研究包截止之后才到，尚未审查。它们应放在签核的哪里？",
			],
			choices: [
				{
					id: "open",
					label: ["Open, named with when they arrived", "未解决，写明何时到达"],
				},
				{
					id: "omit",
					label: ["Nowhere: they're not in P1", "哪里都不放：不在 P1 里"],
				},
				{ id: "zero", label: ["Supported, as zero", "有依据，记为零"] },
			],
			answer: "open",
			revealAt: 2,
			explain: [
				"Leaving them out hides a known gap, and zero is a claim nobody checked. List them as open, with where the data comes from.",
				"不写会隐藏一个已知的缺口，记为零则是一个没人核实过的结论。把它们列为未解决事项，并写明数据来源。",
			],
		},
		beats: [
			{
				id: "supported",
				label: ["Supported", "有依据"],
				caption: [
					"Start with what the evidence supports, with its scope and packet.",
					"先写证据支持的内容，连同其范围和研究包。",
				],
				state: { shown: 1 },
			},
			{
				id: "repaired",
				label: ["Repaired", "已修复"],
				caption: [
					"Then each repair, so a reader can see what changed from the original.",
					"然后写每一处修复，让读者看到与原文相比改了什么。",
				],
				state: { shown: 2 },
			},
			{
				id: "open",
				label: ["Open", "未解决"],
				caption: [
					"Then what is still unknown: the 120 call's trades and the 110 call's open-interest change, each with where it will come from.",
					"再写仍然未知的内容：120 看涨的成交和 110 看涨的未平仓变化，并各自写明将从哪里得到。",
				],
				state: { shown: 3 },
			},
			{
				id: "reopen",
				label: ["Reopen if", "重新审查"],
				caption: [
					"Finally, what would reopen the review. The signoff passes the recap without pretending the gaps are closed.",
					"最后写什么情况会重新开启审查。签核让复盘通过，但不假装缺口已经补上。",
				],
				state: { shown: 4 },
			},
		],
		explore: {
			prompt: ["Step through the signoff.", "逐步查看签核。"],
			start: () => ({ shown: 4 }),
			task: {
				kind: "answer",
				prompt: ["What would reopen the review?", "什么情况会重新打开审核？"],
				choices: [
					{
						id: "data",
						label: [
							"A correction to Monday's tape, or the 120 call's data changing a claim",
							"周一成交记录被更正，或 120 看涨的数据改变了某条结论",
						],
					},
					{ id: "reader", label: ["A reader disagreeing", "有读者不同意"] },
					{
						id: "never",
						label: ["Nothing, once it's signed", "签署之后什么都不会"],
					},
				],
				answer: "data",
				done: [
					"A bounded signoff names its open items and what would change the verdict: new or corrected evidence. Disagreement alone doesn't, and a signature doesn't close the gaps.",
					"有边界的签署会列出未决事项，以及什么会改变结论：新的或更正的证据。仅有异议不会，签了名也不代表缺口已经补上。",
				],
			},
		},
		View: SignoffView,
	}),
] as const;

export function AuditMarketRecapWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="audit-market-recap"
			label={["Interactive lesson on auditing a recap", "审计复盘互动课"]}
			scenes={scenes}
		/>
	);
}
