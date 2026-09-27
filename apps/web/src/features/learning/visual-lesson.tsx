import { Skeleton } from "@tradely/ui/components/skeleton";
import { lazy, Suspense } from "react";
import type { LearningStepView } from "@/domain/learning/types";
import type { Locale } from "@/i18n/messages";
import { getDiagramPalette } from "./diagram-palette";
import { LessonMotion } from "./lesson-motion";
import { VisualLessonIdentity, VisualLocaleProvider } from "./visual-playback";

const lessons = {
	"iv-rank-percentile": lazy(() =>
		import("./lessons/iv-rank-percentile").then((m) => ({
			default: m.IvRankPercentileWalkthrough,
		})),
	),
	"dex-dei-gex": lazy(() =>
		import("./lessons/dex-dei-gex").then((m) => ({
			default: m.DexDeiWalkthrough,
		})),
	),
	"gamma-exposure": lazy(() =>
		import("./lessons/gamma-exposure").then((m) => ({
			default: m.GammaExposureWalkthrough,
		})),
	),
	"gamma-regimes": lazy(() =>
		import("./lessons/gamma-regimes").then((m) => ({
			default: m.GammaRegimesWalkthrough,
		})),
	),
	"structural-levels": lazy(() =>
		import("./lessons/structural-levels").then((m) => ({
			default: m.StructuralLevelsWalkthrough,
		})),
	),
	"charm-vanna": lazy(() =>
		import("./lessons/charm-vanna").then((m) => ({
			default: m.CharmVannaWalkthrough,
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
		import("./lessons/point-in-time-research").then((m) => ({
			default: m.PointInTimeResearchWalkthrough,
		})),
	),
	"cookbook-research-packet": lazy(() =>
		import("./lessons/cookbook-research-packet").then((m) => ({
			default: m.ResearchPacketWalkthrough,
		})),
	),
	"market-recap": lazy(() =>
		import("./lessons/market-recap").then((m) => ({
			default: m.MarketRecapWalkthrough,
		})),
	),
	"audit-market-recap": lazy(() =>
		import("./lessons/audit-market-recap").then((m) => ({
			default: m.AuditMarketRecapWalkthrough,
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
		import("./lessons/volatility-surface").then((m) => ({
			default: m.VolatilitySurfaceWalkthrough,
		})),
	),
	"implied-realized-volatility": lazy(() =>
		import("./lessons/implied-realized-volatility").then((m) => ({
			default: m.ImpliedRealizedVolatilityWalkthrough,
		})),
	),
	"theta-vega-rho": lazy(() =>
		import("./lessons/theta-vega-rho").then((m) => ({
			default: m.ThetaVegaRhoWalkthrough,
		})),
	),
	gamma: lazy(() =>
		import("./lessons/gamma").then((m) => ({ default: m.GammaWalkthrough })),
	),
	delta: lazy(() =>
		import("./lessons/delta").then((m) => ({ default: m.DeltaWalkthrough })),
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
