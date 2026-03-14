import * as THREE from 'three';
import { Physics } from '../core/Physics';
import { TrafficCar } from '../entities/TrafficCar';

const POOL_SIZE = 12;
const SPAWN_DISTANCE = 180;
const DESPAWN_DISTANCE = 30;
const LANES = [-5, -2.5, 0, 2.5, 5];

export class SpawnManager {
  private pool: TrafficCar[] = [];
  private spawnTimer = 0;
  private spawnInterval = 1.2;
  private minInterval = 0.4;

  constructor(scene: THREE.Scene, physics: Physics) {
    for (let i = 0; i < POOL_SIZE; i++) {
      this.pool.push(new TrafficCar(scene, physics));
    }
  }

  update(dt: number, playerZ: number, playerSpeed: number): void {
    this.spawnTimer += dt;

    // Increase difficulty over time
    const difficulty = Math.min(playerSpeed / 60, 1);
    const interval = this.spawnInterval - difficulty * (this.spawnInterval - this.minInterval);

    if (this.spawnTimer >= interval) {
      this.spawnTimer = 0;
      this.spawnCar(playerZ, playerSpeed);
    }

    // Update & despawn
    for (const car of this.pool) {
      if (!car.active) continue;
      car.update(dt);
      // Despawn if behind player
      if (car.body.position.z > playerZ + DESPAWN_DISTANCE) {
        car.deactivate();
      }
    }
  }

  private spawnCar(playerZ: number, playerSpeed: number): void {
    const car = this.pool.find((c) => !c.active);
    if (!car) return;

    const lane = LANES[Math.floor(Math.random() * LANES.length)];
    const z = playerZ - SPAWN_DISTANCE;
    const trafficSpeed = 10 + Math.random() * Math.max(playerSpeed * 0.6, 15);
    car.activate(lane, z, trafficSpeed);
  }

  getActiveCars(): TrafficCar[] {
    return this.pool.filter((c) => c.active);
  }
}
