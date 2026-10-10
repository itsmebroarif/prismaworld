/* ============================================================
 * js/main/input.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import { canvas, pauseModal, reticleEl, sniperScopeEl } from "./dom.js";
import { camera, carnivalShootingGame, rhythmGame } from "./engine.js";
import { exitRide, exitVehicle, handleInteraction, updateWeaponHUD } from "./game.js";
import { player } from "./player.js";
import { monsterSystem, phase, weaponManager, world } from "./state.js";
import { closeDialog, currentDialog, openDialog } from "./ui.js";
import { $ } from "./util.js";



/* ================= INPUT CONTROLLER ================= */
export let touchMode =
  matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
export const input = {
  kb: { x: 0, y: 0 },
  stick: { x: 0, y: 0 },
  run: false,
  jumpQ: false,
  lookX: 0,
  lookY: 0,
  firing: false,
};
const keys = {};
function kbUpdate() {
  input.kb.x =
    (keys["KeyD"] || keys["ArrowRight"] ? 1 : 0) -
    (keys["KeyA"] || keys["ArrowLeft"] ? 1 : 0);
  input.kb.y =
    (keys["KeyW"] || keys["ArrowUp"] ? 1 : 0) -
    (keys["KeyS"] || keys["ArrowDown"] ? 1 : 0);
  input.run = !!(keys["ShiftLeft"] || keys["ShiftRight"]);
}


addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (
    ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
      e.code,
    )
  )
    e.preventDefault();
  if (
    e.code === "Space" &&
    !e.repeat &&
    phase === "play" &&
    !world?.riding &&
    !world?.drivingVehicle
  ) {
    input.jumpQ = true;
  }
  // Weapon switches 1-4
  if (e.code === "Digit1" && weaponManager) weaponManager.select(0);
  if (e.code === "Digit2" && weaponManager) weaponManager.select(1);
  if (e.code === "Digit3" && weaponManager) weaponManager.select(2);
  if (e.code === "Digit4" && weaponManager) weaponManager.select(3);
  if (e.code === "KeyR" && weaponManager) weaponManager.reload();

  // Carnival & Rhythm Games shortcut [K]
  if (
    e.code === "KeyK" &&
    phase === "play" &&
    rhythmGame &&
    !rhythmGame.active &&
    !carnivalShootingGame.active
  ) {
    rhythmGame.open();
  }

  // Interaction Key [E]
  if (e.code === "KeyE" && world && phase === "play") {
    handleInteraction();
  }
  if (e.code === "Escape") {
    if (rhythmGame && rhythmGame.active) rhythmGame.close();
    else if (carnivalShootingGame && carnivalShootingGame.active)
      carnivalShootingGame.close();
    else if (world && world.riding) exitRide();
    else if (world && world.drivingVehicle) exitVehicle();
    else if (phase === "play" && !document.pointerLockElement)
      openDialog(pauseModal);
    else if (phase === "paused" && currentDialog) closeDialog();
  }
  kbUpdate();
});

addEventListener("keyup", (e) => {
  keys[e.code] = false;
  kbUpdate();
});
addEventListener("blur", () => {
  for (const k in keys) keys[k] = false;
  kbUpdate();
});

export function tryLock() {
  if (touchMode) return;
  try {
    const p =
      canvas.requestPointerLock &&
      canvas.requestPointerLock({ unadjustedMovement: true });
    if (p && p.catch)
      p.catch(() => {
        try {
          canvas.requestPointerLock();
        } catch (e) {}
      });
  } catch (e) {
    try {
      canvas.requestPointerLock();
    } catch (e2) {}
  }
}


// LOOK CONTROLS (360 DEGREES)
const LOOK_LOCK = 0.0022,
  LOOK_DRAG = 0.0042,
  LOOK_TOUCH = 0.005;

addEventListener("mousemove", (e) => {
  if (document.pointerLockElement === canvas && phase === "play") {
    input.lookX += e.movementX * LOOK_LOCK;
    input.lookY += e.movementY * LOOK_LOCK;
  }
});

let lookId = null,
  dragLook = false,
  lx = 0,
  ly = 0,
  dragDist = 0;

canvas.addEventListener("pointerdown", (e) => {
  if (phase !== "play") return;
  if (
    e.button === 0 &&
    !world?.riding &&
    !world?.drivingVehicle &&
    weaponManager
  ) {
    // Shooting with left click
    weaponManager.shoot(monsterSystem, player.pos);
    updateWeaponHUD();
  } else if (
    e.button === 2 &&
    weaponManager &&
    weaponManager.current().hasScope
  ) {
    // Scope zoom toggle with right click
    toggleSniperScope();
  }
  if (e.pointerType === "touch") {
    if (lookId === null) {
      lookId = e.pointerId;
      lx = e.clientX;
      ly = e.clientY;
    }
  } else if (!touchMode && document.pointerLockElement !== canvas) {
    dragLook = true;
    dragDist = 0;
    lx = e.clientX;
    ly = e.clientY;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {}
  }
});

canvas.addEventListener("contextmenu", (e) => e.preventDefault());

canvas.addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch" && e.pointerId === lookId) {
    input.lookX += (e.clientX - lx) * LOOK_TOUCH;
    input.lookY += (e.clientY - ly) * LOOK_TOUCH;
    lx = e.clientX;
    ly = e.clientY;
  } else if (dragLook) {
    dragDist += Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly);
    input.lookX += (e.clientX - lx) * LOOK_DRAG;
    input.lookY += (e.clientY - ly) * LOOK_DRAG;
    lx = e.clientX;
    ly = e.clientY;
  }
});

function endPointer(e) {
  if (e.pointerType === "touch" && e.pointerId === lookId) lookId = null;
  if (dragLook) {
    dragLook = false;
    if (dragDist < 7 && phase === "play" && !touchMode) tryLock();
  }
}

canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);

// Virtual Joystick
const joyEl = $("#joy"),
  knobEl = $("#joyKnob");
let joyId = null;
function joyHandle(e) {
  const b = joyEl.getBoundingClientRect(),
    cx = b.left + b.width / 2,
    cy = b.top + b.height / 2;
  let dx = e.clientX - cx,
    dy = e.clientY - cy;
  const max = b.width / 2 - 22,
    len = Math.hypot(dx, dy);
  if (len > max) {
    dx *= max / len;
    dy *= max / len;
  }
  knobEl.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  input.stick.x = dx / max;
  input.stick.y = -dy / max;
}

joyEl.addEventListener("pointerdown", (e) => {
  joyId = e.pointerId;
  joyEl.classList.add("active");
  joyEl.setPointerCapture(joyId);
  joyHandle(e);
  e.preventDefault();
});
joyEl.addEventListener("pointermove", (e) => {
  if (e.pointerId === joyId) joyHandle(e);
});
function joyEnd(e) {
  if (e.pointerId !== joyId) return;
  joyId = null;
  joyEl.classList.remove("active");
  knobEl.style.transform = "translate(-50%,-50%)";
  input.stick.x = input.stick.y = 0;
}

joyEl.addEventListener("pointerup", joyEnd);
joyEl.addEventListener("pointercancel", joyEnd);
$("#jumpBtn").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (phase === "play" && !world?.riding && !world?.drivingVehicle)
    input.jumpQ = true;
});

// Mobile Combat buttons
$("#fireBtn").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (phase === "play" && weaponManager) {
    weaponManager.shoot(monsterSystem, player.pos);
    updateWeaponHUD();
  }
});
$("#scopeBtn").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  toggleSniperScope();
});

function toggleSniperScope() {
  if (!weaponManager) return;
  weaponManager.isScoped = !weaponManager.isScoped;
  sniperScopeEl.classList.toggle("active", weaponManager.isScoped);
  camera.fov = weaponManager.isScoped ? 22 : world ? world.fovBase : 68;
  camera.updateProjectionMatrix();
  reticleEl.classList.toggle("aim", weaponManager.isScoped);
}
export function applyTouchMode(on) {
  touchMode = on;
  document.body.classList.toggle("touch", on);
  $("#touchUI").classList.toggle("hidden", !(on && world));
  $("#touchCombat").classList.toggle("hidden", !(on && world));
}
