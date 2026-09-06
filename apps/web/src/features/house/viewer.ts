import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { createChildAvatar } from "./avatar";
import { createCinematicEffects, QUALITY, type Quality } from "./cinematic";
import {
	type Area,
	interiorStep,
	type NavigationState,
	nearbyPortal,
	PORTALS,
	type Rect,
} from "./interior";
import { enhanceHouseMaterials } from "./materials";
import { sunsetLighting } from "./sunlight";
import { WALK_SPEED, walkStep } from "./walking";

export type HouseView = "perspective" | "front" | "roof" | "birdhouse";
export type HouseLayer = "Roofs" | "Landscape" | "Context";
export interface HouseViewer {
	setView: (view: HouseView) => void;
	setQuality: (quality: Quality | "auto") => void;
	interact: () => void;
	goToEntrance: () => void;
	followAvatar: () => void;
	resetAvatar: () => void;
	moveAvatar: (key: string, pressed: boolean) => void;
	setSunlight: (direction: number, progress: number) => void;
	setLayer: (layer: HouseLayer, visible: boolean) => void;
	zoom: (factor: number) => void;
	dispose: () => void;
}

function disposeModel(root: THREE.Object3D) {
	const geometries = new Set<THREE.BufferGeometry>();
	const materials = new Set<THREE.Material>();
	const textures = new Set<THREE.Texture>();
	root.traverse((object) => {
		if (!(object instanceof THREE.Mesh)) return;
		geometries.add(object.geometry);
		for (const material of Array.isArray(object.material)
			? object.material
			: [object.material]) {
			materials.add(material);
			for (const value of Object.values(material))
				if (value instanceof THREE.Texture) textures.add(value);
		}
	});
	for (const texture of textures)
		if (
			typeof ImageBitmap !== "undefined" &&
			texture.image instanceof ImageBitmap
		)
			texture.image.close();
	for (const item of [...geometries, ...materials, ...textures]) item.dispose();
}

export function createHouseViewer(
	host: HTMLDivElement,
	onReady: () => void,
	onError: () => void,
	onNavigation: (state: NavigationState) => void,
): HouseViewer {
	const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.05;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap;
	const canvas = renderer.domElement;
	canvas.style.cssText =
		"width:100%;height:100%;display:block;touch-action:none";
	canvas.tabIndex = 0;
	canvas.setAttribute(
		"aria-label",
		"Interactive house model. Drag to orbit, scroll to zoom, right-drag to pan. WASD walks the child. Arrow keys orbit; plus and minus zoom.",
	);
	host.append(canvas);
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
	const environmentScene = new RoomEnvironment();
	const generator = new THREE.PMREMGenerator(renderer);
	const environment = generator.fromScene(environmentScene, 0.04);
	environmentScene.dispose();
	generator.dispose();
	scene.environment = environment.texture;
	const composer = new EffectComposer(renderer);
	const beauty = new RenderPass(scene, camera);
	const occlusion = new SSAOPass(scene, camera, 512, 512, 16);
	occlusion.kernelRadius = 0.65;
	occlusion.minDistance = 0.01;
	occlusion.maxDistance = 0.045;
	const bloom = new UnrealBloomPass(
		new THREE.Vector2(512, 512),
		0.18,
		0.45,
		1.25,
	);
	const grade = new ShaderPass({
		uniforms: { tDiffuse: { value: null } },
		vertexShader:
			"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
		fragmentShader:
			"uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);float edge=smoothstep(.22,.78,length(vUv-.5));c.rgb*=vec3(1.015,1.,.982)*(1.-edge*.10);gl_FragColor=c;}",
	});
	const output = new OutputPass();
	composer.addPass(beauty);
	composer.addPass(occlusion);
	composer.addPass(bloom);
	composer.addPass(grade);
	composer.addPass(output);
	const controls = new OrbitControls(camera, canvas);
	controls.minDistance = 9;
	controls.maxDistance = 65;
	controls.maxPolarAngle = Math.PI / 2 - 0.025;
	controls.enableDamping = false;
	const sky = new THREE.HemisphereLight(0xf5f7ff, 0x7b8163, 2.4);
	scene.add(sky);
	const sun = new THREE.DirectionalLight(0xfff3dd, 3.5);
	sun.target.position.set(-1.5, 0, -2);
	scene.add(sun.target);
	sun.castShadow = true;
	sun.shadow.mapSize.set(2048, 2048);
	Object.assign(sun.shadow.camera, {
		left: -18,
		right: 18,
		top: 18,
		bottom: -18,
		near: 0.5,
		far: 60,
	});
	sun.shadow.bias = -0.0005;
	sun.shadow.normalBias = 0.06;
	scene.add(sun);
	const effects = createCinematicEffects(scene);
	let quality: Quality = "medium";
	let qualityPreference: Quality | "auto" = "auto";
	let exposureTarget = 1.05;
	let visible = true;
	let effectFrame = 0;
	let effectTime = 0;
	let lastEffect = 0;
	let disposed = false;
	let lost = false;
	let model: THREE.Group | undefined;
	let area: Area = "exterior";
	let phase: NavigationState["phase"] = "idle";
	let portalLabel: string | null = null;
	let navError: string | null = null;
	let interior: THREE.Group | undefined;
	let floorGroups: Partial<Record<Area, THREE.Object3D>> = {};
	const colliders: Partial<Record<Area, Rect[]>> = {};
	let currentSun = { direction: 38, progress: 0 };
	const notify = () =>
		onNavigation({ area, phase, portal: portalLabel, error: navError });
	const updatePortal = () => {
		const next =
			nearbyPortal(area, avatar.root.position.x, avatar.root.position.z)
				?.label ?? null;
		if (next !== portalLabel) {
			portalLabel = next;
			notify();
		}
	};
	const markers = new THREE.Group();
	scene.add(markers);
	const markerGeometry = new THREE.RingGeometry(0.3, 0.38, 40);
	const markerMaterial = new THREE.MeshBasicMaterial({
		color: 0xe8c47c,
		side: THREE.DoubleSide,
		transparent: true,
		opacity: 0.75,
	});
	const showMarkers = () => {
		markers.clear();
		for (const p of PORTALS[area]) {
			const mesh = new THREE.Mesh(markerGeometry, markerMaterial);
			mesh.rotation.x = -Math.PI / 2;
			mesh.position.set(p.x, 0.145, p.z);
			markers.add(mesh);
		}
	};
	showMarkers();
	const avatar = createChildAvatar();
	avatar.root.visible = false;
	scene.add(avatar.root);
	const keys = new Set<string>();
	let following = false;
	let frame = 0;
	let lastFrame = 0;
	let walkPhase = 0;
	const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const abort = new AbortController();
	const render = () => {
		if (!disposed && !lost) composer.render();
	};
	const animateEffects = (now: number) => {
		effectFrame = 0;
		if (disposed || lost || !visible || document.hidden || !model) return;
		const interval =
			quality === "high"
				? 1000 / 45
				: quality === "medium"
					? 1000 / 30
					: 1000 / 20;
		if (now - lastEffect >= interval) {
			const dt = Math.min((now - lastEffect) / 1000, 0.1);
			lastEffect = now;
			renderer.toneMappingExposure = THREE.MathUtils.damp(
				renderer.toneMappingExposure,
				exposureTarget,
				3,
				dt,
			);
			if (!motion.matches) effectTime += dt;
			effects.tick(effectTime);
			render();
		}
		if (
			!motion.matches ||
			Math.abs(renderer.toneMappingExposure - exposureTarget) > 0.002
		)
			effectFrame = requestAnimationFrame(animateEffects);
	};
	const startEffects = () => {
		if (
			!effectFrame &&
			!disposed &&
			!lost &&
			visible &&
			!document.hidden &&
			model
		) {
			lastEffect = performance.now();
			effectFrame = requestAnimationFrame(animateEffects);
		}
	};
	const viewportObserver = new IntersectionObserver(
		(entries) => {
			visible = entries[0]?.isIntersecting ?? false;
			if (visible) startEffects();
			else {
				cancelAnimationFrame(effectFrame);
				effectFrame = 0;
			}
		},
		{ threshold: 0.01 },
	);
	viewportObserver.observe(host);
	const stopWalking = () => {
		keys.clear();
		cancelAnimationFrame(frame);
		frame = 0;
		avatar.animate(0, false, motion.matches);
		render();
	};
	const tick = (now: number) => {
		frame = 0;
		if (
			disposed ||
			lost ||
			!model ||
			phase !== "idle" ||
			document.hidden ||
			keys.size === 0
		) {
			stopWalking();
			return;
		}
		const delta = Math.min((now - lastFrame) / 1000, 0.05);
		lastFrame = now;
		const forward = new THREE.Vector3();
		camera.getWorldDirection(forward);
		forward.y = 0;
		forward.normalize();
		const right = new THREE.Vector3(-forward.z, 0, forward.x);
		const movement = forward
			.multiplyScalar(Number(keys.has("w")) - Number(keys.has("s")))
			.addScaledVector(right, Number(keys.has("d")) - Number(keys.has("a")));
		if (movement.lengthSq() > 0)
			movement.normalize().multiplyScalar(WALK_SPEED * delta);
		const old = avatar.root.position.clone();
		const next =
			area === "exterior"
				? walkStep(old.x, old.z, movement.x, movement.z)
				: interiorStep(
						old.x,
						old.z,
						movement.x,
						movement.z,
						colliders[area] ?? [],
					);
		avatar.root.position.set(next.x, 0.14, next.z);
		const moved = avatar.root.position.clone().sub(old);
		if (moved.lengthSq() > 0.0000001)
			avatar.root.rotation.y = Math.atan2(moved.x, moved.z);
		walkPhase += delta * 10;
		avatar.animate(walkPhase, moved.lengthSq() > 0.0000001, motion.matches);
		if (following) {
			camera.position.add(moved);
			controls.target.add(moved);
			controls.update();
		}
		updatePortal();
		render();
		frame = requestAnimationFrame(tick);
	};
	const moveAvatar = (key: string, pressed: boolean) => {
		if (!["w", "a", "s", "d"].includes(key) || !model || phase !== "idle")
			return;
		if (pressed) keys.add(key);
		else keys.delete(key);
		if (keys.size && !frame) {
			lastFrame = performance.now();
			frame = requestAnimationFrame(tick);
		}
		if (!keys.size) stopWalking();
	};
	const followAvatar = () => {
		following = true;
		controls.minDistance = 2;
		controls.target
			.copy(avatar.root.position)
			.add(new THREE.Vector3(0, 0.8, 0));
		camera.position
			.copy(controls.target)
			.add(
				area === "exterior"
					? new THREE.Vector3(2, 2, 4.8)
					: new THREE.Vector3(4, 6, 7),
			);
		controls.update();
		canvas.focus({ preventScroll: true });
		render();
	};
	const visibility = () => {
		if (document.hidden) {
			stopWalking();
			cancelAnimationFrame(effectFrame);
			effectFrame = 0;
		} else startEffects();
	};
	const keyup = (event: KeyboardEvent) =>
		moveAvatar(event.key.toLowerCase(), false);
	const setSunlight = (direction: number, progress: number) => {
		currentSun = { direction, progress };
		effects.setArea(area, progress);
		exposureTarget = area === "exterior" ? 1.05 : 1.12 + progress * 0.1;
		if (motion.matches) renderer.toneMappingExposure = exposureTarget;
		startEffects();
		if (area !== "exterior") {
			sun.position.set(-4, 7, -6);
			sun.color.set(0xfff0d9).lerp(new THREE.Color(0xffa661), progress);
			sun.intensity = 1.2 * (1 - progress * 0.65);
			sky.intensity = 0.55 * (1 - progress * 0.5);
			sky.color.set(0xfff8eb);
			scene.environmentIntensity = 0.14;
			scene.background = new THREE.Color(0x292d32);
			scene.fog = null;
			render();
			return;
		}
		const light = sunsetLighting(direction, progress);
		sun.position.fromArray(light.position).add(sun.target.position);
		sun.intensity = light.intensity;
		sun.color.set(0xfff3dd).lerp(new THREE.Color(0xff793c), light.warmth);
		sky.intensity = light.ambient * 0.55;
		scene.environmentIntensity = 0.12 * (1 - progress) + 0.025;
		sky.color.set(0xf5f7ff).lerp(new THREE.Color(0x778bb8), progress);
		scene.background = new THREE.Color(0xe9e9e1).lerp(
			new THREE.Color(0x303c57),
			progress,
		);
		scene.fog = new THREE.Fog(scene.background, 65, 145);
		render();
	};
	const resize = () => {
		const { width, height } = host.getBoundingClientRect();
		if (!width || !height) return;
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
		renderer.setSize(width, height, false);
		composer.setSize(width, height);
		render();
	};
	const setQuality = (value: Quality | "auto") => {
		qualityPreference = value;
		quality =
			value === "auto" ? (window.innerWidth < 640 ? "low" : "medium") : value;
		const settings = QUALITY[quality];
		effects.setQuality(quality);
		renderer.setPixelRatio(
			Math.min(window.devicePixelRatio, settings.pixelRatio),
		);
		composer.setPixelRatio(renderer.getPixelRatio());
		occlusion.enabled = settings.ao;
		bloom.enabled = settings.bloom;
		sun.shadow.mapSize.set(settings.shadow, settings.shadow);
		sun.shadow.map?.dispose();
		sun.shadow.map = null;
		sun.shadow.needsUpdate = true;
		canvas.dataset.quality = quality;
		resize();
		startEffects();
	};
	const responsiveQuality = () => {
		if (qualityPreference === "auto") setQuality("auto");
	};
	window.addEventListener("resize", responsiveQuality);
	motion.addEventListener("change", startEffects);
	const observer = new ResizeObserver(resize);
	observer.observe(host);
	controls.addEventListener("change", render);
	const setView = (view: HouseView) => {
		if (area !== "exterior" || phase !== "idle") return;
		following = false;
		controls.minDistance = 9;
		stopWalking();
		controls.target.set(-1.5, 2.5, -2);
		// Blender's Z-up coordinates are converted to glTF's Y-up during export.
		const positions = {
			perspective: [19, 15, 29],
			front: [-1.5, 7, 34],
			roof: [-1.5, 35, 6],
			birdhouse: [-2.7, 2.5, 6.7],
		} as const;
		camera.position.fromArray(positions[view]);
		if (view === "birdhouse") {
			controls.minDistance = 1;
			controls.target.set(-4.05, 1.85, 4.0);
		}
		if (host.clientWidth < 600)
			camera.position
				.sub(controls.target)
				.multiplyScalar(1.3)
				.add(controls.target);
		controls.update();
		render();
	};
	const zoom = (factor: number) => {
		const offset = camera.position.clone().sub(controls.target);
		offset.setLength(
			THREE.MathUtils.clamp(
				offset.length() * factor,
				controls.minDistance,
				controls.maxDistance,
			),
		);
		camera.position.copy(controls.target).add(offset);
		controls.update();
		render();
	};
	const keydown = (event: KeyboardEvent) => {
		if (
			event.key.toLowerCase() === "e" &&
			!event.repeat &&
			!event.ctrlKey &&
			!event.metaKey
		) {
			event.preventDefault();
			void interact();
			return;
		}
		if (phase !== "idle") return;
		if (
			["w", "a", "s", "d"].includes(event.key.toLowerCase()) &&
			!event.metaKey &&
			!event.ctrlKey &&
			!event.altKey
		) {
			event.preventDefault();
			moveAvatar(event.key.toLowerCase(), true);
			return;
		}
		if (
			![
				"ArrowLeft",
				"ArrowRight",
				"ArrowUp",
				"ArrowDown",
				"+",
				"=",
				"-",
			].includes(event.key)
		)
			return;
		event.preventDefault();
		if (["+", "=", "-"].includes(event.key)) {
			zoom(event.key === "-" ? 1.15 : 0.87);
			return;
		}
		const spherical = new THREE.Spherical().setFromVector3(
			camera.position.clone().sub(controls.target),
		);
		spherical.theta +=
			event.key === "ArrowLeft" ? -0.12 : event.key === "ArrowRight" ? 0.12 : 0;
		spherical.phi = THREE.MathUtils.clamp(
			spherical.phi +
				(event.key === "ArrowUp"
					? -0.12
					: event.key === "ArrowDown"
						? 0.12
						: 0),
			0.05,
			controls.maxPolarAngle,
		);
		camera.position
			.copy(controls.target)
			.add(new THREE.Vector3().setFromSpherical(spherical));
		controls.update();
		render();
	};
	const delay = (ms: number) =>
		new Promise<void>((resolve) => window.setTimeout(resolve, ms));
	const loadInterior = async () => {
		if (interior) return;
		const response = await fetch("/models/kirkland-house/interior.glb", {
			signal: abort.signal,
		});
		if (!response.ok) throw new Error("Interior download failed");
		const bytes = await response.arrayBuffer();
		if (disposed) return;
		const gltf = await new GLTFLoader().parseAsync(bytes, "");
		if (disposed) {
			disposeModel(gltf.scene);
			return;
		}
		const ground = gltf.scene.getObjectByName("GroundFloor");
		const upper = gltf.scene.getObjectByName("UpperFloor");
		if (!ground || !upper) {
			disposeModel(gltf.scene);
			throw new Error("Interior levels missing");
		}
		const mapResults = await Promise.allSettled(
			["groundfloor", "upperfloor"].map(async (name) => {
				const response = await fetch(
					`/models/kirkland-house/${name}-indirect.png`,
					{ signal: abort.signal },
				);
				if (!response.ok) throw new Error("Lightmap unavailable");
				const bitmap = await createImageBitmap(await response.blob());
				const texture = new THREE.Texture(bitmap);
				texture.flipY = false;
				texture.channel = 0;
				texture.needsUpdate = true;
				return texture;
			}),
		);
		if (disposed || mapResults.some((r) => r.status === "rejected")) {
			for (const result of mapResults)
				if (result.status === "fulfilled") {
					result.value.image.close();
					result.value.dispose();
				}
			disposeModel(gltf.scene);
			if (disposed) return;
			throw new Error("Could not load interior lighting");
		}
		const originals = new Set<THREE.Material>();
		for (const [index, group] of [ground, upper].entries()) {
			const result = mapResults[index];
			if (result.status !== "fulfilled") continue;
			const cache = new Map<THREE.Material, THREE.Material>();
			group.traverse((o) => {
				if (!(o instanceof THREE.Mesh)) return;
				const convert = (material: THREE.Material) => {
					let clone = cache.get(material);
					if (!clone) {
						clone = material.clone();
						originals.add(material);
						if (clone instanceof THREE.MeshStandardMaterial) {
							clone.lightMap = result.value;
							clone.lightMapIntensity = 0.8;
						}
						cache.set(material, clone);
					}
					return clone;
				};
				o.material = Array.isArray(o.material)
					? o.material.map(convert)
					: convert(o.material);
			});
		}
		for (const material of originals) material.dispose();
		interior = gltf.scene;
		interior.visible = false;
		floorGroups = { ground, upper };
		for (const [name, group] of Object.entries(floorGroups)) {
			const obstacles: Rect[] = Array.isArray(group.userData.colliders)
				? [...group.userData.colliders]
				: [];
			group.traverse((o) => {
				if (o instanceof THREE.Mesh) {
					o.castShadow = true;
					o.receiveShadow = true;
				}
				if (
					Array.isArray(o.userData.collider) &&
					o.userData.collider.length === 4
				)
					obstacles.push(o.userData.collider as unknown as Rect);
				if (o.userData.collisionOnly) o.visible = false;
			});
			colliders[name as Area] = obstacles;
		}
		scene.add(interior);
	};
	const interact = async () => {
		const portal = nearbyPortal(
			area,
			avatar.root.position.x,
			avatar.root.position.z,
		);
		if (!portal || phase !== "idle" || !model || disposed) return;
		stopWalking();
		phase = "out";
		navError = null;
		portalLabel = null;
		notify();
		try {
			await delay(motion.matches ? 0 : 300);
			if (disposed) return;
			phase = "loading";
			notify();
			if (portal.destination !== "exterior") await loadInterior();
			if (disposed) return;
			area = portal.destination;
			model.visible = area === "exterior";
			if (interior) interior.visible = area !== "exterior";
			for (const [name, group] of Object.entries(floorGroups))
				group.visible = name === area;
			avatar.root.position.set(portal.spawn[0], 0.14, portal.spawn[1]);
			avatar.root.rotation.y = 0;
			showMarkers();
			setSunlight(currentSun.direction, currentSun.progress);
			followAvatar();
			phase = "in";
			notify();
			render();
			await delay(motion.matches ? 0 : 350);
			if (disposed) return;
			phase = "idle";
			notify();
			updatePortal();
		} catch {
			if (disposed) return;
			phase = "idle";
			navError =
				"室内场景加载失败，请按 E 重试。 / Could not load the interior. Press E to retry.";
			notify();
			updatePortal();
		}
	};
	const contextLost = (event: Event) => {
		event.preventDefault();
		lost = true;
		stopWalking();
		onError();
	};
	canvas.addEventListener("keydown", keydown);
	window.addEventListener("keyup", keyup);
	window.addEventListener("blur", stopWalking);
	canvas.addEventListener("blur", stopWalking);
	document.addEventListener("visibilitychange", visibility);
	canvas.addEventListener("webglcontextlost", contextLost);
	setView("perspective");
	setSunlight(38, 0);
	resize();
	setQuality("auto");
	void (async () => {
		try {
			const [data, birdData] = await Promise.all(
				["house.glb", "birdhouse.glb"].map(async (asset) => {
					const response = await fetch(`/models/kirkland-house/${asset}`, {
						signal: abort.signal,
					});
					if (!response.ok) throw new Error(`Could not load ${asset}`);
					return response.arrayBuffer();
				}),
			);
			if (disposed) return;
			const gltf = await new GLTFLoader().parseAsync(data, "");
			if (disposed) {
				disposeModel(gltf.scene);
				return;
			}
			model = gltf.scene;
			enhanceHouseMaterials(model);
			const bird = await new GLTFLoader().parseAsync(birdData, "");
			if (disposed) {
				disposeModel(bird.scene);
				return;
			}
			bird.scene.name = "Hanging caravan birdhouse";
			bird.scene.position.set(-4.05, 1.15, 4.0);
			bird.scene.scale.setScalar(0.75);
			model.add(bird.scene);
			model.traverse((object) => {
				if (object instanceof THREE.Mesh) {
					object.castShadow = true;
					object.receiveShadow = true;
				}
			});
			scene.add(model);
			avatar.root.visible = true;
			startEffects();
			updatePortal();
			notify();
			render();
			onReady();
		} catch {
			if (model && !disposed) {
				disposeModel(model);
				model = undefined;
			}
			if (!disposed) onError();
		}
	})();
	return {
		setView,
		setQuality,
		interact: () => {
			void interact();
		},
		goToEntrance() {
			if (phase !== "idle" || area !== "exterior") return;
			stopWalking();
			avatar.root.position.set(-4, 0.14, 0.18);
			followAvatar();
			updatePortal();
		},
		followAvatar,
		moveAvatar,
		resetAvatar() {
			stopWalking();
			avatar.root.position.set(0, 0.14, area === "exterior" ? 5 : 3.2);
			avatar.root.rotation.y = 0;
			followAvatar();
			updatePortal();
		},
		setSunlight,
		zoom,
		setLayer(layer, visible) {
			model?.traverse((object) => {
				if (object.userData.layer === layer || object.name === layer)
					object.visible = visible;
			});
			render();
		},
		dispose() {
			disposed = true;
			cancelAnimationFrame(effectFrame);
			viewportObserver.disconnect();
			window.removeEventListener("resize", responsiveQuality);
			motion.removeEventListener("change", startEffects);
			effects.dispose();
			stopWalking();
			window.removeEventListener("keyup", keyup);
			window.removeEventListener("blur", stopWalking);
			canvas.removeEventListener("blur", stopWalking);
			document.removeEventListener("visibilitychange", visibility);
			disposeModel(avatar.root);
			if (interior) disposeModel(interior);
			markerGeometry.dispose();
			markerMaterial.dispose();
			abort.abort();
			observer.disconnect();
			controls.removeEventListener("change", render);
			controls.dispose();
			canvas.removeEventListener("keydown", keydown);
			canvas.removeEventListener("webglcontextlost", contextLost);
			if (model) disposeModel(model);
			sun.shadow.dispose();
			environment.dispose();
			beauty.dispose();
			occlusion.dispose();
			bloom.dispose();
			grade.dispose();
			output.dispose();
			composer.dispose();
			// SSAOPass does not release these resources in its dispose implementation.
			occlusion.ssaoMaterial.dispose();
			occlusion.noiseTexture.dispose();
			renderer.dispose();
			renderer.forceContextLoss();
			canvas.remove();
		},
	};
}
