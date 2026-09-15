import { useRive } from "@rive-app/react-webgl2";
import {
	Alignment,
	Fit,
	Layout,
	type Rive,
	RuntimeLoader,
	type ViewModelInstance,
} from "@rive-app/webgl2";
import wasmUrl from "@rive-app/webgl2/rive.wasm?url";
import { useEffect, useRef, useState } from "react";
import assetUrl from "./rive/liquidity/liquidity.riv?url&inline";

// Keep the pinned runtime local: no CDN requests, fonts, scripts, or external assets.
RuntimeLoader.setWasmUrl(wasmUrl);
RuntimeLoader.setWasmFallbackUrl(null);

export type LiquidityCanvasValues = {
	numbers: Record<string, number>;
	colors: Record<string, number>;
};

function writeValues(
	instance: ViewModelInstance,
	values: LiquidityCanvasValues,
	duration: number,
) {
	const motion = instance.number("motionSeconds");
	if (!motion)
		throw new Error("The liquidity asset is missing its motion binding");
	motion.value = duration;
	for (const [name, value] of Object.entries(values.numbers)) {
		const property = instance.number(name);
		if (!property || !Number.isFinite(value))
			throw new Error(`Invalid liquidity binding: ${name}`);
		property.value = value;
	}
	for (const [name, value] of Object.entries(values.colors)) {
		const property = instance.color(name);
		if (!property) throw new Error(`Missing liquidity color: ${name}`);
		property.value = value;
	}
}

/** This component owns the Rive lifetime, never the lesson's clock or matching rules. */
export default function LiquidityRiveCanvas({
	values,
	playing,
	onFailure,
}: {
	values: LiquidityCanvasValues;
	playing: boolean;
	onFailure: () => void;
}) {
	const latest = useRef(values);
	latest.current = values;
	const previous = useRef("");
	const native = useRef<Rive | null>(null);
	const latestPlaying = useRef(playing);
	latestPlaying.current = playing;
	const pendingSnapshot = useRef(false);
	const pauseFrame = useRef<number | null>(null);
	const [ready, setReady] = useState(false);
	const { rive, container, RiveComponent } = useRive(
		{
			src: assetUrl,
			artboard: "Liquidity",
			stateMachine: "Walkthrough",
			layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
			autoplay: true,
			autoBind: false,
			enableRiveAssetCDN: false,
			shouldDisableRiveListeners: true,
			onLoadError: onFailure,
			onAdvance: () => {
				if (!pendingSnapshot.current || latestPlaying.current) return;
				pendingSnapshot.current = false;
				if (pauseFrame.current !== null)
					cancelAnimationFrame(pauseFrame.current);
				// Pause after the renderer has painted the newly bound pose, not before it advances.
				pauseFrame.current = requestAnimationFrame(() => {
					pauseFrame.current = null;
					if (!latestPlaying.current && native.current?.viewModelInstance)
						native.current.pause("Walkthrough");
				});
			},
			onRiveReady: (instance) => {
				native.current = instance;
				try {
					const model = instance
						.viewModelByName("Liquidity")
						?.defaultInstance();
					if (!model) throw new Error("Missing liquidity view model");
					// Never display the asset's placeholder quantities, even for its first frame.
					writeValues(model, latest.current, 0);
					instance.setViewModelInstance(model);
					instance.bind();
					setReady(true);
				} catch {
					onFailure();
				}
			},
		},
		{ useOffscreenRenderer: true },
	);

	useEffect(() => {
		if (ready) return;
		const timeout = window.setTimeout(onFailure, 12000);
		return () => window.clearTimeout(timeout);
	}, [ready, onFailure]);

	useEffect(() => {
		if (!rive || !container || !rive.viewModelInstance) return;
		native.current = rive;
		let connected = true;
		const observer = new ResizeObserver(() => {
			// React may dispose the runtime before a queued resize notification is delivered.
			if (
				!connected ||
				!container.isConnected ||
				native.current !== rive ||
				!rive.viewModelInstance
			)
				return;
			if (!latestPlaying.current) {
				pendingSnapshot.current = true;
				rive.play("Walkthrough");
			}
		});
		observer.observe(container);
		return () => {
			connected = false;
			observer.disconnect();
			if (pauseFrame.current !== null) cancelAnimationFrame(pauseFrame.current);
			if (native.current === rive) native.current = null;
		};
	}, [rive, container]);

	useEffect(() => {
		if (!rive || !ready) return;
		const instance = rive.viewModelInstance;
		if (!instance) return onFailure();
		const signature = JSON.stringify(values);
		const changed = previous.current !== signature;
		try {
			if (changed) {
				writeValues(instance, values, playing && previous.current ? 0.42 : 0);
				previous.current = signature;
				pendingSnapshot.current = !playing;
				rive.play("Walkthrough");
			} else if (playing) {
				pendingSnapshot.current = false;
				rive.play("Walkthrough");
			}
			if (!playing && !pendingSnapshot.current) rive.pause("Walkthrough");
		} catch {
			onFailure();
		}
	}, [rive, ready, values, playing, onFailure]);

	return (
		<div
			className="liquidity-rive-canvas"
			data-rive-status={ready ? "ready" : "loading"}
		>
			<RiveComponent aria-hidden="true" tabIndex={-1} />
		</div>
	);
}
