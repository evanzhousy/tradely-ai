import { Button } from "@tradely/ui/components/button";
import { useTheme } from "next-themes";
import {
	lazy,
	type ReactNode,
	Suspense,
	useCallback,
	useContext,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	type ExecutionSide,
	type matchDisplayedBook,
	executionMoney as money,
	type OrderInstruction,
} from "@/domain/learning/execution-concept";
import type { Locale } from "@/i18n/messages";
import type { LiquidityCanvasValues } from "./liquidity-rive-canvas";
import {
	RiveSceneBoundary as CanvasBoundary,
	useRiveMotionAllowed,
} from "./rive-scene-support";
import { SceneOutcome } from "./scene-outcome";
import { VisualPlayback } from "./visual-playback";

const Canvas = lazy(() => import("./liquidity-rive-canvas"));

export default function RiveLiquidityPilot({
	locale,
	side,
	instruction,
	limit,
	quantity,
	frame,
	activePrice,
	result,
	fallback,
}: {
	locale: Locale;
	side: ExecutionSide;
	instruction: OrderInstruction;
	limit: number;
	quantity: number;
	frame: number;
	activePrice: number | null;
	result: ReturnType<typeof matchDisplayedBook>;
	fallback: ReactNode;
}) {
	const l = (en: string, zh: string) => (locale === "zh" ? zh : en);
	const playback = useContext(VisualPlayback);
	const { resolvedTheme } = useTheme();
	const dark = resolvedTheme === "dark";
	const motionAllowed = useRiveMotionAllowed();
	const [simple, setSimple] = useState(false);
	const [failed, setFailed] = useState(false);
	const onFailure = useCallback(() => setFailed(true), []);

	// Match the full book's descending price order, independent of execution order.
	const displayRows = useMemo(
		() => [...result.rows].sort((a, b) => b.price - a.price),
		[result.rows],
	);
	const active = displayRows.findIndex((row) => row.price === activePrice);
	const activeRow = displayRows[active];
	const values = useMemo<LiquidityCanvasValues>(() => {
		const scale = Math.max(1, ...result.rows.map((row) => row.size));
		const markerRow = active;
		const numbers: Record<string, number> = {
			tokenX: activeRow?.filled ? 148 : 90,
			tokenY: frame === 5 ? 365 : markerRow >= 0 ? 126 + markerRow * 100 : 35,
			tokenOpacity: frame > 0 ? 1 : 0,
		};
		displayRows.forEach((row, i) => {
			numbers[`depth${i + 1}`] = (row.size / scale) * 360;
			numbers[`remaining${i + 1}`] = (row.remaining / scale) * 360;
			numbers[`emphasis${i + 1}`] = row.eligible ? 1 : 0.25;
		});
		return {
			numbers,
			colors: {
				sideColor:
					side === "buy"
						? dark
							? 0xfffb7185
							: 0xffbe123c
						: dark
							? 0xff4ade80
							: 0xff15803d,
				trackColor: dark ? 0xff6b7280 : 0xff9ca3af,
				markerColor:
					activeRow && !activeRow.eligible
						? dark
							? 0xfffbbf24
							: 0xffb45309
						: dark
							? 0xff60a5fa
							: 0xff1d4ed8,
			},
		};
	}, [result.rows, displayRows, side, dark, activeRow, active, frame]);

	const showMotion = motionAllowed && !simple && !failed;
	const quantityTag = useRef<HTMLSpanElement>(null);
	const previousTagY = useRef<number | null>(null);
	useLayoutEffect(() => {
		const changed = previousTagY.current !== values.numbers.tokenY;
		previousTagY.current = values.numbers.tokenY;
		for (const animation of quantityTag.current?.getAnimations() ?? []) {
			if (changed && !playback?.playing) animation.finish();
			else if (playback?.playing) animation.play();
			else animation.pause();
		}
	}, [values.numbers.tokenY, playback?.playing]);
	const fallbackView = (
		<>
			{fallback}
			{failed ? (
				<p className="outcome-note p-3" role="status">
					{l(
						"Motion view unavailable. Showing the simplified diagram.",
						"动态视图暂不可用，已显示简明图示。",
					)}
				</p>
			) : null}
		</>
	);
	return (
		<div
			className="liquidity-pilot"
			data-liquidity-view={showMotion ? "motion" : "simple"}
			data-playing={playback?.playing ?? false}
		>
			{motionAllowed && !failed ? (
				<div className="flex justify-end px-3">
					<Button
						size="sm"
						variant="ghost"
						aria-pressed={simple}
						data-lesson-action="presentation"
						onClick={() => setSimple((value) => !value)}
					>
						{simple
							? l("Motion view", "动态视图")
							: l("Simplified view", "简明视图")}
					</Button>
				</div>
			) : null}
			{showMotion ? (
				<CanvasBoundary fallback={fallbackView} onFailure={onFailure}>
					<header className="px-5 pb-2">
						<h3 className="font-semibold text-lg">
							{side === "buy" ? l("Buy", "买入") : l("Sell", "卖出")} {quantity}{" "}
							{l("contracts", "张")}
						</h3>
						<p className="outcome-note">
							{instruction === "market"
								? l("Market order", "市价单")
								: `${l("Limit", "限价")} ${money(limit)}`}
							{" · "}
							{side === "buy"
								? l("Resting asks", "挂单卖价")
								: l("Resting bids", "挂单买价")}
						</p>
					</header>
					<div className="p-4 pt-0">
						<SceneOutcome
							locale={locale}
							items={[
								{
									id: "filled",
									label: l("Filled", "已成交"),
									value: result.filled,
									unit: l("contracts", "张"),
								},
								{
									id: "unfilled",
									label:
										frame === 5
											? l("Unfilled", "未成交")
											: l("Remaining", "剩余"),
									value: result.unfilled,
									unit: l("contracts", "张"),
								},
								{
									id: "average",
									label: l("Average fill", "成交均价"),
									value: result.average === null ? null : money(result.average),
									unit: l("USD/share", "美元/股"),
								},
							]}
						/>
					</div>
					<div
						className="liquidity-rive-stage"
						role="img"
						aria-label={l(
							"An incoming order follows displayed liquidity. Exact quantities appear in the result cards and order book.",
							"主动订单沿可见流动性撮合，精确数量显示在结果卡片与订单簿中。",
						)}
					>
						<Suspense fallback={<div className="liquidity-rive-canvas" />}>
							<Canvas
								values={values}
								playing={playback?.playing ?? false}
								onFailure={onFailure}
							/>
						</Suspense>
						<span
							ref={quantityTag}
							className="liquidity-quantity-tag"
							style={{ top: `${values.numbers.tokenY / 4}%` }}
							data-blocked={activeRow?.eligible === false}
						>
							<strong>{frame < 2 ? quantity : result.unfilled}</strong>
							<span>
								{frame < 2
									? l("requested", "请求张数")
									: l("remaining", "剩余张数")}
							</span>
						</span>
						{displayRows.map((row, i) => (
							<div
								key={row.price}
								className="liquidity-level-label"
								style={{ top: `${((64 + i * 100) / 400) * 100}%` }}
								data-liquidity-price={row.price}
								data-liquidity-remaining={row.remaining}
								data-active={row.price === activePrice}
							>
								<span className="flex justify-between gap-2">
									<strong>{money(row.price)}</strong>
									<span>
										{row.remaining} {l("available", "可用")}
									</span>
								</span>
								<small>
									{!row.eligible
										? l("Outside limit · no fill", "超出限价 · 不成交")
										: frame < result.rows.indexOf(row) + 2
											? l("Available", "可撮合")
											: row.filled > 0
												? `${l("Filled", "已成交")} ${row.filled}`
												: l("No quantity needed here", "此档无剩余需求")}
								</small>
							</div>
						))}
						<span className="liquidity-result-label">
							{frame === 5
								? l("Displayed book complete", "已检查全部可见档位")
								: l("Follow the order", "追踪订单")}
						</span>
					</div>
					<p className="outcome-note px-4 pb-4">
						{l(
							"Available contracts · dimmed prices are outside the limit. Further liquidity is unknown.",
							"可用张数 · 淡色价位超出限价，更多流动性未知。",
						)}
					</p>
				</CanvasBoundary>
			) : (
				fallbackView
			)}
		</div>
	);
}
