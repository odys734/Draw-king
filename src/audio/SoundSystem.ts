class SoundSystem {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  // Drawing noise node reference
  private drawNoiseNode: AudioBufferSourceNode | null = null;
  private drawGainNode: GainNode | null = null;

  // Ball rolling sound node reference
  private rollOsc: OscillatorNode | null = null;
  private rollGain: GainNode | null = null;

  constructor() {
    // Lazy init audio context on user gesture
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (!enabled) {
      this.stopDrawingSound();
      this.stopRollingSound();
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  // --- DRAWING SOUND ---
  public startDrawingSound() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    if (this.drawNoiseNode) return; // already playing

    const bufferSize = this.ctx.sampleRate * 1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    this.drawNoiseNode = noise;
    this.drawGainNode = gain;
  }

  public stopDrawingSound() {
    if (this.drawNoiseNode && this.ctx) {
      try {
        if (this.drawGainNode) {
          this.drawGainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        }
        setTimeout(() => {
          this.drawNoiseNode?.stop();
          this.drawNoiseNode?.disconnect();
          this.drawNoiseNode = null;
          this.drawGainNode = null;
        }, 60);
      } catch {
        this.drawNoiseNode = null;
        this.drawGainNode = null;
      }
    }
  }

  // --- ROLLING SOUND ---
  public updateRollingSound(speed: number, isGrounded: boolean) {
    if (!this.soundEnabled || speed < 0.2 || !isGrounded) {
      this.stopRollingSound();
      return;
    }
    this.initCtx();
    if (!this.ctx) return;

    if (!this.rollOsc) {
      this.rollOsc = this.ctx.createOscillator();
      this.rollGain = this.ctx.createGain();

      this.rollOsc.type = 'triangle';
      this.rollOsc.frequency.setValueAtTime(80, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, this.ctx.currentTime);

      this.rollGain.gain.setValueAtTime(0.01, this.ctx.currentTime);

      this.rollOsc.connect(filter);
      filter.connect(this.rollGain);
      this.rollGain.connect(this.ctx.destination);

      this.rollOsc.start();
    }

    if (this.rollOsc && this.rollGain) {
      const targetFreq = Math.min(220, 60 + speed * 15);
      const targetVol = Math.min(0.06, speed * 0.008);
      this.rollOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
      this.rollGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.1);
    }
  }

  public stopRollingSound() {
    if (this.rollOsc && this.ctx) {
      try {
        if (this.rollGain) {
          this.rollGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        }
        setTimeout(() => {
          this.rollOsc?.stop();
          this.rollOsc?.disconnect();
          this.rollOsc = null;
          this.rollGain = null;
        }, 60);
      } catch {
        this.rollOsc = null;
        this.rollGain = null;
      }
    }
  }

  // --- SFX: BOUNCE ---
  public playBounceSound(intensity: number) {
    if (!this.soundEnabled || intensity < 0.5) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = 120 + Math.min(200, intensity * 20);
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.08);

    const volume = Math.min(0.15, 0.02 + intensity * 0.015);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  // --- SFX: GLASS CHIME (BALL SETTLES IN GLASS) ---
  public playGlassDing() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const freqs = [1046.5, 1318.5, 1567.98]; // C6, E6, G6
    freqs.forEach((f, index) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime + index * 0.05);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime + index * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + index * 0.05 + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + index * 0.05);
      osc.stop(this.ctx.currentTime + index * 0.05 + 0.45);
    });
  }

  // --- SFX: LEVEL WIN FANFARE ---
  public playWinSound() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, this.ctx.currentTime + i * 0.08);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.08 + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + i * 0.08);
      osc.stop(this.ctx.currentTime + i * 0.08 + 0.55);
    });
  }

  // --- SFX: HAZARD / LOSE ---
  public playLoseSound() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  // --- SFX: PORTAL TELEPORT ---
  public playPortalWhoosh() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.32);
  }

  // --- SFX: BREAKABLE WALL SHATTER ---
  public playShatterSound() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    noise.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }
}

export const soundManager = new SoundSystem();
