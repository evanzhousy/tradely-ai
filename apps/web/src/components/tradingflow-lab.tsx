import { Link } from "@tanstack/react-router";
import { Badge } from "@tradely/ui/components/badge";
import { buttonVariants } from "@tradely/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@tradely/ui/components/card";
import { ExternalLinkIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useAnalytics } from "@/analytics/context";
import { getLessonById } from "@/content/course";
import {
	getTradingFlowLab,
	type TradingFlowLab as Lab,
	tradingFlowLabs,
	tradingFlowLabUrl,
} from "@/content/tradingflow-labs";
import { getLocalizedLesson } from "@/i18n/course";
import { useI18n } from "@/i18n/provider";

function properties(lab: Lab) {
	return {
		lab_id: lab.id,
		lesson_id: lab.lessonId,
		recipe_slug: lab.recipeSlug,
		lab_version: lab.version,
	};
}

export function TradingFlowLabIntro({ lessonId }: { lessonId: string }) {
	const lab = getTradingFlowLab(lessonId);
	const { t } = useI18n();
	if (!lab) return null;
	return (
		<p className="text-sm">
			<a className="underline underline-offset-4" href="#tradingflow-lab">
				{t("lab.intro")}
			</a>{" "}
			· {t("lab.accessShort")}
		</p>
	);
}

export function TradingFlowLab({ lessonId }: { lessonId: string }) {
	const lab = getTradingFlowLab(lessonId);
	return lab ? <LabContent key={lab.id} lab={lab} /> : null;
}

function LabContent({ lab }: { lab: Lab }) {
	const { locale, t } = useI18n();
	const { capture, consent, isCapturing } = useAnalytics();
	const section = useRef<HTMLElement>(null);
	const seen = useRef(false);
	useEffect(() => {
		if (
			!isCapturing ||
			!section.current ||
			seen.current ||
			typeof IntersectionObserver === "undefined"
		)
			return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (
					entry?.isIntersecting &&
					capture("tradingflow_lab_viewed", properties(lab))
				) {
					seen.current = true;
					observer.disconnect();
				}
			},
			{ threshold: 0.1 },
		);
		observer.observe(section.current);
		return () => observer.disconnect();
	}, [capture, isCapturing, lab]);
	return (
		<section
			ref={section}
			id="tradingflow-lab"
			aria-labelledby="tradingflow-lab-title"
			className="scroll-mt-24"
		>
			<Card>
				<CardHeader>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="secondary">{t("lab.badge")}</Badge>
						<span className="text-muted-foreground text-sm">
							{lab.recipeTitle}
						</span>
					</div>
					<CardTitle>
						<h2 id="tradingflow-lab-title" className="text-xl">
							{lab.title[locale]}
						</h2>
					</CardTitle>
					<CardDescription>{lab.goal[locale]}</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-6">
					<details
						onToggle={(event) => {
							if (event.currentTarget.open)
								capture("tradingflow_lab_sample_viewed", properties(lab));
						}}
					>
						<summary className="cursor-pointer font-medium underline underline-offset-4">
							{t("lab.sample")}
						</summary>
						<p className="mt-3 text-muted-foreground text-sm">
							{t("lab.illustrative")}
						</p>
						<p className="mt-2 leading-7">{lab.sample[locale]}</p>
					</details>
					<div>
						<h3 className="font-semibold">{t("lab.settings")}</h3>
						<p className="mt-2 text-muted-foreground leading-7">
							{lab.settings[locale]}
						</p>
					</div>
					<div>
						<h3 className="font-semibold">{t("lab.steps")}</h3>
						<ol className="mt-3 flex list-decimal flex-col gap-3 pl-5 leading-7">
							{lab.steps.map((step) => (
								<li key={step.en}>{step[locale]}</li>
							))}
						</ol>
					</div>
					<div>
						<h3 className="font-semibold">{t("lab.inspect")}</h3>
						<p className="mt-2 leading-7">{lab.inspect[locale]}</p>
					</div>
					<div className="flex flex-col items-start gap-3">
						<p className="text-muted-foreground text-sm leading-6">
							{t("lab.access")}{" "}
							<a
								href="https://tradingflow.com/pricing/"
								target="_blank"
								rel="noopener noreferrer"
								className="underline underline-offset-4"
							>
								{t("lab.accessDetails")}
							</a>
						</p>
						<a
							href={tradingFlowLabUrl(lab.id, {
								attribution: consent === "granted",
							})}
							target="_blank"
							rel="noopener noreferrer"
							className={buttonVariants({
								className: "h-auto min-h-10 max-w-full whitespace-normal",
							})}
							onClick={() =>
								capture("tradingflow_link_opened", {
									...properties(lab),
									surface: "lesson_lab",
									tool: "Cookbooks",
								})
							}
						>
							{t("lab.run")}
							<ExternalLinkIcon data-icon="inline-end" aria-hidden="true" />
						</a>
						<p className="text-muted-foreground text-xs">{t("lab.keepOpen")}</p>
					</div>
				</CardContent>
			</Card>
		</section>
	);
}

export function TradingFlowLabs() {
	const { locale, t } = useI18n();
	return (
		<section
			aria-labelledby="tradingflow-labs-title"
			className="flex flex-col gap-5 py-8"
		>
			<div>
				<h2 id="tradingflow-labs-title" className="font-semibold text-3xl">
					{t("lab.collectionTitle")}
				</h2>
				<p className="mt-3 max-w-3xl text-muted-foreground leading-7">
					{t("lab.collectionDescription")}
				</p>
			</div>
			<div className="grid gap-4 lg:grid-cols-3">
				{tradingFlowLabs.map((lab) => (
					<Card key={lab.id}>
						<CardHeader>
							<Badge variant="secondary">{t("lab.badge")}</Badge>
							<CardTitle>
								<h3>{lab.title[locale]}</h3>
							</CardTitle>
							<CardDescription>{lab.goal[locale]}</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col items-start gap-4">
							<p className="text-muted-foreground text-sm">
								{t("lab.prerequisites")}{" "}
								{lab.prerequisites
									.map((id) => {
										const lesson = getLessonById(id);
										return lesson
											? getLocalizedLesson(lesson, locale).title
											: id;
									})
									.join(" · ")}
							</p>
							<Link
								to="/learn/$lessonSlug"
								params={{ lessonSlug: lab.lessonId }}
								hash="tradingflow-lab"
								className={buttonVariants({ variant: "outline" })}
							>
								{t("lab.open")}
							</Link>
						</CardContent>
					</Card>
				))}
			</div>
		</section>
	);
}
