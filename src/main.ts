import * as THREE from 'three';
import { Physics } from './core/Physics';
import { InputManager } from './core/InputManager';
import { PlayerCar } from './entities/PlayerCar';
import { FirstPersonCamera } from './core/Game';

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;
document.getElementById('app')!.appendChild(renderer.domElement);

// --- Scene ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510);
scene.fog = new THREE.Fog(0x050510, 50, 250);

// --- Camera ---
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);
camera.position.set(0, 3, 10);
camera.lookAt(0, 0, 0);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0x111122, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0x8888ff, 1.0);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
scene.add(dirLight);

// --- Ground Plane (physics) ---
const groundGeo = new THREE.PlaneGeometry(40, 400);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x111111,
  roughness: 0.8,
  metalness: 0.2,
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// --- Core Systems ---
const physics = new Physics();
const input = new InputManager();

// Physics ground
import * as CANNON from 'cannon-es';
const groundBody = new CANNON.Body({
  mass: 0,
  shape: new CANNON.Plane(),
});
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
physics.addBody(groundBody);

// --- Player ---
const player = new PlayerCar(scene, physics);

// --- First Person Camera ---
const fpCamera = new FirstPersonCamera(camera);

// --- Resize ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Animation Loop ---
const clock = new THREE.Clock();

function animate(): void {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  // Physics
  physics.update(dt);

  // Player
  player.update(input, dt);

  // First-person camera
  const carPos = player.mesh.position;
  const carQuat = player.mesh.quaternion;
  const steer = (input.left ? 1 : 0) + (input.right ? -1 : 0);
  fpCamera.update(carPos, carQuat, steer, player.speed, 80);

  renderer.render(scene, camera);
}

animate();
