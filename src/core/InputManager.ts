export class InputManager {
  keys: Record<string, boolean> = {};
  private touchSteerX = 0;
  private touchAccel = false;
  private touchNitro = false;

  constructor() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.setupTouch();
  }

  private setupTouch(): void {
    if (!('ontouchstart' in window)) return;

    // Create touch zones
    const container = document.createElement('div');
    container.id = 'touch-controls';
    container.style.cssText = `
      position: fixed; bottom: 0; left: 0; width: 100%; height: 40%;
      pointer-events: auto; z-index: 15; display: flex; justify-content: space-between;
    `;

    // Left zone (steering)
    const steerZone = document.createElement('div');
    steerZone.style.cssText = `width: 50%; height: 100%; opacity: 0.1; background: linear-gradient(90deg, #ff0 0%, transparent 50%, #0ff 100%);`;

    // Right zone (nitro button)
    const nitroBtn = document.createElement('div');
    nitroBtn.style.cssText = `
      width: 80px; height: 80px; border-radius: 50%; background: rgba(0,170,255,0.3);
      border: 2px solid #00aaff; position: absolute; bottom: 20px; right: 20px;
      display: flex; align-items: center; justify-content: center;
      color: #00aaff; font-family: monospace; font-size: 12px;
    `;
    nitroBtn.textContent = 'NITRO';

    container.appendChild(steerZone);
    container.appendChild(nitroBtn);
    document.body.appendChild(container);

    // Auto-accelerate on mobile
    this.touchAccel = true;

    // Steer by touch position on left half
    steerZone.addEventListener('touchstart', (e) => this.handleSteerTouch(e, steerZone), { passive: true });
    steerZone.addEventListener('touchmove', (e) => this.handleSteerTouch(e, steerZone), { passive: true });
    steerZone.addEventListener('touchend', () => { this.touchSteerX = 0; }, { passive: true });

    // Nitro
    nitroBtn.addEventListener('touchstart', () => { this.touchNitro = true; }, { passive: true });
    nitroBtn.addEventListener('touchend', () => { this.touchNitro = false; }, { passive: true });
  }

  private handleSteerTouch(e: TouchEvent, zone: HTMLElement): void {
    const touch = e.touches[0];
    if (!touch) return;
    const rect = zone.getBoundingClientRect();
    const relX = (touch.clientX - rect.left) / rect.width;
    this.touchSteerX = (relX - 0.5) * 2; // -1 to 1
  }

  isDown(code: string): boolean {
    return !!this.keys[code];
  }

  get forward(): boolean {
    return this.touchAccel || this.isDown('KeyW') || this.isDown('ArrowUp');
  }

  get backward(): boolean {
    return this.isDown('KeyS') || this.isDown('ArrowDown');
  }

  get left(): boolean {
    return this.touchSteerX < -0.2 || this.isDown('KeyA') || this.isDown('ArrowLeft');
  }

  get right(): boolean {
    return this.touchSteerX > 0.2 || this.isDown('KeyD') || this.isDown('ArrowRight');
  }

  get nitro(): boolean {
    return this.touchNitro || this.isDown('Space');
  }
}
