import { Button } from "@tradely/ui/components/button";
import { Spinner } from "@tradely/ui/components/spinner";
import { lazy, Suspense, useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/messages";
import { learningCopy } from "./copy";

const LearningExercise = lazy(() =>
	import("./learning-exercise").then((m) => ({
		default: m.LearningExercise,
	})),
);

const CHECK_HASH = "#check-yourself";

const copy = {
	intro: {
		en: "Apply what you just explored to a guided case with feedback, then to a new case on your own. It's optional: moving on and your study mark don't depend on it.",
		zh: "把刚刚探索过的内容用到一个有反馈的引导案例上，再独立完成一个新案例。这是可选的：继续学习和学习标记都不依赖它。",
	},
	start: { en: "Start the guided case", zh: "开始引导案例" },
} as const;

/**
 * The lesson's practice, in the page rather than behind a fold: it follows the walkthrough
 * as its last step. It starts only when asked, since opening it begins an attempt.
 */
export function CheckYourself({
	lessonId,
	locale,
	saveGuest = false,
}: {
	lessonId: string;
	locale: Locale;
	saveGuest?: boolean;
}) {
	const headingId = useId();
	const [started, setStarted] = useState(saveGuest);
	const section = useRef<HTMLElement>(null);
	useEffect(() => {
		const reveal = () => {
			if (window.location.hash !== CHECK_HASH) return;
			setStarted(true);
			section.current?.scrollIntoView();
		};
		reveal();
		window.addEventListener("hashchange", reveal);
		return () => window.removeEventListener("hashchange", reveal);
	}, []);
	return (
		<section
			ref={section}
			id="check-yourself"
			aria-labelledby={headingId}
			className="lesson-notes lesson-check scroll-mt-24"
		>
			<div className="flex flex-col gap-2">
				<h2 id={headingId} className="font-semibold text-xl">
					{learningCopy.checkTitle[locale]}
				</h2>
				<p className="max-w-[68ch] text-muted-foreground text-sm leading-6">
					{copy.intro[locale]}
				</p>
			</div>
			{started ? (
				<div className="pt-4">
					<Suspense
						fallback={
							<p role="status" className="flex items-center gap-2 text-sm">
								<Spinner size="sm" aria-hidden="true" />
								{learningCopy.loading[locale]}
							</p>
						}
					>
						<LearningExercise
							lessonId={lessonId}
							saveGuest={saveGuest}
							mode="check"
							startNow
						/>
					</Suspense>
				</div>
			) : (
				<Button className="mt-4" onClick={() => setStarted(true)}>
					{copy.start[locale]}
				</Button>
			)}
		</section>
	);
}
