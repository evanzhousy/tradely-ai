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
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@tradely/ui/components/tabs";
import { SearchIcon } from "lucide-react";
import { type ComponentProps, useId, useState } from "react";
import type { Lesson } from "@/content/course";
import { courseModules } from "@/content/syllabus";
import { useI18n } from "@/i18n/provider";
import { LandingCurriculum } from "./landing-curriculum";

type CatalogFilter = "all" | "free" | "completed";

export function filterCatalog(
	lessons: readonly Lesson[],
	query: string,
	filter: CatalogFilter,
	completedIds: string[],
) {
	const search = query.trim().toLocaleLowerCase();
	return lessons.filter(
		(lesson) =>
			(filter !== "free" || lesson.access === "preview") &&
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
	const [filter, setFilter] = useState<CatalogFilter>("all");
	const completedIds = props.completedIds ?? [];
	const lessons = filterCatalog(props.lessons, query, filter, completedIds);
	const filters = [
		{ value: "all", label: locale === "zh" ? "全部" : "All lessons" },
		{ value: "free", label: t("common.free") },
		{ value: "completed", label: t("common.completed") },
	] as const;
	return (
		<Tabs
			value={filter}
			onValueChange={(value) => {
				if (value === "all" || value === "free" || value === "completed")
					setFilter(value);
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
				<Field className="w-full sm:w-80">
					<FieldLabel htmlFor={id}>
						{locale === "zh" ? "查找课程" : "Find a lesson"}
					</FieldLabel>
					<div className="catalog-search">
						<SearchIcon size={16} aria-hidden="true" />
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
											<a key={module.id} href={`#module-${module.id}`}>
												<span>{String(index + 1).padStart(2, "0")}</span>
												{module[locale]}
											</a>
										) : null,
									)}
								</nav>
								<LandingCurriculum {...props} groupByModule lessons={lessons} />
							</div>
						) : (
							<Empty>
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<SearchIcon aria-hidden="true" />
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
