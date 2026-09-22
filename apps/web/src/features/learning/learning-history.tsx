import { useServerFn } from "@tanstack/react-start";
import { Alert, AlertDescription } from "@tradely/ui/components/alert";
import { Spinner } from "@tradely/ui/components/spinner";
import { Surface } from "@tradely/ui/components/surface";
import { useEffect, useState } from "react";
import type { LearningResponse } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { openLearning } from "@/server/learning";

/** An explicit attempt ID uses the owner-scoped read path; no attempt is created or updated. */
export function LearningHistory({
	lessonId,
	attemptId,
	locale,
}: {
	lessonId: string;
	attemptId: string;
	locale: Locale;
}) {
	const read = useServerFn(openLearning);
	const [response, setResponse] = useState<LearningResponse | null>(null);
	useEffect(() => {
		let active = true;
		setResponse(null);
		read({ data: { lessonId, attemptId, restart: false } })
			.then((result) => {
				if (active) setResponse(result);
			})
			.catch(() => {
				if (active) setResponse({ ok: false, reason: "unavailable" });
			});
		return () => {
			active = false;
		};
	}, [lessonId, attemptId, read]);
	if (!response)
		return (
			<p role="status" className="flex items-center gap-2">
				<Spinner size="sm" aria-hidden="true" />
				<span>
					{locale === "zh" ? "正在读取历史记录…" : "Loading your saved work…"}
				</span>
			</p>
		);
	if (!response.ok)
		return (
			<Alert role="status">
				<AlertDescription>
					{locale === "zh"
						? "历史记录暂不可用。请确认已登录并重试。"
						: "Saved work is unavailable. Check that you are signed in and try again."}
				</AlertDescription>
			</Alert>
		);
	const view = response.view;
	const work = view.work ?? view.sourceWork;
	return (
		<div className="flex flex-col gap-5">
			<p className="text-muted-foreground text-sm">
				{locale === "zh"
					? "旧版学习记录 · 只读"
					: "Earlier learning record · Read only"}
			</p>
			{view.result ? (
				<p>
					{view.result.met} / {view.result.total}{" "}
					{locale === "zh" ? "项原版检查通过" : "original checks met"}
				</p>
			) : (
				<p>
					{locale === "zh"
						? "这份历史记录尚未提交。"
						: "This earlier attempt was not submitted."}
				</p>
			)}
			{view.feedback.map((item) => (
				<Surface
					key={item.questionId}
					variant="secondary"
					className="flex flex-col gap-2 p-3"
				>
					<p className="font-medium">{item.prompt[locale]}</p>
					<p>{item.selected[locale]}</p>
					<p className="text-muted-foreground text-sm">
						{item.explanation[locale]}
					</p>
				</Surface>
			))}
			{work?.fields.map((field, index) => (
				<Surface
					key={`${index}:${field.label.en}`}
					variant="secondary"
					className="p-3"
				>
					<p className="font-medium">{field.label[locale]}</p>
					<p className="whitespace-pre-wrap">
						{field.localizedValue?.[locale] ?? field.value}
					</p>
				</Surface>
			))}
		</div>
	);
}
