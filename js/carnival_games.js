/**
 * Carnival Shooting Gallery Minigame: "TEMBAK SASARAN PRISMA"
 * Interactive carnival target shooting game:
 * - 30-Second carnival rush challenge
 * - Moving rows of targets: rubber ducks, spinning stars, bullseye plates, and bonus golden clovers
 * - Real-time crosshair aiming & cork rifle firing with pops & spark particles
 * - Score multipliers, accuracy stats, and Carnival Ticket rewards
 */

export class CarnivalShootingGame {
  constructor({ containerEl, sfx }) {
    this.container = containerEl;
    this.sfx = sfx;
    this.active = false;
    this.canvas = null;
    this.ctx = null;

    this.score = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.timeLeft = 30;
    this.timerId = null;
    this.animId = null;
    this.isPlaying = false;

    this.targets = [];
    this.particles = [];
    this.floatTexts = [];
    this.crosshair = { x: 200, y: 200, fired: false };

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', e => {
      if (!this.active || !this.isPlaying) return;
      if (e.code === 'Space') {
        e.preventDefault();
        this.fire();
      }
    });
  }

  open() {
    this.active = true;
    if (this.container) {
      this.container.classList.add('open');
    }
    this.showIntro();
  }

  close() {
    this.active = false;
    this.stopGame();
    if (this.container) {
      this.container.classList.remove('open');
    }
  }

  showIntro() {
    this.container.innerHTML = `
      <div class="shooting-modal-sheet">
        <div class="shooting-header">
          <div class="shooting-title-wrap">
            <span class="msr shooting-ico">crisis_alert</span>
            <div>
              <div class="shooting-title">TEMBAK SASARAN · KARNAVAL PRISMA</div>
              <div class="shooting-sub">Tembak sebanyak mungkin bebek berenang, bintang putar &amp; target emas dalam 30 detik!</div>
            </div>
          </div>
          <button class="icon-btn" id="shootingCloseBtn" title="Tutup"><span class="msr">close</span></button>
        </div>

        <div class="shooting-rules-grid">
          <div class="srg-card">
            <span class="msr" style="color:#ffea00">cruelty_free</span>
            <div class="srg-t">Bebek Kuning</div>
            <div class="srg-p">+100 Poin</div>
          </div>
          <div class="srg-card">
            <span class="msr" style="color:#00d2ff">stars</span>
            <div class="srg-t">Bintang Putar</div>
            <div class="srg-p">+150 Poin</div>
          </div>
          <div class="srg-card">
            <span class="msr" style="color:#ff3b94">trip_origin</span>
            <div class="srg-t">Target Lingkaran</div>
            <div class="srg-p">+200 Poin</div>
          </div>
          <div class="srg-card">
            <span class="msr" style="color:#ffd700">workspace_premium</span>
            <div class="srg-t">Bintang Emas Langka</div>
            <div class="srg-p">+350 Poin</div>
          </div>
        </div>

        <div class="shooting-footer">
          <button class="btn btn-filled lg" id="startShootingBtn">
            <span class="msr">play_arrow</span> MULAI TANTANGAN (30 DETIK)
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#shootingCloseBtn')?.addEventListener('click', () => this.close());
    this.container.querySelector('#startShootingBtn')?.addEventListener('click', () => this.startGame());
  }

  startGame() {
    this.score = 0;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.timeLeft = 30;
    this.isPlaying = true;
    this.particles = [];
    this.floatTexts = [];

    this.container.innerHTML = `
      <div class="shooting-play-view">
        <div class="shooting-top-bar">
          <div class="stb-stat"><span class="lbl">WAKTU</span><span class="val" id="shootTimeVal">30s</span></div>
          <div class="stb-stat"><span class="lbl">SKOR</span><span class="val" id="shootScoreVal">0</span></div>
          <div class="stb-stat"><span class="lbl">AKURASI</span><span class="val" id="shootAccVal">100%</span></div>
          <button class="icon-btn" id="shootAbortBtn"><span class="msr">close</span></button>
        </div>

        <div class="shooting-canvas-wrap">
          <canvas id="shootingCanvas"></canvas>
        </div>
      </div>
    `;

    this.container.querySelector('#shootAbortBtn')?.addEventListener('click', () => this.showIntro());

    this.canvas = this.container.querySelector('#shootingCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Mouse & Touch aim tracking
    this.canvas.addEventListener('pointermove', e => {
      const rect = this.canvas.getBoundingClientRect();
      this.crosshair.x = e.clientX - rect.left;
      this.crosshair.y = e.clientY - rect.top;
    });

    this.canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      this.crosshair.x = e.clientX - rect.left;
      this.crosshair.y = e.clientY - rect.top;
      this.fire();
    });

    // Populate initial targets
    this.initTargets();

    // 1-second countdown timer
    clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      this.timeLeft--;
      const timeEl = this.container.querySelector('#shootTimeVal');
      if (timeEl) {
        timeEl.textContent = `${this.timeLeft}s`;
        if (this.timeLeft <= 5) timeEl.style.color = '#ff3b30';
      }

      if (this.timeLeft <= 0) {
        this.finishGame();
      }
    }, 1000);

    this.sfx.chime();
    this.lastFrameTime = performance.now();
    this.gameLoop();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.crosshair.x = this.canvas.width / 2;
    this.crosshair.y = this.canvas.height / 2;
  }

  initTargets() {
    this.targets = [];
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Shelf 1: Lower Row (y = h * 0.72) Ducks moving right
    for (let i = 0; i < 4; i++) {
      this.targets.push({
        type: 'duck',
        x: (w / 4) * i,
        y: h * 0.72,
        r: 28,
        vx: 110,
        pts: 100,
        color: '#ffea00',
        alive: true
      });
    }

    // Shelf 2: Middle Row (y = h * 0.48) Stars moving left
    for (let i = 0; i < 3; i++) {
      this.targets.push({
        type: 'star',
        x: (w / 3) * i,
        y: h * 0.48,
        r: 24,
        vx: -130,
        pts: 150,
        color: '#00d2ff',
        alive: true
      });
    }

    // Shelf 3: Upper Row (y = h * 0.24) Bullseyes and rare Gold Stars
    for (let i = 0; i < 3; i++) {
      const isRare = i === 1;
      this.targets.push({
        type: isRare ? 'gold_star' : 'bullseye',
        x: (w / 3) * i + 50,
        y: h * 0.24,
        r: 22,
        vx: isRare ? 160 : -90,
        pts: isRare ? 350 : 200,
        color: isRare ? '#ffd700' : '#ff3b94',
        alive: true
      });
    }
  }

  fire() {
    if (!this.isPlaying) return;
    this.shotsFired++;
    this.crosshair.fired = true;
    setTimeout(() => this.crosshair.fired = false, 100);

    // Play gunshot cork pop sound
    this.sfx.shootPistol();

    // Check hit against targets
    let hitAny = false;
    for (const t of this.targets) {
      if (!t.alive) continue;
      const d = Math.hypot(this.crosshair.x - t.x, this.crosshair.y - t.y);
      if (d <= t.r + 6) {
        t.alive = false;
        hitAny = true;
        this.shotsHit++;
        this.score += t.pts;

        // Spark explosion particles
        this.spawnSparks(t.x, t.y, t.color);

        // Floating points popup
        this.floatTexts.push({
          x: t.x,
          y: t.y,
          text: `+${t.pts}`,
          color: t.color,
          alpha: 1.0
        });

        this.sfx.tone({ f: 880, f2: 1240, t: 0.1, type: 'triangle', g: 0.15 });

        // Respawn target after 1.5 seconds
        setTimeout(() => {
          if (this.isPlaying) {
            t.alive = true;
            t.x = t.vx > 0 ? -40 : this.canvas.width + 40;
          }
        }, 1500);
        break; // 1 bullet hits 1 target
      }
    }

    // Update HUD
    const sEl = this.container.querySelector('#shootScoreVal');
    if (sEl) sEl.textContent = this.score;

    const acc = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 100;
    const aEl = this.container.querySelector('#shootAccVal');
    if (aEl) aEl.textContent = `${acc}%`;
  }

  spawnSparks(x, y, color) {
    for (let i = 0; i < 14; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 120;
      this.particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color,
        life: 0.6,
        maxLife: 0.6
      });
    }
  }

  gameLoop() {
    if (!this.isPlaying) return;

    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastFrameTime) / 1000);
    this.lastFrameTime = now;

    this.render(dt);

    this.animId = requestAnimationFrame(() => this.gameLoop());
  }

  render(dt) {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Carnival Backdrop: Warm dark wooden paneling
    ctx.fillStyle = '#1c101d';
    ctx.fillRect(0, 0, w, h);

    // 3 Shelves
    const shelfYs = [h * 0.24, h * 0.48, h * 0.72];
    for (const sy of shelfYs) {
      ctx.fillStyle = '#653a20';
      ctx.fillRect(0, sy + 18, w, 12);
      ctx.fillStyle = '#e6b800'; // Brass rim
      ctx.fillRect(0, sy + 16, w, 3);
    }

    // Targets rendering & motion
    for (const t of this.targets) {
      if (!t.alive) continue;

      t.x += t.vx * dt;
      if (t.vx > 0 && t.x > w + 40) t.x = -40;
      if (t.vx < 0 && t.x < -40) t.x = w + 40;

      ctx.save();
      ctx.translate(t.x, t.y);

      if (t.type === 'duck') {
        // Cute rubber duck
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(0, 4, 18, 0, Math.PI * 2); // Body
        ctx.fill();
        ctx.beginPath();
        ctx.arc(t.vx > 0 ? 10 : -10, -8, 11, 0, Math.PI * 2); // Head
        ctx.fill();
        // Orange beak
        ctx.fillStyle = '#ff7700';
        ctx.beginPath();
        ctx.ellipse(t.vx > 0 ? 20 : -20, -7, 7, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (t.type === 'star' || t.type === 'gold_star') {
        // Rotating 5-point star
        ctx.fillStyle = t.color;
        ctx.beginPath();
        for (let p = 0; p < 5; p++) {
          const a1 = (p / 5) * Math.PI * 2 - Math.PI / 2;
          const a2 = a1 + Math.PI / 5;
          ctx.lineTo(Math.cos(a1) * t.r, Math.sin(a1) * t.r);
          ctx.lineTo(Math.cos(a2) * (t.r * 0.45), Math.sin(a2) * (t.r * 0.45));
        }
        ctx.closePath();
        ctx.fill();
      } else {
        // Bullseye Rings
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, t.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(0, 0, t.r * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, t.r * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Spark Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // Floating Points Popup Text
    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      const ft = this.floatTexts[i];
      ft.y -= dt * 45;
      ft.alpha -= dt * 1.4;
      if (ft.alpha <= 0) {
        this.floatTexts.splice(i, 1);
        continue;
      }
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = ft.alpha;
      ctx.font = '700 20px Sora, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.globalAlpha = 1.0;
    }

    // Aim Crosshair Reticle
    const cx = this.crosshair.x, cy = this.crosshair.y;
    ctx.strokeStyle = this.crosshair.fired ? '#ff3b30' : '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair lines
    ctx.beginPath();
    ctx.moveTo(cx - 26, cy); ctx.lineTo(cx - 6, cy);
    ctx.moveTo(cx + 6, cy); ctx.lineTo(cx + 26, cy);
    ctx.moveTo(cx, cy - 26); ctx.lineTo(cx, cy - 6);
    ctx.moveTo(cx, cy + 6); ctx.lineTo(cx, cy + 26);
    ctx.stroke();
  }

  finishGame() {
    this.isPlaying = false;
    clearInterval(this.timerId);
    cancelAnimationFrame(this.animId);

    const acc = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;
    const tickets = Math.floor(this.score / 25) + 30;

    this.sfx.fanfare();

    this.container.innerHTML = `
      <div class="shooting-results-view">
        <div class="srv-card">
          <div class="srv-icon"><span class="msr">military_tech</span></div>
          <div class="srv-title">WAKTU HABIS!</div>
          <div class="srv-sub">Hasil Tembak Sasaran Karnaval Prisma</div>

          <div class="srv-score-num">${this.score}</div>

          <div class="srv-stats-grid">
            <div class="srv-stat"><span class="lbl">Sasaran Kena</span><span class="val">${this.shotsHit}</span></div>
            <div class="srv-stat"><span class="lbl">Peluru Ditembak</span><span class="val">${this.shotsFired}</span></div>
            <div class="srv-stat"><span class="lbl">Akurasi</span><span class="val">${acc}%</span></div>
          </div>

          <div class="srv-reward">
            <span class="msr" style="color:#ffea00">confirmation_number</span>
            <span>Hadiah: <b>+${tickets} Tiket Karnaval Prisma</b></span>
          </div>

          <div class="srv-actions">
            <button class="btn btn-filled" id="shootReplayBtn">
              <span class="msr">replay</span> MAIN LAGI
            </button>
            <button class="btn btn-outline" id="shootExitBtn">
              <span class="msr">arrow_back</span> KEMBALI KE TAMAN
            </button>
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#shootReplayBtn')?.addEventListener('click', () => this.startGame());
    this.container.querySelector('#shootExitBtn')?.addEventListener('click', () => this.close());
  }

  stopGame() {
    this.isPlaying = false;
    clearInterval(this.timerId);
    cancelAnimationFrame(this.animId);
  }
}
