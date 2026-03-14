import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Physics } from '../core/Physics';
import { InputManager } from '../core/InputManager';

export class PlayerCar {
  mesh: THREE.Group;
  body: CANNON.Body;

  private engineForce = 800;
  private brakeForce = 300;
  private maxSteer = 0.04;
  private maxSpeed = 80;
  private friction = 0.98;

  // Reusable vectors (no GC in loop)
  private _forwardVec = new CANNON.Vec3();
  private _steerVec = new CANNON.Vec3();

  constructor(scene: THREE.Scene, physics: Physics) {
    // --- Visual ---
    this.mesh = new THREE.Group();

    // Car body
    const bodyGeo = new THREE.BoxGeometry(1.8, 0.6, 4.2);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x003333,
      metalness: 0.8,
      roughness: 0.2,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.3;
    bodyMesh.castShadow = true;
    this.mesh.add(bodyMesh);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.4, 0.5, 1.8);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0x001a1a,
      metalness: 0.9,
      roughness: 0.1,
    });
    const cabinMesh = new THREE.Mesh(cabinGeo, cabinMat);
    cabinMesh.position.set(0, 0.8, -0.3);
    cabinMesh.castShadow = true;
    this.mesh.add(cabinMesh);

    // Headlights
    const headlightGeo = new THREE.BoxGeometry(0.3, 0.15, 0.1);
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffaa,
      emissiveIntensity: 2,
    });
    const hlLeft = new THREE.Mesh(headlightGeo, headlightMat);
    hlLeft.position.set(-0.6, 0.3, -2.1);
    this.mesh.add(hlLeft);
    const hlRight = new THREE.Mesh(headlightGeo, headlightMat);
    hlRight.position.set(0.6, 0.3, -2.1);
    this.mesh.add(hlRight);

    // Tail lights
    const tailMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 1.5,
    });
    const tlLeft = new THREE.Mesh(headlightGeo, tailMat);
    tlLeft.position.set(-0.6, 0.3, 2.1);
    this.mesh.add(tlLeft);
    const tlRight = new THREE.Mesh(headlightGeo, tailMat);
    tlRight.position.set(0.6, 0.3, 2.1);
    this.mesh.add(tlRight);

    scene.add(this.mesh);

    // --- Physics ---
    const shape = new CANNON.Box(new CANNON.Vec3(0.9, 0.5, 2.1));
    this.body = new CANNON.Body({
      mass: 1200,
      position: new CANNON.Vec3(0, 1, 0),
      linearDamping: 0.1,
      angularDamping: 0.99,
    });
    this.body.addShape(shape);
    physics.addBody(this.body);
  }

  update(input: InputManager, dt: number): void {
    const vel = this.body.velocity;
    const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);

    // Forward / backward
    if (input.forward && speed < this.maxSpeed) {
      this.body.quaternion.vmult(
        this._forwardVec.set(0, 0, -this.engineForce * dt),
        this._forwardVec
      );
      this.body.applyForce(this._forwardVec);
    }
    if (input.backward) {
      this.body.quaternion.vmult(
        this._forwardVec.set(0, 0, this.brakeForce * dt),
        this._forwardVec
      );
      this.body.applyForce(this._forwardVec);
    }

    // Steering (only when moving)
    if (speed > 1) {
      let steerAmount = 0;
      if (input.left) steerAmount = this.maxSteer;
      if (input.right) steerAmount = -this.maxSteer;
      if (steerAmount !== 0) {
        this.body.quaternion.vmult(
          this._steerVec.set(0, steerAmount * speed * 0.5, 0),
          this._steerVec
        );
        this.body.angularVelocity.set(
          this.body.angularVelocity.x,
          this._steerVec.y,
          this.body.angularVelocity.z
        );
      }
    }

    // Lateral friction
    vel.x *= this.friction;
    vel.z *= this.friction;

    // Sync visual
    this.mesh.position.set(
      this.body.position.x,
      this.body.position.y,
      this.body.position.z
    );
    this.mesh.quaternion.set(
      this.body.quaternion.x,
      this.body.quaternion.y,
      this.body.quaternion.z,
      this.body.quaternion.w
    );
  }

  get speed(): number {
    const v = this.body.velocity;
    return Math.sqrt(v.x * v.x + v.z * v.z);
  }

  get position(): CANNON.Vec3 {
    return this.body.position;
  }
}
