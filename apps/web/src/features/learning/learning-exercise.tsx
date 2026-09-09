import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAnalytics } from "@/analytics/context";
import { authIsConfigured, useAuth } from "@/auth/client";
import { getLessonById } from "@/content/course";
import type {
	LearningAction,
	LearningFailure,
	LearningView,
} from "@/domain/learning/types";
import { useI18n } from "@/i18n/provider";
import { getCoaching, updateCoaching } from "@/server/coaching";
import {
	openLearning,
	type UpdateLearningInput,
	updateLearning,
} from "@/server/learning";
import type { CoachingEvent, CoachingTransport } from "./coaching-panel";
import type { ContractRenderer } from "./contract-explorer";
import { LearningScreen } from "./learning-screen";
import { PreviewLearning } from "./preview-learning";

function LearningSession({ lessonId }: { lessonId: string }) {
	const { locale } = useI18n();
	const { capture } = useAnalytics();
	const open = useServerFn(openLearning);
	const update = useServerFn(updateLearning);
	const readCoach = useServerFn(getCoaching);
	const updateCoach = useServerFn(updateCoaching);
	const coachingTransport = useMemo<CoachingTransport>(
		() => ({
			read: (data) => readCoach({ data }),
			update: (data) => updateCoach({ data }),
		}),
		[readCoach, updateCoach],
	);
	const [view, setView] = useState<LearningView | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<LearningFailure | null>(null);
	const pending = useRef(false);
	const generation = useRef(0);
	const failedCommand = useRef<UpdateLearningInput | null>(null);
	const capturedResult = useRef<string | null>(null);
	const scenarioId = view?.scenarioId;
	const scenarioVersion = view?.scenarioVersion;
	const onCoachingEvent = useCallback(
		(event: CoachingEvent) => {
			if (!scenarioId || !scenarioVersion) return;
			capture(`lesson_coach_${event.type}`, {
				lesson_id: lessonId,
				scenario_id: scenarioId,
				scenario_version: scenarioVersion,
				locale,
				round: event.round,
				reason: event.reason,
			});
		},
		[capture, lessonId, scenarioId, scenarioVersion, locale],
	);
	const onRendererChange = useCallback(
		(renderer: ContractRenderer, reason: "selected" | "unavailable") => {
			if (scenarioId && scenarioVersion)
				capture("lesson_renderer_changed", {
					lesson_id: lessonId,
					scenario_id: scenarioId,
					scenario_version: scenarioVersion,
					renderer,
					reason,
				});
		},
		[capture, lessonId, scenarioId, scenarioVersion],
	);
	useEffect(() => {
		generation.current += 1;
		return () => {
			generation.current += 1;
		};
	}, []);

	const run = async (
		request:
			| { kind: "open"; restart: boolean }
			| { kind: "update"; data: UpdateLearningInput },
	) => {
		if (pending.current) return;
		const currentGeneration = generation.current;
		pending.current = true;
		setBusy(true);
		setError(null);
		try {
			const response =
				request.kind === "open"
					? await open({ data: { lessonId, restart: request.restart } })
					: await update({ data: request.data });
			if (currentGeneration !== generation.current) return;
			if (!response.ok) {
				setError(response.reason);
				failedCommand.current =
					request.kind === "update" && response.reason === "unavailable"
						? request.data
						: null;
				if (
					["access_denied", "signed_out", "not_found", "retired"].includes(
						response.reason,
					)
				)
					setView(null);
				capture("lesson_exercise_save_failed", {
					lesson_id: lessonId,
					reason: response.reason,
				});
				return;
			}
			failedCommand.current = null;
			setView(response.view);
			const properties = {
				lesson_id: lessonId,
				scenario_id: response.view.scenarioId,
				scenario_version: response.view.scenarioVersion,
			};
			if (request.kind === "open")
				capture("lesson_exercise_started", properties);
			if (request.kind === "update" && request.data.action.type === "hint")
				capture("lesson_hint_opened", {
					...properties,
					stage: response.view.step.kind,
				});
			if (
				request.kind === "update" &&
				response.view.result &&
				capturedResult.current !== response.view.attemptId
			) {
				capturedResult.current = response.view.attemptId;
				capture("lesson_exercise_submitted", {
					...properties,
					criteria_met: response.view.result.met,
					criteria_total: response.view.result.total,
					result: response.view.result.status,
				});
			}
		} catch {
			if (currentGeneration !== generation.current) return;
			failedCommand.current = request.kind === "update" ? request.data : null;
			setError("unavailable");
			capture("lesson_exercise_save_failed", {
				lesson_id: lessonId,
				reason: "unavailable",
			});
		} finally {
			if (currentGeneration === generation.current) {
				pending.current = false;
				setBusy(false);
			}
		}
	};

	const act = (action: LearningAction) => {
		if (!view || pending.current || error) return;
		void run({
			kind: "update",
			data: {
				lessonId,
				attemptId: view.attemptId,
				revision: view.revision,
				commandId: crypto.randomUUID(),
				action,
			},
		});
	};
	return (
		<LearningScreen
			coachingTransport={coachingTransport}
			onCoachingEvent={onCoachingEvent}
			lessonId={lessonId}
			onRendererChange={onRendererChange}
			locale={locale}
			view={view}
			busy={busy}
			error={error}
			onOpen={(restart = false) => {
				void run({ kind: "open", restart });
			}}
			onAction={act}
			onRecover={() => {
				void run(
					failedCommand.current
						? { kind: "update", data: failedCommand.current }
						: { kind: "open", restart: error === "retired" },
				);
			}}
		/>
	);
}

function AuthenticatedLearning({ lessonId }: { lessonId: string }) {
	const { userId, isLoaded } = useAuth();
	if (!isLoaded) return null;
	if (!userId)
		return getLessonById(lessonId)?.access === "preview" ? (
			<PreviewLearning key={lessonId} lessonId={lessonId} />
		) : null;
	// Changing authentication identity destroys the prior account's view and pending requests.
	return <LearningSession key={`${userId}:${lessonId}`} lessonId={lessonId} />;
}

export function LearningExercise({ lessonId }: { lessonId: string }) {
	return authIsConfigured ? (
		<AuthenticatedLearning lessonId={lessonId} />
	) : getLessonById(lessonId)?.access === "preview" ? (
		<PreviewLearning key={lessonId} lessonId={lessonId} />
	) : null;
}
