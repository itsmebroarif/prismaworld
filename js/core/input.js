/* ============================================================
 * js/core/input.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import { phase, world } from "./state.js";
import { canvas } from "./dom.js";
import { closeDialog, currentDialog, openDialog, pauseModal, snackbar } from "./ui.js";
import { $ } from "./util.js";
import { boardRide, exitRide } from "../game/rides.js";

export let touchMode =
  matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
export const input = {
  kb: { x: 0, y: 0 },
  stick: { x: 0, y: 0 },
  run: false,
  jumpQ: false,
  lookX: 0,
  lookY: 0,
};
export const keys = {};
export function kbUpdate() {
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
    !(world && world.riding)
  )
    input.jumpQ = true;
  if (e.code === "KeyE" && world && phase === "play") {
    if (world.riding) exitRide();
    else if (world.rideNear) boardRide(world.rideNear);
  }
  if (e.code === "Escape") {
    if (world && world.riding && phase === "play") exitRide();
    else if (phase === "play" && !document.pointerLockElement)
      openDialog(pauseModal);
    else if (phase === "paused" && currentDialog === pauseModal)
      closeDialog();
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
          const q = canvas.requestPointerLock();
          if (q && q.catch) q.catch(() => {});
        } catch (e) {}
      });
  } catch (e) {
    try {
      canvas.requestPointerLock();
    } catch (e2) {}
  }
}
document.addEventListener("pointerlockchange", () => {
  const locked = document.pointerLockElement === canvas;
  if (!locked && phase === "play") {
    if (world && world.riding) exitRide();
    else if (!touchMode) openDialog(pauseModal);
  }
});
document.addEventListener("pointerlockerror", () => {
  if (phase === "play" && !touchMode)
    snackbar(
      "Seret layar untuk melihat — klik untuk coba kunci kursor lagi",
    );
});
export const LOOK_LOCK = 0.0022,
  LOOK_DRAG = 0.0038,
  LOOK_TOUCH = 0.005;
addEventListener("mousemove", (e) => {
  if (document.pointerLockElement === canvas && phase === "play") {
    input.lookX += e.movementX * LOOK_LOCK;
    input.lookY += e.movementY * LOOK_LOCK;
  }
});
export let lookId = null,
  dragLook = false,
  lx = 0,
  ly = 0,
  dragDist = 0;
canvas.addEventListener("pointerdown", (e) => {
  if (phase !== "play") return;
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
canvas.addEventListener("pointermove", (e) => {
  if (phase !== "play") return;
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
export function endPointer(e) {
  if (e.pointerType === "touch" && e.pointerId === lookId) lookId = null;
  if (dragLook) {
    dragLook = false;
    if (dragDist < 7 && phase === "play" && !touchMode) tryLock();
  }
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
export const joyEl = $("#joy"),
  knobEl = $("#joyKnob");
export let joyId = null;
export function joyHandle(e) {
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
export function joyEnd(e) {
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
  if (phase === "play" && !(world && world.riding)) input.jumpQ = true;
});
export function applyTouchMode(on) {
  touchMode = on;
  document.body.classList.toggle("touch", on);
  $("#touchUI").classList.toggle("hidden", !(on && world));
  $("#touchSwitch").checked = on;
  $("#platIcon").textContent = on ? "touch_app" : "mouse";
  $("#platText").textContent = on
    ? "Mode sentuh — joystick kiri, geser layar untuk melihat 360°"
    : "Mouse & keyboard — WASD bergerak, mouse melihat 360°";
  $("#rpKey").style.display = on ? "none" : "inline-flex";
  $("#rpSubTx").textContent = on
    ? "ketuk kartu ini — naik wahana"
    : "atau ketuk — naik wahana";
}

