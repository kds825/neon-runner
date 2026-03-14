export class HUD {
  private container: HTMLDivElement;
  private hpBar: HTMLDivElement;
  private hpFill: HTMLDivElement;
  private speedEl: HTMLDivElement;
  private scoreEl: HTMLDivElement;
  private comboEl: HTMLDivElement;
  private nitroBar: HTMLDivElement;
  private nitroFill: HTMLDivElement;
  private flashOverlay: HTMLDivElement;
  private gameOverScreen: HTMLDivElement;
  private finalScoreEl: HTMLDivElement;

  private flashAlpha = 0;

  constructor() {
    // Container
    this.container = document.createElement('div');
    this.container.id = 'hud';
    this.container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; font-family: 'Courier New', monospace; z-index: 10;
    `;
    document.body.appendChild(this.container);

    // HP bar
    this.hpBar = this.createBar('top: 20px; left: 20px; width: 200px;', '#00ff88');
    this.hpFill = this.hpBar.querySelector('.fill') as HTMLDivElement;

    // Nitro bar
    this.nitroBar = this.createBar('top: 50px; left: 20px; width: 200px;', '#00aaff');
    this.nitroFill = this.nitroBar.querySelector('.fill') as HTMLDivElement;

    // Speed
    this.speedEl = document.createElement('div');
    this.speedEl.style.cssText = `
      position: absolute; bottom: 30px; right: 30px;
      color: #00ffff; font-size: 32px; text-shadow: 0 0 10px #00ffff;
    `;
    this.container.appendChild(this.speedEl);

    // Score
    this.scoreEl = document.createElement('div');
    this.scoreEl.style.cssText = `
      position: absolute; top: 20px; right: 20px;
      color: #ffff00; font-size: 24px; text-shadow: 0 0 10px #ffff00;
    `;
    this.container.appendChild(this.scoreEl);

    // Combo
    this.comboEl = document.createElement('div');
    this.comboEl.style.cssText = `
      position: absolute; top: 50px; right: 20px;
      color: #ff00ff; font-size: 20px; text-shadow: 0 0 10px #ff00ff;
      transition: transform 0.1s;
    `;
    this.container.appendChild(this.comboEl);

    // Red flash overlay
    this.flashOverlay = document.createElement('div');
    this.flashOverlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: red; opacity: 0; pointer-events: none; z-index: 9;
    `;
    document.body.appendChild(this.flashOverlay);

    // Game over screen
    this.gameOverScreen = document.createElement('div');
    this.gameOverScreen.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.85); display: none; z-index: 20;
      flex-direction: column; align-items: center; justify-content: center;
      font-family: 'Courier New', monospace; color: #ff0055;
    `;
    this.gameOverScreen.innerHTML = `
      <div style="font-size: 64px; text-shadow: 0 0 30px #ff0055; margin-bottom: 20px;">GAME OVER</div>
      <div id="final-score" style="font-size: 32px; color: #00ffff; margin-bottom: 30px;"></div>
      <div style="font-size: 20px; color: #888; pointer-events: auto; cursor: pointer;" id="restart-btn">
        [ PRESS ENTER TO RESTART ]
      </div>
    `;
    document.body.appendChild(this.gameOverScreen);
    this.finalScoreEl = this.gameOverScreen.querySelector('#final-score') as HTMLDivElement;
  }

  private createBar(posStyle: string, color: string): HTMLDivElement {
    const bar = document.createElement('div');
    bar.style.cssText = `
      position: absolute; ${posStyle} height: 16px;
      background: rgba(255,255,255,0.1); border: 1px solid ${color};
      border-radius: 3px; overflow: hidden;
    `;
    const fill = document.createElement('div');
    fill.className = 'fill';
    fill.style.cssText = `
      width: 100%; height: 100%; background: ${color};
      transition: width 0.2s; box-shadow: 0 0 8px ${color};
    `;
    bar.appendChild(fill);
    this.container.appendChild(bar);
    return bar;
  }

  update(hp: number, maxHp: number, speed: number, score: number, combo: number, nitro: number): void {
    this.hpFill.style.width = `${(hp / maxHp) * 100}%`;
    if (hp / maxHp < 0.3) {
      this.hpFill.style.background = '#ff3333';
    } else {
      this.hpFill.style.background = '#00ff88';
    }

    this.speedEl.textContent = `${Math.floor(speed * 3.6)} km/h`;
    this.scoreEl.textContent = `SCORE: ${score}`;

    if (combo > 1) {
      this.comboEl.textContent = `x${combo} COMBO`;
      this.comboEl.style.display = 'block';
    } else {
      this.comboEl.style.display = 'none';
    }

    this.nitroFill.style.width = `${nitro * 100}%`;

    // Flash decay
    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - 0.03);
      this.flashOverlay.style.opacity = String(this.flashAlpha);
    }
  }

  flash(): void {
    this.flashAlpha = 0.6;
    this.flashOverlay.style.opacity = '0.6';
  }

  showGameOver(score: number): void {
    this.gameOverScreen.style.display = 'flex';
    this.finalScoreEl.textContent = `FINAL SCORE: ${score}`;
  }

  hideGameOver(): void {
    this.gameOverScreen.style.display = 'none';
  }

  onRestart(cb: () => void): void {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Enter') {
        cb();
      }
    };
    window.addEventListener('keydown', handler);
    const btn = this.gameOverScreen.querySelector('#restart-btn');
    if (btn) {
      (btn as HTMLElement).addEventListener('click', cb);
    }
  }
}
