import { Skeleton } from "@tradely/ui/components/skeleton";
import { lazy, Suspense } from "react";
import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { getDiagramPalette } from "./diagram-palette";
import { LessonMotion } from "./lesson-motion";
import { VisualLessonIdentity, VisualLocaleProvider } from "./visual-playback";

const lessons = {
	"iv-rank-percentile": lazy(() =>
		import("./iv-rank-concept-lab").then((m) => ({
			default: m.IvRankConceptLab,
		})),
	),
	"dex-dei-gex": lazy(() =>
		import("./flow-impact-concept-lab").then((m) => ({
			default: m.FlowImpactConceptLab,
		})),
	),
	"gamma-exposure": lazy(() =>
		import("./gex-concept-lab").then((m) => ({ default: m.GexConceptLab })),
	),
	"gamma-regimes": lazy(() =>
		import("./regime-concept-lab").then((m) => ({
			default: m.RegimeConceptLab,
		})),
	),
	"structural-levels": lazy(() =>
		import("./levels-concept-lab").then((m) => ({
			default: m.LevelsConceptLab,
		})),
	),
	"charm-vanna": lazy(() =>
		import("./charm-vanna-concept-lab").then((m) => ({
			default: m.CharmVannaConceptLab,
		})),
	),
	"audited-boundary": lazy(() =>
		import("./boundary-concept-lab").then((m) => ({
			default: m.BoundaryConceptLab,
		})),
	),
	"symbol-universe": lazy(() =>
		import("./eligibility-concept-lab").then((m) => ({
			default: m.EligibilityConceptLab,
		})),
	),
	"rank-symbols": lazy(() =>
		import("./rank-symbol-concept-lab").then((m) => ({
			default: m.RankSymbolConceptLab,
		})),
	),
	"rank-contracts": lazy(() =>
		import("./neighborhood-concept-lab").then((m) => ({
			default: m.NeighborhoodConceptLab,
		})),
	),
	"point-in-time-research": lazy(() =>
		import("./point-time-concept-lab").then((m) => ({
			default: m.PointTimeConceptLab,
		})),
	),
	"cookbook-research-packet": lazy(() =>
		import("./packet-concept-lab").then((m) => ({
			default: m.PacketConceptLab,
		})),
	),
	"market-recap": lazy(() =>
		import("./recap-concept-lab").then((m) => ({ default: m.RecapConceptLab })),
	),
	"audit-market-recap": lazy(() =>
		import("./audit-recap-concept-lab").then((m) => ({
			default: m.AuditRecapConceptLab,
		})),
	),
	"portfolio-pnl": lazy(() =>
		import("./pnl-concept-lab").then((m) => ({ default: m.PnlConceptLab })),
	),
	"portfolio-performance": lazy(() =>
		import("./performance-concept-lab").then((m) => ({
			default: m.PerformanceConceptLab,
		})),
	),
	"portfolio-exposure": lazy(() =>
		import("./portfolio-exposure-concept-lab").then((m) => ({
			default: m.PortfolioExposureConceptLab,
		})),
	),
	"volatility-surface": lazy(() =>
		import("./surface-concept-lab").then((m) => ({
			default: m.SurfaceConceptLab,
		})),
	),
	"implied-realized-volatility": lazy(() =>
		import("./volatility-concept-lab").then((m) => ({
			default: m.VolatilityConceptLab,
		})),
	),
	"theta-vega-rho": lazy(() =>
		import("./time-vol-rate-concept-lab").then((m) => ({
			default: m.TimeVolRateConceptLab,
		})),
	),
	gamma: lazy(() =>
		import("./gamma-concept-lab").then((m) => ({ default: m.GammaConceptLab })),
	),
	delta: lazy(() =>
		import("./delta-concept-lab").then((m) => ({ default: m.DeltaConceptLab })),
	),
	"symbol-drawer": lazy(() =>
		import("./source-concept-lab").then((m) => ({
			default: m.SourceConceptLab,
		})),
	),
	"unusual-activity": lazy(() =>
		import("./activity-concept-lab").then((m) => ({
			default: m.ActivityConceptLab,
		})),
	),
	"option-strategies": lazy(() =>
		import("./strategy-concept-lab").then((m) => ({
			default: m.StrategyConceptLab,
		})),
	),
	"option-contracts": lazy(() =>
		import("./contract-concept-lab").then((m) => ({
			default: m.ContractConceptLab,
		})),
	),
	"option-rights": lazy(() =>
		import("./rights-concept-lab").then((m) => ({
			default: m.RightsConceptLab,
		})),
	),
	"premium-payoff": lazy(() =>
		import("./payoff-concept-lab").then((m) => ({
			default: m.PayoffConceptLab,
		})),
	),
	"expiration-settlement": lazy(() =>
		import("./settlement-concept-lab").then((m) => ({
			default: m.SettlementConceptLab,
		})),
	),
	"quotes-orders-trades": lazy(() =>
		import("./quote-concept-lab").then((m) => ({ default: m.QuoteConceptLab })),
	),
	"execution-counterparties": lazy(() =>
		import("./execution-concept-lab").then((m) => ({
			default: m.ExecutionConceptLab,
		})),
	),
	"execution-side": lazy(() =>
		import("./side-concept-lab").then((m) => ({ default: m.SideConceptLab })),
	),
	"flow-sentiment": lazy(() =>
		import("./sentiment-concept-lab").then((m) => ({
			default: m.SentimentConceptLab,
		})),
	),
	"validate-option-print": lazy(() =>
		import("./print-review-concept-lab").then((m) => ({
			default: m.PrintReviewConceptLab,
		})),
	),
	"session-flow-vs-structure": lazy(() =>
		import("./oi-concept-lab").then((m) => ({ default: m.OiConceptLab })),
	),
	"trade-records": lazy(() =>
		import("./tape-concept-lab").then((m) => ({ default: m.TapeConceptLab })),
	),
	"execution-conditions": lazy(() =>
		import("./conditions-concept-lab").then((m) => ({
			default: m.ConditionsConceptLab,
		})),
	),
};
export function VisualLesson({
	lessonId,
	locale,
	data,
}: {
	lessonId: string;
	locale: Locale;
	data?: LearningStepView["conceptData"];
}) {
	const Lesson = lessons[lessonId as keyof typeof lessons];
	if (!Lesson) return null;
	return (
		<VisualLessonIdentity value={lessonId}>
			<VisualLocaleProvider locale={locale}>
				<div
					className="visual-color-system"
					data-visual-palette={getDiagramPalette(lessonId)}
				>
					<LessonMotion>
						<Suspense
							fallback={
								<div role="status" className="flex flex-col gap-4">
									<span>
										{locale === "zh" ? "正在加载课程…" : "Loading lesson…"}
									</span>
									<Skeleton className="h-96 w-full" />
								</div>
							}
						>
							<Lesson locale={locale} data={data} />
						</Suspense>
					</LessonMotion>
				</div>
			</VisualLocaleProvider>
		</VisualLessonIdentity>
	);
}
