import { Button } from "@tradely/ui/components/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@tradely/ui/components/empty";
import { Field, FieldLabel } from "@tradely/ui/components/field";
import { Input } from "@tradely/ui/components/input";
import { Link as HeroLink } from "@tradely/ui/components/link";
import {
	NativeSelect,
	NativeSelectOption,
} from "@tradely/ui/components/native-select";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@tradely/ui/components/tabs";
import { type ComponentProps, useId, useState } from "react";
import type { Lesson } from "@/content/course";
import { courseModules } from "@/content/syllabus";
import { useActiveSection } from "@/hooks/use-active-section";
import { useI18n } from "@/i18n/provider";
import { BrandOwl } from "./brand-owl";
import { LandingCurriculum } from "./landing-curriculum";

type CatalogFilter = "all" | "completed";

export function filterCatalog(
	lessons: readonly Lesson[],
	query: string,
	filter: CatalogFilter,
	completedIds: string[],
) {
	const search = query.trim().toLocaleLowerCase();
	return lessons.filter(
		(lesson) =>
			(filter !== "completed" || completedIds.includes(lesson.id)) &&
			(!search ||
				`${lesson.title} ${lesson.summary} ${lesson.category}`
					.toLocaleLowerCase()
					.includes(search)),
	);
}

export function CourseCatalog(props: ComponentProps<typeof LandingCurriculum>) {
	const { locale, t } = useI18n();
	const id = useId();
	const [query, setQuery] = useState("");
	const [moduleId, setModuleId] = useState("all");
	const [filter, setFilter] = useState<CatalogFilter>("all");
	const completedIds = props.completedIds ?? [];
	const lessons = filterCatalog(
		props.lessons,
		query,
		filter,
		completedIds,
	).filter((lesson) => moduleId === "all" || lesson.moduleId === moduleId);
	const activeModule = useActiveSection(
		courseModules
			.filter((module) =>
				lessons.some((lesson) => lesson.moduleId === module.id),
			)
			.map((module) => `module-${module.id}`),
	);
	const filters = [
		{ value: "all", label: locale === "zh" ? "全部" : "All lessons" },
		{ value: "completed", label: t("common.completed") },
	] as const;
	return (
		<Tabs
			value={filter}
			onValueChange={(value) => {
				if (value === "all" || value === "completed") setFilter(value);
			}}
			className="gap-6"
		>
			<div className="catalog-tools">
				<div>
					<TabsList
						aria-label={locale === "zh" ? "筛选课程" : "Filter lessons"}
					>
						{filters.map((item) => (
							<TabsTrigger key={item.value} value={item.value}>
								{item.label}
							</TabsTrigger>
						))}
					</TabsList>
					<p className="catalog-count" role="status">
						{locale === "zh"
							? `显示 ${lessons.length} / ${props.lessons.length} 节课`
							: `${lessons.length} of ${props.lessons.length} lessons`}
					</p>
				</div>
				<Field className="catalog-module-field">
					<FieldLabel htmlFor={`${id}-module`}>
						{locale === "zh" ? "学习模块" : "Learning module"}
					</FieldLabel>
					<NativeSelect
						aria-label={locale === "zh" ? "学习模块" : "Learning module"}
						id={`${id}-module`}
						value={moduleId}
						onChange={(event) => setModuleId(event.target.value)}
					>
						<NativeSelectOption value="all">
							{locale === "zh" ? "全部模块" : "All modules"}
						</NativeSelectOption>
						{courseModules.map((module) => (
							<NativeSelectOption key={module.id} value={module.id}>
								{module[locale]}
							</NativeSelectOption>
						))}
					</NativeSelect>
				</Field>
				<Field className="catalog-search-field">
					<FieldLabel htmlFor={id}>
						{locale === "zh" ? "查找课程" : "Find a lesson"}
					</FieldLabel>
					<div className="catalog-search">
						<Input
							id={id}
							type="search"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder={
								locale === "zh" ? "搜索概念、主题…" : "Search concepts, topics…"
							}
						/>
					</div>
				</Field>
			</div>
			{query || moduleId !== "all" || filter !== "all" ? (
				<div className="catalog-filter-summary">
					<span>{locale === "zh" ? "已筛选课程" : "Filtered curriculum"}</span>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							setQuery("");
							setModuleId("all");
							setFilter("all");
						}}
					>
						{locale === "zh" ? "清除筛选" : "Clear filters"}
					</Button>
				</div>
			) : null}
			{filters.map((item) => (
				<TabsContent key={item.value} value={item.value}>
					{item.value === filter ? (
						lessons.length ? (
							<div className="flex flex-col gap-8">
								<nav
									className="module-navigation"
									aria-label={locale === "zh" ? "跳至模块" : "Jump to module"}
								>
									{courseModules.map((module, index) =>
										lessons.some((lesson) => lesson.moduleId === module.id) ? (
											<HeroLink
												key={module.id}
												href={`#module-${module.id}`}
												aria-current={
													activeModule === `module-${module.id}`
														? "location"
														: undefined
												}
											>
												<span>{String(index + 1).padStart(2, "0")}</span>
												{module[locale]}
											</HeroLink>
										) : null,
									)}
								</nav>
								<LandingCurriculum {...props} groupByModule lessons={lessons} />
							</div>
						) : (
							<Empty>
								<EmptyHeader>
									<EmptyMedia>
										<BrandOwl pose="thinking" />
									</EmptyMedia>
									<EmptyTitle>
										{locale === "zh" ? "暂无匹配课程" : "No matching lessons"}
									</EmptyTitle>
									<EmptyDescription>
										{filter === "completed"
											? locale === "zh"
												? "登录并完成一节课后，已完成的课程会显示在这里。"
												: "Completed lessons appear here after you sign in and record a completion."
											: locale === "zh"
												? "尝试其他关键词，或查看完整课程。"
												: "Try another topic, or return to the full curriculum."}
									</EmptyDescription>
								</EmptyHeader>
								<EmptyContent>
									<Button
										variant="outline"
										onClick={() => {
											setQuery("");
											setModuleId("all");
											setFilter("all");
										}}
									>
										{locale === "zh" ? "查看全部课程" : "Show all lessons"}
									</Button>
								</EmptyContent>
							</Empty>
						)
					) : null}
				</TabsContent>
			))}
		</Tabs>
	);
}
