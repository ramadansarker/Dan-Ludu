class SoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;
  private musicEnabled = false;
  private vibrationEnabled = true;
  private musicTimer: number | null = null;
  private noteIndex = 0;

  private getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public configure(opts: { sound?: boolean; music?: boolean; vibration?: boolean }) {
    if (typeof opts.sound === 'boolean') this.soundEnabled = opts.sound;
    if (typeof opts.vibration === 'boolean') this.vibrationEnabled = opts.vibration;
    if (typeof opts.music === 'boolean') {
      const changed = this.musicEnabled !== opts.music;
      this.musicEnabled = opts.music;
      if (changed) {
        if (this.musicEnabled) this.startMusicLoop();
        else this.stopMusicLoop();
      }
    }
  }

  public vibrate(pattern: number | number[] = 20) {
    if (!this.vibrationEnabled) return;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore on unsupported browsers
      }
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.12,
    delay = 0
  ) {
    if (!this.soundEnabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playClick() {
    this.playTone(620, 0.06, 'triangle', 0.09);
  }

  public playDiceRoll() {
    if (!this.soundEnabled) return;
    [320, 440, 380, 520, 460].forEach((f, idx) => {
      this.playTone(f, 0.055, 'triangle', 0.08, idx * 0.055);
    });
    this.vibrate(25);
  }

  public playTokenHop() {
    this.playTone(540, 0.08, 'sine', 0.11);
    this.playTone(720, 0.07, 'sine', 0.08, 0.045);
  }

  public playCapture() {
    this.playTone(480, 0.1, 'sawtooth', 0.1);
    this.playTone(300, 0.16, 'sawtooth', 0.12, 0.08);
    this.vibrate([40, 30, 60]);
  }

  public playSafeChime() {
    this.playTone(587.33, 0.12, 'sine', 0.1);
    this.playTone(880, 0.16, 'sine', 0.1, 0.09);
  }

  public playHomeFanfare() {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      this.playTone(freq, 0.16, 'triangle', 0.12, i * 0.08);
    });
    this.vibrate([30, 20, 50]);
  }

  public playWinFanfare() {
    const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    melody.forEach((freq, i) => {
      this.playTone(freq, 0.22, 'triangle', 0.14, i * 0.11);
    });
    this.vibrate([60, 40, 90]);
  }

  private startMusicLoop() {
    if (this.musicTimer !== null) return;
    const scale = [261.63, 329.63, 392.0, 493.88, 392.0, 329.63, 293.66, 349.23];
    const playStep = () => {
      if (!this.musicEnabled) return;
      const ctx = this.getCtx();
      if (ctx) {
        const freq = scale[this.noteIndex % scale.length];
        this.noteIndex++;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.035, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.62);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.65);
      }
    };
    playStep();
    this.musicTimer = window.setInterval(playStep, 680);
  }

  private stopMusicLoop() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundEngine = new SoundEngine();
