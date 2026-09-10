import { BentoCard, BentoGrid } from "@tradely/ui/components/bento-grid";
import { Button } from "@tradely/ui/components/button";
import {
	ArrowRightIcon,
	CloudCheckIcon,
	LanguagesIcon,
	MousePointer2Icon,
	RouteIcon,
	SparklesIcon,
} from "lucide-react";
import { useState } from "react";
import { learningCopy } from "@/features/learning/copy";
import { useI18n } from "@/i18n/provider";

import {
	CoachingNotesWidget,
	EvidenceChecklistWidget,
	LearningCheckpointsWidget,
} from "./landing-platform-widgets";
import {
	initialSampleCheckpoints,
	type SampleCheckpointId,
} from "./platform-widget-copy";

// Public capability previews belong here; account state and AI requests stay in lessons.
export function LandingPlatformFeatures() {
	const { t, locale, setLocale } = useI18n();
	const [checked, setChecked] = useState<readonly SampleCheckpointId[]>(
		initialSampleCheckpoints,
	);
	const toggleCheckpoint = (id: SampleCheckpointId) =>
		setChecked((current) =>
			current.includes(id)
				? current.filter((item) => item !== id)
				: [...current, id],
		);
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
					<CoachingNotesWidget
						locale={locale}
						caption={t("home.features.aiExample")}
						explanation={t("home.features.aiAnswer")}
						feedback={t("home.features.aiGap")}
						question={t("home.features.aiQuestion")}
					/>
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
					<LearningCheckpointsWidget locale={locale} checked={checked} />
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
				>
					<EvidenceChecklistWidget
						locale={locale}
						checked={checked}
						onToggle={toggleCheckpoint}
						onReset={() => setChecked(initialSampleCheckpoints)}
					/>
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
