import * as m from "motion/react-m";
import {
	type Copy,
	count,
	listedOn,
	mondayUniverse,
	pick,
	SESSION_DATE,
	type UniverseRow,
} from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { ChoiceField } from "../concept-scene";
import { Label, Stage, useStage, useTeachMotion } from "../walkthrough/stage";
import { defineScene, type Phase, type ResultItem } from "../walkthrough/types";
import { SceneFrame, Walkthrough } from "../walkthrough/walkthrough";

const tr = (locale: Locale) => (value: Copy) => pick(value, locale);

const THRESHOLD = 500;
/** Symbols listed on the teaching Monday: the candidates a Monday comparison starts from. */
const CANDIDATES = mondayUniverse.filter((row) => listedOn(row, SESSION_DATE));

type Check = "type" | "session" | "data" | "threshold";
const CHECKS: readonly Check[] = ["type", "session", "data", "threshold"];

/** "pass", "fail", or "unknown" when the check can't be made. */
function checkResult(
	row: UniverseRow,
	check: Check,
): "pass" | "fail" | "unknown" {
	switch (check) {
		case "type":
			return row.type === "stock" ? "pass" : "fail";
		case "session":
			return row.session === SESSION_DATE ? "pass" : "fail";
		case "data":
			return row.optionVolume === null ? "unknown" : "pass";
		case "threshold":
			return row.optionVolume === null
				? "unknown"
				: row.optionVolume >= THRESHOLD
					? "pass"
					: "fail";
	}
}

/** The first check a row fails, or null if it hasn't failed any of the first `applied`. */
function firstFail(row: UniverseRow, applied: number) {
	for (let i = 0; i < applied; i++)
		if (checkResult(row, CHECKS[i]) === "fail") return i;
	return null;
}

// ——— Scene 1: derive eligibility from the facts ———

type EligibilityState = { applied: number };

const TABLE_TOP = 40;
const TABLE_ROW = 30;

function EligibilityTable({
	width,
	state,
	locale,
}: {
	width: number;
	state: EligibilityState;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const { hatch } = useStage();
	const nameWidth = width < 520 ? 76 : 110;
	const cellWidth = (width - 16 - nameWidth) / CHECKS.length;
	const headers: Record<Check, Copy> = {
		type: ["Stock", "股票"],
		session: ["Mon", "周一"],
		data: ["Data", "数据"],
		threshold: [`≥${THRESHOLD}`, `≥${THRESHOLD}`],
	};
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{/* On a phone the column heads already spell the four checks out. */}
				{width < 520
					? t([
							"Rule: pass all four checks, left to right",
							"规则：从左到右通过四项检查",
						])
					: t([
							"Rule: stock options · Monday · data present · ≥500 contracts",
							"规则：股票期权 · 周一 · 有数据 · ≥500 张",
						])}
			</Label>
			{CHECKS.map((check, j) => (
				<Label
					key={check}
					x={8 + nameWidth + j * cellWidth + cellWidth / 2}
					y={TABLE_TOP - 6}
					anchor="middle"
					tone={j < state.applied ? "accent" : "small"}
				>
					{t(headers[check])}
				</Label>
			))}
			{CANDIDATES.map((row, i) => {
				const y = TABLE_TOP + i * TABLE_ROW;
				const failed = firstFail(row, state.applied);
				const eligible =
					state.applied === CHECKS.length &&
					failed === null &&
					CHECKS.every((check) => checkResult(row, check) === "pass");
				const unknown =
					state.applied >= 3 && failed === null && row.optionVolume === null;
				return (
					<m.g
						key={row.symbol}
						initial={false}
						animate={{ opacity: failed === null ? 1 : 0.35 }}
						transition={motion.fade}
					>
						<rect
							x={8}
							y={y}
							width={width - 16}
							height={TABLE_ROW - 4}
							rx={6}
							className={eligible ? "wt-focus-shape" : "wt-panel-shape"}
							style={unknown ? { fill: hatch } : undefined}
						/>
						<Label
							x={16}
							y={y + 18}
							tone={eligible ? "accent" : undefined}
							className={unknown ? "wt-halo" : undefined}
						>
							{row.symbol}
						</Label>
						{CHECKS.map((check, j) => {
							if (j >= state.applied) return null;
							const result = checkResult(row, check);
							const x = 8 + nameWidth + j * cellWidth + cellWidth / 2;
							return (
								<Label
									key={check}
									x={x}
									y={y + 18}
									anchor="middle"
									tone={
										result === "pass"
											? "gain"
											: result === "fail"
												? "loss"
												: "accent"
									}
									className="wt-halo"
								>
									{result === "pass" ? "✓" : result === "fail" ? "✗" : "?"}
								</Label>
							);
						})}
					</m.g>
				);
			})}
		</g>
	);
}

function EligibilityView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: EligibilityState;
	explore: EligibilityState | null;
	setExplore: (next: EligibilityState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const still = CANDIDATES.filter(
		(row) => firstFail(row, shown.applied) === null,
	);
	const eligible = still.filter((row) => row.optionVolume !== null);
	const unknown = still.filter((row) => row.optionVolume === null);
	const result: ResultItem[] = [
		{
			id: "still",
			label:
				shown.applied === CHECKS.length
					? t(["Eligible", "合格"])
					: t(["Still in", "仍在其中"]),
			value:
				shown.applied === CHECKS.length
					? eligible.map((row) => row.symbol).join(" · ")
					: String(still.length),
			note: t([
				`of ${CANDIDATES.length} listed symbols`,
				`共 ${CANDIDATES.length} 个上市标的`,
			]),
		},
	];
	if (shown.applied >= 3 && unknown.length)
		result.push({
			id: "unknown",
			label: t(["Can't decide", "无法判定"]),
			value: unknown.map((row) => row.symbol).join(" · "),
			note: t(["no volume in the feed", "数据源中没有成交量"]),
			evidence: "unknown",
		});
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Candidate symbols checked against each rule in turn",
						"逐条规则检查候选标的",
					])}
					height={TABLE_TOP + CANDIDATES.length * TABLE_ROW + 4}
				>
					{(width) => (
						<EligibilityTable width={width} state={shown} locale={locale} />
					)}
				</Stage>
			}
			result={result}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Rules applied", "已应用的规则"])}
						value={String(explore.applied) as "0" | "1" | "2" | "3" | "4"}
						options={[
							["0", t(["None", "无"])],
							["1", t(["Type", "类型"])],
							["2", t(["+ Session", "+ 时段"])],
							["3", t(["+ Data", "+ 数据"])],
							["4", t(["+ Size", "+ 数量"])],
						]}
						onChange={(value) => setExplore({ applied: Number(value) })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Derive membership from source facts, one declared rule at a time, before looking at any ranking. Sector, market cap and earnings dates are different attributes and aren't interchangeable filters: an index has no sector, and that doesn't make it unknown. Changing the rule after seeing who wins changes the question.",
						"在看任何排名之前，先依据来源事实、按声明的规则逐条确定成员资格。行业、市值和财报日期是不同的属性，不能互换使用：指数没有行业分类，但这并不代表它未知。看到谁领先之后再改规则，就改变了问题。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 2: observed is not the whole universe ———

type ObservedState = { withGap: boolean; arrived: boolean };

const FJOR_LATE = 7_300;
const BAR_ROW = 40;

function VolumeBars({
	width,
	rows,
	max,
	title,
	locale,
}: {
	width: number;
	rows: readonly {
		id: string;
		label: string;
		value: number | null;
		note?: string;
		focus?: boolean;
		hidden?: boolean;
	}[];
	max: number;
	title: string;
	locale: Locale;
}) {
	const t = tr(locale);
	const motion = useTeachMotion();
	const { hatch } = useStage();
	const nameWidth = width < 520 ? 64 : 90;
	const left = 8 + nameWidth;
	const span = width - left - 70;
	return (
		<g>
			<Label x={8} y={16} tone="muted">
				{title}
			</Label>
			{rows.map((row, i) => {
				const y = 28 + i * BAR_ROW;
				return (
					<m.g
						key={row.id}
						initial={false}
						animate={{ opacity: row.hidden ? 0 : 1 }}
						transition={motion.fade}
					>
						<Label x={8} y={y + 19} tone={row.focus ? "accent" : undefined}>
							{row.label}
						</Label>
						{row.value === null ? (
							<g>
								<rect
									x={left}
									y={y + 6}
									width={span}
									height={18}
									rx={3}
									className="wt-panel-shape"
									style={{ fill: hatch }}
								/>
								<Label
									x={left + span / 2}
									y={y + 19}
									anchor="middle"
									tone="accent"
									className="wt-halo"
								>
									{t(["not observed", "未观测到"])}
								</Label>
							</g>
						) : (
							<g>
								<m.rect
									x={left}
									y={y + 6}
									height={18}
									rx={3}
									className={row.focus ? "wt-chip" : "wt-long-soft"}
									initial={false}
									animate={{ width: (row.value / max) * span }}
									transition={motion.move}
								/>
								<m.text
									y={y + 20}
									initial={false}
									animate={{ x: left + (row.value / max) * span + 6 }}
									transition={motion.move}
								>
									{count(row.value)}
								</m.text>
							</g>
						)}
					</m.g>
				);
			})}
		</g>
	);
}

function ObservedView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: ObservedState;
	explore: ObservedState | null;
	setExplore: (next: ObservedState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const eligible = CANDIDATES.filter(
		(row) =>
			row.type === "stock" &&
			row.session === SESSION_DATE &&
			(row.optionVolume === null || row.optionVolume >= THRESHOLD),
	);
	const volume = (row: UniverseRow) =>
		row.symbol === "FJOR" && shown.arrived ? FJOR_LATE : row.optionVolume;
	const ordered = [...eligible].sort(
		(a, b) => (volume(b) ?? -1) - (volume(a) ?? -1),
	);
	const leader = ordered.find((row) => volume(row) !== null);
	const rows = ordered.map((row) => ({
		id: row.symbol,
		label: row.symbol,
		value: volume(row),
		focus: row === leader,
		hidden: row.optionVolume === null && !shown.withGap && !shown.arrived,
	}));
	const gap = eligible.some((row) => volume(row) === null);
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Monday option volume for the eligible stocks, with any unobserved one shown as a gap",
						"合格股票的周一期权成交量，未观测到的以缺口显示",
					])}
					height={28 + eligible.length * BAR_ROW + 4}
				>
					{(width) => (
						<VolumeBars
							width={width}
							rows={rows}
							max={FJOR_LATE}
							title={t([
								"Eligible stocks · Monday option volume",
								"合格股票 · 周一期权成交量",
							])}
							locale={locale}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "observed",
					label: t(["Observed leader", "观测到的领先者"]),
					value: leader
						? `${leader.symbol} · ${count(volume(leader) ?? 0)}`
						: "—",
					evidence: "calculated",
				},
				...(shown.withGap || shown.arrived
					? [
							{
								id: "universe",
								label: t(["Leader of all eligible", "全部合格标的的领先者"]),
								value: gap
									? t(["unknown", "未知"])
									: leader
										? leader.symbol
										: "—",
								note: gap
									? t(["FJOR's volume is missing", "FJOR 的成交量缺失"])
									: t([
											"every eligible stock observed",
											"所有合格股票都已观测",
										]),
								evidence: gap ? ("unknown" as const) : ("calculated" as const),
							},
						]
					: []),
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["FJOR's volume", "FJOR 的成交量"])}
						value={explore.arrived ? "arrived" : "missing"}
						options={[
							["missing", t(["Missing", "缺失"])],
							["arrived", t(["Arrives: 7,300", "到达：7,300"])],
						]}
						onChange={(value) =>
							setExplore({ withGap: true, arrived: value === "arrived" })
						}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"Keep the intended population apart from the part you actually observed. A measured ranking may have to leave out a candidate with missing data, but that doesn't make the observed leader the largest in the full population. Say which group the claim covers.",
						"把目标人群与实际观测到的部分分开。有数据缺失的候选可能不得不排除在测量排名之外，但这并不能让观测到的领先者成为全部人群中最大的。要说明结论覆盖的是哪一组。",
					])}
				</p>
			}
		/>
	);
}

// ——— Scene 3: membership has a date ———

type MembershipState = { pointInTime: boolean };

const SEP_2 = "2030-09-02";
/** Option volume on Monday Sep 2 for the stocks listed then. */
const sep2Volume: Record<string, number> = {
	HALO: 6_800,
	CRUX: 4_900,
	ALFA: 1_800,
	DUNE: 700,
};

function MembershipView({
	locale,
	phase,
	state,
	explore,
	setExplore,
}: {
	locale: Locale;
	phase: Phase;
	state: MembershipState;
	explore: MembershipState | null;
	setExplore: (next: MembershipState) => void;
}) {
	const t = tr(locale);
	const shown = phase === "explore" && explore ? explore : state;
	const members = Object.keys(sep2Volume).filter((symbol) => {
		const row = mondayUniverse.find((item) => item.symbol === symbol);
		if (!row) return false;
		return listedOn(row, shown.pointInTime ? SEP_2 : SESSION_DATE);
	});
	const ordered = Object.keys(sep2Volume).sort(
		(a, b) => sep2Volume[b] - sep2Volume[a],
	);
	const leader = ordered.find((symbol) => members.includes(symbol));
	const rows = ordered.map((symbol) => ({
		id: symbol,
		label: symbol,
		value: sep2Volume[symbol],
		focus: symbol === leader,
		hidden: !members.includes(symbol),
	}));
	return (
		<SceneFrame
			stage={
				<Stage
					label={t([
						"Option volume on Sep 2, with the list of names taken from today or from Sep 2",
						"9月2日 的期权成交量，名单分别取自今天或 9月2日",
					])}
					height={28 + ordered.length * BAR_ROW + 4}
				>
					{(width) => (
						<VolumeBars
							width={width}
							rows={rows}
							max={sep2Volume.HALO}
							title={
								shown.pointInTime
									? t([
											"Sep 2 volume · names listed on Sep 2",
											"9月2日 成交量 · 9月2日 在册名单",
										])
									: t([
											"Sep 2 volume · today's list of names",
											"9月2日 成交量 · 今天的名单",
										])
							}
							locale={locale}
						/>
					)}
				</Stage>
			}
			result={[
				{
					id: "members",
					label: t(["Names compared", "比较的名单"]),
					value: members.join(" · "),
				},
				{
					id: "leader",
					label: t(["Sep 2 leader", "9月2日 领先者"]),
					value: leader ?? "—",
					note: shown.pointInTime
						? t(["HALO left the market on Sep 6", "HALO 于 9月6日 退市"])
						: t(["HALO silently missing", "HALO 被悄悄遗漏"]),
					tone: shown.pointInTime ? undefined : "loss",
				},
			]}
			controls={
				explore ? (
					<ChoiceField
						label={t(["Take the list of names from", "名单取自"])}
						value={explore.pointInTime ? "then" : "today"}
						options={[
							["today", t(["Today", "今天"])],
							["then", t(["Sep 2", "9月2日"])],
						]}
						onChange={(value) => setExplore({ pointInTime: value === "then" })}
					/>
				) : null
			}
			details={
				<p>
					{t([
						"A historical comparison has to use the membership that existed at that date. Today's list leaves out names that were delisted, merged or dropped since, usually the ones with the most dramatic stories. That's survivorship bias, and it quietly changes the answer.",
						"历史比较必须使用当时存在的成员名单。今天的名单会漏掉后来退市、合并或被剔除的名字，而这些往往是故事最戏剧化的。这就是幸存者偏差，它会悄悄改变答案。",
					])}
				</p>
			}
		/>
	);
}

// ——— Lesson ———

const scenes = [
	defineScene<EligibilityState, EligibilityState>({
		id: "eligibility",
		label: ["Derive eligibility", "判定资格"],
		title: [
			"Who belongs comes from the facts, not a badge",
			"谁属于这个组，由事实决定，而不是标签",
		],
		predict: {
			prompt: [
				"FJOR is a stock with a Monday session, but its option volume never arrived. Is FJOR in the comparison?",
				"FJOR 是股票，也有周一的交易时段，但它的期权成交量没有到达。FJOR 在比较范围内吗？",
			],
			choices: [
				{
					id: "unknown",
					label: [
						"Undecided: it can't be ranked, and it limits claims",
						"无法判定：不能排名，也限制结论",
					],
				},
				{ id: "zero", label: ["Out: treat it as zero", "排除：当作零"] },
				{
					id: "average",
					label: ["In: assume a typical volume", "纳入：假设一个典型成交量"],
				},
			],
			answer: "unknown",
			revealAt: 3,
			explain: [
				"Missing isn't zero and it isn't average. FJOR passes the checks that can be made, so it stays in the intended group as an unknown that no ranking can place.",
				"缺失既不是零，也不是平均值。FJOR 通过了能做的检查，所以它仍在目标人群中，只是一个任何排名都无法放置的未知项。",
			],
		},
		beats: [
			{
				id: "listed",
				label: ["Candidates", "候选"],
				caption: [
					"Eight symbols are listed on Monday. The rule: stock options, Monday's session, data present, at least 500 contracts.",
					"周一有八个上市标的。规则：股票期权、周一时段、有数据、至少 500 张。",
				],
				state: { applied: 0 },
			},
			{
				id: "type",
				label: ["Stocks only", "仅股票"],
				caption: [
					"BRDX is an ETF and IDX 500 an index, so both drop out. Having no sector doesn't make them unknown; they're just not stocks.",
					"BRDX 是 ETF，IDX 500 是指数，两者都被排除。没有行业分类不代表未知，它们只是不是股票。",
				],
				state: { applied: 1 },
			},
			{
				id: "session",
				label: ["Monday only", "仅周一"],
				caption: [
					"EMBR's figure is from Friday's session, so it can't stand in for Monday. It drops out.",
					"EMBR 的数据来自周五，不能代替周一，所以被排除。",
				],
				state: { applied: 2 },
			},
			{
				id: "data",
				label: ["Data present", "有数据"],
				caption: [
					"FJOR's volume never arrived. It isn't zero and it isn't out: it stays in the group as an unknown.",
					"FJOR 的成交量没有到达。它不是零，也没有被排除：它作为未知项留在组内。",
				],
				state: { applied: 3 },
			},
			{
				id: "threshold",
				label: ["At least 500", "至少 500"],
				caption: [
					"GLYN traded 300, below the threshold. That leaves ALFA, CRUX and DUNE eligible, plus FJOR unknown.",
					"GLYN 只成交 300 张，低于门槛。剩下 ALFA、CRUX、DUNE 合格，外加未知的 FJOR。",
				],
				state: { applied: 4 },
			},
		],
		explore: {
			prompt: [
				"Apply the rules one at a time, in order.",
				"按顺序逐条应用规则。",
			],
			start: () => ({ applied: 4 }),
			task: {
				kind: "answer",
				prompt: [
					"Apply the rules one at a time. Which rule removed EMBR?",
					"逐条应用规则。哪条规则把 EMBR 排除了？",
				],
				choices: [
					{ id: "session", label: ["Monday's session", "周一时段"] },
					{ id: "type", label: ["Stock options only", "仅限股票期权"] },
					{ id: "size", label: ["At least 500 contracts", "至少 500 张"] },
				],
				answer: "session",
				done: [
					"EMBR's figure is from Friday's session, so it can't stand in for Monday. It is out on the session rule, before data or size are even checked.",
					"EMBR 的数据来自周五时段，不能代替周一。它在时段规则就被排除了，根本轮不到数据和数量的检查。",
				],
			},
		},
		View: EligibilityView,
	}),
	defineScene<ObservedState, ObservedState>({
		id: "observed",
		label: ["Observed vs intended", "观测与目标"],
		title: [
			"The observed leader isn't the universe's leader",
			"观测到的领先者，不等于全体的领先者",
		],
		predict: {
			prompt: [
				"CRUX has the most volume among the eligible stocks you could observe. Is it the most active eligible stock?",
				"在能观测到的合格股票中，CRUX 成交量最大。它是最活跃的合格股票吗？",
			],
			choices: [
				{
					id: "unknown",
					label: ["Unknown while FJOR is missing", "FJOR 缺失时无法确定"],
				},
				{ id: "yes", label: ["Yes", "是"] },
				{ id: "clearly", label: ["Yes, by a wide margin", "是，而且遥遥领先"] },
			],
			answer: "unknown",
			revealAt: 1,
			explain: [
				"CRUX leads the observed three. FJOR is eligible but unobserved, and a single number from it could change the answer.",
				"CRUX 在观测到的三只中领先。FJOR 合格但未观测到，它的一个数字就可能改变答案。",
			],
		},
		beats: [
			{
				id: "observed",
				label: ["Observed", "已观测"],
				caption: [
					"Among the stocks you can observe, CRUX leads with 5,600 contracts, then ALFA with 2,400 and DUNE with 900.",
					"在能观测到的股票中，CRUX 以 5,600 张领先，其次是 ALFA 2,400 张、DUNE 900 张。",
				],
				state: { withGap: false, arrived: false },
			},
			{
				id: "gap",
				label: ["The gap", "缺口"],
				caption: [
					"Put FJOR back in: eligible, but unobserved. 'CRUX leads' holds for the observed group, not for every eligible stock.",
					"把 FJOR 放回来：合格，但未观测到。“CRUX 领先”只对观测到的组成立，而不是所有合格股票。",
				],
				state: { withGap: true, arrived: false },
			},
		],
		explore: {
			prompt: [
				"Let FJOR's volume arrive and see if the leader changes.",
				"让 FJOR 的成交量到达，看看领先者是否改变。",
			],
			start: () => ({ withGap: true, arrived: true }),
			task: {
				kind: "answer",
				prompt: [
					"Once FJOR's 7,300 contracts arrive, what happens to 'CRUX leads'?",
					"FJOR 的 7,300 张到达后，“CRUX 领先”这个说法怎样了？",
				],
				choices: [
					{ id: "falls", label: ["It no longer holds", "不再成立"] },
					{
						id: "holds",
						label: [
							"It still holds for the eligible group",
							"对符合条件的范围仍然成立",
						],
					},
					{
						id: "volume",
						label: ["CRUX's own volume changes", "CRUX 自己的成交量变了"],
					},
				],
				answer: "falls",
				done: [
					"FJOR was eligible all along, only unobserved. With its 7,300 in view it leads, and CRUX is second. 'CRUX leads' was only ever true of the names you could see.",
					"FJOR 一直都符合条件，只是没被观测到。看到它的 7,300 张后，它领先，CRUX 排第二。“CRUX 领先”只对你看得到的标的成立。",
				],
			},
		},
		View: ObservedView,
	}),
	defineScene<MembershipState, MembershipState>({
		id: "membership",
		label: ["Membership in time", "按时间的成员"],
		title: [
			"A past comparison needs the past's list of names",
			"比较过去，要用过去的名单",
		],
		predict: {
			prompt: [
				"You compare Sep 2's option activity using today's list of names. What goes wrong?",
				"你用今天的名单比较 9月2日 的期权活动。会出什么问题？",
			],
			choices: [
				{
					id: "survivors",
					label: [
						"Names that left since are silently dropped",
						"之后离开的名字被悄悄遗漏",
					],
				},
				{
					id: "nothing",
					label: ["Nothing: names don't change", "没问题：名单不会变"],
				},
				{ id: "volume", label: ["The volumes come out wrong", "成交量会算错"] },
			],
			answer: "survivors",
			revealAt: 1,
			explain: [
				"HALO was listed on Sep 2 and led that day with 6,800 contracts, but it was delisted on Sep 6. Today's list can't see it.",
				"HALO 在 9月2日 仍在册，并以 6,800 张领先当天，但它在 9月6日 退市了。今天的名单看不到它。",
			],
		},
		beats: [
			{
				id: "today",
				label: ["Today's list", "今天的名单"],
				caption: [
					"Using today's list of names, CRUX led Sep 2 with 4,900 contracts.",
					"用今天的名单，CRUX 以 4,900 张领先 9月2日。",
				],
				state: { pointInTime: false },
			},
			{
				id: "then",
				label: ["Sep 2's list", "9月2日 的名单"],
				caption: [
					"On Sep 2, HALO was still listed, and it led with 6,800. It was delisted on Sep 6, so today's list silently drops it.",
					"9月2日 HALO 仍在册，并以 6,800 张领先。它在 9月6日 退市，所以今天的名单会悄悄把它漏掉。",
				],
				state: { pointInTime: true },
			},
		],
		explore: {
			prompt: [
				"Switch where the list of names comes from.",
				"切换名单的来源。",
			],
			start: (last) => last,
			task: {
				kind: "answer",
				prompt: [
					"Using Sep 2's own list of names, which one led that day?",
					"用 9月2日 当天的名单，那天哪个标的领先？",
				],
				choices: [
					{ id: "halo", label: ["HALO", "HALO"] },
					{ id: "crux", label: ["CRUX", "CRUX"] },
					{ id: "alfa", label: ["ALFA", "ALFA"] },
				],
				answer: "halo",
				done: [
					"HALO led with 6,800 contracts. It was delisted on Sep 6, so today's list silently drops it and makes CRUX look like the leader.",
					"HALO 以 6,800 张领先。它在 9月6日 退市，所以今天的名单会悄悄漏掉它，让 CRUX 看起来像领先者。",
				],
			},
		},
		View: MembershipView,
	}),
] as const;

export function SymbolUniverseWalkthrough({ locale }: { locale: Locale }) {
	return (
		<Walkthrough
			locale={locale}
			id="symbol-universe"
			label={["Interactive lesson on comparison groups", "比较组互动课"]}
			scenes={scenes}
		/>
	);
}
