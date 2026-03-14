import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Physics } from './core/Physics';
import { InputManager } from './core/InputManager';
import { FirstPersonCamera } from './core/Game';
import { PlayerCar } from './entities/PlayerCar';
import { RoadGenerator } from './systems/RoadGenerator';
import { SpawnManager } from './systems/SpawnManager';
import { ScoreSystem } from './systems/ScoreSystem';
import { HUD } from './ui/HUD';

// ==================== GAME STATE ====================
let hp = 100;
const maxHp = 100;
let gameOver = false;
let nitroFuel = 1;
let nitroActive = false;
let nitroCooldown = 0;
const nitroDuration = 3;
const nitroCooldownTime = 10;

// Dodge tracking
const dodgeDistanceSq = 6 * 6; // 6 meters
let dodgedCars = new Set<number>();

// ==================== RENDERER ====================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;
document.getElementById('app')!.appendChild(renderer.domElement);

// ==================== SCENE ====================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050510);
scene.fog = new THREE.Fog(0x050510, 50, 250);

// ==================== CAMERA ====================
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);

// ==================== LIGHTING ====================
const ambientLight = new THREE.AmbientLight(0x111122, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0x8888ff, 1.0);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
scene.add(dirLight);

// ==================== CORE SYSTEMS ====================
const physics = new Physics();
const input = new InputManager();

// Physics ground plane
const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
physics.addBody(groundBody);

// ==================== GAME OBJECTS ====================
const player = new PlayerCar(scene, physics);
const fpCamera = new FirstPersonCamera(camera);
const road = new RoadGenerator(scene, physics);
const spawner = new SpawnManager(scene, physics);
const score = new ScoreSystem();
const hud = new HUD();

// ==================== COLLISION ====================
player.body.addEventListener('collide', (e: { body: CANNON.Body }) => {
  if (gameOver) return;
  // Check if collided with traffic
  const activeCars = spawner.getActiveCars();
  for (const car of activeCars) {
    if (car.body === e.body) {
      hp -= 20;
      hud.flash();
      car.deactivate();
      if (hp <= 0) {
        hp = 0;
        gameOver = true;
        hud.showGameOver(score.getScore());
      }
      break;
    }
  }
});

// ==================== RESTART ====================
function restart(): void {
  hp = maxHp;
  gameOver = false;
  nitroFuel = 1;
  nitroActive = false;
  nitroCooldown = 0;
  score.reset();
  dodgedCars.clear();
  player.body.position.set(0, 1, 0);
  player.body.velocity.set(0, 0, 0);
  player.body.angularVelocity.set(0, 0, 0);
  player.body.quaternion.set(0, 0, 0, 1);
  hud.hideGameOver();
}

hud.onRestart(restart);

// ==================== RESIZE ====================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==================== GAME LOOP ====================
const clock = new THREE.Clock();

function animate(): void {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05); // cap delta

  if (gameOver) {
    renderer.render(scene, camera);
    return;
  }

  // Nitro
  if (input.nitro && nitroFuel > 0 && nitroCooldown <= 0) {
    nitroActive = true;
    nitroFuel -= dt / nitroDuration;
    if (nitroFuel <= 0) {
      nitroFuel = 0;
      nitroActive = false;
      nitroCooldown = nitroCooldownTime;
    }
  } else {
    nitroActive = false;
    if (nitroCooldown > 0) {
      nitroCooldown -= dt;
      if (nitroCooldown <= 0) {
        nitroFuel = 1;
      }
    }
  }

  // Apply nitro boost
  if (nitroActive) {
    const boostForce = new CANNON.Vec3(0, 0, -2000 * dt);
    player.body.quaternion.vmult(boostForce, boostForce);
    player.body.applyForce(boostForce);
  }

  // Physics
  physics.update(dt);

  // Player
  player.update(input, dt);

  // Road
  road.update(player.position.z);

  // Traffic
  spawner.update(dt, player.position.z, player.speed);

  // Score
  score.update(dt, player.position.z);

  // Dodge detection
  const activeCars = spawner.getActiveCars();
  for (const car of activeCars) {
    const carId = car.body.id;
    if (dodgedCars.has(carId)) continue;
    const dz = car.body.position.z - player.position.z;
    if (dz > 3 && dz < 10) {
      const dx = car.body.position.x - player.position.x;
      if (dx * dx + dz * dz < dodgeDistanceSq) {
        // Player passed close to traffic car
        score.addDodge();
        dodgedCars.add(carId);
      }
    }
  }

  // Cleanup old dodge IDs
  if (dodgedCars.size > 50) {
    dodgedCars = new Set<number>();
  }

  // First-person camera
  const carPos = player.mesh.position;
  const carQuat = player.mesh.quaternion;
  const steer = (input.left ? 1 : 0) + (input.right ? -1 : 0);
  fpCamera.update(carPos, carQuat, steer, player.speed, 80);

  // Move directional light with player
  dirLight.position.set(
    player.position.x + 10,
    20,
    player.position.z - 10
  );
  dirLight.target.position.set(
    player.position.x,
    0,
    player.position.z
  );
  dirLight.target.updateMatrixWorld();

  // HUD
  hud.update(hp, maxHp, player.speed, score.getScore(), score.combo, nitroFuel);

  renderer.render(scene, camera);
}

animate();
