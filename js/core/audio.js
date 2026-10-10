/* ============================================================
 * js/core/audio.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import { clamp, rand } from "./util.js";

export class AudioFX {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.master = null;
    this.wind = null;
  }
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }
  setMuted(m) {
    this.enabled = !m;
    if (this.master) this.master.gain.value = m ? 0 : 1;
  }
  tone({
    f = 440,
    f2 = null,
    t = 0.15,
    type = "sine",
    g = 0.12,
    delay = 0,
  } = {}) {
    if (!this.ctx || !this.enabled) return;
    const c = this.ctx,
      n = c.currentTime + delay;
    const o = c.createOscillator(),
      v = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, n);
    if (f2)
      o.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), n + t);
    v.gain.setValueAtTime(0.0001, n);
    v.gain.exponentialRampToValueAtTime(g, n + 0.012);
    v.gain.exponentialRampToValueAtTime(0.0001, n + t);
    o.connect(v).connect(this.master);
    o.start(n);
    o.stop(n + t + 0.05);
  }
  noise({ t = 0.1, g = 0.08, fl = 800 } = {}) {
    if (!this.ctx || !this.enabled) return;
    const c = this.ctx,
      n = c.currentTime;
    const len = Math.max(1, (c.sampleRate * t) | 0),
      buf = c.createBuffer(1, len, c.sampleRate),
      d = buf.getChannelData(0);
    for (let i = 0; i < len; i++)
      d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource();
    s.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = fl;
    const v = c.createGain();
    v.gain.value = g;
    s.connect(f).connect(v).connect(this.master);
    s.start(n);
  }
  click() {
    this.tone({ f: 640, f2: 860, t: 0.07, type: "triangle", g: 0.06 });
  }
  whoosh() {
    this.noise({ t: 0.45, g: 0.1, fl: 900 });
    this.tone({ f: 220, f2: 520, t: 0.4, g: 0.06 });
  }
  jump() {
    this.tone({ f: 330, f2: 610, t: 0.16, g: 0.08 });
  }
  land() {
    this.tone({ f: 170, f2: 110, t: 0.06, type: "triangle", g: 0.05 });
  }
  step() {
    this.noise({ t: 0.05, g: 0.022, fl: 480 });
  }
  chime() {
    [880, 1108.7, 1318.5].forEach((f, i) =>
      this.tone({ f, t: 0.3, g: 0.09, delay: i * 0.09 }),
    );
  }
  fanfare() {
    [659.3, 784, 987.8, 1318.5, 1568].forEach((f, i) =>
      this.tone({ f, t: 0.4, g: 0.09, delay: i * 0.11 }),
    );
  }
  startWind() {
    if (this.wind || !this.ctx) return;
    const c = this.ctx,
      len = (c.sampleRate * 1.5) | 0,
      buf = c.createBuffer(1, len, c.sampleRate),
      d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 600;
    f.Q.value = 0.6;
    const g = c.createGain();
    g.gain.value = 0;
    src.connect(f).connect(g).connect(this.master);
    src.start();
    this.wind = { src, f, g };
  }
  setWind(v) {
    if (!this.wind) return;
    const k = clamp((v - 6) / 44, 0, 1);
    this.wind.g.gain.setTargetAtTime(k * 0.22, this.ctx.currentTime, 0.1);
    this.wind.f.frequency.setTargetAtTime(
      300 + v * 26,
      this.ctx.currentTime,
      0.1,
    );
  }
  stopWind() {
    if (!this.wind) return;
    const w = this.wind;
    this.wind = null;
    w.g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.15);
    setTimeout(() => {
      try {
        w.src.stop();
      } catch (e) {}
    }, 700);
  }
}
export const sfx = new AudioFX();
export class Pad {
  constructor() {
    this.nodes = [];
    this.key = "menu";
  }
  stop() {
    if (!this.nodes.length || !sfx.ctx) return;
    const now = sfx.ctx.currentTime;
    for (const n of this.nodes) {
      try {
        n.g.gain.cancelScheduledValues(now);
        n.g.gain.setTargetAtTime(0.0001, now, 0.35);
        n.o.stop(now + 1.5);
        if (n.lfo) n.lfo.stop(now + 1.5);
      } catch (e) {}
    }
    this.nodes = [];
  }
  start(key) {
    this.key = key;
    sfx.ensure();
    if (!sfx.ctx) return;
    this.stop();
    const c = sfx.ctx,
      now = c.currentTime;
    const CH = {
      menu: [196, 246.9, 293.7, 392],
      park: [261.6, 329.6, 392, 587.3],
      server: [110, 130.8, 164.8, 220],
      city: [174.6, 220, 261.6, 349.2],
      funfair: [261.6, 329.6, 392, 493.9],
      beach: [220, 277.2, 329.6, 440],
      desert: [196, 233.1, 293.7, 349.2],
      snow: [246.9, 293.7, 370, 493.9],
      forest: [174.6, 207.7, 261.6, 311.1],
      orbit: [130.8, 164.8, 196, 261.6],
    }[key] || [220, 277, 330];
    CH.forEach((f) => {
      const o = c.createOscillator(),
        g = c.createGain(),
        lfo = c.createOscillator(),
        lg = c.createGain();
      o.type = "sine";
      o.frequency.value = f * (1 + rand(-0.0015, 0.0015));
      g.gain.value = 0.0001;
      g.gain.setTargetAtTime(0.013, now, 2);
      lfo.frequency.value = rand(0.05, 0.12);
      lg.gain.value = 0.006;
      lfo.connect(lg);
      lg.connect(g.gain);
      o.connect(g);
      g.connect(sfx.master);
      o.start(now);
      lfo.start(now);
      this.nodes.push({ o, g, lfo });
    });
    if (key === "server" || key === "orbit") {
      const o = c.createOscillator(),
        g = c.createGain();
      o.type = "sine";
      o.frequency.value = key === "orbit" ? 42 : 55;
      g.gain.value = 0.0001;
      g.gain.setTargetAtTime(0.011, now, 2);
      o.connect(g);
      g.connect(sfx.master);
      o.start(now);
      this.nodes.push({ o, g, lfo: null });
    }
  }
}
export const pad = new Pad();
addEventListener(
  "pointerdown",
  () => {
    sfx.ensure();
    if (sfx.ctx && !pad.nodes.length) pad.start(pad.key);
  },
  { passive: true },
);

/* ================= DOM & DIALOG ================= */
