import { ArrowUpRightIcon, CheckIcon, CornerDownRightIcon } from "lucide-react";
import type { Lesson } from "@/content/course";
import { useI18n } from "@/i18n/provider";

// A decorative preview of the course's research method, never live market data.
export function LandingStudyMaterials({ lesson }: { lesson: Lesson }) {
	const { t } = useI18n();
	return (
		<div className="landing-materials" aria-hidden="true">
			<div className="landing-field-guide">
				<div className="landing-book-spine">Tradely</div>
				<div className="landing-book-cover">
					<span className="landing-artifact-label">{t("home.guideLabel")}</span>
					<p>{t("home.guideTitle")}</p>
					<svg
						className="landing-guide-diagram"
						viewBox="0 0 200 150"
						fill="none"
						aria-hidden="true"
					>
						<path
							d="M25 118V36h55v42h48V20h47M25 118h150M80 78v40m48-40v40"
							stroke="currentColor"
							strokeWidth="1.5"
						/>
						<circle cx="25" cy="36" r="9" fill="currentColor" />
						<circle cx="80" cy="78" r="9" fill="currentColor" />
						<circle cx="128" cy="20" r="9" fill="currentColor" />
						<circle
							cx="175"
							cy="20"
							r="9"
							stroke="currentColor"
							strokeWidth="1.5"
						/>
						<path
							d="M16 135h18m37 0h18m30 0h18m29 0h18"
							stroke="currentColor"
						/>
					</svg>
					<div className="landing-book-signature">
						<span>Tradely.ai</span>
						<ArrowUpRightIcon size={17} />
					</div>
				</div>
			</div>
			<div className="landing-research-note">
				<span className="landing-note-tape" />
				<span className="landing-artifact-label">{t("home.noteLabel")}</span>
				<p className="landing-note-title">{lesson.title}</p>
				<p className="landing-note-summary">{lesson.summary}</p>
				<div className="landing-note-checks">
					{(
						[
							"home.noteQuestion",
							"home.noteSource",
							"home.noteInvalidation",
						] as const
					).map((key) => (
						<span key={key}>
							<CheckIcon size={13} />
							{t(key)}
						</span>
					))}
				</div>
				<span className="landing-note-time">
					{t("common.minutes", { minutes: lesson.minutes })} <span>↗</span>
				</span>
			</div>
			<div className="landing-margin-note">
				<CornerDownRightIcon size={20} />
				<p>{t("home.marginNote")}</p>
			</div>
			<div className="landing-practice-slip">
				<span className="landing-artifact-label">
					{t("home.practiceSlipLabel")}
				</span>
				<p>{t("home.practiceSlipTitle")}</p>
				<div>
					<span>{t("home.observe")}</span>
					<span>→</span>
					<span>{t("home.question")}</span>
					<span>→</span>
					<span>{t("home.verify")}</span>
				</div>
			</div>
		</div>
	);
}
