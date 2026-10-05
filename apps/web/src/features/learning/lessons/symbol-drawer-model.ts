import {
	type Copy,
	modelVolatility,
	mondayActivity,
	oct100CallMonday,
	usd,
} from "@/content/world";

export const T1 = oct100CallMonday.trades[0];
export const OI = oct100CallMonday.startOpenInterest;
export const IV = modelVolatility("oct18", 100);

export type ClockRow = {
	id: string;
	/** Fits a phone-width stage. */
	short: Copy;
	time: Copy;
	text: Copy;
	field: Copy;
	/** The moment the drawer is being read. */
	now?: boolean;
};

export const clockRows: readonly ClockRow[] = [
	{
		id: "oi-count",
		short: ["OI at the close: 100", "收盘未平仓量：100"],
		time: ["Fri 16:00", "周五 16:00"],
		text: [`OI counted at the close: ${OI}`, `收盘统计未平仓量：${OI}`],
		field: ["open interest", "未平仓量"],
	},
	{
		id: "iv",
		short: ["IV computed: 35%", "隐含波动率：35%"],
		time: ["Fri 16:00", "周五 16:00"],
		text: [
			`model IV computed: ${Math.round(IV * 100)}%`,
			`模型隐含波动率算出：${Math.round(IV * 100)}%`,
		],
		field: ["model IV", "模型 IV"],
	},
	{
		id: "oi-published",
		short: ["OI report published", "未平仓量报告发布"],
		time: ["Mon 06:30", "周一 06:30"],
		text: ["Friday's OI report published", "周五的未平仓量报告发布"],
		field: ["open interest", "未平仓量"],
	},
	{
		id: "trade",
		short: [
			`trade: ${T1.quantity} @ ${usd(T1.price)}`,
			`成交：${T1.quantity} 张 @ ${usd(T1.price)}`,
		],
		time: [`Mon ${T1.time}`, `周一 ${T1.time}`],
		text: [
			`trade: ${T1.quantity} @ ${usd(T1.price)}`,
			`成交：${T1.quantity} 张 @ ${usd(T1.price)}`,
		],
		field: ["last trade · event", "最新成交 · 事件"],
	},
	{
		id: "received",
		short: ["same trade received", "同一笔成交到达"],
		time: ["Mon 10:20", "周一 10:20"],
		text: [
			"the same trade arrives, 15 minutes late",
			"同一笔成交延迟 15 分钟到达",
		],
		field: ["last trade · receipt", "最新成交 · 接收"],
	},
	{
		id: "now",
		short: ["you read the drawer", "你查看抽屉"],
		time: ["Mon 10:30", "周一 10:30"],
		text: ["you read the ALFA drawer", "你查看 ALFA 抽屉"],
		field: ["now", "现在"],
		now: true,
	},
];

/** The order beats reveal rows in: the moment of reading first, then each field's own clock. */
export const revealOrder = [
	"now",
	"iv",
	"oi-count",
	"oi-published",
	"trade",
	"received",
];

export type Requirement = "today" | "positions" | "compare";
export type Verdict = "meets" | "partial" | "fails" | "context";

export const sources: readonly { id: string; name: Copy; detail: Copy }[] = [
	{
		id: "friday",
		name: ["Friday's tape", "周五成交记录"],
		detail: ["18 contracts · Fri 09:30–16:00", "18 张 · 周五 09:30–16:00"],
	},
	{
		id: "delayed",
		name: ["Monday tape, delayed", "周一成交，延迟"],
		detail: ["10 contracts · Mon 09:30–10:15", "10 张 · 周一 09:30–10:15"],
	},
	{
		id: "oi",
		name: ["Open interest", "未平仓量"],
		detail: [`${OI} · counted Fri close`, `${OI} · 周五收盘统计`],
	},
];

export const verdicts: Record<
	Requirement,
	Record<string, { verdict: Verdict; why: Copy }>
> = {
	today: {
		friday: { verdict: "fails", why: ["wrong session", "时段不对"] },
		delayed: {
			verdict: "partial",
			why: ["right session, only to 10:15", "时段正确，只到 10:15"],
		},
		oi: {
			verdict: "context",
			why: ["a count of positions, not flow", "是持仓数，不是成交流"],
		},
	},
	positions: {
		friday: {
			verdict: "context",
			why: ["trades, not positions", "是成交，不是持仓"],
		},
		delayed: {
			verdict: "context",
			why: ["trades, not positions", "是成交，不是持仓"],
		},
		oi: {
			verdict: "meets",
			why: ["the latest count there is", "已是最新的统计"],
		},
	},
	compare: {
		friday: { verdict: "meets", why: ["a complete session", "完整的交易时段"] },
		delayed: {
			verdict: "fails",
			why: ["Monday isn't complete yet", "周一尚未结束"],
		},
		oi: { verdict: "context", why: ["a different measure", "是不同的指标"] },
	},
};

export const verdictCopy: Record<Verdict, Copy> = {
	meets: ["meets", "满足"],
	partial: ["partly", "部分"],
	fails: ["fails", "不满足"],
	context: ["context only", "仅作参考"],
};

export const coverRows: readonly {
	id: string;
	label: Copy;
	state: "observed" | "zero" | "missing";
	value: number | null;
}[] = [
	{
		id: "100",
		label: ["Oct 18 100 call", "10月18日 100 看涨"],
		state: "observed",
		value: mondayActivity[0].volume,
	},
	{
		id: "105",
		label: ["Oct 18 105 call", "10月18日 105 看涨"],
		state: "observed",
		value: mondayActivity[1].volume,
	},
	{
		id: "110",
		label: ["Oct 18 110 call", "10月18日 110 看涨"],
		state: "observed",
		value: mondayActivity[2].volume,
	},
	{
		id: "115",
		label: ["Oct 18 115 call", "10月18日 115 看涨"],
		state: "zero",
		value: 0,
	},
	{
		id: "120",
		label: ["Oct 18 120 call", "10月18日 120 看涨"],
		state: "missing",
		value: null,
	},
];
