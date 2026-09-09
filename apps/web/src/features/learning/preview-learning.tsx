import { useEffect, useRef, useState } from "react";
import { useAnalytics } from "@/analytics/context";
import type {
	LearningAction,
	LearningFailure,
	LearningView,
} from "@/domain/learning/types";
import { useI18n } from "@/i18n/provider";
import { previewLearning } from "@/server/learning";
import { LearningScreen } from "./learning-screen";

export function PreviewLearning({ lessonId }: { lessonId: string }) {
	const { locale } = useI18n();
	const { capture, consent } = useAnalytics();
	const analyticsRun = useRef({
		started: false,
		tracked: false,
		submitted: false,
	});
	const [view, setView] = useState<LearningView | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<LearningFailure | null>(null);
	const actions = useRef<LearningAction[]>([]);
	const variant = useRef(0);
	const pending = useRef(false);
	const failedRequest = useRef<{
		actions: LearningAction[];
		variant: number;
		restart: boolean;
	} | null>(null);
	const generation = useRef(0);
	useEffect(
		() => () => {
			generation.current++;
		},
		[],
	);
	async function run(
		next: LearningAction[],
		nextVariant = variant.current,
		restart = false,
	) {
		if (pending.current) return;
		failedRequest.current = { actions: next, variant: nextVariant, restart };
		const consentAtAction = consent === "granted";
		pending.current = true;
		const current = generation.current;
		setBusy(true);
		setError(null);
		try {
			const response = await previewLearning({
				data: { lessonId, variant: nextVariant, actions: next },
			});
			if (current !== generation.current) return;
			if (response.ok) {
				failedRequest.current = null;
				if (restart)
					analyticsRun.current = {
						started: false,
						tracked: false,
						submitted: false,
					};
				const properties = {
					lesson_id: lessonId,
					scenario_id: response.view.scenarioId,
					scenario_version: response.view.scenarioVersion,
				};
				if (!analyticsRun.current.started) {
					analyticsRun.current.started = true;
					if (consentAtAction)
						analyticsRun.current.tracked = capture(
							"preview_exercise_started",
							properties,
						);
				}
				if (response.view.result && !analyticsRun.current.submitted) {
					analyticsRun.current.submitted = true;
					if (consentAtAction && analyticsRun.current.tracked)
						capture("preview_exercise_submitted", {
							...properties,
							result: response.view.result.status,
						});
				}
				actions.current = next;
				variant.current = nextVariant;
				setView(response.view);
			} else setError(response.reason);
		} catch {
			if (current === generation.current) setError("unavailable");
		} finally {
			if (current === generation.current) {
				pending.current = false;
				setBusy(false);
			}
		}
	}
	return (
		<LearningScreen
			lessonId={lessonId}
			locale={locale}
			view={view}
			busy={busy}
			error={error}
			persistence="preview"
			onOpen={(restart) => {
				if (pending.current) return;
				void run(
					restart ? [] : actions.current,
					restart ? (variant.current + 1) % 2 : variant.current,
					restart,
				);
			}}
			onAction={(action) => void run([...actions.current, action])}
			onRecover={() => {
				const retry = failedRequest.current;
				void run(
					retry?.actions ?? actions.current,
					retry?.variant ?? variant.current,
					retry?.restart ?? false,
				);
			}}
		/>
	);
}
