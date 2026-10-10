/* ============================================================
 * js/action/action_mode.js — Orkestrator Mode Action
 *  • toggle on/off (tombol + tombol angka)
 *  • gelombang monster mochi gemes
 *  • senjata: baton, pistol, uzi, m4a1, machine gun
 *  • night vision untuk area gelap
 * ============================================================ */
import { phase, world } from "../core/state.js";
import { player } from "../game/player.js";
import { camera } from "../core/engine.js";
import { $ } from "../core/util.js";
import { snackbar } from "../core/ui.js";
import { sfx } from "../core/audio.js";
import { WeaponRig } from "./weapons.js";
import { MochiSwarm } from "./mochi.js";
import { isDarkMap, resetNv, setNvScene, toggleNv, updateNv } from "./nightvision.js";

const STORE = "prisma-action";
const MAX_HP = 5;

let enabled = false;
let scene = null;
let rig = null;
let swarm = null;
let wave = 0;
let kills = 0;
let hp = MAX_HP;
let nextWave = 0;
let firing = false;
let hitFlash = 0;
let hudT = 0;
let last = { wave: -1, kills: -1, hp: -1, ammo: "" };

const isCoarse = () => matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;

function persist() {
  try {
    localStorage.setItem(STORE, enabled ? "1" : "0");
  } catch (e) {}
}
function restore() {
  try {
    enabled = localStorage.getItem(STORE) === "1";
  } catch (e) {
    enabled = false;
  }
}
restore();

export function isActionEnabled() {
  return enabled;
}

/* ---------------- HUD ---------------- */
function hudEl(id) {
  return document.getElementById(id);
}

/** teks HUD di-refresh pelan (10x/detik) supaya tidak nge-layout tiap frame */
function syncHudFrame(dt) {
  hudT -= dt;
  if (hudT > 0) return;
  hudT = 0.1;
  const w = hudEl("ahWave");
  const k = hudEl("ahKills");
  const h = hudEl("ahHp");
  if (w) w.textContent = wave ? `WAVE ${wave}` : "SIAP";
  if (k && kills !== last.kills) {
    k.textContent = String(kills);
    last.kills = kills;
  }
  if (h && hp !== last.hp) {
    h.innerHTML = "<b>" + "♥".repeat(hp) + "</b>" + "♡".repeat(MAX_HP - hp);
    last.hp = hp;
  }
}

function flashDamage() {
  const f = $("#dmgFlash");
  if (!f) return;
  f.classList.remove("on");
  void f.offsetWidth;
  f.classList.add("on");
}

/* ---------------- siklus mode ---------------- */
function startRig() {
  teardown();
  rig = new WeaponRig(scene);
  rig.onKill = () => {
    kills++;
    syncHudFrame(0);
  };
  swarm = new MochiSwarm(scene);
  setNvScene(scene);
  wave = 0;
  kills = 0;
  hp = MAX_HP;
  nextWave = 2.4;
  last = { wave: -1, kills: -1, hp: -1, ammo: "" };
  const hud = hudEl("actionHUD");
  if (hud) hud.classList.remove("hidden");
  const ret = $("#reticle");
  if (ret) ret.classList.add("on");
  syncHudFrame(0);
}

function teardown() {
  if (rig) rig.dispose();
  if (swarm) swarm.clear();
  rig = null;
  swarm = null;
}

export function setActionMode(on) {
  if (on === enabled) return enabled;
  enabled = on;
  persist();
  const hud = hudEl("actionHUD");
  if (hud) hud.classList.toggle("hidden", !enabled);
  if (!enabled) {
    firing = false;
    teardown();
    const ret = $("#reticle");
    if (ret) ret.classList.remove("on");
    snackbar("Mode Action OFF — jelajah santai lagi");
  } else {
    if (scene) {
      startRig();
      snackbar("Mode Action ON — mochi gemes datang! Klik untuk menembak");
    } else {
      snackbar("Mode Action ON — masuk salah satu dunia untuk mulai");
    }
  }
  return enabled;
}

export function toggleActionMode() {
  return setActionMode(!enabled);
}

/* ---------------- dipanggil dari app.js ---------------- */
export function actionOnWorldLoad(worldScene, key) {
  scene = worldScene;
  const bar = hudEl("actionBar");
  if (bar) bar.classList.remove("hidden");
  const fb = hudEl("fireBtn");
  if (fb) {
    if (enabled && isCoarse()) fb.classList.remove("hidden");
    else fb.classList.add("hidden");
  }
  if (enabled) startRig();
  if (isDarkMap(key))
    setTimeout(() => snackbar("Area gelap — tekan V / tombol untuk Night Vision"), 2600);
}

export function actionOnExit() {
  firing = false;
  teardown();
  scene = null;
  wave = 0;
  kills = 0;
  hp = MAX_HP;
  resetNv();
  const bar = hudEl("actionBar");
  if (bar) bar.classList.add("hidden");
  const hud = hudEl("actionHUD");
  if (hud) hud.classList.add("hidden");
  const fb = hudEl("fireBtn");
  if (fb) fb.classList.add("hidden");
  const ret = $("#reticle");
  if (ret) ret.classList.remove("on");
}

function damage(n) {
  hp -= n;
  hitFlash = 0.3;
  flashDamage();
  sfx.tone({ f: 130, f2: 80, t: 0.16, type: "sine", g: 0.16 });
  if (hp <= 0) {
    hp = MAX_HP;
    wave = 0;
    nextWave = 3;
    if (swarm) swarm.clear();
    firing = false;
    sfx.tone({ f: 400, f2: 90, t: 0.5, type: "sawtooth", g: 0.14 });
    snackbar("Kewalahan sama mochi! HP dipulihkan…");
  }
  syncHudFrame(0);
}

export function actionFrame(dt) {
  if (hitFlash > 0) hitFlash -= dt;
  if (!enabled || !scene || phase !== "play") return;

  const riding = !!(world && world.riding);

  if (rig) {
    rig.update(dt, camera);
    if (firing && !riding) rig.shoot(camera, swarm);
  }

  if (swarm) {
    if (!riding && swarm.count === 0) {
      nextWave -= dt;
      if (nextWave <= 0) {
        wave++;
        const n = Math.min(4 + wave, 13);
        swarm.spawnWave(n, wave, player.pos);
        nextWave = 0;
        sfx.chime();
        snackbar(`Mochi datang — WAVE ${wave} (${n} monster)`);
      }
    }
    const dmg = swarm.update(dt, player.pos);
    if (dmg > 0 && !riding) damage(dmg);
  }

  updateNv(camera);
  syncHudFrame(dt);
}

/* ---------------- input ---------------- */
function canAct() {
  return enabled && !!scene && phase === "play" && !(world && world.riding);
}

function selectWeapon(i) {
  if (!rig) return;
  rig.select(i);
  sfx.click();
}

function onKey(e) {
  if (phase !== "play") return;
  if (e.code && e.code.startsWith("Digit")) {
    const n = +e.code.slice(5);
    if (n >= 1 && n <= 5 && rig) {
      selectWeapon(n - 1);
      e.preventDefault();
    }
    return;
  }
  if (e.code === "KeyR") {
    if (rig) rig.reload();
    return;
  }
  if (e.code === "KeyV" || e.code === "KeyN") toggleNv();
}

function onDown(e) {
  if (e.button !== 0) return;
  const canvas = $("#gl");
  if (!canvas || e.target !== canvas) return;
  if (document.pointerLockElement !== canvas) return;
  if (!canAct()) return;
  firing = true;
}

function onUp() {
  firing = false;
}

function bindInputs() {
  addEventListener("keydown", onKey);
  addEventListener("mousedown", onDown);
  addEventListener("mouseup", onUp);
  addEventListener("blur", onUp);

  const tgl = $("#actionToggleBtn");
  if (tgl) tgl.addEventListener("click", () => toggleActionMode());
  const nv = $("#nvBtn");
  if (nv) nv.addEventListener("click", () => toggleNv());

  const fire = $("#fireBtn");
  if (fire) {
    const down = (e) => {
      e.preventDefault();
      if (canAct()) firing = true;
    };
    const up = (e) => {
      e.preventDefault();
      firing = false;
    };
    fire.addEventListener("touchstart", down, { passive: false });
    fire.addEventListener("touchend", up, { passive: false });
    fire.addEventListener("touchcancel", up, { passive: false });
    fire.addEventListener("mousedown", down);
    fire.addEventListener("mouseup", up);
  }

  const strip = $("#wepStrip");
  if (strip)
    strip.addEventListener("click", (e) => {
      const b = e.target.closest(".wbtn");
      if (b && rig) selectWeapon(+b.dataset.i);
    });
}

bindInputs();
