import "@tanstack/react-start/server-only";
import type { LessonAttempt } from "@tradely/db";
import { getCoachingLesson } from "@/content/coaching/index.server";
import { getLessonScenarios } from "@/content/scenarios/index.server";
import { getTeachingUnit } from "@/content/units/index.server";
import { requireCoachable } from "@/domain/coaching/policy";
import {
	CoachingError,
	type CoachingReference,
	type CoachingSnapshot,
} from "@/domain/coaching/types";
import { evaluateStep, projectAttempt } from "@/domain/learning/engine";
import { attemptStateSchema } from "@/domain/learning/types";

export function requireCoachingStage(record: LessonAttempt) {
	const config = getCoachingLesson(record.lessonId);
	const unit = getTeachingUnit(record.lessonId);
	const scenario = getLessonScenarios(record.lessonId).find(
		(s) => s.id === record.scenarioId && s.version === record.scenarioVersion,
	);
	if (!config || !unit) throw new CoachingError("not_eligible");
	if (!scenario || record.status === "retired")
		throw new CoachingError("retired");
	const state = attemptStateSchema.parse(record.state);
	const view = projectAttempt(scenario, state, record.id, record.revision);
	requireCoachable(view);
	return { config, unit, scenario, state, view };
}
export function buildCoachingSnapshot(
	record: LessonAttempt,
	locale: "en" | "zh",
	extraReason: string,
): CoachingSnapshot {
	const { config, unit, scenario, state, view } = requireCoachingStage(record);
	const reason =
		(config.reasonQuestionId
			? view.answers[config.reasonQuestionId]
			: extraReason
		)?.trim() ?? "";
	if (reason.length < 40 || reason.length > 1800)
		throw new CoachingError("incomplete");
	const refs: CoachingReference[] = [
		{
			id: "concept",
			label: locale === "zh" ? "本课概念" : "Lesson concept",
			text: unit.explanation[locale],
		},
		{
			id: "case",
			label: view.step.title[locale],
			text: view.step.brief[locale],
		},
	];
	for (const [i, fact] of view.step.facts.entries())
		refs.push({
			id: `fact-${i}`,
			label: fact.label[locale],
			text: fact.value[locale],
		});
	for (const e of view.step.evidence)
		if (e.detail)
			refs.push({
				id: `evidence-${e.id}`,
				label: e.title[locale],
				text: JSON.stringify({
					facts: e.detail.facts.map((f) => [f.label[locale], f.value[locale]]),
					note: e.detail.note[locale],
				}),
			});
	if (view.step.worksheet) {
		const sheet = view.step.worksheet;
		for (const [i, row] of sheet.rows.entries())
			refs.push({
				id: `row-${i}`,
				label: `${locale === "zh" ? "数据行" : "Data row"} ${i + 1}`,
				text: sheet.columns.map((c, j) => `${c[locale]}: ${row[j]}`).join("; "),
			});
	}
	// Explicit fixed-close fields only. Never serialize replay, full scenarios or future steps.
	for (const [i, item] of (view.step.neighborhoodPair?.cases ?? []).entries())
		refs.push({
			id: `grid-${i}`,
			label: item.label[locale],
			text: JSON.stringify({
				spot: item.data.spot,
				asOf: item.data.asOf[locale],
				scope: item.data.scope,
				contracts: item.data.contracts.map((c) => ({
					strike: c.strike,
					days: c.days,
					volume: c.volume,
					fresh: c.fresh,
				})),
			}),
		});
	const checked = evaluateStep(scenario.steps[state.step], state);
	return {
		schemaVersion: 1,
		lessonId: record.lessonId,
		scenarioId: record.scenarioId,
		scenarioVersion: record.scenarioVersion,
		attemptRevision: record.revision,
		stepId: view.step.id,
		rubricVersion: config.version,
		locale,
		reason,
		answers: view.step.questions.map((q) => ({
			question: q.prompt[locale],
			answer:
				q.choices.find((c) => c.id === view.answers[q.id])?.label[locale] ??
				view.answers[q.id],
			checked: checked.find((c) => c.questionId === q.id)?.reviewRequired
				? null
				: (checked.find((c) => c.questionId === q.id)?.met ?? null),
		})),
		references: refs,
		criteria: config.criteria.map((c) => ({
			id: c.id,
			guidance: c.guidance[locale],
		})),
	};
}
