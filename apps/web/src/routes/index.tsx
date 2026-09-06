import { createFileRoute, Link } from "@tanstack/react-router";
import { buttonVariants } from "@tradely/ui/components/button";
import {
	ArrowDownIcon,
	ArrowRightIcon,
	BookOpenIcon,
	ScanLineIcon,
	WorkflowIcon,
} from "lucide-react";
import { useEffect } from "react";
import { useAnalytics } from "@/analytics/context";
import { LandingCurriculumTable } from "@/components/landing-curriculum-table";
import { LandingResearchDemo } from "@/components/landing-research-demo";
import { TradingHall } from "@/components/trading-hall";
import { getLocalizedCourse } from "@/i18n/course";
import { useI18n } from "@/i18n/provider";
import { getCourseProgress } from "@/server/progress";

export const Route = createFileRoute("/")({
	loader: () => getCourseProgress(),
	head: () => ({ links: [{ rel: "canonical", href: "https://tradely.ai/" }] }),
	component: HomeComponent,
});

function HomeComponent() {
	const progress = Route.useLoaderData();
	const { locale, t } = useI18n();
	const { capture } = useAnalytics();
	const course = getLocalizedCourse(locale);
	const startLesson = course.lessons[0];
	const totalMinutes = course.lessons.reduce(
		(sum, lesson) => sum + lesson.minutes,
		0,
	);
	const previewCount = course.lessons.filter(
		(lesson) => lesson.access === "preview",
	).length;
	useEffect(() => {
		if (progress.accessUnavailable)
			capture("billing_status_unavailable", { surface: "course_progress" });
	}, [capture, progress.accessUnavailable]);
	return (
		<main className="observatory">
			<TradingHall>
				<div className="observatory-container observatory-opening">
					<div className="observatory-claim">
						<p className="observatory-label">
							<span />
							{t("home.openingLabel")}
						</p>
						<h1>
							<span>{t("home.titleRead")}</span>
							<span>{t("home.titleVerify")}</span>
						</h1>
						<p className="observatory-intro">{t("home.intro")}</p>
						<div className="observatory-hero-actions">
							{startLesson ? (
								<Link
									to="/learn/$lessonSlug"
									params={{ lessonSlug: startLesson.slug }}
									className={buttonVariants({
										size: "lg",
										className: "self-start",
									})}
								>
									{t("home.startFree")}
									<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
								</Link>
							) : null}
							<a href="#curriculum" className="observatory-text-link">
								{t("home.explore")}
								<ArrowDownIcon size={15} aria-hidden="true" />
							</a>
						</div>
						<p className="observatory-free-note">
							{t("home.freeNote", { minutes: startLesson?.minutes ?? 0 })}
						</p>
					</div>
					<div className="desk-stat-strip observatory-stats">
						<div className="desk-stat">
							<p className="desk-stat-value">
								{course.lessons.length}
								<span>{t("home.statLessons")}</span>
							</p>
						</div>
						<div className="desk-stat">
							<p className="desk-stat-value">
								{totalMinutes}
								<span>{t("home.statMinutes")}</span>
							</p>
						</div>
						<div className="desk-stat">
							<p className="desk-stat-value">
								{previewCount}
								<span>{t("home.statPreview")}</span>
							</p>
						</div>
						<div className="desk-stat">
							<p className="desk-stat-value">
								{progress.completed}/{progress.total}
								<span>{t("home.statProgress")}</span>
							</p>
							<p className="observatory-progress-note">
								{progress.signedIn
									? t("progress.synced")
									: t("progress.signInToSync")}
							</p>
						</div>
					</div>
					<p className="observatory-partner-note">
						{t("home.partnerDisclosure")}
					</p>
				</div>
			</TradingHall>
			<section
				className="observatory-method-strip"
				aria-label={t("home.pathLabel")}
			>
				<div className="observatory-container">
					<span>
						<BookOpenIcon aria-hidden="true" />
						{t("home.pathOne")}
					</span>
					<ArrowRightIcon aria-hidden="true" />
					<span>
						<ScanLineIcon aria-hidden="true" />
						{t("home.pathTwo")}
					</span>
					<ArrowRightIcon aria-hidden="true" />
					<span>
						<WorkflowIcon aria-hidden="true" />
						{t("home.pathThree")}
					</span>
				</div>
			</section>
			<LandingResearchDemo />
			<section
				id="curriculum"
				className="observatory-curriculum observatory-container"
			>
				<div className="observatory-section-heading">
					<div>
						<p className="observatory-label">
							<span />
							{t("home.curriculumLabel")}
						</p>
						<h2>{t("home.curriculumTitle")}</h2>
					</div>
					<p>{t("home.curriculumIntro")}</p>
				</div>
				<LandingCurriculumTable
					lessons={course.lessons}
					completedIds={progress.records
						.filter((record) => record.completedAt)
						.map((record) => record.lessonId)}
					canAccessPaid={progress.canAccessPaid}
					accessUnavailable={progress.accessUnavailable}
					caption={t("progress.completedLabel", {
						completed: progress.completed,
						total: progress.total,
					})}
				/>
				<div className="observatory-access">
					<div>
						<h3>{t("home.accessTitle")}</h3>
						<p>{t("home.accessDescription", { count: previewCount })}</p>
					</div>
					<Link
						to="/pricing"
						className={buttonVariants({ variant: "outline", size: "lg" })}
					>
						{t("home.accessLink")}
						<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
					</Link>
				</div>
			</section>
		</main>
	);
}
