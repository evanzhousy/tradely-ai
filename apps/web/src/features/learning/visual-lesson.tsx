import { Skeleton } from "@tradely/ui/components/skeleton";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@tradely/ui/components/tabs";
import { lazy, Suspense } from "react";
import { syllabus } from "@/content/syllabus";
import type { Locale } from "@/i18n/messages";
import { getDiagramPalette } from "./diagram-palette";
import { LessonMotion } from "./lesson-motion";
import { VisualLessonIdentity } from "./visual-lesson-identity";

function LessonLoading({
	locale,
	checkpoint,
}: {
	locale: Locale;
	checkpoint: boolean;
}) {
	const label = locale === "zh" ? "正在加载课程…" : "Loading lesson…";
	if (checkpoint)
		return (
			<div role="status" className="flex flex-col gap-4">
				<span>{label}</span>
				<Skeleton className="h-96 w-full" />
			</div>
		);
	return (
		<section
			role="status"
			aria-label={label}
			className="walkthrough concept-lab visual-classroom wt-player"
			aria-busy="true"
		>
			<span className="sr-only">{label}</span>
			<Tabs value="watch" className="gap-[inherit]">
				<TabsList className="wt-modes">
					<TabsTrigger value="watch" isDisabled>
						{locale === "zh" ? "观看" : "Watch"}
					</TabsTrigger>
					<TabsTrigger value="play" isDisabled>
						{locale === "zh" ? "探索区" : "Playground"}
					</TabsTrigger>
				</TabsList>
				<TabsContent
					value="watch"
					className="flex min-w-0 flex-col gap-[inherit]"
				>
					<div className="wt-film-frame">
						<Skeleton className="wt-film w-full" />
					</div>
					<div className="wt-nav" aria-hidden="true">
						<Skeleton className="h-6 w-full" />
					</div>
				</TabsContent>
			</Tabs>
		</section>
	);
}

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
	"checkpoint-exposure": lazy(() =>
		import("./lessons/checkpoint-exposure").then((m) => ({
			default: m.CheckpointExposureWalkthrough,
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
	"checkpoint-structure": lazy(() =>
		import("./lessons/checkpoint-structure").then((m) => ({
			default: m.CheckpointStructureWalkthrough,
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
	"checkpoint-research": lazy(() =>
		import("./lessons/checkpoint-research").then((m) => ({
			default: m.CheckpointResearchWalkthrough,
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
	"checkpoint-production": lazy(() =>
		import("./lessons/checkpoint-production").then((m) => ({
			default: m.CheckpointProductionWalkthrough,
		})),
	),
	"portfolio-pnl": lazy(() =>
		import("./lessons/portfolio-pnl").then((m) => ({
			default: m.PortfolioPnlWalkthrough,
		})),
	),
	"portfolio-performance": lazy(() =>
		import("./lessons/portfolio-performance").then((m) => ({
			default: m.PortfolioPerformanceWalkthrough,
		})),
	),
	"tradingflow-recipes": lazy(() =>
		import("./lessons/tradingflow-recipes").then((m) => ({
			default: m.TradingflowRecipesWalkthrough,
		})),
	),
	"recipe-map": lazy(() =>
		import("./lessons/recipe-map").then((m) => ({
			default: m.RecipeMapWalkthrough,
		})),
	),
	"recipe-inputs": lazy(() =>
		import("./lessons/recipe-inputs").then((m) => ({
			default: m.RecipeInputsWalkthrough,
		})),
	),
	"research-checklist": lazy(() =>
		import("./lessons/research-checklist").then((m) => ({
			default: m.ResearchChecklistWalkthrough,
		})),
	),
	"ai-verify": lazy(() =>
		import("./lessons/ai-verify").then((m) => ({
			default: m.AiVerifyWalkthrough,
		})),
	),
	"custom-formulas": lazy(() =>
		import("./lessons/custom-formulas").then((m) => ({
			default: m.CustomFormulasWalkthrough,
		})),
	),
	"edit-with-ai": lazy(() =>
		import("./lessons/edit-with-ai").then((m) => ({
			default: m.EditWithAiWalkthrough,
		})),
	),
	"connect-agent": lazy(() =>
		import("./lessons/connect-agent").then((m) => ({
			default: m.ConnectAgentWalkthrough,
		})),
	),
	"checkpoint-workflows": lazy(() =>
		import("./lessons/checkpoint-workflows").then((m) => ({
			default: m.CheckpointWorkflowsWalkthrough,
		})),
	),
	"portfolio-exposure": lazy(() =>
		import("./lessons/portfolio-exposure").then((m) => ({
			default: m.PortfolioExposureWalkthrough,
		})),
	),
	"checkpoint-portfolio": lazy(() =>
		import("./lessons/checkpoint-portfolio").then((m) => ({
			default: m.CheckpointPortfolioWalkthrough,
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
	"expected-move": lazy(() =>
		import("./lessons/expected-move").then((m) => ({
			default: m.ExpectedMoveWalkthrough,
		})),
	),
	"theta-vega-rho": lazy(() =>
		import("./lessons/theta-vega-rho").then((m) => ({
			default: m.ThetaVegaRhoWalkthrough,
		})),
	),
	"zero-dte": lazy(() =>
		import("./lessons/zero-dte").then((m) => ({
			default: m.ZeroDteWalkthrough,
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
	"checkpoint-flow": lazy(() =>
		import("./lessons/checkpoint-flow").then((m) => ({
			default: m.CheckpointFlowWalkthrough,
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
	"multi-leg-structures": lazy(() =>
		import("./lessons/multi-leg-structures").then((m) => ({
			default: m.MultiLegStructuresWalkthrough,
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
	"checkpoint-orientation": lazy(() =>
		import("./lessons/checkpoint-orientation").then((m) => ({
			default: m.CheckpointOrientationWalkthrough,
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
	"put-call-parity": lazy(() =>
		import("./lessons/put-call-parity").then((m) => ({
			default: m.PutCallParityWalkthrough,
		})),
	),
	"expiration-settlement": lazy(() =>
		import("./lessons/expiration-settlement").then((m) => ({
			default: m.ExpirationSettlementWalkthrough,
		})),
	),
	"checkpoint-contracts": lazy(() =>
		import("./lessons/checkpoint-contracts").then((m) => ({
			default: m.CheckpointContractsWalkthrough,
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
	"checkpoint-execution": lazy(() =>
		import("./lessons/checkpoint-execution").then((m) => ({
			default: m.CheckpointExecutionWalkthrough,
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
}: {
	lessonId: string;
	locale: Locale;
}) {
	const Lesson = lessons[lessonId as keyof typeof lessons];
	if (!Lesson) return null;
	return (
		<VisualLessonIdentity value={lessonId}>
			<div
				className="visual-color-system"
				data-visual-palette={getDiagramPalette(lessonId)}
			>
				<LessonMotion>
					<Suspense
						fallback={
							<LessonLoading
								locale={locale}
								checkpoint={
									syllabus.find((lesson) => lesson.id === lessonId)?.kind ===
									"checkpoint"
								}
							/>
						}
					>
						<Lesson locale={locale} />
					</Suspense>
				</LessonMotion>
			</div>
		</VisualLessonIdentity>
	);
}
