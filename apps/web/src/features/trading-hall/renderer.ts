import * as THREE from "three";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { INSPECTION_TARGET, storyProgress, updateStoryCamera } from "./camera";
import { createHallEffects } from "./effects";
import { createNightLighting } from "./lighting";
import { createMarketDisplays, MARKET_SCREEN_COUNT } from "./market";
import { createDisplayMaterial, enhanceHallMaterials } from "./materials";
import { createHallReveal, HALL_REVEAL_DURATION } from "./reveal";

export interface HallController {
	setPaused: (paused: boolean) => void;
	replay: () => void;
	dispose: () => void;
}
export async function createTradingHall(
	host: HTMLDivElement,
	story: HTMLElement,
	signal?: AbortSignal,
	onAvailabilityChange?: (state: "ready" | "fallback") => void,
): Promise<HallController> {
	const compact = matchMedia("(max-width: 767px), (pointer: coarse)").matches;
	const reduced = matchMedia("(prefers-reduced-motion: reduce)");
	const renderer = new THREE.WebGLRenderer({
		antialias: false,
		alpha: false,
		powerPreference: "high-performance",
	});
	renderer.setPixelRatio(Math.min(devicePixelRatio || 1, compact ? 1 : 1.5));
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.AgXToneMapping;
	renderer.toneMappingExposure = 1.05;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap;
	host.appendChild(renderer.domElement);
	renderer.domElement.setAttribute("aria-hidden", "true");
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x050709);
	const camera = new THREE.PerspectiveCamera(compact ? 64 : 49, 1, 0.08, 120);
	const lighting = createNightLighting(scene, compact);
	let environment: THREE.WebGLRenderTarget | undefined;
	const createEnvironment = () => {
		scene.environment = null;
		const cube = new THREE.WebGLCubeRenderTarget(compact ? 64 : 128, {
			type: THREE.HalfFloatType,
		});
		const capture = new THREE.CubeCamera(0.1, 100, cube);
		capture.position.set(0, 2.5, 8);
		capture.update(renderer, scene);
		const generator = new THREE.PMREMGenerator(renderer);
		const result = generator.fromCubemap(cube.texture);
		generator.dispose();
		cube.dispose();
		return result;
	};
	const decoder = new DRACOLoader();
	decoder.setDecoderPath("/models/trading-hall/night-v3/draco/");
	decoder.setWorkerLimit(2);
	const displays = createMarketDisplays(compact);
	const entrance = { value: reduced.matches ? 1 : 0 };
	const effects = createHallEffects(scene, compact);
	const composer = new EffectComposer(renderer);
	const beauty = new RenderPass(scene, camera);
	const ao = new SSAOPass(scene, camera, 512, 512, 12);
	ao.kernelRadius = 0.35;
	ao.minDistance = 0.008;
	ao.maxDistance = 0.045;
	ao.enabled = !compact;
	const bloom = new UnrealBloomPass(
		new THREE.Vector2(512, 512),
		0.1,
		0.3,
		1.35,
	);
	const grade = new ShaderPass({
		uniforms: { tDiffuse: { value: null } },
		vertexShader:
			"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
		fragmentShader:
			"uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);float vignette=smoothstep(.23,.79,length((vUv-.5)*vec2(1.,.86)));c.rgb*=vec3(1.018,1.,.965)*(1.-vignette*.21);gl_FragColor=c;}",
	});
	const antialias = new SMAAPass();
	const output = new OutputPass();
	composer.addPass(beauty);
	composer.addPass(ao);
	composer.addPass(bloom);
	composer.addPass(grade);
	composer.addPass(antialias);
	composer.addPass(output);
	let model: THREE.Group | undefined;
	let reveal: ReturnType<typeof createHallReveal> | undefined;
	let disposed = false;
	let paused = false;
	let visible = true;
	let lost = false;
	let frame = 0;
	let last = 0;
	let time = 0;
	let entranceTime = reduced.matches ? HALL_REVEAL_DURATION : 0;
	const retiredMaterials: THREE.Material[] = [];
	let lastDraw = 0;
	let lastTick = -1;
	let frames = 0;
	let frameWindow = performance.now();
	let progress = 0;
	let progressTarget = 0;
	const pointer = new THREE.Vector2();
	const pointerTarget = new THREE.Vector2();
	let contextCleanup = () => {};
	function disposeModel(root: THREE.Object3D) {
		const geos = new Set<THREE.BufferGeometry>();
		const mats = new Set<THREE.Material>(retiredMaterials);
		const textures = new Set<THREE.Texture>();
		root.traverse((o) => {
			if (o instanceof THREE.Mesh) {
				geos.add(o.geometry);
				for (const m of Array.isArray(o.material) ? o.material : [o.material])
					mats.add(m);
			}
		});
		for (const g of geos) g.dispose();
		for (const m of mats) {
			for (const value of Object.values(m))
				if (value instanceof THREE.Texture) textures.add(value);
			m.dispose();
		}
		const images = new Set<ImageBitmap>();
		for (const texture of textures) {
			if (
				typeof ImageBitmap !== "undefined" &&
				texture.image instanceof ImageBitmap
			)
				images.add(texture.image);
			texture.dispose();
		}
		for (const image of images) image.close();
	}
	function dispose() {
		if (disposed) return;
		disposed = true;
		cancelAnimationFrame(frame);
		contextCleanup();
		reveal?.dispose();
		if (model) disposeModel(model);
		decoder.dispose();
		lighting.dispose();
		effects.dispose();
		displays.dispose();
		environment?.dispose();
		for (const pass of [beauty, ao, bloom, grade, antialias, output])
			pass.dispose();
		ao.ssaoMaterial.dispose();
		ao.noiseTexture.dispose();
		composer.dispose();
		scene.traverse((o) => {
			if (
				o instanceof THREE.DirectionalLight ||
				o instanceof THREE.PointLight ||
				o instanceof THREE.SpotLight
			)
				o.shadow?.dispose();
		});
		renderer.dispose();
		renderer.forceContextLoss();
		renderer.domElement.remove();
		delete host.dataset.animationActive;
	}
	try {
		const response = await fetch("/models/trading-hall/night-v3/exchange.glb", {
			signal,
		});
		if (!response.ok) throw new Error("Trading hall model unavailable");
		const gltf = await new GLTFLoader()
			.setDRACOLoader(decoder)
			.parseAsync(
				await response.arrayBuffer(),
				"/models/trading-hall/night-v3/",
			);
		if (signal?.aborted) {
			disposeModel(gltf.scene);
			throw new DOMException("Aborted", "AbortError");
		}
		model = gltf.scene;
		enhanceHallMaterials(
			model,
			Math.min(8, renderer.capabilities.getMaxAnisotropy()),
		);
		model.traverse((object) => {
			if (!(object instanceof THREE.Mesh) || object.name !== "EX3_Markets")
				return;
			retiredMaterials.push(
				...(Array.isArray(object.material)
					? object.material
					: [object.material]),
			);
			object.material = createDisplayMaterial(displays.texture, entrance);
			object.castShadow = false;
		});
		scene.add(model);
		model.updateMatrixWorld(true);
		renderer.shadowMap.autoUpdate = false;
		renderer.shadowMap.needsUpdate = true;
		environment = createEnvironment();
		scene.environment = environment.texture;
		scene.environmentIntensity = 0.18;
		reveal = createHallReveal(model, scene, reduced.matches);
		host.dataset.assetVersion = "night-v3";
	} catch (error) {
		dispose();
		throw error;
	}
	const stage = host.parentElement ?? host;
	stage.dataset.copySettled = String(reduced.matches);
	const resize = () => {
		const r = host.getBoundingClientRect();
		const width = Math.max(1, r.width);
		const height = Math.max(1, r.height);
		const floorCrop = THREE.MathUtils.clamp(
			Number.parseFloat(
				getComputedStyle(host).getPropertyValue("--hall-floor-crop"),
			) || 0,
			0,
			0.25,
		);
		renderer.setSize(width, height, false);
		camera.fov = r.width < 768 ? 64 : 49;
		// Crop the bottom of a taller frame without lifting the eye-level camera
		// or rendering extra pixels. Projected screen markers use this same frame.
		camera.setViewOffset(width, height / (1 - floorCrop), 0, 0, width, height);
		composer.setSize(width, height);
		draw();
	};
	const onScroll = () => {
		progressTarget = reduced.matches
			? 0
			: storyProgress(
					story.getBoundingClientRect().top,
					story.offsetHeight,
					innerHeight,
				);
		if (paused || reduced.matches) {
			progress = progressTarget;
			draw();
		}
	};
	function draw() {
		if (disposed || lost) return;
		entrance.value = reduced.matches
			? 1
			: THREE.MathUtils.smoothstep(entranceTime, 0, 1.8);
		const solid = reveal?.update(entranceTime, reduced.matches) ?? 1;
		ao.enabled = !compact && solid === 1;
		host.dataset.revealProgress = solid.toFixed(3);
		host.dataset.representation =
			solid === 1 ? "solid" : solid === 0 ? "wireframe" : "transition";
		updateStoryCamera(camera, progress, pointer, entrance.value);
		stage.style.setProperty("--hall-progress", String(progress));
		const focus = INSPECTION_TARGET.clone().project(camera);
		stage.style.setProperty("--focus-x", `${(focus.x * 0.5 + 0.5) * 100}%`);
		stage.style.setProperty("--focus-y", `${(-focus.y * 0.5 + 0.5) * 100}%`);
		stage.dataset.chapter =
			progress < 0.28 ? "opening" : progress < 0.78 ? "observe" : "verify";
		stage.style.setProperty(
			"--hall-intro-opacity",
			String(1 - THREE.MathUtils.smoothstep(progress, 0.08, 0.28)),
		);
		effects.update(time);
		const tick = displays.update(time);
		if (tick !== lastTick) {
			host.dataset.marketTick = String(tick);
			lastTick = tick;
		}
		stage.style.setProperty("--hall-entrance", String(entrance.value));
		host.dataset.cameraHeight = camera.position.y.toFixed(3);
		host.dataset.cameraPosition = camera.position
			.toArray()
			.map((v) => v.toFixed(3))
			.join(",");
		composer.render();
		frames++;
		const now = performance.now();
		if (now - frameWindow > 2000) {
			host.dataset.renderFps = ((frames * 1000) / (now - frameWindow)).toFixed(
				1,
			);
			frames = 0;
			frameWindow = now;
		}
	}
	function animate(now: number) {
		if (disposed) return;
		frame = requestAnimationFrame(animate);
		if (now - lastDraw < (compact ? 1000 / 30 : 1000 / 45)) return;
		const dt = last ? Math.min((now - last) / 1000, 0.065) : 0.016;
		last = now;
		lastDraw = now;
		time += dt;
		entranceTime += dt;
		progress = THREE.MathUtils.damp(progress, progressTarget, 4.5, dt);
		pointer.lerp(pointerTarget, 0.04);
		draw();
	}
	const sync = () => {
		cancelAnimationFrame(frame);
		frame = 0;
		last = 0;
		frames = 0;
		frameWindow = performance.now();
		const active =
			!disposed &&
			!paused &&
			!reduced.matches &&
			visible &&
			!lost &&
			document.visibilityState === "visible";
		host.dataset.animationActive = String(active);
		if (active) frame = requestAnimationFrame(animate);
		else {
			if (reduced.matches) entranceTime = HALL_REVEAL_DURATION;
			draw();
		}
	};
	const pointerMove = (e: PointerEvent) => {
		if (paused || reduced.matches) return;
		const r = host.getBoundingClientRect();
		pointerTarget.set(
			(e.clientX - r.left) / r.width - 0.5,
			0.5 - (e.clientY - r.top) / r.height,
		);
	};
	const mediaChanged = () => {
		if (reduced.matches) {
			pointer.set(0, 0);
			pointerTarget.set(0, 0);
			stage.dataset.copySettled = "true";
		}
		onScroll();
		sync();
	};
	const contextLost = (e: Event) => {
		e.preventDefault();
		lost = true;
		host.dataset.state = "fallback";
		onAvailabilityChange?.("fallback");
		sync();
	};
	const contextRestored = () => {
		lost = false;
		// Reflection capture must contain the fully shaded room, even mid-reveal.
		reveal?.update(HALL_REVEAL_DURATION, true);
		environment?.dispose();
		renderer.shadowMap.needsUpdate = true;
		environment = createEnvironment();
		scene.environment = environment.texture;
		host.dataset.state = "ready";
		onAvailabilityChange?.("ready");
		onScroll();
		resize();
		sync();
	};
	const observer = new IntersectionObserver((entries) => {
		visible = entries.some((e) => e.isIntersecting);
		sync();
	});
	observer.observe(host);
	const sizeObserver = new ResizeObserver(resize);
	sizeObserver.observe(host);
	window.addEventListener("scroll", onScroll, { passive: true });
	window.addEventListener("resize", onScroll, { passive: true });
	stage.addEventListener("pointermove", pointerMove, { passive: true });
	document.addEventListener("visibilitychange", sync);
	reduced.addEventListener("change", mediaChanged);
	renderer.domElement.addEventListener("webglcontextlost", contextLost);
	renderer.domElement.addEventListener("webglcontextrestored", contextRestored);
	contextCleanup = () => {
		observer.disconnect();
		sizeObserver.disconnect();
		window.removeEventListener("scroll", onScroll);
		window.removeEventListener("resize", onScroll);
		stage.removeEventListener("pointermove", pointerMove);
		document.removeEventListener("visibilitychange", sync);
		reduced.removeEventListener("change", mediaChanged);
		renderer.domElement.removeEventListener("webglcontextlost", contextLost);
		renderer.domElement.removeEventListener(
			"webglcontextrestored",
			contextRestored,
		);
	};
	host.dataset.state = "ready";
	host.dataset.screenCount = String(MARKET_SCREEN_COUNT);
	host.dataset.quality = compact ? "mobile" : "cinematic";
	onScroll();
	resize();
	sync();
	return {
		dispose,
		setPaused(value) {
			paused = value;
			stage.dataset.motionPaused = String(value);
			if (value) stage.dataset.copySettled = "true";
			sync();
		},
		replay() {
			entranceTime = 0;
			entrance.value = 0;
			draw();
		},
	};
}
