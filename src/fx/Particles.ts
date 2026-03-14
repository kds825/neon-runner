import * as THREE from 'three';

const SPEED_LINE_COUNT = 200;
const EXPLOSION_COUNT = 50;

// Speed lines vertex shader
const speedLineVS = `
  attribute float size;
  attribute float alpha;
  varying float vAlpha;
  void main() {
    vAlpha = alpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const speedLineFS = `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    gl_FragColor = vec4(0.0, 1.0, 1.0, vAlpha * (1.0 - d * 2.0));
  }
`;

// Explosion fragment shader
const explosionFS = `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    gl_FragColor = vec4(1.0, 0.3, 0.0, vAlpha * (1.0 - d * 2.0));
  }
`;

export class SpeedLines {
  private points: THREE.Points;
  private positions: Float32Array;
  private sizes: Float32Array;
  private alphas: Float32Array;
  private velocities: Float32Array;

  constructor(scene: THREE.Scene) {
    const geo = new THREE.BufferGeometry();
    this.positions = new Float32Array(SPEED_LINE_COUNT * 3);
    this.sizes = new Float32Array(SPEED_LINE_COUNT);
    this.alphas = new Float32Array(SPEED_LINE_COUNT);
    this.velocities = new Float32Array(SPEED_LINE_COUNT * 3);

    for (let i = 0; i < SPEED_LINE_COUNT; i++) {
      this.resetParticle(i);
    }

    geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));
    geo.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: speedLineVS,
      fragmentShader: speedLineFS,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geo, mat);
    scene.add(this.points);
  }

  private resetParticle(i: number): void {
    const i3 = i * 3;
    this.positions[i3] = (Math.random() - 0.5) * 12;
    this.positions[i3 + 1] = Math.random() * 3 + 0.5;
    this.positions[i3 + 2] = -(Math.random() * 30 + 5);
    this.sizes[i] = Math.random() * 2 + 1;
    this.alphas[i] = Math.random() * 0.5 + 0.3;
    this.velocities[i3] = 0;
    this.velocities[i3 + 1] = 0;
    this.velocities[i3 + 2] = 20 + Math.random() * 30;
  }

  update(playerZ: number, playerX: number, speed: number): void {
    const speedFactor = Math.min(speed / 40, 1);
    const geo = this.points.geometry;

    for (let i = 0; i < SPEED_LINE_COUNT; i++) {
      const i3 = i * 3;
      this.positions[i3 + 2] += this.velocities[i3 + 2] * 0.016 * speedFactor;

      if (this.positions[i3 + 2] > 10) {
        this.resetParticle(i);
        this.positions[i3] += playerX;
        this.positions[i3 + 2] += playerZ;
      }
    }

    // Move system with player
    this.points.position.set(0, 0, playerZ);

    (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (geo.attributes.alpha as THREE.BufferAttribute).needsUpdate = true;
  }

  setVisible(v: boolean): void {
    this.points.visible = v;
  }
}

export class ExplosionPool {
  private particles: THREE.Points[] = [];
  private allPositions: Float32Array[] = [];
  private allAlphas: Float32Array[] = [];
  private allVelocities: Float32Array[] = [];
  private activeTimers: number[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Pre-allocate 3 explosion sets
    for (let e = 0; e < 3; e++) {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(EXPLOSION_COUNT * 3);
      const alphas = new Float32Array(EXPLOSION_COUNT);
      const sizes = new Float32Array(EXPLOSION_COUNT);
      const vels = new Float32Array(EXPLOSION_COUNT * 3);

      for (let i = 0; i < EXPLOSION_COUNT; i++) {
        sizes[i] = Math.random() * 3 + 2;
      }

      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

      const mat = new THREE.ShaderMaterial({
        vertexShader: speedLineVS,
        fragmentShader: explosionFS,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geo, mat);
      points.visible = false;
      scene.add(points);

      this.particles.push(points);
      this.allPositions.push(pos);
      this.allAlphas.push(alphas);
      this.allVelocities.push(vels);
      this.activeTimers.push(0);
    }
  }

  emit(x: number, y: number, z: number): void {
    // Find inactive slot
    let idx = -1;
    for (let i = 0; i < this.activeTimers.length; i++) {
      if (this.activeTimers[i] <= 0) {
        idx = i;
        break;
      }
    }
    if (idx === -1) idx = 0; // reuse oldest

    const pos = this.allPositions[idx];
    const alphas = this.allAlphas[idx];
    const vels = this.allVelocities[idx];

    for (let i = 0; i < EXPLOSION_COUNT; i++) {
      const i3 = i * 3;
      pos[i3] = x;
      pos[i3 + 1] = y;
      pos[i3 + 2] = z;
      alphas[i] = 1;
      vels[i3] = (Math.random() - 0.5) * 20;
      vels[i3 + 1] = Math.random() * 15;
      vels[i3 + 2] = (Math.random() - 0.5) * 20;
    }

    this.activeTimers[idx] = 1.0;
    this.particles[idx].visible = true;
    (this.particles[idx].geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.particles[idx].geometry.attributes.alpha as THREE.BufferAttribute).needsUpdate = true;
  }

  update(dt: number): void {
    for (let e = 0; e < this.activeTimers.length; e++) {
      if (this.activeTimers[e] <= 0) continue;

      this.activeTimers[e] -= dt;
      const pos = this.allPositions[e];
      const alphas = this.allAlphas[e];
      const vels = this.allVelocities[e];

      for (let i = 0; i < EXPLOSION_COUNT; i++) {
        const i3 = i * 3;
        pos[i3] += vels[i3] * dt;
        pos[i3 + 1] += vels[i3 + 1] * dt;
        pos[i3 + 2] += vels[i3 + 2] * dt;
        vels[i3 + 1] -= 9.8 * dt; // gravity
        alphas[i] = Math.max(0, this.activeTimers[e]);
      }

      (this.particles[e].geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.particles[e].geometry.attributes.alpha as THREE.BufferAttribute).needsUpdate = true;

      if (this.activeTimers[e] <= 0) {
        this.particles[e].visible = false;
      }
    }
  }
}
