/* ============================================================
 * js/core/ui.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import { touchMode, tryLock } from "./input.js";
import { phase, setPhase, world } from "./state.js";
import { $ } from "./util.js";

/* elemen HTML dipindah ke dom.js (leaf) agar aman dari siklus impor */
export {
  canvas,
  hudEl,
  fadeEl,
  landingEl,
  introCard,
  hintBarEl,
  discSheetEl,
  ridePromptEl,
  rideHudEl,
  aboutModal,
  helpModal,
  pauseModal,
} from "./dom.js";

export let currentDialog = null, snackT;
export function addRipple(el) {
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
document.querySelectorAll(".btn,.icon-btn,.rh-exit").forEach(addRipple);
document
  .querySelectorAll("button")
  .forEach((b) => b.addEventListener("click", () => b.blur()));
export function snackbar(msg) {
  $("#snackText").textContent = msg;
  $("#snackbar").classList.add("show");
  clearTimeout(snackT);
  snackT = setTimeout(
    () => $("#snackbar").classList.remove("show"),
    3000,
  );
}
export function openDialog(m) {
  m.classList.add("open");
  currentDialog = m;
  if (world && phase === "play") setPhase("paused");
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

/* ================= DATA 9 DUNIA ================= */
