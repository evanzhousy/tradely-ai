import { buttonVariants } from "@tradely/ui/components/button";
import { Skeleton } from "@tradely/ui/components/skeleton";
import { ArrowRightIcon } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AppLink } from "@/components/app-link";
import { getLocalizedCourse } from "@/i18n/course";
import { useI18n } from "@/i18n/provider";

const LESSON = "what-options-are";

const VisualLessonSample = lazy(() =>
	import("@/features/learning/visual-lesson").then((module) => ({
		default: module.VisualLessonSample,
	})),
);

const copy = {
	en: {
		label: "A real lesson, right here",
		intro:
			"Nothing to sign up for. Watch the film, stop it whenever you need to, then predict what happens and change the example yourself.",
		more: "Continue this lesson",
	},
	zh: {
		label: "一节真实的课程，就在这里",
		intro: "无需注册。看影片，随时暂停，然后预测会发生什么，再亲手调整示例。",
		more: "继续这节课",
	},
};

/**
 * The course's second lesson, whole and working, on the home page. Its code loads only as the
 * film nears the screen, so it costs the page's first view nothing.
 */
export function LandingLessonSample() {
	const { locale } = useI18n();
	const stage = useRef<HTMLDivElement>(null);
	const [near, setNear] = useState(false);
	useEffect(() => {
		const element = stage.current;
		if (!element) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) setNear(true);
			},
			{ rootMargin: "200px 0px" },
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	const lesson = getLocalizedCourse(locale).lessons.find(
		(item) => item.slug === LESSON,
	);
	if (!lesson) return null;
	const text = copy[locale];
	const loading = (
		<div className="landing-lesson-loading">
			<Skeleton className="size-full" />
		</div>
	);
	return (
		<section
			id="lesson-sample"
			className="landing-lesson observatory-container"
			aria-labelledby="lesson-sample-title"
		>
			<div className="observatory-section-heading">
				<div>
					<p className="observatory-label">{text.label}</p>
					<h2 id="lesson-sample-title">{lesson.title}</h2>
				</div>
				<p>{text.intro}</p>
			</div>
			<div
				ref={stage}
				id="lesson-sample-stage"
				className="landing-lesson-stage"
			>
				{near ? (
					<Suspense fallback={loading}>
						<VisualLessonSample lessonId={lesson.id} locale={locale} />
					</Suspense>
				) : (
					loading
				)}
			</div>
			{/* The player's own "Check yourself" link lands here: the check is on the lesson's page. */}
			<div id="check-yourself" className="landing-lesson-more">
				<AppLink
					to="/learn/$lessonSlug"
					params={{ lessonSlug: lesson.slug }}
					className={buttonVariants({ variant: "outline", size: "lg" })}
				>
					{text.more}
					<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
				</AppLink>
			</div>
		</section>
	);
}
