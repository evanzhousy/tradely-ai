import { Button } from "@tradely/ui/components/button";
import { useTheme } from "next-themes";
import {
	Component,
	lazy,
	type ReactNode,
	Suspense,
	useCallback,
	useContext,
	useEffect,
	useMemo,
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
import { SceneOutcome } from "./scene-outcome";
import { VisualPlayback } from "./visual-playback";

const Canvas = lazy(() => import("./liquidity-rive-canvas"));

class CanvasBoundary extends Component<
	{ children: ReactNode; fallback: ReactNode; onFailure: () => void },
	{ failed: boolean }
> {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	componentDidCatch() {
		this.props.onFailure();
	}
	render() {
		return this.state.failed ? this.props.fallback : this.props.children;
	}
}

export default function RiveLiquidityPilot({
	locale,
	side,
	instruction,
	limit,
	quantity,
	frame,
	result,
	fallback,
}: {
	locale: Locale;
	side: ExecutionSide;
	instruction: OrderInstruction;
	limit: number;
	quantity: number;
	frame: number;
	result: ReturnType<typeof matchDisplayedBook>;
	fallback: ReactNode;
}) {
	const l = (en: string, zh: string) => (locale === "zh" ? zh : en);
	const playback = useContext(VisualPlayback);
	const { resolvedTheme } = useTheme();
	const dark = resolvedTheme === "dark";
	const [motionAllowed, setMotionAllowed] = useState(false);
	const [simple, setSimple] = useState(false);
	const [failed, setFailed] = useState(false);
	const onFailure = useCallback(() => setFailed(true), []);
	useEffect(() => {
		const query = window.matchMedia("(prefers-reduced-motion: reduce)");
		const update = () => setMotionAllowed(!query.matches);
		update();
		query.addEventListener("change", update);
		return () => query.removeEventListener("change", update);
	}, []);

	const active = frame >= 2 && frame <= 4 ? frame - 2 : -1;
	const activeRow = result.rows[active];
	const values = useMemo<LiquidityCanvasValues>(() => {
		const scale = Math.max(1, ...result.rows.map((row) => row.size));
		const lastFill = result.rows.reduce(
			(last, row, i) => (row.filled > 0 ? i : last),
			-1,
		);
		// A fully filled order never travels on to an unnecessary price level.
		const markerRow =
			result.unfilled === 0 && !activeRow?.filled && lastFill >= 0
				? lastFill
				: active;
		const numbers: Record<string, number> = {
			tokenX: result.rows[markerRow]?.filled ? 148 : 90,
			tokenY: frame === 5 ? 365 : markerRow >= 0 ? 126 + markerRow * 100 : 35,
			tokenOpacity: frame > 0 ? 1 : 0,
		};
		result.rows.forEach((row, i) => {
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
	}, [result.rows, result.unfilled, side, dark, activeRow, active, frame]);

	const showMotion = motionAllowed && !simple && !failed;
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
		>
			{motionAllowed && !failed ? (
				<div className="flex justify-end p-3">
					<Button
						size="sm"
						variant="ghost"
						aria-pressed={simple}
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
						</p>
						<p className="outcome-note">
							{side === "buy"
								? l("Match resting asks", "匹配挂单卖价")
								: l("Match resting bids", "匹配挂单买价")}
						</p>
					</header>
					<div
						className="liquidity-rive-stage"
						role="img"
						aria-label={l(
							"An incoming order follows displayed liquidity. Exact quantities are listed below and in the order book.",
							"主动订单沿可见流动性撮合，精确数量列在下方及订单簿中。",
						)}
					>
						<Suspense fallback={<div className="liquidity-rive-canvas" />}>
							<Canvas
								values={values}
								playing={playback?.playing ?? false}
								onFailure={onFailure}
							/>
						</Suspense>
						<span className="liquidity-order-label">{l("Order", "订单")}</span>
						{result.rows.map((row, i) => (
							<div
								key={row.price}
								className="liquidity-level-label"
								style={{ top: `${((64 + i * 100) / 400) * 100}%` }}
								data-liquidity-price={row.price}
								data-liquidity-remaining={row.remaining}
							>
								<span className="flex justify-between gap-2">
									<strong>{money(row.price)}</strong>
									<span>
										{row.remaining}/{row.size} {l("left", "剩余")}
									</span>
								</span>
								<small>
									{!row.eligible
										? l("Outside limit · no fill", "超出限价 · 不成交")
										: frame < i + 2
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
							note={l(
								"Bar length shows displayed size. Faded prices are outside the limit. Matching beyond this book is unknown.",
								"条形长度表示可见数量，淡色价位超出限价。此订单簿以外的撮合未知。",
							)}
						/>
					</div>
				</CanvasBoundary>
			) : (
				fallbackView
			)}
		</div>
	);
}
