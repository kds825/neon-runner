export class InputManager {
  keys: Record<string, boolean> = {};

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  isDown(code: string): boolean {
    return !!this.keys[code];
  }

  get forward(): boolean {
    return this.isDown('KeyW') || this.isDown('ArrowUp');
  }

  get backward(): boolean {
    return this.isDown('KeyS') || this.isDown('ArrowDown');
  }

  get left(): boolean {
    return this.isDown('KeyA') || this.isDown('ArrowLeft');
  }

  get right(): boolean {
    return this.isDown('KeyD') || this.isDown('ArrowRight');
  }

  get nitro(): boolean {
    return this.isDown('Space');
  }
}
