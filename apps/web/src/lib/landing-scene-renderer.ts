import * as THREE from "three";

export type LandingSceneController = {
	dispose: () => void;
	setPaused: (paused: boolean) => void;
};

const screenVertex = `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// Original procedural light field: an elliptical lens, a vertical beam, and dithered dust.
const lightFragment = `
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform vec3 uImpulse;
uniform float uTerrain;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
void main() {
  float aspect = uResolution.x / uResolution.y;
  float mobile = 1.0 - step(0.9, aspect);
  vec2 center = mix(vec2(0.76,0.54), vec2(0.78,0.65), mobile);
  vec2 p = (vUv-center) * vec2(aspect,1.0);
  p += (uPointer-0.5) * vec2(0.013,0.009);
  vec2 impact = (vUv-uImpulse.xy) * vec2(aspect,1.0);
  float age = uTime-uImpulse.z;
  float ripple = sin(length(impact)*55.0-age*5.0) * exp(-abs(length(impact)-age*0.23)*12.0) * exp(-age*0.8) * step(0.0,age);
  p += normalize(p+0.001)*ripple*0.008;
  vec2 lens = vec2(p.x*0.93+p.y*0.38, p.y*1.70-p.x*0.10);
  float radius = length(lens);
  float angle = atan(lens.y,lens.x);
  float ring = exp(-abs(radius-0.285)*145.0);
  float shoulder = exp(-abs(radius-0.285)*25.0)*0.24;
  float arc = 0.48+0.52*pow(0.5+0.5*sin(angle*1.0-uTime*0.12),3.0);
  float shaft = exp(-abs(p.x)*92.0) * (0.48+0.20*sin(p.y*9.0-uTime*0.5));
  float bloom = exp(-abs(p.x)*13.0)*0.12;
  float disc = exp(-radius*8.0)*0.09;
  float light = (ring+shoulder)*arc + shaft*0.70+bloom+disc;
  float distant = exp(-abs(radius-0.49)*300.0)*0.055 + exp(-abs(radius-0.72)*350.0)*0.03;
  float floorGlow = exp(-abs(vUv.y-0.09)*20.0)*exp(-abs(vUv.x-0.72)*4.0)*0.12;
  light += distant + floorGlow;
  vec2 cell = floor(gl_FragCoord.xy / 3.0);
  float dotMask = 1.0-smoothstep(0.22,0.46,length(fract(gl_FragCoord.xy/3.0)-0.5));
  float grain = hash(cell+floor(uTime*4.0));
  light *= mix(0.57,1.13,dotMask) + (grain-0.5)*0.11;
  float hover = exp(-length((vUv-uPointer)*vec2(aspect,1.0))*13.0);
  light += hover * step(0.975,grain) * 0.13;
  light *= mix(smoothstep(0.18,0.6,vUv.x),0.44,mobile);
  vec3 gold = mix(vec3(0.65,0.37,0.10),vec3(1.0,0.83,0.43),clamp(light*1.3,0.0,1.0));
  vec3 color = gold*light;
  if (uTerrain > 0.5) {
    float glow = exp(-abs(vUv.y-0.18)*7.0)*exp(-abs(vUv.x-0.5)*3.0);
    color = vec3(0.42,0.32,0.13)*glow*0.13;
  }
  gl_FragColor = vec4(color,1.0);
}
`;

const particleVertex = `
uniform float uTime;
uniform vec2 uPointer;
uniform float uPixelRatio;
attribute float aSeed;
varying float vAlpha;
void main() {
  vec3 p = position;
  p.y = mod(p.y + uTime*(0.006+aSeed*0.008)+1.0,2.0)-1.0;
  p.x += sin(uTime*0.18+aSeed*60.0)*0.025;
  vec2 delta = p.xy - (uPointer*2.0-1.0);
  p.xy += normalize(delta+0.001)*exp(-length(delta)*8.0)*0.03;
  gl_Position = vec4(p,1.0);
  gl_PointSize = (1.0+aSeed*2.0)*uPixelRatio;
  vAlpha = (0.15+aSeed*0.45) * smoothstep(-0.65,0.65,p.x);
}
`;
const particleFragment = `
varying float vAlpha;
void main() {
  float alpha = 1.0-smoothstep(0.08,0.5,length(gl_PointCoord-0.5));
  gl_FragColor=vec4(1.0,0.80,0.39,alpha*vAlpha);
}
`;

function terrainHeight(x: number, z: number) {
	const ridge = Math.exp(-((x + 1.5) ** 2) / 16 - (z + 2.0) ** 2 / 35) * 2.25;
	const ridge2 = Math.exp(-((x - 4.0) ** 2) / 12 - (z + 6) ** 2 / 20) * 1.7;
	return (
		ridge +
		ridge2 +
		Math.sin(x * 1.4 + z * 0.7) * 0.13 +
		Math.sin(x * 2.7 - z * 1.1) * 0.06
	);
}

export function mountLandingScene(
	host: HTMLDivElement,
	variant: "hero" | "terrain",
): LandingSceneController {
	const renderer = new THREE.WebGLRenderer({
		alpha: true,
		antialias: false,
		powerPreference: "low-power",
	});
	const coarse = window.matchMedia("(pointer: coarse)").matches;
	const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
	const density = Math.min(window.devicePixelRatio || 1, coarse ? 1 : 1.5);
	renderer.setPixelRatio(density);
	renderer.setClearColor(0x090b0b, 0);
	renderer.domElement.setAttribute("aria-hidden", "true");
	host.appendChild(renderer.domElement);
	host.dataset.state = "ready";
	const scene = new THREE.Scene();
	const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
	const pointer = new THREE.Vector2(0.74, 0.5);
	const target = pointer.clone();
	const uniforms = {
		uTime: { value: 3.0 },
		uResolution: { value: new THREE.Vector2(1, 1) },
		uPointer: { value: pointer },
		uImpulse: { value: new THREE.Vector3(0.7, 0.5, -100) },
		uTerrain: { value: variant === "terrain" ? 1 : 0 },
		uPixelRatio: { value: density },
	};
	const geometries: THREE.BufferGeometry[] = [];
	const materials: THREE.Material[] = [];
	const plane = new THREE.PlaneGeometry(2, 2);
	const light = new THREE.ShaderMaterial({
		vertexShader: screenVertex,
		fragmentShader: lightFragment,
		uniforms,
		depthTest: false,
		depthWrite: false,
	});
	geometries.push(plane);
	materials.push(light);
	scene.add(new THREE.Mesh(plane, light));
	const terrain = new THREE.Scene();
	const terrainCamera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
	terrainCamera.position.set(0, 3.8, 10);
	terrainCamera.lookAt(0, 0, -3);
	terrain.fog = new THREE.FogExp2(0x090b0b, 0.047);
	if (variant === "hero") {
		const count = coarse ? 130 : 320;
		const positions = new Float32Array(count * 3);
		const seeds = new Float32Array(count);
		for (let i = 0; i < count; i++) {
			const seed = ((i * 16807 + 113) % 2147483647) / 2147483647;
			const random = Math.sin(i * 127.1) * 43758.5453;
			seeds[i] = random - Math.floor(random);
			positions[i * 3] = Math.sin(i * 57.37 + seed) * 0.98;
			positions[i * 3 + 1] = Math.cos(i * 19.19) * 0.98;
		}
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
		geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
		const material = new THREE.ShaderMaterial({
			uniforms,
			vertexShader: particleVertex,
			fragmentShader: particleFragment,
			transparent: true,
			depthTest: false,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
		});
		geometries.push(geometry);
		materials.push(material);
		const particles = new THREE.Points(geometry, material);
		particles.frustumCulled = false;
		scene.add(particles);
	} else {
		const positions: number[] = [];
		const count = coarse ? 45 : 70;
		for (let row = 0; row < count; row++) {
			const z = 4 - row * 0.25;
			for (let col = 0; col < 150; col++) {
				const x = -18 + col * 0.24;
				positions.push(
					x,
					terrainHeight(x, z),
					z,
					x + 0.24,
					terrainHeight(x + 0.24, z),
					z,
				);
			}
		}
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			"position",
			new THREE.Float32BufferAttribute(positions, 3),
		);
		const material = new THREE.LineBasicMaterial({
			color: 0xc5ad76,
			transparent: true,
			opacity: 0.45,
		});
		geometries.push(geometry);
		materials.push(material);
		terrain.add(new THREE.LineSegments(geometry, material));
	}
	let disposed = false;
	let paused = false;
	let visible = false;
	let lost = false;
	let frame = 0;
	let last = 0;
	let renderTime = 0;
	const eventTarget = host.parentElement ?? host;
	const render = () => {
		if (disposed || lost) return;
		renderer.autoClear = true;
		renderer.render(scene, camera);
		if (variant === "terrain") {
			terrainCamera.position.x = (pointer.x - 0.5) * 0.65;
			terrainCamera.lookAt(0, 0, -3);
			renderer.autoClear = false;
			renderer.clearDepth();
			renderer.render(terrain, terrainCamera);
		}
	};
	const animate = (now: number) => {
		if (disposed) return;
		frame = requestAnimationFrame(animate);
		if (now - renderTime < (coarse ? 1000 / 24 : 1000 / 30)) return;
		const delta = last ? Math.min((now - last) / 1000, 0.08) : 0;
		last = now;
		renderTime = now;
		uniforms.uTime.value += delta;
		pointer.lerp(target, 0.08);
		render();
	};
	const sync = () => {
		cancelAnimationFrame(frame);
		frame = 0;
		last = 0;
		const active =
			visible &&
			!paused &&
			!reduced.matches &&
			!lost &&
			document.visibilityState === "visible";
		host.dataset.animationActive = String(active);
		if (active) frame = requestAnimationFrame(animate);
		else render();
	};
	const resize = () => {
		const { width, height } = host.getBoundingClientRect();
		renderer.setSize(Math.max(width, 1), Math.max(height, 1), false);
		renderer.getDrawingBufferSize(uniforms.uResolution.value);
		terrainCamera.aspect = Math.max(width, 1) / Math.max(height, 1);
		terrainCamera.updateProjectionMatrix();
		render();
	};
	const move = (event: PointerEvent) => {
		if (paused || reduced.matches) return;
		const rect = host.getBoundingClientRect();
		target.set(
			(event.clientX - rect.left) / rect.width,
			1 - (event.clientY - rect.top) / rect.height,
		);
	};
	const impulse = (event: PointerEvent) => {
		if (
			(event.target as Element).closest("a,button,input,select") ||
			paused ||
			reduced.matches
		)
			return;
		move(event);
		uniforms.uImpulse.value.set(target.x, target.y, uniforms.uTime.value);
	};
	const contextLost = (event: Event) => {
		event.preventDefault();
		lost = true;
		host.dataset.state = "fallback";
		sync();
	};
	const contextRestored = () => {
		lost = false;
		host.dataset.state = "ready";
		resize();
		sync();
	};
	const intersection = new IntersectionObserver((entries) => {
		visible = entries.some((entry) => entry.isIntersecting);
		sync();
	});
	const size = new ResizeObserver(resize);
	intersection.observe(host);
	size.observe(host);
	resize();
	document.addEventListener("visibilitychange", sync);
	reduced.addEventListener("change", sync);
	eventTarget.addEventListener("pointermove", move);
	eventTarget.addEventListener("pointerdown", impulse);
	renderer.domElement.addEventListener("webglcontextlost", contextLost);
	renderer.domElement.addEventListener("webglcontextrestored", contextRestored);
	return {
		setPaused(value) {
			paused = value;
			sync();
		},
		dispose() {
			disposed = true;
			cancelAnimationFrame(frame);
			intersection.disconnect();
			size.disconnect();
			document.removeEventListener("visibilitychange", sync);
			reduced.removeEventListener("change", sync);
			eventTarget.removeEventListener("pointermove", move);
			eventTarget.removeEventListener("pointerdown", impulse);
			renderer.domElement.removeEventListener("webglcontextlost", contextLost);
			renderer.domElement.removeEventListener(
				"webglcontextrestored",
				contextRestored,
			);
			for (const geometry of geometries) geometry.dispose();
			for (const material of materials) material.dispose();
			renderer.dispose();
			renderer.forceContextLoss();
			renderer.domElement.remove();
			delete host.dataset.animationActive;
			delete host.dataset.state;
		},
	};
}
