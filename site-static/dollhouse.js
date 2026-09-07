import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// The full asset, including furniture and decorative objects, comes from Blender.
export function addDollhouse(scene, camera, controls, isInside, stopFollowing) {
  const button = document.createElement('button');
  button.id = 'dollhouseView';
  button.type = 'button';
  button.textContent = '娃娃屋加载中…';
  button.disabled = true;
  document.querySelector('#panelToggle').after(button);
  let model;
  let cancelled = false;
  const load = () => {
    button.disabled = true;
    button.textContent = '娃娃屋加载中…';
    new GLTFLoader().load('/models/dollhouse/dollhouse.glb', (gltf) => {
      model = gltf.scene;
      model.name = 'Pink Dream Dollhouse';
      model.position.set(13, 0, -3);
      model.scale.setScalar(1);
      model.traverse(object => {
        if (object.isMesh) {
          object.castShadow = !object.material.transparent;
          object.receiveShadow = true;
        }
      });
      scene.add(model);
      button.textContent = '查看娃娃屋 / Dollhouse';
      button.disabled = false;
    }, undefined, () => {
      button.textContent = '重试加载娃娃屋 / Retry';
      button.disabled = false;
    });
  };
  button.addEventListener('click', () => {
    if (!model) { load(); return; }
    if (isInside()) return;
    stopFollowing();
    controls.minDistance = 1.2;
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const fit = Math.max(size.y, size.x / camera.aspect);
    const distance = fit / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.25;
    controls.target.copy(center);
    camera.position.copy(center).addScaledVector(new THREE.Vector3(.22, .25, 1).normalize(), distance);
    controls.update();
  });
  load();
  return { update() {
    if (cancelled) return;
    if (model) {
      model.visible = !isInside();
      button.disabled = isInside();
    }
  }, dispose() {
    cancelled = true;
    button.remove();
    if (model) model.removeFromParent();
  } };
}
