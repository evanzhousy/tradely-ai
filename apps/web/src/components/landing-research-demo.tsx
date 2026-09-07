import { Link } from "@tanstack/react-router";
import { Button } from "@tradely/ui/components/button";
import { ArrowRightIcon, RotateCcwIcon, ScanLineIcon } from "lucide-react";
import { useId, useState } from "react";
import { useI18n } from "@/i18n/provider";

export function LandingResearchDemo() {
	const { t } = useI18n();
	const [revealed, setRevealed] = useState(false);
	const explanationId = useId();
	return (
		<section
			id="research-demo"
			className="observatory-study observatory-container"
			aria-labelledby="study-heading"
		>
			<div className="observatory-study-copy">
				<p className="observatory-label">
					<span />
					{t("home.demoLabel")}
				</p>
				<h2 id="study-heading">{t("home.demoTitle")}</h2>
				<p>{t("home.demoDescription")}</p>
				<Link
					to="/learn/$lessonSlug"
					params={{ lessonSlug: "rank-symbols" }}
					className="observatory-text-link"
				>
					{t("home.demoLink")}
					<ArrowRightIcon size={16} aria-hidden="true" />
				</Link>
			</div>
			<div className="observatory-exercise observatory-surface">
				<div className="observatory-exercise-bar">
					<span>
						<ScanLineIcon size={15} aria-hidden="true" />
						{t("home.demoExercise")}
					</span>
					<span>03</span>
				</div>
				<div className="observatory-exercise-content">
					<h3>{t("home.demoQuestion")}</h3>
					<div className="observatory-evidence-lines" aria-hidden="true">
						{[0.91, 0.67, 0.49, 0.28, 0.16].map((amount, index) => (
							<div key={amount}>
								<span>0{index + 1}</span>
								<i style={{ width: `${amount * 100}%` }} />
								<b>{index === 0 ? "↗" : "·"}</b>
							</div>
						))}
					</div>
					<dl className="observatory-observation">
						<dt>{t("home.demoObservation")}</dt>
						<dd>{t("home.demoObserved")}</dd>
					</dl>
					<div
						id={explanationId}
						className="observatory-reasoning"
						hidden={!revealed}
					>
						<dl>
							<dt>{t("home.demoConclusion")}</dt>
							<dd>{t("home.demoInterpreted")}</dd>
						</dl>
						<p>{t("home.demoReason")}</p>
					</div>
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
				</div>
				<p className="observatory-exercise-caption">{t("home.demoCaption")}</p>
			</div>
		</section>
	);
}
