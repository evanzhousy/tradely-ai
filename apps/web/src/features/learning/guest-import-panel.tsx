import { useServerFn } from "@tanstack/react-start";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { Button, buttonVariants } from "@tradely/ui/components/button";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAnalytics } from "@/analytics/context";
import type { GuestImportFailure } from "@/domain/guest-learning";
import { useI18n } from "@/i18n/provider";
import { importGuestLearning } from "@/server/learning";
import {
	clearGuestHandoff,
	type GuestHandoff,
	readGuestHandoff,
	writeGuestHandoff,
} from "./guest-handoff";
import { guestSaveCopy as copy } from "./guest-save-copy";

type Failure = GuestImportFailure | "missing" | "expired" | "invalid";
export function GuestImportPanel({
	lessonId,
	userId,
	email,
	onSaved,
	onResume,
	onGuest,
}: {
	lessonId: string;
	userId: string;
	email: string | null;
	onSaved: (attemptId: string) => void;
	onResume: (attemptId: string) => void;
	onGuest: () => void;
}) {
	const { locale } = useI18n();
	const { capture } = useAnalytics();
	const submit = useServerFn(importGuestLearning);
	const [handoff, setHandoff] = useState<GuestHandoff | null>(null);
	const [failure, setFailure] = useState<Failure | null>(null);
	const [busy, setBusy] = useState(false);
	const [existingId, setExistingId] = useState<string>();
	const [canSeparate, setCanSeparate] = useState(false);
	const active = useRef(true);
	const pending = useRef(false);
	const attempted = useRef(false);
	useEffect(() => {
		active.current = true;
		return () => {
			active.current = false;
		};
	}, []);
	useEffect(() => {
		try {
			const loaded = readGuestHandoff(lessonId, sessionStorage);
			if (loaded.status !== "ready") {
				setFailure(loaded.status);
				return;
			}
			let record = loaded.handoff;
			if (!record.boundUserId) {
				record = { ...record, boundUserId: userId };
				writeGuestHandoff(record, sessionStorage);
			}
			setHandoff(record);
			if (record.boundUserId !== userId) setFailure("account_changed");
		} catch {
			setFailure("unavailable");
		}
	}, [lessonId, userId]);
	const save = useCallback(
		async (separate = false) => {
			if (!handoff || pending.current || handoff.boundUserId !== userId) return;
			pending.current = true;
			setBusy(true);
			setFailure(null);
			try {
				const result = await submit({
					data: {
						transferId: handoff.transferId,
						expectedUserId: userId,
						work: handoff.work,
						saveSeparately: separate,
					},
				});
				if (!active.current) return;
				if (!result.ok) {
					setFailure(result.reason);
					setExistingId(result.existingAttemptId);
					setCanSeparate(result.canSaveSeparately === true);
					capture("guest_work_import_failed", {
						lesson_id: lessonId,
						reason: result.reason,
					});
					return;
				}
				if (!result.replayed)
					capture("guest_work_import_succeeded", {
						lesson_id: lessonId,
						intent: handoff.work.intent,
						completed: result.completed,
					});
				try {
					clearGuestHandoff(lessonId, handoff.transferId, sessionStorage);
				} catch {
					/* Server confirmation is durable; a retained copy is safe to retry. */
				}
				onSaved(result.view.attemptId);
			} catch {
				if (active.current) {
					setFailure("unavailable");
					capture("guest_work_import_failed", {
						lesson_id: lessonId,
						reason: "unavailable",
					});
				}
			} finally {
				pending.current = false;
				if (active.current) setBusy(false);
			}
		},
		[capture, handoff, lessonId, onSaved, submit, userId],
	);
	useEffect(() => {
		if (handoff && !failure && !attempted.current) {
			attempted.current = true;
			void save();
		}
	}, [handoff, failure, save]);
	const confirm = () => {
		if (!handoff) return;
		try {
			const next = { ...handoff, boundUserId: userId };
			writeGuestHandoff(next, sessionStorage);
			attempted.current = false;
			setHandoff(next);
			setFailure(null);
		} catch {
			setFailure("unavailable");
		}
	};
	const reason =
		failure && Object.hasOwn(copy, failure)
			? copy[failure as keyof typeof copy][locale]
			: copy.unavailable[locale];
	return (
		<Alert aria-busy={busy}>
			<AlertTitle>
				{busy || !failure ? copy.saving[locale] : copy.recovery[locale]}
			</AlertTitle>
			<AlertDescription className="flex flex-col gap-3">
				{email ? <p className="break-all">{email}</p> : null}
				{failure ? (
					<p role="alert">{reason}</p>
				) : (
					<p role="status">{copy.saving[locale]}</p>
				)}
				{handoff ? <p>{copy.retained[locale]}</p> : null}
				<div className="flex flex-wrap gap-3">
					{failure === "existing_work" && existingId ? (
						<Button onClick={() => onResume(existingId)}>
							{copy.resume[locale]}
						</Button>
					) : null}
					{failure === "existing_work" && canSeparate ? (
						<Button
							variant="outline"
							disabled={busy}
							onClick={() => void save(true)}
						>
							{copy.separate[locale]}
						</Button>
					) : null}
					{failure === "account_changed" ? (
						<Button onClick={confirm}>{copy.confirmAccount[locale]}</Button>
					) : null}
					{failure === "unavailable" && handoff ? (
						<Button disabled={busy} onClick={() => void save()}>
							{copy.retry[locale]}
						</Button>
					) : null}
					{handoff ? (
						<Button variant="ghost" disabled={busy} onClick={onGuest}>
							{copy.guest[locale]}
						</Button>
					) : (
						<a
							href={`/learn/${encodeURIComponent(lessonId)}`}
							className={buttonVariants({ variant: "outline" })}
						>
							{copy.returnLesson[locale]}
						</a>
					)}
				</div>
			</AlertDescription>
		</Alert>
	);
}
