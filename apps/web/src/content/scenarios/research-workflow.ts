import "@tanstack/react-start/server-only";
import type {
	LearningScenario,
	ScenarioStep,
} from "@/domain/learning/scenario";
import type { UniverseComparison } from "@/domain/learning/universe";
import { copy, fact, question as q, step } from "./authoring.server";

const noForecast = () =>
	q(
		"claim-boundary",
		"What does a candidate earn?",
		"候选对象获得什么资格？",
		[
			["inspect", "Further evidence inspection.", "进一步检查证据。"],
			["buy", "An automatic buy decision.", "自动买入决策。"],
			["intent", "A known participant intention.", "已知参与者意图。"],
		],
		"inspect",
		"Descriptive observations prioritize an investigation. They do not establish intent or a future price path.",
		"描述性观测用于安排调查优先级，不能确定意图或未来价格。",
	);

function universe(
	independent: boolean,
	alternate: boolean,
	ranking = false,
): UniverseComparison {
	return {
		id: `universe-${independent}-${alternate}-${ranking}`,
		note: copy(
			"Synthetic selected-session volumes. Toggle admission and compare peer changes. The first symbol's volume stays fixed. The source records below determine the assessed answer, regardless of the current display filters.",
			"模拟的选定时段成交量。切换纳入范围并比较同组变化。第一个标的成交量固定。评估以以下来源记录为准，不受当前显示筛选影响。",
		),
		rows: [
			{
				symbol: independent ? "KAPPA" : "ALFA",
				volume: 1000,
				peerVolume: 1000,
				fresh: true,
				eligible: true,
			},
			{
				symbol: independent ? "LAMBDA" : "BETA",
				volume: ranking && independent && alternate ? 500 : 1600,
				peerVolume: ranking && independent && alternate ? 1600 : 500,
				fresh: ranking || !alternate,
				eligible: true,
			},
			{
				symbol: independent ? "OMEGA" : "GAMMA",
				volume: ranking ? (independent && alternate ? 600 : 1300) : 5000,
				peerVolume: ranking && independent && alternate ? 1300 : 600,
				fresh: ranking || alternate,
				eligible: true,
			},
			{
				symbol: "ZETA",
				volume: ranking ? 800 : null,
				peerVolume: ranking ? 800 : null,
				fresh: true,
				eligible: true,
			},
			{
				symbol: "OUTSIDE",
				volume: 9000,
				peerVolume: 9000,
				fresh: true,
				eligible: false,
			},
		],
	};
}

function boundarySteps(alternate: boolean): ScenarioStep[] {
	const build = [
		q(
			"question",
			"Choose the research question.",
			"选择研究问题。",
			[
				[
					"bounded",
					"Where did call volume concentrate in the admitted universe on September 3?",
					"9 月 3 日，已纳入范围内的看涨成交集中在哪里？",
				],
				[
					"winner",
					"Which stock must rally tomorrow?",
					"哪只股票明天一定上涨？",
				],
				[
					"moving",
					"Whichever question fits the top-ranked result.",
					"任何符合最高排名结果的问题。",
				],
			],
			"bounded",
			"A named universe, session, and observable quantity make this question inspectable.",
			"明确范围、时段和可观测量，使问题可检查。",
		),
		q(
			"invalidation",
			"Choose an invalidation rule for this session comparison.",
			"为该时段比较选择失效规则。",
			[
				[
					"quality",
					"Required source is stale or coverage differs.",
					"必需来源过时或覆盖范围不同。",
				],
				["loss", "Tomorrow's price falls.", "明天价格下跌。"],
				[
					"none",
					"Keep the conclusion regardless of evidence.",
					"不论证据如何都保留结论。",
				],
			],
			"quality",
			"Invalidate a comparison when its required evidence fails. A later price does not repair the method.",
			"必需证据不成立时，比较失效。后来的价格不能修复方法。",
		),
	];
	return [
		step({
			id: "boundary-first",
			kind: "prediction",
			title: copy("Build a research contract", "建立研究规则"),
			brief: copy(
				"Select the question and invalidation rule before inspecting a candidate.",
				"检查候选前，先选择问题与失效规则。",
			),
			questions: build,
		}),
		step({
			id: "boundary-guided",
			kind: "guided",
			title: copy("Inspect a changed request", "检查变化后的请求"),
			brief: copy(
				"The original packet admits September 3 calls. A reviewer proposes September 4 puts after seeing a dramatic row.",
				"原始研究包纳入 9 月 3 日看涨期权。审阅者看到突出数据后，建议改为 9 月 4 日看跌期权。",
			),
			questions: [
				q(
					"scope-change",
					"How should this request be recorded?",
					"应如何记录该请求？",
					[
						[
							"new",
							"A new versioned question; preserve the original.",
							"新版本问题，保留原始问题。",
						],
						[
							"replace",
							"Silently replace the original question.",
							"直接替换原始问题。",
						],
						["same", "The original comparison is unchanged.", "原比较未改变。"],
					],
					"new",
					"Changing the session and instrument scope changes the research contract.",
					"改变时段与工具范围，会改变研究规则。",
				),
			],
		}),
		step({
			id: "boundary-independent",
			kind: "independent",
			title: copy("Handle a new handoff", "处理新的交接"),
			brief: alternate
				? copy(
						"A new execution arrives inside the same September 3 call universe, with the same required source and freshness.",
						"同一 9 月 3 日看涨范围内出现新成交，必需来源与时效相同。",
					)
				: copy(
						"A reviewer replaces the September 3 call universe with a September 4 put universe.",
						"审阅者将 9 月 3 日看涨范围改为 9 月 4 日看跌范围。",
					),
			questions: [
				q(
					"handoff",
					"Is this a new research boundary?",
					"这是新的研究范围吗？",
					[
						[
							"new",
							"Yes; declare a new question and preserve the earlier record.",
							"是，应声明新问题并保留旧记录。",
						],
						[
							"same",
							"No; new evidence can test the existing fixed question.",
							"否，新证据可检验原有固定问题。",
						],
						[
							"erase",
							"Erase the earlier record either way.",
							"无论如何都删除旧记录。",
						],
					],
					alternate ? "same" : "new",
					"New evidence within a fixed boundary differs from changing that boundary. Preserve history in either case.",
					"固定范围内的新证据，不等于改变范围。两种情况都应保留历史。",
				),
				noForecast(),
			],
		}),
	];
}

function discoverySteps(alternate: boolean, ranking: boolean): ScenarioStep[] {
	const lessonQuestion = (independent: boolean) =>
		ranking
			? q(
					"relative-rank",
					"Exclude OUTSIDE, compare the original peers with changed peers: what happened to the first symbol?",
					"排除 OUTSIDE，比较原同组与变化后的同组：第一个标的发生了什么？",
					[
						[
							"relative",
							"It moved from third to first while its own volume stayed at 1,000.",
							"它从第三升至第一，自身成交量仍为 1,000。",
						],
						[
							"fall",
							"It moved from first to third while its own volume stayed at 1,000.",
							"它从第一降至第三，自身成交量仍为 1,000。",
						],
						[
							"signal",
							"Its future return is now established.",
							"其未来收益已确定。",
						],
					],
					independent && alternate ? "fall" : "relative",
					"Peer observations changed. Relative rank can change without any change in the focal observation.",
					"同组观测发生变化。目标观测未改变，相对排名仍可能变化。",
				)
			: q(
					"eligible-leader",
					"Under fresh, complete, in-scope rules, which original-volume row earns inspection?",
					"按新鲜、完整、范围内的规则，哪一行原始成交量值得检查？",
					[
						[
							"beta",
							independent ? "LAMBDA · 1,600" : "BETA · 1,600",
							independent ? "LAMBDA · 1,600" : "BETA · 1,600",
						],
						[
							"gamma",
							independent ? "OMEGA · 5,000" : "GAMMA · 5,000",
							independent ? "OMEGA · 5,000" : "GAMMA · 5,000",
						],
						["outside", "OUTSIDE · 9,000", "OUTSIDE · 9,000"],
					],
					independent && alternate ? "gamma" : "beta",
					"Check the quality column first. Stale, missing, and outside-scope observations cannot win an eligible comparison.",
					"先检查质量列。过时、缺失或范围外观测不能成为有效比较的领先者。",
				);
	return [
		step({
			id: "discovery-first",
			kind: "prediction",
			title: copy(
				ranking ? "Rank is relative" : "Declare who can compete",
				ranking ? "排名是相对的" : "声明比较资格",
			),
			brief: copy(
				"Before opening the comparison, decide what rank can establish.",
				"打开比较前，先决定排名能证明什么。",
			),
			questions: [noForecast()],
		}),
		step({
			id: "discovery-guided",
			kind: "guided",
			title: copy("Test the comparison", "检验比较"),
			brief: copy(
				"Read each quality label, exclude OUTSIDE, and experiment with the admitted symbols. Restore the original peers before answering the eligibility question.",
				"阅读质量标签，排除 OUTSIDE，并尝试调整纳入标的。回答资格问题前，恢复原始同组值。",
			),
			universe: universe(false, false, ranking),
			questions: [lessonQuestion(false)],
		}),
		step({
			id: "discovery-independent",
			kind: "independent",
			title: copy("Inspect a new universe", "检查新的范围"),
			brief: copy(
				"Apply the declared quality rules to this new symbol set. Display controls help inspection; they do not rewrite eligibility.",
				"将声明的质量规则应用于新的标的集合。显示控件帮助检查，不会重写资格。",
			),
			universe: universe(true, alternate, ranking),
			questions: [
				lessonQuestion(true),
				q(
					"missing-data",
					"How should a missing required observation be treated?",
					"如何处理缺失的必需观测？",
					[
						[
							"exclude",
							"Mark it unknown and exclude it from that metric comparison.",
							"标记未知，并排除出该指标比较。",
						],
						["zero", "Replace it with zero.", "替换为零。"],
						[
							"guess",
							"Borrow a value from another session.",
							"借用另一个时段的数值。",
						],
					],
					"exclude",
					"Missingness is a coverage limit, not an observed zero. A different session answers a different comparison.",
					"缺失是覆盖限制，不是观测到零。不同的时段对应不同的比较。",
				),
			],
		}),
	];
}

function drawerSteps(alternate: boolean): ScenarioStep[] {
	const audit = (independent: boolean) =>
		step({
			id: independent ? "drawer-independent" : "drawer-guided",
			kind: independent ? "independent" : "guided",
			title: copy("Audit the source clocks", "审核来源时间"),
			brief: copy(
				"The contract requires September 3 session flow and an explicitly dated OI report. Open the source record before deciding whether to proceed.",
				"研究规则要求 9 月 3 日时段成交及明确标注日期的 OI 报告。先打开来源记录，再决定是否继续。",
			),
			evidence: [
				{
					id: "source-record",
					title: copy("Drawer source record", "抽屉来源记录"),
					facts: [
						fact("Symbol", "标的", independent ? "BETA" : "ALFA"),
						fact(
							"Flow date",
							"成交日期",
							independent && alternate ? "2026-09-03" : "2026-09-02",
						),
						fact("Reported OI date", "OI 报告日期", "2026-09-02"),
						fact(
							"Coverage",
							"覆盖",
							"All declared fields present; model positioning remains unknown.",
							"声明的字段均存在；模型持仓仍未知。",
						),
					],
					note: copy(
						"The displayed flow field must match the requested session. The OI report has its own disclosed clearing date.",
						"展示的成交字段必须匹配请求时段。OI 报告有独立披露的清算日期。",
					),
				},
			],
			requiredEvidence: ["source-record"],
			questions: [
				q(
					"freshness-gate",
					"Does this drawer pass the stated intake rules?",
					"该抽屉通过给定的输入规则吗？",
					[
						[
							"stop",
							"Stop: session flow is from the wrong date.",
							"停止：时段成交日期错误。",
						],
						[
							"proceed",
							"Proceed with bounded inspection; retain the separate OI date.",
							"继续有限范围检查，保留 OI 的独立日期。",
						],
						[
							"merge",
							"Treat OI and flow as a single live ledger.",
							"将 OI 和成交当作单一实时账本。",
						],
					],
					independent && alternate ? "proceed" : "stop",
					"Match each source to its own requirement. A disclosed prior OI report is not automatically a stale session-flow field, and neither proves live positions.",
					"逐项匹配各来源的要求。披露的前期 OI 报告不等于过时的时段成交字段，且二者都不能证明实时仓位。",
				),
				noForecast(),
			],
		});
	return [
		step({
			id: "drawer-first",
			kind: "prediction",
			title: copy("Check before interpreting", "先检查，再解读"),
			brief: copy(
				"An attractive chart is visible, but its source dates have not been inspected.",
				"图表看起来有吸引力，但尚未检查来源日期。",
			),
			questions: [
				q(
					"first-check",
					"What should you inspect first?",
					"首先检查什么？",
					[
						[
							"source",
							"Identity, source dates, and required coverage.",
							"对象身份、来源日期和必需覆盖。",
						],
						["color", "Whether the chart looks bullish.", "图表是否看涨。"],
						["price", "Tomorrow's closing price.", "明天的收盘价。"],
					],
					"source",
					"Meaning depends on which instrument, clock, and source the chart represents.",
					"含义取决于图表代表的工具、时间和来源。",
				),
			],
		}),
		audit(false),
		audit(true),
	];
}

function packetSteps(lessonId: string, alternate: boolean): ScenarioStep[] {
	const builder = lessonId === "cookbook-research-packet";
	const editor = lessonId === "market-recap";
	const record = (independent: boolean) => [
		fact("Packet", "研究包", independent ? "BETA-REVIEW-v2" : "ALFA-REVIEW-v1"),
		fact(
			"Fixed contract",
			"固定规则",
			"September 3 calls · strikes 95–105 · 14–30 days · source tape-A",
			"9 月 3 日看涨 · 行权价 95–105 · 14–30 天 · 来源 tape-A",
		),
		fact(
			"Observed result",
			"已观察结果",
			"1,600 contracts at strike 100; 2 rows missing. No participant linkage.",
			"行权价 100 成交 1,600 张；2 行缺失，无参与者关联。",
		),
		fact(
			"Chart A",
			"图表 A",
			independent && alternate
				? "Prior-close modeled GEX · 2026-09-02 · different expiry scope"
				: "Session volume by strike · contracts · 2026-09-03 · tape-A; missing rows shown",
			independent && alternate
				? "前收盘模型 GEX · 2026-09-02 · 到期范围不同"
				: "按行权价展示时段成交量 · 张 · 2026-09-03 · tape-A；显示缺失行",
		),
		fact(
			"Chart B",
			"图表 B",
			independent && alternate
				? "Session volume by strike · contracts · 2026-09-03 · tape-A; missing rows shown"
				: "Prior-close modeled GEX · 2026-09-02 · different expiry scope",
			independent && alternate
				? "按行权价展示时段成交量 · 张 · 2026-09-03 · tape-A；显示缺失行"
				: "前收盘模型 GEX · 2026-09-02 · 到期范围不同",
		),
		fact(
			"Proposed revision",
			"建议修订",
			independent && alternate
				? "Rerun September 4 with fixed universe, source, and method; retain the September 3 packet."
				: "Replace the earlier date and expand to 60-day puts without a new version.",
			independent && alternate
				? "保持范围、来源和方法，重跑 9 月 4 日，保留 9 月 3 日研究包。"
				: "替换旧日期并扩大为 60 天看跌期权，不创建新版本。",
		),
	];
	const decisions = (independent: boolean) =>
		builder
			? [
					q(
						"fixed-inputs",
						"Build the fixed-input block.",
						"建立固定输入模块。",
						[
							[
								"fixed",
								"Universe, contract scope, source lens, method, and invalidation rule.",
								"标的范围、合约范围、来源视角、方法和失效规则。",
							],
							[
								"winner",
								"Whichever filters produce the largest result.",
								"能产生最大结果的任意筛选。",
							],
							["price", "Tomorrow's winning trades.", "明天获利的交易。"],
						],
						"fixed",
						"Fix the method before replay. Preserve source identities and exclusions alongside the question.",
						"回放前固定方法，在问题旁保留来源身份和排除项。",
					),
					q(
						"replay-input",
						"Build the replay block.",
						"建立回放模块。",
						[
							[
								"date",
								"Vary session date explicitly; save each run with its own evidence.",
								"明确改变时段日期，保存每次运行及其证据。",
							],
							[
								"scope",
								"Silently widen the scope on each run.",
								"每次运行时悄悄扩大范围。",
							],
							[
								"erase",
								"Overwrite the old packet with the new answer.",
								"用新答案覆盖旧研究包。",
							],
						],
						"date",
						"A replay parameter is declared in advance. A new run retains its date, inputs, and lineage.",
						"回放参数需预先声明。新运行应保留日期、输入和来源。",
					),
					q(
						"packet-revision",
						"Accept the proposed revision?",
						"接受建议修订吗？",
						[
							[
								"accept",
								"Yes: it uses the declared replay parameter and retains history.",
								"是，它使用声明的回放参数并保留历史。",
							],
							[
								"revise",
								"No: create a new version for changed scope and retain the original.",
								"否，范围变化需创建新版本并保留原件。",
							],
							[
								"hide",
								"Accept and hide all earlier exclusions.",
								"接受并隐藏之前的排除项。",
							],
						],
						independent && alternate ? "accept" : "revise",
						"A declared date replay and a scope change are different operations. Neither permits erasing history.",
						"声明的日期回放与范围变化是不同操作，均不能抹去历史。",
					),
				]
			: [
					q(
						"claim-chart",
						editor
							? "Attach the chart that supports the session-volume claim."
							: "Which chart supports the stated session-volume headline?",
						editor
							? "附上支持时段成交量结论的图表。"
							: "哪张图支持给定时段成交量标题？",
						[
							[
								"a",
								"Chart A, using its stated source and quantity.",
								"图表 A，使用其声明的来源和测量量。",
							],
							[
								"b",
								"Chart B, using its stated source and quantity.",
								"图表 B，使用其声明的来源和测量量。",
							],
							[
								"either",
								"Either chart; dates and lenses do not matter.",
								"任意图表，日期和视角无关。",
							],
						],
						independent && alternate ? "b" : "a",
						"The source and measured quantity must support the actual claim. Modeled GEX cannot substitute for session volume.",
						"来源和测量量必须支持实际结论，模型 GEX 不能替代时段成交量。",
					),
					q(
						"headline",
						editor
							? "Choose a headline and caveat."
							: "Repair the claim: 'Dealers accumulated calls and price will rise.'",
						editor
							? "选择标题和限制说明。"
							: "修复结论：做市商积累看涨期权，价格将上涨。",
						[
							[
								"bounded",
								"1,600 contracts traded at strike 100; two rows are missing and intent is unknown.",
								"行权价 100 成交 1,600 张；两行缺失，意图未知。",
							],
							[
								"forecast",
								"The volume proves a rally is coming.",
								"成交量证明即将上涨。",
							],
							[
								"clean",
								"Remove the missing rows and publish an unqualified conclusion.",
								"删除缺失行，发布无条件结论。",
							],
						],
						"bounded",
						"Keep the claim descriptive and place coverage limits beside it. Participant linkage is absent.",
						"结论应保持描述性，并在旁注明覆盖限制。缺少参与者关联证据。",
					),
					...(editor
						? []
						: [
								q(
									"revision-audit",
									"Does the proposed revision preserve the declared method?",
									"建议修订保留了声明的方法吗？",
									[
										[
											"pass",
											"Yes, with a separately dated run and retained original.",
											"是，单独记录日期并保留原始研究包。",
										],
										[
											"fail",
											"No; scope changed and the original record would be overwritten.",
											"否，范围改变且原记录将被覆盖。",
										],
										[
											"polish",
											"Approve once the chart is polished.",
											"图表美化后即可批准。",
										],
									],
									independent && alternate ? "pass" : "fail",
									"Audit transformations and version lineage before signing off. Visual polish cannot resolve a changed research contract.",
									"签字前审核变换与版本来源。视觉美化不能解决研究规则变化。",
								),
							]),
				];
	return [
		step({
			id: "packet-first",
			kind: "prediction",
			title: copy(
				builder
					? "Assemble a reproducible packet"
					: editor
						? "Choose evidence for a recap"
						: "Audit an unsupported recap",
				builder
					? "组装可重现研究包"
					: editor
						? "为复盘选择证据"
						: "审核缺乏支持的复盘",
			),
			brief: copy(
				"This exercise uses a supplied packet, so you can practice without completing another lesson first.",
				"本练习提供完整研究包，无需先完成其他课程。",
			),
			questions: [
				q(
					"starting-point",
					"Where should the work begin?",
					"工作应从哪里开始？",
					[
						[
							"packet",
							"The bounded question and its inspectable source packet.",
							"有范围的问题及其可检查来源研究包。",
						],
						["headline", "The most dramatic headline.", "最有冲击力的标题。"],
						["outcome", "Later price movement.", "后来的价格变化。"],
					],
					"packet",
					"A reviewable output starts with a source record and a fixed question.",
					"可审核的输出始于来源记录与固定问题。",
				),
			],
		}),
		...[false, true].map((independent) =>
			step({
				id: independent ? "packet-independent" : "packet-guided",
				kind: independent ? "independent" : "guided",
				title: copy(
					independent
						? "Build the independent handoff"
						: "Inspect, assemble, and revise",
					independent ? "建立独立交接" : "检查、组装和修订",
				),
				brief: copy(
					builder
						? "Choose the blocks for a rerunnable packet. Your selected fields become the handoff to review."
						: "Open the packet and match each decision to its evidence. Keep caveats beside the claim.",
					builder
						? "为可重跑研究包选择模块。选择的字段将成为待审核交接内容。"
						: "打开研究包，将每项决策匹配到证据。把限制说明放在结论旁。",
				),
				evidence: [
					{
						id: "packet-record",
						title: copy("Open the complete packet", "打开完整研究包"),
						facts: record(independent),
						note: copy(
							"Synthetic teaching packet. The supplied sources establish observations; model values and unknowns retain their own boundaries.",
							"模拟教学研究包。给定来源建立观测，模型值和未知信息各有边界。",
						),
					},
				],
				requiredEvidence: ["packet-record"],
				questions: decisions(independent),
			}),
		),
	];
}

const lessons = [
	"audited-boundary",
	"symbol-universe",
	"rank-symbols",
	"symbol-drawer",
	"cookbook-research-packet",
	"market-recap",
	"audit-market-recap",
];
export const researchWorkflowScenarios: LearningScenario[] = lessons.flatMap(
	(lessonId) =>
		[false, true].map((alternate) => ({
			id: lessonId + (alternate ? "-case-b" : "-case-a"),
			lessonId,
			version: 1,
			steps:
				lessonId === "audited-boundary"
					? boundarySteps(alternate)
					: lessonId === "symbol-universe" || lessonId === "rank-symbols"
						? discoverySteps(alternate, lessonId === "rank-symbols")
						: lessonId === "symbol-drawer"
							? drawerSteps(alternate)
							: packetSteps(lessonId, alternate),
		})),
);
