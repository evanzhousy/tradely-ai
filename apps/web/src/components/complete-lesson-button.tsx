import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@tradely/ui/components/button";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { Lesson } from "@/content/course";
import { saveLessonProgress } from "@/server/progress";

export function CompleteLessonButton({ lesson }: { lesson: Lesson }) {
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
								? "Sign in to save progress"
								: "This lesson could not be saved",
						);
						return;
					}
					toast.success("Lesson completed");
					await router.invalidate();
				} catch {
					toast.error("Progress is unavailable. Your lesson remains open.");
				} finally {
					setPending(false);
				}
			}}
		>
			<CheckIcon data-icon="inline-start" />
			{pending ? "Saving…" : "Complete lesson"}
		</Button>
	);
}
