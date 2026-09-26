import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	BlockScene,
	ConditionScene,
	ConditionsData,
	PackageScene,
	SweepScene,
} from "./conditions-concept-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "sweep",
		label: ["Follow a sweep", "追踪扫单"],
		title: [
			"One order can print as several trades",
			"一张订单可以打印成多笔成交",
		],
		prompt: [
			"Change the order size. Watch the order take each venue's displayed offer, and compare the prints with the single order behind them.",
			"改变订单张数，观察订单依次吃掉各场所的展示卖单，再比较这些成交与背后的同一张订单。",
		],
		steps: teachingSteps(
			[
				[
					"An order for 20 contracts fits inside Venue X's offer: one venue, one print at $2.10.",
					"20 张的订单在场所 X 的卖单内即可成交：一个场所、一笔 $2.10 的成交。",
				],
				[
					"An order for 35 needs two venues. Routed as a sweep, it prints 20 at $2.10 and 15 at $2.11: one order, two prints.",
					"35 张需要两个场所。以扫单路由后，$2.10 成交 20 张、$2.11 成交 15 张：一张订单，两笔成交。",
				],
				[
					"At 50 contracts the sweep reaches a third venue and pays up to $2.12. Aggregate the fills before reading size or price.",
					"50 张时扫单到达第三个场所，最高付到 $2.12。解读数量或价格前，先把这些成交汇总。",
				],
			],
			[
				["One venue", "一个场所"],
				["Two venues", "两个场所"],
				["Three venues", "三个场所"],
			],
		),
		Component: SweepScene,
	},
	{
		id: "block",
		label: ["Place a block", "定位大宗"],
		title: [
			"A block is arranged first, then printed",
			"大宗交易先撮合，再打印",
		],
		prompt: [
			"Move the same 1,000-contract block between an auction price, the ask and above the ask. Check what its location can and cannot tell you.",
			"把同一笔 1,000 张的大宗交易放在竞价价格、卖价与高于卖价的位置，检查它的位置能说明什么、不能说明什么。",
		],
		steps: teachingSteps(
			[
				[
					"A block is often arranged away from the screen, then printed through an auction or cross. This one printed at $2.05, inside the $2.00/$2.10 quote.",
					"大宗交易常在屏幕外撮合，再通过竞价或交叉成交打印。这笔成交价 $2.05，位于 $2.00/$2.10 报价之内。",
				],
				[
					"The same size at the ask reads as likely buyer-initiated only if the quote is current. Size alone adds no direction.",
					"同样数量若成交在卖价，只有在报价为当时报价时才可能提示买方主动。数量本身不提供方向。",
				],
				[
					"A print above the ask is not proof of urgency. Check the timestamp, the quote and the condition code before interpreting it.",
					"高于卖价的成交不能证明急迫。解读前先检查时间戳、报价与条件代码。",
				],
			],
			[
				["Auction print", "竞价成交"],
				["At the ask", "卖价成交"],
				["Above the ask", "高于卖价"],
			],
		),
		Component: BlockScene,
	},
	{
		id: "package",
		label: ["Read the package", "整体解读"],
		title: ["A spread prints as one package", "价差以一个整体成交"],
		prompt: [
			"Switch between reading the two leg prints separately and as one package. Compare each leg's quote with the package's own market.",
			"在分开解读两条腿成交与作为整体解读之间切换，比较每条腿的报价与组合自身的市场。",
		],
		steps: teachingSteps(
			[
				[
					"Two legs of one spread order print at $5.25 and $2.25. Leg by leg, both look like prints above the ask.",
					"同一价差订单的两条腿分别成交在 $5.25 和 $2.25。逐腿看，两笔都像是高于卖价的成交。",
				],
				[
					"Read together, they are one package: bought the 100 call and sold the 110 call for $3.00 net, inside the $2.90–$3.30 package market.",
					"合并来看，它们是一个整体：买入 100 看涨、卖出 110 看涨，净价 $3.00，位于 $2.90–$3.30 的组合市场之内。",
				],
				[
					"A complex-order condition tells you to evaluate the package. Classifying each leg alone would call the sold 110 call an aggressive buy.",
					"复杂订单条件提示你按整体评估。单独分类每条腿，会把卖出的 110 看涨误判为主动买入。",
				],
			],
			[
				["Read the legs", "逐腿读取"],
				["Read the package", "整体读取"],
				["Name the error", "指出误读"],
			],
		),
		Component: PackageScene,
	},
	{
		id: "conditions",
		label: ["Read the condition", "解读成交条件"],
		title: [
			"An execution label is not an investor identity",
			"执行标签不等于投资者身份",
		],
		prompt: [
			"Inspect a supplied condition definition, then test what it can establish about this large illustrative row.",
			"检查给定成交条件定义，再判断它能确定这条大额示例记录的哪些信息。",
		],
		steps: teachingSteps(
			[
				[
					"An execution condition describes the record under its source convention, not the investor's identity.",
					"成交条件按来源约定描述记录，不揭示投资者身份。",
				],
			],
			[
				["Read execution condition", "读取成交条件"],
				["Check source definition", "检查来源定义"],
				["Bound what it implies", "限定可推断范围"],
			],
		),
		Component: ConditionScene,
	},
] as const satisfies readonly ConceptScene[];

export function ConditionsConceptLab({
	locale,
	data,
}: {
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	if (data?.kind !== "execution-conditions")
		return (
			<p role="status">
				{locale === "zh"
					? "教学示例暂不可用，请重新打开本课。"
					: "Teaching examples are unavailable. Reopen this lesson to try again."}
			</p>
		);
	return (
		<ConditionsData value={data}>
			<ConceptLab
				locale={locale}
				id="conditions"
				label={["Interactive execution conditions lesson", "成交条件互动课堂"]}
				scenes={scenes}
			/>
		</ConditionsData>
	);
}
