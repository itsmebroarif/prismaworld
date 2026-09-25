/**
 * Minimap Component for Prisma Worlds
 * Renders a small circular radar minimap tracking player position
 * relative to discovered landmarks, vehicles, and active world features.
 */

export class Minimap {
  constructor({ containerEl, canvasEl, toggleBtnEl }) {
    this.container = containerEl;
    this.canvas = canvasEl;
    this.toggleBtn = toggleBtnEl;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.visible = true;
    try {
      const saved = localStorage.getItem('prisma-minimap-visible');
      if (saved !== null) this.visible = (saved === 'true');
    } catch (e) { }

    this.radarRadiusMeters = 65; // Radius of radar in world units (meters)
    this.sweepAngle = 0;
    this.nearestLandmarkEl = null;

    this.initDOM();
    this.initEvents();
    this.updateVisibilityUI();
  }

  initDOM() {
    if (!this.container) return;
    // Create nearest landmark distance badge underneath the circular map
    const badge = document.createElement('div');
    badge.className = 'mm-badge';
    badge.id = 'mmBadge';
    badge.innerHTML = '<span class="msr sm">explore</span><span id="mmNearest">Mencari landmark...</span>';
    this.container.appendChild(badge);
    this.nearestLandmarkEl = badge.querySelector('#mmNearest');
  }

  initEvents() {
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => {
        this.toggle();
      });
    }

    // Keyboard shortcut [M]
    window.addEventListener('keydown', (e) => {
      if (e.key === 'm' || e.key === 'M') {
        // Only if not in an input/modal
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
        this.toggle();
      }
    });
  }

  toggle() {
    this.visible = !this.visible;
    try {
      localStorage.setItem('prisma-minimap-visible', String(this.visible));
    } catch (e) { }
    this.updateVisibilityUI();
  }

  show() {
    this.visible = true;
    this.updateVisibilityUI();
  }

  hide() {
    this.visible = false;
    this.updateVisibilityUI();
  }

  updateVisibilityUI() {
    if (this.container) {
      this.container.classList.toggle('minimized', !this.visible);
    }
    if (this.toggleBtn) {
      this.toggleBtn.classList.toggle('active', this.visible);
      const icon = this.toggleBtn.querySelector('.msr');
      if (icon) {
        icon.textContent = this.visible ? 'map' : 'layers_clear';
      }
      this.toggleBtn.title = this.visible ? 'Sembunyikan Minimap [M]' : 'Tampilkan Minimap [M]';
    }
  }

  /**
   * Main render method called on every animation frame
   * @param {Object} playerPos {x, y, z}
   * @param {number} playerYaw in radians
   * @param {Array} landmarks list of world landmarks
   * @param {string} worldKey current world ID
   * @param {number} dt delta time
   */
  render(playerPos, playerYaw, landmarks = [], worldKey = '', dt = 0.016) {
    if (!this.visible || !this.ctx || !playerPos) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = cx - 8; // Margin inside border

    // Advance radar sweep angle
    this.sweepAngle = (this.sweepAngle + dt * 2.2) % (Math.PI * 2);

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // 1. Clip to circular radar boundary
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    // 2. Radar Background (Dark Deep Blue Gradient)
    const bgGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, radius);
    bgGrad.addColorStop(0, '#0a1d33');
    bgGrad.addColorStop(0.7, '#071424');
    bgGrad.addColorStop(1, '#030a13');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 3. Concentric Range Grid Rings (20m, 40m, 60m)
    const ringDistances = [0.33, 0.66, 1.0];
    ctx.lineWidth = 1.2;
    ringDistances.forEach((ratio, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius * ratio, 0, Math.PI * 2);
      ctx.strokeStyle = idx === 2 ? 'rgba(56, 189, 248, 0.35)' : 'rgba(56, 189, 248, 0.14)';
      ctx.stroke();
    });

    // 4. Crosshair Coordinate Axes
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 5. Radar Sweep Line & Glowing Fade
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.sweepAngle);
    const sweepGrad = ctx.createLinearGradient(0, 0, radius, 0);
    sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0.3)');
    sweepGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, 0, 0.35);
    ctx.closePath();
    ctx.fillStyle = sweepGrad;
    ctx.fill();

    // Sharp leading line
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(radius, 0);
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 6. Cardinal Directions (Utara / North pinned to true World -Z)
    // In our coordinate system: -Z is North, +X is East, +Z is South, -X is West
    ctx.fillStyle = '#7dd3fc';
    ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('U', cx, cy - radius + 5);

    // 7. Render Landmarks
    const scale = radius / this.radarRadiusMeters;
    let closestLandmark = null;
    let closestDist = Infinity;

    for (const lm of landmarks) {
      // Relative offset from player (dx, dz)
      const dx = lm.x - playerPos.x;
      const dz = lm.z - playerPos.z;
      const dist = Math.hypot(dx, dz);

      if (dist < closestDist) {
        closestDist = dist;
        closestLandmark = lm;
      }

      // Convert world coordinates to minimap coordinates:
      // X = East (+X is right), Z = South (+Z is down)
      const mapX = cx + dx * scale;
      const mapY = cy + dz * scale;
      const distFromCenter = Math.hypot(mapX - cx, mapY - cy);

      const isDiscovered = !!lm.found;

      if (distFromCenter <= radius - 10) {
        // Landmark is within radar circle
        this.drawLandmarkBlip(ctx, mapX, mapY, lm, isDiscovered, false);
      } else {
        // Landmark is outside circle: clamp to circumference to indicate direction
        const angle = Math.atan2(mapY - cy, mapX - cx);
        const clampedX = cx + Math.cos(angle) * (radius - 12);
        const clampedY = cy + Math.sin(angle) * (radius - 12);
        this.drawLandmarkBlip(ctx, clampedX, clampedY, lm, isDiscovered, true, angle);
      }
    }

    // 8. Player Vision FOV Cone & Central Marker
    this.drawPlayerMarker(ctx, cx, cy, playerYaw);

    ctx.restore();

    // 9. Update Nearest Landmark Badge text
    if (this.nearestLandmarkEl) {
      if (closestLandmark) {
        const dRound = Math.round(closestDist);
        const status = closestLandmark.found ? '✓' : '?';
        this.nearestLandmarkEl.textContent = `${status} ${closestLandmark.title} · ${dRound}m`;
      } else {
        this.nearestLandmarkEl.textContent = 'Jelajahi dunia...';
      }
    }
  }

  /**
   * Draw individual landmark blip on the radar
   */
  drawLandmarkBlip(ctx, x, y, lm, isDiscovered, isClamped, edgeAngle = 0) {
    ctx.save();

    if (isDiscovered) {
      // DISCOVERED LANDMARK: Vibrant colored gem with halo
      const color = lm.color ? ('#' + (typeof lm.color === 'number' ? lm.color.toString(16).padStart(6, '0') : lm.color)) : '#38bdf8';

      // Outer glowing pulse
      ctx.beginPath();
      ctx.arc(x, y, isClamped ? 7 : 9, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
      ctx.fill();

      // Solid inner dot
      ctx.beginPath();
      ctx.arc(x, y, isClamped ? 4.5 : 5.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Directional arrow if clamped to the edge
      if (isClamped) {
        ctx.translate(x, y);
        ctx.rotate(edgeAngle);
        ctx.beginPath();
        ctx.moveTo(7, 0);
        ctx.lineTo(2, -4);
        ctx.lineTo(2, 4);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      }
    } else {
      // UNDISCOVERED MYSTERY LANDMARK: Subtle pulsing beacon ring
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2, 2]);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Draw the player at the center with a heading arrow & FOV vision cone
   */
  drawPlayerMarker(ctx, cx, cy, yaw) {
    ctx.save();
    ctx.translate(cx, cy);

    // Yaw in Three.js: 0 faces -Z (North). Yaw increases clockwise/counter-clockwise.
    // In canvas: +Y is down (+Z South), -Y is up (-Z North).
    // An orientation of yaw = 0 points towards -Y (Up).
    const angle = yaw - Math.PI / 2;

    // 1. Translucent Field of View (FOV) cone
    ctx.save();
    ctx.rotate(angle);
    const fovAngle = Math.PI / 3.2; // ~56 degrees cone
    const fovLen = 32;
    const fovGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, fovLen);
    fovGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    fovGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, fovLen, -fovAngle / 2, fovAngle / 2);
    ctx.closePath();
    ctx.fillStyle = fovGrad;
    ctx.fill();
    ctx.restore();

    // 2. Sharp Navigation Arrow (Player Indicator)
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(10, 0);       // Arrow tip
    ctx.lineTo(-7, -6);     // Left wing
    ctx.lineTo(-4, 0);      // Inner notch
    ctx.lineTo(-7, 6);      // Right wing
    ctx.closePath();

    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.restore();
  }
}
