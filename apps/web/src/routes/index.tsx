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
import { LandingStudyMaterials } from "@/components/landing-study-materials";
import { getLocalizedCourse } from "@/i18n/course";
import { useI18n } from "@/i18n/provider";
import { getCourseProgress } from "@/server/progress";

export const Route = createFileRoute("/")({
	loader: () => getCourseProgress(),
	head: () => ({ links: [{ rel: "canonical", href: "https://tradely.ai/" }] }),
	component: HomeComponent,
});

// Consecutive stages of the existing course, not separate products.
const stages = [
	{
		start: "audited-boundary",
		end: "rank-symbols",
		title: "home.pathOne",
		description: "home.pathOneDescription",
		icon: BookOpenIcon,
	},
	{
		start: "symbol-drawer",
		end: "dex-dei-gex",
		title: "home.pathTwo",
		description: "home.pathTwoDescription",
		icon: ScanLineIcon,
	},
	{
		start: "cookbook-research-packet",
		end: "audit-market-recap",
		title: "home.pathThree",
		description: "home.pathThreeDescription",
		icon: WorkflowIcon,
	},
] as const;

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
		<main className="observatory landing-notebook">
			<section className="landing-hero" aria-labelledby="landing-heading">
				<div className="landing-hero-stage">
					{startLesson ? <LandingStudyMaterials lesson={startLesson} /> : null}
					<div className="landing-hero-copy">
						<p className="observatory-label">
							<span />
							{t("home.openingLabel")}
						</p>
						<h1 id="landing-heading">
							<span>{t("home.titleRead")}</span>
							<span>{t("home.titleVerify")}</span>
						</h1>
						<p className="landing-intro">{t("home.intro")}</p>
						<div className="landing-hero-actions">
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
							<a href="#research-demo" className="observatory-text-link">
								<BookOpenIcon size={16} aria-hidden="true" />
								{t("home.seeInside")}
							</a>
						</div>
						<p className="landing-free-note">
							{t("home.freeNote", { minutes: startLesson?.minutes ?? 0 })}
						</p>
					</div>
				</div>
				<div className="landing-proof observatory-container">
					<div className="desk-stat-strip landing-stats">
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
							<p className="landing-progress-note">
								{progress.signedIn
									? t("progress.synced")
									: t("progress.signInToSync")}
							</p>
						</div>
					</div>
					<p className="landing-partner-note">{t("home.partnerDisclosure")}</p>
				</div>
			</section>
			<section
				className="landing-path observatory-container"
				aria-labelledby="path-heading"
			>
				<div className="landing-path-heading">
					<div>
						<p className="observatory-label">{t("home.pathLabel")}</p>
						<h2 id="path-heading">{t("home.pathTitle")}</h2>
					</div>
					<a href="#curriculum" className="observatory-text-link">
						{t("home.explore")}
						<ArrowDownIcon size={15} aria-hidden="true" />
					</a>
				</div>
				<ol className="landing-path-stages">
					{stages.map((stage) => {
						const first = course.lessons.findIndex(
							(lesson) => lesson.slug === stage.start,
						);
						const last = course.lessons.findIndex(
							(lesson) => lesson.slug === stage.end,
						);
						if (first < 0 || last < first) return null;
						const Icon = stage.icon;
						return (
							<li key={stage.start}>
								<a href={`#lesson-${stage.start}`}>
									<div className="landing-stage-meta">
										<Icon size={21} aria-hidden="true" />
										<span>
											{t("home.lessonRange", {
												first: String(first + 1).padStart(2, "0"),
												last: String(last + 1).padStart(2, "0"),
											})}
										</span>
										<ArrowRightIcon size={16} aria-hidden="true" />
									</div>
									<h3>{t(stage.title)}</h3>
									<p>{t(stage.description)}</p>
								</a>
							</li>
						);
					})}
				</ol>
			</section>
			<div className="landing-study-section">
				<LandingResearchDemo />
			</div>
			<section
				id="curriculum"
				className="observatory-curriculum observatory-container"
			>
				<div className="observatory-section-heading">
					<div>
						<p className="observatory-label">{t("home.curriculumLabel")}</p>
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
