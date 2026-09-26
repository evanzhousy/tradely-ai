import { useCallback, useEffect, useRef, useState } from "react";
import { useAnalytics } from "@/analytics/context";
import { authIsConfigured } from "@/auth/client";
import { PracticeCard } from "@/components/practice-card";
import { getTradingFlowLab } from "@/content/tradingflow-labs";
import type { GuestSaveIntent } from "@/domain/guest-learning";
import type {
	LearningAction,
	LearningFailure,
	LearningView,
} from "@/domain/learning/types";
import { useI18n } from "@/i18n/provider";
import { previewLearning } from "@/server/learning";
import {
	guestPromptWasShown,
	markGuestPromptShown,
	prepareGuestHandoff,
	readGuestHandoff,
} from "./guest-handoff";
import { guestSaveCopy } from "./guest-save-copy";
import { LearningScreen } from "./learning-screen";

export function PreviewLearning({
	lessonId,
	currentUserId = null,
	mode,
}: {
	lessonId: string;
	currentUserId?: string | null;
	mode?: "practice" | "check";
}) {
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
	const [prominent, setProminent] = useState(false);
	const [storageError, setStorageError] = useState(false);
	const [accountMismatch, setAccountMismatch] = useState(false);
	const [restoring, setRestoring] = useState(false);
	const restored = useRef(false);
	const promptChecked = useRef(false);
	const pin = useRef<
		| { scenarioId: string; scenarioVersion: number; contentVersion: number }
		| undefined
	>(undefined);

	useEffect(() => {
		if (
			!view?.result ||
			promptChecked.current ||
			!authIsConfigured ||
			getTradingFlowLab(lessonId)
		)
			return;
		promptChecked.current = true;
		try {
			if (guestPromptWasShown(sessionStorage)) return;
			markGuestPromptShown(sessionStorage);
			setProminent(true);
			if (consent === "granted")
				capture("guest_signup_prompt_shown", { lesson_id: lessonId });
		} catch {
			setProminent(true);
		}
	}, [view?.result, capture, consent, lessonId]);
	const saveGuest = (intent: GuestSaveIntent) => {
		if (!view || !pin.current || pending.current) return;
		try {
			const pendingSave = readGuestHandoff(lessonId, sessionStorage);
			if (
				pendingSave.status === "ready" &&
				pendingSave.handoff.boundUserId &&
				pendingSave.handoff.boundUserId !== currentUserId
			) {
				setAccountMismatch(true);
				return;
			}
			prepareGuestHandoff(
				{
					lessonId,
					...pin.current,
					actions: actions.current,
					variant: variant.current,
					intent,
				},
				sessionStorage,
			);
			capture("guest_work_save_requested", { lesson_id: lessonId, intent });
			const target = `/learn/${encodeURIComponent(lessonId)}?saveGuest=1`;
			window.location.assign(
				`/auth/sign-in?returnTo=${encodeURIComponent(target)}`,
			);
		} catch {
			setStorageError(true);
		}
	};
	const dismiss = () => {
		setProminent(false);
		try {
			markGuestPromptShown(sessionStorage);
		} catch {}
		capture("guest_signup_prompt_dismissed", { lesson_id: lessonId });
	};
	useEffect(
		() => () => {
			generation.current++;
			pending.current = false;
			restored.current = false;
		},
		[],
	);
	const run = useCallback(
		async (
			next: LearningAction[],
			nextVariant = variant.current,
			restart = false,
			restore = false,
		) => {
			if (pending.current) return;
			failedRequest.current = { actions: next, variant: nextVariant, restart };
			const consentAtAction = consent === "granted";
			pending.current = true;
			const current = generation.current;
			setBusy(true);
			setError(null);
			try {
				const response = await previewLearning({
					data: {
						lessonId,
						variant: nextVariant,
						actions: next,
						...(restart ? {} : { pin: pin.current }),
					},
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
					if (!restore && !analyticsRun.current.started) {
						analyticsRun.current.started = true;
						if (consentAtAction)
							analyticsRun.current.tracked = capture(
								"preview_exercise_started",
								properties,
							);
					}
					if (
						!restore &&
						response.view.result &&
						!analyticsRun.current.submitted
					) {
						analyticsRun.current.submitted = true;
						if (consentAtAction && analyticsRun.current.tracked)
							capture("preview_exercise_submitted", {
								...properties,
								result: response.view.result.status,
							});
					}
					if (response.view.contentVersion)
						pin.current = {
							scenarioId: response.view.scenarioId,
							scenarioVersion: response.view.scenarioVersion,
							contentVersion: response.view.contentVersion,
						};
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
					setRestoring(false);
				}
			}
		},
		[capture, consent, lessonId],
	);
	useEffect(() => {
		if (restored.current) return;
		restored.current = true;
		try {
			const loaded = readGuestHandoff(lessonId, sessionStorage);
			if (loaded.status === "ready") {
				if (
					loaded.handoff.boundUserId &&
					loaded.handoff.boundUserId !== currentUserId
				) {
					setAccountMismatch(true);
					return;
				}
				const work = loaded.handoff.work;
				pin.current = {
					scenarioId: work.scenarioId,
					scenarioVersion: work.scenarioVersion,
					contentVersion: work.contentVersion,
				};
				setRestoring(true);
				void run(work.actions, work.variant, false, true);
			}
		} catch {
			/* Guest practice still works when storage is unavailable. */
		}
	}, [currentUserId, lessonId, run]);
	return (
		<>
			{accountMismatch ? (
				<p role="alert">{guestSaveCopy.account_changed[locale]}</p>
			) : null}
			{restoring ? (
				<p role="status">{guestSaveCopy.restoring[locale]}</p>
			) : null}
			<LearningScreen
				guestSave={
					authIsConfigured
						? { onSave: saveGuest, onDismiss: dismiss, prominent, storageError }
						: undefined
				}
				lessonId={lessonId}
				locale={locale}
				view={view}
				busy={busy}
				error={error}
				persistence="preview"
				mode={mode}
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
					if (error === "retired") {
						void run([], 0, true);
						return;
					}
					const retry = failedRequest.current;
					void run(
						retry?.actions ?? actions.current,
						retry?.variant ?? variant.current,
						retry?.restart ?? false,
					);
				}}
			/>
			{view?.result ? <PracticeCard lessonId={lessonId} /> : null}
		</>
	);
}
