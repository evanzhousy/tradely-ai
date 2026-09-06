import * as THREE from "three";

const noise = `
float hHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float hNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hHash(i),hHash(i+vec3(1,0,0)),f.x),mix(hHash(i+vec3(0,1,0)),hHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hHash(i+vec3(0,0,1)),hHash(i+vec3(1,0,1)),f.x),mix(hHash(i+vec3(0,1,1)),hHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
`;
export function applyHallReveal(
	shader: Parameters<THREE.Material["onBeforeCompile"]>[0],
	reveal: THREE.IUniform<number>,
) {
	shader.uniforms.uHallReveal = reveal;
	shader.vertexShader = shader.vertexShader
		.replace("#include <common>", "#include <common>\nvarying vec3 vHallWorld;")
		.replace(
			"#include <begin_vertex>",
			"#include <begin_vertex>\nvHallWorld=(modelMatrix*vec4(position,1.)).xyz;",
		);
	shader.fragmentShader = shader.fragmentShader
		.replace(
			"#include <common>",
			`#include <common>\nvarying vec3 vHallWorld;uniform float uHallReveal;${noise}`,
		)
		.replace(
			"#include <clipping_planes_fragment>",
			`#include <clipping_planes_fragment>
float hSweep=clamp(vHallWorld.y*.078+(15.-vHallWorld.z)*.007+hHash(floor(vHallWorld*18.))*.008,0.,.98);
if(uHallReveal<hSweep)discard;`,
		);
}

export function enhanceHallMaterials(
	root: THREE.Object3D,
	reveal: THREE.IUniform<number>,
) {
	const handled = new Set<THREE.MeshStandardMaterial>();
	root.traverse((object) => {
		if (!(object instanceof THREE.Mesh)) return;
		object.castShadow =
			!/MarketScreens|TickerScreens|WindowLight|WarmLight/.test(object.name);
		object.receiveShadow = true;
		const mats = Array.isArray(object.material)
			? object.material
			: [object.material];
		for (const material of mats) {
			if (
				!(material instanceof THREE.MeshStandardMaterial) ||
				handled.has(material)
			)
				continue;
			handled.add(material);
			const name = material.name;
			if (/Screens/.test(name)) continue;
			const wood = /Walnut/.test(name);
			const stone = /Stone/.test(name);
			const leather = /Leather/.test(name);
			const colors: Record<string, number> = {
				TH_WallStone: 0x30332f,
				TH_DarkMetal: 0x1b2223,
				TH_Ceiling: 0x171d1b,
				TH_Leather: 0x171d20,
				TH_ScreenBezel: 0x10181b,
				TH_Walnut: 0x764b2c,
				TH_Walnut_PBR: 0xa7784b,
				TH_Bronze: 0x9b7a46,
				TH_Keycaps: 0x58605e,
			};
			if (colors[name]) material.color.setHex(colors[name]);
			material.envMapIntensity = /Bronze/.test(name) ? 1.1 : 0.5;
			if (/WarmLight/.test(name)) {
				material.color.setHex(0x201006);
				material.emissive.setHex(0xffca81);
				material.emissiveIntensity = 3.2;
			}
			if (/WindowLight/.test(name)) {
				material.color.setHex(0xa2b2b7);
				material.emissive.setHex(0xffe6b5);
				material.emissiveIntensity = 0.45;
				material.transparent = true;
				material.opacity = 0.27;
				material.depthWrite = false;
			}
			if (material.normalMap) material.normalScale.set(0.25, 0.25);
			const detail = wood || stone || leather;
			material.onBeforeCompile = (shader) => {
				applyHallReveal(shader, reveal);
				shader.fragmentShader = shader.fragmentShader
					.replace(
						"#include <color_fragment>",
						`#include <color_fragment>
float hDetail=hNoise(vHallWorld*${wood ? "vec3(9.,2.,.55)" : leather ? "90." : "3.5"});
${detail ? `diffuseColor.rgb*= ${wood ? ".67+hDetail*.66+sin(vHallWorld.x*55.+hDetail*8.)*.07" : leather ? ".97+hDetail*.06" : ".80+hDetail*.32"};` : ""}
${stone ? "float hStoneLuma=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(hStoneLuma)*vec3(.94,1.02,1.05),.84);float hj=max(step(.993,fract((abs(vHallWorld.x)>11.?vHallWorld.z:vHallWorld.x)*.5)),step(.993,fract(vHallWorld.y*.5)));diffuseColor.rgb*=1.-hj*.35*step(1.1,vHallWorld.y);" : ""}
diffuseColor.rgb+=vec3(.46,.23,.06)*exp(-abs(uHallReveal-hSweep)*110.)*step(uHallReveal,.99);`,
					)
					.replace(
						"#include <roughnessmap_fragment>",
						`#include <roughnessmap_fragment>\n${detail ? "roughnessFactor=clamp(roughnessFactor+(hDetail-.5)*.16,.12,1.);" : ""}`,
					)
					.replace(
						"#include <normal_fragment_maps>",
						`#include <normal_fragment_maps>
${detail ? "vec3 hx=dFdx(-vViewPosition),hy=dFdy(-vViewPosition);vec3 hrx=cross(hy,normal),hry=cross(normal,hx);float hd=dot(hx,hrx);normal=normalize(abs(hd)*normal-sign(hd)*(dFdx(hDetail)*hrx+dFdy(hDetail)*hry)*.0008);" : ""}`,
					);
			};
			material.customProgramCacheKey = () => `hall-surface-v1-${name}`;
			material.needsUpdate = true;
		}
	});
}
