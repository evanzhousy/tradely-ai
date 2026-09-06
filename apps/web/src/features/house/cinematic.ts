import * as THREE from "three";
import type { Area } from "./interior";
export type Quality = "low" | "medium" | "high";
export const QUALITY = {
	low: {
		pixelRatio: 1,
		particles: 0.2,
		shadow: 1024,
		ao: false,
		bloom: false,
		shafts: false,
	},
	medium: {
		pixelRatio: 1.25,
		particles: 0.55,
		shadow: 1024,
		ao: true,
		bloom: true,
		shafts: true,
	},
	high: {
		pixelRatio: 1.5,
		particles: 1,
		shadow: 2048,
		ao: true,
		bloom: true,
		shafts: true,
	},
} as const;
export function createCinematicEffects(scene: THREE.Scene) {
	const root = new THREE.Group();
	scene.add(root);
	const systems: { points: THREE.Points; count: number; kind: number }[] = [];
	const materials: THREE.ShaderMaterial[] = [];
	// All particle motion is evaluated on the GPU, with one draw call per system.
	function particles(count: number, kind: number, color: number, size: number) {
		const seed = new Float32Array(count * 3);
		for (let i = 0; i < seed.length; i++)
			seed[i] =
				(((Math.sin(i * 127.1 + kind * 311.7) * 43758.5453) % 1) + 1) % 1;
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			"position",
			new THREE.BufferAttribute(new Float32Array(count * 3), 3),
		);
		geometry.setAttribute("seed", new THREE.BufferAttribute(seed, 3));
		const material = new THREE.ShaderMaterial({
			transparent: true,
			depthWrite: false,
			blending: kind === 2 ? THREE.NormalBlending : THREE.AdditiveBlending,
			uniforms: {
				time: { value: 0 },
				tint: { value: new THREE.Color(color) },
				pointSize: { value: size },
				opacity: { value: kind === 0 ? 0.22 : 0.7 },
			},
			vertexShader: `attribute vec3 seed; uniform float time; uniform float pointSize; varying float life;
   void main(){ vec3 p; float t=time;
    ${kind === 0 ? "p=vec3(-4.4+seed.x*3.2, .25+seed.y*2.25, -4.6+seed.z*4.0); p.x+=sin(t*.28+seed.y*25.)*.12;p.y+=sin(t*.4+seed.z*15.)*.12; life=.25+.5*seed.x;" : kind === 1 ? "float age=fract(seed.y+t*.38);p=vec3(-2.65+(seed.x-.5)*.65+sin(age*7.+seed.z*20.)*.08,.28+age*1.05,-4.38+(seed.z-.5)*.17);life=sin(age*3.14159);" : kind === 2 ? "float age=fract(seed.y+t*.065);p=vec3(-10.+seed.x*16.+sin(t*.4+seed.z*12.)*.6,.25+(1.-age)*6.,-11.+seed.z*18.+sin(t*.25+seed.x*15.)*.5);life=smoothstep(0.,.12,age)*(1.-smoothstep(.85,1.,age));" : "p=vec3(-8.+seed.x*13.+sin(t*.5+seed.y*30.)*.4,.3+seed.y*1.5+sin(t*.7+seed.x*20.)*.2,-8.+seed.z*14.);life=pow(.5+.5*sin(t*1.7+seed.z*30.),3.);"}
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(pointSize*170./max(1.,-mv.z),1.,${kind === 2 ? "9." : "5."});
   }`,
			fragmentShader: `uniform vec3 tint;uniform float opacity;varying float life;
    void main(){vec2 p=gl_PointCoord-.5;float a=1.-smoothstep(.08,.5,length(p));gl_FragColor=vec4(tint,a*life*opacity);}`,
		});
		const points = new THREE.Points(geometry, material);
		points.frustumCulled = false;
		root.add(points);
		systems.push({ points, count, kind });
		materials.push(material);
	}
	particles(480, 0, 0xffdfab, 0.08);
	particles(48, 1, 0xff923c, 0.65);
	particles(90, 2, 0xb18a4d, 1.0);
	particles(70, 3, 0xd8ff91, 0.6);
	const shafts = new THREE.Group();
	root.add(shafts);
	for (const x of [-4.05, -3.3]) {
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			"position",
			new THREE.Float32BufferAttribute(
				[
					x - 0.45,
					2.35,
					-4.75,
					x + 0.45,
					2.35,
					-4.75,
					x + 1.4,
					0.1,
					-0.6,
					x - 0.9,
					0.1,
					-0.6,
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
			uniforms: { opacity: { value: 0.1 } },
			vertexShader:
				"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
			fragmentShader:
				"varying vec2 vUv;uniform float opacity;void main(){float edge=pow(sin(vUv.x*3.14159),2.);gl_FragColor=vec4(1.,.70,.35,edge*(1.-vUv.y)*opacity);}",
		});
		const mesh = new THREE.Mesh(geometry, material);
		shafts.add(mesh);
		materials.push(material);
	}
	const lamps = new THREE.Group();
	root.add(lamps);
	for (const [x, y, z, power] of [
		[-4.5, 1.35, 1.9, 1.5],
		[3, 2.4, 0.2, 3],
		[-2.65, 0.6, -4.3, 1.2],
	]) {
		const light = new THREE.PointLight(0xffbb77, power, 5, 2);
		light.position.set(x, y, z);
		lamps.add(light);
	}
	const fireplace = new THREE.Mesh(
		new THREE.PlaneGeometry(1.0, 0.55),
		new THREE.ShaderMaterial({
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
			uniforms: { time: { value: 0 } },
			vertexShader:
				"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
			fragmentShader:
				"uniform float time;varying vec2 vUv;void main(){float flames=0.;for(int i=0;i<5;i++){float x=.12+float(i)*.19;float bend=.035*sin(time*2.+float(i)*1.7+vUv.y*5.);float h=.45+.18*sin(time*1.3+float(i)*2.);flames+=smoothstep(.12,0.,abs(vUv.x-x-bend))*(1.-smoothstep(h-.25,h,vUv.y));}gl_FragColor=vec4(vec3(1.8,.55,.08)*flames,clamp(flames,0.,1.));}",
		}),
	);
	fireplace.position.set(-2.65, 0.55, -4.455);
	root.add(fireplace);
	materials.push(fireplace.material);
	let area: Area = "exterior";
	let quality: Quality = "medium";
	let sunset = 0;
	const update = () => {
		const settings = QUALITY[quality];
		for (const system of systems) {
			system.points.visible =
				system.kind <= 1
					? area === "ground"
					: area === "exterior" && (system.kind === 2 || sunset > 0.65);
			system.points.geometry.setDrawRange(
				0,
				Math.floor(system.count * settings.particles),
			);
		}
		shafts.visible = area === "ground" && settings.shafts;
		lamps.visible = area === "ground";
		fireplace.visible = area === "ground";
	};
	return {
		setArea(value: Area, progress: number) {
			area = value;
			sunset = progress;
			update();
		},
		setQuality(value: Quality) {
			quality = value;
			update();
		},
		tick(time: number) {
			for (const m of materials)
				if (m.uniforms.time) m.uniforms.time.value = time;
		},
		dispose() {
			root.removeFromParent();
			root.traverse((o) => {
				if (o instanceof THREE.Mesh || o instanceof THREE.Points)
					o.geometry.dispose();
			});
			for (const m of materials) m.dispose();
		},
	};
}
