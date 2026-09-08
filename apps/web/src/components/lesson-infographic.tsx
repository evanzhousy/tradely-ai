import { useId } from "react";
import type { Locale } from "@/i18n/messages";
import { useLessonInfographicMotion } from "./lesson-infographic-motion";
import { courseCardScenes } from "./lesson-infographic-scenes";

export const lessonInfographicSubjects = Object.keys(courseCardScenes);

// Public concept illustrations own presentation, never lesson evidence or grading.
export function LessonInfographic({
	subject,
	locale,
	motionEnabled = true,
}: {
	subject: string;
	locale: Locale;
	motionEnabled?: boolean;
}) {
	const id = useId();
	const ref = useLessonInfographicMotion(subject, motionEnabled);
	const scene = courseCardScenes[subject];
	if (!scene) return null;
	const { Diagram } = scene;
	return (
		<svg
			ref={ref}
			className="lesson-infographic"
			viewBox="0 0 360 216"
			textAnchor="middle"
			role="img"
			aria-labelledby={id}
			data-lesson-graphic={subject}
			data-motion-rate="2"
		>
			<title id={id}>{scene.description[locale === "zh" ? 1 : 0]}</title>
			<path
				d="M24 48h312M24 96h312M24 144h312M24 192h312M60 24v168M120 24v168M180 24v168M240 24v168M300 24v168"
				className="diagram-grid"
			/>
			<Diagram l={(en, zh) => (locale === "zh" ? zh : en)} />
		</svg>
	);
}
