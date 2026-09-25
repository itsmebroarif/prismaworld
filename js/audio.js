/* ================= AUDIO SYNTHESIZER ================= */
export class AudioFX {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.master = null;
    this.wind = null;
    this.engineOsc = null;
    this.engineGain = null;
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
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  setMuted(m) {
    this.enabled = !m;
    if (this.master) this.master.gain.value = m ? 0 : 1;
  }
  tone({ f = 440, f2 = null, t = .15, type = 'sine', g = .12, delay = 0 } = {}) {
    if (!this.ctx || !this.enabled) return;
    const c = this.ctx, n = c.currentTime + delay;
    const o = c.createOscillator(), v = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, n);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), n + t);
    v.gain.setValueAtTime(.0001, n);
    v.gain.exponentialRampToValueAtTime(g, n + .012);
    v.gain.exponentialRampToValueAtTime(.0001, n + t);
    o.connect(v).connect(this.master);
    o.start(n);
    o.stop(n + t + .05);
  }
  noise({ t = .1, g = .08, fl = 800 } = {}) {
    if (!this.ctx || !this.enabled) return;
    const c = this.ctx, n = c.currentTime;
    const len = Math.max(1, (c.sampleRate * t) | 0), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(); s.buffer = buf;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = fl;
    const v = c.createGain(); v.gain.value = g;
    s.connect(f).connect(v).connect(this.master);
    s.start(n);
  }
  click() { this.tone({ f: 640, f2: 860, t: .07, type: 'triangle', g: .06 }); }
  whoosh() { this.noise({ t: .45, g: .1, fl: 900 }); this.tone({ f: 220, f2: 520, t: .4, type: 'sine', g: .06 }); }
  jump() { this.tone({ f: 330, f2: 610, t: .16, g: .08 }); }
  land() { this.tone({ f: 170, f2: 110, t: .06, type: 'triangle', g: .05 }); }
  step() { this.noise({ t: .05, g: .022, fl: 480 }); }
  chime() { [880, 1108.7, 1318.5].forEach((f, i) => this.tone({ f, t: .3, g: .09, delay: i * .09 })); }
  fanfare() { [659.3, 784, 987.8, 1318.5, 1568].forEach((f, i) => this.tone({ f, t: .4, g: .09, delay: i * .11 })); }
  startWind() {
    if (this.wind || !this.ctx) return;
    const c = this.ctx, len = (c.sampleRate * 1.5) | 0, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = .6;
    const g = c.createGain(); g.gain.value = 0;
    src.connect(f).connect(g).connect(this.master); src.start();
    this.wind = { src, f, g };
  }
  setWind(v) {
    if (!this.wind || !this.ctx) return;
    const k = Math.max(0, Math.min(1, (v - 6) / 44));
    this.wind.g.gain.setTargetAtTime(k * .22, this.ctx.currentTime, .1);
    this.wind.f.frequency.setTargetAtTime(300 + v * 26, this.ctx.currentTime, .1);
  }
  stopWind() {
    if (!this.wind || !this.ctx) return;
    const w = this.wind; this.wind = null;
    w.g.gain.setTargetAtTime(.0001, this.ctx.currentTime, .15);
    setTimeout(() => { try { w.src.stop(); } catch (e) { } }, 700);
  }
  /* WEAPONS & COMBAT SOUNDS */
  shootPistol() {
    this.tone({ f: 680, f2: 140, t: .12, type: 'sawtooth', g: .2 });
    this.noise({ t: .08, g: .16, fl: 2600 });
  }
  shootSMG() {
    this.tone({ f: 920, f2: 260, t: .06, type: 'square', g: .15 });
    this.noise({ t: .04, g: .12, fl: 3600 });
  }
  shootRifle() {
    this.tone({ f: 480, f2: 90, t: .18, type: 'triangle', g: .28 });
    this.noise({ t: .14, g: .22, fl: 2200 });
  }
  shootSniper() {
    this.tone({ f: 1400, f2: 120, t: .38, type: 'sawtooth', g: .35 });
    this.noise({ t: .3, g: .32, fl: 1400 });
  }
  hitMonster(crit = false) {
    if (crit) {
      this.tone({ f: 880, f2: 440, t: .14, type: 'triangle', g: .25 });
      this.tone({ f: 1320, f2: 660, t: .14, type: 'sine', g: .2, delay: .02 });
    } else {
      this.tone({ f: 320, f2: 120, t: .08, type: 'sine', g: .18 });
    }
  }
  monsterDeath() {
    this.tone({ f: 220, f2: 50, t: .35, type: 'sawtooth', g: .25 });
    this.noise({ t: .28, g: .22, fl: 600 });
  }
  titanRoar() {
    this.tone({ f: 110, f2: 40, t: .95, type: 'sawtooth', g: .45 });
    this.noise({ t: .8, g: .3, fl: 450 });
  }
  titanStomp() {
    this.tone({ f: 75, f2: 25, t: .45, type: 'triangle', g: .5 });
    this.noise({ t: .35, g: .35, fl: 300 });
  }
  alarmRaid() {
    [520, 680, 520, 680].forEach((f, i) => this.tone({ f, t: .18, g: .22, type: 'sawtooth', delay: i * .15 }));
  }
  /* ENGINE SOUND FOR VEHICLES */
  vehicleEngine(speed) {
    if (!this.ctx || !this.enabled) return;
    if (!this.engineOsc) {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 50;
      this.engineGain.gain.value = .0001;
      this.engineOsc.connect(this.engineGain).connect(this.master);
      this.engineOsc.start();
    }
    const targetGain = Math.min(1, speed / 30) * .07;
    const targetFreq = 48 + speed * 3.5;
    this.engineGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, .1);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, .1);
  }
  stopEngine() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(.0001, this.ctx.currentTime, .15);
    }
  }
}

export class Pad {
  constructor(sfx) {
    this.sfx = sfx;
    this.nodes = [];
    this.key = 'menu';
  }
  stop() {
    if (!this.nodes.length || !this.sfx.ctx) return;
    const now = this.sfx.ctx.currentTime;
    for (const n of this.nodes) {
      try {
        n.g.gain.cancelScheduledValues(now);
        n.g.gain.setTargetAtTime(.0001, now, .35);
        n.o.stop(now + 1.5);
        if (n.lfo) n.lfo.stop(now + 1.5);
      } catch (e) { }
    }
    this.nodes = [];
  }
  start(key) {
    this.key = key;
    this.sfx.ensure();
    if (!this.sfx.ctx) return;
    this.stop();
    const c = this.sfx.ctx, now = c.currentTime;
    const CH = {
      menu: [196, 246.9, 293.7, 392], park: [261.6, 329.6, 392, 587.3], server: [110, 130.8, 164.8, 220],
      city: [174.6, 220, 261.6, 349.2], funfair: [261.6, 329.6, 392, 493.9], beach: [220, 277.2, 329.6, 440],
      desert: [196, 233.1, 293.7, 349.2], snow: [246.9, 293.7, 370, 493.9], forest: [174.6, 207.7, 261.6, 311.1],
      orbit: [130.8, 164.8, 196, 261.6]
    }[key] || [220, 277, 330];
    CH.forEach(f => {
      const o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
      o.type = 'sine';
      o.frequency.value = f * (1 + (Math.random() * .003 - .0015));
      g.gain.value = .0001;
      g.gain.setTargetAtTime(.013, now, 2);
      lfo.frequency.value = .05 + Math.random() * .07;
      lg.gain.value = .006;
      lfo.connect(lg); lg.connect(g.gain);
      o.connect(g); g.connect(this.sfx.master);
      o.start(now); lfo.start(now);
      this.nodes.push({ o, g, lfo });
    });
  }
}
