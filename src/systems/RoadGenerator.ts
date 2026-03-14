import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Physics } from '../core/Physics';

const CHUNK_LENGTH = 200;
const ROAD_WIDTH = 16;
const POOL_SIZE = 6;

interface RoadChunk {
  mesh: THREE.Group;
  body: CANNON.Body;
  zStart: number;
  active: boolean;
}

export class RoadGenerator {
  private chunks: RoadChunk[] = [];
  private scene: THREE.Scene;
  private physics: Physics;
  private lastZ = 0;

  // Shared materials (created once)
  private roadMat: THREE.MeshStandardMaterial;
  private lineMat: THREE.MeshStandardMaterial;
  private edgeMat: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene, physics: Physics) {
    this.scene = scene;
    this.physics = physics;

    this.roadMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.9,
      metalness: 0.1,
    });
    this.lineMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00aaaa,
      emissiveIntensity: 0.5,
    });
    this.edgeMat = new THREE.MeshStandardMaterial({
      color: 0xff00ff,
      emissive: 0xaa00aa,
      emissiveIntensity: 0.8,
    });

    // Pre-create pool
    for (let i = 0; i < POOL_SIZE; i++) {
      this.chunks.push(this.createChunk());
    }

    // Activate initial chunks
    for (let i = 0; i < POOL_SIZE; i++) {
      this.activateChunk(this.chunks[i], -CHUNK_LENGTH * 2 + i * CHUNK_LENGTH);
    }
  }

  private createChunk(): RoadChunk {
    const group = new THREE.Group();

    // Road surface
    const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, CHUNK_LENGTH);
    const roadMesh = new THREE.Mesh(roadGeo, this.roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.y = 0.01;
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    // Center dashed lines
    const lineGeo = new THREE.PlaneGeometry(0.1, 4);
    for (let z = -CHUNK_LENGTH / 2; z < CHUNK_LENGTH / 2; z += 8) {
      const line = new THREE.Mesh(lineGeo, this.lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.02, z);
      group.add(line);
    }

    // Edge lines (neon strips)
    const edgeGeo = new THREE.PlaneGeometry(0.15, CHUNK_LENGTH);
    const leftEdge = new THREE.Mesh(edgeGeo, this.edgeMat);
    leftEdge.rotation.x = -Math.PI / 2;
    leftEdge.position.set(-ROAD_WIDTH / 2, 0.02, 0);
    group.add(leftEdge);

    const rightEdge = new THREE.Mesh(edgeGeo, this.edgeMat);
    rightEdge.rotation.x = -Math.PI / 2;
    rightEdge.position.set(ROAD_WIDTH / 2, 0.02, 0);
    group.add(rightEdge);

    group.visible = false;
    this.scene.add(group);

    // Physics body (static plane for the chunk)
    const body = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Box(new CANNON.Vec3(ROAD_WIDTH / 2, 0.1, CHUNK_LENGTH / 2)),
    });
    body.position.set(0, -0.1, 0);

    return { mesh: group, body, zStart: 0, active: false };
  }

  private activateChunk(chunk: RoadChunk, z: number): void {
    chunk.zStart = z;
    chunk.mesh.position.z = z;
    chunk.mesh.visible = true;
    chunk.active = true;
    chunk.body.position.set(0, -0.1, z);
    this.physics.addBody(chunk.body);
    this.lastZ = Math.min(this.lastZ, z - CHUNK_LENGTH);
  }

  private deactivateChunk(chunk: RoadChunk): void {
    chunk.mesh.visible = false;
    chunk.active = false;
    this.physics.removeBody(chunk.body);
  }

  update(playerZ: number): void {
    // Check if we need more road ahead
    const frontEdge = playerZ - CHUNK_LENGTH * 3;

    for (const chunk of this.chunks) {
      // Recycle chunks that are far behind
      if (chunk.active && chunk.zStart > playerZ + CHUNK_LENGTH) {
        this.deactivateChunk(chunk);
      }
    }

    // Spawn new chunks ahead
    while (this.lastZ > frontEdge) {
      const inactive = this.chunks.find((c) => !c.active);
      if (inactive) {
        this.activateChunk(inactive, this.lastZ);
      } else {
        break;
      }
    }
  }
}
