import { Link } from "@tanstack/react-router";
import { BentoCard, BentoGrid } from "@tradely/ui/components/bento-grid";
import { Button } from "@tradely/ui/components/button";
import { ArrowRightIcon, RotateCcwIcon, ScanLineIcon } from "lucide-react";
import { useId, useState } from "react";
import { getFreeLessons } from "@/content/course";
import { getLocalizedCourse } from "@/i18n/course";
import { useI18n } from "@/i18n/provider";
import { LessonInfographic } from "./lesson-infographic";

export function LandingResearchDemo() {
	const { t, locale } = useI18n();
	const course = getLocalizedCourse(locale);
	const freeLessons = getFreeLessons(course.lessons);
	const firstFree = freeLessons[0];
	const visualLessons = ["gamma-exposure", "cookbook-research-packet"]
		.map((slug) => course.lessons.find((lesson) => lesson.slug === slug))
		.filter((lesson) => lesson !== undefined);
	const [revealed, setRevealed] = useState(false);
	const explanationId = useId();
	return (
		<section
			id="research-demo"
			className="observatory-study observatory-container research-bento-section"
			aria-labelledby="study-heading"
		>
			<div className="observatory-study-copy">
				<p className="observatory-label">
					<span />
					{t("home.demoLabel")}
				</p>
				<h2 id="study-heading">{t("home.demoTitle")}</h2>
				<p>{t("home.demoDescription")}</p>
				<Link
					to="/learn/$lessonSlug"
					params={{ lessonSlug: "rank-symbols" }}
					className="observatory-text-link"
				>
					{t("home.demoLink")}
					<ArrowRightIcon size={16} aria-hidden="true" />
				</Link>
			</div>
			<BentoGrid className="research-bento">
				<div className="observatory-exercise observatory-surface research-bento-exercise">
					<div className="observatory-exercise-bar">
						<span>
							<ScanLineIcon size={15} aria-hidden="true" />
							{t("home.demoExercise")}
						</span>
						<span>03</span>
					</div>
					<div className="observatory-exercise-content">
						<h3>{t("home.demoQuestion")}</h3>
						<div className="observatory-evidence-lines" aria-hidden="true">
							{[0.91, 0.67, 0.49, 0.28, 0.16].map((amount, index) => (
								<div key={amount}>
									<span>0{index + 1}</span>
									<i style={{ width: `${amount * 100}%` }} />
									<b>{index === 0 ? "↗" : "·"}</b>
								</div>
							))}
						</div>
						<dl className="observatory-observation">
							<dt>{t("home.demoObservation")}</dt>
							<dd>{t("home.demoObserved")}</dd>
						</dl>
						<div
							id={explanationId}
							className="observatory-reasoning"
							hidden={!revealed}
						>
							<dl>
								<dt>{t("home.demoConclusion")}</dt>
								<dd>{t("home.demoInterpreted")}</dd>
							</dl>
							<p>{t("home.demoReason")}</p>
						</div>
						<Button
							variant="outline"
							aria-expanded={revealed}
							aria-controls={explanationId}
							onClick={() => setRevealed(!revealed)}
						>
							{t(revealed ? "home.demoHide" : "home.demoReveal")}
							{revealed ? (
								<RotateCcwIcon data-icon="inline-end" aria-hidden="true" />
							) : (
								<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
							)}
						</Button>
					</div>
					<p className="observatory-exercise-caption">
						{t("home.demoCaption")}
					</p>
				</div>
				{visualLessons.map((lesson) => (
					<BentoCard
						key={lesson.slug}
						className="research-bento-visual"
						visual={
							<LessonInfographic
								subject={lesson.slug}
								locale={locale}
								motionEnabled={false}
							/>
						}
						title={<h3>{lesson.title}</h3>}
						footer={
							<Link
								to="/learn/$lessonSlug"
								params={{ lessonSlug: lesson.slug }}
								className="observatory-text-link"
							>
								{t("home.demoLink")}
								<ArrowRightIcon size={16} aria-hidden="true" />
								<span className="sr-only">: {lesson.title}</span>
							</Link>
						}
					/>
				))}
				<BentoCard
					className="research-bento-stat"
					title={<h3>{t("home.statLessons")}</h3>}
					footer={
						<a href="#curriculum" className="observatory-text-link">
							{t("home.explore")}
							<ArrowRightIcon size={16} aria-hidden="true" />
						</a>
					}
				>
					<p className="research-bento-number">{course.lessons.length}</p>
				</BentoCard>
				{firstFree ? (
					<BentoCard
						className="research-bento-stat research-bento-free"
						title={<h3>{t("home.statPreview")}</h3>}
						footer={
							<Link
								to="/learn/$lessonSlug"
								params={{ lessonSlug: firstFree.slug }}
								className="observatory-text-link"
							>
								{t("home.startFree")}
								<ArrowRightIcon size={16} aria-hidden="true" />
							</Link>
						}
					>
						<p className="research-bento-number">{freeLessons.length}</p>
					</BentoCard>
				) : null}
			</BentoGrid>
		</section>
	);
}
