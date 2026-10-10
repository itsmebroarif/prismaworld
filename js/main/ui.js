/* ============================================================
 * js/main/ui.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import { touchMode, tryLock } from "./input.js";
import { phase, setPhase, world } from "./state.js";

export let currentDialog = null;
export let currentPromptTarget = null;
 // { type: 'ride'|'vehicle'|'npc', obj: ... }

export function addRipple(el) {
  if (!el) return;
  el.addEventListener("pointerdown", (e) => {
    const r = document.createElement("span");
    r.className = "ripple";
    const b = el.getBoundingClientRect(),
      d = Math.max(b.width, b.height) * 2.2;
    r.style.width = r.style.height = d + "px";
    r.style.left = e.clientX - b.left - d / 2 + "px";
    r.style.top = e.clientY - b.top - d / 2 + "px";
    el.appendChild(r);
    r.addEventListener("animationend", () => r.remove());
  });
}

document
  .querySelectorAll(".btn,.icon-btn,.chip,.combat-btn,.vh-exit,.rh-exit")
  .forEach(addRipple);

export function openDialog(m) {
  if (!m) return;
  m.classList.add("open");
  currentDialog = m;
  if (world && phase === "play") phase = "paused";
}
export function closeDialog(resume = true) {
  if (!currentDialog) return;
  currentDialog.classList.remove("open");
  currentDialog = null;
  if (resume && world && phase === "paused") {
    setPhase("play");
    if (!touchMode) tryLock();
  }
}
