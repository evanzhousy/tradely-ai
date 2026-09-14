import type { Locale } from "@/i18n/messages";
import { ConceptLab, type ConceptScene } from "./concept-lab";
import {
	AnatomyScene,
	IdentityScene,
	SourceTimeScene,
	UnitsScene,
} from "./contract-concept-scenes";

const scenes = [
	{
		id: "anatomy",
		label: ["Anatomy", "构成"],
		title: ["Take a contract apart", "拆解一张合约"],
		prompt: [
			"Select a field in the diagram to find out what it describes.",
			"点击图中的字段，了解它描述什么。",
		],
		demonstration: [
			[
				"The highlighted field describes one part of this contract. Product terms define the units and settlement.",
				"高亮字段描述合约的一部分，产品条款决定单位与结算方式。",
			],
		],
		Component: AnatomyScene,
	},
	{
		id: "identity",
		label: ["Identity", "身份"],
		title: ["Same underlying. Same contract?", "同一标的，就是同一合约吗？"],
		prompt: [
			"Change one field on B. Watch which differences matter.",
			"改变 B 的一个字段，观察哪些差异影响合约身份。",
		],
		demonstration: [
			[
				"Change the expiry: the contract changes. Change only the observation: its identity stays the same.",
				"改变到期日会改变合约；仅改变观测时点，合约身份不变。",
			],
		],
		Component: IdentityScene,
	},
	{
		id: "units",
		label: ["Units", "单位"],
		title: ["Give every number a unit", "让每个数字都有单位"],
		prompt: [
			"Add a contract or move the price slider. Follow what changes.",
			"增加一张合约，或拖动价格滑块，观察变化。",
		],
		demonstration: [
			[
				"More contracts scale both premium and deliverable units. Buying an option does not deliver shares immediately.",
				"张数增加会同时放大权利金与交付数量；买入期权不会立即交付股票。",
			],
		],
		Component: UnitsScene,
	},
	{
		id: "time",
		label: ["Source time", "来源时间"],
		title: ["One contract, different observations", "同一合约，不同时点的观测"],
		prompt: [
			"Drag the timeline through three supplied snapshots.",
			"拖动时间轴，查看三个给定快照。",
		],
		demonstration: [
			[
				"The contract stays fixed while its price, volume and reporting time change.",
				"合约不变，价格、成交量与报告时间可以改变。",
			],
		],
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
