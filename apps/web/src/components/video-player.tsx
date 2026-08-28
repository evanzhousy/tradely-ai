import { useServerFn } from "@tanstack/react-start";
import { useRef } from "react";

import { useAnalytics } from "@/analytics/context";
import type { Lesson, LessonMedia } from "@/content/course";
import { useI18n } from "@/i18n/provider";
import { saveLessonProgress } from "@/server/progress";

export function LessonVideo({
	lesson,
	media,
	initialPositionSeconds = 0,
}: {
	lesson: Lesson;
	media: LessonMedia;
	initialPositionSeconds?: number;
}) {
	const { t } = useI18n();
	const { capture } = useAnalytics();
	const saveProgress = useServerFn(saveLessonProgress);
	const lastSavedSecond = useRef(initialPositionSeconds);
	const startedCaptured = useRef(false);

	const persistPosition = async (seconds: number) => {
		const rounded = Math.max(0, Math.round(seconds));
		if (Math.abs(rounded - lastSavedSecond.current) < 5) return;
		lastSavedSecond.current = rounded;
		try {
			await saveProgress({
				data: {
					lessonId: lesson.id,
					lastPositionSeconds: rounded,
				},
			});
		} catch {
			// Video playback must remain usable if optional progress persistence is unavailable.
		}
	};

	return (
		<div className="overflow-hidden rounded-4xl bg-card shadow-md ring-1 ring-foreground/5 dark:ring-foreground/10">
			<video
				controls
				playsInline
				preload="metadata"
				poster={media.poster}
				className="aspect-video w-full bg-black object-cover"
				aria-label={`${lesson.title} video`}
				aria-describedby="lesson-video-description"
				onLoadedMetadata={(event) => {
					if (
						initialPositionSeconds > 0 &&
						initialPositionSeconds < event.currentTarget.duration - 2
					) {
						event.currentTarget.currentTime = initialPositionSeconds;
					}
				}}
				onPause={(event) =>
					void persistPosition(event.currentTarget.currentTime)
				}
				onPlay={(event) => {
					if (startedCaptured.current) return;
					if (
						capture("lesson_video_started", {
							lesson_id: lesson.id,
							position_seconds: Math.max(
								0,
								Math.round(event.currentTarget.currentTime),
							),
						})
					) {
						startedCaptured.current = true;
					}
				}}
				onEnded={(event) => {
					capture("lesson_video_completed", {
						lesson_id: lesson.id,
						duration_seconds: Math.max(
							0,
							Math.round(event.currentTarget.duration),
						),
					});
					void persistPosition(event.currentTarget.duration);
				}}
			>
				<source src={media.video} type="video/mp4" />
				<track
					kind="captions"
					src={media.captions}
					srcLang="en"
					label={t("language.english")}
					default
				/>
				{t("video.browserFallback")}
			</video>
			<p
				id="lesson-video-description"
				className="px-5 py-3 text-muted-foreground text-xs"
			>
				{t("video.accessibleDescription")}
			</p>
		</div>
	);
}
