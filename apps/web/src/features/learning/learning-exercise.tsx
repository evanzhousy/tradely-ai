import { Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { Button, buttonVariants } from "@tradely/ui/components/button";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAnalytics } from "@/analytics/context";
import { authIsConfigured, useAuth } from "@/auth/client";
import { PracticeCard } from "@/components/practice-card";
import { getLessonById, getNextLesson } from "@/content/course";
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
import { GuestImportPanel } from "./guest-import-panel";
import { guestSaveCopy } from "./guest-save-copy";
import { LearningScreen } from "./learning-screen";
import { PreviewLearning } from "./preview-learning";

type LearningExerciseProps = {
	lessonId: string;
	attemptId?: string;
	saveGuest?: boolean;
	onSelectAttempt?: (attemptId: string) => void;
};
function LearningSession({
	lessonId,
	attemptId,
	onSelectAttempt,
}: LearningExerciseProps) {
	const { locale } = useI18n();
	const { capture, captureException } = useAnalytics();
	const router = useRouter();
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
			pending.current = false;
		};
	}, []);

	const run = useCallback(
		async (
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
						? await open({
								data: {
									lessonId,
									restart: request.restart,
									...(!request.restart ? { attemptId } : {}),
								},
							})
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
				if (request.kind === "open") {
					capture("lesson_exercise_started", properties);
					onSelectAttempt?.(response.view.attemptId);
				}
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
					void router.invalidate().catch((error: unknown) =>
						captureException(error, {
							source: "route_boundary",
							lesson_id: lessonId,
						}),
					);
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
		},
		[
			attemptId,
			capture,
			captureException,
			router,
			lessonId,
			onSelectAttempt,
			open,
			update,
		],
	);
	useEffect(() => {
		if (attemptId && view?.attemptId !== attemptId && !pending.current)
			void run({ kind: "open", restart: false });
	}, [attemptId, run, view?.attemptId]);
	const nextLesson = getNextLesson(lessonId);

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
		<>
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
			{view?.result ? (
				<>
					<Alert>
						<AlertTitle>{guestSaveCopy.saved[locale]}</AlertTitle>
						<AlertDescription>
							{nextLesson ? (
								<Link
									to="/learn/$lessonSlug"
									params={{ lessonSlug: nextLesson.slug }}
									className={buttonVariants()}
								>
									{guestSaveCopy.next[locale]}
								</Link>
							) : null}
						</AlertDescription>
					</Alert>
					<PracticeCard lessonId={lessonId} />
				</>
			) : null}
		</>
	);
}

function AuthenticatedLearning({
	lessonId,
	attemptId,
	saveGuest,
	onSelectAttempt,
}: LearningExerciseProps) {
	const { userId, isLoaded, error, email } = useAuth();
	const { t } = useI18n();
	const [guest, setGuest] = useState(false);
	if (guest)
		return (
			<PreviewLearning
				key={`${userId ?? "guest"}:${lessonId}`}
				lessonId={lessonId}
				currentUserId={isLoaded && !error ? userId : null}
			/>
		);
	if (!isLoaded || error)
		return (
			<div className="flex flex-col items-start gap-3">
				<p role="status">
					{t(error ? "complete.unavailable" : "auth.loading")}
				</p>
				<Button onClick={() => setGuest(true)}>
					{t("complete.practiceAsGuest")}
				</Button>
			</div>
		);
	if (!userId)
		return getLessonById(lessonId) ? (
			<PreviewLearning key={lessonId} lessonId={lessonId} />
		) : null;
	if (saveGuest)
		return (
			<GuestImportPanel
				key={`${userId}:${lessonId}`}
				lessonId={lessonId}
				userId={userId}
				email={email}
				onSaved={(id) => {
					window.location.replace(
						`/learn/${encodeURIComponent(lessonId)}?attempt=${encodeURIComponent(id)}`,
					);
				}}
				onResume={(id) => {
					window.location.assign(
						`/learn/${encodeURIComponent(lessonId)}?attempt=${encodeURIComponent(id)}`,
					);
				}}
				onGuest={() => setGuest(true)}
			/>
		);
	// Changing authentication identity destroys the prior account's view and pending requests.
	return (
		<LearningSession
			key={`${userId}:${lessonId}`}
			lessonId={lessonId}
			attemptId={attemptId}
			onSelectAttempt={onSelectAttempt}
		/>
	);
}

export function LearningExercise({
	lessonId,
	...props
}: LearningExerciseProps) {
	return authIsConfigured ? (
		<AuthenticatedLearning key={lessonId} lessonId={lessonId} {...props} />
	) : getLessonById(lessonId) ? (
		<PreviewLearning key={lessonId} lessonId={lessonId} />
	) : null;
}
