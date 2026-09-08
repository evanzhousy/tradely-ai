import * as m from "motion/react-m";
import { Fragment } from "react";
import type { LearningView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import {
	instantTransition,
	lessonTransition,
	useLessonMotion,
} from "./lesson-motion";

/** Shows the learner's proposed source-to-answer links, never an implied pre-grading endorsement. */
export function ResearchConnections({
	view,
	locale,
}: {
	view: LearningView;
	locale: Locale;
}) {
	const enabled = useLessonMotion();
	const text = (en: string, zh: string) => (locale === "zh" ? zh : en);
	const sources = view.step.evidence.filter((item) => item.detail);
	if (!sources.length) return null;
	return (
		<figure
			className="flex min-w-0 flex-col gap-3"
			aria-label={text("Source and draft links", "来源与草稿关联")}
		>
			<figcaption className="font-medium text-sm">
				{text("Trace this packet into your draft", "将研究包追溯到草稿")}
			</figcaption>
			<p className="text-muted-foreground text-xs">
				{text(
					"A line means you proposed a link. Correctness is checked when you submit.",
					"连线表示你提出了关联，提交后才检验是否成立。",
				)}
			</p>
			<div className="grid grid-cols-[minmax(0,1fr)_48px_minmax(0,2fr)] items-center gap-y-3">
				{view.step.questions.map((question) => {
					const answer = question.choices.find(
						(choice) => choice.id === view.answers[question.id],
					);
					const feedback = view.feedback.find(
						(item) => item.questionId === question.id,
					);
					return (
						<Fragment key={question.id}>
							<div className="min-w-0 break-words text-xs">
								{sources.map((source) => (
									<p key={source.id}>{source.title[locale]}</p>
								))}
							</div>
							<svg viewBox="0 0 48 24" className="h-6 w-12" aria-hidden="true">
								<m.path
									d="M3 12H45"
									fill="none"
									stroke={
										feedback
											? feedback.met
												? "var(--success)"
												: "var(--warning)"
											: "var(--chart-1)"
									}
									strokeWidth="2"
									initial={false}
									animate={{
										pathLength: answer ? 1 : 0,
										opacity: answer ? 1 : 0,
									}}
									transition={enabled ? lessonTransition : instantTransition}
									data-draft-link={question.id}
								/>
							</svg>
							<div className="min-w-0 rounded-xl bg-muted/50 p-3 text-xs">
								<p className="font-medium">{question.prompt[locale]}</p>
								<p className="mt-1 break-words text-muted-foreground">
									{answer?.label[locale] ??
										text(
											"Choose a draft answer below.",
											"在下方选择草稿答案。",
										)}
								</p>
							</div>
						</Fragment>
					);
				})}
			</div>
		</figure>
	);
}
