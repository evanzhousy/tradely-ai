import "@tanstack/react-start/server-only";
import {
	choose as c,
	money,
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
	const name = `practice packet ${"ABCD"[variant]}`;
	return {
		name,
		countA,
		countB,
		volume: countA + countB,
		premium: (countA * 1.8 + countB * 2.4) * 100,
		brief: t(
			`Practice packet ${"ABCD"[variant]} covers ALFA calls expiring October 16 in the complete September 3 session, from tape-A; each contract covers 100 shares. R1: the 100 call, ${countA} contracts at $1.80, against a quote of $1.80 / $1.90 from the same moment. R2: the 105 call, ${countB} contracts at $2.40, against $2.30 / $2.40. R3: the 110 call, whose trade data is missing. Nothing links the trades to a participant or a strategy.`,
			`练习研究包 ${"ABCD"[variant]} 覆盖 9 月 3 日完整交易时段中 10 月 16 日到期的 ALFA 看涨，来源 tape-A；每张合约对应 100 股。R1：100 看涨，${countA} 张成交在 $1.80，对照同一时刻的报价 $1.80 / $1.90。R2：105 看涨，${countB} 张成交在 $2.40，对照 $2.30 / $2.40。R3：110 看涨，成交数据缺失。没有任何信息把这些成交与某个参与者或策略联系起来。`,
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
				`Practice packet ${"ABCD"[variant]} · tape-A · 2026-09-03 · October 16 calls · R3 missing`,
				`练习研究包 ${"ABCD"[variant]} · tape-A · 2026-09-03 · 10 月 16 日看涨 · R3 缺失`,
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
			intro: t(
				"Trace Monday's Oct 18 call trades into a premium subtotal, remove a packet field and watch a careful rerun go wrong, and tell a rerun from a method change.",
				"把周一 10月18日 看涨的成交追溯成权利金小计，移除研究包的一个字段看认真的重跑如何出错，并区分重跑与方法变更。",
			),
		},
		sources: [oi, quotes],
		explanation: t(
			"A reproducible research packet is a usable record, not a slogan about rigor. Name the question, instrument set, session cutoff, source identifiers, units, transformation and missingness. Keep fixed method parameters separate from permitted replay inputs. Record the actual row IDs used in a calculation so another reader can reconstruct it. Save each rerun with its own date and evidence; changing the source, universe or method needs an explicit new question or revision, not an overwritten result. Your packet can contain a valid observed subtotal while the full-universe total remains unavailable. One person can maintain the record and ask another to challenge it. The visual lesson assembles a supplied packet and shows how each field supports reproduction.",
			"可重现研究包是可使用的记录，不是严谨口号。应明确问题、工具集合、时段截止、来源标识、单位、计算与缺失。区分固定方法参数与允许变化的回放输入，记录计算用到的实际行 ID，使他人能还原。每次重跑保存独立日期与证据；更换来源、范围或方法需显式新问题/修订，不能覆盖结果。研究包可有有效观测小计，同时完整总量仍不可用。个人可维护记录并请他人质疑。视觉课堂组装给定研究包，展示各字段如何支持重现。",
		),
		example: t(
			"Packet P1 traces ALFA's Oct 18 105 call to its trades: 5 × $2.00 × 100 + 500 × $2.15 × 100 = $108,500. With the 100, 110 and 115 calls it sums to $165,520, but the 120 call has no data at Monday's cutoff, so $165,520 is an observed subtotal of 4 of 5 series. When the 120 call's 30 contracts at $0.10 arrive Tuesday, the same method saves P2 at $165,820 and P1 stays.",
			"研究包 P1 把 ALFA 10月18日 105 看涨追溯到成交：5 × $2.00 × 100 + 500 × $2.15 × 100 = $108,500。加上 100、110、115 看涨合计 $165,520，但 120 看涨在周一截止时没有数据，所以 $165,520 是覆盖 5 个系列中 4 个的观测小计。周二 120 看涨的 30 张 $0.10 到达后，用同一方法保存 P2：$165,820，P1 保持不变。",
		),
		misconception: t(
			"Someone else should be able to rerun your result from the fields you wrote. A line to a source isn't enough if the calculation and units are missing.",
			"别人应该能根据你写下的字段重跑出你的结果。如果缺少计算方法和单位，只画一条连向来源的线是不够的。",
		),
		case: (v) => {
			const p = packetData(v);
			return {
				brief: p.brief,
				worksheet: p.worksheet,
				questions: [
					write(
						"scope",
						"Write the question this packet answers, with its instruments, session and cutoff.",
						"写出这个研究包回答的问题，包括涉及的合约、交易时段和截止时间。",
						'For example: "Among ALFA calls expiring October 16, strikes 100 to 110, where did observed volume or premium concentrate in the complete September 3 session?" Keep it about what happened, not a price forecast.',
						"例如：“在 10 月 16 日到期、行权价 100 至 110 的 ALFA 看涨中，9 月 3 日完整交易时段的已观测成交量或权利金集中在哪里？”问的是发生了什么，而不是价格预测。",
						40,
					),
					write(
						"method",
						"Write the method: which rows you used, the formula, the units, and how you handled R3.",
						"写出方法：用了哪些行、公式、单位，以及你如何处理 R3。",
						`For example: "R1 and R2: price per share × contracts × 100, in dollars, summed to ${money(p.premium, 0)}. R3 is missing and stays out, so this is an observed subtotal, not a full total. Source: ${p.name}."`,
						`例如：“R1 和 R2：每股价格 × 张数 × 100，单位美元，合计 ${money(p.premium, 0)}。R3 缺失，不计入，所以这是已观测小计，而不是完整总量。来源：练习研究包 ${"ABCD"[v]}。”`,
						40,
					),
					n(
						"observed-premium",
						"What is the observed premium subtotal?",
						"已观测的权利金小计是多少？",
						p.premium,
						"dollars",
						"美元",
						`R1: ${p.countA} × $1.80 × 100 = ${money(p.countA * 180, 0)}. R2: ${p.countB} × $2.40 × 100 = ${money(p.countB * 240, 0)}. Together ${money(p.premium, 0)}; with R3 missing, it's a subtotal.`,
						`R1：${p.countA} × $1.80 × 100 = ${money(p.countA * 180, 0)}。R2：${p.countB} × $2.40 × 100 = ${money(p.countB * 240, 0)}。合计 ${money(p.premium, 0)}；R3 缺失，所以这是小计。`,
					),
					write(
						"replay",
						"Name one input a rerun may change, and one change that would need a revised method.",
						"说出一项重跑时可以改变的输入，以及一项需要修订方法的改变。",
						"For example: a rerun may use another session date, saved separately, under the same selection rule. Switching from calls to puts, changing the source or dropping inconvenient rows changes the method and needs its own record.",
						"例如：重跑可以换一个交易日期，按同样的筛选规则单独保存。把看涨换成看跌、更换来源，或去掉不方便的行，都改变了方法，需要单独记录。",
						30,
					),
				],
			};
		},
	},
	{
		id: "market-recap",
		conceptLab: {
			kind: "market-recap",
			intro: t(
				"Put packet P1's chart under the claim it measures, watch a raised axis turn 540 against 505 into 8 to 1, and rewrite an overclaiming headline into one the packet supports, caption attached.",
				"让研究包 P1 的图表对上它所衡量的结论，看提高的坐标轴如何把 540 对 505 画成 8 比 1，并把过度的标题改写成研究包支持的版本，附上图注。",
			),
		},
		sources: [oi, quotes],
		explanation: t(
			"A recap communicates a research packet's supported findings. Start from the supplied rows or your identified saved packet, not a dramatic headline. Every numerical claim needs a traceable calculation, date, unit, population and coverage boundary. Use a chart of one comparable quantity; different metrics need separate axes or panels with honest units. A truncated axis, missing denominator, or an unmarked missing row can distort interpretation even when the arithmetic is correct. A descriptive claim does not become a forecast through stronger wording. The visual walkthrough compares supplied headlines and assembles a supported caption with its source references.",
			"复盘传达研究包支持的发现，应从给定行或已标识的保存研究包出发，而非先写夸张标题。每个数字结论都需可追溯计算、日期、单位、人群和覆盖边界。图表宜使用一种可比量，不同指标需明确单位的独立轴或面板。即使算术正确，截断轴、缺少分母或未标缺失行仍会歪曲解读。加强措辞不会把描述变成预测。视觉讲解比较给定标题，并组装带来源引用的有依据图注。",
		),
		example: t(
			"Packet P1 shows 540 contracts in ALFA's Oct 18 110 call and 505 in the 105 call, but $108,500 of premium in the 105 call against $48,810 in the 110. 'Most contracts: the 110 call' needs a contracts chart; 'most premium: the 105 call' needs a premium chart. Starting the axis at 500 draws the 110 call's bar 8 times the 105's, though it traded 7% more. With the 120 call missing, 'Monday's busiest call' overstates coverage.",
			"研究包 P1 显示 ALFA 10月18日 110 看涨成交 540 张、105 看涨 505 张，但权利金是 105 看涨 $108,500，110 看涨 $48,810。“张数最多：110 看涨”需要张数图，“权利金最多：105 看涨”需要权利金图。把轴的起点设为 500，110 看涨的柱会画成 105 的 8 倍，尽管它只多成交 7%。120 看涨缺失时，“周一最活跃的看涨”夸大了覆盖范围。",
		),
		misconception: t(
			"Put a caveat right next to the claim it limits. A missing row isn't a bar of zero height.",
			"限制说明要紧挨着它所限制的结论。缺失的行不是高度为零的柱子。",
		),
		case: (v) => {
			const p = packetData(v);
			return {
				brief: p.brief,
				worksheet: p.worksheet,
				questions: [
					n(
						"volume",
						"How many contracts were observed in total, for the chart?",
						"图表中一共观测到多少张？",
						p.volume,
						"contracts",
						"张",
						`${p.countA} + ${p.countB} = ${p.volume}. R3 stays out of the sum, but the chart must still show it as missing.`,
						`${p.countA} + ${p.countB} = ${p.volume}。R3 不计入合计，但图表上仍要标明它缺失。`,
					),
					write(
						"headline",
						"Write a headline the packet supports, with the observed quantity and the coverage limit.",
						"写一个研究包能支持的标题，包含已观测的数量和覆盖范围的限制。",
						`For example: "${p.volume} contracts traded in the ALFA October 16 calls with data on September 3; the 110 call is missing." A superlative about all of the calls isn't supported.`,
						`例如：“9 月 3 日，有数据的 ALFA 10 月 16 日看涨共成交 ${p.volume} 张；110 看涨数据缺失。”关于全部看涨的“最”字结论没有依据。`,
						30,
					),
					write(
						"caption",
						"Write a caption for the chart: its axes, units, source, date and what's missing.",
						"为图表写图注：坐标轴、单位、来源、日期，以及缺失了什么。",
						'For example: "Strike on the horizontal axis; contracts traded on the vertical axis, starting at zero. Tape-A, September 3, ALFA calls expiring October 16. R1 and R2 observed; R3, the 110 call, missing."',
						"例如：“横轴为行权价；纵轴为成交张数，从零开始。来源 tape-A，9 月 3 日，10 月 16 日到期的 ALFA 看涨。R1 和 R2 有观测；R3（110 看涨）缺失。”",
						40,
					),
					c(
						"full-total",
						"Is a total for every strike in the question available?",
						"问题涉及的所有行权价的总量能得到吗？",
						[
							[
								"available",
								"Yes: the two bars add up to it",
								"能：两根柱子加起来就是",
							],
							[
								"unknown",
								"No: R3 is missing, so the chart's total covers only what was observed",
								"不能：R3 缺失，所以图上的总量只覆盖已观测的部分",
							],
						],
						"unknown",
						"Say exactly which strikes a total covers. With R3 missing, the bars add up to an observed subtotal.",
						"要说清总量覆盖哪些行权价。R3 缺失时，柱子加起来只是已观测的小计。",
					),
				],
			};
		},
	},
	{
		id: "audit-market-recap",
		conceptLab: {
			kind: "audit-market-recap",
			intro: t(
				"Recompute a colleague's $1,655.20 from packet P1's trades, audit each claim in their recap, and write a signoff that keeps what holds and names what is still open.",
				"根据研究包 P1 的成交重算同事写的 $1,655.20，逐条审计其复盘中的结论，并写一份保留成立部分、列明未解决事项的签核。",
			),
		},
		sources: [oi, quotes],
		explanation: t(
			"Audit someone else's result against its sources and transformations. Check identity, units, time, coverage and inference before polishing prose. Recalculate a number; inspect the actual chart scale; verify that a report's date and expiry set match the claim. Find the first unsupported step and repair the affected conclusion without discarding valid evidence. A useful signoff says what is supported, which defects were repaired, what remains unknown and what would reopen review. A compelling-looking chart or a plausible outcome is not a substitute for source lineage. The walkthrough shows the original defects beside their explained repairs.",
			"按来源与变换审核他人结果。润色前先查身份、单位、时间、覆盖与推断。重新算一个数字，检查真实轴尺度，核实报告日期和到期集合与结论一致。找出首个无依据步骤，修复受影响结论，同时保留有效证据。有效签核说明支持什么、修复什么、仍未知什么，以及何时重新检查。漂亮图表或看似正确结果都不能替代来源链路。讲解将原始缺陷与修复说明并列展示。",
		),
		example: t(
			"A colleague's recap of packet P1 reports $1,655.20 in premium, calls the 110 call's 540 contracts 'new positions', says the 120 call traded 0, and adds a forecast. Recompute with the 100-share multiplier to get $165,520, rewrite the positions claim as contracts traded, mark the 120 call as no data, and cut the forecast. Keep the correct scope, counts and prices; rejecting the whole recap would throw them away without fixing anything.",
			"同事根据研究包 P1 写的复盘报告了 $1,655.20 的权利金，把 110 看涨的 540 张称为“新增仓位”，说 120 看涨成交 0 张，还加了一个预测。用每张 100 股的乘数重算得到 $165,520，把持仓说法改写为成交张数，把 120 看涨标为无数据，并删掉预测。保留正确的范围、张数和价格；整篇否决会丢掉这些信息，却什么也没修好。",
		),
		misconception: t(
			"An audit names the defect, cites the evidence, repairs the claim it affects and keeps the work that holds. Saying 'uncertain' isn't an audit.",
			"审核要指出缺陷、引用证据、修复受影响的结论，并保留成立的部分。只说“不确定”不算审核。",
		),
		case: (v) => {
			const p = packetData(v);
			return {
				brief: t(
					`${p.brief.en}\n\nA colleague's recap says: "Total premium ${money(p.premium / 100)}; all ${p.volume} contracts were new bullish positions. Strike 110 had zero activity." Another sentence in it correctly gives R1's price as $1.80.`,
					`${p.brief.zh}\n\n一位同事的复盘写道：“总权利金 ${money(p.premium / 100)}；全部 ${p.volume} 张都是新开的看涨仓位。110 行权价没有任何成交。”其中另一句正确地写出了 R1 的价格 $1.80。`,
				),
				worksheet: p.worksheet,
				questions: [
					n(
						"correct-premium",
						"What should the observed premium subtotal be?",
						"已观测的权利金小计应该是多少？",
						p.premium,
						"dollars",
						"美元",
						`${p.countA} × $1.80 × 100 + ${p.countB} × $2.40 × 100 = ${money(p.premium, 0)}. The recap's ${money(p.premium / 100)} left out the 100 shares per contract.`,
						`${p.countA} × $1.80 × 100 + ${p.countB} × $2.40 × 100 = ${money(p.premium, 0)}。复盘的 ${money(p.premium / 100)} 漏掉了每张合约的 100 股。`,
					),
					write(
						"audit",
						"Name at least three defects in the recap and the repair for each, citing the source rows.",
						"指出复盘中至少三处缺陷，并为每处给出修复，引用来源行。",
						'For example: 1) R1 and R2: the premium leaves out × 100; restore it. 2) "New bullish positions": nothing links these trades to positions, and R1 printed at its bid, so call them observed trades. 3) R3: missing, not zero; say there\'s no data. Keep the correctly reported R1 price.',
						"例如：1）R1 和 R2：权利金漏了 × 100，补回来。2）“新开的看涨仓位”：没有任何信息把这些成交与持仓联系起来，而且 R1 成交在买价，所以只能称为已观测的成交。3）R3：是缺失，不是零，要写明没有数据。保留正确写出的 R1 价格。",
						60,
					),
					write(
						"signoff",
						"Write a signoff: what holds, what's still unknown, and the next evidence to get.",
						"写一份签核：哪些成立、哪些仍未知，以及下一步要取得的证据。",
						`For example: "Supported: R1 and R2 give ${money(p.premium, 0)} of observed premium. Unknown: the full total, and whether any position opened. Next: get R3's data and any position or strategy link before widening these claims."`,
						`例如：“成立：R1 和 R2 的已观测权利金为 ${money(p.premium, 0)}。未知：完整总量，以及是否有人开仓。下一步：在扩大这些结论之前，先取得 R3 的数据以及任何持仓或策略关联。”`,
						40,
					),
				],
			};
		},
	},
];
