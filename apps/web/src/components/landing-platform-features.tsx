import { Link } from "@tanstack/react-router";
import { BentoCard, BentoGrid } from "@tradely/ui/components/bento-grid";
import { Button } from "@tradely/ui/components/button";
import {
	ArrowRightIcon,
	CloudCheckIcon,
	LanguagesIcon,
	MousePointer2Icon,
	RouteIcon,
} from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { LessonInfographic } from "./lesson-infographic";

export function LandingPlatformFeatures() {
	const { t, locale, setLocale } = useI18n();
	const l = (en: string, zh: string) => (locale === "zh" ? zh : en);
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
					eyebrow={l("Animated explanations", "动画讲解")}
					title={
						<h3>{l("Watch the relationship unfold.", "看关系逐步展开。")}</h3>
					}
					description={l(
						"Follow price, premium and profit together, with every unit in view.",
						"一起查看价格、权利金与盈亏，保留每个数值的单位。",
					)}
					footer={
						<Link
							to="/learn/$lessonSlug"
							params={{ lessonSlug: "premium-payoff" }}
							className="observatory-text-link"
						>
							{l("Watch a lesson", "观看一课")}
							<ArrowRightIcon size={16} />
						</Link>
					}
				>
					<LessonInfographic subject="premium-payoff" locale={locale} />
				</BentoCard>
				<BentoCard
					className="platform-bento-progress"
					eyebrow={
						<>
							<CloudCheckIcon size={16} />
							{t("home.features.progressLabel")}
						</>
					}
					title={<h3>{t("home.features.progressTitle")}</h3>}
					description={t("home.features.progressDescription")}
				>
					<ol className="platform-learning-steps">
						{[
							l("Not started", "尚未开始"),
							l("In progress", "学习中"),
							l("Studied", "已学习"),
						].map((step, i) => (
							<li key={step}>
								<span>0{i + 1}</span>
								{step}
							</li>
						))}
					</ol>
				</BentoCard>
				<BentoCard
					className="platform-bento-practice"
					eyebrow={
						<>
							<MousePointer2Icon size={16} />
							{l("Interactive diagrams", "交互图解")}
						</>
					}
					title={<h3>{t("home.features.practiceTitle")}</h3>}
					description={t("home.features.practiceDescription")}
				>
					<LessonInfographic
						subject="session-flow-vs-structure"
						locale={locale}
					/>
				</BentoCard>
				<BentoCard
					className="platform-bento-path"
					eyebrow={
						<>
							<RouteIcon size={16} />
							{t("home.features.pathLabel")}
						</>
					}
					title={<h3>{t("home.features.pathTitle")}</h3>}
					description={t("home.features.pathDescription")}
					footer={
						<a href="#curriculum" className="observatory-text-link">
							{t("home.explore")}
							<ArrowRightIcon size={16} />
						</a>
					}
				>
					<ol className="platform-learning-steps">
						{[
							l("Watch the explanation", "观看讲解"),
							l("Explore the relationship", "探索关系"),
							l("Follow the worked example", "跟随完整示例"),
						].map((step, i) => (
							<li key={step}>
								<span>0{i + 1}</span>
								{step}
							</li>
						))}
					</ol>
				</BentoCard>
				<BentoCard
					className="platform-bento-language"
					eyebrow={
						<>
							<LanguagesIcon size={16} />
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
							<ArrowRightIcon data-icon="inline-end" />
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
