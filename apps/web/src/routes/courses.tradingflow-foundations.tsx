import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@tradely/ui/components/badge";
import { buttonVariants } from "@tradely/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@tradely/ui/components/card";
import { ArrowRightIcon } from "lucide-react";

import { CourseList } from "@/components/course-list";
import { CourseProgress } from "@/components/course-progress";
import { tradingFlowCourse } from "@/content/course";
import { getCourseProgress } from "@/server/progress";

export const Route = createFileRoute("/courses/tradingflow-foundations")({
	loader: () => getCourseProgress(),
	head: () => ({
		meta: [
			{ title: "Evidence-Led Options Research — Tradely" },
			{
				name: "description",
				content:
					"An ordered options-research course with progress tracking and official TradingFlow practice tasks.",
			},
		],
	}),
	component: CoursePage,
});

function CoursePage() {
	const progress = Route.useLoaderData();
	return (
		<main className="mx-auto flex w-full max-w-[1180px] flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
			<section className="grid items-end gap-8 lg:grid-cols-[1fr_360px]">
				<div className="flex max-w-3xl flex-col gap-5">
					<div className="flex flex-wrap gap-2">
						<Badge>TradingFlow practice course</Badge>
						<Badge variant="secondary">3 free lessons</Badge>
					</div>
					<h1 className="font-semibold text-5xl text-display sm:text-6xl">
						{tradingFlowCourse.title}
					</h1>
					<p className="max-w-[68ch] text-lg text-muted-foreground leading-8">
						{tradingFlowCourse.description}
					</p>
					<Link
						to="/learn/$lessonSlug"
						params={{ lessonSlug: "audited-boundary" }}
						className={buttonVariants({ size: "lg" })}
					>
						Start with lesson one
						<ArrowRightIcon data-icon="inline-end" />
					</Link>
				</div>
				<Card size="sm">
					<CardHeader>
						<CardTitle>Your progress</CardTitle>
						<CardDescription>
							{progress.signedIn
								? "Account progress is current."
								: "Sign in to record completion."}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<CourseProgress
							completed={progress.completed}
							total={progress.total}
							percentage={progress.percentage}
						/>
					</CardContent>
				</Card>
			</section>

			<Card>
				<CardHeader>
					<CardTitle>Curriculum</CardTitle>
					<CardDescription>
						Follow the path in order, or open any lesson to review its place in
						the workflow.
					</CardDescription>
				</CardHeader>
				<CardContent className="-mx-2">
					<CourseList
						lessons={tradingFlowCourse.lessons}
						completedIds={progress.records
							.filter((record) => record.completedAt)
							.map((record) => record.lessonId)}
						canAccessPaid={progress.canAccessPaid}
						accessUnavailable={progress.accessUnavailable}
					/>
				</CardContent>
			</Card>
		</main>
	);
}
