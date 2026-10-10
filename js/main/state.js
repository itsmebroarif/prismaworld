/* ============================================================
 * js/main/state.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
/* ============================================================
 * js/main/state.js — state aplikasi bersama
 * ============================================================ */
export let world = null;
export let worldKey = null;
export let phase = "menu";
export let weaponManager = null;
export let monsterSystem = null;

export function setWorld(w, k) {
  world = w;
  worldKey = k;
}
export function setPhase(p) {
  phase = p;
}
export function setWeaponManager(w) {
  weaponManager = w;
}
export function setMonsterSystem(m) {
  monsterSystem = m;
}

