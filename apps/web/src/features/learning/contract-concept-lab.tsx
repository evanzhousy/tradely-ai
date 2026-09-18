import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	AnatomyScene,
	IdentityScene,
	SourceTimeScene,
	UnitsScene,
} from "./contract-concept-scenes";
import { teachingSteps } from "./visual-step";

const scenes = [
	{
		id: "anatomy",
		label: ["Anatomy", "构成"],
		title: ["Take a contract apart", "拆解一张合约"],
		prompt: [
			"Select a field to see what it means.",
			"点击一个字段，看看它代表什么。",
		],
		steps: teachingSteps(
			[
				[
					"Each field tells you something different about the contract. The contract terms set the units and settlement.",
					"每个字段都说明合约的一部分。合约条款决定单位与结算方式。",
				],
			],
			[
				["Read the fields", "查看字段"],
				["See what defines the contract", "查看什么决定合约"],
				["Read the contract terms", "读取合约条款"],
			],
		),
		Component: AnatomyScene,
	},
	{
		id: "identity",
		label: ["Identity", "身份"],
		title: ["What makes it the same contract?", "什么决定它是不是同一张合约？"],
		prompt: [
			"Change one field on B and see whether it is still the same contract.",
			"改变 B 的一个字段，看看它是否还是同一张合约。",
		],
		steps: teachingSteps(
			[
				[
					"Changing the expiry creates a different contract. Changing only the quote time does not.",
					"改变到期日会变成另一张合约；只改变报价时间则不会。",
				],
			],
			[
				["Compare A and B", "比较 A 与 B"],
				["Change expiration", "改变到期日"],
				["Change quote time", "改变报价时间"],
			],
		),
		Component: IdentityScene,
	},
	{
		id: "units",
		label: ["Units", "单位"],
		title: ["Know what each number means", "看懂每个数字代表什么"],
		prompt: [
			"Change the contract count or option price and watch the totals.",
			"改变合约张数或期权价格，观察总额变化。",
		],
		steps: teachingSteps(
			[
				[
					"More contracts increase both premium and deliverable shares. Buying an option does not give you shares immediately.",
					"合约张数增加会同时提高权利金和可交付股票数量。买入期权不会立即得到股票。",
				],
			],
			[
				["Read one contract", "读取一张合约"],
				["Add another contract", "再增加一张合约"],
				["Compare cost and shares", "比较成本与股票数量"],
			],
		),
		Component: UnitsScene,
	},
	{
		id: "time",
		label: ["Source time", "来源时间"],
		title: ["Same contract, different times", "同一合约，不同时间"],
		prompt: [
			"Move the timeline through three snapshots.",
			"拖动时间轴，查看三个快照。",
		],
		steps: teachingSteps(
			[
				[
					"The contract stays the same while its price, volume and quote time change.",
					"合约保持不变，但价格、成交量和报价时间会变化。",
				],
			],
			[
				["Read first snapshot", "读取首个快照"],
				["Move through time", "沿时间移动"],
				["Separate contract from quote", "区分合约与报价"],
			],
		),
		Component: SourceTimeScene,
	},
] as const satisfies readonly ConceptScene[];

export function ContractConceptLab({ locale }: { locale: Locale }) {
	return (
		<ConceptLab
			locale={locale}
			id="contracts"
			label={["Interactive contract lesson", "合约互动课堂"]}
			scenes={scenes}
		/>
	);
}
