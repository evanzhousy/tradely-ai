import * as THREE from "three";

export const HALL_REVEAL_DURATION = 2.35;
const OUTLINE_MATERIALS =
	/FasciaPBR|Markets|NYSE|Flag|Tray|StoneDark|Steel|PaintedMetal/;

export function hallRevealProgress(seconds: number, reduced: boolean) {
	return reduced
		? 1
		: THREE.MathUtils.smoothstep(seconds, 0.5, HALL_REVEAL_DURATION);
}

const worldVertex = `
varying vec3 vHallRevealWorld;
`;
const mask = `
uniform float uHallSolid;
varying vec3 vHallRevealWorld;
float hallRevealThreshold(){
  float height=clamp((vHallRevealWorld.y+.25)/12.6,0.,1.);
  float grain=fract(sin(dot(floor(vHallRevealWorld*80.),vec3(12.9898,78.233,39.425)))*43758.5453);
  return clamp(height*.94+grain*.018+.02,.015,.98);
}
`;

function addWorldPosition(
	shader: Parameters<THREE.Material["onBeforeCompile"]>[0],
) {
	shader.vertexShader = shader.vertexShader
		.replace("#include <common>", `#include <common>\n${worldVertex}`)
		.replace(
			"#include <begin_vertex>",
			"#include <begin_vertex>\nvHallRevealWorld=(modelMatrix*vec4(position,1.)).xyz;",
		);
	shader.fragmentShader = shader.fragmentShader.replace(
		"#include <common>",
		`#include <common>\n${mask}`,
	);
}

/** A temporary architectural representation that shares the model's geometry. */
export function createHallReveal(
	root: THREE.Object3D,
	scene: THREE.Scene,
	reduced: boolean,
) {
	const solid = { value: 1 };
	const outlines = new THREE.Group();
	const occluders = new THREE.Group();
	outlines.name = "Exchange structural wireframe";
	occluders.name = "Wireframe hidden-surface mask";
	const lineMaterial = new THREE.LineBasicMaterial({
		color: 0xb5c1c6,
		transparent: true,
		opacity: 0.52,
		depthWrite: false,
		toneMapped: false,
	});
	lineMaterial.onBeforeCompile = (shader) => {
		shader.uniforms.uHallSolid = solid;
		addWorldPosition(shader);
		shader.fragmentShader = shader.fragmentShader.replace(
			"#include <color_fragment>",
			`#include <color_fragment>
diffuseColor.a*=1.-smoothstep(hallRevealThreshold()-.05,hallRevealThreshold()+.04,uHallSolid);`,
		);
	};
	lineMaterial.customProgramCacheKey = () => "exchange-structural-wire-v1";
	const depthMaterial = new THREE.MeshBasicMaterial({
		color: 0x030609,
		polygonOffset: true,
		polygonOffsetFactor: 1,
		polygonOffsetUnits: 1,
	});
	const lineGeometries: THREE.EdgesGeometry[] = [];
	const originals = new Map<
		THREE.Material,
		{
			compile: THREE.Material["onBeforeCompile"];
			cache: THREE.Material["customProgramCacheKey"];
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
				if (originals.has(material)) continue;
				const compile = material.onBeforeCompile;
				const cache = material.customProgramCacheKey;
				const key = cache.call(material);
				originals.set(material, { compile, cache });
				material.onBeforeCompile = (shader, renderer) => {
					compile.call(material, shader, renderer);
					shader.uniforms.uHallSolid = solid;
					addWorldPosition(shader);
					shader.fragmentShader = shader.fragmentShader.replace(
						"#include <clipping_planes_fragment>",
						`#include <clipping_planes_fragment>
if(uHallSolid<.999 && (uHallSolid<=0. || uHallSolid<hallRevealThreshold()))discard;`,
					);
				};
				material.customProgramCacheKey = () => `${key}-structural-reveal-v1`;
				material.needsUpdate = true;
			}
			// Depth masking avoids an unreadable x-ray view through the entire hall.
			const occluder = new THREE.Mesh(object.geometry, depthMaterial);
			occluder.matrix.copy(object.matrixWorld);
			occluder.matrixAutoUpdate = false;
			occluder.renderOrder = -2;
			occluders.add(occluder);
			if (
				!OUTLINE_MATERIALS.test(object.name) &&
				!materials.some((m) => OUTLINE_MATERIALS.test(m.name))
			)
				return;
			// Ignore tiny coplanar triangles and typography. Preserve visible hard edges.
			const geometry = new THREE.EdgesGeometry(object.geometry, 26);
			const line = new THREE.LineSegments(geometry, lineMaterial);
			line.matrix.copy(object.matrixWorld);
			line.matrixAutoUpdate = false;
			line.renderOrder = 1;
			outlines.add(line);
			lineGeometries.push(geometry);
		});
		scene.add(occluders, outlines);
	}
	if (!reduced) build();
	return {
		update(seconds: number, reduceMotion: boolean) {
			const progress = hallRevealProgress(seconds, reduceMotion);
			if (progress < 1) build();
			solid.value = progress;
			outlines.visible = occluders.visible = progress < 1;
			return progress;
		},
		dispose() {
			for (const [material, original] of originals) {
				material.onBeforeCompile = original.compile;
				material.customProgramCacheKey = original.cache;
				material.needsUpdate = true;
			}
			for (const geometry of lineGeometries) geometry.dispose();
			lineMaterial.dispose();
			depthMaterial.dispose();
			outlines.removeFromParent();
			occluders.removeFromParent();
		},
	};
}
