import { useEffect, useRef, useState } from "react";
import type {
	LearningAction,
	LearningFailure,
	LearningView,
} from "@/domain/learning/types";
import { useI18n } from "@/i18n/provider";
import { previewLearning } from "@/server/learning";
import { LearningScreen } from "./learning-screen";

export function PreviewLearning({ lessonId }: { lessonId: string }) {
	const { locale } = useI18n();
	const [view, setView] = useState<LearningView | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<LearningFailure | null>(null);
	const actions = useRef<LearningAction[]>([]);
	const variant = useRef(0);
	const pending = useRef(false);
	const generation = useRef(0);
	useEffect(
		() => () => {
			generation.current++;
		},
		[],
	);
	async function run(next: LearningAction[], nextVariant = variant.current) {
		if (pending.current) return;
		pending.current = true;
		const current = generation.current;
		setBusy(true);
		setError(null);
		try {
			const response = await previewLearning({
				data: { lessonId, variant: nextVariant, actions: next },
			});
			if (current !== generation.current) return;
			if (response.ok) {
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
			}
		}
	}
	return (
		<LearningScreen
			lessonId={lessonId}
			locale={locale}
			view={view}
			busy={busy}
			error={error}
			persistence="preview"
			onOpen={(restart) =>
				void run(
					restart ? [] : actions.current,
					restart ? (variant.current + 1) % 2 : variant.current,
				)
			}
			onAction={(action) => void run([...actions.current, action])}
			onRecover={() => void run(actions.current)}
		/>
	);
}
