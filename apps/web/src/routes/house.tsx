import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@tradely/ui/components/button";
import { ArrowUpRight, Box, Minus, Plus, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Quality } from "@/features/house/cinematic";
import { AREA_LABELS, type NavigationState } from "@/features/house/interior";
import type {
	HouseLayer,
	HouseView,
	HouseViewer,
} from "@/features/house/viewer";
import { pageHead } from "@/seo/pages";

export const Route = createFileRoute("/house")({
	head: () => pageHead("/house"),
	component: HousePage,
});

function HousePage() {
	const host = useRef<HTMLDivElement>(null);
	const viewer = useRef<HouseViewer | null>(null);
	const [status, setStatus] = useState<"loading" | "ready" | "error">(
		"loading",
	);
	const [navigation, setNavigation] = useState<NavigationState>({
		area: "exterior",
		phase: "idle",
		portal: null,
		error: null,
	});
	const busy = status !== "ready" || navigation.phase !== "idle";
	const [direction, setDirection] = useState(38);
	const [sunset, setSunset] = useState(0);
	const [duration, setDuration] = useState(30);
	const [playing, setPlaying] = useState(false);
	const [quality, setQuality] = useState<Quality | "auto">("auto");
	const [attempt, setAttempt] = useState(0);
	const [layers, setLayers] = useState<Record<HouseLayer, boolean>>({
		Roofs: true,
		Landscape: true,
		Context: true,
	});
	useEffect(() => {
		let cancelled = false;
		let instance: HouseViewer | undefined;
		// Retry creates a fresh renderer, also recovering from a lost WebGL context.
		void attempt;
		setStatus("loading");
		setLayers({ Roofs: true, Landscape: true, Context: true });
		void import("@/features/house/viewer")
			.then(({ createHouseViewer }) => {
				if (cancelled || !host.current) return;
				instance = createHouseViewer(
					host.current,
					() => {
						if (!cancelled) setStatus("ready");
					},
					() => {
						if (!cancelled) setStatus("error");
					},
					(state) => {
						if (!cancelled) setNavigation(state);
					},
				);
				viewer.current = instance;
			})
			.catch(() => {
				if (!cancelled) setStatus("error");
			});
		return () => {
			cancelled = true;
			instance?.dispose();
			viewer.current = null;
		};
	}, [attempt]);
	useEffect(() => {
		if (status === "ready") viewer.current?.setQuality(quality);
	}, [quality, status]);
	useEffect(() => {
		if (status === "ready") viewer.current?.setSunlight(direction, sunset);
	}, [direction, sunset, status]);
	useEffect(() => {
		if (!playing || status !== "ready") return;
		let last = performance.now();
		const timer = window.setInterval(() => {
			const now = performance.now();
			const delta = document.hidden ? 0 : Math.min((now - last) / 1000, 0.25);
			last = now;
			setSunset((value) => Math.min(1, value + delta / duration));
		}, 50);
		return () => window.clearInterval(timer);
	}, [playing, duration, status]);
	useEffect(() => {
		if (sunset >= 1 || status !== "ready" || navigation.area !== "exterior")
			setPlaying(false);
	}, [sunset, status, navigation.area]);
	function toggleLayer(layer: HouseLayer) {
		const visible = !layers[layer];
		setLayers((previous) => ({ ...previous, [layer]: visible }));
		viewer.current?.setLayer(layer, visible);
	}
	function view(value: HouseView) {
		viewer.current?.setView(value);
	}
	return (
		<main
			data-area={navigation.area}
			data-transition={navigation.phase}
			className="mx-auto min-h-svh max-w-[1600px] px-4 py-8 sm:px-8 sm:py-12"
		>
			<div className="mb-7 flex flex-wrap items-end justify-between gap-5">
				<div>
					<p className="mb-3 flex items-center gap-2 font-mono text-muted-foreground text-xs uppercase tracking-widest">
						<Box className="size-4" /> A house to explore / 001
					</p>
					<h1 className="font-semibold text-3xl tracking-tight sm:text-5xl">
						A home, from every angle.
					</h1>
					<p className="mt-3 text-muted-foreground">
						8311 NE 140th Street · Kirkland, Washington
					</p>
				</div>
				<a
					href="/models/kirkland-house/house.glb"
					download
					className="inline-flex items-center gap-2 text-sm underline underline-offset-4"
				>
					Download 3D model <ArrowUpRight className="size-4" />
				</a>
			</div>
			<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<label className="flex items-center gap-3 text-sm">
					画质 / Quality
					<select
						aria-label="Rendering quality"
						className="rounded-lg border border-border bg-background px-3 py-2"
						value={quality}
						onChange={(e) => setQuality(e.target.value as Quality | "auto")}
					>
						<option value="auto">自动 / Auto</option>
						<option value="high">高 / High</option>
						<option value="medium">中 / Medium</option>
						<option value="low">低 / Low</option>
					</select>
				</label>
				<Button
					variant="outline"
					disabled={busy}
					onClick={() => {
						setPlaying(false);
						setSunset(0.75);
						setDirection(210);
					}}
				>
					黄昏光照样板 / Golden hour
				</Button>
			</div>
			<section
				aria-label="Sunlight controls"
				className="mb-5 grid gap-5 rounded-2xl border border-border bg-background p-5 md:grid-cols-3"
			>
				<label className="flex flex-col gap-3 text-sm">
					<span className="flex justify-between gap-2">
						<span>Sun direction</span>
						<output>{direction}°</output>
					</span>
					<input
						aria-label="Sun direction"
						type="range"
						min="0"
						max="360"
						step="1"
						value={direction}
						disabled={busy || navigation.area !== "exterior"}
						onChange={(event) => setDirection(Number(event.target.value))}
						className="w-full accent-primary"
					/>
					<span className="text-muted-foreground text-xs">
						0° front · 90° right · 180° rear · 270° left
					</span>
				</label>
				<label className="flex flex-col gap-3 text-sm">
					<span className="flex justify-between gap-2">
						<span>Sunset timeline</span>
						<output>
							{Math.round(sunset * 100)}% · {Math.round(55 - sunset * 61)}°
							elevation
						</output>
					</span>
					<input
						aria-label="Sunset timeline"
						type="range"
						min="0"
						max="100"
						step="1"
						value={sunset * 100}
						disabled={busy || navigation.area !== "exterior"}
						onChange={(event) => {
							setPlaying(false);
							setSunset(Number(event.target.value) / 100);
						}}
						className="w-full accent-primary"
					/>
					<span className="text-muted-foreground text-xs">
						Daylight → golden hour → dusk. Visual simulation.
					</span>
				</label>
				<div className="flex flex-col gap-3">
					<label className="flex items-center justify-between gap-3 text-sm">
						Sunset duration
						<select
							aria-label="Sunset duration"
							value={duration}
							onChange={(event) => setDuration(Number(event.target.value))}
							className="rounded-md border border-border bg-background px-2 py-1"
						>
							<option value="10">10 seconds</option>
							<option value="30">30 seconds</option>
							<option value="60">60 seconds</option>
							<option value="120">2 minutes</option>
						</select>
					</label>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							disabled={busy || navigation.area !== "exterior"}
							onClick={() => {
								if (sunset >= 1) setSunset(0);
								setPlaying((value) => !value);
							}}
						>
							{playing
								? "Pause sunset"
								: sunset >= 1
									? "Replay sunset"
									: "Play sunset"}
						</Button>
						<Button
							variant="outline"
							disabled={busy || navigation.area !== "exterior"}
							onClick={() => {
								setPlaying(false);
								setSunset(0);
								setDirection(38);
							}}
						>
							Reset sunlight
						</Button>
						<span className="font-mono text-muted-foreground text-xs">
							{Math.ceil((1 - sunset) * duration)}s left
						</span>
					</div>
				</div>
			</section>
			<div className="grid overflow-hidden rounded-2xl border border-border lg:grid-cols-[1fr_280px]">
				<div className="relative min-w-0 self-start bg-[#e9e9e1]">
					<div
						ref={host}
						className="h-[52svh] min-h-[350px] w-full sm:h-[650px]"
					/>
					<div
						aria-hidden={navigation.phase === "idle"}
						className="absolute inset-0 z-20 flex items-center justify-center bg-black text-white transition-opacity duration-300 motion-reduce:transition-none"
						style={{
							opacity:
								navigation.phase === "out" || navigation.phase === "loading"
									? 1
									: 0,
							pointerEvents: navigation.phase === "idle" ? "none" : "auto",
						}}
					>
						<p role="status">
							{navigation.phase === "idle" ? "" : "正在切换场景… / Entering…"}
						</p>
					</div>
					{navigation.portal && !busy ? (
						<div className="absolute bottom-16 left-1/2 z-10 -translate-x-1/2">
							<Button onClick={() => viewer.current?.interact()}>
								E · {navigation.portal}
							</Button>
						</div>
					) : null}
					{navigation.error ? (
						<p
							role="alert"
							className="absolute bottom-28 left-4 max-w-sm rounded-lg bg-background p-3 text-sm"
						>
							{navigation.error}
						</p>
					) : null}

					{status !== "ready" ? (
						<div
							className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/95 p-6 text-center"
							aria-live="polite"
						>
							<img
								src="/models/kirkland-house/preview.png"
								alt="Preview of the Kirkland house exterior with its garage, porch, and garden"
								className="max-h-64 w-full max-w-md rounded-lg object-contain"
							/>
							<p>
								{status === "error"
									? "The interactive view couldn’t load. You can still explore the preview or download the model."
									: "Preparing your house…"}
							</p>
							{status === "error" ? (
								<Button onClick={() => setAttempt((value) => value + 1)}>
									Try again
								</Button>
							) : null}
						</div>
					) : null}
					<div
						className="absolute top-4 left-4 rounded-full bg-background/90 px-3 py-1.5 font-mono text-foreground text-xs"
						role="status"
					>
						{status === "ready"
							? AREA_LABELS[navigation.area]
							: status === "error"
								? "PREVIEW MODE"
								: "LOADING MODEL"}
					</div>
					<div className="absolute right-4 bottom-4 flex gap-1 rounded-full bg-background/95 p-1 shadow-sm">
						<Button
							variant="ghost"
							size="icon"
							aria-label="Zoom out"
							disabled={busy}
							onClick={() => viewer.current?.zoom(1.2)}
						>
							<Minus />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							aria-label="Zoom in"
							disabled={busy}
							onClick={() => viewer.current?.zoom(0.83)}
						>
							<Plus />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							aria-label="Reset camera"
							disabled={busy}
							onClick={() => view("perspective")}
						>
							<RotateCcw />
						</Button>
					</div>
				</div>
				<aside className="flex flex-col gap-8 border-border border-t bg-background p-6 lg:max-h-[650px] lg:overflow-y-auto lg:border-t-0 lg:border-l">
					<div>
						<p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
							The property
						</p>
						<h2 className="mt-2 font-semibold text-2xl">8311 Kirkland</h2>
						<p className="mt-2 text-muted-foreground text-sm leading-relaxed">
							A cedar-shingle gable, a sheltered entry, and a garden at the
							doorstep.
						</p>
					</div>
					<section
						aria-label="Child avatar controls"
						className="flex flex-col gap-3"
					>
						<h3 className="font-medium text-sm">
							{AREA_LABELS[navigation.area]}
						</h3>
						<p className="text-muted-foreground text-xs">
							走近金色圆环，按 E 切换区域。 / Walk to a gold marker and press E.
						</p>
						{navigation.area === "exterior" ? (
							<Button
								disabled={busy}
								variant="outline"
								onClick={() => viewer.current?.goToEntrance()}
							>
								Go to entrance · 前往门口
							</Button>
						) : null}
						<p className="text-muted-foreground text-xs">
							A stylized avatar inspired by your photo. Click the scene, then
							hold W A S D to walk relative to the camera.
						</p>
						<Button
							disabled={busy}
							onClick={() => viewer.current?.followAvatar()}
						>
							Walk with avatar
						</Button>
						<Button
							variant="outline"
							disabled={busy}
							onClick={() => viewer.current?.resetAvatar()}
						>
							Reset avatar position
						</Button>
						<fieldset
							className="grid grid-cols-3 gap-1"
							aria-label="Touch walking controls"
						>
							{(
								[
									["a", "Left"],
									["w", "Forward"],
									["d", "Right"],
									["s", "Back"],
								] as const
							).map(([key, label]) => (
								<Button
									key={key}
									variant="outline"
									disabled={busy}
									aria-label={`Walk ${label.toLowerCase()}`}
									className={key === "s" ? "col-start-2" : ""}
									onPointerDown={(event) => {
										event.preventDefault();
										event.currentTarget.setPointerCapture(event.pointerId);
										viewer.current?.moveAvatar(key, true);
									}}
									onPointerUp={() => viewer.current?.moveAvatar(key, false)}
									onPointerCancel={() => viewer.current?.moveAvatar(key, false)}
									onLostPointerCapture={() =>
										viewer.current?.moveAvatar(key, false)
									}
									onKeyDown={(event) => {
										if (event.key === " " || event.key === "Enter") {
											event.preventDefault();
											viewer.current?.moveAvatar(key, true);
										}
									}}
									onKeyUp={() => viewer.current?.moveAvatar(key, false)}
									onBlur={() => viewer.current?.moveAvatar(key, false)}
								>
									{label}
								</Button>
							))}
						</fieldset>
					</section>
					<section
						aria-labelledby="house-views"
						inert={navigation.area !== "exterior" || busy}
					>
						<h3 id="house-views" className="mb-3 font-medium text-sm">
							Jump to a view
						</h3>
						<div className="flex flex-col gap-2">
							<Button
								variant="outline"
								disabled={busy}
								onClick={() => view("perspective")}
							>
								Three-quarter view
							</Button>
							<Button
								variant="outline"
								disabled={busy}
								onClick={() => view("front")}
							>
								Front elevation
							</Button>
							<Button
								variant="outline"
								disabled={busy}
								onClick={() => view("roof")}
							>
								Roof overview
							</Button>
							<Button
								variant="outline"
								disabled={busy}
								onClick={() => view("birdhouse")}
							>
								Birdhouse close-up · 鸟巢
							</Button>
						</div>
					</section>
					<fieldset
						disabled={navigation.area !== "exterior" || busy}
						className="flex flex-col gap-3"
					>
						<legend className="mb-3 font-medium text-sm">Visible layers</legend>
						{(["Roofs", "Landscape", "Context"] as const).map((layer) => (
							<label
								key={layer}
								className="flex cursor-pointer items-center justify-between gap-3 text-sm"
							>
								<span>{layer === "Context" ? "Neighboring unit" : layer}</span>
								<input
									type="checkbox"
									checked={layers[layer]}
									disabled={busy}
									onChange={() => toggleLayer(layer)}
									className="size-4 accent-primary"
								/>
							</label>
						))}
					</fieldset>
					<div className="mt-auto border-border border-t pt-5 text-muted-foreground text-xs leading-relaxed">
						<p>
							Drag to orbit · Scroll to zoom
							<br />
							Right-drag to pan · Pinch on mobile
						</p>
						<p className="mt-2">
							Keyboard: WASD walks · E enters doors / stairs · Arrow keys orbit.
						</p>
					</div>
				</aside>
			</div>
			<div className="mt-5 flex flex-wrap justify-between gap-3 text-muted-foreground text-xs leading-relaxed">
				<p className="max-w-2xl">
					Reconstructed from listing photographs. Dimensions and unseen details
					are approximate. Interior furnishings follow the photos; room
					connections and dimensions are inferred. Enter through the front door
					to explore two interior levels.
				</p>
				<a
					className="underline underline-offset-4"
					href="https://www.zillow.com/homedetails/8311-NE-140th-St-8311-Kirkland-WA-98034/59698516_zpid/"
					target="_blank"
					rel="noreferrer"
				>
					View reference listing ↗
				</a>
			</div>
		</main>
	);
}
