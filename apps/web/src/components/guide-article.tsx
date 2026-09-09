import { Link } from "@tanstack/react-router";
import { BentoCard } from "@tradely/ui/components/bento-grid";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@tradely/ui/components/breadcrumb";
import { buttonVariants } from "@tradely/ui/components/button";
import { InteractiveHoverLink } from "@tradely/ui/components/interactive-hover-button";
import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useAnalytics } from "@/analytics/context";
import {
	getFreeLessons,
	getLessonById,
	tradingFlowCourse,
} from "@/content/course";
import { type Guide, guides } from "@/content/guides";
import { GuideDemo } from "@/features/guides/guide-demo";
import { GuideCards } from "./guide-cards";
import { PageIntro } from "./page-intro";
import { ScrollProgress } from "./scroll-progress";
import { TableOfContents } from "./table-of-contents";

export function GuideArticle({ guide }: { guide: Guide }) {
	const { capture } = useAnalytics();
	const article = useRef<HTMLElement>(null);
	const free = getFreeLessons(tradingFlowCourse.lessons)[0];
	return (
		<main lang="en" className="page-shell">
			<ScrollProgress target={article} />
			<Breadcrumb aria-label="Breadcrumb">
				<BreadcrumbList>
					<BreadcrumbItem>
						<BreadcrumbLink render={<Link to="/" />}>Home</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbLink render={<Link to="/guides" />}>
							Guides
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbSeparator />
					<BreadcrumbItem>
						<BreadcrumbPage>{guide.title}</BreadcrumbPage>
					</BreadcrumbItem>
				</BreadcrumbList>
			</Breadcrumb>
			<article ref={article} className="flex flex-col gap-10">
				<PageIntro
					eyebrow={`The options field guide · ${guide.minutes} min`}
					title={guide.title}
					description={guide.description}
				>
					<p className="text-muted-foreground text-sm">
						By Tradely · Updated{" "}
						<time dateTime={guide.updated}>{guide.updated}</time> · English
					</p>
					<InteractiveHoverLink render={<a href="#example" />}>
						Try the free example
					</InteractiveHoverLink>
				</PageIntro>
				<div className="reading-layout">
					<TableOfContents
						label="In this guide"
						items={[
							...guide.sections,
							{ id: "example", title: "Interactive example" },
							{ id: "sources", title: "Sources" },
						]}
					/>
					<div className="reading-body flex flex-col gap-10">
						{guide.sections.map((section) => (
							<section
								key={section.id}
								id={section.id}
								aria-labelledby={`${section.id}-heading`}
								className="reading-section"
							>
								<h2
									id={`${section.id}-heading`}
									className="mb-4 font-semibold text-2xl text-display"
								>
									{section.title}
								</h2>
								<div className="flex flex-col gap-5 leading-8">
									<ReactMarkdown>{section.body}</ReactMarkdown>
								</div>
							</section>
						))}
						<GuideDemo key={guide.slug} slug={guide.slug} />
						<section
							id="sources"
							className="flex scroll-mt-24 flex-col gap-4"
							aria-labelledby="sources-heading"
						>
							<h2
								id="sources-heading"
								className="font-semibold text-2xl text-display"
							>
								Sources and scope
							</h2>
							<p className="text-muted-foreground leading-7">
								The references explain the underlying concepts. Numerical
								examples and checks are authored by Tradely for education, not
								observed trades or investment recommendations.
							</p>
							<ul className="flex list-disc flex-col gap-3 pl-5">
								{guide.sources.map((source) => (
									<li key={source.href}>
										<a
											href={source.href}
											className="underline underline-offset-4"
										>
											{source.title}
										</a>
									</li>
								))}
							</ul>
							<Link
								to="/risk-disclosure"
								className="text-sm underline underline-offset-4"
							>
								Read the risk disclosure
							</Link>
						</section>
						<BentoCard
							title={
								<h2 id="next-heading">Put your understanding into practice</h2>
							}
							description="Explore a free research lesson, or follow the full curriculum for structured practice. Related member lessons require Tradely paid access. Sign in when you want to save course progress."
						>
							<div className="flex flex-wrap gap-3">
								{free ? (
									<Link
										to="/learn/$lessonSlug"
										params={{ lessonSlug: free.slug }}
										className={buttonVariants()}
										onClick={() =>
											capture("guide_next_step_clicked", {
												guide_id: guide.slug,
												destination_kind: "free_lesson",
												lesson_id: free.id,
											})
										}
									>
										Continue with a free lesson
									</Link>
								) : null}
								<Link
									to="/courses/tradingflow-foundations"
									className={buttonVariants({ variant: "outline" })}
									onClick={() =>
										capture("guide_next_step_clicked", {
											guide_id: guide.slug,
											destination_kind: "course",
										})
									}
								>
									Explore the curriculum
								</Link>
							</div>
							<ul className="flex flex-col gap-3">
								{guide.lessonIds.map((id) => {
									const lesson = getLessonById(id);
									return lesson ? (
										<li key={id}>
											<Link
												to="/learn/$lessonSlug"
												params={{ lessonSlug: lesson.slug }}
												className="underline underline-offset-4"
												onClick={() =>
													capture("guide_next_step_clicked", {
														guide_id: guide.slug,
														destination_kind: "related_lesson",
														lesson_id: id,
													})
												}
											>
												{lesson.title}
											</Link>
											<span className="ml-2 text-muted-foreground text-xs">
												{lesson.access === "preview"
													? "Free lesson"
													: "Member lesson"}
											</span>
										</li>
									) : null;
								})}
							</ul>
						</BentoCard>
					</div>
				</div>
			</article>
			<section className="flex flex-col gap-6" aria-labelledby="related-guides">
				<h2 id="related-guides" className="font-semibold text-2xl text-display">
					Keep exploring
				</h2>
				<GuideCards items={guides.filter((item) => item.slug !== guide.slug)} />
			</section>
		</main>
	);
}
