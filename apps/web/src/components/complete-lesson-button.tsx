import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@tradely/ui/components/button";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { Lesson } from "@/content/course";
import { t } from "@/i18n/ui";
import { useLocale } from "@/i18n/use-locale";
import { saveLessonProgress } from "@/server/progress";

export function CompleteLessonButton({ lesson }: { lesson: Lesson }) {
	const locale = useLocale();
	const saveProgress = useServerFn(saveLessonProgress);
	const router = useRouter();
	const [pending, setPending] = useState(false);

	return (
		<Button
			disabled={pending}
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
								? t(locale, "signInToSave")
								: t(locale, "lessonNotSaved"),
						);
						return;
					}
					toast.success(t(locale, "lessonCompleted"));
					await router.invalidate();
				} catch {
					toast.error(t(locale, "progressUnavailable"));
				} finally {
					setPending(false);
				}
			}}
		>
			<CheckIcon data-icon="inline-start" />
			{pending ? t(locale, "saving") : t(locale, "completeLesson")}
		</Button>
	);
}
