/* ================= DYNAMIC AMBIENT AUDIO SYSTEM =================
 * Generates dynamic, evolving procedural background soundscapes & ambient tracks
 * tailored to each active world in Prisma Worlds:
 * - 'nature' (Alam) worlds: peaceful bird songs, wind foliage rustles, crystal bells, ocean surf waves
 * - 'scifi' (Kota/Server/Orbit) worlds: deep industrial sub-bass drones, neon transformer hums, data pulses, space station hums
 * - 'action' (Funfair): lively carnival synth harmonies and bells
 * - 'combat' (Gurun): mystic Phrygian modal drones & shifting desert wind
 * Smooth crossfading between worlds, seamless looping, zero asset latency.
 */

export const AMBIENT_TRACKS = {
  park: {
    title: 'Padang Embun Seroja',
    category: 'Alam',
    catKey: 'nature',
    subtitle: 'Kicauan Burung & Semilir Angin Pagi',
    icon: 'local_florist',
    accent: '#7ce3a0',
    baseFreqs: [196, 246.9, 293.7, 392, 440], // G major 9
    natureType: 'birds_meadow',
    droneType: 'none',
    gain: 0.16
  },
  server: {
    title: 'Inti Komputasi Binary',
    category: 'Sci-Fi',
    catKey: 'scifi',
    subtitle: 'Kipas Pendingin Server & Denyut Data',
    icon: 'memory',
    accent: '#4de3d4',
    baseFreqs: [110, 164.8, 220, 293.7], // A minor 11
    natureType: 'none',
    droneType: 'server_fans',
    gain: 0.18
  },
  city: {
    title: 'Metropolis Neon Senja',
    category: 'Kota Sci-Fi',
    catKey: 'scifi',
    subtitle: 'Dengung Sub-Bass Industri & Gemerlap Neon',
    icon: 'location_city',
    accent: '#ffb36b',
    baseFreqs: [87.3, 130.8, 174.6, 220, 261.6], // F minor 9
    natureType: 'none',
    droneType: 'industrial_sub',
    gain: 0.20
  },
  funfair: {
    title: 'Prisma Carnival Waves',
    category: 'Aksi & Wahana',
    catKey: 'action',
    subtitle: 'Harmoni Karnaval Ceria & Arpeggio Cepat',
    icon: 'attractions',
    accent: '#00b0ff',
    baseFreqs: [130.8, 196, 261.6, 329.6, 392], // C major add9
    natureType: 'carnival_sparkle',
    droneType: 'none',
    gain: 0.18
  },
  beach: {
    title: 'Semilir Ombak Karang',
    category: 'Alam',
    catKey: 'nature',
    subtitle: 'Deburan Ombak Laut & Angin Pantai',
    icon: 'beach_access',
    accent: '#5ec8f2',
    baseFreqs: [146.8, 220, 277.2, 329.6, 440], // D major 7
    natureType: 'ocean_surf',
    droneType: 'none',
    gain: 0.17
  },
  desert: {
    title: 'Misteri Piramida Kalaris',
    category: 'Gurun Kuno',
    catKey: 'combat',
    subtitle: 'Desau Badai Pasir & Drone Mistik',
    icon: 'wb_sunny',
    accent: '#ff9d5c',
    baseFreqs: [98, 146.8, 196, 233.1, 293.7], // G Phrygian
    natureType: 'sand_wind',
    droneType: 'mystic_drone',
    gain: 0.19
  },
  snow: {
    title: 'Gema Danau Kristal',
    category: 'Alam Dingin',
    catKey: 'nature',
    subtitle: 'Kilau Lonceng Es & Angin Gletser',
    icon: 'ac_unit',
    accent: '#a5e8ff',
    baseFreqs: [123.5, 185, 246.9, 293.7, 370], // B minor 9
    natureType: 'ice_bells',
    droneType: 'none',
    gain: 0.16
  },
  forest: {
    title: 'Kanopi Safir Lunaria',
    category: 'Alam Malam',
    catKey: 'nature',
    subtitle: 'Resonansi Rune Kristal & Jangkrik Malam',
    icon: 'forest',
    accent: '#38bdf8',
    baseFreqs: [146.8, 220, 261.6, 329.6, 440], // D minor 9
    natureType: 'forest_night',
    droneType: 'rune_hum',
    gain: 0.17
  },
  orbit: {
    title: 'Gravitasi Nol Helios',
    category: 'Sci-Fi Orbital',
    catKey: 'scifi',
    subtitle: 'Siklus Udara Stasiun & Resonansi Kosmik',
    icon: 'satellite_alt',
    accent: '#9ad1ff',
    baseFreqs: [65.4, 98, 130.8, 196, 261.6], // C minor 9 deep
    natureType: 'none',
    droneType: 'orbital_station',
    gain: 0.19
  },
  menu: {
    title: 'Prisma Genesis',
    category: 'Kosmik',
    catKey: 'menu',
    subtitle: 'Pad Harmoni Luar Angkasa Planet Biru',
    icon: 'public',
    accent: '#38bdf8',
    baseFreqs: [98, 146.8, 196, 246.9, 293.7, 370], // G Lydian
    natureType: 'space_shimmer',
    droneType: 'none',
    gain: 0.17
  }
};

export class AmbientAudioSystem {
  constructor(sfx) {
    this.sfx = sfx;
    this.key = 'menu';
    this.currentTrack = null;
    this.activeNodes = [];
    this.activeTimers = [];
    this.masterGain = null;
    this.onTrackChange = null; // Callback for UI notifications
    this.enabled = true;
  }

  get nodes() {
    return this.activeNodes;
  }

  ensureMaster() {
    this.sfx.ensure();
    const ctx = this.sfx.ctx;
    if (!ctx) return null;
    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.sfx.master);
    }
    return ctx;
  }

  stop(fadeTime = 1.0) {
    const ctx = this.sfx.ctx;
    if (!ctx) return;

    // Clear background procedural generation timers
    for (const t of this.activeTimers) {
      clearTimeout(t);
      clearInterval(t);
    }
    this.activeTimers = [];

    if (!this.activeNodes.length) return;

    const now = ctx.currentTime;
    const oldNodes = [...this.activeNodes];
    this.activeNodes = [];

    for (const item of oldNodes) {
      try {
        if (item.gain) {
          item.gain.gain.cancelScheduledValues(now);
          item.gain.gain.setValueAtTime(item.gain.gain.value, now);
          item.gain.gain.exponentialRampToValueAtTime(0.0001, now + fadeTime);
        }
        setTimeout(() => {
          try {
            if (item.osc) item.osc.stop();
            if (item.source) item.source.stop();
            if (item.lfo) item.lfo.stop();
            if (item.gain) item.gain.disconnect();
          } catch (e) { }
        }, (fadeTime + 0.15) * 1000);
      } catch (e) { }
    }
  }

  start(key, force = false) {
    if (!force && this.key === key && this.activeNodes.length > 0) {
      return;
    }

    this.key = key;
    const trackDef = AMBIENT_TRACKS[key] || AMBIENT_TRACKS.menu;
    this.currentTrack = trackDef;

    const ctx = this.ensureMaster();
    if (!ctx) return;

    // Notify UI of dynamic track change
    if (typeof this.onTrackChange === 'function') {
      try {
        this.onTrackChange(trackDef, key);
      } catch (err) {
        console.error('Error in onTrackChange listener:', err);
      }
    }

    // Smoothly fade out previous track
    this.stop(1.1);

    const now = ctx.currentTime;

    // Create a local sub-master gain for this track layer
    const trackGain = ctx.createGain();
    trackGain.gain.setValueAtTime(0.0001, now);
    trackGain.gain.exponentialRampToValueAtTime(trackDef.gain, now + 1.4);
    trackGain.connect(this.masterGain);
    this.activeNodes.push({ gain: trackGain });

    // 1. Synthesize Harmonic Chord Pad
    this.createHarmonicPad(ctx, trackDef, trackGain, now);

    // 2. Synthesize Active Nature Sounds (Alam Worlds)
    if (trackDef.natureType && trackDef.natureType !== 'none') {
      this.createNatureSoundscape(ctx, trackDef.natureType, trackGain);
    }

    // 3. Synthesize Industrial & Sci-Fi Drones (Kota/Server/Orbit Worlds)
    if (trackDef.droneType && trackDef.droneType !== 'none') {
      this.createSciFiDrone(ctx, trackDef.droneType, trackGain);
    }
  }

  /**
   * Harmonically tuned ambient pad layers with gentle stereo detune and LFO chorus
   */
  createHarmonicPad(ctx, trackDef, trackGain, now) {
    const freqs = trackDef.baseFreqs || [196, 246.9, 293.7];

    freqs.forEach((freq, idx) => {
      // Primary Pad Oscillator
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      // Lowpass filter for warm, buttery analog atmosphere
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = Math.min(1800, freq * 3.5 + 400);
      filter.Q.value = 1.0;

      osc.type = (idx % 2 === 0) ? 'sine' : 'triangle';
      // Subtle organic detuning for lush stereo chorus effect
      const detuneAmt = (Math.random() - 0.5) * 6; // +/- 3 cents
      osc.frequency.value = freq;
      osc.detune.value = detuneAmt;

      // Base note gain with higher notes slightly softer
      const baseNoteGain = (0.05 / Math.sqrt(freqs.length)) * (1 - (idx * 0.08));
      oscGain.gain.value = baseNoteGain;

      // Slow breathing LFO modulation
      lfo.frequency.value = 0.06 + (idx * 0.035);
      lfoGain.gain.value = baseNoteGain * 0.35;

      lfo.connect(lfoGain);
      lfoGain.connect(oscGain.gain);

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(trackGain);

      osc.start(now);
      lfo.start(now);

      this.activeNodes.push({ osc, lfo, gain: oscGain });
    });
  }

  /**
   * Generative Nature Soundscapes for 'Alam' worlds:
   * Peaceful bird chirping, ocean wave surges, crystal ice bells, forest night insects
   */
  createNatureSoundscape(ctx, natureType, trackGain) {
    if (natureType === 'birds_meadow') {
      // 1. Gentle rustling meadow breeze
      this.createWindAtmosphere(ctx, trackGain, 450, 0.045);

      // 2. Procedural bird chirps generator (Taman Seroja)
      const scheduleBirdSong = () => {
        if (!this.activeNodes.length) return;
        const delay = 2200 + Math.random() * 4500;
        const timerId = setTimeout(() => {
          this.playBirdChirp(ctx, trackGain);
          scheduleBirdSong();
        }, delay);
        this.activeTimers.push(timerId);
      };
      scheduleBirdSong();
    } else if (natureType === 'ocean_surf') {
      // Pantai Karang: Rhythmic ocean waves rushing and receding
      this.createOceanWaves(ctx, trackGain);
    } else if (natureType === 'forest_night') {
      // Hutan Lunaria: Crickets, nocturnal gentle chirps & crystal bells
      this.createForestNightInsects(ctx, trackGain);

      const scheduleCrystalChime = () => {
        if (!this.activeNodes.length) return;
        const delay = 3200 + Math.random() * 5000;
        const timerId = setTimeout(() => {
          this.playCrystalBell(ctx, trackGain, [1174.7, 1480, 1760, 2217.5]);
          scheduleCrystalChime();
        }, delay);
        this.activeTimers.push(timerId);
      };
      scheduleCrystalChime();
    } else if (natureType === 'ice_bells') {
      // Puncak Esna: Glacial mountain wind & glassy crystal bells
      this.createWindAtmosphere(ctx, trackGain, 750, 0.07);

      const scheduleIceChime = () => {
        if (!this.activeNodes.length) return;
        const delay = 2600 + Math.random() * 4200;
        const timerId = setTimeout(() => {
          this.playCrystalBell(ctx, trackGain, [1568, 1975.5, 2349.3, 3136]);
          scheduleIceChime();
        }, delay);
        this.activeTimers.push(timerId);
      };
      scheduleIceChime();
    } else if (natureType === 'sand_wind') {
      // Gurun Kalaris: Dry howling desert sand wind
      this.createWindAtmosphere(ctx, trackGain, 320, 0.085);
    } else if (natureType === 'carnival_sparkle') {
      // Prisma Land: Lively arpeggiated synth bells
      this.createCarnivalArpeggio(ctx, trackGain);
    } else if (natureType === 'space_shimmer') {
      // Menu: Shimmering ethereal high bell tones
      const scheduleCosmicPing = () => {
        if (!this.activeNodes.length) return;
        const delay = 3800 + Math.random() * 6000;
        const timerId = setTimeout(() => {
          this.playCrystalBell(ctx, trackGain, [880, 1174.7, 1318.5, 1760]);
          scheduleCosmicPing();
        }, delay);
        this.activeTimers.push(timerId);
      };
      scheduleCosmicPing();
    }
  }

  /**
   * Generative Industrial & Sci-Fi Drones for 'Kota', 'Server', 'Orbit':
   * Deep sub-bass drones, machinery hums, server fan airflow, data pulses
   */
  createSciFiDrone(ctx, droneType, trackGain) {
    const now = ctx.currentTime;

    if (droneType === 'industrial_sub') {
      // Kota Senja: Heavy industrial 55Hz sub drone + 60Hz neon transformer buzz
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      const subFilter = ctx.createBiquadFilter();

      subOsc.type = 'sawtooth';
      subOsc.frequency.setValueAtTime(55, now); // A1 note
      subFilter.type = 'lowpass';
      subFilter.frequency.setValueAtTime(140, now);
      subFilter.Q.setValueAtTime(3.5, now);

      subGain.gain.setValueAtTime(0.08, now);

      subOsc.connect(subFilter);
      subFilter.connect(subGain);
      subGain.connect(trackGain);
      subOsc.start(now);
      this.activeNodes.push({ osc: subOsc, gain: subGain });

      // Neon transformer / power grid electric hum (120Hz & 240Hz overtone)
      const humOsc = ctx.createOscillator();
      const humGain = ctx.createGain();
      humOsc.type = 'triangle';
      humOsc.frequency.setValueAtTime(120, now);
      humGain.gain.setValueAtTime(0.022, now);

      humOsc.connect(humGain);
      humGain.connect(trackGain);
      humOsc.start(now);
      this.activeNodes.push({ osc: humOsc, gain: humGain });

      // Occasional digital telemetry telemetry pulse in city
      const scheduleCityPulse = () => {
        if (!this.activeNodes.length) return;
        const delay = 4000 + Math.random() * 6000;
        const timerId = setTimeout(() => {
          this.playDigitalBeep(ctx, trackGain, 1600);
          scheduleCityPulse();
        }, delay);
        this.activeTimers.push(timerId);
      };
      scheduleCityPulse();
    } else if (droneType === 'server_fans') {
      // Area Server: Deep server rack cooling airflow + rhythmic binary telemetry pulses
      this.createWindAtmosphere(ctx, trackGain, 260, 0.08);

      // 120Hz transformer power hum
      const humOsc = ctx.createOscillator();
      const humGain = ctx.createGain();
      humOsc.type = 'sawtooth';
      humOsc.frequency.setValueAtTime(60, now);

      const humFilter = ctx.createBiquadFilter();
      humFilter.type = 'lowpass';
      humFilter.frequency.setValueAtTime(200, now);

      humGain.gain.setValueAtTime(0.035, now);
      humOsc.connect(humFilter);
      humFilter.connect(humGain);
      humGain.connect(trackGain);
      humOsc.start(now);
      this.activeNodes.push({ osc: humOsc, gain: humGain });

      // Rhythmic data pulse loop (computing activity)
      const pulseInterval = setInterval(() => {
        if (!this.activeNodes.length) {
          clearInterval(pulseInterval);
          return;
        }
        if (Math.random() < 0.65) {
          const freq = [1200, 1500, 1800, 2400][Math.floor(Math.random() * 4)];
          this.playDigitalBeep(ctx, trackGain, freq, 0.04, 0.015);
        }
      }, 700);
      this.activeTimers.push(pulseInterval);
    } else if (droneType === 'orbital_station') {
      // Stasiun Helios: Low-frequency zero-G metallic station drone + cyclic air ventilation
      const spaceOsc = ctx.createOscillator();
      const spaceGain = ctx.createGain();
      spaceOsc.type = 'sine';
      spaceOsc.frequency.setValueAtTime(43.6, now); // F0 deep sub
      spaceGain.gain.setValueAtTime(0.09, now);

      spaceOsc.connect(spaceGain);
      spaceGain.connect(trackGain);
      spaceOsc.start(now);
      this.activeNodes.push({ osc: spaceOsc, gain: spaceGain });

      // Space station air ventilation cycle (breathing noise)
      this.createOceanWaves(ctx, trackGain, 0.035, 11);
    } else if (droneType === 'mystic_drone') {
      // Gurun Kalaris: Ancient mystic resonant 5th drone
      const droneOsc = ctx.createOscillator();
      const droneGain = ctx.createGain();
      droneOsc.type = 'sawtooth';
      droneOsc.frequency.setValueAtTime(98, now); // G2

      const flt = ctx.createBiquadFilter();
      flt.type = 'lowpass';
      flt.frequency.setValueAtTime(240, now);
      flt.Q.setValueAtTime(4.0, now);

      droneGain.gain.setValueAtTime(0.045, now);

      droneOsc.connect(flt);
      flt.connect(droneGain);
      droneGain.connect(trackGain);
      droneOsc.start(now);
      this.activeNodes.push({ osc: droneOsc, gain: droneGain });
    } else if (droneType === 'rune_hum') {
      // Hutan Lunaria: Magic rune humming
      const runeOsc = ctx.createOscillator();
      const runeGain = ctx.createGain();
      runeOsc.type = 'sine';
      runeOsc.frequency.setValueAtTime(110, now);
      runeGain.gain.setValueAtTime(0.04, now);

      runeOsc.connect(runeGain);
      runeGain.connect(trackGain);
      runeOsc.start(now);
      this.activeNodes.push({ osc: runeOsc, gain: runeGain });
    }
  }

  /**
   * Procedural Bird Chirp: Realistic avian call consisting of 2-3 quick FM glides
   */
  playBirdChirp(ctx, destGain) {
    if (!ctx || !this.activeNodes.length) return;
    const now = ctx.currentTime;

    const basePitch = 2400 + Math.random() * 1200;
    const notesCount = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < notesCount; i++) {
      const startT = now + i * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const f1 = basePitch + (Math.random() * 400 - 200);
      const f2 = f1 + (Math.random() > 0.5 ? 600 : -500);

      osc.frequency.setValueAtTime(f1, startT);
      osc.frequency.exponentialRampToValueAtTime(Math.max(400, f2), startT + 0.07);

      gain.gain.setValueAtTime(0.0001, startT);
      gain.gain.exponentialRampToValueAtTime(0.038, startT + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startT + 0.075);

      osc.connect(gain);
      gain.connect(destGain);

      osc.start(startT);
      osc.stop(startT + 0.08);
    }
  }

  /**
   * Ocean Surf Waves: Continuous dual-filtered noise swell simulating breaking water
   */
  createOceanWaves(ctx, destGain, maxVol = 0.065, period = 7.5) {
    const len = (ctx.sampleRate * 3) | 0;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 350;
    filter.Q.value = 1.2;

    const waveGain = ctx.createGain();
    waveGain.gain.value = 0.001;

    // LFO modulating both wave volume and filter frequency
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 1 / period;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = maxVol;

    lfo.connect(lfoGain);
    lfoGain.connect(waveGain.gain);

    src.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(destGain);

    src.start();
    lfo.start();

    this.activeNodes.push({ source: src, lfo, gain: waveGain });
  }

  /**
   * Forest Night: Soft high-frequency insect shimmer
   */
  createForestNightInsects(ctx, destGain) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = 4600;

    lfo.frequency.value = 8.5; // Rapid cricket chirp tremor
    lfoGain.gain.value = 0.007;

    gain.gain.value = 0.009;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    osc.connect(gain);
    gain.connect(destGain);

    osc.start();
    lfo.start();

    this.activeNodes.push({ osc, lfo, gain });
  }

  /**
   * Crystal Bell / Glass Chime: Clean sine harmonic ringing down smoothly
   */
  playCrystalBell(ctx, destGain, freqList = [1200, 1600, 2000]) {
    if (!ctx || !this.activeNodes.length) return;
    const now = ctx.currentTime;
    const freq = freqList[Math.floor(Math.random() * freqList.length)];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.028, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

    osc.connect(gain);
    gain.connect(destGain);

    osc.start(now);
    osc.stop(now + 2.3);
  }

  /**
   * Digital Telemetry Beep (Sci-Fi data pulses)
   */
  playDigitalBeep(ctx, destGain, freq = 1800, dur = 0.06, vol = 0.02) {
    if (!ctx || !this.activeNodes.length) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(gain);
    gain.connect(destGain);

    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  /**
   * Continuous wind / airflow atmosphere
   */
  createWindAtmosphere(ctx, destGain, freq = 500, vol = 0.05) {
    const len = (ctx.sampleRate * 2) | 0;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = 1.0;

    const gain = ctx.createGain();
    gain.gain.value = vol;

    // Gentle wind swell LFO
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoG = ctx.createGain();
    lfoG.gain.value = vol * 0.45;
    lfo.connect(lfoG);
    lfoG.connect(gain.gain);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(destGain);

    src.start();
    lfo.start();

    this.activeNodes.push({ source: src, lfo, gain });
  }

  /**
   * Carnival Arpeggiator (Prisma Land)
   */
  createCarnivalArpeggio(ctx, destGain) {
    const notes = [261.6, 329.6, 392, 523.2, 659.2, 784];
    let noteIdx = 0;

    const arpInterval = setInterval(() => {
      if (!this.activeNodes.length) {
        clearInterval(arpInterval);
        return;
      }
      const freq = notes[noteIdx % notes.length];
      noteIdx++;

      if (ctx && ctx.state === 'running') {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.02, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

        osc.connect(gain);
        gain.connect(destGain);

        osc.start(now);
        osc.stop(now + 0.25);
      }
    }, 280);

    this.activeTimers.push(arpInterval);
  }

  getCurrentTrackInfo() {
    return this.currentTrack || AMBIENT_TRACKS[this.key] || AMBIENT_TRACKS.menu;
  }
}
