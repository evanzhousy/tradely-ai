import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@tradely/ui/components/alert";
import { Button, buttonVariants } from "@tradely/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@tradely/ui/components/card";
import { useEffect, useState } from "react";
import { useAnalytics } from "@/analytics/context";
import { authIsConfigured, useAuth } from "@/auth/client";
import { PageIntro } from "@/components/page-intro";
import { PricingAccountActions } from "@/components/pricing-actions";
import { SignInLink } from "@/components/sign-in-link";
import { parsePricingSearch } from "@/domain/pricing-search";
import { useI18n } from "@/i18n/provider";
import { pageHead } from "@/seo/pages";
import { getPricingSummary, verifyCoursePassCheckout } from "@/server/billing";

export const Route = createFileRoute("/pricing")({
	validateSearch: parsePricingSearch,
	head: () => pageHead("/pricing"),
	component: PricingPage,
});

function PurchaseSupport({ userId }: { userId: string }) {
	const { t } = useI18n();
	const { checkout, session_id: sessionId } = Route.useSearch();
	const load = useServerFn(getPricingSummary);
	const verify = useServerFn(verifyCoursePassCheckout);
	const { capture } = useAnalytics();
	const history = useQuery({
		queryKey: ["historical-billing", userId],
		queryFn: () => load(),
		retry: false,
	});
	const [verification, setVerification] = useState<
		"pending" | "success" | "failed" | null
	>(null);
	useEffect(() => {
		if (checkout !== "lifetime-success") return;
		if (!sessionId) {
			setVerification("failed");
			return;
		}
		let active = true;
		setVerification("pending");
		void verify({ data: { sessionId } })
			.then((result) => {
				if (!active) return;
				setVerification("success");
				capture("course_pass_access_verified", {
					course_id: result.courseId,
					source: result.source,
				});
				void history.refetch();
			})
			.catch(() => {
				if (active) setVerification("failed");
			});
		return () => {
			active = false;
		};
	}, [checkout, sessionId, verify, capture, history.refetch]);
	return (
		<div className="flex flex-col gap-4">
			{verification && (
				<p role="status">
					{t(
						verification === "success"
							? "pricing.verifySuccess"
							: verification === "failed"
								? "pricing.verifyFailure"
								: "pricing.restoringPurchase",
					)}
				</p>
			)}
			{history.isPending ? (
				<p role="status">{t("auth.loading")}</p>
			) : history.isError ||
				history.data?.access.billingState === "unavailable" ? (
				<Alert>
					<AlertTitle>{t("pricing.billingUnavailable")}</AlertTitle>
					<AlertDescription>
						<Button variant="outline" onClick={() => void history.refetch()}>
							{t("common.retry")}
						</Button>
					</AlertDescription>
				</Alert>
			) : null}
			{history.data && (
				<PricingAccountActions
					canManageBilling={history.data.access.hasStripeCustomer}
					canRestoreCoursePass={
						history.data.access.hasStripeCustomer &&
						history.data.offers.coursePassRecoveryConfigured
					}
					showCoursePassStatus={history.data.access.hasCoursePass}
					onAccessChanged={async () => {
						await history.refetch();
					}}
				/>
			)}
		</div>
	);
}

function AccountSupport() {
	const { userId, isLoaded } = useAuth();
	const { t } = useI18n();
	if (!isLoaded) return <p role="status">{t("auth.loading")}</p>;
	return userId ? (
		<PurchaseSupport key={userId} userId={userId} />
	) : (
		<SignInLink>{t("pricing.signInHistory")}</SignInLink>
	);
}

function PricingPage() {
	const { t } = useI18n();
	return (
		<main className="page-shell pricing-page">
			<PageIntro
				eyebrow={t("common.free")}
				title={t("pricing.freeHeading")}
				description={t("pricing.freeDescription")}
			>
				<Link
					to="/learn/$lessonSlug"
					params={{ lessonSlug: "option-contracts" }}
					className={buttonVariants({ size: "lg" })}
				>
					{t("home.startFree")}
				</Link>
			</PageIntro>
			<div className="access-options">
				<Card>
					<CardHeader>
						<CardTitle>
							<h2>{t("pricing.freeAccount")}</h2>
						</CardTitle>
						<CardDescription>
							{t("pricing.freeAccountDescription")}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link
							to="/courses/tradingflow-foundations"
							className={buttonVariants({ variant: "outline" })}
						>
							{t("common.returnCourse")}
						</Link>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>
							<h2>{t("pricing.coachingTitle")}</h2>
						</CardTitle>
						<CardDescription>
							{t("pricing.coachingDescription")}
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
			<p className="text-muted-foreground text-sm">
				{t("practice.disclosure")}
			</p>
			<Card id="past-purchases">
				<CardHeader>
					<CardTitle>
						<h2>{t("pricing.pastPurchases")}</h2>
					</CardTitle>
					<CardDescription>
						{t("pricing.pastPurchasesDescription")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{authIsConfigured ? (
						<AccountSupport />
					) : (
						<p>{t("access.authUnavailable")}</p>
					)}
				</CardContent>
			</Card>
		</main>
	);
}
