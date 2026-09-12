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
	const target = new THREE.Vector2(-0.14, -0.04);
	let frame = 0;
	let visible = true;
	let disposed = false;
	const draw = () => {
		frame = 0;
		if (disposed || !visible || document.hidden) return;
		model.rotation.y += (target.x - model.rotation.y) * 0.14;
		model.rotation.x += (target.y - model.rotation.x) * 0.14;
		renderer.render(scene, camera);
		if (
			Math.abs(target.x - model.rotation.y) +
				Math.abs(target.y - model.rotation.x) >
			0.001
		)
			frame = requestAnimationFrame(draw);
	};
	const schedule = () => {
		if (!frame && !disposed) frame = requestAnimationFrame(draw);
	};
	const reset = () => {
		target.set(-0.14, -0.04);
		model.rotation.y = target.x;
		model.rotation.x = target.y;
		schedule();
	};
	const pointer = (event: PointerEvent) => {
		if (reduced.matches || !fine.matches) return;
		const bounds = host.getBoundingClientRect();
		target.set(
			THREE.MathUtils.clamp(
				(event.clientX - bounds.left - bounds.width / 2) / 700,
				-0.3,
				0.3,
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
	reduced.addEventListener("change", reset);
	return () => {
		disposed = true;
		cancelAnimationFrame(frame);
		observer.disconnect();
		window.removeEventListener("pointermove", pointer);
		document.removeEventListener("visibilitychange", schedule);
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
