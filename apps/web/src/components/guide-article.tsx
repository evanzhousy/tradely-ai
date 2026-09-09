import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@tradely/ui/components/button";
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

export function GuideArticle({ guide }: { guide: Guide }) {
	const { capture } = useAnalytics();
	const free = getFreeLessons(tradingFlowCourse.lessons)[0];
	return (
		<main
			lang="en"
			className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-10 sm:px-6 sm:py-16"
		>
			<article className="flex flex-col gap-10">
				<header className="flex max-w-3xl flex-col items-start gap-5">
					<nav
						aria-label="Breadcrumb"
						className="flex flex-wrap gap-2 text-muted-foreground text-sm"
					>
						<Link to="/">Home</Link>
						<span aria-hidden="true">/</span>
						<Link to="/guides">Guides</Link>
					</nav>
					<p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
						The options field guide · {guide.minutes} min
					</p>
					<h1 className="font-semibold text-4xl text-display leading-tight sm:text-5xl">
						{guide.title}
					</h1>
					<p className="text-lg text-muted-foreground leading-8">
						{guide.description}
					</p>
					<p className="text-muted-foreground text-sm">
						By Tradely · Updated{" "}
						<time dateTime={guide.updated}>{guide.updated}</time> · English
					</p>
					<a href="#example" className={buttonVariants()}>
						Try the free example
					</a>
				</header>
				<div className="grid items-start gap-10 lg:grid-cols-[200px_minmax(0,1fr)]">
					<nav
						aria-label="On this page"
						className="flex flex-col gap-3 text-sm lg:sticky lg:top-24"
					>
						<p className="font-semibold">In this guide</p>
						{guide.sections.map((section) => (
							<a
								key={section.id}
								href={`#${section.id}`}
								className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
							>
								{section.title}
							</a>
						))}
						<a href="#example">Interactive example</a>
						<a href="#sources">Sources</a>
					</nav>
					<div className="flex min-w-0 max-w-3xl flex-col gap-10">
						{guide.sections.map((section) => (
							<section
								key={section.id}
								id={section.id}
								aria-labelledby={`${section.id}-heading`}
								className="scroll-mt-24"
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
						<section
							aria-labelledby="next-heading"
							className="flex flex-col gap-5 rounded-2xl border p-6"
						>
							<h2
								id="next-heading"
								className="font-semibold text-2xl text-display"
							>
								Put your understanding into practice
							</h2>
							<p className="text-muted-foreground leading-7">
								Explore a free research lesson, or follow the full curriculum
								for structured practice. Related member lessons require Tradely
								paid access. Sign in when you want to save course progress.
							</p>
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
						</section>
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
