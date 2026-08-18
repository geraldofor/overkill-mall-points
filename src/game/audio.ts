// ============================================================================
// OVERKILL MALL — Audio System v2
// Spatial audio with Web Audio API — procedural sound generation
// ============================================================================

import { AudioEvent, Vec2 } from "./types";

class AudioSystem {
  private ctx: AudioContext | null = null;
  private listenerPos: Vec2 = { x: 0, y: 0 };
  private masterGain: GainNode | null = null;
  private enabled = true;
  private initialized = false;

  /** Must be called from a user gesture (click/tap) */
  init(): void {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.4;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch {
      this.enabled = false;
    }
  }

  setListenerPos(pos: Vec2): void {
    this.listenerPos = pos;
  }

  setVolume(v: number): void {
    if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, v));
  }

  play(event: AudioEvent): void {
    if (!this.enabled || !this.ctx || !this.masterGain) return;

    // Resume if suspended (autoplay policy)
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    // Spatial volume — louder when closer
    let volume = 0.5;
    if ("x" in event && "y" in event) {
      const dist = Math.sqrt(
        (event.x - this.listenerPos.x) ** 2 +
        (event.y - this.listenerPos.y) ** 2,
      );
      volume = Math.max(0, 1 - dist / 800);
    }

    switch (event.type) {
      case "shoot":
        this.playShoot(event.weapon, volume);
        break;
      case "hit":
        this.playHit(volume, event.isHeadshot);
        break;
      case "kill":
        this.playKill(volume);
        break;
      case "step":
        this.playStep(volume);
        break;
      case "pickup":
        this.playPickup(volume);
        break;
      case "reload":
        this.playReload(volume);
        break;
      case "gloo_place":
        this.playGlooPlace(volume);
        break;
      case "heal":
        this.playHeal(volume);
        break;
      case "zone_warning":
        this.playZoneWarning();
        break;
    }
  }

  private playShoot(weapon: string, vol: number): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const noise = this.createNoise(0.08);
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = "lowpass";

    switch (weapon) {
      case "sniper":
        filter.frequency.value = 800;
        gain.gain.setValueAtTime(vol * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        break;
      case "shotgun":
        filter.frequency.value = 1200;
        gain.gain.setValueAtTime(vol * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        break;
      case "smg":
        filter.frequency.value = 2500;
        gain.gain.setValueAtTime(vol * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        break;
      case "rifle":
        filter.frequency.value = 1800;
        gain.gain.setValueAtTime(vol * 0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        break;
      default: // pistol
        filter.frequency.value = 2000;
        gain.gain.setValueAtTime(vol * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    }

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.3);
  }

  private playHit(vol: number, isHeadshot: boolean): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(isHeadshot ? 900 : 500, now);
    osc.frequency.exponentialRampToValueAtTime(isHeadshot ? 200 : 150, now + 0.1);

    gain.gain.setValueAtTime(vol * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  private playKill(vol: number): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Descending tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);
    gain.gain.setValueAtTime(vol * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  private playStep(vol: number): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const noise = this.createNoise(0.04);
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 3000;

    gain.gain.setValueAtTime(vol * 0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.06);
  }

  private playPickup(vol: number): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.1);
    gain.gain.setValueAtTime(vol * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  private playReload(vol: number): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Mechanical click
    const noise = this.createNoise(0.03);
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2000;
    filter.Q.value = 2;

    gain.gain.setValueAtTime(vol * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
    noise.stop(now + 0.08);
  }

  private playGlooPlace(vol: number): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Ice-like crystallization
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
    gain.gain.setValueAtTime(vol * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  private playHeal(vol: number): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.3);
    gain.gain.setValueAtTime(vol * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  private playZoneWarning(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Urgent beeping
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.15 + 0.02);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.15 + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.12);
    }
  }

  private createNoise(duration: number): AudioBufferSourceNode {
    if (!this.ctx) throw new Error("no ctx");
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }
}

// Singleton
export const audio = new AudioSystem();
