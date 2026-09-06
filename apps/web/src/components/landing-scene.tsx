import { Button } from "@tradely/ui/components/button";
import { PauseIcon, PlayIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/provider";
import type { LandingSceneController } from "@/lib/landing-scene-renderer";

/** Decorative scenes own their GPU lifecycle; all learning content stays in HTML. */
export function LandingScene({ variant }: { variant: "hero" | "terrain" }) {
	const host = useRef<HTMLDivElement>(null);
	const controller = useRef<LandingSceneController | null>(null);
	const [paused, setPaused] = useState(false);
	const [ready, setReady] = useState(false);
	const { t } = useI18n();

	useEffect(() => {
		const element = host.current;
		if (!element) return;
		let cancelled = false;
		let loading = false;
		const observer = new IntersectionObserver(
			async (entries) => {
				if (loading || !entries.some((entry) => entry.isIntersecting)) return;
				loading = true;
				observer.disconnect();
				try {
					const { mountLandingScene } = await import(
						"@/lib/landing-scene-renderer"
					);
					if (cancelled) return;
					controller.current = mountLandingScene(element, variant);
					setReady(true);
				} catch {
					element.dataset.state = "fallback";
				}
			},
			{ rootMargin: "200px" },
		);
		observer.observe(element);
		return () => {
			cancelled = true;
			observer.disconnect();
			controller.current?.dispose();
			controller.current = null;
		};
	}, [variant]);

	return (
		<>
			<div
				ref={host}
				className={`observatory-scene observatory-scene-${variant}`}
				aria-hidden="true"
			/>
			{ready ? (
				<Button
					variant="ghost"
					size="sm"
					className="observatory-motion"
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
			) : null}
		</>
	);
}
