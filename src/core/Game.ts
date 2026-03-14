import * as THREE from 'three';

export class FirstPersonCamera {
  private camera: THREE.PerspectiveCamera;
  private offset = new THREE.Vector3(0, 1.1, 0.3);
  private baseFOV = 75;
  private maxFOV = 95;
  private currentRoll = 0;
  private rollAlpha = 0.08;
  private fovAlpha = 0.05;

  // Reusable objects
  private _pos = new THREE.Vector3();
  private _quat = new THREE.Quaternion();
  private _euler = new THREE.Euler();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  update(
    carPosition: THREE.Vector3,
    carQuaternion: THREE.Quaternion,
    steerInput: number,
    speed: number,
    maxSpeed: number
  ): void {
    // Position: attach to car with offset
    this._pos.copy(this.offset);
    this._pos.applyQuaternion(carQuaternion);
    this._pos.add(carPosition);
    this.camera.position.copy(this._pos);

    // Rotation: match car orientation
    this.camera.quaternion.copy(carQuaternion);

    // Roll tilting on steer
    const targetRoll = steerInput * 0.05;
    this.currentRoll += (targetRoll - this.currentRoll) * this.rollAlpha;
    this._euler.setFromQuaternion(this.camera.quaternion);
    this._euler.z += this.currentRoll;
    this.camera.quaternion.setFromEuler(this._euler);

    // Speed-based FOV
    const speedRatio = Math.min(speed / maxSpeed, 1);
    const targetFOV = this.baseFOV + (this.maxFOV - this.baseFOV) * speedRatio;
    this.camera.fov += (targetFOV - this.camera.fov) * this.fovAlpha;
    this.camera.updateProjectionMatrix();
  }
}
