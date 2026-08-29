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
import { cn } from "@tradely/ui/lib/utils";
import { ArrowRightIcon, ExternalLinkIcon } from "lucide-react";
import { useEffect } from "react";
import { useAnalytics } from "@/analytics/context";
import { CourseList } from "@/components/course-list";
import { CourseProgress } from "@/components/course-progress";
import { getLocalizedCourse } from "@/i18n/course";
import { useI18n } from "@/i18n/provider";
import { getCourseProgress } from "@/server/progress";

export const Route = createFileRoute("/")({
	loader: () => getCourseProgress(),
	head: () => ({
		links: [{ rel: "canonical", href: "https://tradely.ai/" }],
	}),
	component: HomeComponent,
});

function HomeComponent() {
	const progress = Route.useLoaderData();
	const { locale, t } = useI18n();
	const { capture } = useAnalytics();
	const course = getLocalizedCourse(locale);
	useEffect(() => {
		if (progress.accessUnavailable) {
			capture("billing_status_unavailable", { surface: "course_progress" });
		}
	}, [capture, progress.accessUnavailable]);
	return (
		<main>
			<section className="overflow-hidden border-border/60 border-b">
				<div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
					<div className="flex max-w-4xl flex-col items-start gap-7">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">{course.title}</Badge>
							<span className="font-mono text-muted-foreground text-xs">
								{t("home.coursePractice", { count: course.lessons.length })}
							</span>
						</div>
						<div className="flex flex-col gap-5">
							<h1 className="max-w-[15ch] font-semibold text-5xl text-display sm:text-6xl lg:text-7xl">
								{t("home.heroTitle")}
							</h1>
							<p className="max-w-[68ch] text-lg text-muted-foreground leading-8">
								{t("home.heroDescription")}
							</p>
						</div>
						<div className="flex flex-col gap-3 sm:flex-row">
							<Link
								to="/learn/$lessonSlug"
								params={{ lessonSlug: "audited-boundary" }}
								className={buttonVariants({ size: "lg" })}
							>
								{t("common.startLearning")}
								<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
							</Link>
							<a
								href="https://app.tradingflow.com/?utm_source=tradely&utm_medium=home-hero"
								onClick={() =>
									capture("tradingflow_link_opened", {
										surface: "home_hero",
									})
								}
								className={buttonVariants({ variant: "outline", size: "lg" })}
							>
								{t("nav.openTradingFlow")}
								<ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
							</a>
						</div>
						<p className="text-muted-foreground text-xs">
							{t("home.partnerDisclosure")}
						</p>
					</div>
				</div>
			</section>

			<section className="mx-auto grid max-w-[1280px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.38fr_0.62fr] lg:px-8 lg:py-24">
				<div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
					<div className="flex flex-col gap-3">
						<p className="font-mono text-primary text-xs">
							{t("home.courseEyebrow")}
						</p>
						<h2 className="font-semibold text-3xl text-display sm:text-4xl">
							{t("home.courseHeading")}
						</h2>
						<p className="text-muted-foreground leading-7">
							{t("home.courseDescription")}
						</p>
					</div>
					<Card size="sm">
						<CardHeader>
							<CardTitle>{t("home.learningRecord")}</CardTitle>
							<CardDescription>
								{progress.signedIn
									? t("progress.synced")
									: t("progress.signInToSync")}
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
				</div>

				<Card className="[--card-spacing:--spacing(4)] sm:[--card-spacing:--spacing(5)]">
					<CardHeader>
						<CardTitle>{course.title}</CardTitle>
						<CardDescription>{course.description}</CardDescription>
					</CardHeader>
					<CardContent className="-mx-2">
						<CourseList
							lessons={course.lessons}
							completedIds={progress.records
								.filter((record) => record.completedAt)
								.map((record) => record.lessonId)}
							canAccessPaid={progress.canAccessPaid}
							accessUnavailable={progress.accessUnavailable}
						/>
					</CardContent>
				</Card>
			</section>

			<section className="border-border/60 border-t bg-muted/35">
				<div className="mx-auto flex max-w-[1100px] flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:py-20">
					<Badge variant="secondary">{t("home.independentProducts")}</Badge>
					<h2 className="max-w-[18ch] font-semibold text-3xl text-display sm:text-4xl">
						{t("home.partnerHeading")}
					</h2>
					<p className="max-w-[68ch] text-muted-foreground leading-7">
						{t("home.partnerDescription")}
					</p>
					<Link
						to="/courses/tradingflow-foundations"
						className={cn(buttonVariants({ variant: "outline" }))}
					>
						{t("common.viewCompleteCourse")}
					</Link>
				</div>
			</section>
		</main>
	);
}
