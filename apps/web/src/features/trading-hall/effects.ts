import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";

export function createHallEffects(scene: THREE.Scene, compact: boolean) {
	const group = new THREE.Group();
	scene.add(group);
	// Distant city silhouette and luminous sky provide depth behind the glazing.
	const skyCanvas = document.createElement("canvas");
	skyCanvas.width = 1024;
	skyCanvas.height = 512;
	const skyContext = skyCanvas.getContext("2d");
	if (!skyContext) throw new Error("Sky canvas unavailable");
	const skyGradient = skyContext.createLinearGradient(0, 0, 0, 512);
	skyGradient.addColorStop(0, "#78909f");
	skyGradient.addColorStop(0.62, "#d4d3bc");
	skyGradient.addColorStop(1, "#e6c594");
	skyContext.fillStyle = skyGradient;
	skyContext.fillRect(0, 0, 1024, 512);
	for (let i = 0; i < 32; i++) {
		const x = i * 34;
		const h = 35 + Math.abs(Math.sin(i * 7.1)) * 115;
		skyContext.fillStyle = i % 2 ? "#90999a" : "#a2a8a4";
		skyContext.fillRect(x, 512 - h, 25, h);
		skyContext.fillStyle = "#c7c9b8";
		for (let row = 0; row < h / 12; row++)
			for (let col = 0; col < 3; col++)
				skyContext.fillRect(x + 4 + col * 7, 514 - h + row * 12, 3, 5);
	}
	const skyTexture = new THREE.CanvasTexture(skyCanvas);
	skyTexture.colorSpace = THREE.SRGBColorSpace;
	const sky = new THREE.Mesh(
		new THREE.PlaneGeometry(34, 12),
		new THREE.MeshBasicMaterial({ map: skyTexture, toneMapped: false }),
	);
	sky.position.set(13.1, 5.5, 0);
	sky.rotation.y = -Math.PI / 2;
	group.add(sky);

	const particleCount = compact ? 350 : 1300;
	const seed = new Float32Array(particleCount * 3);
	for (let i = 0; i < seed.length; i++) {
		const n = Math.sin(i * 127.1 + 38.2) * 43758.5453;
		seed[i] = n - Math.floor(n);
	}
	const dustGeometry = new THREE.BufferGeometry();
	dustGeometry.setAttribute(
		"position",
		new THREE.BufferAttribute(new Float32Array(particleCount * 3), 3),
	);
	dustGeometry.setAttribute("seed", new THREE.BufferAttribute(seed, 3));
	const dustMaterial = new THREE.ShaderMaterial({
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
		uniforms: { time: { value: 0 }, density: { value: compact ? 1 : 1.3 } },
		vertexShader: `attribute vec3 seed;uniform float time;uniform float density;varying float glow;
void main(){vec3 p=vec3(-10.+seed.x*21.,.3+seed.y*8.,-13.+seed.z*29.);p.x+=sin(time*.09+seed.z*30.)*.32;p.y+=sin(time*.13+seed.x*16.)*.18;p.z+=cos(time*.08+seed.y*20.)*.25;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((1.+seed.x*2.)*density*14./max(3.,-mv.z),.8,5.);glow=(.16+.4*seed.y)*(.55+.45*sin(time*.6+seed.x*50.));}`,
		fragmentShader:
			"varying float glow;void main(){float a=1.-smoothstep(.06,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(1.,.86,.61,a*glow*.23);}",
	});
	const dust = new THREE.Points(dustGeometry, dustMaterial);
	dust.frustumCulled = false;
	group.add(dust);
	const shaftMaterials: THREE.ShaderMaterial[] = [];
	for (const z of [-8, -2, 4, 10]) {
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			"position",
			new THREE.Float32BufferAttribute(
				[
					11.65,
					8.45,
					z - 1.1,
					11.65,
					8.45,
					z + 1.1,
					-5,
					0.08,
					z + 5,
					-5,
					0.08,
					z + 2,
				],
				3,
			),
		);
		geometry.setAttribute(
			"uv",
			new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2),
		);
		geometry.setIndex([0, 1, 2, 0, 2, 3]);
		const material = new THREE.ShaderMaterial({
			transparent: true,
			depthWrite: false,
			side: THREE.DoubleSide,
			blending: THREE.AdditiveBlending,
			uniforms: { time: { value: 0 } },
			vertexShader:
				"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
			fragmentShader:
				"varying vec2 vUv;uniform float time;void main(){float edge=pow(sin(vUv.x*3.14159),3.);float haze=.88+.12*sin(vUv.y*20.+time*.14);float fade=(1.-smoothstep(.55,1.,vUv.y));gl_FragColor=vec4(1.,.78,.44,edge*fade*haze*.065);}",
		});
		shaftMaterials.push(material);
		group.add(new THREE.Mesh(geometry, material));
	}
	const floorGeometry = new THREE.PlaneGeometry(24, 34);
	const floor = new Reflector(floorGeometry, {
		textureWidth: compact ? 512 : 1024,
		textureHeight: compact ? 512 : 1024,
		multisample: 0,
		clipBias: 0.006,
		color: 0x5a5548,
		shader: {
			name: "Polished veined stone",
			uniforms: {
				color: { value: new THREE.Color() },
				tDiffuse: { value: null },
				textureMatrix: { value: new THREE.Matrix4() },
				stoneMap: { value: null },
				stoneRough: { value: null },
				stoneNormal: { value: null },
				hasStone: { value: 0 },
			},
			vertexShader:
				"uniform mat4 textureMatrix;varying vec4 vUv;varying vec2 stoneUv;void main(){stoneUv=position.xy;vUv=textureMatrix*vec4(position,1.);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
			fragmentShader: `uniform sampler2D tDiffuse;uniform sampler2D stoneMap;uniform sampler2D stoneRough;uniform sampler2D stoneNormal;uniform float hasStone;uniform vec3 color;varying vec4 vUv;varying vec2 stoneUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void main(){vec2 p=stoneUv;float n=noise(p*.55)+noise(p*2.2)*.25;float vein=pow(1.-abs(sin(p.x*.7+p.y*.35+n*5.5)),19.);vec3 stone=vec3(.033,.038,.038)+n*.022+vein*vec3(.08,.07,.047);float rough=.5;if(hasStone>.5){stone=texture2D(stoneMap,stoneUv*.45).rgb*.7;float sl=dot(stone,vec3(.2126,.7152,.0722));stone=mix(stone,vec3(sl)*vec3(.94,1.02,1.05),.84);rough=texture2D(stoneRough,stoneUv*.45).g;}vec2 uv=vUv.xy/vUv.w;if(hasStone>.5)uv+=(texture2D(stoneNormal,stoneUv*.45).xy-.5)*.002;float blur=.0025;vec3 reflected=texture2D(tDiffuse,uv).rgb*.4;reflected+=(texture2D(tDiffuse,uv+vec2(blur,0)).rgb+texture2D(tDiffuse,uv-vec2(blur,0)).rgb+texture2D(tDiffuse,uv+vec2(0,blur)).rgb+texture2D(tDiffuse,uv-vec2(0,blur)).rgb)*.15;vec2 tile=abs(fract(p*.5)-.5);float seam=smoothstep(.492,.5,max(tile.x,tile.y));vec3 col=mix(stone,reflected*vec3(.85,.85,.80),mix(.48,.17,rough));col=mix(col,col*.25,seam*(1.-hasStone));gl_FragColor=vec4(col,1.);}`,
		},
	});
	floor.rotation.x = -Math.PI / 2;
	floor.position.y = 0.012;
	scene.add(floor);
	return {
		floor,
		setStoneMaterial(material: THREE.MeshStandardMaterial) {
			if (!material.map) return;
			for (const texture of [
				material.map,
				material.roughnessMap,
				material.normalMap,
			])
				if (texture) {
					texture.wrapS = THREE.RepeatWrapping;
					texture.wrapT = THREE.RepeatWrapping;
					texture.needsUpdate = true;
				}
			(floor.material as THREE.ShaderMaterial).uniforms.stoneMap.value =
				material.map;
			(floor.material as THREE.ShaderMaterial).uniforms.stoneRough.value =
				material.roughnessMap;
			(floor.material as THREE.ShaderMaterial).uniforms.stoneNormal.value =
				material.normalMap;
			(floor.material as THREE.ShaderMaterial).uniforms.hasStone.value = 1;
		},
		update(time: number) {
			dustMaterial.uniforms.time.value = time;
			for (const material of shaftMaterials)
				material.uniforms.time.value = time;
		},
		dispose() {
			group.traverse((o) => {
				if (o instanceof THREE.Mesh || o instanceof THREE.Points) {
					o.geometry.dispose();
					if (!Array.isArray(o.material)) o.material.dispose();
				}
			});
			skyTexture.dispose();
			skyCanvas.width = 1;
			skyCanvas.height = 1;
			group.removeFromParent();
			floor.dispose();
			floorGeometry.dispose();
			floor.removeFromParent();
		},
	};
}
