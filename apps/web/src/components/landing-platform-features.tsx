import { BentoCard, BentoGrid } from "@tradely/ui/components/bento-grid";
import { Button } from "@tradely/ui/components/button";
import {
	ArrowRightIcon,
	CheckIcon,
	CloudCheckIcon,
	LanguagesIcon,
	LaptopIcon,
	MousePointer2Icon,
	RotateCcwIcon,
	RouteIcon,
	SmartphoneIcon,
	SparklesIcon,
} from "lucide-react";
import { useId, useState } from "react";
import { coachingCopy } from "@/features/learning/coaching-copy";
import { learningCopy } from "@/features/learning/copy";
import { useI18n } from "@/i18n/provider";

// Public capability previews belong here; account state and AI requests stay in lessons.
export function LandingPlatformFeatures() {
	const { t, locale, setLocale } = useI18n();
	const [revealed, setRevealed] = useState(false);
	const explanationId = useId();
	return (
		<section
			id="research-demo"
			className="observatory-study observatory-container platform-features"
			aria-labelledby="platform-heading"
		>
			<div className="observatory-study-copy">
				<p className="observatory-label">
					<span />
					{t("home.features.label")}
				</p>
				<h2 id="platform-heading">{t("home.features.title")}</h2>
				<p>{t("home.features.description")}</p>
			</div>
			<BentoGrid className="platform-bento">
				<BentoCard
					className="platform-bento-ai"
					eyebrow={
						<>
							<SparklesIcon size={16} aria-hidden="true" />
							{t("home.features.aiLabel")}
							<span className="platform-pilot">{t("home.features.pilot")}</span>
						</>
					}
					title={<h3>{t("home.features.aiTitle")}</h3>}
					description={t("home.features.aiDescription")}
					footer={
						<p className="platform-note">{t("home.features.aiAvailability")}</p>
					}
				>
					<figure className="platform-coaching-preview">
						<figcaption>{t("home.features.aiExample")}</figcaption>
						<div className="platform-explanation">
							<p className="platform-preview-label">
								{coachingCopy.before[locale]}
							</p>
							<blockquote>{t("home.features.aiAnswer")}</blockquote>
						</div>
						<dl className="platform-feedback">
							<div>
								<dt>
									<CheckIcon size={15} aria-hidden="true" />
									{coachingCopy.support[locale]}
								</dt>
								<dd>{t("home.features.aiSupport")}</dd>
							</div>
							<div>
								<dt>
									<RotateCcwIcon size={15} aria-hidden="true" />
									{coachingCopy.gaps[locale]}
								</dt>
								<dd>{t("home.features.aiGap")}</dd>
							</div>
						</dl>
						<div className="platform-followup">
							<p className="platform-preview-label">
								{coachingCopy.question[locale]}
							</p>
							<p>{t("home.features.aiQuestion")}</p>
						</div>
					</figure>
				</BentoCard>
				<BentoCard
					className="platform-bento-progress"
					eyebrow={
						<>
							<CloudCheckIcon size={16} aria-hidden="true" />
							{t("home.features.progressLabel")}
						</>
					}
					title={<h3>{t("home.features.progressTitle")}</h3>}
					description={t("home.features.progressDescription")}
				>
					<div className="platform-sync-devices" aria-hidden="true">
						<LaptopIcon />
						<span />
						<CloudCheckIcon />
						<span />
						<SmartphoneIcon />
					</div>
					<ul className="platform-saved-items">
						<li>
							<CheckIcon size={15} aria-hidden="true" />
							{t("home.features.savedLessons")}
						</li>
						<li>
							<CheckIcon size={15} aria-hidden="true" />
							{t("home.features.savedPractice")}
						</li>
					</ul>
				</BentoCard>
				<BentoCard
					className="platform-bento-practice"
					eyebrow={
						<>
							<MousePointer2Icon size={16} aria-hidden="true" />
							{learningCopy.label[locale]}
						</>
					}
					title={<h3>{t("home.features.practiceTitle")}</h3>}
					description={t("home.features.practiceDescription")}
					footer={
						<Button
							variant="outline"
							aria-expanded={revealed}
							aria-controls={explanationId}
							onClick={() => setRevealed(!revealed)}
						>
							{t(revealed ? "home.demoHide" : "home.demoReveal")}
							{revealed ? (
								<RotateCcwIcon data-icon="inline-end" aria-hidden="true" />
							) : (
								<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
							)}
						</Button>
					}
				>
					<div className="platform-practice-preview">
						<p className="platform-preview-label">
							{t("home.features.practiceExample")}
						</p>
						<p>{t("home.demoQuestion")}</p>
						<div
							id={explanationId}
							className="platform-practice-answer"
							hidden={!revealed}
						>
							<p>{t("home.demoInterpreted")}</p>
						</div>
					</div>
				</BentoCard>
				<BentoCard
					className="platform-bento-path"
					eyebrow={
						<>
							<RouteIcon size={16} aria-hidden="true" />
							{t("home.features.pathLabel")}
						</>
					}
					title={<h3>{t("home.features.pathTitle")}</h3>}
					description={t("home.features.pathDescription")}
					footer={
						<a href="#curriculum" className="observatory-text-link">
							{t("home.explore")}
							<ArrowRightIcon size={16} aria-hidden="true" />
						</a>
					}
				>
					<ol className="platform-learning-steps">
						{(["prediction", "guided", "independent"] as const).map(
							(step, i) => (
								<li key={step}>
									<span aria-hidden="true">0{i + 1}</span>
									{learningCopy[step][locale]}
								</li>
							),
						)}
					</ol>
				</BentoCard>
				<BentoCard
					className="platform-bento-language"
					eyebrow={
						<>
							<LanguagesIcon size={16} aria-hidden="true" />
							{t("home.features.languageLabel")}
						</>
					}
					title={<h3>{t("home.features.languageTitle")}</h3>}
					description={t("home.features.languageDescription")}
					footer={
						<Button
							variant="outline"
							onClick={() => setLocale(locale === "en" ? "zh" : "en")}
						>
							{t("home.features.languageSwitch")}
							<ArrowRightIcon data-icon="inline-end" aria-hidden="true" />
						</Button>
					}
				>
					<div className="platform-language-pair" aria-hidden="true">
						<span lang="en">Aa</span>
						<span lang="zh">文</span>
					</div>
				</BentoCard>
			</BentoGrid>
		</section>
	);
}
