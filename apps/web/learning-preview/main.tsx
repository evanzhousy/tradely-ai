import { useState } from "react";
import { createRoot } from "react-dom/client";
import { tradingFlowCourse } from "../src/content/course";
import { getLessonScenarios } from "../src/content/scenarios/index.server";
import {
	initialAttemptState,
	projectAttempt,
	transitionAttempt,
} from "../src/domain/learning/engine";
import type {
	AttemptState,
	LearningAction,
} from "../src/domain/learning/types";
import { LearningScreen } from "../src/features/learning/learning-screen";
import type { Locale } from "../src/i18n/messages";
import "./preview.css";

function Session({
	lessonId,
	variant,
	locale,
}: {
	lessonId: string;
	variant: number;
	locale: Locale;
}) {
	const scenario = getLessonScenarios(lessonId)[variant];
	const requestedStage = Number(
		new URLSearchParams(location.search).get("stage") ?? 0,
	);
	const [state, setState] = useState(() => stateAt(requestedStage));
	const view = projectAttempt(scenario, state, "local-fixture", 0);
	function stateAt(index: number) {
		if (!Number.isInteger(index) || index < 0 || index >= scenario.steps.length)
			return initialAttemptState();
		let next = initialAttemptState();
		for (let i = 0; i < index; i++) {
			const step = scenario.steps[i];
			for (const evidenceId of step.requiredEvidence)
				next = transitionAttempt(scenario, next, {
					type: "inspect",
					evidenceId,
				});
			for (const question of step.questions)
				next = transitionAttempt(scenario, next, {
					type: "answer",
					questionId: question.id,
					choiceId: question.accepted[0],
				});
			next = transitionAttempt(scenario, next, { type: "submit" });
			next = transitionAttempt(scenario, next, { type: "continue" });
		}
		return next;
	}
	const act = (action: LearningAction) =>
		setState((state: AttemptState) =>
			transitionAttempt(scenario, state, action),
		);
	return (
		<div className="flex flex-col gap-5">
			<label className="flex min-w-0 max-w-full flex-col gap-1 text-sm">
				Review stage (earlier answers prefilled for this local preview){" "}
				<select
					className="rounded border p-2"
					value={state.step}
					onChange={(event) => setState(stateAt(Number(event.target.value)))}
				>
					{scenario.steps.map((step, index) => (
						<option key={step.id} value={index}>
							{index + 1}. {step.title[locale]}
						</option>
					))}
				</select>
			</label>
			<LearningScreen
				lessonId={lessonId}
				locale={locale}
				view={view}
				persistence="preview"
				busy={false}
				error={null}
				onOpen={() => setState(initialAttemptState())}
				onAction={act}
				onRecover={() => setState(initialAttemptState())}
			/>
		</div>
	);
}
function App() {
	const requested = new URLSearchParams(location.search).get("lesson");
	const [lessonId, setLessonId] = useState(
		tradingFlowCourse.lessons.find((item) => item.id === requested)?.id ??
			"rank-contracts",
	);
	const [variant, setVariant] = useState(0);
	const [locale, setLocale] = useState<Locale>("en");
	return (
		<main className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-8">
			<h1 className="font-semibold text-2xl">Tradely · Lesson review</h1>
			<p className="text-muted-foreground text-sm">
				Local synthetic fixtures. Decisions reset on reload; no identity,
				database, analytics, or billing is connected.
			</p>
			<div className="flex flex-wrap items-center gap-3">
				<label className="flex min-w-0 max-w-full flex-col gap-1 text-sm">
					Lesson{" "}
					<select
						className="min-w-0 max-w-full rounded border p-2"
						value={lessonId}
						onChange={(event) =>
							setLessonId(event.target.value as typeof lessonId)
						}
					>
						{tradingFlowCourse.lessons.map((item) => (
							<option key={item.id} value={item.id}>
								{item.order + 1}. {item.title}
							</option>
						))}
					</select>
				</label>
				<label className="flex min-w-0 max-w-full flex-col gap-1 text-sm">
					Variant{" "}
					<select
						className="rounded border p-2"
						value={variant}
						onChange={(event) => setVariant(Number(event.target.value))}
					>
						<option value={0}>A</option>
						<option value={1}>B</option>
					</select>
				</label>
				<label className="flex min-w-0 max-w-full flex-col gap-1 text-sm">
					Language{" "}
					<select
						className="rounded border p-2"
						value={locale}
						onChange={(event) => {
							setLocale(event.target.value as Locale);
							document.documentElement.lang = event.target.value;
						}}
					>
						<option value="en">English</option>
						<option value="zh">简体中文</option>
					</select>
				</label>
				<button
					type="button"
					className="rounded border p-2"
					onClick={() => document.documentElement.classList.toggle("dark")}
				>
					Toggle theme
				</button>
			</div>
			<Session
				key={lessonId + variant}
				lessonId={lessonId}
				variant={variant}
				locale={locale}
			/>
		</main>
	);
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing preview root");
createRoot(root).render(<App />);
