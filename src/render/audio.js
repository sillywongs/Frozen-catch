// All sound is synthesized with the Web Audio API. No audio files, no network.
export class AudioFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  unlock() {
    if (this.ctx) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) this.ctx = new Ctx();
    } catch {
      this.ctx = null;
    }
  }

  setMuted(muted) {
    this.muted = muted;
  }

  tone(frequency, duration, type = 'sine', gain = 0.07, slideTo = null, when = 0) {
    if (this.muted || !this.ctx) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const start = ctx.currentTime + when;
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), start + duration);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(amp).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  slide() {
    this.tone(720, 0.22, 'sine', 0.05, 210);
  }

  splash() {
    if (this.muted || !this.ctx) return;
    const ctx = this.ctx;
    const length = Math.floor(ctx.sampleRate * 0.18);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
    }
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const amp = ctx.createGain();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    amp.gain.value = 0.09;
    source.buffer = buffer;
    source.connect(filter).connect(amp).connect(ctx.destination);
    source.start();
  }

  chime() {
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      this.tone(frequency, 0.35, 'sine', 0.06, null, index * 0.12);
    });
  }

  lose() {
    this.tone(220, 0.3, 'triangle', 0.06, 110);
    this.tone(160, 0.4, 'triangle', 0.05, 80, 0.18);
  }
}
