import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@tradely/ui/components/badge";
import { buttonVariants } from "@tradely/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@tradely/ui/components/card";
import { cn } from "@tradely/ui/lib/utils";
import {
	ArrowRightIcon,
	BookOpenCheckIcon,
	ExternalLinkIcon,
} from "lucide-react";

import { CourseList } from "@/components/course-list";
import { CourseProgress } from "@/components/course-progress";
import { tradingFlowCourse } from "@/content/course";
import { getCourseProgress } from "@/server/progress";

export const Route = createFileRoute("/")({
	loader: () => getCourseProgress(),
	component: HomeComponent,
});

function HomeComponent() {
	const progress = Route.useLoaderData();
	return (
		<main>
			<section className="overflow-hidden border-border/60 border-b">
				<div className="mx-auto grid max-w-[1480px] items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-24">
					<div className="flex max-w-2xl flex-col items-start gap-7">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary">{tradingFlowCourse.title}</Badge>
							<span className="font-mono text-muted-foreground text-xs">
								11 lessons · TradingFlow practice
							</span>
						</div>
						<div className="flex flex-col gap-5">
							<h1 className="max-w-[12ch] font-semibold text-5xl text-display sm:text-6xl lg:text-7xl">
								Read the market. Then verify the story.
							</h1>
							<p className="max-w-[62ch] text-lg text-muted-foreground leading-8">
								A guided options curriculum that turns flow, ranking, Greeks,
								GEX, and open interest into one repeatable research
								workflow—with real practice in TradingFlow.
							</p>
						</div>
						<div className="flex flex-col gap-3 sm:flex-row">
							<Link
								to="/learn/$lessonSlug"
								params={{ lessonSlug: "audited-boundary" }}
								className={buttonVariants({ size: "lg" })}
							>
								Start learning
								<ArrowRightIcon data-icon="inline-end" />
							</Link>
							<a
								href="https://app.tradingflow.com/?utm_source=tradely&utm_medium=home-hero"
								className={buttonVariants({ variant: "outline", size: "lg" })}
							>
								Open TradingFlow
								<ExternalLinkIcon data-icon="inline-end" />
							</a>
						</div>
						<p className="text-muted-foreground text-xs">
							TradingFlow is an independent partnered service. Its own account
							or subscription may be required.
						</p>
					</div>

					<div className="relative">
						<div className="overflow-hidden rounded-4xl bg-card shadow-xl ring-1 ring-foreground/8 dark:ring-foreground/12">
							<video
								controls
								playsInline
								preload="metadata"
								poster="/media/tradingflow/posters/series-overview.jpg"
								className="aspect-video w-full bg-black object-cover"
							>
								<source
									src="/media/tradingflow/series-overview.mp4"
									type="video/mp4"
								/>
								<track
									kind="captions"
									src="/media/tradingflow/captions/series-overview.vtt"
									srcLang="en"
									label="English"
									default
								/>
							</video>
							<div className="flex items-start gap-3 px-5 py-4">
								<BookOpenCheckIcon className="mt-0.5 size-5 text-primary" />
								<div className="flex flex-col gap-1">
									<p className="font-medium">
										One workflow across the full course
									</p>
									<p className="text-muted-foreground text-sm">
										Discover → inspect → validate → compare freshness → decide
										what remains unknown.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section className="mx-auto grid max-w-[1280px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.38fr_0.62fr] lg:px-8 lg:py-24">
				<div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
					<div className="flex flex-col gap-3">
						<p className="font-mono text-primary text-xs">THE COURSE</p>
						<h2 className="font-semibold text-3xl text-display sm:text-4xl">
							A field manual, not a video library.
						</h2>
						<p className="text-muted-foreground leading-7">
							Each lesson explains one decision, shows the relevant evidence,
							and ends with a bounded task in TradingFlow.
						</p>
					</div>
					<Card size="sm">
						<CardHeader>
							<CardTitle>Your learning record</CardTitle>
							<CardDescription>
								{progress.signedIn
									? "Synced to your Tradely account."
									: "Sign in to sync progress across devices."}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<CourseProgress
								completed={progress.completed}
								total={progress.total}
								percentage={progress.percentage}
							/>
						</CardContent>
					</Card>
				</div>

				<Card className="[--card-spacing:--spacing(4)] sm:[--card-spacing:--spacing(5)]">
					<CardHeader>
						<CardTitle>{tradingFlowCourse.title}</CardTitle>
						<CardDescription>{tradingFlowCourse.description}</CardDescription>
					</CardHeader>
					<CardContent className="-mx-2">
						<CourseList
							lessons={tradingFlowCourse.lessons}
							completedIds={progress.records
								.filter((record) => record.completedAt)
								.map((record) => record.lessonId)}
							canAccessPaid={progress.canAccessPaid}
							accessUnavailable={progress.accessUnavailable}
						/>
					</CardContent>
				</Card>
			</section>

			<section className="border-border/60 border-t bg-muted/35">
				<div className="mx-auto flex max-w-[1100px] flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:py-20">
					<Badge variant="secondary">
						Independent products · official practice partnership
					</Badge>
					<h2 className="max-w-[18ch] font-semibold text-3xl text-display sm:text-4xl">
						Learn in Tradely. Practice in TradingFlow.
					</h2>
					<p className="max-w-[68ch] text-muted-foreground leading-7">
						Tradely keeps your curriculum and progress. TradingFlow remains the
						real analysis environment, with separate customer accounts and
						infrastructure.
					</p>
					<Link
						to="/courses/tradingflow-foundations"
						className={cn(buttonVariants({ variant: "outline" }))}
					>
						View the complete course
					</Link>
				</div>
			</section>
		</main>
	);
}
