import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { storyProgress, updateStoryCamera } from "./camera";
import { createHallEffects } from "./effects";
import { createMarketDisplays } from "./market";
import { applyHallReveal, enhanceHallMaterials } from "./materials";

export interface HallController {
	setPaused: (paused: boolean) => void;
	replay: () => void;
	dispose: () => void;
}
export async function createTradingHall(
	host: HTMLDivElement,
	story: HTMLElement,
	signal?: AbortSignal,
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
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.12;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap;
	host.appendChild(renderer.domElement);
	renderer.domElement.setAttribute("aria-hidden", "true");
	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x242b31);
	scene.fog = new THREE.FogExp2(0x31373a, 0.01);
	const camera = new THREE.PerspectiveCamera(compact ? 65 : 56, 1, 0.1, 110);
	const createEnvironment = () => {
		const room = new RoomEnvironment();
		const generator = new THREE.PMREMGenerator(renderer);
		const result = generator.fromScene(room, 0.04);
		room.dispose();
		generator.dispose();
		return result;
	};
	let environment = createEnvironment();
	scene.environment = environment.texture;
	scene.environmentIntensity = 0.42;
	scene.add(new THREE.HemisphereLight(0xc5d7eb, 0x53412d, 0.6));
	const key = new THREE.DirectionalLight(0xffd5a0, 2.7);
	key.position.set(18, 10, 5);
	key.target.position.set(-4, 0, -3);
	key.castShadow = true;
	key.shadow.mapSize.setScalar(compact ? 1024 : 2048);
	key.shadow.camera.left = -19;
	key.shadow.camera.right = 19;
	key.shadow.camera.top = 18;
	key.shadow.camera.bottom = -18;
	key.shadow.camera.near = 0.5;
	key.shadow.camera.far = 60;
	key.shadow.bias = -0.0003;
	key.shadow.normalBias = 0.022;
	scene.add(key, key.target);
	const fill = new THREE.DirectionalLight(0x92b4d0, 0.65);
	fill.position.set(-8, 5, 15);
	scene.add(fill);
	for (const x of [-5.6, 5.6])
		for (const z of [-6, 1, 8]) {
			const glow = new THREE.PointLight(0x75c4eb, 13, 5, 2);
			glow.position.set(x, 1.9, z + 0.6);
			scene.add(glow);
		}
	const backGlow = new THREE.PointLight(0x87cfff, 70, 16, 2);
	backGlow.position.set(0, 4.8, -12.5);
	scene.add(backGlow);
	const displays = createMarketDisplays(compact);
	const reveal = { value: reduced.matches ? 1.2 : 0 };
	const effects = createHallEffects(scene, compact);
	const composer = new EffectComposer(renderer);
	const beauty = new RenderPass(scene, camera);
	const ao = new SSAOPass(scene, camera, 512, 512, 12);
	ao.kernelRadius = 0.65;
	ao.minDistance = 0.008;
	ao.maxDistance = 0.06;
	ao.enabled = !compact;
	const bloom = new UnrealBloomPass(
		new THREE.Vector2(512, 512),
		0.22,
		0.5,
		1.05,
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
	const blueprint = new THREE.Group();
	const blueprintMaterial = new THREE.LineBasicMaterial({
		color: 0xbca975,
		transparent: true,
		opacity: 0.22,
		depthWrite: false,
	});
	scene.add(blueprint);
	let model: THREE.Group | undefined;
	let disposed = false;
	let paused = false;
	let visible = true;
	let lost = false;
	let frame = 0;
	let last = 0;
	let time = 0;
	let revealTime = 0;
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
		const mats = new Set<THREE.Material>();
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
		if (model) disposeModel(model);
		for (const line of blueprint.children)
			if (line instanceof THREE.LineSegments) line.geometry.dispose();
		blueprintMaterial.dispose();
		effects.dispose();
		displays.dispose();
		environment.dispose();
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
		const response = await fetch("/models/trading-hall/trading-hall.glb", {
			signal,
		});
		if (!response.ok) throw new Error("Trading hall model unavailable");
		const gltf = await new GLTFLoader().parseAsync(
			await response.arrayBuffer(),
			"/models/trading-hall/",
		);
		if (signal?.aborted) {
			disposeModel(gltf.scene);
			throw new DOMException("Aborted", "AbortError");
		}
		model = gltf.scene;
		enhanceHallMaterials(model, reveal);
		model.traverse((o) => {
			if (!(o instanceof THREE.Mesh)) return;
			if (o.name.startsWith("TH_StoneFloor")) {
				o.visible = false;
				const stone = Array.isArray(o.material) ? o.material[0] : o.material;
				if (stone instanceof THREE.MeshStandardMaterial)
					effects.setStoneMaterial(stone);
				return;
			}
			if (
				o.name.startsWith("TH_MarketScreens") ||
				o.name.startsWith("TH_TickerScreens")
			) {
				const old = o.material;
				const map = o.name.startsWith("TH_MarketScreens")
					? displays.texture
					: displays.tickerTexture;
				o.material = new THREE.MeshBasicMaterial({
					map,
					side: THREE.DoubleSide,
					toneMapped: false,
				});
				o.material.onBeforeCompile = (
					shader: Parameters<THREE.Material["onBeforeCompile"]>[0],
				) => applyHallReveal(shader, reveal);
				o.material.customProgramCacheKey = () => "hall-display-reveal-v1";
				if (!Array.isArray(old)) old.dispose();
				o.castShadow = false;
			}
		});
		scene.add(model);
		model.updateMatrixWorld(true);
		model.traverse((object) => {
			if (
				!(object instanceof THREE.Mesh) ||
				!object.visible ||
				/Screens|WindowLight/.test(object.name)
			)
				return;
			const line = new THREE.LineSegments(
				new THREE.EdgesGeometry(object.geometry, 35),
				blueprintMaterial,
			);
			line.matrix.copy(object.matrixWorld);
			line.matrixAutoUpdate = false;
			blueprint.add(line);
		});
	} catch (error) {
		dispose();
		throw error;
	}
	const stage = host.parentElement ?? host;
	const resize = () => {
		const r = host.getBoundingClientRect();
		renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
		camera.aspect = r.width / Math.max(1, r.height);
		camera.fov = r.width < 768 ? 65 : 56;
		camera.updateProjectionMatrix();
		composer.setSize(Math.max(1, r.width), Math.max(1, r.height));
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
		updateStoryCamera(camera, progress, pointer);
		stage.style.setProperty("--hall-progress", String(progress));
		const focus = new THREE.Vector3(-3.85, 1.94, 8.6).project(camera);
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
		reveal.value = reduced.matches ? 1.2 : Math.min(1.2, revealTime / 2.1);
		blueprint.visible = !reduced.matches && revealTime < 2.7;
		blueprintMaterial.opacity =
			0.22 * (1 - THREE.MathUtils.smoothstep(revealTime, 0.6, 2.7));
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
		revealTime += dt;
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
			if (reduced.matches) reveal.value = 1.2;
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
		onScroll();
		sync();
	};
	const contextLost = (e: Event) => {
		e.preventDefault();
		lost = true;
		host.dataset.state = "fallback";
		sync();
	};
	const contextRestored = () => {
		lost = false;
		environment.dispose();
		environment = createEnvironment();
		scene.environment = environment.texture;
		host.dataset.state = "ready";
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
	host.dataset.screenCount = "60";
	host.dataset.quality = compact ? "mobile" : "cinematic";
	onScroll();
	resize();
	sync();
	return {
		dispose,
		setPaused(value) {
			paused = value;
			sync();
		},
		replay() {
			revealTime = 0;
			reveal.value = 0;
			draw();
		},
	};
}
