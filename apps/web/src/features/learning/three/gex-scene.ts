import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { gexScale, type MetricsComparison } from "@/domain/learning/metrics";

export type GexViewState = {
	distribution: number;
	days: number | null;
	selectedId: string | null;
};
export function mountGexScene(
	host: HTMLDivElement,
	data: MetricsComparison,
	locale: "en" | "zh",
	onSelect: (id: string) => void,
	onUnavailable: () => void,
) {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("webgl2", {
		alpha: true,
		antialias: true,
		powerPreference: "low-power",
	});
	if (!context) throw new Error("WebGL unavailable");
	const resources: Array<{ dispose: () => void }> = [];
	const cleanups: Array<() => void> = [];
	const track = <T extends { dispose: () => void }>(resource: T) => {
		resources.push(resource);
		return resource;
	};
	let frame = 0;
	let disposed = false;
	let failed = false;
	const dispose = () => {
		if (disposed) return;
		disposed = true;
		cancelAnimationFrame(frame);
		for (const cleanup of cleanups) cleanup();
		for (const resource of resources.reverse()) resource.dispose();
		context.getExtension("WEBGL_lose_context")?.loseContext();
		canvas.remove();
		delete host.dataset.renderer;
		delete host.dataset.renderCount;
	};
	try {
		const renderer = track(
			new THREE.WebGLRenderer({
				canvas,
				context,
				alpha: true,
				antialias: true,
			}),
		);
		canvas.style.cssText =
			"width:100%;height:100%;display:block;touch-action:none";
		canvas.setAttribute("aria-hidden", "true");
		host.append(canvas);
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
		camera.position.set(10, 8, 15);
		const controls = track(new OrbitControls(camera, canvas));
		controls.target.set(2, 0, 2.5);
		controls.enableDamping = false;
		controls.enablePan = false;
		controls.minDistance = 10;
		controls.maxDistance = 28;
		controls.minPolarAngle = 0.4;
		controls.maxPolarAngle = Math.PI * 0.65;
		controls.update();
		controls.saveState();
		scene.add(new THREE.AmbientLight(0xffffff, 2.5));
		const light = new THREE.DirectionalLight(0xffffff, 2);
		light.position.set(3, 10, 8);
		scene.add(light);
		const cells = data.distributions[0].cells;
		const strikes = [...new Set(cells.map((cell) => cell.strike))].sort(
			(a, b) => a - b,
		);
		const days = [...new Set(cells.map((cell) => cell.days))].sort(
			(a, b) => a - b,
		);
		const x = (strike: number) =>
			((strike - strikes[0]) /
				(strikes[strikes.length - 1] - strikes[0] || 1)) *
			4;
		const z = (day: number) =>
			((day - days[0]) / (days[days.length - 1] - days[0] || 1)) * 5;
		const maximum = gexScale(data);
		const geometry = track(new THREE.BoxGeometry(0.65, 1, 0.5));
		const missing = track(new THREE.TorusGeometry(0.2, 0.035, 6, 20));
		const bars = cells.map((cell) => {
			const material = track(
				new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.7 }),
			);
			const mesh = new THREE.Mesh<
				THREE.BufferGeometry,
				THREE.MeshStandardMaterial
			>(geometry, material);
			mesh.userData.id = cell.id;
			mesh.position.set(x(cell.strike), 0, z(cell.days));
			scene.add(mesh);
			return mesh;
		});
		const grid = new THREE.GridHelper(7, 14, 0x888888, 0xaaaaaa);
		grid.position.set(2, 0, 2.5);
		track(grid.geometry);
		track(grid.material);
		scene.add(grid);
		const labelHost = document.createElement("div");
		labelHost.style.cssText =
			"position:absolute;inset:0;pointer-events:none;overflow:hidden";
		labelHost.setAttribute("aria-hidden", "true");
		host.append(labelHost);
		cleanups.push(() => labelHost.remove());
		const labels: Array<{ element: HTMLElement; point: THREE.Vector3 }> = [];
		const label = (text: string, point: THREE.Vector3) => {
			const element = document.createElement("span");
			element.textContent = text;
			element.style.cssText =
				"position:absolute;white-space:nowrap;font-size:12px;background:var(--card);color:var(--foreground);padding:2px 4px;border-radius:4px";
			labelHost.append(element);
			labels.push({ element, point });
		};
		for (const strike of strikes)
			label(`$${strike}`, new THREE.Vector3(x(strike), 0, 6));
		for (const day of days)
			label(
				day + (locale === "zh" ? " 天" : " days"),
				new THREE.Vector3(5, 0, z(day)),
			);
		for (const sign of [-1, 0, 1])
			label(String(maximum * sign), new THREE.Vector3(-0.8, sign * 4, 0));
		label(
			locale === "zh" ? "GEX（美元 / 1% 变动）" : "GEX (USD / 1% move)",
			new THREE.Vector3(1, 5, 0),
		);
		let state: GexViewState = { distribution: 0, days: null, selectedId: null };
		let renders = 0;
		const requestRender = () => {
			if (disposed || failed || frame || document.hidden) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				if (disposed || failed) return;
				try {
					renderer.render(scene, camera);
					for (const { element, point } of labels) {
						const projected = point.clone().project(camera);
						element.style.transform =
							"translate(" +
							((projected.x + 1) * host.clientWidth) / 2 +
							"px," +
							((1 - projected.y) * host.clientHeight) / 2 +
							"px) translate(-50%,-50%)";
						element.style.display =
							Math.abs(projected.x) < 0.98 && Math.abs(projected.y) < 0.98
								? "block"
								: "none";
					}
					host.dataset.renderCount = String(++renders);
				} catch {
					failed = true;
					onUnavailable();
				}
			});
		};
		const update = (next: GexViewState) => {
			state = next;
			data.distributions[state.distribution].cells.forEach((cell, index) => {
				const mesh = bars[index];
				const height = ((cell.value ?? 0) / maximum) * 4;
				mesh.geometry = cell.value === null ? missing : geometry;
				mesh.rotation.x = cell.value === null ? -Math.PI / 2 : 0;
				mesh.scale.y =
					cell.value === null ? 1 : Math.max(0.025, Math.abs(height));
				mesh.position.y = cell.value === null ? 0.05 : height / 2;
				mesh.material.color.set(
					cell.value === null
						? 0x999999
						: (cell.value ?? 0) < 0
							? 0x8070c8
							: 0xd2a52f,
				);
				mesh.material.opacity =
					!state.selectedId || state.selectedId === cell.id ? 1 : 0.4;
				mesh.visible = state.days === null || cell.days === state.days;
			});
			requestRender();
		};
		const resize = () => {
			if (disposed || failed) return;
			const width = Math.max(1, host.clientWidth);
			const height = Math.max(1, host.clientHeight);
			renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
			renderer.setSize(width, height, false);
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			requestRender();
		};
		const observer = new ResizeObserver(resize);
		observer.observe(host);
		cleanups.push(() => observer.disconnect());
		const raycaster = new THREE.Raycaster();
		let down: { x: number; y: number } | null = null;
		const pointerDown = (event: PointerEvent) => {
			down = { x: event.clientX, y: event.clientY };
		};
		const pointerUp = (event: PointerEvent) => {
			if (
				!down ||
				Math.hypot(down.x - event.clientX, down.y - event.clientY) > 6
			) {
				down = null;
				return;
			}
			down = null;
			const rect = canvas.getBoundingClientRect();
			raycaster.setFromCamera(
				new THREE.Vector2(
					((event.clientX - rect.left) / rect.width) * 2 - 1,
					(-(event.clientY - rect.top) / rect.height) * 2 + 1,
				),
				camera,
			);
			const hit = raycaster.intersectObjects(
				bars.filter((mesh) => mesh.visible),
			)[0];
			if (hit) onSelect(hit.object.userData.id);
		};
		const cancel = () => {
			down = null;
		};
		const lost = (event: Event) => {
			event.preventDefault();
			if (!disposed && !failed) {
				failed = true;
				cancelAnimationFrame(frame);
				onUnavailable();
			}
		};
		controls.addEventListener("change", requestRender);
		canvas.addEventListener("pointerdown", pointerDown);
		canvas.addEventListener("pointerup", pointerUp);
		canvas.addEventListener("pointercancel", cancel);
		canvas.addEventListener("webglcontextlost", lost);
		document.addEventListener("visibilitychange", requestRender);
		cleanups.push(() => {
			controls.removeEventListener("change", requestRender);
			canvas.removeEventListener("pointerdown", pointerDown);
			canvas.removeEventListener("pointerup", pointerUp);
			canvas.removeEventListener("pointercancel", cancel);
			canvas.removeEventListener("webglcontextlost", lost);
			document.removeEventListener("visibilitychange", requestRender);
		});
		host.dataset.renderer = "gex-three";
		resize();
		update(state);
		return {
			update,
			dispose,
			rotate: (direction: number) => {
				controls.rotateLeft((direction * Math.PI) / 12);
				controls.update();
				requestRender();
			},
			reset: () => {
				controls.reset();
				requestRender();
			},
		};
	} catch (error) {
		dispose();
		throw error;
	}
}
