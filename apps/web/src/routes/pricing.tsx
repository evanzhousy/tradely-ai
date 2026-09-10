import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@tradely/ui/components/accordion";
import { BentoCard } from "@tradely/ui/components/bento-grid";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@tradely/ui/components/card";
import { InteractiveHoverLink } from "@tradely/ui/components/interactive-hover-button";
import { BookOpenIcon, CheckIcon, LayersIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAnalytics } from "@/analytics/context";
import type { BillingOffer } from "@/analytics/events";
import { PageIntro } from "@/components/page-intro";
import {
	PricingAccountActions,
	PricingCheckoutButton,
} from "@/components/pricing-actions";
import { getFreeLessons } from "@/content/course";
import {
	type PricingCheckoutResult,
	parsePricingSearch,
} from "@/domain/pricing-search";
import { getLocalizedCourse } from "@/i18n/course";
import { useI18n } from "@/i18n/provider";
import { pageHead } from "@/seo/pages";
import { getPricingSummary, verifyCoursePassCheckout } from "@/server/billing";

export const Route = createFileRoute("/pricing")({
	loader: () => getPricingSummary(),
	validateSearch: parsePricingSearch,
	head: () => pageHead("/pricing"),
	component: PricingPage,
});

type PricingSummary = Awaited<ReturnType<typeof getPricingSummary>>;
type OfferSummary = PricingSummary["offers"]["membership"];

function formatOfferPrice(offer: OfferSummary, locale: "en" | "zh"): string {
	if (!offer.configured || offer.unitAmount === null)
		return locale === "zh" ? "价格暂不可用" : "Price unavailable";
	return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US", {
		style: "currency",
		currency: offer.currency.toUpperCase(),
		maximumFractionDigits: 2,
	}).format(offer.unitAmount / 100);
}

function OfferCard({
	offer,
	summary,
	title,
	description,
	features,
	active,
	isSignedIn,
}: {
	offer: BillingOffer;
	summary: OfferSummary;
	title: string;
	description: string;
	features: string[];
	active: boolean;
	isSignedIn: boolean;
}) {
	const { locale, t } = useI18n();
	return (
		<Card className="pricing-offer h-full" data-offer={offer}>
			<CardHeader>
				<div className="offer-label">
					<LayersIcon size={14} aria-hidden="true" />
					{offer === "membership"
						? t("pricing.membership")
						: t("pricing.oneTime")}
				</div>
				<CardTitle>
					<h2>{title}</h2>
				</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="flex h-full flex-col gap-7">
				<div className="flex flex-wrap items-end gap-2">
					<span className="pricing-price">
						{formatOfferPrice(summary, locale)}
					</span>
					{summary.configured ? (
						<span className="pb-1 text-muted-foreground">
							{summary.interval ? `/${summary.interval}` : t("pricing.oneTime")}
						</span>
					) : null}
				</div>
				<ul className="flex flex-1 flex-col gap-3">
					{features.map((feature) => (
						<li key={feature} className="flex items-start gap-3 text-sm">
							<span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
								<CheckIcon className="size-3.5" aria-hidden="true" />
							</span>
							{feature}
						</li>
					))}
				</ul>
			</CardContent>
			<CardFooter>
				<PricingCheckoutButton
					offer={offer}
					configured={summary.configured}
					active={active}
					isSignedIn={isSignedIn}
				/>
			</CardFooter>
		</Card>
	);
}

function checkoutAnalytics(value: PricingCheckoutResult): {
	status: "success" | "cancel";
	offer: BillingOffer;
} {
	if (value === "lifetime-success" || value === "lifetime-cancel") {
		return {
			status: value === "lifetime-success" ? "success" : "cancel",
			offer: "lifetime_course",
		};
	}
	return {
		status:
			value === "success" || value === "membership-success"
				? "success"
				: "cancel",
		offer: "membership",
	};
}

function PricingPage() {
	const { offers, access } = Route.useLoaderData();
	const { checkout, session_id: sessionId } = Route.useSearch();
	const router = useRouter();
	const verifyCoursePass = useServerFn(verifyCoursePassCheckout);
	const { t, locale } = useI18n();
	const course = getLocalizedCourse(locale);
	const freeLessons = getFreeLessons(course.lessons);
	const { capture, isCapturing } = useAnalytics();
	const trackedCheckoutReturn = useRef<string | null>(null);
	const verifiedSession = useRef<string | null>(null);
	const invalidReturnReported = useRef(false);

	useEffect(() => {
		if (checkout !== "lifetime-success" || sessionId) {
			invalidReturnReported.current = false;
			return;
		}
		if (invalidReturnReported.current) return;
		invalidReturnReported.current = true;
		toast.error(t("pricing.verifyFailure"));
	}, [checkout, sessionId, t]);

	useEffect(() => {
		if (
			checkout !== "lifetime-success" ||
			!sessionId ||
			verifiedSession.current === sessionId
		)
			return;
		verifiedSession.current = sessionId;
		void verifyCoursePass({ data: { sessionId } })
			.then((result) => {
				capture("course_pass_access_verified", {
					course_id: result.courseId,
					source: result.source,
				});
				toast.success(t("pricing.verifySuccess"));
				void router.invalidate();
			})
			.catch(() => {
				verifiedSession.current = null;
				toast.error(t("pricing.verifyFailure"));
			});
	}, [capture, checkout, router, sessionId, t, verifyCoursePass]);

	useEffect(() => {
		if (!isCapturing) {
			trackedCheckoutReturn.current = null;
			return;
		}
		if (!checkout || trackedCheckoutReturn.current === checkout) return;
		const analytics = checkoutAnalytics(checkout);
		if (
			capture("billing_checkout_returned", {
				...analytics,
				estimate: true,
			})
		) {
			trackedCheckoutReturn.current = checkout;
		}
	}, [capture, checkout, isCapturing]);

	const membershipFeatures = [
		t("pricing.featureCurriculum"),
		t("pricing.featureProgress"),
		t("pricing.featureUpdates"),
		t("pricing.featurePractice"),
		t("pricing.featureTradingFlowMembership"),
	];
	const coursePassFeatures = [
		t("pricing.featureCoursePassCurriculum"),
		t("pricing.featureCoursePassProgress"),
		t("pricing.featureCoursePassRevisions"),
		t("pricing.featureCoursePassPractice"),
	];

	return (
		<main className="page-shell pricing-page">
			<PageIntro
				eyebrow={t("nav.pricing")}
				title={t("pricing.heading")}
				description={t(
					offers.lifetimeCheckoutEnabled
						? "pricing.description"
						: "pricing.descriptionMembershipOnly",
				)}
			>
				<p className="text-muted-foreground text-sm">
					{locale === "zh"
						? "先从免费课程开始，再按自己的节奏深入学习。"
						: "Start with a free lesson. Go deeper at your own pace."}
				</p>
			</PageIntro>
			<div className="pricing-grid">
				<BentoCard
					eyebrow={
						<>
							<BookOpenIcon size={14} aria-hidden="true" />
							{locale === "zh" ? "开始探索" : "Start exploring"}
						</>
					}
					title={<h2>{locale === "zh" ? "免费课程" : "Free lessons"}</h2>}
					description={
						locale === "zh"
							? "先体验学习方法，再决定下一步。"
							: "Try the learning method before choosing your next step."
					}
					footer={
						freeLessons[0] ? (
							<InteractiveHoverLink
								variant="outline"
								render={
									<Link
										to="/learn/$lessonSlug"
										params={{ lessonSlug: freeLessons[0].slug }}
									/>
								}
							>
								{t("home.startFree")}
							</InteractiveHoverLink>
						) : null
					}
				>
					<div className="flex flex-col gap-7">
						<p className="pricing-price">$0</p>
						<ul className="flex flex-col gap-3 text-sm">
							<li>{t("course.freeLessons", { count: freeLessons.length })}</li>
							<li>
								{locale === "zh"
									? "包含交互练习与研究案例"
									: "Interactive practice and research cases"}
							</li>
							<li>
								{locale === "zh"
									? "无需登录即可开始"
									: "Start without signing in"}
							</li>
							<li>
								{locale === "zh"
									? "登录后可保存课程完成记录"
									: "Sign in to record lesson completion"}
							</li>
						</ul>
					</div>
				</BentoCard>
				<OfferCard
					offer="membership"
					summary={offers.membership}
					title={t("pricing.membership")}
					description={t("pricing.membershipDescription")}
					features={membershipFeatures}
					active={access.billingState === "active"}
					isSignedIn={access.isSignedIn}
				/>
				{offers.lifetimeCheckoutEnabled ? (
					<OfferCard
						offer="lifetime_course"
						summary={offers.coursePass}
						title={t("pricing.coursePass")}
						description={t("pricing.coursePassDescription")}
						features={coursePassFeatures}
						active={access.hasCoursePass}
						isSignedIn={access.isSignedIn}
					/>
				) : null}
			</div>

			<PricingAccountActions
				canManageBilling={access.billingState === "active"}
				canRestoreCoursePass={
					offers.coursePassRecoveryConfigured &&
					access.isSignedIn &&
					!access.hasCoursePass &&
					access.hasStripeCustomer
				}
				showCoursePassStatus={
					!offers.lifetimeCheckoutEnabled && access.hasCoursePass
				}
				onAccessChanged={() => router.invalidate()}
			/>
			<p className="text-muted-foreground text-sm">{t("pricing.taxNote")}</p>
			{!offers.membership.configured ||
			(offers.lifetimeCheckoutEnabled && !offers.coursePass.configured) ? (
				<p className="text-muted-foreground text-xs">
					{t("pricing.localPreview")}
				</p>
			) : null}
			<section className="pricing-faq" aria-labelledby="pricing-questions">
				<div className="flex flex-col gap-3">
					<p className="page-eyebrow">
						{locale === "zh" ? "开始之前" : "Before you begin"}
					</p>
					<h2 id="pricing-questions">
						{locale === "zh" ? "常见问题" : "A few things to know"}
					</h2>
				</div>
				<Accordion>
					<AccordionItem value="free">
						<AccordionTrigger>
							{locale === "zh" ? "可以先试学吗？" : "Can I try a lesson first?"}
						</AccordionTrigger>
						<AccordionContent>
							<p className="leading-7">
								{locale === "zh"
									? `可以。${freeLessons.length} 节标记为免费的课程无需登录或付费即可开始。`
									: `Yes. The ${freeLessons.length} lessons labeled Free are available without signing in or paying.`}
							</p>
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="accounts">
						<AccordionTrigger>
							{locale === "zh"
								? "是否包含 TradingFlow 账户？"
								: "Does this include a TradingFlow account?"}
						</AccordionTrigger>
						<AccordionContent>
							<p className="leading-7">{t("home.partnerDisclosure")}</p>
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="progress">
						<AccordionTrigger>
							{locale === "zh"
								? "学习进度如何保存？"
								: "How is progress saved?"}
						</AccordionTrigger>
						<AccordionContent>
							<p className="leading-7">
								{locale === "zh"
									? "登录 Tradely 后可记录课程完成情况。匿名练习在重新加载后重置；已有的完成记录会保留。"
									: "Sign in to Tradely to record lesson completion. Anonymous practice resets on reload. Earlier lesson completions are retained as the curriculum grows."}
							</p>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</section>
		</main>
	);
}
