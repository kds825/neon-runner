import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Physics } from '../core/Physics';

const COLORS = [0xff0044, 0xffaa00, 0x44ff00, 0xff00ff, 0xffff00];

export class TrafficCar {
  mesh: THREE.Group;
  body: CANNON.Body;
  active = false;
  speed = 0;

  constructor(scene: THREE.Scene, physics: Physics) {
    this.mesh = new THREE.Group();

    const bodyGeo = new THREE.BoxGeometry(1.6, 0.6, 3.8);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.2,
      metalness: 0.6,
      roughness: 0.3,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.3;
    bodyMesh.castShadow = true;
    this.mesh.add(bodyMesh);

    const cabinGeo = new THREE.BoxGeometry(1.3, 0.45, 1.5);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.9,
      roughness: 0.1,
    });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 0.75, -0.2);
    this.mesh.add(cabin);

    // Tail lights
    const tailGeo = new THREE.BoxGeometry(0.25, 0.12, 0.08);
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 2,
    });
    const tl1 = new THREE.Mesh(tailGeo, tailMat);
    tl1.position.set(-0.55, 0.3, 1.9);
    this.mesh.add(tl1);
    const tl2 = new THREE.Mesh(tailGeo, tailMat);
    tl2.position.set(0.55, 0.3, 1.9);
    this.mesh.add(tl2);

    this.mesh.visible = false;
    scene.add(this.mesh);

    this.body = new CANNON.Body({
      mass: 0, // kinematic
      shape: new CANNON.Box(new CANNON.Vec3(0.8, 0.5, 1.9)),
      type: CANNON.Body.KINEMATIC,
    });
    this.body.collisionResponse = true;
    physics.addBody(this.body);
  }

  activate(x: number, z: number, speed: number): void {
    this.active = true;
    this.speed = speed;
    this.body.position.set(x, 0.5, z);
    this.body.velocity.set(0, 0, 0);
    this.mesh.visible = true;
  }

  deactivate(): void {
    this.active = false;
    this.mesh.visible = false;
    this.body.position.set(0, -100, 0);
  }

  update(dt: number): void {
    if (!this.active) return;
    // Move forward (same direction as player - negative Z)
    this.body.position.z -= this.speed * dt;

    this.mesh.position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
  }
}
