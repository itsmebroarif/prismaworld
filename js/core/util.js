/* ============================================================
 * js/core/util.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */

/* ================= UTIL ================= */
export const $ = (s) => document.querySelector(s);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const damp = (a, b, l, dt) => a + (b - a) * (1 - Math.exp(-l * dt));
export const rand = (a, b) => a + Math.random() * (b - a);
export const randi = (a, b) => Math.floor(rand(a, b + 1));
export const easeInOut = (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ================= AUDIO ================= */
