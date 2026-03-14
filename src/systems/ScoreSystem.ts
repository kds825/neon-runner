export class ScoreSystem {
  score = 0;
  combo = 1;
  maxCombo = 1;
  private comboTimer = 0;
  private comboDuration = 2;
  private lastZ = 0;

  reset(): void {
    this.score = 0;
    this.combo = 1;
    this.maxCombo = 1;
    this.comboTimer = 0;
    this.lastZ = 0;
  }

  update(dt: number, playerZ: number): void {
    // Distance-based score
    const traveled = Math.abs(playerZ - this.lastZ);
    if (traveled > 0.1) {
      this.score += traveled * this.combo;
      this.lastZ = playerZ;
    }

    // Combo decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1;
      }
    }
  }

  addDodge(): void {
    this.combo = Math.min(this.combo + 1, 10);
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.comboTimer = this.comboDuration;
  }

  getScore(): number {
    return Math.floor(this.score);
  }
}
