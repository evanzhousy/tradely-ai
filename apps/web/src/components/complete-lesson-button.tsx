import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@tradely/ui/components/button";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAnalytics } from "@/analytics/context";
import { BrandOwl } from "@/components/brand-owl";
import type { Lesson } from "@/content/course";
import { useI18n } from "@/i18n/provider";
import { saveLessonProgress } from "@/server/progress";

export function CompleteLessonButton({ lesson }: { lesson: Lesson }) {
	const saveProgress = useServerFn(saveLessonProgress);
	const router = useRouter();
	const { t } = useI18n();
	const { capture, captureException } = useAnalytics();
	const [pending, setPending] = useState(false);
	const [confirmedLessonId, setConfirmedLessonId] = useState<string | null>(
		null,
	);

	return (
		<div className="flex flex-col items-start gap-3">
			<Button
				disabled={pending}
				aria-busy={pending}
				onClick={async () => {
					setPending(true);
					try {
						const result = await saveProgress({
							data: {
								lessonId: lesson.id,
								complete: true,
							},
						});
						if (!result.saved) {
							capture("lesson_progress_save_failed", {
								lesson_id: lesson.id,
								reason:
									result.reason === "signed-out"
										? "signed_out"
										: "access_denied",
							});
							toast.error(
								result.reason === "signed-out"
									? t("complete.signInError")
									: t("complete.saveError"),
							);
							return;
						}
						setConfirmedLessonId(lesson.id);
						capture("lesson_completed", {
							lesson_id: lesson.id,
							lesson_order: lesson.order + 1,
						});
						toast.success(t("complete.success"));
						// The save is already confirmed. A failed refresh is a diagnostic
						// error, not a failed lesson completion.
						await router.invalidate().catch((error: unknown) => {
							captureException(error, {
								source: "lesson_completion",
								lesson_id: lesson.id,
							});
						});
					} catch (error) {
						capture("lesson_progress_save_failed", {
							lesson_id: lesson.id,
							reason: "unavailable",
						});
						captureException(error, {
							source: "lesson_completion",
							lesson_id: lesson.id,
						});
						toast.error(t("complete.unavailable"));
					} finally {
						setPending(false);
					}
				}}
			>
				<CheckIcon data-icon="inline-start" aria-hidden="true" />
				{pending ? t("complete.saving") : t("complete.lesson")}
			</Button>
			{confirmedLessonId === lesson.id ? (
				<div className="flex items-center gap-3 text-sm">
					<BrandOwl pose="complete" size={48} />
					<span>{t("complete.success")}</span>
				</div>
			) : null}
		</div>
	);
}
