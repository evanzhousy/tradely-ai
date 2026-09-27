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
		import("./lessons/audited-boundary").then((m) => ({
			default: m.AuditedBoundaryWalkthrough,
		})),
	),
	"symbol-universe": lazy(() =>
		import("./lessons/symbol-universe").then((m) => ({
			default: m.SymbolUniverseWalkthrough,
		})),
	),
	"rank-symbols": lazy(() =>
		import("./lessons/rank-symbols").then((m) => ({
			default: m.RankSymbolsWalkthrough,
		})),
	),
	"rank-contracts": lazy(() =>
		import("./lessons/rank-contracts").then((m) => ({
			default: m.RankContractsWalkthrough,
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
		import("./lessons/symbol-drawer").then((m) => ({
			default: m.SymbolDrawerWalkthrough,
		})),
	),
	"unusual-activity": lazy(() =>
		import("./lessons/unusual-activity").then((m) => ({
			default: m.UnusualActivityWalkthrough,
		})),
	),
	"option-strategies": lazy(() =>
		import("./lessons/option-strategies").then((m) => ({
			default: m.OptionStrategiesWalkthrough,
		})),
	),
	"stocks-and-prices": lazy(() =>
		import("./lessons/stocks-and-prices").then((m) => ({
			default: m.StocksAndPricesWalkthrough,
		})),
	),
	"what-options-are": lazy(() =>
		import("./lessons/what-options-are").then((m) => ({
			default: m.WhatOptionsAreWalkthrough,
		})),
	),
	"trading-options": lazy(() =>
		import("./lessons/trading-options").then((m) => ({
			default: m.TradingOptionsWalkthrough,
		})),
	),
	"options-risks": lazy(() =>
		import("./lessons/options-risks").then((m) => ({
			default: m.OptionsRisksWalkthrough,
		})),
	),
	"option-contracts": lazy(() =>
		import("./lessons/option-contracts").then((m) => ({
			default: m.OptionContractsWalkthrough,
		})),
	),
	"option-rights": lazy(() =>
		import("./lessons/option-rights").then((m) => ({
			default: m.OptionRightsWalkthrough,
		})),
	),
	"premium-payoff": lazy(() =>
		import("./lessons/premium-payoff").then((m) => ({
			default: m.PremiumPayoffWalkthrough,
		})),
	),
	"expiration-settlement": lazy(() =>
		import("./lessons/expiration-settlement").then((m) => ({
			default: m.ExpirationSettlementWalkthrough,
		})),
	),
	"quotes-orders-trades": lazy(() =>
		import("./lessons/quotes-orders-trades").then((m) => ({
			default: m.QuotesOrdersTradesWalkthrough,
		})),
	),
	"execution-counterparties": lazy(() =>
		import("./lessons/execution-counterparties").then((m) => ({
			default: m.ExecutionCounterpartiesWalkthrough,
		})),
	),
	"execution-side": lazy(() =>
		import("./lessons/execution-side").then((m) => ({
			default: m.ExecutionSideWalkthrough,
		})),
	),
	"flow-sentiment": lazy(() =>
		import("./lessons/flow-sentiment").then((m) => ({
			default: m.FlowSentimentWalkthrough,
		})),
	),
	"validate-option-print": lazy(() =>
		import("./lessons/validate-option-print").then((m) => ({
			default: m.ValidateOptionPrintWalkthrough,
		})),
	),
	"session-flow-vs-structure": lazy(() =>
		import("./lessons/session-flow-vs-structure").then((m) => ({
			default: m.VolumeOpenInterestWalkthrough,
		})),
	),
	"trade-records": lazy(() =>
		import("./lessons/trade-records").then((m) => ({
			default: m.TradeRecordsWalkthrough,
		})),
	),
	"execution-conditions": lazy(() =>
		import("./lessons/execution-conditions").then((m) => ({
			default: m.ExecutionConditionsWalkthrough,
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
