/* ============================================================
 * js/main/sound.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import { AudioFX, Pad } from "../audio.js";
import { $ } from "./util.js";



/* ================= AUDIO ================= */
export const sfx = new AudioFX();
export const pad = new Pad(sfx);
const ambientToastEl = $("#ambientTrackToast");
let ambientToastTimer = null;

pad.onTrackChange = (trackDef) => {
  if (!ambientToastEl) return;
  const tagEl = $("#attTag");
  const titleEl = $("#attTitle");
  const subEl = $("#attSub");
  if (tagEl)
    tagEl.textContent = `AMBIENT AUDIO · ${trackDef.category.toUpperCase()}`;
  if (titleEl) titleEl.textContent = trackDef.title;
  if (subEl) subEl.textContent = trackDef.subtitle;
  ambientToastEl.classList.remove("hidden");
  ambientToastEl.classList.add("show");
  clearTimeout(ambientToastTimer);
  ambientToastTimer = setTimeout(() => {
    ambientToastEl.classList.remove("show");
  }, 4200);
};

addEventListener(
  "pointerdown",
  () => {
    sfx.ensure();
    if (sfx.ctx && !pad.nodes.length) pad.start(pad.key);
  },
  { passive: true },
);

/* ================= TOAST / SNACKBAR ================= */
let snackT;
export function snackbar(msg) {
  const el = $("#snackbar");
  const tx = $("#snackText");
  if (!el || !tx) return;
  tx.textContent = msg;
  el.classList.add("show");
  clearTimeout(snackT);
  snackT = setTimeout(() => el.classList.remove("show"), 3200);
}

window.snackbar = snackbar;

/* ================= MATERIAL DESIGN 3 / ANDROID UI ================= */

