/* ============================================================
 * js/main/util.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */

/* ================= UTIL & HELPERS ================= */
export const $ = (s) => document.querySelector(s);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const damp = (a, b, l, dt) => a + (b - a) * (1 - Math.exp(-l * dt));
export const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
