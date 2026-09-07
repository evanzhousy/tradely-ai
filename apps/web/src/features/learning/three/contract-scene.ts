import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { sampleContractReplay } from "@/domain/learning/contract-replay";
import {
	type ContractNeighborhood,
	type ContractViewState,
	contractLayout,
	contractStatus,
	visibleContracts,
} from "@/domain/learning/contracts";
import { replayPositionAt } from "@/domain/learning/replay";
import type { Locale } from "@/i18n/messages";

export type ContractSceneController = {
	update: (state: ContractViewState) => void;
	rotate: (direction: number) => void;
	reset: () => void;
	dispose: () => void;
};

export function mountContractScene(
	host: HTMLDivElement,
	data: ContractNeighborhood,
	locale: Locale,
	onSelect: (id: string) => void,
	onUnavailable: () => void,
): ContractSceneController {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("webgl2", {
		alpha: true,
		antialias: true,
		powerPreference: "low-power",
	});
	if (!context) throw new Error("WebGL is unavailable");
	let disposed = false;
	let frame = 0;
	const resources = new Set<{ dispose: () => void }>();
	const cleanups: Array<() => void> = [];
	const track = <T extends { dispose: () => void }>(resource: T): T => {
		resources.add(resource);
		return resource;
	};
	const dispose = () => {
		if (disposed) return;
		disposed = true;
		cancelAnimationFrame(frame);
		for (const cleanup of cleanups) cleanup();
		for (const resource of [...resources].reverse()) resource.dispose();
		resources.clear();
		cleanups.length = 0;
		context.getExtension("WEBGL_lose_context")?.loseContext();
		canvas.remove();
		delete host.dataset.renderer;
		delete host.dataset.renderCount;
		delete host.dataset.replayPosition;
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
		renderer.setClearColor(0, 0);
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		canvas.setAttribute("aria-hidden", "true");
		canvas.style.cssText =
			"display:block;width:100%;height:100%;touch-action:none;";
		host.appendChild(canvas);
		const labelsHost = document.createElement("div");
		labelsHost.setAttribute("aria-hidden", "true");
		labelsHost.style.cssText =
			"position:absolute;inset:0;pointer-events:none;overflow:hidden;";
		host.appendChild(labelsHost);
		cleanups.push(() => labelsHost.remove());
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
		camera.position.set(11, 10, 14);
		const controls = track(new OrbitControls(camera, canvas));
		controls.target.set(2.1, 1.8, 2.7);
		controls.enableDamping = false;
		controls.enablePan = false;
		controls.minDistance = 9;
		controls.maxDistance = 28;
		controls.minPolarAngle = 0.32;
		controls.maxPolarAngle = Math.PI * 0.46;
		controls.minAzimuthAngle = -0.65;
		controls.maxAzimuthAngle = 1.4;
		controls.update();
		controls.saveState();
		scene.add(new THREE.AmbientLight(0xffffff, 2.2));
		const light = new THREE.DirectionalLight(0xffffff, 3);
		light.position.set(4, 12, 8);
		scene.add(light);
		const layout = contractLayout(data);
		const geometry = track(new THREE.BoxGeometry(0.64, 1, 0.5));
		const edges = track(new THREE.EdgesGeometry(geometry));
		const missingGeometry = track(new THREE.TorusGeometry(0.2, 0.04, 5, 18));
		const bars: THREE.Mesh[] = [];
		const outlines: THREE.LineSegments[] = [];
		const gridGeometry = track(new THREE.BufferGeometry());
		const points: THREE.Vector3[] = [];
		for (const strike of layout.strikes)
			points.push(
				new THREE.Vector3(layout.x(strike), 0, -0.5),
				new THREE.Vector3(layout.x(strike), 0, 6.4),
			);
		for (const days of layout.expiries)
			points.push(
				new THREE.Vector3(-0.45, 0, layout.z(days)),
				new THREE.Vector3(4.65, 0, layout.z(days)),
			);
		points.push(new THREE.Vector3(-0.65, 0, 0), new THREE.Vector3(-0.65, 5, 0));
		gridGeometry.setFromPoints(points);
		const gridMaterial = track(new THREE.LineBasicMaterial());
		scene.add(new THREE.LineSegments(gridGeometry, gridMaterial));
		const labels: Array<{
			element: HTMLSpanElement;
			position: THREE.Vector3;
			axis: boolean;
			contractIndex?: number;
			active: boolean;
		}> = [];
		const addLabel = (text: string, position: THREE.Vector3, axis = false) => {
			const element = document.createElement("span");
			element.textContent = text;
			element.style.cssText = `position:absolute;left:0;top:0;white-space:nowrap;font-size:${axis ? 12 : 11}px;line-height:1.3;color:var(--foreground);background:color-mix(in srgb,var(--card) 86%,transparent);padding:1px 3px;border-radius:3px;font-variant-numeric:tabular-nums;`;
			labelsHost.appendChild(element);
			const label: (typeof labels)[number] = {
				element,
				position,
				axis,
				active: true,
			};
			labels.push(label);
			return label;
		};
		for (const strike of layout.strikes)
			addLabel(String(strike), new THREE.Vector3(layout.x(strike), -0.2, 6.7));
		for (const days of layout.expiries)
			addLabel(`${days}d`, new THREE.Vector3(5, -0.1, layout.z(days)));
		for (const ratio of [0, 0.5, 1])
			addLabel(
				(layout.volumeMax * ratio).toLocaleString(locale),
				new THREE.Vector3(-1, ratio * 5, 0),
			);
		addLabel(
			locale === "zh" ? "行权价（美元）" : "Strike (USD)",
			new THREE.Vector3(2.1, -0.2, 8.2),
			true,
		);
		addLabel(
			locale === "zh" ? "距到期天数" : "Days to expiry",
			new THREE.Vector3(5.9, 0, 3.8),
			true,
		);
		addLabel(
			locale === "zh" ? "时段成交量（张）" : "Session volume (contracts)",
			new THREE.Vector3(-0.65, 6.2, 0),
			true,
		);
		if (data.spot !== undefined) {
			const spotGeometry = track(
				new THREE.BufferGeometry().setFromPoints([
					new THREE.Vector3(layout.x(data.spot), 0.08, -0.5),
					new THREE.Vector3(layout.x(data.spot), 0.08, 6.4),
				]),
			);
			const spotMaterial = track(
				new THREE.LineBasicMaterial({ color: 0xb58c26 }),
			);
			scene.add(new THREE.Line(spotGeometry, spotMaterial));
			addLabel(
				(locale === "zh" ? "现价 $" : "Spot $") + data.spot,
				new THREE.Vector3(layout.x(data.spot), 0.1, -0.9),
				true,
			);
		}
		labels.sort((a, b) => Number(b.axis) - Number(a.axis));
		for (const [index, contract] of data.contracts.entries()) {
			const material = track(
				new THREE.MeshStandardMaterial({
					roughness: 0.42,
					metalness: 0.08,
					transparent: true,
				}),
			);
			const mesh = new THREE.Mesh(
				contract.volume === null ? missingGeometry : geometry,
				material,
			);
			mesh.userData.contractId = contract.id;
			mesh.position.set(
				layout.x(contract.strike),
				contract.volume === null ? 0.05 : layout.y(contract.volume) / 2,
				layout.z(contract.days),
			);
			if (contract.volume === null) mesh.rotation.x = -Math.PI / 2;
			else mesh.scale.y = Math.max(0.02, layout.y(contract.volume));
			scene.add(mesh);
			bars.push(mesh);
			const outlineMaterial = track(new THREE.LineBasicMaterial());
			const outline = new THREE.LineSegments(edges, outlineMaterial);
			outline.position.copy(mesh.position);
			outline.scale.copy(mesh.scale).multiplyScalar(1.04);
			outline.visible = false;
			scene.add(outline);
			outlines.push(outline);
			const label = addLabel(
				"",
				new THREE.Vector3(
					layout.x(contract.strike),
					0,
					layout.z(contract.days),
				),
			);
			label.contractIndex = index;
			label.element.dataset.contractValue = contract.id;
			label.element.style.fontSize = "12px";
			label.element.style.fontWeight = "500";
		}
		let state: ContractViewState = {
			selectedId: null,
			scopeOnly: false,
			expiry: null,
		};
		let visible = true;
		let failed = false;
		const unavailable = () => {
			if (!failed && !disposed) {
				failed = true;
				onUnavailable();
			}
		};
		let renderCount = 0;
		let lastPosition = -1;
		let forceDraw = true;
		const project = new THREE.Vector3();
		const queueRender = () => {
			if (disposed || failed || frame || !visible || document.hidden) return;
			frame = requestAnimationFrame((now) => {
				frame = 0;
				if (disposed || failed || !visible || document.hidden) return;
				const position = state.replay
					? replayPositionAt(data, state.replay, now)
					: 1;
				if (forceDraw || position !== lastPosition) {
					const current = sampleContractReplay(data, position);
					current.contracts.forEach((contract, index) => {
						const mesh = bars[index];
						const missing = contract.volume === null;
						const height = missing ? 0 : layout.y(contract.volume ?? 0);
						mesh.geometry = missing ? missingGeometry : geometry;
						mesh.rotation.x = missing ? -Math.PI / 2 : 0;
						mesh.position.y = missing ? 0.05 : height / 2;
						mesh.scale.set(1, missing ? 1 : Math.max(0.015, height), 1);
						outlines[index].position.copy(mesh.position);
						outlines[index].scale.copy(mesh.scale).multiplyScalar(1.04);
						outlines[index].visible =
							state.selectedId === contract.id && mesh.visible && !missing;
					});
					for (const label of labels) {
						if (label.contractIndex === undefined) continue;
						const contract = current.contracts[label.contractIndex];
						const value =
							contract.volume === null
								? "—"
								: contract.volume.toLocaleString(locale);
						if (label.element.textContent !== value)
							label.element.textContent = value;
						label.position.y =
							(contract.volume === null ? 0 : layout.y(contract.volume)) + 0.35;
					}
					try {
						renderer.render(scene, camera);
					} catch {
						unavailable();
						return;
					}
					for (const label of labels) {
						project.copy(label.position).project(camera);
						const x = (project.x * 0.5 + 0.5) * host.clientWidth;
						const y = (-project.y * 0.5 + 0.5) * host.clientHeight;
						label.element.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
						label.element.style.display =
							label.active &&
							project.z < 1 &&
							Math.abs(project.x) < 0.98 &&
							Math.abs(project.y) < 0.98
								? "block"
								: "none";
					}
					// Read all bounds together, then suppress colliding optional ticks.
					const measured = labels
						.filter((label) => label.element.style.display !== "none")
						.map((label) => ({
							label,
							bounds: label.element.getBoundingClientRect(),
						}));
					const occupied: DOMRect[] = [];
					for (const { label, bounds } of measured) {
						const collision = occupied.some(
							(other) =>
								bounds.left < other.right + 3 &&
								bounds.right > other.left - 3 &&
								bounds.top < other.bottom + 3 &&
								bounds.bottom > other.top - 3,
						);
						if (collision && !label.axis) label.element.style.display = "none";
						else occupied.push(bounds);
					}
					host.dataset.renderCount = String(++renderCount);
					host.dataset.replayPosition = String(position);
					lastPosition = position;
					forceDraw = false;
				}
				if (state.replay?.playing && position < 1) queueRender();
			});
		};
		const requestRender = () => {
			forceDraw = true;
			queueRender();
		};
		const color = (token: string) =>
			new THREE.Color(
				getComputedStyle(host).getPropertyValue(token).trim() ||
					getComputedStyle(host).color,
			);
		const updateAppearance = () => {
			const shown = new Set(
				visibleContracts(data, state).map((contract) => contract.id),
			);
			gridMaterial.color.copy(color("--border"));
			data.contracts.forEach((contract, index) => {
				const mesh = bars[index];
				const selected = contract.id === state.selectedId;
				const comparable = contractStatus(data, contract) === "comparable";
				const anchor = data.contracts.find(
					(item) => item.id === state.selectedId,
				);
				const neighbor =
					anchor &&
					(anchor.strike === contract.strike || anchor.days === contract.days);
				const material = mesh.material as THREE.MeshStandardMaterial;
				material.color.copy(
					color(
						selected
							? "--primary"
							: comparable
								? "--chart-1"
								: "--muted-foreground",
					),
				);
				material.opacity =
					selected || (comparable && (!anchor || neighbor)) ? 1 : 0.28;
				material.depthWrite = selected || comparable;
				mesh.visible = shown.has(contract.id);
				outlines[index].visible =
					selected && mesh.visible && contract.volume !== null;
				(outlines[index].material as THREE.LineBasicMaterial).color.copy(
					color("--foreground"),
				);
			});
			for (const label of labels) {
				if (label.contractIndex === undefined) continue;
				const contract = data.contracts[label.contractIndex];
				const selected = contract.id === state.selectedId;
				label.active =
					shown.has(contract.id) &&
					(selected || contractStatus(data, contract) === "comparable");
				label.element.style.background = selected
					? "var(--primary)"
					: "color-mix(in srgb,var(--card) 86%,transparent)";
				label.element.style.color = selected
					? "var(--primary-foreground)"
					: "var(--foreground)";
			}
			const priority = (label: (typeof labels)[number]) =>
				label.axis
					? 0
					: label.contractIndex === undefined
						? 3
						: data.contracts[label.contractIndex].id === state.selectedId
							? 1
							: 2;
			labels.sort((a, b) => priority(a) - priority(b));
			requestRender();
		};
		const resize = () => {
			const width = Math.max(1, host.clientWidth);
			const height = Math.max(1, host.clientHeight);
			renderer.setPixelRatio(
				Math.min(devicePixelRatio || 1, width < 500 ? 1 : 1.5),
			);
			renderer.setSize(width, height, false);
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			requestRender();
		};
		const raycaster = new THREE.Raycaster();
		const pointer = new THREE.Vector2();
		let pointerDown: { x: number; y: number } | null = null;
		const down = (event: PointerEvent) => {
			pointerDown =
				event.isPrimary && event.button === 0
					? { x: event.clientX, y: event.clientY }
					: null;
		};
		const cancelPointer = () => {
			pointerDown = null;
		};
		const up = (event: PointerEvent) => {
			if (
				!pointerDown ||
				Math.hypot(
					event.clientX - pointerDown.x,
					event.clientY - pointerDown.y,
				) > 5
			) {
				pointerDown = null;
				return;
			}
			pointerDown = null;
			const rect = canvas.getBoundingClientRect();
			pointer.set(
				((event.clientX - rect.left) / rect.width) * 2 - 1,
				(-(event.clientY - rect.top) / rect.height) * 2 + 1,
			);
			raycaster.setFromCamera(pointer, camera);
			const hit = raycaster.intersectObjects(
				bars.filter((bar) => bar.visible),
				false,
			)[0];
			if (hit) onSelect(String(hit.object.userData.contractId));
		};
		const lost = (event: Event) => {
			event.preventDefault();
			unavailable();
		};
		const observer = new ResizeObserver(resize);
		cleanups.push(() => observer.disconnect());
		observer.observe(host);
		const intersection = new IntersectionObserver(([entry]) => {
			visible = entry?.isIntersecting ?? true;
			if (visible) requestRender();
		});
		cleanups.push(() => intersection.disconnect());
		intersection.observe(host);
		const theme = new MutationObserver(updateAppearance);
		cleanups.push(() => theme.disconnect());
		theme.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class", "style"],
		});
		controls.addEventListener("change", requestRender);
		canvas.addEventListener("pointerdown", down);
		canvas.addEventListener("pointerup", up);
		canvas.addEventListener("pointercancel", cancelPointer);
		canvas.addEventListener("webglcontextlost", lost);
		document.addEventListener("visibilitychange", requestRender);
		cleanups.push(() => {
			document.removeEventListener("visibilitychange", requestRender);
			canvas.removeEventListener("pointerdown", down);
			canvas.removeEventListener("pointerup", up);
			canvas.removeEventListener("pointercancel", cancelPointer);
			canvas.removeEventListener("webglcontextlost", lost);
		});
		resize();
		updateAppearance();
		host.dataset.renderer = "three";
		return {
			update(next) {
				state = next;
				updateAppearance();
			},
			rotate(direction) {
				controls.rotateLeft((direction * Math.PI) / 12);
				controls.update();
				requestRender();
			},
			reset() {
				controls.reset();
				requestRender();
			},
			dispose,
		};
	} catch (error) {
		dispose();
		throw error;
	}
}
