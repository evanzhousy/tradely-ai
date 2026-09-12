import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export async function mountTradelyAvatar(host: HTMLDivElement) {
	const { scene: model } = await new GLTFLoader().loadAsync(
		"/models/tradely-avatar/tradely-avatar.glb",
	);
	const releaseModel = () =>
		model.traverse((object) => {
			if (object instanceof THREE.Mesh) {
				object.geometry.dispose();
				for (const material of Array.isArray(object.material)
					? object.material
					: [object.material])
					material.dispose();
			}
		});
	const head = model.getObjectByName("HeadPivot");
	if (!head) {
		releaseModel();
		throw new Error("Owl model is missing its head pivot");
	}
	let renderer: THREE.WebGLRenderer;
	try {
		renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: true,
			powerPreference: "low-power",
		});
	} catch (error) {
		releaseModel();
		throw error;
	}
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
	renderer.setSize(180, 200);
	renderer.setClearColor(0, 0);
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(35, 0.9, 0.1, 20);
	camera.position.set(0, 0.15, 4.5);
	camera.lookAt(0, 0, 0);
	scene.add(new THREE.HemisphereLight(0xffffff, 0xb67b24, 1.6));
	const key = new THREE.DirectionalLight(0xfff4d8, 1.8);
	key.position.set(-3, 4, 5);
	scene.add(key, model);
	model.rotation.set(-0.04, -0.14, -0.1);
	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
	const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
	const target = new THREE.Vector2(0, 0);
	let frame = 0;
	let visible = true;
	let disposed = false;
	let previousTime = 0;
	const draw = (time: number) => {
		frame = 0;
		if (disposed || !visible || document.hidden) return;
		const delta = Math.min((time - previousTime) / 1000, 0.05);
		previousTime = time;
		const blend = 1 - Math.exp(-10 * delta);
		head.rotation.y += (target.x - head.rotation.y) * blend;
		head.rotation.x += (target.y - head.rotation.x) * blend;
		renderer.render(scene, camera);
		if (
			Math.abs(target.x - head.rotation.y) +
				Math.abs(target.y - head.rotation.x) >
			0.001
		)
			frame = requestAnimationFrame(draw);
	};
	const schedule = () => {
		if (!frame && !disposed) frame = requestAnimationFrame(draw);
	};
	const reset = () => {
		target.set(0, 0);
		head.rotation.y = 0;
		head.rotation.x = 0;
		schedule();
	};
	const rest = () => {
		target.set(0, 0);
		schedule();
	};
	const pointer = (event: PointerEvent) => {
		if (reduced.matches || !fine.matches || !visible || document.hidden) return;
		const bounds = host.getBoundingClientRect();
		target.set(
			THREE.MathUtils.clamp(
				(event.clientX - bounds.left - bounds.width / 2) / 1000,
				-0.4,
				0.4,
			),
			THREE.MathUtils.clamp(
				(event.clientY - bounds.top - bounds.height / 2) / 900,
				-0.16,
				0.16,
			),
		);
		schedule();
	};
	const observer = new IntersectionObserver(([entry]) => {
		visible = entry.isIntersecting;
		schedule();
	});
	const contextLost = (event: Event) => {
		event.preventDefault();
		host.dataset.ready = "false";
	};
	const contextRestored = () => {
		host.dataset.ready = "true";
		schedule();
	};
	renderer.domElement.addEventListener("webglcontextlost", contextLost);
	renderer.domElement.addEventListener("webglcontextrestored", contextRestored);
	host.appendChild(renderer.domElement);
	renderer.render(scene, camera);
	host.dataset.ready = "true";
	observer.observe(host);
	window.addEventListener("pointermove", pointer, { passive: true });
	document.addEventListener("visibilitychange", schedule);
	document.documentElement.addEventListener("pointerleave", rest);
	window.addEventListener("blur", rest);
	reduced.addEventListener("change", reset);
	return () => {
		disposed = true;
		cancelAnimationFrame(frame);
		observer.disconnect();
		window.removeEventListener("pointermove", pointer);
		document.removeEventListener("visibilitychange", schedule);
		document.documentElement.removeEventListener("pointerleave", rest);
		window.removeEventListener("blur", rest);
		reduced.removeEventListener("change", reset);
		renderer.domElement.removeEventListener("webglcontextlost", contextLost);
		renderer.domElement.removeEventListener(
			"webglcontextrestored",
			contextRestored,
		);
		releaseModel();
		renderer.dispose();
		renderer.domElement.remove();
		delete host.dataset.ready;
	};
}
