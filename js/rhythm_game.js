/**
 * Interactive Rhythm Game Component: "PRISMA BEAT"
 * Full-featured arcade music game for Prisma Land:
 * - 3 Original synthesized electronic/chiptune songs (112, 128, 144 BPM)
 * - 4 Lanes with falling beat gems (Keyboard [D, F, J, K] / [Arrow Keys] + Touch Pad Buttons)
 * - Real-time Web Audio music synthesizer playing synchronized drums, bass, and melody
 * - Precision timing judgements (PERFECT, GREAT, GOOD, MISS)
 * - Dynamic combo counter, multipliers, and Groove/Life gauge
 * - Results screen with Rank (S, A, B, C), accuracy, and Carnival Ticket rewards
 */

export class RhythmGame {
  constructor({ containerEl, sfx }) {
    this.container = containerEl;
    this.sfx = sfx;
    this.active = false;
    this.canvas = null;
    this.ctx = null;

    this.songs = [
      {
        id: 'prisma_pop',
        title: 'Prisma Pop Party',
        artist: 'DJ Lunaria',
        bpm: 128,
        difficulty: 'Mudah / Normal',
        color: '#00d2ff',
        notes: this.generateSongNotes(128, 48, 'pop')
      },
      {
        id: 'cyber_rush',
        title: 'Cyber Neon Rush',
        artist: 'Prisma Synthetics',
        bpm: 144,
        difficulty: 'Tantangan / Cepat',
        color: '#ff3b94',
        notes: this.generateSongNotes(144, 64, 'rush')
      },
      {
        id: 'starlight',
        title: 'Starlight Melodi',
        artist: 'Astro Beats',
        bpm: 112,
        difficulty: 'Santai / Asyik',
        color: '#ffcc00',
        notes: this.generateSongNotes(112, 40, 'chill')
      }
    ];

    this.currentSong = this.songs[0];
    this.songTime = 0;
    this.startTime = 0;
    this.isPlaying = false;
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.groove = 50; // 0 to 100%
    this.judgements = { perfect: 0, great: 0, good: 0, miss: 0 };
    this.recentJudgement = null;
    this.recentJudgementTimer = 0;

    // Lanes definition
    this.lanes = [
      { key: 'KeyD', altKey: 'ArrowLeft', label: 'D', color: '#00f0ff', glow: 0 },
      { key: 'KeyF', altKey: 'ArrowDown', label: 'F', color: '#ff3b94', glow: 0 },
      { key: 'KeyJ', altKey: 'ArrowUp', label: 'J', color: '#00e676', glow: 0 },
      { key: 'KeyK', altKey: 'ArrowRight', label: 'K', color: '#ffea00', glow: 0 }
    ];

    this.noteFallSpeed = 460; // Pixels per second
    this.hitLineY = 0;
    this.animId = null;
    this.audioLoopId = null;

    this.bindEvents();
  }

  generateSongNotes(bpm, totalBeats, type) {
    const beatSec = 60 / bpm;
    const notes = [];
    let noteId = 0;

    for (let b = 4; b < totalBeats; b++) {
      let lanesToHit = [];

      if (type === 'pop') {
        if (b % 2 === 0) lanesToHit.push(b % 4);
        if (b % 4 === 1 && b > 8) lanesToHit.push((b + 1) % 4);
        if (b % 8 === 7) lanesToHit.push(0, 3);
      } else if (type === 'rush') {
        lanesToHit.push(b % 4);
        if (b % 2 === 1 && b % 3 === 0) lanesToHit.push((b + 2) % 4);
        if (b % 8 === 0) lanesToHit.push(1, 2);
      } else {
        if (b % 2 === 0) lanesToHit.push((b / 2) % 4);
        if (b % 6 === 5) lanesToHit.push(3);
      }

      for (const lane of lanesToHit) {
        notes.push({
          id: noteId++,
          lane,
          time: b * beatSec,
          hit: false,
          missed: false
        });
      }
    }

    return notes;
  }

  bindEvents() {
    window.addEventListener('keydown', e => {
      if (!this.active || !this.isPlaying) return;
      for (let i = 0; i < this.lanes.length; i++) {
        if (e.code === this.lanes[i].key || e.code === this.lanes[i].altKey) {
          e.preventDefault();
          this.handleLaneInput(i);
        }
      }
    });

    window.addEventListener('keyup', e => {
      if (!this.active) return;
      for (let i = 0; i < this.lanes.length; i++) {
        if (e.code === this.lanes[i].key || e.code === this.lanes[i].altKey) {
          this.lanes[i].glow = 0;
        }
      }
    });
  }

  open() {
    this.active = true;
    if (this.container) {
      this.container.classList.add('open');
    }
    this.showSongSelect();
  }

  close() {
    this.active = false;
    this.stopSong();
    if (this.container) {
      this.container.classList.remove('open');
    }
  }

  showSongSelect() {
    if (!this.container) return;
    this.isPlaying = false;
    cancelAnimationFrame(this.animId);
    clearInterval(this.audioLoopId);

    const songCardsHtml = this.songs.map((s, idx) => `
      <div class="rhythm-song-card ${idx === 0 ? 'selected' : ''}" data-idx="${idx}" style="--accent:${s.color}">
        <div class="rsc-header">
          <span class="rsc-bpm">${s.bpm} BPM</span>
          <span class="rsc-diff">${s.difficulty}</span>
        </div>
        <div class="rsc-title">${s.title}</div>
        <div class="rsc-artist">${s.artist} · ${s.notes.length} Ketukan</div>
        <button class="rhythm-play-btn" data-play="${idx}">
          <span class="msr">play_arrow</span> MAINKAN
        </button>
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="rhythm-modal-sheet">
        <div class="rhythm-header">
          <div class="rhythm-title-wrap">
            <span class="msr rhythm-ico">music_note</span>
            <div>
              <div class="rhythm-title">PRISMA BEAT · ARKADE MUSIK</div>
              <div class="rhythm-sub">Pilih lagu favoritmu dan tekan tombol ketukan dengan tepat!</div>
            </div>
          </div>
          <button class="icon-btn" id="rhythmCloseBtn" title="Tutup Arkade"><span class="msr">close</span></button>
        </div>

        <div class="rhythm-song-list">
          ${songCardsHtml}
        </div>

        <div class="rhythm-footer-help">
          <span>Gunakan Tombol <b>[D] [F] [J] [K]</b> atau <b>[Panah]</b> / Tombol Layar Sentuh</span>
        </div>
      </div>
    `;

    this.container.querySelector('#rhythmCloseBtn')?.addEventListener('click', () => this.close());

    this.container.querySelectorAll('[data-play]').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.currentTarget.dataset.play, 10);
        this.startSong(this.songs[idx]);
      });
    });
  }

  startSong(song) {
    this.currentSong = {
      ...song,
      notes: song.notes.map(n => ({ ...n, hit: false, missed: false }))
    };

    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.groove = 60;
    this.judgements = { perfect: 0, great: 0, good: 0, miss: 0 };
    this.recentJudgement = null;

    // Render game screen layout
    this.container.innerHTML = `
      <div class="rhythm-play-view">
        <!-- TOP HUD -->
        <div class="rhythm-top-bar">
          <div>
            <div class="rhythm-playing-name">${this.currentSong.title}</div>
            <div class="rhythm-groove-bar"><div class="rgb-fill" id="rhythmGrooveFill" style="width:60%"></div></div>
          </div>
          <div class="rhythm-score-display">
            <div class="rsd-label">SKOR</div>
            <div class="rsd-val" id="rhythmScoreVal">000000</div>
          </div>
          <button class="icon-btn" id="rhythmAbortBtn" title="Berhenti"><span class="msr">close</span></button>
        </div>

        <!-- NOTE HIGHWAY CANVAS -->
        <div class="rhythm-canvas-wrap">
          <canvas id="rhythmCanvas"></canvas>
          <div class="rhythm-combo-wrap" id="rhythmComboWrap">
            <div class="rcw-judgement" id="rhythmJudgementText"></div>
            <div class="rcw-num" id="rhythmComboNum"></div>
          </div>
        </div>

        <!-- TOUCH INPUT BUTTONS FOR MOBILE & TACTILE CONTROLS -->
        <div class="rhythm-touch-bar">
          ${this.lanes.map((l, i) => `
            <button class="rhythm-pad-btn" data-lane="${i}" style="--lane-col:${l.color}">
              <span class="rpb-key">${l.label}</span>
              <span class="rpb-hint">${i === 0 ? '←' : i === 1 ? '↓' : i === 2 ? '↑' : '→'}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    this.container.querySelector('#rhythmAbortBtn')?.addEventListener('click', () => this.showSongSelect());

    // Setup touch controls
    this.container.querySelectorAll('.rhythm-pad-btn').forEach(btn => {
      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        const lane = parseInt(e.currentTarget.dataset.lane, 10);
        this.handleLaneInput(lane);
      });
      btn.addEventListener('pointerup', () => {
        const lane = parseInt(btn.dataset.lane, 10);
        this.lanes[lane].glow = 0;
      });
    });

    this.canvas = this.container.querySelector('#rhythmCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.sfx.ensure();
    this.startTime = performance.now();
    this.isPlaying = true;

    // Start Synthesized Musical Backing Track
    this.startMusicSynthesizer();

    // Start Animation Loop
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.hitLineY = this.canvas.height - 70;
  }

  /* ================= REAL-TIME MUSIC SYNTHESIZER ================= */
  startMusicSynthesizer() {
    clearInterval(this.audioLoopId);
    if (!this.sfx.ctx) return;

    const ctx = this.sfx.ctx;
    const bpm = this.currentSong.bpm;
    const beatMs = (60 / bpm) * 1000;
    let currentBeat = 0;

    // Pentatonic & Melodic scale frequencies for procedural catchy party melody
    const melodyScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    const bassScale = [130.81, 146.83, 164.81, 196.00, 220.00];

    this.audioLoopId = setInterval(() => {
      if (!this.isPlaying) return;

      const now = ctx.currentTime;

      // 1. Kick Drum (Thump on every beat)
      this.playKick(now);

      // 2. Snare Drum (Crisp pop on beats 2 and 4)
      if (currentBeat % 2 === 1) {
        this.playSnare(now);
      }

      // 3. Hi-Hat (Every 8th note)
      this.playHiHat(now);

      // 4. Bassline
      const bassNote = bassScale[(currentBeat * 2) % bassScale.length];
      this.playSynthNote(bassNote, 0.18, 'sawtooth', 0.12, now);

      // 5. Arpeggio / Lead Melody
      const melNote = melodyScale[(currentBeat * 3) % melodyScale.length];
      this.playSynthNote(melNote, 0.22, 'square', 0.08, now + 0.04);

      currentBeat++;

      // Check if song has completed
      const totalSongBeats = Math.ceil(this.currentSong.notes[this.currentSong.notes.length - 1].time / (60 / bpm)) + 4;
      if (currentBeat > totalSongBeats) {
        setTimeout(() => this.showResults(), 1200);
      }
    }, beatMs);
  }

  playKick(time) {
    if (!this.sfx.ctx || !this.sfx.enabled) return;
    const c = this.sfx.ctx;
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.14);

    gain.gain.setValueAtTime(0.24, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    osc.connect(gain).connect(this.sfx.master);
    osc.start(time);
    osc.stop(time + 0.15);
  }

  playSnare(time) {
    if (!this.sfx.ctx || !this.sfx.enabled) return;
    const c = this.sfx.ctx;
    // Noise buffer
    const len = (c.sampleRate * 0.1) | 0;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    const noise = c.createBufferSource();
    noise.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const gain = c.createGain();
    gain.gain.setValueAtTime(0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    noise.connect(filter).connect(gain).connect(this.sfx.master);
    noise.start(time);

    // Tone body
    const osc = c.createOscillator();
    const oscGain = c.createGain();
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
    oscGain.gain.setValueAtTime(0.15, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    osc.connect(oscGain).connect(this.sfx.master);
    osc.start(time);
    osc.stop(time + 0.09);
  }

  playHiHat(time) {
    if (!this.sfx.ctx || !this.sfx.enabled) return;
    const c = this.sfx.ctx;
    const len = (c.sampleRate * 0.05) | 0;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;

    const g = c.createGain();
    g.gain.setValueAtTime(0.08, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    src.connect(f).connect(g).connect(this.sfx.master);
    src.start(time);
  }

  playSynthNote(freq, dur, type, vol, time) {
    if (!this.sfx.ctx || !this.sfx.enabled) return;
    const c = this.sfx.ctx;
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(gain).connect(this.sfx.master);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  /* ================= INPUT HANDLING & TIMING ================= */
  handleLaneInput(laneIndex) {
    this.lanes[laneIndex].glow = 1.0;

    // Visual button trigger feedback
    const btn = this.container.querySelector(`.rhythm-pad-btn[data-lane="${laneIndex}"]`);
    if (btn) {
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 120);
    }

    // Find closest note in this lane
    const currentSongTime = (performance.now() - this.startTime) / 1000;
    let closestNote = null;
    let minDiff = Infinity;

    for (const note of this.currentSong.notes) {
      if (note.lane !== laneIndex || note.hit || note.missed) continue;
      const diff = Math.abs(currentSongTime - note.time);
      if (diff < minDiff) {
        minDiff = diff;
        closestNote = note;
      }
    }

    // Timing thresholds (in seconds)
    if (closestNote && minDiff <= 0.17) {
      closestNote.hit = true;
      if (minDiff <= 0.055) {
        this.recordJudgement('PERFECT!!', 300, '#ffea00');
        this.judgements.perfect++;
        this.sfx.tone({ f: 980, t: 0.08, type: 'triangle', g: 0.12 });
      } else if (minDiff <= 0.11) {
        this.recordJudgement('GREAT!', 200, '#00f0ff');
        this.judgements.great++;
        this.sfx.tone({ f: 740, t: 0.08, type: 'sine', g: 0.1 });
      } else {
        this.recordJudgement('GOOD', 100, '#00e676');
        this.judgements.good++;
        this.sfx.tone({ f: 520, t: 0.08, type: 'sine', g: 0.08 });
      }
    } else {
      // Empty tap or too early
      this.sfx.tone({ f: 180, t: 0.06, type: 'sawtooth', g: 0.04 });
    }
  }

  recordJudgement(label, points, color) {
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    // Combo multiplier bonus
    const multiplier = this.combo >= 30 ? 4 : this.combo >= 15 ? 2 : 1;
    this.score += points * multiplier;
    this.groove = Math.min(100, this.groove + 2.5);

    this.recentJudgement = { label, color, time: performance.now() };

    this.updateHUD();
  }

  recordMiss() {
    this.combo = 0;
    this.judgements.miss++;
    this.groove = Math.max(0, this.groove - 6.5);
    this.recentJudgement = { label: 'MISS', color: '#ff3b30', time: performance.now() };
    this.sfx.tone({ f: 120, t: 0.14, type: 'sawtooth', g: 0.08 });
    this.updateHUD();
  }

  updateHUD() {
    const scoreEl = this.container.querySelector('#rhythmScoreVal');
    if (scoreEl) scoreEl.textContent = String(this.score).padStart(6, '0');

    const grooveFill = this.container.querySelector('#rhythmGrooveFill');
    if (grooveFill) grooveFill.style.width = `${this.groove}%`;

    const jText = this.container.querySelector('#rhythmJudgementText');
    const cNum = this.container.querySelector('#rhythmComboNum');

    if (this.recentJudgement && jText) {
      jText.textContent = this.recentJudgement.label;
      jText.style.color = this.recentJudgement.color;
      jText.classList.remove('bounce');
      void jText.offsetWidth; // Reflow
      jText.classList.add('bounce');
    }

    if (cNum) {
      cNum.textContent = this.combo > 1 ? `${this.combo} COMBO` : '';
    }
  }

  /* ================= NOTE HIGHWAY RENDERING ================= */
  gameLoop() {
    if (!this.isPlaying) return;

    const now = performance.now();
    const dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    this.renderHighway();

    // Check for missed notes
    const songTime = (now - this.startTime) / 1000;
    for (const note of this.currentSong.notes) {
      if (!note.hit && !note.missed && songTime - note.time > 0.17) {
        note.missed = true;
        this.recordMiss();
      }
    }

    // Decay lane hit glows
    for (const lane of this.lanes) {
      lane.glow = Math.max(0, lane.glow - dt * 4.5);
    }

    this.animId = requestAnimationFrame(() => this.gameLoop());
  }

  renderHighway() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const songTime = (performance.now() - this.startTime) / 1000;

    ctx.clearRect(0, 0, w, h);

    const laneW = w / 4;

    // 1. Draw Lane Tracks & Separators
    for (let i = 0; i < 4; i++) {
      const x = i * laneW;

      // Lane background glow when pressed
      if (this.lanes[i].glow > 0) {
        ctx.fillStyle = this.lanes[i].color + Math.floor(this.lanes[i].glow * 55).toString(16).padStart(2, '0');
        ctx.fillRect(x, 0, laneW, h);
      }

      // Vertical lane dividers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // 2. Draw Target Hit Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, this.hitLineY);
    ctx.lineTo(w, this.hitLineY);
    ctx.stroke();

    // Target Hit Zone Rings
    for (let i = 0; i < 4; i++) {
      const cx = i * laneW + laneW / 2;
      ctx.strokeStyle = this.lanes[i].color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, this.hitLineY, 22, 0, Math.PI * 2);
      ctx.stroke();

      if (this.lanes[i].glow > 0) {
        ctx.fillStyle = this.lanes[i].color;
        ctx.beginPath();
        ctx.arc(cx, this.hitLineY, 22 * this.lanes[i].glow, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Draw Falling Notes
    for (const note of this.currentSong.notes) {
      if (note.hit || note.missed) continue;

      const timeDiff = note.time - songTime;
      // Only render notes in view (within 2 seconds)
      if (timeDiff > 2.0 || timeDiff < -0.2) continue;

      const y = this.hitLineY - timeDiff * this.noteFallSpeed;
      const x = note.lane * laneW + laneW / 2;

      // Note Capsule / Gem
      const col = this.lanes[note.lane].color;
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.roundRect(x - 28, y - 10, 56, 20, 8);
      ctx.fill();

      // White inner core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(x - 18, y - 4, 36, 8, 4);
      ctx.fill();

      ctx.shadowBlur = 0;
    }
  }

  /* ================= RESULTS SCREEN ================= */
  showResults() {
    this.isPlaying = false;
    clearInterval(this.audioLoopId);
    cancelAnimationFrame(this.animId);

    const totalNotes = this.currentSong.notes.length;
    const hitNotes = this.judgements.perfect + this.judgements.great + this.judgements.good;
    const acc = totalNotes > 0 ? Math.round((hitNotes / totalNotes) * 100) : 0;

    let rank = 'C';
    let rankColor = '#ff9100';
    if (acc >= 95) { rank = 'S'; rankColor = '#ffea00'; }
    else if (acc >= 85) { rank = 'A'; rankColor = '#00d2ff'; }
    else if (acc >= 70) { rank = 'B'; rankColor = '#00e676'; }

    const tickets = Math.floor(this.score / 20) + (rank === 'S' ? 100 : rank === 'A' ? 50 : 20);

    this.sfx.fanfare();

    this.container.innerHTML = `
      <div class="rhythm-results-view">
        <div class="rrv-card">
          <div class="rrv-badge" style="--rank-col:${rankColor}">
            <span class="rrv-rank">${rank}</span>
            <span class="rrv-rank-sub">PERINGKAT</span>
          </div>

          <div class="rrv-title">${this.currentSong.title}</div>
          <div class="rrv-score">${String(this.score).padStart(6, '0')}</div>

          <div class="rrv-stats-grid">
            <div class="rrv-stat"><span class="lbl">Akurasi</span><span class="val">${acc}%</span></div>
            <div class="rrv-stat"><span class="lbl">Max Combo</span><span class="val">${this.maxCombo}</span></div>
            <div class="rrv-stat"><span class="lbl" style="color:#ffea00">Perfect</span><span class="val">${this.judgements.perfect}</span></div>
            <div class="rrv-stat"><span class="lbl" style="color:#00f0ff">Great</span><span class="val">${this.judgements.great}</span></div>
            <div class="rrv-stat"><span class="lbl" style="color:#00e676">Good</span><span class="val">${this.judgements.good}</span></div>
            <div class="rrv-stat"><span class="lbl" style="color:#ff3b30">Miss</span><span class="val">${this.judgements.miss}</span></div>
          </div>

          <div class="rrv-reward">
            <span class="msr" style="color:#ffea00">confirmation_number</span>
            <span>Hadiah: <b>+${tickets} Tiket Karnaval Prisma</b></span>
          </div>

          <div class="rrv-actions">
            <button class="btn btn-filled" id="rhythmReplayBtn">
              <span class="msr">replay</span> MAIN LAGI
            </button>
            <button class="btn btn-tonal" id="rhythmMenuBtn">
              <span class="msr">library_music</span> PILIH LAGU
            </button>
            <button class="btn btn-outline" id="rhythmExitBtn">
              <span class="msr">arrow_back</span> KEMBALI KE TAMAN
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#rhythmReplayBtn')?.addEventListener('click', () => this.startSong(this.currentSong));
    this.container.querySelector('#rhythmMenuBtn')?.addEventListener('click', () => this.showSongSelect());
    this.container.querySelector('#rhythmExitBtn')?.addEventListener('click', () => this.close());
  }

  stopSong() {
    this.isPlaying = false;
    clearInterval(this.audioLoopId);
    cancelAnimationFrame(this.animId);
  }
}
