import * as CANNON from 'cannon-es';

export class Physics {
  world: CANNON.World;
  private fixedTimeStep = 1 / 60;
  private maxSubSteps = 3;

  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.defaultContactMaterial.friction = 0.3;
    this.world.defaultContactMaterial.restitution = 0.2;
  }

  update(dt: number): void {
    this.world.step(this.fixedTimeStep, dt, this.maxSubSteps);
  }

  addBody(body: CANNON.Body): void {
    this.world.addBody(body);
  }

  removeBody(body: CANNON.Body): void {
    this.world.removeBody(body);
  }
}
