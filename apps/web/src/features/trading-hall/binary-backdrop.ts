import * as THREE from "three";

/** One GPU layer of decorative binary data; no market/account data is used. */
export function createBinaryBackdrop(scene: THREE.Scene, compact: boolean) {
	const atlas = document.createElement("canvas");
	atlas.width = 256;
	atlas.height = 128;
	const context = atlas.getContext("2d");
	if (!context) throw new Error("Binary glyph canvas unavailable");
	context.fillStyle = "white";
	context.font = "80px ui-monospace, SFMono-Regular, Menlo, monospace";
	context.textAlign = "center";
	context.textBaseline = "middle";
	context.fillText("0", 64, 64);
	context.fillText("1", 192, 64);
	const glyphs = new THREE.CanvasTexture(atlas);
	glyphs.flipY = false;
	glyphs.generateMipmaps = false;
	glyphs.minFilter = glyphs.magFilter = THREE.LinearFilter;
	const material = new THREE.ShaderMaterial({
		depthWrite: false,
		depthTest: false,
		toneMapped: false,
		uniforms: {
			glyphs: { value: glyphs },
			time: { value: 0 },
			amount: { value: 0 },
			resolution: { value: new THREE.Vector2(1, 1) },
			cellWidth: { value: compact ? 13 : 16 },
			compact: { value: compact ? 1 : 0 },
		},
		vertexShader: `varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,1.,1.);}`,
		fragmentShader: `
uniform sampler2D glyphs;
uniform float time;
uniform float amount;
uniform float cellWidth;
uniform float compact;
uniform vec2 resolution;
varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  vec2 cells=vec2(vUv.x,1.-vUv.y)*resolution/vec2(cellWidth,cellWidth*1.6);
  vec2 cell=floor(cells);
  vec2 local=fract(cells);
  float seed=hash(vec2(cell.x,4.2));
  float tail=7.+seed*13.;
  float rows=resolution.y/(cellWidth*1.6);
  float head=mod(time*(.5+seed*.85)+seed*(rows+tail),rows+tail+10.);
  float behind=head-cell.y;
  float trail=smoothstep(-.2,.3,behind)*(1.-smoothstep(1.,tail,behind));
  float tip=(1.-smoothstep(.0,1.3,abs(behind)))*step(0.,behind);
  float bit=step(.5,hash(cell+vec2(0.,floor(time*.32+seed*5.))));
  float ink=texture2D(glyphs,vec2((bit+local.x)*.5,local.y)).a;
  float density=step(.18,hash(vec2(cell.x,8.1)));
  vec3 code=vec3(.012,.18,.08)*trail*.48+vec3(.10,.50,.23)*tip*.26;
  code*=ink*density*(.45+hash(cell)*.55);
  float copyArea=(1.-smoothstep(.12,.48,vUv.y))*mix(1.-smoothstep(.35,.8,vUv.x),1.,compact);
  float vignette=1.-smoothstep(.28,.78,length(vUv-.5));
  gl_FragColor=vec4(vec3(.001,.002,.002)+code*amount*(1.-copyArea*.8)*(.45+vignette*.55),1.);
}`,
	});
	const geometry = new THREE.PlaneGeometry(2, 2);
	const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
		type: THREE.HalfFloatType,
		depthBuffer: false,
		stencilBuffer: false,
	});
	const resolution = new THREE.Vector2(1, 1);
	const dataScene = new THREE.Scene();
	const dataCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
	const dataQuad = new THREE.Mesh(geometry, material);
	dataQuad.frustumCulled = false;
	dataScene.add(dataQuad);
	const displayMaterial = new THREE.ShaderMaterial({
		depthWrite: false,
		depthTest: false,
		toneMapped: false,
		uniforms: { dataMap: { value: renderTarget.texture } },
		vertexShader: material.vertexShader,
		fragmentShader:
			"uniform sampler2D dataMap;varying vec2 vUv;void main(){gl_FragColor=texture2D(dataMap,vUv);}",
	});
	const mesh = new THREE.Mesh(geometry, displayMaterial);
	mesh.name = "Binary data backdrop";
	mesh.frustumCulled = false;
	mesh.renderOrder = -1000;
	scene.add(mesh);
	return {
		mesh,
		texture: renderTarget.texture,
		resolution,
		update(time: number, phase: number, reduced: boolean) {
			material.uniforms.time.value = time;
			const amount = reduced
				? 0
				: THREE.MathUtils.smoothstep(phase, 0.03, 0.25);
			material.uniforms.amount.value = amount;
			return amount;
		},
		resize(width: number, height: number, pixelRatio = 1) {
			material.uniforms.resolution.value.set(width, height);
			const smallView = compact || width < 768;
			material.uniforms.cellWidth.value = smallView ? 13 : 16;
			material.uniforms.compact.value = smallView ? 1 : 0;
			resolution.set(
				Math.max(1, Math.floor(width * pixelRatio)),
				Math.max(1, Math.floor(height * pixelRatio)),
			);
			renderTarget.setSize(resolution.x, resolution.y);
		},
		render(renderer: THREE.WebGLRenderer) {
			const previousTarget = renderer.getRenderTarget();
			const previousAutoClear = renderer.autoClear;
			try {
				renderer.autoClear = true;
				renderer.setRenderTarget(renderTarget);
				renderer.render(dataScene, dataCamera);
			} finally {
				renderer.setRenderTarget(previousTarget);
				renderer.autoClear = previousAutoClear;
			}
		},
		dispose() {
			mesh.removeFromParent();
			geometry.dispose();
			material.dispose();
			displayMaterial.dispose();
			renderTarget.dispose();
			dataScene.clear();
			glyphs.dispose();
		},
	};
}
