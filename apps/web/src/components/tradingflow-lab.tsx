import { Badge } from "@tradely/ui/components/badge";
import { buttonVariants } from "@tradely/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@tradely/ui/components/card";
import { DisclosurePanel } from "@tradely/ui/components/disclosure";
import { Link as HeroLink } from "@tradely/ui/components/link";
import { ExternalLinkIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { useAnalytics } from "@/analytics/context";
import { AppLink } from "@/components/app-link";
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
			<HeroLink
				className="underline underline-offset-4"
				href="#tradingflow-lab"
			>
				{t("lab.intro")}
			</HeroLink>{" "}
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
						{/* The lesson page shows this card under its own section heading. */}
						<h3 id="tradingflow-lab-title" className="text-xl">
							{lab.title[locale]}
						</h3>
					</CardTitle>
					<CardDescription>{lab.goal[locale]}</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-6">
					<DisclosurePanel
						headingLevel={4}
						summary={t("lab.sample")}
						triggerClassName="font-medium underline underline-offset-4"
						bodyClassName="pt-3"
						onExpandedChange={(expanded) => {
							if (expanded)
								capture("tradingflow_lab_sample_viewed", properties(lab));
						}}
					>
						<p className="mt-3 text-muted-foreground text-sm">
							{t("lab.illustrative")}
						</p>
						<p className="mt-2 leading-7">{lab.sample[locale]}</p>
					</DisclosurePanel>
					<div>
						<h4 className="font-semibold">{t("lab.settings")}</h4>
						<p className="mt-2 text-muted-foreground leading-7">
							{lab.settings[locale]}
						</p>
					</div>
					<div>
						<h4 className="font-semibold">{t("lab.steps")}</h4>
						<ol className="mt-3 flex list-decimal flex-col gap-3 pl-5 leading-7">
							{lab.steps.map((step) => (
								<li key={step.en}>{step[locale]}</li>
							))}
						</ol>
					</div>
					<div>
						<h4 className="font-semibold">{t("lab.inspect")}</h4>
						<p className="mt-2 leading-7">{lab.inspect[locale]}</p>
					</div>
					<div className="flex flex-col items-start gap-3">
						<p className="text-muted-foreground text-sm leading-6">
							{t("lab.access")}{" "}
							<HeroLink
								href="https://tradingflow.com/pricing/"
								target="_blank"
								rel="noopener noreferrer"
								className="underline underline-offset-4"
							>
								{t("lab.accessDetails")}
							</HeroLink>
						</p>
						<HeroLink
							href={tradingFlowLabUrl(lab.id, {
								attribution: consent === "granted",
							})}
							target="_blank"
							rel="noopener noreferrer"
							className={buttonVariants({
								// Wraps a long label; one line keeps HeroUI's height at each breakpoint,
								// without HeroUI's icon margin, which only fits a fixed height.
								className:
									"h-auto min-h-10 max-w-full whitespace-normal py-1.5 md:min-h-9 [&>svg]:my-0",
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
						</HeroLink>
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
							<AppLink
								to="/learn/$lessonSlug"
								params={{ lessonSlug: lab.lessonId }}
								hash="tradingflow-lab"
								className={buttonVariants({ variant: "outline" })}
							>
								{t("lab.open")}
							</AppLink>
						</CardContent>
					</Card>
				))}
			</div>
		</section>
	);
}
