import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { Badge } from "@tradely/ui/components/badge";
import { Button } from "@tradely/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@tradely/ui/components/card";
import {
	Field,
	FieldDescription,
	FieldLabel,
} from "@tradely/ui/components/field";
import { Textarea } from "@tradely/ui/components/textarea";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { canCoach } from "@/domain/coaching/policy";
import type {
	CoachingCommand,
	CoachingFailure,
	CoachingIdentity,
	CoachingResponse,
	CoachingView,
} from "@/domain/coaching/types";
import type { LearningView } from "@/domain/learning/types";
import { coachingCopy, coachingErrors } from "./coaching-copy";
import { CoachingFeedback } from "./coaching-feedback";

export type CoachingTransport = {
	read: (input: CoachingIdentity) => Promise<CoachingResponse>;
	update: (input: CoachingCommand) => Promise<CoachingResponse>;
};
export type CoachingEvent = {
	type:
		| "started"
		| "feedback_viewed"
		| "revision_saved"
		| "cycle_completed"
		| "failed";
	round?: "initial" | "revision";
	reason?: CoachingFailure;
};
export function CoachingPanel({
	view,
	locale,
	blocked,
	onHint,
	transport,
	onEvent,
}: {
	view: LearningView;
	locale: "en" | "zh";
	blocked: boolean;
	onHint: () => void;
	transport: CoachingTransport;
	onEvent?: (event: CoachingEvent) => void;
}) {
	const id = useId();
	const [data, setData] = useState<CoachingView | null>(null);
	const [draft, setDraft] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<CoachingFailure | null>(null);
	const generation = useRef(0);
	const savedReason = useRef("");
	const pending = useRef(false);
	const seen = useRef(new Set<string>());
	const latestRevision = useRef(-1);
	const text = (key: keyof typeof coachingCopy) => coachingCopy[key][locale];
	useEffect(() => {
		generation.current++;
		return () => {
			generation.current++;
		};
	}, []);
	const accept = useCallback(
		(result: CoachingResponse) => {
			if (!result.ok) {
				setError(result.reason);
				return;
			}
			const revision = result.view.session?.revision ?? -1;
			if (revision < latestRevision.current) return;
			latestRevision.current = revision;
			setData(result.view);
			setError(null);
			const nextReason = result.view.session?.draftReason ?? "";
			const previous = savedReason.current;
			setDraft((current) => (current === previous ? nextReason : current));
			savedReason.current = nextReason;
			for (const g of result.view.session?.generations ?? [])
				if (g.feedback && !seen.current.has(g.id)) {
					seen.current.add(g.id);
					onEvent?.({ type: "feedback_viewed", round: g.round });
				}
		},
		[onEvent],
	);
	useEffect(() => {
		let cancelled = false;
		void transport
			.read({ lessonId: view.lessonId, attemptId: view.attemptId })
			.then((result) => {
				if (!cancelled) accept(result);
			})
			.catch(() => {
				if (!cancelled) setError("unavailable");
			});
		return () => {
			cancelled = true;
		};
	}, [transport.read, view.attemptId, view.lessonId, accept]);
	const run = async (action?: CoachingCommand["action"]) => {
		if (pending.current) return;
		pending.current = true;
		setBusy(true);
		setError(null);
		const current = generation.current;
		try {
			const result = action
				? await transport.update({
						lessonId: view.lessonId,
						attemptId: view.attemptId,
						attemptRevision: view.revision,
						sessionRevision: data?.session?.revision ?? null,
						commandId: crypto.randomUUID(),
						locale,
						action,
					})
				: await transport.read({
						lessonId: view.lessonId,
						attemptId: view.attemptId,
					});
			if (current !== generation.current) return;
			accept(result);
			if (!result.ok) onEvent?.({ type: "failed", reason: result.reason });
			else if (action?.type === "review") {
				const g = result.view.session?.generations.find(
					(g) => g.round === action.round,
				);
				if (g)
					onEvent?.({
						type: action.round === "initial" ? "started" : "revision_saved",
						round: action.round,
					});
				if (action.round === "revision" && g?.status === "succeeded")
					onEvent?.({ type: "cycle_completed", round: "revision" });
			}
		} catch {
			if (current === generation.current) {
				setError("unavailable");
				onEvent?.({ type: "failed", reason: "unavailable" });
			}
		} finally {
			if (current === generation.current) {
				setBusy(false);
				pending.current = false;
			}
		}
	};
	const session = data?.session;
	if (!session && !canCoach(view)) return null;
	if (!data?.available && !session && !error) return null;
	if (!session && (error === "not_eligible" || error === "disabled"))
		return null;
	const initial = session?.generations.find((g) => g.round === "initial");
	const revised = session?.generations.find((g) => g.round === "revision");
	const extra = data?.reasonQuestionId === null;
	const dirty = extra && draft !== (session?.draftReason ?? "");
	const editable = !!data?.available && canCoach(view) && !session?.deleted;
	const locked = blocked || busy || !editable;
	const reviewing =
		initial?.status === "running" || revised?.status === "running";
	const problem =
		error ??
		revised?.error ??
		initial?.error ??
		(session && !data?.available ? data?.reason : null);
	const download = () => {
		const lines = ["# Tradely coaching", text("notice")];
		for (const [round, snapshot] of [
			["initial", session?.initial],
			["revision", session?.revised],
		] as const) {
			if (!snapshot) continue;
			lines.push(`## ${round}`, snapshot.reason);
			const feedback = session?.generations.find(
				(g) => g.round === round,
			)?.feedback;
			if (feedback)
				lines.push(
					...[...feedback.strengths, ...feedback.gaps].map((f) => f.text),
					feedback.question ?? "",
					feedback.revisionSummary ?? "",
				);
			lines.push(...snapshot.references.map((r) => `${r.label}: ${r.text}`));
		}
		const url = URL.createObjectURL(
			new Blob([lines.join("\n\n")], { type: "text/markdown;charset=utf-8" }),
		);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = `${view.lessonId}-coaching.md`;
		anchor.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	};
	return (
		<Card data-analytics-private aria-labelledby={`${id}-title`}>
			<CardHeader>
				<CardTitle id={`${id}-title`}>{text("title")}</CardTitle>
				<CardDescription>{text("intro")}</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-5">
				{session?.deleted ? (
					<p role="status">{text("removed")}</p>
				) : (
					<>
						<p className="text-muted-foreground text-xs">{text("notice")}</p>
						{session ? (
							<Badge variant="outline">
								{text("history")}:{" "}
								{session.locale === "zh" ? "中文" : "English"}
							</Badge>
						) : null}
						{problem ? (
							<Alert>
								<AlertTitle>
									{coachingErrors[problem][locale === "zh" ? 1 : 0]}
								</AlertTitle>
								<AlertDescription>
									<Button
										variant="outline"
										size="sm"
										onClick={() => void run()}
										disabled={busy}
									>
										{text("recover")}
									</Button>
								</AlertDescription>
							</Alert>
						) : null}
						{session?.stale ||
						(session?.initial &&
							session.initial.attemptRevision !== view.revision) ? (
							<p className="text-muted-foreground text-xs">{text("stale")}</p>
						) : null}
						{session?.initial ? (
							<section className="flex flex-col gap-3">
								<h4 className="font-medium text-sm">{text("before")}</h4>
								<p className="whitespace-pre-wrap break-words text-sm">
									{session.initial.reason}
								</p>
								{initial?.feedback ? (
									<CoachingFeedback
										key={initial.id}
										feedback={initial.feedback}
										snapshot={session.initial}
										locale={locale}
									/>
								) : null}
							</section>
						) : null}
						{editable && !revised ? (
							extra ? (
								<Field data-disabled={locked || reviewing}>
									<FieldLabel htmlFor={`${id}-reason`}>
										{text("reason")}
									</FieldLabel>
									<Textarea
										id={`${id}-reason`}
										rows={4}
										maxLength={1800}
										value={draft}
										onChange={(e) => setDraft(e.target.value)}
										disabled={locked || reviewing}
										aria-describedby={`${id}-help`}
									/>
									<FieldDescription id={`${id}-help`}>
										{text("reasonHelp")}
									</FieldDescription>
									<Button
										variant="outline"
										size="sm"
										className="self-start"
										disabled={locked || reviewing || !dirty}
										onClick={() => void run({ type: "save", reason: draft })}
									>
										{dirty ? text("save") : text("saved")}
									</Button>
								</Field>
							) : (
								<p className="text-muted-foreground text-sm">
									{text("sourceReason")}
								</p>
							)
						) : null}
						{session?.revised ? (
							<section className="flex flex-col gap-3">
								<h4 className="font-medium text-sm">{text("after")}</h4>
								<p className="whitespace-pre-wrap break-words text-sm">
									{session.revised.reason}
								</p>
								{revised?.feedback ? (
									<CoachingFeedback
										key={revised.id}
										feedback={revised.feedback}
										snapshot={session.revised}
										locale={locale}
									/>
								) : null}
							</section>
						) : null}
						{revised?.status === "succeeded" ? (
							<p role="status" className="text-sm">
								{text("done")}
							</p>
						) : null}
					</>
				)}
			</CardContent>
			{!session?.deleted ? (
				<CardFooter className="flex flex-col items-start gap-3">
					<div className="flex flex-wrap gap-2">
						{editable &&
						!revised &&
						(!initial || initial.status === "succeeded") ? (
							<Button
								disabled={
									locked ||
									dirty ||
									reviewing ||
									(extra && (session?.draftReason.trim().length ?? 0) < 40)
								}
								onClick={() =>
									void run({
										type: "review",
										round: initial ? "revision" : "initial",
									})
								}
							>
								{initial ? text("revision") : text("initial")}
							</Button>
						) : null}
						{editable && !view.step.hint ? (
							<Button variant="ghost" disabled={blocked} onClick={onHint}>
								{text("hint")}
							</Button>
						) : null}
						{session?.initial ? (
							<Button variant="outline" onClick={download}>
								{text("download")}
							</Button>
						) : null}
						{session ? (
							<Button
								variant="ghost"
								disabled={busy}
								onClick={() => void run({ type: "delete" })}
							>
								{text("remove")}
							</Button>
						) : null}
					</div>
					{dirty || (blocked && editable) ? (
						<p className="text-muted-foreground text-xs">{text("draft")}</p>
					) : null}
					{busy || reviewing ? (
						<div role="status" className="flex flex-col gap-2 text-sm">
							<p>{text("working")}</p>
							{reviewing && !busy ? (
								<Button size="sm" variant="outline" onClick={() => void run()}>
									{text("recover")}
								</Button>
							) : null}
						</div>
					) : null}
				</CardFooter>
			) : null}
		</Card>
	);
}
