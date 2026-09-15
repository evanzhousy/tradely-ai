import { useRive } from "@rive-app/react-webgl2";
import {
	Alignment,
	Fit,
	Layout,
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
	const [ready, setReady] = useState(false);
	const { rive, RiveComponent } = useRive(
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
			onRiveReady: (instance) => {
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
		if (!rive || !ready) return;
		const instance = rive.viewModelInstance;
		if (!instance) return onFailure();
		const signature = JSON.stringify(values);
		const changed = previous.current !== signature;
		try {
			if (changed) {
				writeValues(instance, values, playing && previous.current ? 0.42 : 0);
				previous.current = signature;
				// An explicit step/exploration edit renders one exact pose, including while paused.
				if (!playing) rive.stopRendering();
				rive.play("Walkthrough");
			} else if (playing) {
				rive.play("Walkthrough");
			}
			if (!playing) rive.pause("Walkthrough");
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
