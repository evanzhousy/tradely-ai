import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@tradely/ui/components/button";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { Lesson } from "@/content/course";
import { useI18n } from "@/i18n/provider";
import { saveLessonProgress } from "@/server/progress";

export function CompleteLessonButton({ lesson }: { lesson: Lesson }) {
	const saveProgress = useServerFn(saveLessonProgress);
	const router = useRouter();
	const { t } = useI18n();
	const [pending, setPending] = useState(false);

	return (
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
						toast.error(
							result.reason === "signed-out"
								? t("complete.signInError")
								: t("complete.saveError"),
						);
						return;
					}
					toast.success(t("complete.success"));
					await router.invalidate();
				} catch {
					toast.error(t("complete.unavailable"));
				} finally {
					setPending(false);
				}
			}}
		>
			<CheckIcon data-icon="inline-start" aria-hidden="true" />
			{pending ? t("complete.saving") : t("complete.lesson")}
		</Button>
	);
}
