import { Link } from "@tanstack/react-router";
import { CheckIcon, MinusIcon, RotateCcwIcon } from "lucide-react";
import { syllabus } from "@/content/syllabus";
import { type Copy, pick } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { judge } from "./answers";
import type { WalkthroughScene } from "./types";

const copy = {
	title: ["Checkpoint results", "检查点结果"],
	right: ["Right", "正确"],
	wrong: ["Not quite", "不对"],
	skipped: ["Skipped", "跳过"],
	revisit: ["Revisit", "复习"],
	allRight: [
		"Every prediction right. The module's ideas hold up on a day you hadn't seen.",
		"全部预测正确。这个模块的概念在你没见过的一天里同样成立。",
	],
	someLeft: [
		"Revisit the lessons next to anything you missed, then try this checkpoint again.",
		"复习未答对题目旁边列出的课程，然后再做一次这个检查点。",
	],
} as const satisfies Record<string, Copy>;

const lessonNumber = (id: string) =>
	syllabus.findIndex((item) => item.id === id) + 1;

/**
 * A checkpoint's last word: each question's result on the new day, and for anything missed,
 * the lesson that teaches it.
 */
export function ReviewSummary({
	locale,
	scenes,
	predictions,
}: {
	locale: Locale;
	scenes: readonly WalkthroughScene[];
	predictions: Readonly<Record<string, string>>;
}) {
	const t = (value: Copy) => pick(value, locale);
	const rows = scenes.flatMap((scene) => {
		if (!scene.predict) return [];
		const answer = predictions[scene.id];
		const status: "right" | "wrong" | "skipped" = !answer
			? "skipped"
			: judge(scene.predict, answer).correct
				? "right"
				: "wrong";
		const lesson = scene.revisit
			? syllabus.find((item) => item.id === scene.revisit)
			: undefined;
		return [{ scene, status, lesson }];
	});
	const right = rows.filter((row) => row.status === "right").length;
	return (
		<div className="wt-panel wt-review" data-kind="summary">
			<p className="wt-panel-title">{t(copy.title)}</p>
			<p className="wt-review-score">
				{locale === "zh"
					? `${rows.length} 题中预测正确 ${right} 题`
					: `${right} of ${rows.length} predicted right`}
			</p>
			<ul className="wt-review-list">
				{rows.map(({ scene, status, lesson }) => (
					<li key={scene.id} data-status={status}>
						<span className="wt-review-status">
							{status === "right" ? (
								<CheckIcon aria-hidden="true" />
							) : status === "wrong" ? (
								<RotateCcwIcon aria-hidden="true" />
							) : (
								<MinusIcon aria-hidden="true" />
							)}
							<span className="sr-only">{t(copy[status])}</span>
						</span>
						<span className="wt-review-text">
							<span>{t(scene.label)}</span>
							{status !== "right" && lesson ? (
								<Link
									to="/learn/$lessonSlug"
									params={{ lessonSlug: lesson.id }}
									className="wt-link"
								>
									{locale === "zh"
										? `${t(copy.revisit)}第 ${lessonNumber(lesson.id)} 课：${lesson.titleZh}`
										: `${t(copy.revisit)} lesson ${lessonNumber(lesson.id)}: ${lesson.title}`}
								</Link>
							) : null}
						</span>
					</li>
				))}
			</ul>
			<p className="wt-panel-note">
				{right === rows.length ? t(copy.allRight) : t(copy.someLeft)}
			</p>
		</div>
	);
}
