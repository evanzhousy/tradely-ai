import * as THREE from "three";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";

export const HALL_SCAN_START = 0.2;
export const HALL_SCAN_END = 0.64;
const OUTLINE_MATERIALS = /Wood|Metal|Stone|Brass|Markets|Flag|Lettering/;

/** One spatial sweep during the workstation approach, reversible with scrolling. */
export function hallScanState(progress: number, reduced: boolean) {
	const phase = THREE.MathUtils.clamp(
		(progress - HALL_SCAN_START) / (HALL_SCAN_END - HALL_SCAN_START),
		0,
		1,
	);
	return {
		active: !reduced && phase > 0,
		scanning: !reduced && phase > 0 && phase < 1,
		phase,
		height: THREE.MathUtils.lerp(-1.5, 14, phase),
	};
}

const scanMask = `
uniform float uHallScanHeight;
uniform float uHallScanEnabled;
uniform float uHallScanComplete;
varying vec3 vHallScanWorld;
float hallScanCoverage(){
  float behind=uHallScanHeight-vHallScanWorld.y;
  return mix(smoothstep(-.08,.12,behind),1.,uHallScanComplete)*uHallScanEnabled;
}
float hallScanBeam(){
  float distanceToPlane=abs(vHallScanWorld.y-uHallScanHeight);
  return (1.-smoothstep(.008,.04,distanceToPlane))*uHallScanEnabled*(1.-uHallScanComplete);
}
`;

function addWorldPosition(
	shader: Parameters<THREE.Material["onBeforeCompile"]>[0],
) {
	shader.vertexShader = shader.vertexShader
		.replace(
			"#include <common>",
			"#include <common>\nvarying vec3 vHallScanWorld;",
		)
		.replace(
			"#include <begin_vertex>",
			"#include <begin_vertex>\nvHallScanWorld=(modelMatrix*vec4(position,1.)).xyz;",
		);
	shader.fragmentShader = shader.fragmentShader.replace(
		"#include <common>",
		`#include <common>\n${scanMask}`,
	);
}

/** Scanned surfaces retain their depth and stay in wireframe through the closing view. */
export function createHallScan(
	root: THREE.Object3D,
	scene: THREE.Scene,
	reduced: boolean,
	backdrop: { texture: THREE.Texture; resolution: THREE.Vector2 },
) {
	const height = { value: -1.5 };
	const enabled = { value: 0 };
	const complete = { value: 0 };
	const outlines = new THREE.Group();
	outlines.name = "Exchange scan wireframe";
	outlines.visible = false;
	const lineMaterial = new LineMaterial({
		color: 0x75d6df,
		transparent: true,
		opacity: 0.68,
		// The raster quad includes an AA margin; the visible stroke is 0.55 CSS px.
		linewidth: 1.6,
		worldUnits: false,
		depthWrite: false,
		toneMapped: false,
	});
	const strokeWidth = { value: 0.55 };
	lineMaterial.onBeforeCompile = (shader) => {
		shader.uniforms.uHallScanHeight = height;
		shader.uniforms.uHallScanEnabled = enabled;
		shader.uniforms.uHallScanComplete = complete;
		shader.uniforms.uHallStrokeWidth = strokeWidth;
		shader.vertexShader = shader.vertexShader
			.replace(
				"#include <common>",
				"#include <common>\nvarying vec3 vHallScanWorld;",
			)
			.replace(
				"void main() {",
				"void main() {\nvHallScanWorld=(modelMatrix*vec4(position.y<.5?instanceStart:instanceEnd,1.)).xyz;",
			)
			.replace(
				"gl_Position = clip;",
				"gl_Position=clip;\ngl_Position.z-=.000006*gl_Position.w;",
			);
		shader.fragmentShader = shader.fragmentShader
			.replace(
				"#include <common>",
				`#include <common>\n${scanMask}\nuniform float uHallStrokeWidth;`,
			)
			.replace(
				"gl_FragColor = vec4( diffuseColor.rgb, alpha );",
				`
if(abs(vUv.y)>1.)discard;
float distanceToLine=abs(vUv.x)*linewidth*.5;
float aa=max(fwidth(distanceToLine),.001)*.5;
float coverage=1.-smoothstep(uHallStrokeWidth*.5-aa,uHallStrokeWidth*.5+aa,distanceToLine);
alpha*=coverage*max(hallScanCoverage(),hallScanBeam());
gl_FragColor=vec4(diffuseColor.rgb,alpha);`,
			);
	};
	lineMaterial.customProgramCacheKey = () => "exchange-precision-lines-v4";
	const lineGeometries: LineSegmentsGeometry[] = [];
	const originals = new Map<
		THREE.MeshStandardMaterial,
		{
			compile: THREE.Material["onBeforeCompile"];
			cache: THREE.Material["customProgramCacheKey"];
			polygonOffset: boolean;
			polygonOffsetFactor: number;
			polygonOffsetUnits: number;
		}
	>();
	let built = false;
	function build() {
		if (built) return;
		built = true;
		root.updateMatrixWorld(true);
		root.traverse((object) => {
			if (!(object instanceof THREE.Mesh) || !object.visible) return;
			const materials: THREE.Material[] = Array.isArray(object.material)
				? object.material
				: [object.material];
			for (const material of materials) {
				if (
					!(material instanceof THREE.MeshStandardMaterial) ||
					originals.has(material)
				)
					continue;
				const compile = material.onBeforeCompile;
				const cache = material.customProgramCacheKey;
				const key = cache.call(material);
				originals.set(material, {
					compile,
					cache,
					polygonOffset: material.polygonOffset,
					polygonOffsetFactor: material.polygonOffsetFactor,
					polygonOffsetUnits: material.polygonOffsetUnits,
				});
				material.onBeforeCompile = (shader, renderer) => {
					compile.call(material, shader, renderer);
					shader.uniforms.uHallScanHeight = height;
					shader.uniforms.uHallScanEnabled = enabled;
					shader.uniforms.uHallScanComplete = complete;
					shader.uniforms.uHallDataMap = { value: backdrop.texture };
					shader.uniforms.uHallViewport = { value: backdrop.resolution };
					addWorldPosition(shader);
					shader.fragmentShader = shader.fragmentShader.replace(
						"#include <common>",
						"#include <common>\nuniform sampler2D uHallDataMap;\nuniform vec2 uHallViewport;",
					);
					shader.fragmentShader = shader.fragmentShader.replace(
						"#include <opaque_fragment>",
						`float scanCoverage=hallScanCoverage();
float scanBeam=hallScanBeam();
vec3 dataBackdrop=texture2D(uHallDataMap,gl_FragCoord.xy/uHallViewport).rgb;
outgoingLight=mix(outgoingLight,dataBackdrop,scanCoverage);
outgoingLight+=vec3(.08,.55,.65)*scanBeam;
#include <opaque_fragment>`,
					);
				};
				material.customProgramCacheKey = () => `${key}-data-reveal-v4`;
				material.polygonOffset = true;
				material.polygonOffsetFactor = 1;
				material.polygonOffsetUnits = 1;
				material.needsUpdate = true;
			}
			if (
				!OUTLINE_MATERIALS.test(object.name) &&
				!materials.some((m) => OUTLINE_MATERIALS.test(m.name))
			)
				return;
			const edges = new THREE.EdgesGeometry(object.geometry, 35);
			const points = edges.getAttribute("position");
			const positions: number[] = [];
			const minLength = /Lettering/.test(object.name) ? 0.002 : 0.045;
			for (let i = 0; i < points.count; i += 2) {
				const ax = points.getX(i);
				const ay = points.getY(i);
				const az = points.getZ(i);
				const bx = points.getX(i + 1);
				const by = points.getY(i + 1);
				const bz = points.getZ(i + 1);
				if (Math.hypot(bx - ax, by - ay, bz - az) >= minLength)
					positions.push(ax, ay, az, bx, by, bz);
			}
			edges.dispose();
			const geometry = new LineSegmentsGeometry().setPositions(positions);
			const line = new LineSegments2(geometry, lineMaterial);
			line.matrix.copy(object.matrixWorld);
			line.matrixAutoUpdate = false;
			line.renderOrder = 1;
			outlines.add(line);
			lineGeometries.push(geometry);
		});
		scene.add(outlines);
	}
	// Prepare once during loading; no outline draws occur until the user scrolls.
	if (!reduced) build();
	return {
		update(progress: number, reduceMotion: boolean) {
			const state = hallScanState(progress, reduceMotion);
			if (state.active) build();
			height.value = state.height;
			enabled.value = state.active ? 1 : 0;
			complete.value = state.active && !state.scanning ? 1 : 0;
			outlines.visible = state.active;
			return state;
		},
		dispose() {
			for (const [material, original] of originals) {
				material.onBeforeCompile = original.compile;
				material.customProgramCacheKey = original.cache;
				material.polygonOffset = original.polygonOffset;
				material.polygonOffsetFactor = original.polygonOffsetFactor;
				material.polygonOffsetUnits = original.polygonOffsetUnits;
				material.needsUpdate = true;
			}
			for (const geometry of lineGeometries) geometry.dispose();
			lineMaterial.dispose();
			outlines.removeFromParent();
		},
	};
}
