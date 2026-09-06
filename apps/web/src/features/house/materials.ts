import * as THREE from "three";

/** World-space grain survives merged GLB geometry without requiring baked UV maps. */
export function enhanceHouseMaterials(root: THREE.Object3D) {
	const visited = new Set<THREE.MeshStandardMaterial>();
	root.traverse((object) => {
		if (!(object instanceof THREE.Mesh)) return;
		const materials = Array.isArray(object.material)
			? object.material
			: [object.material];
		for (const material of materials) {
			if (
				!(material instanceof THREE.MeshStandardMaterial) ||
				visited.has(material)
			)
				continue;
			visited.add(material);
			const name = material.name.toLowerCase();
			if (name.includes("glazing")) {
				material.roughness = 0.12;
				material.metalness = 0.65;
				material.envMapIntensity = 1.4;
				continue;
			}
			const roof = name.includes("shingle");
			const wood = /cedar|clapboard|door|bark/.test(name);
			const ground = /asphalt|concrete|stone|mulch|lawn/.test(name);
			if (!roof && !wood && !ground) continue;
			material.roughness = roof || ground ? 0.94 : 0.72;
			const strength = roof ? 0.22 : ground ? 0.18 : 0.075;
			const scale = roof ? 32 : wood ? 18 : 26;
			material.onBeforeCompile = (shader) => {
				shader.uniforms.surfaceGrain = { value: strength };
				shader.vertexShader = shader.vertexShader
					.replace(
						"#include <common>",
						"#include <common>\nvarying vec3 vHousePosition;",
					)
					.replace(
						"#include <begin_vertex>",
						"#include <begin_vertex>\nvHousePosition = (modelMatrix * vec4(position, 1.0)).xyz;",
					);
				shader.fragmentShader = shader.fragmentShader
					.replace(
						"#include <common>",
						`#include <common>
     varying vec3 vHousePosition;
     uniform float surfaceGrain;
     float houseHash(vec3 p) { return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
     float houseNoise(vec3 p) {
      vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
      return mix(mix(mix(houseHash(i),houseHash(i+vec3(1,0,0)),f.x),mix(houseHash(i+vec3(0,1,0)),houseHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(houseHash(i+vec3(0,0,1)),houseHash(i+vec3(1,0,1)),f.x),mix(houseHash(i+vec3(0,1,1)),houseHash(i+vec3(1,1,1)),f.x),f.y),f.z);
     }
    `,
					)
					.replace(
						"#include <color_fragment>",
						`#include <color_fragment>
      vec3 grainPoint = vHousePosition * ${scale.toFixed(1)};
      ${wood ? "grainPoint *= vec3(1.0,0.12,1.0);" : ""}
      float detail = houseNoise(grainPoint);
      float broad = houseNoise(vHousePosition * 2.5);
      diffuseColor.rgb *= 1.0 + (detail - .5) * surfaceGrain + (broad-.5)*surfaceGrain;
    `,
					)
					.replace(
						"#include <normal_fragment_maps>",
						`#include <normal_fragment_maps>
      // Screen-space surface gradient perturbs lighting only, never silhouette.
      vec3 dx = dFdx(-vViewPosition), dy = dFdy(-vViewPosition);
      vec3 rx = cross(dy, normal), ry = cross(normal, dx);
      float determinant = dot(dx, rx);
      vec3 gradient = sign(determinant) * (dFdx(detail) * rx + dFdy(detail) * ry);
      normal = normalize(abs(determinant) * normal - gradient * surfaceGrain * 0.003);
    `,
					);
			};
			material.customProgramCacheKey = () =>
				`house-grain-v1-${scale}-${strength}-${wood}`;
			material.needsUpdate = true;
		}
	});
}
