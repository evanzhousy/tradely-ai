import { Badge } from "@tradely/ui/components/badge";
import { Button } from "@tradely/ui/components/button";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@tradely/ui/components/tabs";
import { ArrowLeftIcon, ArrowRightIcon, RotateCcwIcon } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/i18n/messages";
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
		Component: SourceTimeScene,
	},
] as const;

/** Exploration is local to this mounted lab. Only the existing course controls advance an attempt. */
export function ContractConceptLab({ locale }: { locale: Locale }) {
	const [scene, setScene] = useState<string>("anatomy");
	const [resets, setResets] = useState<Record<string, number>>({});
	const language = locale === "zh" ? 1 : 0;
	const index = scenes.findIndex((item) => item.id === scene);
	return (
		<section
			className="contract-lab"
			aria-label={
				locale === "zh" ? "合约互动课堂" : "Interactive contract lesson"
			}
			data-contract-lab
		>
			<div className="flex flex-wrap items-center justify-between gap-3">
				<Badge variant="outline">
					{locale === "zh" ? "探索概念" : "Explore the concept"}
				</Badge>
				<span className="font-mono text-muted-foreground text-xs">
					{locale === "zh"
						? "教学示例 · 自由探索"
						: "Teaching examples · Explore freely"}
				</span>
			</div>
			<Tabs value={scene} onValueChange={(value) => setScene(String(value))}>
				<TabsList
					className="contract-scene-tabs"
					aria-label={locale === "zh" ? "学习场景" : "Learning scenes"}
				>
					{scenes.map((item, i) => (
						<TabsTrigger key={item.id} value={item.id}>
							<span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
							{item.label[language]}
						</TabsTrigger>
					))}
				</TabsList>
				{scenes.map(({ id, title, prompt, Component }) => (
					<TabsContent key={id} value={id} className="pt-5">
						<div className="mb-5 flex flex-col gap-2">
							<h4 className="font-semibold text-xl tracking-tight sm:text-2xl">
								{title[language]}
							</h4>
							<p className="text-muted-foreground text-sm leading-relaxed">
								{prompt[language]}
							</p>
						</div>
						<Component key={`${id}:${resets[id] ?? 0}`} locale={locale} />
					</TabsContent>
				))}
			</Tabs>
			<div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={() =>
						setResets((previous) => ({
							...previous,
							[scene]: (previous[scene] ?? 0) + 1,
						}))
					}
				>
					<RotateCcwIcon data-icon="inline-start" />
					{locale === "zh" ? "重置场景" : "Reset scene"}
				</Button>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={index === 0}
						onClick={() => setScene(scenes[index - 1].id)}
					>
						<ArrowLeftIcon data-icon="inline-start" />
						{locale === "zh" ? "上一个" : "Previous"}
					</Button>
					{index < scenes.length - 1 ? (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setScene(scenes[index + 1].id)}
						>
							{locale === "zh" ? "下一个" : "Next"}
							<ArrowRightIcon data-icon="inline-end" />
						</Button>
					) : (
						<span className="text-muted-foreground text-xs">
							{locale === "zh"
								? "准备好后，进入下方练习。"
								: "Ready? Continue to practice below."}
						</span>
					)}
				</div>
			</div>
		</section>
	);
}
