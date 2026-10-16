import { Skeleton } from "@tradely/ui/components/skeleton";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@tradely/ui/components/tabs";
import { type ComponentType, lazy, Suspense } from "react";
import { syllabus } from "@/content/syllabus";
import { pick } from "@/content/world";
import type { Locale } from "@/i18n/messages";
import { getDiagramPalette } from "./diagram-palette";
import { LessonMotion } from "./lesson-motion";
import { LessonSurfaceBoundary } from "./lesson-surface-boundary";
import { VisualLessonIdentity } from "./visual-lesson-identity";
import { playerCopy } from "./walkthrough/player-copy";

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
						{pick(playerCopy.watch, locale)}
					</TabsTrigger>
					<TabsTrigger value="play" isDisabled>
						{pick(playerCopy.playground, locale)}
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

function lessonModule(
	load: () => Promise<{ default: ComponentType<{ locale: Locale }> }>,
) {
	let promise: ReturnType<typeof load> | undefined;
	const loadOnce = () => (promise ??= load());
	return {
		Component: lazy(loadOnce),
		preload: () => loadOnce().catch(() => undefined),
	};
}

const lessons = {
	"iv-rank-percentile": lessonModule(() =>
		import("./lessons/iv-rank-percentile").then((m) => ({
			default: m.IvRankPercentileWalkthrough,
		})),
	),
	"dex-dei-gex": lessonModule(() =>
		import("./lessons/dex-dei-gex").then((m) => ({
			default: m.DexDeiWalkthrough,
		})),
	),
	"checkpoint-exposure": lessonModule(() =>
		import("./lessons/checkpoint-exposure").then((m) => ({
			default: m.CheckpointExposureWalkthrough,
		})),
	),
	"gamma-exposure": lessonModule(() =>
		import("./lessons/gamma-exposure").then((m) => ({
			default: m.GammaExposureWalkthrough,
		})),
	),
	"gamma-regimes": lessonModule(() =>
		import("./lessons/gamma-regimes").then((m) => ({
			default: m.GammaRegimesWalkthrough,
		})),
	),
	"structural-levels": lessonModule(() =>
		import("./lessons/structural-levels").then((m) => ({
			default: m.StructuralLevelsWalkthrough,
		})),
	),
	"charm-vanna": lessonModule(() =>
		import("./lessons/charm-vanna").then((m) => ({
			default: m.CharmVannaWalkthrough,
		})),
	),
	"checkpoint-structure": lessonModule(() =>
		import("./lessons/checkpoint-structure").then((m) => ({
			default: m.CheckpointStructureWalkthrough,
		})),
	),
	"audited-boundary": lessonModule(() =>
		import("./lessons/audited-boundary").then((m) => ({
			default: m.AuditedBoundaryWalkthrough,
		})),
	),
	"symbol-universe": lessonModule(() =>
		import("./lessons/symbol-universe").then((m) => ({
			default: m.SymbolUniverseWalkthrough,
		})),
	),
	"rank-symbols": lessonModule(() =>
		import("./lessons/rank-symbols").then((m) => ({
			default: m.RankSymbolsWalkthrough,
		})),
	),
	"rank-contracts": lessonModule(() =>
		import("./lessons/rank-contracts").then((m) => ({
			default: m.RankContractsWalkthrough,
		})),
	),
	"point-in-time-research": lessonModule(() =>
		import("./lessons/point-in-time-research").then((m) => ({
			default: m.PointInTimeResearchWalkthrough,
		})),
	),
	"checkpoint-research": lessonModule(() =>
		import("./lessons/checkpoint-research").then((m) => ({
			default: m.CheckpointResearchWalkthrough,
		})),
	),
	"cookbook-research-packet": lessonModule(() =>
		import("./lessons/cookbook-research-packet").then((m) => ({
			default: m.ResearchPacketWalkthrough,
		})),
	),
	"market-recap": lessonModule(() =>
		import("./lessons/market-recap").then((m) => ({
			default: m.MarketRecapWalkthrough,
		})),
	),
	"audit-market-recap": lessonModule(() =>
		import("./lessons/audit-market-recap").then((m) => ({
			default: m.AuditMarketRecapWalkthrough,
		})),
	),
	"checkpoint-production": lessonModule(() =>
		import("./lessons/checkpoint-production").then((m) => ({
			default: m.CheckpointProductionWalkthrough,
		})),
	),
	"portfolio-pnl": lessonModule(() =>
		import("./lessons/portfolio-pnl").then((m) => ({
			default: m.PortfolioPnlWalkthrough,
		})),
	),
	"portfolio-performance": lessonModule(() =>
		import("./lessons/portfolio-performance").then((m) => ({
			default: m.PortfolioPerformanceWalkthrough,
		})),
	),
	"tradingflow-recipes": lessonModule(() =>
		import("./lessons/tradingflow-recipes").then((m) => ({
			default: m.TradingflowRecipesWalkthrough,
		})),
	),
	"recipe-map": lessonModule(() =>
		import("./lessons/recipe-map").then((m) => ({
			default: m.RecipeMapWalkthrough,
		})),
	),
	"recipe-inputs": lessonModule(() =>
		import("./lessons/recipe-inputs").then((m) => ({
			default: m.RecipeInputsWalkthrough,
		})),
	),
	"research-checklist": lessonModule(() =>
		import("./lessons/research-checklist").then((m) => ({
			default: m.ResearchChecklistWalkthrough,
		})),
	),
	"ai-verify": lessonModule(() =>
		import("./lessons/ai-verify").then((m) => ({
			default: m.AiVerifyWalkthrough,
		})),
	),
	"custom-formulas": lessonModule(() =>
		import("./lessons/custom-formulas").then((m) => ({
			default: m.CustomFormulasWalkthrough,
		})),
	),
	"edit-with-ai": lessonModule(() =>
		import("./lessons/edit-with-ai").then((m) => ({
			default: m.EditWithAiWalkthrough,
		})),
	),
	"connect-agent": lessonModule(() =>
		import("./lessons/connect-agent").then((m) => ({
			default: m.ConnectAgentWalkthrough,
		})),
	),
	"checkpoint-workflows": lessonModule(() =>
		import("./lessons/checkpoint-workflows").then((m) => ({
			default: m.CheckpointWorkflowsWalkthrough,
		})),
	),
	"portfolio-exposure": lessonModule(() =>
		import("./lessons/portfolio-exposure").then((m) => ({
			default: m.PortfolioExposureWalkthrough,
		})),
	),
	"checkpoint-portfolio": lessonModule(() =>
		import("./lessons/checkpoint-portfolio").then((m) => ({
			default: m.CheckpointPortfolioWalkthrough,
		})),
	),
	"volatility-surface": lessonModule(() =>
		import("./lessons/volatility-surface").then((m) => ({
			default: m.VolatilitySurfaceWalkthrough,
		})),
	),
	"implied-realized-volatility": lessonModule(() =>
		import("./lessons/implied-realized-volatility").then((m) => ({
			default: m.ImpliedRealizedVolatilityWalkthrough,
		})),
	),
	"expected-move": lessonModule(() =>
		import("./lessons/expected-move").then((m) => ({
			default: m.ExpectedMoveWalkthrough,
		})),
	),
	"theta-vega-rho": lessonModule(() =>
		import("./lessons/theta-vega-rho").then((m) => ({
			default: m.ThetaVegaRhoWalkthrough,
		})),
	),
	"zero-dte": lessonModule(() =>
		import("./lessons/zero-dte").then((m) => ({
			default: m.ZeroDteWalkthrough,
		})),
	),
	gamma: lessonModule(() =>
		import("./lessons/gamma").then((m) => ({ default: m.GammaWalkthrough })),
	),
	delta: lessonModule(() =>
		import("./lessons/delta").then((m) => ({ default: m.DeltaWalkthrough })),
	),
	"symbol-drawer": lessonModule(() =>
		import("./lessons/symbol-drawer").then((m) => ({
			default: m.SymbolDrawerWalkthrough,
		})),
	),
	"checkpoint-flow": lessonModule(() =>
		import("./lessons/checkpoint-flow").then((m) => ({
			default: m.CheckpointFlowWalkthrough,
		})),
	),
	"unusual-activity": lessonModule(() =>
		import("./lessons/unusual-activity").then((m) => ({
			default: m.UnusualActivityWalkthrough,
		})),
	),
	"option-strategies": lessonModule(() =>
		import("./lessons/option-strategies").then((m) => ({
			default: m.OptionStrategiesWalkthrough,
		})),
	),
	"multi-leg-structures": lessonModule(() =>
		import("./lessons/multi-leg-structures").then((m) => ({
			default: m.MultiLegStructuresWalkthrough,
		})),
	),
	"stocks-and-prices": lessonModule(() =>
		import("./lessons/stocks-and-prices").then((m) => ({
			default: m.StocksAndPricesWalkthrough,
		})),
	),
	"what-options-are": lessonModule(() =>
		import("./lessons/what-options-are").then((m) => ({
			default: m.WhatOptionsAreWalkthrough,
		})),
	),
	"trading-options": lessonModule(() =>
		import("./lessons/trading-options").then((m) => ({
			default: m.TradingOptionsWalkthrough,
		})),
	),
	"options-risks": lessonModule(() =>
		import("./lessons/options-risks").then((m) => ({
			default: m.OptionsRisksWalkthrough,
		})),
	),
	"checkpoint-orientation": lessonModule(() =>
		import("./lessons/checkpoint-orientation").then((m) => ({
			default: m.CheckpointOrientationWalkthrough,
		})),
	),
	"option-contracts": lessonModule(() =>
		import("./lessons/option-contracts").then((m) => ({
			default: m.OptionContractsWalkthrough,
		})),
	),
	"option-rights": lessonModule(() =>
		import("./lessons/option-rights").then((m) => ({
			default: m.OptionRightsWalkthrough,
		})),
	),
	"premium-payoff": lessonModule(() =>
		import("./lessons/premium-payoff").then((m) => ({
			default: m.PremiumPayoffWalkthrough,
		})),
	),
	"put-call-parity": lessonModule(() =>
		import("./lessons/put-call-parity").then((m) => ({
			default: m.PutCallParityWalkthrough,
		})),
	),
	"expiration-settlement": lessonModule(() =>
		import("./lessons/expiration-settlement").then((m) => ({
			default: m.ExpirationSettlementWalkthrough,
		})),
	),
	"checkpoint-contracts": lessonModule(() =>
		import("./lessons/checkpoint-contracts").then((m) => ({
			default: m.CheckpointContractsWalkthrough,
		})),
	),
	"quotes-orders-trades": lessonModule(() =>
		import("./lessons/quotes-orders-trades").then((m) => ({
			default: m.QuotesOrdersTradesWalkthrough,
		})),
	),
	"execution-counterparties": lessonModule(() =>
		import("./lessons/execution-counterparties").then((m) => ({
			default: m.ExecutionCounterpartiesWalkthrough,
		})),
	),
	"execution-side": lessonModule(() =>
		import("./lessons/execution-side").then((m) => ({
			default: m.ExecutionSideWalkthrough,
		})),
	),
	"flow-sentiment": lessonModule(() =>
		import("./lessons/flow-sentiment").then((m) => ({
			default: m.FlowSentimentWalkthrough,
		})),
	),
	"validate-option-print": lessonModule(() =>
		import("./lessons/validate-option-print").then((m) => ({
			default: m.ValidateOptionPrintWalkthrough,
		})),
	),
	"checkpoint-execution": lessonModule(() =>
		import("./lessons/checkpoint-execution").then((m) => ({
			default: m.CheckpointExecutionWalkthrough,
		})),
	),
	"session-flow-vs-structure": lessonModule(() =>
		import("./lessons/session-flow-vs-structure").then((m) => ({
			default: m.VolumeOpenInterestWalkthrough,
		})),
	),
	"trade-records": lessonModule(() =>
		import("./lessons/trade-records").then((m) => ({
			default: m.TradeRecordsWalkthrough,
		})),
	),
	"execution-conditions": lessonModule(() =>
		import("./lessons/execution-conditions").then((m) => ({
			default: m.ExecutionConditionsWalkthrough,
		})),
	),
};
/** Navigation can overlap the selected module download with the public page read. */
export function preloadVisualLesson(lessonId: string) {
	if (typeof window === "undefined") return;
	void lessons[lessonId as keyof typeof lessons]?.preload();
}

export function VisualLesson({
	lessonId,
	locale,
}: {
	lessonId: string;
	locale: Locale;
}) {
	const Lesson = lessons[lessonId as keyof typeof lessons]?.Component;
	if (!Lesson) return null;
	return (
		<LessonSurfaceBoundary
			key={lessonId}
			lessonId={lessonId}
			locale={locale}
			surface="visual"
		>
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
		</LessonSurfaceBoundary>
	);
}
