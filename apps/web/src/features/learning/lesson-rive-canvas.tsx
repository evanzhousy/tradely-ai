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
import { useEffect, useMemo, useRef, useState } from "react";

// Keep the pinned runtime local: no CDN requests, fonts, scripts, or external assets.
RuntimeLoader.setWasmUrl(wasmUrl);
RuntimeLoader.setWasmFallbackUrl(null);

export type LessonRiveValues = {
	numbers: Record<string, number>;
	colors: Record<string, number>;
};

function resizeSurface(instance: Rive) {
	// Preserve the React runtime's pixel-ratio cap when sizing the canvas ourselves.
	instance.resizeDrawingSurfaceToCanvas(
		Math.min(3, Math.max(1, window.devicePixelRatio || 1)),
	);
}

function writeValues(
	instance: ViewModelInstance,
	values: LessonRiveValues,
	duration: number,
) {
	const motion = instance.number("motionSeconds");
	if (!motion) throw new Error("The Rive asset is missing its motion binding");
	motion.value = duration;
	for (const [name, value] of Object.entries(values.numbers)) {
		const property = instance.number(name);
		if (!property || !Number.isFinite(value))
			throw new Error(`Invalid Rive binding: ${name}`);
		property.value = value;
	}
	for (const [name, value] of Object.entries(values.colors)) {
		const property = instance.color(name);
		if (!property) throw new Error(`Missing Rive color: ${name}`);
		property.value = value;
	}
}

/** This component owns the Rive lifetime, never the lesson's clock or matching rules. */
export default function LessonRiveCanvas({
	src,
	name,
	className,
	values,
	playing,
	onFailure,
}: {
	src: string;
	name: string;
	className?: string;
	values: LessonRiveValues;
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
	const layout = useMemo(
		() => new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
		[],
	);
	const { rive, container, setCanvasRef, setContainerRef } = useRive(
		{
			src,
			artboard: name,
			stateMachine: "Walkthrough",
			layout,
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
					const model = instance.viewModelByName(name)?.defaultInstance();
					if (!model) throw new Error("Missing Rive view model");
					// Never display the asset's placeholder quantities, even for its first frame.
					writeValues(model, latest.current, 0);
					instance.setViewModelInstance(model);
					instance.bind();
					resizeSurface(instance);
					setReady(true);
				} catch {
					onFailure();
				}
			},
		},
		// One owner resizes and redraws the canvas, including when its state machine is paused.
		{ useOffscreenRenderer: true, shouldResizeCanvasToContainer: false },
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
		const resize = () => {
			// React may dispose the runtime before a queued resize notification is delivered.
			if (
				!connected ||
				!container.isConnected ||
				native.current !== rive ||
				!rive.viewModelInstance
			)
				return;
			resizeSurface(rive);
			if (!latestPlaying.current) {
				pendingSnapshot.current = true;
				rive.play("Walkthrough");
			}
		};
		const observer = new ResizeObserver(resize);
		observer.observe(container);
		window.addEventListener("resize", resize);
		return () => {
			connected = false;
			observer.disconnect();
			window.removeEventListener("resize", resize);
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
			ref={setContainerRef}
			className={`lesson-rive-canvas ${className ?? ""}`}
			data-rive-status={ready ? "ready" : "loading"}
		>
			<canvas ref={setCanvasRef} aria-hidden="true" tabIndex={-1} />
		</div>
	);
}
