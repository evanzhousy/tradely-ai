import { DisclosurePanel } from "@tradely/ui/components/disclosure";
import { Spinner } from "@tradely/ui/components/spinner";
import { lazy, Suspense, useEffect, useState } from "react";
import type { Locale } from "@/i18n/messages";
import { learningCopy } from "./copy";

const LearningExercise = lazy(() =>
	import("./learning-exercise").then((m) => ({
		default: m.LearningExercise,
	})),
);

const CHECK_HASH = "#check-yourself";

/** Optional graded practice after the walkthrough. It never gates the study mark or navigation. */
export function CheckYourself({
	lessonId,
	locale,
	saveGuest = false,
}: {
	lessonId: string;
	locale: Locale;
	saveGuest?: boolean;
}) {
	const [expanded, setExpanded] = useState(saveGuest);
	// Mount the exercise on first open and keep it mounted so collapsing never discards work.
	const [mounted, setMounted] = useState(saveGuest);
	useEffect(() => {
		const reveal = () => {
			if (window.location.hash !== CHECK_HASH) return;
			setExpanded(true);
			setMounted(true);
			document.getElementById("check-yourself")?.scrollIntoView();
		};
		reveal();
		window.addEventListener("hashchange", reveal);
		return () => window.removeEventListener("hashchange", reveal);
	}, []);
	return (
		<section id="check-yourself" className="scroll-mt-24">
			<DisclosurePanel
				className="lesson-notes lesson-check"
				isExpanded={expanded}
				onExpandedChange={(open) => {
					setExpanded(open);
					if (open) setMounted(true);
				}}
				summary={
					<span className="flex flex-col gap-0.5">
						<span>{learningCopy.checkTitle[locale]}</span>
						<span className="font-normal text-muted-foreground text-xs">
							{locale === "zh"
								? "可选 · 引导案例 + 独立案例"
								: "Optional · a guided case, then one on your own"}
						</span>
					</span>
				}
			>
				{mounted ? (
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
							/>
						</Suspense>
					</div>
				) : null}
			</DisclosurePanel>
		</section>
	);
}
