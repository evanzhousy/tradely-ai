import { packetConceptData } from "./packet-concept.server";
import "@tanstack/react-start/server-only";
import {
	choose as c,
	numberQuestion as n,
	oi,
	quotes,
	type TeachingUnit,
	t,
	write,
} from "./authoring.server";

/** All three capstone lessons use the same immutable variant dataset for a traceable handoff. */
export function packetData(variant: number) {
	const countA = [200, 400, 250, 350][variant];
	const countB = [300, 150, 450, 200][variant];
	return {
		countA,
		countB,
		volume: countA + countB,
		premium: (countA * 1.8 + countB * 2.4) * 100,
		brief: t(
			`Source packet P${variant}: ALFA calls, October 16 expiry, September 3 complete session, tape-A, multiplier 100. R1: strike 100, ${countA} contracts at $1.80 with matched $1.80/$1.90 quote. R2: strike 105, ${countB} contracts at $2.40 with matched $2.30/$2.40 quote. R3: strike 110, execution data missing. No participant/strategy linkage.`,
			`来源研究包 P${variant}：ALFA 看涨，10 月 16 日到期，9 月 3 日完整时段，tape-A，乘数 100。R1：行权价 100，${countA} 张、$1.80，匹配报价 $1.80/$1.90。R2：行权价 105，${countB} 张、$2.40，匹配报价 $2.30/$2.40。R3：行权价 110，成交数据缺失。无参与者或策略关联。`,
		),
		worksheet: {
			columns: [
				t("Source row", "来源行"),
				t("Strike", "行权价"),
				t("Contracts", "张数"),
				t("Price/share (USD)", "每股价格（美元）"),
			],
			rows: [
				["R1", "100", String(countA), "1.80"],
				["R2", "105", String(countB), "2.40"],
				["R3", "110", "—", "—"],
			],
			caption: t(
				`Packet P${variant} · tape-A · 2026-09-03 · October 16 calls · R3 missing`,
				`研究包 P${variant} · tape-A · 2026-09-03 · 10 月 16 日看涨 · R3 缺失`,
			),
			chart: {
				labelColumn: 1,
				valueColumn: 2,
				unit: t("Contracts traded", "成交张数"),
			},
		},
	};
}
export const productionUnits: TeachingUnit[] = [
	{
		id: "cookbook-research-packet",
		conceptLab: {
			kind: "cookbook-research-packet",
			data: packetConceptData,
			intro: t(
				"Trace actual source rows into a premium subtotal, inspect the recorded packet fields, and separate permitted reruns from method revisions.",
				"沿实际来源行追溯权利金小计，检查研究包记录字段，并区分允许重跑与方法修订。",
			),
		},
		sources: [oi, quotes],
		explanation: t(
			"A reproducible research packet is a usable record, not a slogan about rigor. Name the question, instrument set, session cutoff, source identifiers, units, transformation and missingness. Keep fixed method parameters separate from permitted replay inputs. Record the actual row IDs used in a calculation so another reader can reconstruct it. Save each rerun with its own date and evidence; changing the source, universe or method needs an explicit new question or revision, not an overwritten result. Your packet can contain a valid observed subtotal while the full-universe total remains unavailable. One person can maintain the record and ask another to challenge it. This exercise saves your actual fields; prose is available for self/reviewer assessment, not automatic mastery certification.",
			"可重现研究包是可使用的记录，不是严谨口号。应明确问题、工具集合、时段截止、来源标识、单位、计算与缺失。区分固定方法参数与允许变化的回放输入，记录计算用到的实际行 ID，使他人能还原。每次重跑保存独立日期与证据；更换来源、范围或方法需显式新问题/修订，不能覆盖结果。研究包可有有效观测小计，同时完整总量仍不可用。个人可维护记录并请他人质疑。本练习保存实际字段，文字供自评/人工审核，不自动认证掌握。",
		),
		example: t(
			"A packet records R1: 10×$2×100 and R2: 20×$3×100, giving $8,000 observed premium. R3 is missing, so $8,000 is a subtotal. The method says sum the two observed rows; it does not claim all eligible activity was observed. A replay may change the session date while retaining the predefined instrument-selection rule and preserving the first record.",
			"研究包记录 R1：10×$2×100，R2：20×$3×100，观测权利金 $8,000。R3 缺失，所以 $8,000 是小计。方法说明累加两条已观测行，不声称所有合格活动都已覆盖。回放可变更日期，同时保留预定工具选择规则与首份记录。",
		),
		misconception: t(
			"Someone should be able to reproduce the result from the fields you wrote. A line drawn to a source is not enough if the transformation and units are absent.",
			"他人应能从你写的字段复现结果。若缺少变换与单位，只画来源连线仍不够。",
		),
		case: (v) => {
			const p = packetData(v);
			return {
				brief: p.brief,
				worksheet: p.worksheet,
				questions: [
					write(
						"scope",
						"Write the bounded question, instrument universe, session and cutoff.",
						"写下有边界的问题、工具范围、时段与截止时间。",
						"Include ALFA calls/October 16/strikes 100–110, September 3 closing session, and observed-volume or premium concentration. Do not replace this with a price forecast.",
						"包含 ALFA 看涨/10 月 16 日/行权价 100–110、9 月 3 日收盘时段及观测量或权利金集中问题，不替换成价格预测。",
						40,
					),
					write(
						"method",
						"Write the source row IDs, formula, units and handling of R3.",
						"写下来源行 ID、公式、单位及 R3 处理。",
						`Use R1 and R2; sum price/share × contracts ×100. R3 stays missing. Observed premium is $${p.premium}; the full total is unavailable. Keep the source packet identifier.`,
						`使用 R1、R2，累加每股价格×张数×100。R3 保持缺失。观测权利金 $${p.premium}，完整总和不可用，并保留来源包标识。`,
						40,
					),
					n(
						"observed-premium",
						"Compute the observed premium subtotal.",
						"计算已观测权利金小计。",
						p.premium,
						"USD",
						"美元",
						`${p.countA}×1.80×100 + ${p.countB}×2.40×100 = ${p.premium}.`,
						`${p.countA}×1.80×100+${p.countB}×2.40×100=${p.premium}。`,
					),
					write(
						"replay",
						"Write one permitted replay parameter and what would require revising the method.",
						"写下一项允许回放变化的参数，以及什么变化需要修订方法。",
						"A separately saved session-date rerun can preserve the selection rule. Switching calls to puts, changing source or excluding inconvenient rows changes the method and requires an explicit record.",
						"单独保存的日期重跑可保留选择规则；改看跌、换来源或排除不方便的行会改变方法，应显式记录。",
						30,
					),
				],
			};
		},
	},
	{
		id: "market-recap",
		sources: [oi, quotes],
		explanation: t(
			"A recap communicates a research packet's supported findings. Start from the supplied rows or your identified saved packet, not a dramatic headline. Every numerical claim needs a traceable calculation, date, unit, population and coverage boundary. Use a chart of one comparable quantity; different metrics need separate axes or panels with honest units. A truncated axis, missing denominator, or an unmarked missing row can distort interpretation even when the arithmetic is correct. A descriptive claim does not become a forecast through stronger wording. Your written headline and caption are saved as an artifact and can be exported with source references. Compare them with the reference after submission; text quality is not automatically graded.",
			"复盘传达研究包支持的发现，应从给定行或已标识的保存研究包出发，而非先写夸张标题。每个数字结论都需可追溯计算、日期、单位、人群和覆盖边界。图表宜使用一种可比量，不同指标需明确单位的独立轴或面板。即使算术正确，截断轴、缺少分母或未标缺失行仍会歪曲解读。加强措辞不会把描述变成预测。你的标题与图注将保存为可导出的产物，提交后可对照参考，文字质量不自动评分。",
		),
		example: t(
			"A chart shows 10 and 20 contracts at two strikes and a visibly missing third strike. A supported headline is '30 contracts observed across the two covered strikes; the third is missing.' 'All volume concentrated here' overstates coverage. Showing a GEX model chart instead would not substantiate a session-volume claim.",
			"图表显示两个行权价成交 10 和 20 张，第三个明确缺失。有依据的标题可为“两条已覆盖行权价观测 30 张，第三条缺失”。“全部成交集中于此”夸大覆盖。换成 GEX 模型图也不能支持时段成交量结论。",
		),
		misconception: t(
			"A caveat belongs beside the claim it limits. A missing row is not a zero-height observed bar.",
			"限制说明应紧邻所限制的结论，缺失行不是观测为零的柱。",
		),
		case: (v) => {
			const p = packetData(v);
			return {
				brief: p.brief,
				worksheet: p.worksheet,
				questions: [
					n(
						"volume",
						"Total observed contracts for the chart?",
						"图表中的总观测张数？",
						p.volume,
						"contracts",
						"张",
						"R1 count + R2 count; exclude R3 from the observed sum but disclose it.",
						"R1 数量+R2 数量，R3 不计入观测和但必须披露。",
					),
					write(
						"headline",
						"Write your own supported headline, using the observed quantity and coverage limit.",
						"使用观测量与覆盖限制，写自己的有依据标题。",
						`${p.volume} contracts observed in covered ALFA October 16 calls on September 3; strike 110 is missing. A complete-universe superlative is unsupported.`,
						`9 月 3 日，已覆盖 ALFA 10 月 16 日看涨观测 ${p.volume} 张，行权价 110 缺失，无法支持完整范围最高等结论。`,
						30,
					),
					write(
						"caption",
						"Write a chart caption identifying axes, units, source, date and missingness.",
						"写图注，标明坐标、单位、来源、日期与缺失。",
						"Strike on the category axis, observed contract count from zero on the value axis; tape-A, September 3, October 16 ALFA calls; R1/R2 observed and R3 missing.",
						"类别轴为行权价、数值轴从零起为观测张数；tape-A、9 月 3 日、ALFA 10 月 16 日看涨；R1/R2 有观测，R3 缺失。",
						40,
					),
					c(
						"full-total",
						"Is a full-universe volume total available?",
						"完整范围的成交量总和可用吗？",
						[
							[
								"available",
								"Yes, the two visible bars sum to it.",
								"可用，两根可见柱之和就是。",
							],
							[
								"unknown",
								"No, R3 is missing; the plotted total is observed coverage only.",
								"不可用，R3 缺失，图中总量仅覆盖已观测部分。",
							],
						],
						"unknown",
						"State the exact population the total covers.",
						"明确总量覆盖的实际人群。",
					),
				],
			};
		},
	},
	{
		id: "audit-market-recap",
		sources: [oi, quotes],
		explanation: t(
			"Audit someone else's result against its sources and transformations. Check identity, units, time, coverage and inference before polishing prose. Recalculate a number; inspect the actual chart scale; verify that a report's date and expiry set match the claim. Find the first unsupported step and repair the affected conclusion without discarding valid evidence. A useful signoff says what is supported, which defects were repaired, what remains unknown and what would reopen review. A compelling-looking chart or a plausible outcome is not a substitute for source lineage. Your audit notes are saved for self or human review; the numerical checks are graded separately from the quality of your prose.",
			"按来源与变换审核他人结果。润色前先查身份、单位、时间、覆盖与推断。重新算一个数字，检查真实轴尺度，核实报告日期和到期集合与结论一致。找出首个无依据步骤，修复受影响结论，同时保留有效证据。有效签核说明支持什么、修复什么、仍未知什么，以及何时重新检查。漂亮图表或看似正确结果都不能替代来源链路。审核文字保存供自评或人工审核，数值检查与文字质量分别处理。",
		),
		example: t(
			"A report omits the 100 multiplier, calls observed volume 'new positions,' and presents a missing strike as zero. Repair the dollars, replace the position claim with observed executions, and mark missing coverage. Retain a correctly dated R1 execution fact. Rejecting the entire packet would lose valid information without fixing the actual errors.",
			"报告遗漏 100 乘数，把观测量称为“新增持仓”，并把缺失行权价当零。应修正金额，把持仓结论降为观测成交，标明缺失覆盖；保留正确带日期的 R1 事实。否定整个研究包既丢失有效信息，也未修复具体错误。",
		),
		misconception: t(
			"An audit must identify the defect, cite evidence, repair the affected claim and preserve supported work. Merely saying 'uncertain' is not enough.",
			"审核需指出缺陷、引用证据、修复相关结论并保留有效部分，仅说“不确定”不够。",
		),
		case: (v) => {
			const p = packetData(v);
			return {
				brief: t(
					`${p.brief.en}\n\nFlawed recap: 'Total premium $${p.premium / 100}; all ${p.volume} contracts were new bullish positions. Strike 110 had zero activity.' A separate sentence correctly reports R1 at $1.80.`,
					` ${p.brief.zh}\n\n有缺陷复盘：“总权利金 $${p.premium / 100}，全部 ${p.volume} 张均为新增看涨持仓，110 行权价零成交。”另一句正确记录 R1 价格为 $1.80。`,
				),
				worksheet: p.worksheet,
				questions: [
					n(
						"correct-premium",
						"Correct observed premium subtotal?",
						"正确观测权利金小计？",
						p.premium,
						"USD",
						"美元",
						"The flawed amount omitted the stated 100 multiplier.",
						"错误金额漏了给定的 100 乘数。",
					),
					write(
						"audit",
						"Cite at least three defects and write the corresponding repairs using source IDs.",
						"引用来源 ID，指出至少三项缺陷并给出对应修复。",
						"R1/R2: restore multiplier 100. No position linkage: replace new bullish positions with observed executions; R1's matched bid-side location also prevents labeling all flow bullish. R3: missing, not zero. Retain the correctly reported R1 execution price.",
						"R1/R2：补回乘数 100。无持仓关联，改“新增看涨持仓”为观测成交；R1 的匹配买价成交也不支持全部看涨。R3 是缺失，不是零。保留正确 R1 成交价。",
						60,
					),
					write(
						"signoff",
						"Write a bounded signoff with a retained fact and a next evidence check.",
						"写有边界签核，包含保留的事实与下一项证据检查。",
						`Supported: R1/R2 imply $${p.premium} observed premium. Full-universe total and opening intent remain unknown. Obtain R3 and position/strategy linkage before expanding those claims.`,
						`支持：R1/R2 观测权利金 $${p.premium}。完整范围总量与开仓意图仍未知。扩大结论前应取得 R3 及持仓/策略关联。`,
						40,
					),
				],
			};
		},
	},
];
