import { Badge } from "@tradely/ui/components/badge";
import { Button } from "@tradely/ui/components/button";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@tradely/ui/components/tabs";
import { ArrowLeftIcon, ArrowRightIcon, RotateCcwIcon } from "lucide-react";
import { type ComponentType, type CSSProperties, useState } from "react";
import type { Locale } from "@/i18n/messages";
export type ConceptScene = {
	id: string;
	label: readonly [string, string];
	title: readonly [string, string];
	prompt: readonly [string, string];
	Component: ComponentType<{ locale: Locale }>;
};

/** Exploration is local to this mounted lab. Only the existing course controls advance an attempt. */
export function ConceptLab({
	locale,
	id,
	label,
	scenes,
}: {
	locale: Locale;
	id: string;
	label: readonly [string, string];
	scenes: readonly [ConceptScene, ...ConceptScene[]];
}) {
	const [scene, setScene] = useState<string>(scenes[0].id);
	const [resets, setResets] = useState<Record<string, number>>({});
	const language = locale === "zh" ? 1 : 0;
	const index = scenes.findIndex((item) => item.id === scene);
	return (
		<section
			className="concept-lab"
			aria-label={label[language]}
			data-concept-lab={id}
			data-contract-lab={id === "contracts" ? "" : undefined}
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
					style={{ "--scene-columns": scenes.length } as CSSProperties}
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
						onClick={() => setScene(scenes[index - 1]?.id ?? scenes[0].id)}
					>
						<ArrowLeftIcon data-icon="inline-start" />
						{locale === "zh" ? "上一个" : "Previous"}
					</Button>
					{index < scenes.length - 1 ? (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setScene(scenes[index + 1]?.id ?? scene)}
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
