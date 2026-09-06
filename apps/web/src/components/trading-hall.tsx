import { Button } from "@tradely/ui/components/button";
import {
	ArrowDownIcon,
	PauseIcon,
	PlayIcon,
	RotateCcwIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { HallController } from "@/features/trading-hall/renderer";
import { useI18n } from "@/i18n/provider";

export function TradingHall({ children }: { children: ReactNode }) {
	const story = useRef<HTMLElement>(null);
	const host = useRef<HTMLDivElement>(null);
	const controller = useRef<HallController | null>(null);
	const [state, setState] = useState<"loading" | "ready" | "fallback">(
		"loading",
	);
	const [paused, setPaused] = useState(false);
	const { t } = useI18n();
	useEffect(() => {
		const element = host.current;
		const section = story.current;
		if (!element || !section) return;
		let cancelled = false;
		const abort = new AbortController();
		import("@/features/trading-hall/renderer")
			.then(({ createTradingHall }) =>
				createTradingHall(element, section, abort.signal),
			)
			.then((instance) => {
				if (cancelled) {
					instance.dispose();
					return;
				}
				controller.current = instance;
				setState("ready");
			})
			.catch(() => {
				if (!cancelled) {
					element.dataset.state = "fallback";
					setState("fallback");
				}
			});
		return () => {
			cancelled = true;
			abort.abort();
			controller.current?.dispose();
			controller.current = null;
		};
	}, []);
	return (
		<section
			ref={story}
			className="trading-hall-story"
			aria-label={t("hall.sceneLabel")}
		>
			<div
				className="trading-hall-stage observatory-hero observatory-surface"
				data-chapter="opening"
				data-load={state}
			>
				<div ref={host} className="trading-hall-canvas" aria-hidden="true" />
				<div className="trading-hall-shade" aria-hidden="true" />
				<div className="trading-hall-status">
					<span />
					{t("hall.simulation")}
				</div>
				{children}
				<div className="trading-hall-focus" aria-hidden="true">
					<i />
					<span>{t("home.pathTwo")}</span>
				</div>
				<div className="trading-hall-captions" aria-live="off">
					<div className="hall-caption-observe">
						<p>{t("hall.observeLabel")}</p>
						<h2>{t("hall.observeTitle")}</h2>
						<span>{t("hall.observeBody")}</span>
					</div>
					<div className="hall-caption-verify">
						<p>{t("hall.verifyLabel")}</p>
						<h2>{t("hall.verifyTitle")}</h2>
						<span>{t("hall.verifyBody")}</span>
					</div>
				</div>
				<div className="trading-hall-bottom">
					<div className="trading-hall-scroll">
						<ArrowDownIcon size={14} aria-hidden="true" />
						<span>{t("hall.scroll")}</span>
						<i>
							<b />
						</i>
					</div>
					{state === "ready" ? (
						<div className="trading-hall-controls">
							<Button
								variant="ghost"
								size="sm"
								aria-pressed={paused}
								onClick={() => {
									controller.current?.setPaused(!paused);
									setPaused(!paused);
								}}
							>
								{paused ? (
									<PlayIcon data-icon="inline-start" aria-hidden="true" />
								) : (
									<PauseIcon data-icon="inline-start" aria-hidden="true" />
								)}
								{t(paused ? "home.resumeMotion" : "home.pauseMotion")}
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label={t("hall.replay")}
								disabled={paused}
								onClick={() => controller.current?.replay()}
							>
								<RotateCcwIcon aria-hidden="true" />
							</Button>
						</div>
					) : (
						<span className="trading-hall-loading">
							{t(state === "loading" ? "hall.loading" : "hall.static")}
						</span>
					)}
				</div>
			</div>
		</section>
	);
}
