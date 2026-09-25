import * as THREE from 'three';
import { AudioFX, Pad } from './js/audio.js';
import { Vehicle } from './js/vehicle.js';
import { WeaponManager, WEAPON_DEFS } from './js/weapons.js';
import { MonsterSystem } from './js/monsters.js';
import { NPCSystem } from './js/npc.js';
import { MenuWorldScene } from './js/menu_world.js';
import { Minimap } from './js/minimap.js';
import { FunfairParkManager } from './js/funfair_rides.js';
import { RhythmGame } from './js/rhythm_game.js';
import { CarnivalShootingGame } from './js/carnival_games.js';

/* ================= UTIL & HELPERS ================= */
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (a, b, l, dt) => a + (b - a) * (1 - Math.exp(-l * dt));
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ================= AUDIO ================= */
export const sfx = new AudioFX();
export const pad = new Pad(sfx);

const ambientToastEl = $('#ambientTrackToast');
let ambientToastTimer = null;
pad.onTrackChange = (trackDef) => {
  if (!ambientToastEl) return;
  const tagEl = $('#attTag');
  const titleEl = $('#attTitle');
  const subEl = $('#attSub');
  if (tagEl) tagEl.textContent = `AMBIENT AUDIO · ${trackDef.category.toUpperCase()}`;
  if (titleEl) titleEl.textContent = trackDef.title;
  if (subEl) subEl.textContent = trackDef.subtitle;
  ambientToastEl.classList.remove('hidden');
  ambientToastEl.classList.add('show');
  clearTimeout(ambientToastTimer);
  ambientToastTimer = setTimeout(() => {
    ambientToastEl.classList.remove('show');
  }, 4200);
};

addEventListener('pointerdown', () => {
  sfx.ensure();
  if (sfx.ctx && !pad.nodes.length) pad.start(pad.key);
}, { passive: true });

/* ================= TOAST / SNACKBAR ================= */
let snackT;
export function snackbar(msg) {
  const el = $('#snackbar');
  const tx = $('#snackText');
  if (!el || !tx) return;
  tx.textContent = msg;
  el.classList.add('show');
  clearTimeout(snackT);
  snackT = setTimeout(() => el.classList.remove('show'), 3200);
}
window.snackbar = snackbar;

/* ================= MATERIAL DESIGN 3 / ANDROID UI ================= */
const canvas = $('#gl'), hudEl = $('#hud'), fadeEl = $('#fade'), landingEl = $('#landing'),
  introCard = $('#introCard'), hintBarEl = $('#hintBar'), discSheetEl = $('#discSheet'),
  actionPromptEl = $('#actionPrompt'), rideHudEl = $('#rideHUD'), vehicleHudEl = $('#vehicleHUD'),
  bossBarEl = $('#bossBar'), weaponHudEl = $('#weaponHUD'), touchCombatEl = $('#touchCombat'),
  sniperScopeEl = $('#sniperScope'), reticleEl = $('#reticle'),
  aboutModal = $('#aboutModal'), helpModal = $('#helpModal'), pauseModal = $('#pauseModal'),
  arsenalModal = $('#arsenalModal'), titanModal = $('#titanModal'), npcModal = $('#npcModal');

let currentDialog = null;
let currentPromptTarget = null; // { type: 'ride'|'vehicle'|'npc', obj: ... }

function addRipple(el) {
  if (!el) return;
  el.addEventListener('pointerdown', e => {
    const r = document.createElement('span'); r.className = 'ripple';
    const b = el.getBoundingClientRect(), d = Math.max(b.width, b.height) * 2.2;
    r.style.width = r.style.height = d + 'px';
    r.style.left = (e.clientX - b.left - d / 2) + 'px';
    r.style.top = (e.clientY - b.top - d / 2) + 'px';
    el.appendChild(r);
    r.addEventListener('animationend', () => r.remove());
  });
}
document.querySelectorAll('.btn,.icon-btn,.chip,.combat-btn,.vh-exit,.rh-exit').forEach(addRipple);

function openDialog(m) {
  if (!m) return;
  m.classList.add('open');
  currentDialog = m;
  if (world && phase === 'play') phase = 'paused';
}
function closeDialog(resume = true) {
  if (!currentDialog) return;
  currentDialog.classList.remove('open');
  currentDialog = null;
  if (resume && world && phase === 'paused') {
    phase = 'play';
    if (!touchMode) tryLock();
  }
}

/* ================= 9 DUNIA METADATA ================= */
export const WORLDS = {
  park: { idx: '01', name: 'Taman Seroja', acc: '#7ce3a0', hex: 0x7ce3a0, icon: 'local_florist', cat: 'nature', total: 5, desc: 'Taman pagi cerah — air mancur, danau, kupu-kupu, Prisma Buggy & botanis ramah.' },
  server: { idx: '02', name: 'Area Server', acc: '#4de3d4', hex: 0x4de3d4, icon: 'memory', cat: 'scifi', total: 5, desc: 'Jantung data Prisma: rak holografik, kipas raksasa, Quantum Hover & mekanik sistem.' },
  city: { idx: '03', name: 'Kota Senja', acc: '#ffb36b', hex: 0xffb36b, icon: 'location_city', cat: 'scifi', total: 5, desc: 'Metropolis senja neon: layar raksasa, monorel lalu-lalang, Cyber Roadster & barista.' },
  funfair: { idx: '04', name: 'Prisma Land', acc: '#00b0ff', hex: 0x00b0ff, icon: 'attractions', cat: 'action', total: 8, desc: 'Taman hiburan megah! Bianglala, komedi putar, roller coaster, drop tower, kapal ayun, cangkir berputar & arkade ritme Prisma Beat!' },
  beach: { idx: '05', name: 'Pantai Karang', acc: '#5ec8f2', hex: 0x5ec8f2, icon: 'beach_access', cat: 'nature', total: 5, desc: 'Pulau berpasir putih: mercusuar tua, camar laut, dermaga kayu & buggy pantai.' },
  desert: { idx: '06', name: 'Gurun Kalaris', acc: '#ff9d5c', hex: 0xff9d5c, icon: 'wb_sunny', cat: 'combat', total: 5, desc: 'Gurun senja dengan piramida kuno, oasis tersembunyi, rover tempur & pengembara.' },
  snow: { idx: '07', name: 'Puncak Esna', acc: '#a5e8ff', hex: 0xa5e8ff, icon: 'ac_unit', cat: 'nature', total: 5, desc: 'Kabin hangat di danau beku kristal, keluarga salju & snowmobile penjelajah gletser.' },
  forest: { idx: '08', name: 'Hutan Lunaria', acc: '#38bdf8', hex: 0x38bdf8, icon: 'forest', cat: 'nature', total: 5, desc: 'Hutan malam bercahaya: rune purba, kristal bercahaya, glider safir & peri malam.' },
  orbit: { idx: '09', name: 'Stasiun Helios', acc: '#9ad1ff', hex: 0x9ad1ff, icon: 'satellite_alt', cat: 'scifi', total: 5, desc: 'Stasiun antariksa bumi berotasi gravitasi rendah, lunar rover & komandan pertahanan.' }
};

let disc = {};
for (const k of Object.keys(WORLDS)) disc[k] = {};
try {
  const saved = JSON.parse(localStorage.getItem('prisma-disc') || '{}');
  for (const k of Object.keys(WORLDS)) disc[k] = { ...(saved[k] || {}) };
} catch (e) { }
const discCount = k => Object.values(disc[k] || {}).filter(Boolean).length;

function setAccent(col) {
  document.documentElement.style.setProperty('--acc', col);
}

/* ================= INPUT CONTROLLER ================= */
let touchMode = matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window);
export const input = { kb: { x: 0, y: 0 }, stick: { x: 0, y: 0 }, run: false, jumpQ: false, lookX: 0, lookY: 0, firing: false };
const keys = {};

function kbUpdate() {
  input.kb.x = (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) - (keys['KeyA'] || keys['ArrowLeft'] ? 1 : 0);
  input.kb.y = (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0) - (keys['KeyS'] || keys['ArrowDown'] ? 1 : 0);
  input.run = !!(keys['ShiftLeft'] || keys['ShiftRight']);
}

addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'Space' && !e.repeat && phase === 'play' && !world?.riding && !world?.drivingVehicle) {
    input.jumpQ = true;
  }
  // Weapon switches 1-4
  if (e.code === 'Digit1' && weaponManager) weaponManager.select(0);
  if (e.code === 'Digit2' && weaponManager) weaponManager.select(1);
  if (e.code === 'Digit3' && weaponManager) weaponManager.select(2);
  if (e.code === 'Digit4' && weaponManager) weaponManager.select(3);
  if (e.code === 'KeyR' && weaponManager) weaponManager.reload();

  // Carnival & Rhythm Games shortcut [K]
  if (e.code === 'KeyK' && phase === 'play' && rhythmGame && !rhythmGame.active && !carnivalShootingGame.active) {
    rhythmGame.open();
  }

  // Interaction Key [E]
  if (e.code === 'KeyE' && world && phase === 'play') {
    handleInteraction();
  }
  if (e.code === 'Escape') {
    if (rhythmGame && rhythmGame.active) rhythmGame.close();
    else if (carnivalShootingGame && carnivalShootingGame.active) carnivalShootingGame.close();
    else if (world && world.riding) exitRide();
    else if (world && world.drivingVehicle) exitVehicle();
    else if (phase === 'play' && !document.pointerLockElement) openDialog(pauseModal);
    else if (phase === 'paused' && currentDialog) closeDialog();
  }
  kbUpdate();
});

addEventListener('keyup', e => { keys[e.code] = false; kbUpdate(); });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; kbUpdate(); });

function tryLock() {
  if (touchMode) return;
  try {
    const p = canvas.requestPointerLock && canvas.requestPointerLock({ unadjustedMovement: true });
    if (p && p.catch) p.catch(() => { try { canvas.requestPointerLock(); } catch (e) { } });
  } catch (e) { try { canvas.requestPointerLock(); } catch (e2) { } }
}

// LOOK CONTROLS (360 DEGREES)
const LOOK_LOCK = .0022, LOOK_DRAG = .0042, LOOK_TOUCH = .0050;
addEventListener('mousemove', e => {
  if (document.pointerLockElement === canvas && phase === 'play') {
    input.lookX += e.movementX * LOOK_LOCK;
    input.lookY += e.movementY * LOOK_LOCK;
  }
});

let lookId = null, dragLook = false, lx = 0, ly = 0, dragDist = 0;
canvas.addEventListener('pointerdown', e => {
  if (phase !== 'play') return;
  if (e.button === 0 && !world?.riding && !world?.drivingVehicle && weaponManager) {
    // Shooting with left click
    weaponManager.shoot(monsterSystem, player.pos);
    updateWeaponHUD();
  } else if (e.button === 2 && weaponManager && weaponManager.current().hasScope) {
    // Scope zoom toggle with right click
    toggleSniperScope();
  }
  if (e.pointerType === 'touch') {
    if (lookId === null) { lookId = e.pointerId; lx = e.clientX; ly = e.clientY; }
  } else if (!touchMode && document.pointerLockElement !== canvas) {
    dragLook = true; dragDist = 0; lx = e.clientX; ly = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { }
  }
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

canvas.addEventListener('pointermove', e => {
  if (e.pointerType === 'touch' && e.pointerId === lookId) {
    input.lookX += (e.clientX - lx) * LOOK_TOUCH;
    input.lookY += (e.clientY - ly) * LOOK_TOUCH;
    lx = e.clientX; ly = e.clientY;
  } else if (dragLook) {
    dragDist += Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly);
    input.lookX += (e.clientX - lx) * LOOK_DRAG;
    input.lookY += (e.clientY - ly) * LOOK_DRAG;
    lx = e.clientX; ly = e.clientY;
  }
});

function endPointer(e) {
  if (e.pointerType === 'touch' && e.pointerId === lookId) lookId = null;
  if (dragLook) {
    dragLook = false;
    if (dragDist < 7 && phase === 'play' && !touchMode) tryLock();
  }
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

// Virtual Joystick
const joyEl = $('#joy'), knobEl = $('#joyKnob');
let joyId = null;
function joyHandle(e) {
  const b = joyEl.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
  let dx = e.clientX - cx, dy = e.clientY - cy; const max = b.width / 2 - 22, len = Math.hypot(dx, dy);
  if (len > max) { dx *= max / len; dy *= max / len; }
  knobEl.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  input.stick.x = dx / max; input.stick.y = -dy / max;
}
joyEl.addEventListener('pointerdown', e => {
  joyId = e.pointerId; joyEl.classList.add('active'); joyEl.setPointerCapture(joyId); joyHandle(e); e.preventDefault();
});
joyEl.addEventListener('pointermove', e => { if (e.pointerId === joyId) joyHandle(e); });
function joyEnd(e) {
  if (e.pointerId !== joyId) return;
  joyId = null; joyEl.classList.remove('active');
  knobEl.style.transform = 'translate(-50%,-50%)'; input.stick.x = input.stick.y = 0;
}
joyEl.addEventListener('pointerup', joyEnd); joyEl.addEventListener('pointercancel', joyEnd);
$('#jumpBtn').addEventListener('pointerdown', e => { e.preventDefault(); if (phase === 'play' && !world?.riding && !world?.drivingVehicle) input.jumpQ = true; });

// Mobile Combat buttons
$('#fireBtn').addEventListener('pointerdown', e => {
  e.preventDefault();
  if (phase === 'play' && weaponManager) {
    weaponManager.shoot(monsterSystem, player.pos);
    updateWeaponHUD();
  }
});
$('#scopeBtn').addEventListener('pointerdown', e => {
  e.preventDefault();
  toggleSniperScope();
});

function toggleSniperScope() {
  if (!weaponManager) return;
  weaponManager.isScoped = !weaponManager.isScoped;
  sniperScopeEl.classList.toggle('active', weaponManager.isScoped);
  camera.fov = weaponManager.isScoped ? 22 : (world ? world.fovBase : 68);
  camera.updateProjectionMatrix();
  reticleEl.classList.toggle('aim', weaponManager.isScoped);
}

function applyTouchMode(on) {
  touchMode = on;
  document.body.classList.toggle('touch', on);
  $('#touchUI').classList.toggle('hidden', !(on && world));
  $('#touchCombat').classList.toggle('hidden', !(on && world));
}

/* ================= THREE.JS ENGINE CORE ================= */
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, touchMode ? 1.8 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

export const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, .1, 700);
camera.rotation.order = 'YXZ';

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

export const menuWorld = new MenuWorldScene(renderer);

export const minimap = new Minimap({
  containerEl: $('#minimapContainer'),
  canvasEl: $('#minimapCanvas'),
  toggleBtnEl: $('#minimapToggleBtn')
});

export const rhythmGame = new RhythmGame({
  containerEl: $('#rhythmModal'),
  sfx
});

export const carnivalShootingGame = new CarnivalShootingGame({
  containerEl: $('#shootingModal'),
  sfx
});

export const M = {
  std: (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? .85, metalness: o.m ?? 0 }),
  lam: c => new THREE.MeshLambertMaterial({ color: c }),
  bas: (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false, ...o })
};
export const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
export const cyl = (rt, rb, h, mat, seg = 16) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
export const sph = (r, mat, s = 12) => new THREE.Mesh(new THREE.SphereGeometry(r, s, s), mat);

const softTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.userData = { keep: true }; return t;
})();

export function skyDome(colors, size = 260) {
  const c = document.createElement('canvas'); c.width = 16; c.height = 256; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 256); colors.forEach((col, i) => g.addColorStop(i / (colors.length - 1), col));
  x.fillStyle = g; x.fillRect(0, 0, 16, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.SphereGeometry(size, 24, 16), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, toneMapped: false }));
}

export function mkSprite(scene, color, size, pos, o = {}) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color, transparent: true, opacity: o.opacity ?? 1, depthWrite: false, fog: false }));
  s.scale.setScalar(size); s.position.set(...pos); scene.add(s); return s;
}

export function makeBeacon(color) {
  const g = new THREE.Group();
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.3), M.bas(color)); gem.position.y = 2.75;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.06, .24, 2.7, 8, 1, true), M.bas(color, { transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.y = 1.4;
  const ring = new THREE.Mesh(new THREE.RingGeometry(.5, .62, 36), M.bas(color, { transparent: true, opacity: .45, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .05;
  g.add(gem, beam, ring); g.userData = { gem, ring }; return g;
}

export function makeBurst(scene, pos, color) {
  const g = new THREE.Group(); scene.add(g);
  const items = []; const col = new THREE.Color(color);
  for (let i = 0; i < 24; i++) {
    const m = new THREE.Mesh(new THREE.TetrahedronGeometry(.12), M.bas(col.clone().offsetHSL(rand(0, .06), 0, rand(-.08, .12))));
    m.position.copy(pos);
    items.push({ m, v: new THREE.Vector3(rand(-1, 1), rand(-.1, 1.5), rand(-1, 1)).normalize().multiplyScalar(rand(3, 7)), rs: rand(4, 10) });
    g.add(m);
  }
  let life = 0;
  return {
    update(dt) {
      life += dt;
      for (const it of items) {
        it.v.y -= 13 * dt;
        it.m.position.addScaledVector(it.v, dt);
        it.m.rotation.x += it.rs * dt;
        it.m.scale.multiplyScalar(Math.max(0, 1 - dt * 1.8));
      }
      if (life > .85) {
        scene.remove(g);
        items.forEach(it => it.m.material.dispose());
        return true;
      }
      return false;
    }
  };
}

export function mkSign(text, color, w, h) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x = c.getContext('2d');
  x.strokeStyle = color; x.shadowColor = color; x.shadowBlur = 14; x.lineWidth = 6;
  x.strokeRect(10, 10, 236, 76);
  x.fillStyle = '#fff'; x.shadowBlur = 20; x.font = '700 38px Sora, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 128, 50);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.bas(0xffffff, { map: t, transparent: true }));
}

/* ================= PLAYER ================= */
export class Player {
  constructor() {
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.yaw = 0; this.pitch = 0;
    this.grounded = true; this.eye = 1.62;
    this.bobT = 0; this.lastStep = 0; this.landDip = 0; this.roll = 0;
  }
  reset(x, z, yaw) {
    this.pos.set(x, 0, z); this.vel.set(0, 0, 0); this.yaw = yaw; this.pitch = 0;
    this.grounded = true; this.bobT = 0; this.landDip = 0; this.roll = 0;
    camera.fov = world ? world.fovBase : 68;
    camera.updateProjectionMatrix();
  }
  update(dt, world) {
    this.yaw -= input.lookX;
    this.pitch = clamp(this.pitch - input.lookY, -1.52, 1.52);
    input.lookX = input.lookY = 0;

    const mx = clamp(input.kb.x + input.stick.x, -1, 1), my = clamp(input.kb.y + input.stick.y, -1, 1);
    const stickMag = Math.hypot(input.stick.x, input.stick.y);
    const run = input.run || stickMag > .92;
    const sp = run ? 7.8 : 4.6, sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);

    this.vel.x = damp(this.vel.x, (-sy * my + cy * mx) * sp, 12, dt);
    this.vel.z = damp(this.vel.z, (-cy * my - sy * mx) * sp, 12, dt);

    if (input.jumpQ) {
      if (this.grounded) { this.vel.y = world.jumpV; this.grounded = false; sfx.jump(); }
      input.jumpQ = false;
    }
    this.vel.y -= world.gravity * dt;
    this.pos.x += this.vel.x * dt; this.pos.z += this.vel.z * dt; this.pos.y += this.vel.y * dt;

    if (this.pos.y <= 0) {
      if (!this.grounded) { this.landDip = .2; sfx.land(); }
      this.pos.y = 0; this.vel.y = 0; this.grounded = true;
    }

    world.clampBounds(this.pos);

    const sp2 = Math.hypot(this.vel.x, this.vel.z);
    if (this.grounded && sp2 > .4) {
      this.bobT += dt * sp2 * 1.2;
      if (this.bobT - this.lastStep > 2.6) { this.lastStep = this.bobT; sfx.step(); }
    }
    const bobY = Math.sin(this.bobT) * .05 * Math.min(sp2 / 4.6, 1.5);
    this.landDip = damp(this.landDip, 0, 8, dt);
    this.roll = damp(this.roll, -mx * .035, 8, dt);

    camera.position.set(this.pos.x, this.eye + this.pos.y + bobY - this.landDip, this.pos.z);
    camera.rotation.set(this.pitch, this.yaw, this.roll);
  }
}
export const player = new Player();

/* ================= BASE WORLD CLASS ================= */
export class World {
  constructor(key) {
    this.scene = new THREE.Scene();
    this.key = key;
    this.landmarks = [];
    this.animFns = [];
    this.bursts = [];
    this.rides = [];
    this.riding = null;
    this.vehicles = [];
    this.drivingVehicle = null;
    this.npcSystem = new NPCSystem(this.scene, this, sfx);
    this.spawn = { x: 0, z: 20, yaw: 0 };
    this.fovBase = 68;
    this.gravity = 22;
    this.jumpV = 7.4;
  }
  landmark(def) {
    def.found = !!(disc[this.key] && disc[this.key][def.id]);
    const b = makeBeacon(def.color || WORLDS[this.key].hex);
    b.position.set(def.x, 0, def.z);
    if (def.found) b.visible = false;
    def.beacon = b;
    this.scene.add(b);
    this.landmarks.push(def);
    const ph = def.x * .7;
    this.animFns.push((dt, t) => {
      if (def.found) return;
      b.userData.gem.rotation.y += dt * 2.2;
      b.position.y = Math.sin(t * 2 + ph) * .12;
      b.userData.ring.material.opacity = .35 + .2 * Math.sin(t * 3 + ph);
    });
  }
  addVehicle(type, x, z, yaw, name, color) {
    const v = new Vehicle(this.scene, this, type, x, z, yaw, name, color);
    this.vehicles.push(v);
    return v;
  }
  update(dt, t) {
    for (const f of this.animFns) f(dt, t);
    for (let i = this.bursts.length - 1; i >= 0; i--) if (this.bursts[i].update(dt)) this.bursts.splice(i, 1);
    this.npcSystem.update(dt, monsterSystem, weaponManager);
    for (const v of this.vehicles) v.update(dt, input, sfx);
  }
  updateRide(dt, t) { }
  clampBounds(p) { }
  dispose() {
    this.vehicles.forEach(v => v.dispose());
    this.vehicles = [];
    this.npcSystem.clear();
  }
}

/* ================= 9 DUNIA IMPLEMENTASI ================= */

// 1. TAMAN SEROJA
class ParkWorld extends World {
  constructor() {
    super('park');
    this.spawn = { x: 0, z: 28, yaw: 0 };
    const S = this.scene;
    S.background = new THREE.Color(0xa5e0f7);
    S.fog = new THREE.Fog(0xc2ebf9, 70, 220);
    S.add(skyDome(['#4fa8e8', '#86ccf4', '#c9ecf8', '#e8f7fd']));
    S.add(new THREE.HemisphereLight(0xe8f5e9, 0x4a6b4a, .9));
    const dl = new THREE.DirectionalLight(0xfff6dd, 1.2); dl.position.set(40, 70, 30); S.add(dl);

    // Ground grass
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M.std(0x62b872, { r: .95 }));
    grass.rotation.x = -Math.PI / 2; S.add(grass);

    // Lake
    const lake = new THREE.Mesh(new THREE.CircleGeometry(24, 36), M.std(0x38a8e8, { r: .1, m: .4 }));
    lake.rotation.x = -Math.PI / 2; lake.position.set(-15, .04, -8); S.add(lake);

    // Fountain
    const fBasin = cyl(6, 6.4, .6, M.std(0xe0d6ca), 24); fBasin.position.set(0, .3, 0); S.add(fBasin);
    const fJet = cyl(.4, .6, 2.2, M.std(0xe0d6ca), 12); fJet.position.set(0, 1.2, 0); S.add(fJet);

    // Trees
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const r = 26 + Math.random() * 40;
      const tx = Math.cos(a) * r, tz = Math.sin(a) * r;
      const trunk = cyl(.2, .3, 2.2, M.std(0x6e4a28), 6); trunk.position.set(tx, 1.1, tz);
      const crown = sph(1.6, M.std(0x429955, { r: .9 }), 8); crown.position.set(tx, 2.8, tz);
      S.add(trunk, crown);
    }

    // Vehicle: Prisma Buggy
    this.addVehicle('buggy', 8, 18, 0, 'Prisma Buggy', 0x7ce3a0);

    // NPCs
    this.npcSystem.addNPC({
      id: 'citra', name: 'Citra', role: 'civilian', title: 'Sang Botanis · Taman Seroja',
      speech: 'Halo pengelana! Bunga-bunga seroja ini bersinar indah di pagi hari. Tapi waspadalah, kabarnya ada anomali Titan yang mengintai!',
      x: 3, z: 12, cloth: 0x7ce3a0
    });
    this.npcSystem.addNPC({
      id: 'rian', name: 'Rian', role: 'guard', title: 'Pengawal Keamanan Seroja',
      speech: 'Aku bersiaga di sini untuk melindungi warga dari serangan monster. Jika portal terbuka, tembakkan senjatamu!',
      x: -4, z: 16, cloth: 0x2e3b4e
    });

    const AC = WORLDS.park.hex;
    this.landmark({ id: 'fountain', x: 0, z: 0, r: 5, color: AC, icon: 'water', title: 'Air Mancur Pusat', fact: 'Pusat pertemuan warga Taman Seroja yang selalu jernih dan tenang.' });
    this.landmark({ id: 'lake', x: -15, z: -8, r: 8, color: AC, icon: 'waves', title: 'Danau Teratai Biru', fact: 'Danau alami di mana pantulan awan tampak seperti cermin cair.' });
    this.landmark({ id: 'pavilion', x: 18, z: -12, r: 5, color: AC, icon: 'roofing', title: 'Gazebo Bunga', fact: 'Tempat berteduh favorit para pelancong saat matahari terik.' });
    this.landmark({ id: 'bridge', x: -15, z: 14, r: 4, color: AC, icon: 'panorama_horizontal', title: 'Jembatan Kayu', fact: 'Menghubungkan tepian danau dengan bukit pinus kecil.' });
    this.landmark({ id: 'statue', x: 22, z: 16, r: 4, color: AC, icon: 'person', title: 'Monumen Harmoni', fact: 'Didirikan sebagai lambang persahabatan antar dunia Prisma.' });
  }
  clampBounds(p) { const r = Math.hypot(p.x, p.z); if (r > 75) { p.x *= 75 / r; p.z *= 75 / r; } }
}

// 2. AREA SERVER
class ServerWorld extends World {
  constructor() {
    super('server');
    this.spawn = { x: 0, z: 24, yaw: 0 };
    const S = this.scene;
    S.background = new THREE.Color(0x0e1822);
    S.fog = new THREE.Fog(0x122230, 40, 160);
    S.add(skyDome(['#0a1420', '#102838', '#1c4558', '#4de3d4']));
    S.add(new THREE.HemisphereLight(0x4de3d4, 0x081018, .8));
    const dl = new THREE.DirectionalLight(0x7df6ea, 1.1); dl.position.set(20, 50, 20); S.add(dl);

    // Floor grids
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(350, 350), M.std(0x141e28, { r: .4, m: .7 }));
    fl.rotation.x = -Math.PI / 2; S.add(fl);

    // Server Racks
    for (let x = -30; x <= 30; x += 12) {
      for (let z = -30; z <= 10; z += 15) {
        if (Math.abs(x) < 8 && Math.abs(z) < 8) continue;
        const rack = box(2.4, 6.2, 4.2, M.std(0x182432, { r: .3, m: .8 }));
        rack.position.set(x, 3.1, z);
        const neon = box(2.45, .12, 4.25, M.bas(0x4de3d4));
        neon.position.set(x, 4.2, z);
        S.add(rack, neon);
      }
    }

    // Vehicle: Quantum Hovercar
    this.addVehicle('hovercar', 6, 16, 0, 'Quantum Hover', 0x4de3d4);

    // NPCs
    this.npcSystem.addNPC({
      id: 'ray', name: 'Mekanik Ray', role: 'civilian', title: 'Admin Sistem Inti',
      speech: 'Suhu prosesor meningkat! Anomali kode sedang menarik perhatian monster titan ke mainframe.',
      x: 3, z: 8, cloth: 0x4de3d4
    });
    this.npcSystem.addNPC({
      id: 'sentry', name: 'Unit Patroli S-01', role: 'guard', title: 'Robot Keamanan Server',
      speech: 'Protokol pertahanan aktif. Mengisi daya blaster plasma untuk mengamankan data warga.',
      x: -4, z: 12, cloth: 0x1f4455
    });

    const AC = WORLDS.server.hex;
    this.landmark({ id: 'core', x: 0, z: 0, r: 6, color: AC, icon: 'memory', title: 'Inti Komputasi Quantum', fact: 'Tempat miliaran data dunia Prisma diproses dalam bentuk kristal cahaya.' });
    this.landmark({ id: 'fan', x: 24, z: -20, r: 6, color: AC, icon: 'mode_fan', title: 'Kipas Pendingin Raksasa', fact: 'Menjaga temperatur server tetap beku meski Titan mengamuk.' });
    this.landmark({ id: 'relay', x: -24, z: -18, r: 5, color: AC, icon: 'cell_tower', title: 'Relai Frekuensi Tinggi', fact: 'Memancarkan sinyal ke stasiun antariksa Helios di orbit.' });
    this.landmark({ id: 'terminal', x: 18, z: 18, r: 4, color: AC, icon: 'terminal', title: 'Terminal Operator', fact: 'Pusat diagnosis anomali sistem sebelum portal monster terbuka.' });
    this.landmark({ id: 'substation', x: -18, z: 20, r: 4, color: AC, icon: 'electric_bolt', title: 'Gardu Daya Neon', fact: 'Mengalirkan daya plasma ke seluruh sirkuit kota.' });
  }
  clampBounds(p) { const r = Math.hypot(p.x, p.z); if (r > 68) { p.x *= 68 / r; p.z *= 68 / r; } }
}

// 3. KOTA SENJA
class CityWorld extends World {
  constructor() {
    super('city');
    this.spawn = { x: 0, z: 26, yaw: 0 };
    const S = this.scene;
    S.background = new THREE.Color(0x351a28);
    S.fog = new THREE.Fog(0x4a2236, 50, 180);
    S.add(skyDome(['#1e0d1d', '#5c223c', '#c45a4a', '#ffb36b']));
    S.add(new THREE.HemisphereLight(0xffb36b, 0x1c121e, .9));
    const sun = new THREE.DirectionalLight(0xffa868, 1.4); sun.position.set(-50, 40, -40); S.add(sun);

    // Asphalt ground
    const street = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M.std(0x221a24, { r: .7 }));
    street.rotation.x = -Math.PI / 2; S.add(street);

    // Skyscrapers
    for (let x = -40; x <= 40; x += 20) {
      for (let z = -40; z <= 0; z += 20) {
        if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
        const h = 18 + Math.random() * 26;
        const bldg = box(14, h, 14, M.std(0x2d2232, { r: .5, m: .5 }));
        bldg.position.set(x, h / 2, z);
        S.add(bldg);
      }
    }

    // Vehicle: Cyber Roadster
    this.addVehicle('roadster', 8, 14, 0, 'Cyber Roadster', 0xffb36b);

    // NPCs
    this.npcSystem.addNPC({
      id: 'barista', name: 'Barista Senja', role: 'civilian', title: 'Pemilik Kafe Neon',
      speech: 'Kopi hangat siap disajikan! Hati-hati, jika suara langkah kaki Titan berdentum, larilah ke kafe ini!',
      x: 2, z: 12, cloth: 0xffb36b
    });
    this.npcSystem.addNPC({
      id: 'cop', name: 'Polisi Kota Senja', role: 'guard', title: 'Satuan Keamanan Distrik',
      speech: 'Area ini dalam pengawasan. Jika Titan mencoba menginjak gedung, bantu kami dengan senapan serbumu!',
      x: -6, z: 14, cloth: 0x4d3855
    });

    const AC = WORLDS.city.hex;
    this.landmark({ id: 'plaza', x: 0, z: 0, r: 6, color: AC, icon: 'storefront', title: 'Plaza Neon Senja', fact: 'Pusat kehidupan kota di mana aroma kopi dan gemerlap billboard bertemu.' });
    this.landmark({ id: 'monorail', x: 0, z: -25, r: 6, color: AC, icon: 'tram', title: 'Stasiun Monorel Layang', fact: 'Jalur kereta cepat yang membelah gedung pencakar langit.' });
    this.landmark({ id: 'screen', x: 26, z: -10, r: 5, color: AC, icon: 'tv', title: 'Layar Hologram Raksasa', fact: 'Menampilkan berita cuaca senja dan peringatan darurat monster.' });
    this.landmark({ id: 'alley', x: -25, z: 12, r: 5, color: AC, icon: 'nightlife', title: 'Gang Lampion Neon', fact: 'Lorong penuh warung lampion yang menyala syahdu saat petang tiba.' });
    this.landmark({ id: 'bridge_city', x: 18, z: 20, r: 4, color: AC, icon: 'bridge', title: 'Jembatan Senja Barat', fact: 'Pemandangan matahari terbenam paling indah di seluruh kota.' });
  }
  clampBounds(p) { const r = Math.hypot(p.x, p.z); if (r > 72) { p.x *= 72 / r; p.z *= 72 / r; } }
}

// 4. PRISMA LAND (Amusement Park: Biang Lala, Komedi Putar, Coaster, Drop Tower, Viking Ship, Cangkir Putar, Rhythm Game & Shooting Gallery)
class FunWorld extends World {
  constructor() {
    super('funfair');
    this.spawn = { x: 0, z: 42, yaw: 0 };
    const S = this.scene;
    S.background = new THREE.Color(0x2d153e);
    S.fog = new THREE.Fog(0x4a1e52, 80, 260);
    S.add(skyDome(['#1e102f', '#5e2365', '#ff4d82', '#ffc163']));
    S.add(new THREE.HemisphereLight(0xffe6f2, 0x2a1b3d, 1.0));
    const dl = new THREE.DirectionalLight(0xffecd0, 1.35); dl.position.set(-50, 75, 30); S.add(dl);

    // Park Ground with festival paths
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), M.std(0x3e8a52, { r: 0.9 }));
    ground.rotation.x = -Math.PI / 2; S.add(ground);

    // Paved Central Plaza
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(32, 32), M.std(0x5a6372, { r: 0.8 }));
    plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.02; S.add(plaza);

    // Instantiate complete park attractions & atmosphere manager!
    this.parkManager = new FunfairParkManager(this, S);

    // Rides available to board and ride!
    this.rides = [
      { type: 'coaster', x: this.stX, z: this.stZ, r: 6.5, label: 'Prisma Cyclone (Coaster)', icon: 'rocket_launch', exit: { x: this.stX - 2, z: this.stZ, yaw: Math.PI / 2 } },
      { type: 'carousel', x: 0, z: -6, r: 7.5, label: 'Komedi Putar Prisma', icon: 'toys', exit: { x: 7.5, z: -6, yaw: Math.PI / 2 } },
      { type: 'wheel', x: this.parkManager.wheelX, z: this.parkManager.wheelZ, r: 8.5, label: 'Bianglala Senja (Ferris Wheel)', icon: 'donut_large', exit: { x: this.parkManager.wheelX, z: this.parkManager.wheelZ + 10, yaw: 0 } },
      { type: 'droptower', x: this.parkManager.dropX, z: this.parkManager.dropZ, r: 6.5, label: 'Menara Terjun Bebas (Drop Tower)', icon: 'arrow_downward', exit: { x: this.parkManager.dropX + 5, z: this.parkManager.dropZ, yaw: Math.PI / 2 } },
      { type: 'vikingship', x: this.parkManager.shipX, z: this.parkManager.shipZ, r: 7.5, label: 'Kapal Bajak Laut (Viking Ship)', icon: 'sailing', exit: { x: this.parkManager.shipX + 6, z: this.parkManager.shipZ, yaw: Math.PI / 2 } },
      { type: 'teacups', x: this.parkManager.cupX, z: this.parkManager.cupZ, r: 8.5, label: 'Cangkir Berputar (Spinning Teacups)', icon: 'coffee', exit: { x: this.parkManager.cupX + 8, z: this.parkManager.cupZ, yaw: Math.PI / 2 } }
    ];

    // Interactive minigames booths!
    this.minigames = [
      { id: 'rhythm', x: this.parkManager.rhythmX, z: this.parkManager.rhythmZ, r: 6.0, label: 'Main Prisma Beat (Rhythm Game)', icon: 'music_note' },
      { id: 'shooting', x: this.parkManager.shootX, z: this.parkManager.shootZ, r: 6.0, label: 'Main Tembak Sasaran Karnaval', icon: 'crisis_alert' }
    ];

    // Vehicle: Cyclone Racer Kart
    this.addVehicle('kart', 12, 34, 0, 'Cyclone Kart', 0xff3b94);

    // NPCs
    this.npcSystem.addNPC({
      id: 'luna', name: 'Luna', role: 'civilian', title: 'Pemandu Wahana Prisma',
      speech: 'Selamat datang di Prisma Land! Coba semua wahana: Bianglala, Komedi Putar, Coaster, Drop Tower, Kapal Ayun, dan Arkade Musik Prisma Beat!',
      x: 4, z: 24, cloth: 0xff3b94
    });
    this.npcSystem.addNPC({
      id: 'guard_fun', name: 'Satpam Bobi', role: 'guard', title: 'Keamanan Taman Bermain',
      speech: 'Aku selalu waspada menjaga keamanan festival! Nikmati wahana dan arkade sepuasnya!',
      x: -4, z: 28, cloth: 0x3d2b4a
    });
    this.npcSystem.addNPC({
      id: 'dj_max', name: 'DJ Max', role: 'civilian', title: 'DJ Panggung Prisma Beat',
      speech: 'Siap menari dan ikuti ketukan? Buka arkade musik Prisma Beat di panggung neon ini!',
      x: this.parkManager.rhythmX + 2.5, z: this.parkManager.rhythmZ + 1.2, cloth: 0x00d2ff
    });

    const AC = WORLDS.funfair.hex;
    this.landmark({ id: 'coaster', x: this.stX, z: this.stZ, r: 6.5, color: AC, icon: 'rocket_launch', title: 'Stasiun Prisma Cyclone', fact: 'Roller coaster 5 menit legendaris dengan kecepatan 160 km/j dan 6 putaran!' });
    this.landmark({ id: 'carousel', x: 0, z: -6, r: 7, color: AC, icon: 'toys', title: 'Komedi Putar Prisma', fact: 'Wahana klasik dengan kuda-kuda kayu berukir halus & lampu gemerlap.' });
    this.landmark({ id: 'wheel', x: this.parkManager.wheelX, z: this.parkManager.wheelZ, r: 8, color: AC, icon: 'donut_large', title: 'Bianglala Senja', fact: 'Melihat panorama seluruh taman bermain dari ketinggian 28 meter!' });
    this.landmark({ id: 'droptower', x: this.parkManager.dropX, z: this.parkManager.dropZ, r: 6.5, color: AC, icon: 'arrow_downward', title: 'Menara Terjun Bebas', fact: 'Sensasi terjun bebas dari puncak menara baja 38 meter!' });
    this.landmark({ id: 'vikingship', x: this.parkManager.shipX, z: this.parkManager.shipZ, r: 7, color: AC, icon: 'sailing', title: 'Kapal Bajak Laut Samudra', fact: 'Sensasi terombang-ambing di udara dengan ayunan pendulum raksasa 75 derajat.' });
    this.landmark({ id: 'teacups', x: this.parkManager.cupX, z: this.parkManager.cupZ, r: 7.5, color: AC, icon: 'coffee', title: 'Wahana Cangkir Berputar', fact: 'Berputar ria di dalam cangkir raksasa mengelilingi teko emas.' });
    this.landmark({ id: 'rhythm', x: this.parkManager.rhythmX, z: this.parkManager.rhythmZ, r: 6, color: AC, icon: 'music_note', title: 'Panggung Prisma Beat', fact: 'Arkade musik ritme interaktif dengan lagu-lagu synthesizer berenergi tinggi.' });
    this.landmark({ id: 'shooting', x: this.parkManager.shootX, z: this.parkManager.shootZ, r: 6, color: AC, icon: 'crisis_alert', title: 'Stan Tembak Sasaran', fact: 'Uji ketangkasan menembak bebek renang dan bintang emas dalam 30 detik!' });
  }

  update(dt, t) {
    super.update(dt, t);
    if (this.parkManager) {
      this.parkManager.update(dt, t);
    }
  }

  // FIXED RIDE CAMERA FOR ALL RIDES
  updateRide(dt, t) {
    const r = this.riding;
    if (!r) return;
    r.elapsed += dt;
    r.yawOff -= input.lookX;
    r.pitchOff = clamp(r.pitchOff - input.lookY, -1.3, 1.3);
    input.lookX = input.lookY = 0;

    if (r.type === 'coaster') {
      const c = this.coaster;
      r.v = damp(r.v, 14 + r.lap * 6.5, 1.8, dt);
      r.s += r.v * dt;
      const u = ((r.s % c.L) / c.L + 1) % 1;
      const newLap = Math.floor(r.s / c.L);
      if (newLap !== r.lap) {
        r.lap = newLap;
        if (newLap >= 6) {
          snackbar('Prisma Cyclone selesai! Terima kasih sudah menaiki wahana.');
          exitRide();
          return;
        }
        snackbar(`Prisma Cyclone: LAP ${r.lap + 1}/6!`);
      }
      const p1 = c.curve.getPointAt(u);
      const p2 = c.curve.getPointAt((u + .008) % 1);
      const tangent = p2.clone().sub(p1).normalize();

      camera.position.copy(p1).add(new THREE.Vector3(0, 1.2, 0));
      camera.lookAt(p1.clone().add(tangent.clone().multiplyScalar(10)));
      camera.rotateY(r.yawOff);
      camera.rotateX(r.pitchOff);
      sfx.setWind(r.v);
    } else if (r.type === 'carousel') {
      const a = this.parkManager ? this.parkManager.carAng : 0;
      camera.position.set(Math.cos(a) * 4.2, 1.8 + Math.sin(t * 3.2) * 0.35, -6 + Math.sin(a) * 4.2);
      camera.rotation.set(r.pitchOff, -a + Math.PI / 2 + r.yawOff, 0);
    } else if (r.type === 'wheel') {
      const a = this.parkManager ? this.parkManager.wheelAng : 0;
      const px = this.parkManager.wheelX + Math.cos(a) * this.parkManager.wheelR;
      const py = this.parkManager.wheelY + Math.sin(a) * this.parkManager.wheelR;
      camera.position.set(px, py + 1.1, this.parkManager.wheelZ);
      camera.rotation.set(r.pitchOff, Math.PI / 2 + r.yawOff, 0);
    } else if (r.type === 'droptower') {
      const dy = this.parkManager ? this.parkManager.dropY : 2;
      camera.position.set(this.parkManager.dropX, dy + 1.3, this.parkManager.dropZ + 2.4);
      camera.rotation.set(r.pitchOff, r.yawOff, 0);
      if (this.parkManager && this.parkManager.dropState === 'drop') {
        sfx.setWind(28);
      } else {
        sfx.setWind(0);
      }
    } else if (r.type === 'vikingship') {
      const sa = this.parkManager ? this.parkManager.shipAng : 0;
      const pz = this.parkManager.shipZ + Math.sin(sa) * this.parkManager.shipArmLen;
      const py = 18.2 - Math.cos(sa) * this.parkManager.shipArmLen;
      camera.position.set(this.parkManager.shipX, py + 1.2, pz);
      camera.rotation.set(sa + r.pitchOff, Math.PI / 2 + r.yawOff, 0);
    } else if (r.type === 'teacups') {
      const ta = this.parkManager ? this.parkManager.teacupsAng : 0;
      const px = this.parkManager.cupX + Math.cos(ta) * 4.8;
      const pz = this.parkManager.cupZ + Math.sin(ta) * 4.8;
      camera.position.set(px, 1.5, pz);
      camera.rotation.set(r.pitchOff, ta * 3.2 + r.yawOff, 0);
    }

    updateRideHUD(r);
  }
  clampBounds(p) {
    const r = Math.hypot(p.x, p.z);
    if (r > 150) { p.x *= 150 / r; p.z *= 150 / r; }
  }
}

// 5. PANTAI KARANG
class BeachWorld extends World {
  constructor() {
    super('beach');
    this.spawn = { x: 0, z: 28, yaw: 0 };
    const S = this.scene;
    S.background = new THREE.Color(0x8fd2f3);
    S.fog = new THREE.Fog(0xbfe3f5, 70, 200);
    S.add(skyDome(['#2f7fd8', '#7ec3f0', '#cfeefb', '#ffe9d0']));
    S.add(new THREE.HemisphereLight(0xbfe8ff, 0xd9c290, .95));
    const sun = new THREE.DirectionalLight(0xfff1d6, 1.3); sun.position.set(50, 70, 30); S.add(sun);

    // Ocean & Sand
    const sea = new THREE.Mesh(new THREE.CircleGeometry(320, 36), M.std(0x2f9fd8, { r: .1, m: .3 }));
    sea.rotation.x = -Math.PI / 2; sea.position.y = -.1; S.add(sea);
    const sand = new THREE.Mesh(new THREE.CircleGeometry(65, 36), M.std(0xe6d29e, { r: .95 }));
    sand.rotation.x = -Math.PI / 2; S.add(sand);

    // Lighthouse
    const lh = cyl(2, 3.2, 18, M.std(0xf0ede8), 16); lh.position.set(35, 9, -20);
    const lhTop = cyl(2.2, 2.2, 2, M.std(0xff3550), 16); lhTop.position.set(35, 19, -20);
    S.add(lh, lhTop);

    // Vehicle: Dune Buggy
    this.addVehicle('dune_buggy', 8, 16, 0, 'Dune Buggy Pantai', 0x5ec8f2);

    // NPCs
    this.npcSystem.addNPC({
      id: 'bram', name: 'Kapten Bram', role: 'civilian', title: 'Pelaut Pantai Karang',
      speech: 'Ombak hari ini membawa cerita kuno tentang monster yang tertidur di dasar palung laut!',
      x: 3, z: 14, cloth: 0x5ec8f2
    });
    this.npcSystem.addNPC({
      id: 'guard_beach', name: 'Pengawas Pantai', role: 'guard', title: 'Penjaga Menara Mercusuar',
      speech: 'Menara suar siap memandu kapal dan menembaki monster jika mereka mendekati garis pantai!',
      x: -5, z: 18, cloth: 0x243e4f
    });

    const AC = WORLDS.beach.hex;
    this.landmark({ id: 'lighthouse', x: 35, z: -20, r: 6, color: AC, icon: 'light', title: 'Mercusuar Karang', fact: 'Telah memandu kapal selama dua ratus tahun melewati karang tajam.' });
    this.landmark({ id: 'pier', x: 0, z: -18, r: 5, color: AC, icon: 'anchor', title: 'Dermaga Kayu Camar', fact: 'Tempat bertenggernya ratusan burung camar setiap sore hari.' });
    this.landmark({ id: 'reef', x: -30, z: 0, r: 6, color: AC, icon: 'water', title: 'Taman Karang Biru', fact: 'Terumbu karang dangkal penuh ikan bercahaya warna-warni.' });
    this.landmark({ id: 'palms', x: 18, z: 12, r: 4, color: AC, icon: 'nature', title: 'Hutan Kelapa', fact: 'Pohon-pohon kelapa menjulang tinggi tertiup angin sepoi-sepoi.' });
    this.landmark({ id: 'shell', x: -14, z: 20, r: 4, color: AC, icon: 'scatter_plot', title: 'Gua Kerang Kristal', fact: 'Gua kecil di mana kerang-kerang mengeluarkan desau ombak abadi.' });
  }
  clampBounds(p) { const r = Math.hypot(p.x, p.z); if (r > 62) { p.x *= 62 / r; p.z *= 62 / r; } }
}

// 6. GURUN KALARIS
class DesertWorld extends World {
  constructor() {
    super('desert');
    this.spawn = { x: 0, z: 28, yaw: 0 };
    const S = this.scene;
    S.background = new THREE.Color(0xb56338);
    S.fog = new THREE.Fog(0xd27d4c, 60, 210);
    S.add(skyDome(['#381c10', '#7a381e', '#d26a38', '#ffc285']));
    S.add(new THREE.HemisphereLight(0xffcaa0, 0x3d2212, .9));
    const sun = new THREE.DirectionalLight(0xffeedd, 1.4); sun.position.set(-60, 50, 30); S.add(sun);

    // Sand Plane
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(450, 450), M.std(0xdca068, { r: .95 }));
    ground.rotation.x = -Math.PI / 2; S.add(ground);

    // Ancient Pyramid
    const pyr = new THREE.Mesh(new THREE.ConeGeometry(24, 28, 4), M.std(0xc4854c, { r: .9 }));
    pyr.position.set(0, 14, -36); pyr.rotation.y = Math.PI / 4; S.add(pyr);

    // Vehicle: Kalaris Rover
    this.addVehicle('sand_crawler', 8, 16, 0, 'Kalaris Rover', 0xff9d5c);

    // NPCs
    this.npcSystem.addNPC({
      id: 'malik', name: 'Malik', role: 'civilian', title: 'Pengembara Karavan Kuno',
      speech: 'Pasir ini menyimpan rahasia ribuan tahun. Jangan remehkan gemuruh di kejauhan — itu langkah kaki Titan!',
      x: 3, z: 14, cloth: 0xff9d5c
    });
    this.npcSystem.addNPC({
      id: 'guard_desert', name: 'Penjaga Oasis', role: 'guard', title: 'Pemanah Senjata Plasma',
      speech: 'Kami menjaga persediaan air oasis dari monster gurun. Tembak mereka tepat di mata!',
      x: -5, z: 18, cloth: 0x4a2a16
    });

    const AC = WORLDS.desert.hex;
    this.landmark({ id: 'pyramid', x: 0, z: -36, r: 8, color: AC, icon: 'change_history', title: 'Piramida Kalaris', fact: 'Piramida purba yang menurut legenda dibangun oleh para Titan zaman dahulu.' });
    this.landmark({ id: 'oasis', x: -22, z: 4, r: 6, color: AC, icon: 'water_drop', title: 'Oasis Tersembunyi', fact: 'Satu-satunya mata air jernih yang tak pernah kering di tengah gurun.' });
    this.landmark({ id: 'camp', x: 20, z: 8, r: 5, color: AC, icon: 'fireplace', title: 'Kamp Pengembara', fact: 'Tempat para pengelana berkumpul di sekitar api unggun saat malam dingin.' });
    this.landmark({ id: 'statue_desert', x: -16, z: -20, r: 4, color: AC, icon: 'monument', title: 'Patung Sphinx Terkubur', fact: 'Tenggelam setengah badan di dalam badai pasir berabad-abad.' });
    this.landmark({ id: 'canyon', x: 24, z: -24, r: 5, color: AC, icon: 'landscape', title: 'Jurang Kalaris', fact: 'Celah ngarai bebatuan merah tempat angin berdesau kencang.' });
  }
  clampBounds(p) { const r = Math.hypot(p.x, p.z); if (r > 74) { p.x *= 74 / r; p.z *= 74 / r; } }
}

// 7. PUNCAK ESNA
class SnowWorld extends World {
  constructor() {
    super('snow');
    this.spawn = { x: 0, z: 26, yaw: 0 };
    const S = this.scene;
    S.background = new THREE.Color(0xb8e6f8);
    S.fog = new THREE.Fog(0xd4f0fc, 50, 190);
    S.add(skyDome(['#3f729b', '#78b5db', '#c0e7f7', '#f4fbfe']));
    S.add(new THREE.HemisphereLight(0xffffff, 0x6e8a9c, 1.0));
    const sun = new THREE.DirectionalLight(0xfff8ee, 1.3); sun.position.set(-30, 60, 40); S.add(sun);

    // Snow Ground & Ice Lake
    const snow = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M.std(0xf0f6fa, { r: .95 }));
    snow.rotation.x = -Math.PI / 2; S.add(snow);
    const ice = new THREE.Mesh(new THREE.CircleGeometry(18, 32), M.std(0xa4d8ee, { r: .08, m: .3 }));
    ice.rotation.x = -Math.PI / 2; ice.position.set(-16, .05, -10); S.add(ice);

    // Cabin
    const cabin = box(6, 4, 5, M.std(0x6e482d)); cabin.position.set(16, 2, -12); S.add(cabin);

    // Vehicle: Frost Snowmobile
    this.addVehicle('snowmobile', 6, 14, 0, 'Frost Snowmobile', 0xa5e8ff);

    // NPCs
    this.npcSystem.addNPC({
      id: 'freya', name: 'Freya', role: 'civilian', title: 'Pemandu Gletser Esna',
      speech: 'Keluarga salju di sini menyambut siapa pun yang kedinginan. Ada teh panas di kabin!',
      x: 2, z: 12, cloth: 0xa5e8ff
    });
    this.npcSystem.addNPC({
      id: 'guard_snow', name: 'Penjaga Suar Salju', role: 'guard', title: 'Penjaga Puncak Gunung',
      speech: 'Suhu ekstrem tak memadamkan kewaspadaan kami. Monster beku sedang mendekat dari lembah!',
      x: -4, z: 16, cloth: 0x2d485e
    });

    const AC = WORLDS.snow.hex;
    this.landmark({ id: 'cabin', x: 16, z: -12, r: 5, color: AC, icon: 'cottage', title: 'Kabin Kayu Hangat', fact: 'Tempat berteduh dari badai es dengan perapian kayu yang selalu menyala.' });
    this.landmark({ id: 'ice_lake', x: -16, z: -10, r: 7, color: AC, icon: 'ice_skating', title: 'Danau Es Kristal', fact: 'Esnya jernih sedalam dua meter dengan pantulan puncak gunung.' });
    this.landmark({ id: 'snowmen', x: 2, z: 18, r: 4, color: AC, icon: 'emoji_people', title: 'Keluarga Boneka Salju', fact: 'Tiga boneka salju yang setia menjaga jalan setapak menuju puncak.' });
    this.landmark({ id: 'peak', x: 0, z: -30, r: 6, color: AC, icon: 'flag', title: 'Puncak Esna', fact: 'Titik tertinggi dengan bendera yang berkibar megah di atas awan.' });
    this.landmark({ id: 'pine', x: -24, z: 14, r: 4, color: AC, icon: 'park', title: 'Pinus Tertua', fact: 'Pohon pinus seratus tahun yang tetap hijau di tengah salju abadi.' });
  }
  clampBounds(p) { const r = Math.hypot(p.x, p.z); if (r > 68) { p.x *= 68 / r; p.z *= 68 / r; } }
}

// 8. HUTAN LUNARIA
class ForestWorld extends World {
  constructor() {
    super('forest');
    this.spawn = { x: 0, z: 28, yaw: 0 };
    const S = this.scene;
    S.background = new THREE.Color(0x061122);
    S.fog = new THREE.Fog(0x0a1b33, 30, 110);
    S.add(skyDome(['#020612', '#061328', '#0b2646', '#124174']));
    S.add(new THREE.HemisphereLight(0x38bdf8, 0x06121f, .75));
    const moon = new THREE.DirectionalLight(0x7dd3fc, .85); moon.position.set(30, 50, 20); S.add(moon);

    // Forest Ground
    const forestGround = new THREE.Mesh(new THREE.PlaneGeometry(380, 380), M.std(0x102524, { r: .95 }));
    forestGround.rotation.x = -Math.PI / 2; S.add(forestGround);

    // Ancient Rune Tree
    const treeTrunk = cyl(2.2, 3, 13, M.std(0x182c40), 12); treeTrunk.position.set(-16, 6.5, -12);
    const rune = new THREE.Mesh(new THREE.TorusGeometry(4.2, .09, 8, 36), M.bas(0x38bdf8, { transparent: true, opacity: .85 }));
    rune.rotation.x = Math.PI / 2; rune.position.set(-16, .15, -12);
    S.add(treeTrunk, rune);

    // Giant glowing mushrooms & crystals
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const r = 16 + Math.random() * 32;
      const mx = Math.cos(a) * r, mz = Math.sin(a) * r;
      const st = cyl(.15, .25, .8, M.lam(0xc7e1f4), 6); st.position.set(mx, .4, mz);
      const cap = sph(.6, M.bas([0x38bdf8, 0x2dd4bf, 0x60a5fa][i % 3]), 8); cap.scale.y = .5; cap.position.set(mx, .9, mz);
      S.add(st, cap);
    }

    // Vehicle: Lunaria Glider
    this.addVehicle('glider', 6, 16, 0, 'Lunaria Glider', 0x38bdf8);

    // NPCs
    this.npcSystem.addNPC({
      id: 'lumina', name: 'Lumina', role: 'civilian', title: 'Peri Cahaya Lunaria',
      speech: 'Rune kristal safir di pohon purba bergetar pelan. Cahaya kunang-kunang akan membimbingmu melewati kegelapan!',
      x: 3, z: 12, cloth: 0x38bdf8
    });
    this.npcSystem.addNPC({
      id: 'guard_forest', name: 'Penjaga Hutan Purba', role: 'guard', title: 'Pemanah Cahaya Bulan',
      speech: 'Hutan ini sakral. Kami tidak akan membiarkan monster Titan mencemari kolam cahaya!',
      x: -5, z: 16, cloth: 0x0f2438
    });

    const AC = WORLDS.forest.hex;
    this.landmark({ id: 'ancient_tree', x: -16, z: -12, r: 6, color: AC, icon: 'forest', title: 'Pohon Purba Lunaria', fact: 'Pohon tertua dengan ukiran rune magis yang menyala saat bulan purnama.' });
    this.landmark({ id: 'stones', x: 14, z: 16, r: 6, color: AC, icon: 'diamond', title: 'Lingkar Batu Kristal', fact: 'Delapan batu pelindung yang beresonansi dengan detak jantung hutan.' });
    this.landmark({ id: 'shrooms', x: -8, z: 22, r: 5, color: AC, icon: 'spa', title: 'Jamur Raksasa', fact: 'Spora jamur ini menerangi hutan malam dengan warna-warni memikat.' });
    this.landmark({ id: 'pond', x: 6, z: -24, r: 6, color: AC, icon: 'water', title: 'Kolam Cahaya Bulan', fact: 'Airnya memantulkan cahaya bintang bahkan saat langit tertutup kabut.' });
    this.landmark({ id: 'wisps', x: 22, z: -2, r: 4, color: AC, icon: 'auto_awesome', title: 'Lembah Roh Cahaya', fact: 'Kumpulan roh cahaya kecil yang senang menari di antara dedaunan.' });
  }
  clampBounds(p) { const r = Math.hypot(p.x, p.z); if (r > 66) { p.x *= 66 / r; p.z *= 66 / r; } }
}

// 9. STASIUN HELIOS (Orbit & Low Gravity)
class OrbitWorld extends World {
  constructor() {
    super('orbit');
    this.spawn = { x: 0, z: 26, yaw: 0 };
    this.gravity = 11; // Low gravity!
    this.jumpV = 8.8; // High floating jumps!
    const S = this.scene;
    S.background = new THREE.Color(0x04060d);
    S.fog = new THREE.Fog(0x060914, 50, 220);
    S.add(skyDome(['#02040a', '#060a18', '#0c1630', '#1c3468']));
    S.add(new THREE.HemisphereLight(0x9ad1ff, 0x060a14, .85));
    const dl = new THREE.DirectionalLight(0xe8f4ff, 1.4); dl.position.set(40, 60, -30); S.add(dl);

    // Planet Earth backdrop in space!
    const earth = new THREE.Mesh(new THREE.SphereGeometry(45, 32, 24), M.std(0x286ec4, { r: .4 }));
    earth.position.set(-110, 40, -130); S.add(earth);

    // Station Deck
    const deck = new THREE.Mesh(new THREE.CircleGeometry(65, 32), M.std(0x182434, { r: .3, m: .8 }));
    deck.rotation.x = -Math.PI / 2; S.add(deck);

    // Solar panels
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const sp = box(14, .2, 5, M.std(0x102844, { r: .2, m: .9 }));
      sp.position.set(Math.cos(a) * 44, 4, Math.sin(a) * 44);
      sp.rotation.y = a; S.add(sp);
    }

    // Vehicle: Helios Moon Rover
    this.addVehicle('rover', 8, 14, 0, 'Helios Moon Rover', 0x9ad1ff);

    // NPCs
    this.npcSystem.addNPC({
      id: 'orion', name: 'Komandan Orion', role: 'civilian', title: 'Komandan Stasiun Helios',
      speech: 'Selamat datang di orbit bumi! Gravitasi di sini rendah, membuat lompatanmu melayang jauh ke angkasa.',
      x: 3, z: 12, cloth: 0x9ad1ff
    });
    this.npcSystem.addNPC({
      id: 'guard_space', name: 'Android Sentry-9', role: 'guard', title: 'Robot Pengawal Orbital',
      speech: 'Mendeteksi fluktuasi gravitasi abnormal. Titan luar angkasa sedang memasuki atmosfer stasiun!',
      x: -5, z: 16, cloth: 0x1a2e48
    });

    const AC = WORLDS.orbit.hex;
    this.landmark({ id: 'earth_view', x: 0, z: -28, r: 6, color: AC, icon: 'public', title: 'Balkon Pandang Bumi', fact: 'Pemandangan spektakuler bumi biru yang berputar megah di bawah stasiun.' });
    this.landmark({ id: 'antenna', x: 26, z: 0, r: 5, color: AC, icon: 'satellite', title: 'Antena Komunikasi Utama', fact: 'Menghubungkan sinyal komunikasi antar 9 dunia Prisma.' });
    this.landmark({ id: 'solar', x: -28, z: 0, r: 6, color: AC, icon: 'solar_power', title: 'Panel Surya Orbital', fact: 'Menyerap energi murni matahari untuk menyalakan stasiun.' });
    this.landmark({ id: 'dock', x: 0, z: 32, r: 5, color: AC, icon: 'flight_takeoff', title: 'Dermaga Pesawat Ruang Angkasa', fact: 'Pintu gerbang kedatangan para astronot dari permukaan planet.' });
    this.landmark({ id: 'grav_core', x: 0, z: 0, r: 5, color: AC, icon: 'hub', title: 'Generator Gravitasi Buatan', fact: 'Inti pemutar gravitasi stasiun yang menjaga kita tetap menjejak lantai.' });
  }
  clampBounds(p) { const r = Math.hypot(p.x, p.z); if (r > 62) { p.x *= 62 / r; p.z *= 62 / r; } }
}

const WORLD_CLASSES = {
  park: ParkWorld, server: ServerWorld, city: CityWorld, funfair: FunWorld,
  beach: BeachWorld, desert: DesertWorld, snow: SnowWorld, forest: ForestWorld, orbit: OrbitWorld
};

/* ================= APP CONTROLLER STATE ================= */
export let world = null;
export let worldKey = null;
export let phase = 'menu'; // 'menu', 'travel', 'play', 'paused'
export let weaponManager = null;
export let monsterSystem = null;

export function loadWorld(key) {
  if (world) world.dispose();
  if (monsterSystem) monsterSystem.clearAll();

  sfx.stopWind();
  sfx.stopEngine();

  rideHudEl.classList.add('hidden');
  vehicleHudEl.classList.add('hidden');
  actionPromptEl.classList.remove('show');
  discSheetEl.classList.remove('show');

  worldKey = key;
  world = new WORLD_CLASSES[key]();

  // Initialize Weapon & Monster Systems
  monsterSystem = new MonsterSystem(sfx);
  weaponManager = new WeaponManager(camera, world.scene, sfx);

  const meta = WORLDS[key];
  setAccent(meta.acc);

  hudEl.classList.remove('hidden');
  $('#pauseBtn').classList.remove('hidden');
  $('#raidBtn').classList.remove('hidden');
  $('#minimapToggleBtn')?.classList.remove('hidden');
  if (key === 'funfair') {
    $('#carnivalGamesBtn')?.classList.remove('hidden');
  } else {
    $('#carnivalGamesBtn')?.classList.add('hidden');
  }
  weaponHudEl.classList.remove('hidden');

  $('#hudName').textContent = meta.name;
  updateHUDProgress();
  updateWeaponHUD();

  player.reset(world.spawn.x, world.spawn.z, world.spawn.yaw);
  applyTouchMode(touchMode);

  phase = 'play';
  showIntro(meta);
  pad.start(key);

  if (!touchMode) tryLock();
}

function updateHUDProgress() {
  const found = discCount(worldKey);
  const total = WORLDS[worldKey].total;
  $('#hudCount').textContent = `${found}/${total}`;
  $('#hudFill').style.width = `${(found / total) * 100}%`;
}

function updateWeaponHUD() {
  if (!weaponManager) return;
  const def = weaponManager.current();
  const ammo = weaponManager.currentAmmo();
  $('#wepName').textContent = def.name;
  $('#wepAmmo').textContent = `${ammo.mag} / ${ammo.reserve}`;
  $('#wepIco').textContent = def.icon;
  document.querySelectorAll('.wep-btn').forEach((btn, i) => {
    btn.classList.toggle('active', i === weaponManager.currentIndex);
  });
}

function showIntro(meta) {
  $('#icKicker').textContent = `DUNIA ${meta.idx} · PRISMA WORLDS`;
  $('#icTitle').textContent = meta.name;
  $('#icRule').style.background = meta.acc;
  $('#icChips').innerHTML = `
    <span class="chip"><span class="msr sm">explore</span>${meta.total} Landmark</span>
    <span class="chip"><span class="msr sm">electric_car</span>Kendaraan</span>
    <span class="chip"><span class="msr sm">military_tech</span>Arsenal &amp; Titan</span>
  `;
  introCard.classList.remove('show');
  void introCard.offsetWidth;
  introCard.classList.add('show');
  setTimeout(() => introCard.classList.remove('show'), 2800);
}

/* ================= INTERACTION PROMPT LOGIC ================= */
function checkInteractions() {
  if (!world || phase !== 'play') return;

  // 1. If currently driving a vehicle
  if (world.drivingVehicle) {
    actionPromptEl.classList.remove('show');
    currentPromptTarget = null;
    return;
  }
  // 2. If currently riding coaster/wheel/carousel
  if (world.riding) {
    actionPromptEl.classList.remove('show');
    currentPromptTarget = null;
    return;
  }

  let nearestTarget = null;
  let minDistance = 3.4;

  // Check vehicles
  for (const v of world.vehicles) {
    const d = player.pos.distanceTo(v.pos);
    if (d < minDistance) {
      minDistance = d;
      nearestTarget = { type: 'vehicle', obj: v, label: `Kendarai ${v.name}`, icon: 'electric_car' };
    }
  }

  // Check NPCs
  const npc = world.npcSystem.getNearest(player.pos, minDistance);
  if (npc) {
    minDistance = player.pos.distanceTo(npc.pos);
    nearestTarget = { type: 'npc', obj: npc, label: `Bicara dengan ${npc.name}`, icon: 'forum' };
  }

  // Check rides
  for (const r of world.rides) {
    const d = Math.hypot(player.pos.x - r.x, player.pos.z - r.z);
    if (d < r.r && d < minDistance) {
      minDistance = d;
      nearestTarget = { type: 'ride', obj: r, label: `Naik ${r.label}`, icon: r.icon };
    }
  }

  // Check minigames
  if (world.minigames) {
    for (const mg of world.minigames) {
      const d = Math.hypot(player.pos.x - mg.x, player.pos.z - mg.z);
      if (d < mg.r && d < minDistance) {
        minDistance = d;
        nearestTarget = { type: 'minigame', obj: mg, label: mg.label, icon: mg.icon };
      }
    }
  }

  if (nearestTarget) {
    currentPromptTarget = nearestTarget;
    $('#apTitle').textContent = nearestTarget.label;
    $('#apIcon').textContent = nearestTarget.icon;
    actionPromptEl.classList.add('show');
  } else {
    currentPromptTarget = null;
    actionPromptEl.classList.remove('show');
  }
}

function handleInteraction() {
  if (!currentPromptTarget) return;
  sfx.click();

  if (currentPromptTarget.type === 'vehicle') {
    boardVehicle(currentPromptTarget.obj);
  } else if (currentPromptTarget.type === 'npc') {
    openNPCDialog(currentPromptTarget.obj);
  } else if (currentPromptTarget.type === 'ride') {
    boardRide(currentPromptTarget.obj);
  } else if (currentPromptTarget.type === 'minigame') {
    if (currentPromptTarget.obj.id === 'rhythm') {
      rhythmGame.open();
    } else if (currentPromptTarget.obj.id === 'shooting') {
      carnivalShootingGame.open();
    }
  }
}

// Vehicle Board & Exit
function boardVehicle(v) {
  world.drivingVehicle = v;
  v.mounted = true;
  actionPromptEl.classList.remove('show');
  vehicleHudEl.classList.remove('hidden');
  $('#vhTitle').textContent = v.name;
  snackbar(`Kamu mengendarai ${v.name}! Gunakan WASD/Joystick untuk menyetir.`);
}

function exitVehicle() {
  if (!world || !world.drivingVehicle) return;
  const v = world.drivingVehicle;
  v.mounted = false;
  world.drivingVehicle = null;
  sfx.stopEngine();
  vehicleHudEl.classList.add('hidden');
  const ex = v.getExitPos();
  player.reset(ex.x, ex.z, ex.yaw);
}

// Rides Board & Exit
function boardRide(ride) {
  if (!world || world.riding || phase !== 'play') return;
  sfx.click();
  world.riding = { type: ride.type, label: ride.label, elapsed: 0, lap: 0, s: 0, v: 4, roll: 0, yawOff: 0, pitchOff: 0 };
  actionPromptEl.classList.remove('show');
  rideHudEl.classList.remove('hidden');
  $('#rhName').textContent = ride.label.toUpperCase();
  if (ride.type === 'coaster') {
    sfx.startWind();
    snackbar('Prisma Cyclone dimulai! Pegangan erat-erat ya.');
  } else if (ride.type === 'wheel') {
    snackbar('Menikmati panorama indah dari Bianglala Senja!');
  } else if (ride.type === 'droptower') {
    snackbar('Menara Terjun Bebas: Bersiaplah meluncur dari puncak 38 meter!');
  } else if (ride.type === 'vikingship') {
    snackbar('Kapal Bajak Laut: Sensasi berayun tinggi di udara!');
  } else if (ride.type === 'carousel') {
    snackbar('Komedi Putar: Berputar manis di atas kuda kayu klasik!');
  } else if (ride.type === 'teacups') {
    snackbar('Cangkir Berputar: Wahana ria berputar mengitari teko emas!');
  }
  updateRideHUD(world.riding);
}

function exitRide() {
  if (!world || !world.riding) return;
  const r = world.riding;
  world.riding = null;
  sfx.stopWind();
  rideHudEl.classList.add('hidden');
  const def = world.rides.find(x => x.type === r.type);
  if (def) player.reset(def.exit.x, def.exit.z, def.exit.yaw);
  else player.reset(world.spawn.x, world.spawn.z, world.spawn.yaw);
}

function updateRideHUD(r) {
  if (!r) return;
  const m = Math.floor(r.elapsed / 60), s2 = String(Math.floor(r.elapsed % 60)).padStart(2, '0');
  $('#rhTime').textContent = `${m}:${s2}`;
  const fill = $('#rhFill');
  if (r.type === 'coaster') {
    $('#rhLap').textContent = `LAP ${r.lap + 1}/6`;
    $('#rhSpeed').textContent = `${Math.round(r.v * 3.6)} km/j`;
    fill.classList.remove('indet');
    fill.style.width = `${Math.min(100, (r.s / (world.coaster.L * 6)) * 100)}%`;
  } else if (r.type === 'wheel') {
    const py = world.parkManager ? Math.round(world.parkManager.wheelY + Math.sin(world.parkManager.wheelAng) * world.parkManager.wheelR) : 16;
    $('#rhLap').textContent = `Tinggi: ${py}m`;
    $('#rhSpeed').textContent = '12 RPM';
    fill.classList.add('indet');
  } else if (r.type === 'droptower') {
    const dy = world.parkManager ? Math.round(world.parkManager.dropY) : 2;
    $('#rhLap').textContent = `Tinggi: ${dy}m`;
    $('#rhSpeed').textContent = world.parkManager ? world.parkManager.dropState.toUpperCase() : 'SIAP';
    fill.classList.add('indet');
  } else if (r.type === 'vikingship') {
    const deg = world.parkManager ? Math.round(Math.abs(world.parkManager.shipAng * (180 / Math.PI))) : 0;
    $('#rhLap').textContent = `Ayunan: ${deg}°`;
    $('#rhSpeed').textContent = 'AYUN MAKSIMAL';
    fill.classList.add('indet');
  } else if (r.type === 'teacups') {
    $('#rhLap').textContent = 'Cangkir Putar';
    $('#rhSpeed').textContent = '45 RPM';
    fill.classList.add('indet');
  } else if (r.type === 'carousel') {
    $('#rhLap').textContent = 'Komedi Putar';
    $('#rhSpeed').textContent = '18 RPM';
    fill.classList.add('indet');
  } else {
    $('#rhLap').textContent = r.label;
    $('#rhSpeed').textContent = '—';
    fill.classList.add('indet');
  }
}

// NPC Dialog
function openNPCDialog(npc) {
  sfx.chime();
  $('#npcName').textContent = npc.name;
  $('#npcRole').textContent = npc.title;
  $('#npcSpeech').textContent = npc.speech;
  npcModal.classList.add('open');
  phase = 'paused';
}

$('#npcActionWeapon').addEventListener('click', () => {
  if (weaponManager) weaponManager.refillAllAmmo();
  snackbar('Senjata & Amunisi terisi penuh! Siap tempur!');
  npcModal.classList.remove('open');
  phase = 'play';
  if (!touchMode) tryLock();
});

$('#npcActionRaid').addEventListener('click', () => {
  npcModal.classList.remove('open');
  phase = 'play';
  if (monsterSystem) monsterSystem.spawnRaid(world.scene, player.pos);
  if (!touchMode) tryLock();
});

$('#npcActionClose').addEventListener('click', () => {
  npcModal.classList.remove('open');
  phase = 'play';
  if (!touchMode) tryLock();
});

// Landmark Check
function checkLandmarks() {
  if (!world) return;
  for (const l of world.landmarks) {
    if (l.found) continue;
    const d = Math.hypot(player.pos.x - l.x, player.pos.z - l.z);
    if (d < l.r) {
      l.found = true;
      l.beacon.visible = false;
      disc[worldKey][l.id] = true;
      try { localStorage.setItem('prisma-disc', JSON.stringify(disc)); } catch (e) { }
      sfx.fanfare();
      world.bursts.push(makeBurst(world.scene, new THREE.Vector3(l.x, 1.2, l.z), l.color));
      updateHUDProgress();
      // Show disc sheet
      $('#dsTitle').textContent = l.title;
      $('#dsFact').textContent = l.fact;
      $('#dsIcon').textContent = l.icon || 'explore';
      discSheetEl.classList.add('show');
      setTimeout(() => discSheetEl.classList.remove('show'), 5000);
      break;
    }
  }
}

// Compass HUD
function updateCompass() {
  const deg = ((-player.yaw * 180 / Math.PI) % 360 + 360) % 360;
  const strip = $('#compassStrip');
  if (strip) strip.style.transform = `translateX(${-deg * 4}px)`;
}

/* ================= MODERN ANDROID MAIN MENU CONTROLLER ================= */
function buildAndroidWorldCards(filter = 'all') {
  const grid = $('#m3WorldGrid');
  if (!grid) return;
  grid.innerHTML = Object.entries(WORLDS).filter(([k, w]) => {
    if (filter === 'all') return true;
    return w.cat === filter;
  }).map(([k, w]) => {
    const n = discCount(k);
    return `
      <div class="w-card" data-key="${k}" style="--card-acc:${w.acc}">
        <div>
          <div class="w-top">
            <div class="w-ico"><span class="msr">${w.icon}</span></div>
            <span class="w-idx">${w.idx}</span>
          </div>
          <div class="w-name">${w.name}</div>
          <div class="w-desc">${w.desc}</div>
          <div class="w-tags">
            <span class="w-tag">${n}/${w.total} Landmark</span>
            <span class="w-tag">Kendaraan</span>
            <span class="w-tag">Titan Boss</span>
          </div>
        </div>
        <button class="w-btn"><span class="msr sm">play_arrow</span>Jelajahi Dunia</button>
      </div>
    `;
  }).join('');

  document.querySelectorAll('.w-card').forEach(card => {
    addRipple(card);
    card.addEventListener('click', () => {
      sfx.click();
      sfx.whoosh();
      const key = card.dataset.key;
      fadeSwap(() => loadWorld(key));
    });
  });
}

// Clock updates
setInterval(() => {
  const d = new Date();
  const clk = $('#androidClock');
  if (clk) clk.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}, 1000);

// Category filter chips
document.querySelectorAll('.m3-chips-row .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    sfx.click();
    document.querySelectorAll('.m3-chips-row .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    buildAndroidWorldCards(chip.dataset.filter);
  });
});

// Android Bottom Navigation Tabs
$('#tabWorlds').addEventListener('click', () => {
  sfx.click();
  setActiveTab('tabWorlds');
  $('#m3HeroCard').style.display = 'block';
  buildAndroidWorldCards('all');
});
$('#tabArsenal').addEventListener('click', () => {
  sfx.click();
  openDialog(arsenalModal);
});
$('#tabTitans').addEventListener('click', () => {
  sfx.click();
  openDialog(titanModal);
});
$('#tabControls').addEventListener('click', () => {
  sfx.click();
  openDialog(helpModal);
});

function setActiveTab(id) {
  document.querySelectorAll('.m3-nav-bar .nav-tab').forEach(t => t.classList.toggle('active', t.id === id));
}

const m3DeviceEl = $('.m3-device');
const worldViewOverlayEl = $('#worldViewOverlay');

function setViewWorldMode(show) {
  if (show) {
    sfx.click();
    if (m3DeviceEl) m3DeviceEl.classList.add('minimized');
    if (worldViewOverlayEl) worldViewOverlayEl.classList.remove('hidden');
    snackbar('Mode Jelajah 3D Dunia Aktif. Geser untuk memutar!');
  } else {
    sfx.click();
    if (m3DeviceEl) m3DeviceEl.classList.remove('minimized');
    if (worldViewOverlayEl) worldViewOverlayEl.classList.add('hidden');
  }
}

$('#toggleViewWorldBtn')?.addEventListener('click', () => setViewWorldMode(true));
$('#backToMenuBtn')?.addEventListener('click', () => setViewWorldMode(false));

$('#quickPlayBtn').addEventListener('click', () => {
  sfx.click(); sfx.whoosh();
  fadeSwap(() => loadWorld('funfair'));
});
$('#m3HelpBtn').addEventListener('click', () => openDialog(helpModal));

async function fadeSwap(fn) {
  fadeEl.classList.add('on');
  landingEl.classList.add('hide');
  if (worldViewOverlayEl) worldViewOverlayEl.classList.add('hidden');
  if (m3DeviceEl) m3DeviceEl.classList.remove('minimized');
  await wait(350);
  fn();
  await wait(100);
  fadeEl.classList.remove('on');
}

function exitToMenu() {
  fadeSwap(() => {
    if (world) { world.dispose(); world = null; worldKey = null; }
    if (monsterSystem) monsterSystem.clearAll();
    sfx.stopWind(); sfx.stopEngine();
    hudEl.classList.add('hidden');
    $('#pauseBtn').classList.add('hidden');
    $('#raidBtn').classList.add('hidden');
    $('#minimapToggleBtn')?.classList.add('hidden');
    $('#carnivalGamesBtn')?.classList.add('hidden');
    $('#ambientTrackToast')?.classList.remove('show');
    weaponHudEl.classList.add('hidden');
    touchCombatEl.classList.add('hidden');
    bossBarEl.classList.add('hidden');
    vehicleHudEl.classList.add('hidden');
    rideHudEl.classList.add('hidden');
    actionPromptEl.classList.remove('show');
    discSheetEl.classList.remove('show');
    landingEl.classList.remove('hide');
    if (m3DeviceEl) m3DeviceEl.classList.remove('minimized');
    if (worldViewOverlayEl) worldViewOverlayEl.classList.add('hidden');
    buildAndroidWorldCards('all');
    pad.start('menu');
    phase = 'menu';
  });
}

/* ================= EVENT BINDINGS ================= */
actionPromptEl.addEventListener('click', handleInteraction);
$('#vhExit').addEventListener('click', exitVehicle);
$('#rhExit').addEventListener('click', exitRide);
$('#carnivalGamesBtn')?.addEventListener('click', () => {
  sfx.click();
  rhythmGame.open();
});
$('#raidBtn').addEventListener('click', () => {
  sfx.click();
  if (monsterSystem && world) monsterSystem.spawnRaid(world.scene, player.pos);
});
$('#pauseBtn').addEventListener('click', () => { sfx.click(); openDialog(pauseModal); });
$('#pauseResume').addEventListener('click', () => { sfx.click(); closeDialog(); });
$('#pauseRaid').addEventListener('click', () => {
  sfx.click(); closeDialog();
  if (monsterSystem && world) monsterSystem.spawnRaid(world.scene, player.pos);
});
$('#pauseSwitch').addEventListener('click', () => { sfx.click(); closeDialog(false); exitToMenu(); });
$('#pauseHelp').addEventListener('click', () => { sfx.click(); closeDialog(false); openDialog(helpModal); });
$('#pauseMenu').addEventListener('click', () => { sfx.click(); closeDialog(false); exitToMenu(); });

$('#helpClose').addEventListener('click', () => { sfx.click(); closeDialog(); });
$('#arsenalClose').addEventListener('click', () => { sfx.click(); closeDialog(); });
$('#titanClose').addEventListener('click', () => { sfx.click(); closeDialog(); });

// Weapon Strip in HUD
document.querySelectorAll('.wep-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const idx = parseInt(btn.dataset.wep, 10);
    if (weaponManager) weaponManager.select(idx);
    updateWeaponHUD();
  });
});

let muted = false;
$('#muteBtn').addEventListener('click', () => {
  sfx.ensure(); muted = !muted; sfx.setMuted(muted);
  $('#muteIcon').textContent = muted ? 'volume_off' : 'volume_up';
  snackbar(muted ? 'Suara dimatikan' : 'Suara aktif');
});

// Setup Compass strip ticks
const cStrip = $('#compassStrip');
if (cStrip) {
  let str = '';
  for (let i = 0; i < 720; i += 15) {
    const label = i % 90 === 0 ? (i % 360 === 0 ? 'U' : i % 360 === 90 ? 'T' : i % 360 === 180 ? 'S' : 'B') : '';
    str += `<span style="left:${i * 4}px" class="${label ? '' : 'tick'}">${label}</span>`;
  }
  cStrip.innerHTML = str;
}

buildAndroidWorldCards('all');
document.fonts.ready.then(() => document.body.classList.add('fonts-in'));

/* ================= MAIN TICK LOOP ================= */
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - last) / 1000, .05);
  last = now;
  const t = now / 1000;

  try {
    if (world && phase === 'play') {
      // 1. Vehicle Driving or Normal Player
      if (world.drivingVehicle) {
        const v = world.drivingVehicle;
        // Camera chase mode behind vehicle
        const camDist = 6.8;
        const camHeight = 3.2;
        const targetCamPos = v.pos.clone().add(new THREE.Vector3(
          Math.sin(v.yaw) * camDist,
          camHeight,
          Math.cos(v.yaw) * camDist
        ));
        camera.position.lerp(targetCamPos, dt * 8);
        camera.lookAt(v.pos.clone().add(new THREE.Vector3(0, 1.4, 0)));
        $('#vhSpeed').textContent = `${v.getSpeedKmh()} km/j`;
      } else if (world.riding) {
        world.updateRide(dt, t);
      } else {
        player.update(dt, world);
        checkInteractions();
      }

      // 2. World & NPCs & Vehicles
      world.update(dt, t);
      checkLandmarks();
      if (!world.riding && !world.drivingVehicle) updateCompass();

      // Render circular minimap tracking player relative to discovered landmarks
      if (minimap) {
        const pPos = world.drivingVehicle ? world.drivingVehicle.pos : player.pos;
        const pYaw = world.drivingVehicle ? world.drivingVehicle.yaw : player.yaw;
        minimap.render(pPos, pYaw, world.landmarks, worldKey, dt);
      }

      // 3. Monsters & Titans
      if (monsterSystem) {
        monsterSystem.update(dt, player.pos, camera);
      }

      // 4. Weapons & Tracers
      if (weaponManager) {
        weaponManager.update(dt);
      }

      renderer.render(world.scene, camera);
    } else if (phase === 'menu') {
      menuWorld.update(dt, t);
      menuWorld.render();
    }
  } catch (err) {
    console.error(err);
  }
}
requestAnimationFrame(loop);
