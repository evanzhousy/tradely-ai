import { Button } from "@tradely/ui/components/button";
import { useTheme } from "next-themes";
import {
	lazy,
	type ReactNode,
	Suspense,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";
import type { Locale } from "@/i18n/messages";
import type { LessonRiveValues } from "./lesson-rive-canvas";
import { RiveSceneBoundary, useRiveMotionAllowed } from "./rive-scene-support";
import { SceneOutcome } from "./scene-outcome";
import {
	cashTerms,
	physicalTerms,
	type SettlementOptionType,
} from "./settlement-concept-model";
import { VisualPlayback } from "./visual-playback";

const Canvas = lazy(() => import("./settlement-rive-canvas"));

/** Presentation receives signed holder movements from the existing settlement model. */
export default function SettlementAnimation({
	locale,
	kind,
	type,
	count,
	official,
	inspect,
	cash,
	shares,
	calculation,
	frame,
	fallback,
}: {
	locale: Locale;
	kind: "physical" | "cash";
	type: SettlementOptionType;
	count: number;
	official: number | null;
	inspect: string;
	cash: number | null;
	shares: number;
	calculation: string;
	frame: number;
	fallback: ReactNode;
}) {
	const l = (en: string, zh: string) => (locale === "zh" ? zh : en);
	const money = (value: number) =>
		`$${Math.abs(value).toLocaleString("en-US")}`;
	const playback = useContext(VisualPlayback);
	const { resolvedTheme } = useTheme();
	const motionAllowed = useRiveMotionAllowed();
	const [simple, setSimple] = useState(false);
	const [failed, setFailed] = useState(false);
	const onFailure = useCallback(() => setFailed(true), []);
	const physical = kind === "physical";
	const dark = resolvedTheme === "dark";
	const values = useMemo<LessonRiveValues>(() => {
		const position = (value: number | null) =>
			frame >= 2
				? value !== null && value > 0
					? 80
					: 520
				: value !== null && value > 0
					? 520
					: 80;
		const cashVisible = frame >= 1 && cash !== null && cash !== 0 ? 1 : 0;
		const sharesVisible = frame >= 1 && shares !== 0 ? 1 : 0;
		return {
			numbers: {
				cashX: position(cash),
				sharesX: position(shares),
				cashVisible,
				sharesVisible,
				cashArrowX: cash !== null && cash > 0 ? 50 : 550,
				sharesArrowX: shares > 0 ? 50 : 550,
				cashRotation: cash !== null && cash > 0 ? -Math.PI / 2 : Math.PI / 2,
				sharesRotation: shares > 0 ? -Math.PI / 2 : Math.PI / 2,
				cashLaneOpacity: cash === null || cash === 0 ? 0.2 : 0.6,
				sharesLaneOpacity: shares === 0 ? 0.15 : 0.6,
			},
			colors: {
				cashColor: dark ? 0xff60a5fa : 0xff1d4ed8,
				sharesColor: dark ? 0xff4ade80 : 0xff15803d,
			},
		};
	}, [cash, shares, frame, dark]);
	const cashDirection =
		cash === null
			? l("Cash unknown", "现金未知")
			: cash === 0
				? l("No cash transfer", "无现金交付")
				: cash < 0
					? l("Holder pays", "持有人支付")
					: l("Holder receives", "持有人收到");
	const sharesDirection =
		shares === 0
			? l("No shares delivered", "不交付股票")
			: shares > 0
				? l("Holder receives", "持有人收到")
				: l("Holder delivers", "持有人交付");
	const phases = [
		l("Contract terms", "合约条款"),
		l("Determine delivery", "确定交付"),
		l("Illustrated transfer", "交付演示"),
		cash === null
			? l("Awaiting official reference", "等待官方参考值")
			: l("Settlement result", "结算结果"),
	];
	const showMotion = motionAllowed && !simple && !failed;
	return (
		<section
			className="settlement-animation"
			data-settlement-view={showMotion ? "motion" : "simple"}
			data-settlement-kind={kind}
			data-settlement-phase={frame}
		>
			<header className="settlement-animation-header">
				<div>
					<h3>
						{physical ? "ALFA" : "IDX"} · {type} · {count}{" "}
						{l("contract(s)", "张")}
					</h3>
					<p className="outcome-note">
						{physical
							? l(
									`Strike $${physicalTerms.strike} · ${physicalTerms.sharesPerContract} shares/contract`,
									`行权价 $${physicalTerms.strike} · 每张 ${physicalTerms.sharesPerContract} 股`,
								)
							: l(
									`Strike ${cashTerms.strike.toLocaleString("en-US")} · $${cashTerms.dollarsPerPoint}/point`,
									`行权价 ${cashTerms.strike.toLocaleString("en-US")} · 每点 $${cashTerms.dollarsPerPoint}`,
								)}
					</p>
				</div>
				{motionAllowed && !failed ? (
					<Button
						variant="ghost"
						size="sm"
						data-lesson-action="presentation"
						aria-pressed={simple}
						onClick={() => setSimple((value) => !value)}
					>
						{simple
							? l("Motion view", "动态视图")
							: l("Simplified view", "简明视图")}
					</Button>
				) : null}
			</header>
			<p className="settlement-phase">{phases[frame]}</p>
			<SceneOutcome
				locale={locale}
				items={[
					{
						id: "settlement-cash",
						label: cashDirection,
						value: cash === null ? null : money(cash),
						unit: "USD",
					},
					{
						id: "settlement-shares",
						label: sharesDirection,
						value: Math.abs(shares),
						unit: l("shares", "股"),
					},
				]}
			/>
			<p className="settlement-calculation" data-settlement-calculation>
				{frame === 0
					? l(
							"Amounts follow these product terms. Physical delivery assumes exercise.",
							"金额遵循本产品条款，实物交付假定行权。",
						)
					: calculation}
			</p>
			{!physical ? (
				<section
					className="settlement-references"
					aria-label={l("Settlement references", "结算参考值")}
				>
					<span data-selected={inspect === "official"}>
						{l("Official", "官方")}:{" "}
						{official === null
							? l("Missing", "缺失")
							: official.toLocaleString("en-US")}
					</span>
					<span data-selected={inspect === "last"}>
						{l("Last display—not used", "最后显示值，不用于结算")}:{" "}
						{cashTerms.lastDisplay.toLocaleString("en-US")}
					</span>
				</section>
			) : null}
			{showMotion ? (
				<RiveSceneBoundary fallback={fallback} onFailure={onFailure}>
					<div className="settlement-parties">
						<strong>{l("Holder", "持有人")}</strong>
						<strong>{l("Settlement counterparty", "结算对手方")}</strong>
					</div>
					<div
						className="settlement-transfer-stage"
						role="img"
						aria-label={`${cashDirection}: ${cash === null ? l("unknown", "未知") : money(cash)}; ${sharesDirection}: ${Math.abs(shares)} ${l("shares", "股")}`}
					>
						<Suspense fallback={<div className="lesson-rive-canvas" />}>
							<Canvas
								values={values}
								playing={playback?.playing ?? false}
								onFailure={onFailure}
							/>
						</Suspense>
						<div className="settlement-lane-label settlement-lane-cash">
							<strong>
								{cash === null
									? l("Cash unknown", "现金未知")
									: `${money(cash)} ${l("cash", "现金")}`}
							</strong>
							<span>
								{cash === null
									? l(
											"Unknown · official reference missing",
											"未知 · 缺少官方参考值",
										)
									: cash === 0
										? l("No cash due", "无需现金交付")
										: cash < 0
											? l("holder → counterparty", "持有人 → 对手方")
											: l("counterparty → holder", "对手方 → 持有人")}
							</span>
						</div>
						<div className="settlement-lane-label settlement-lane-shares">
							<strong>
								{Math.abs(shares)} {l("shares", "股")}
							</strong>
							<span>
								{shares === 0
									? l("Cash settlement delivers no stock", "现金结算不交付股票")
									: shares > 0
										? l("counterparty → holder", "对手方 → 持有人")
										: l("holder → counterparty", "持有人 → 对手方")}
							</span>
						</div>
					</div>
				</RiveSceneBoundary>
			) : (
				fallback
			)}
			{failed ? (
				<p role="status" className="outcome-note">
					{l(
						"Motion view unavailable. Showing the simplified diagram.",
						"动态视图暂不可用，已显示简明图示。",
					)}
				</p>
			) : null}
			<p className="outcome-note">
				{physical
					? l(
							"Cash and shares form one paired exchange; no transfer order is implied. Exercise is assumed.",
							"现金与股票构成一组交换，不表示交付先后顺序。假定行权有效。",
						)
					: l(
							"Cash uses the official settlement reference. A missing reference prevents calculation.",
							"现金金额使用官方结算参考值，缺失时无法计算。",
						)}
			</p>
			<p className="outcome-note">
				{l(
					"Different illustrative products · settlement movements, not profit · premium and fees excluded",
					"不同教学产品 · 结算变动，不是利润 · 不计权利金与费用",
				)}
			</p>
		</section>
	);
}
