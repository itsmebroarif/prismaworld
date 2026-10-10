/* ============================================================
 * js/core/state.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
/* ============================================================
 * js/core/state.js — state aplikasi bersama (world / phase)
 * ============================================================ */
export let world = null;
export let worldKey = null;
export let phase = "menu";

export function setWorld(w, k) {
  world = w;
  worldKey = k;
}
export function setPhase(p) {
  phase = p;
}

