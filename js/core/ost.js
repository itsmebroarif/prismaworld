/* ============================================================
 * js/core/ost.js — Soundtrack per dunia
 *
 * Taruh file musik di assets/ost dengan nama angka:
 *   1.mp3  -> Dunia 01 (Taman Seroja)
 *   2.mp3  -> Dunia 02 (Area Server)
 *   ...
 *   9.mp3  -> Dunia 09 (Stasiun Helios)
 *
 * Kalau file tidak ditemukan, game otomatis fallback ke
 * ambient pad bawaan (suara sebelumnya) — jadi aman kalau
 * belum ada satu pun file OST.
 * ============================================================ */
import { pad } from "./audio.js";
import { WORLDS } from "./worlds_meta.js";
import { snackbar } from "./ui.js";

const DIR = "assets/ost/";
const VOL = 0.6;
const probeCache = new Map();

let track = null; // HTMLAudioElement
let trackKey = null; // dunia yang sedang memutar OST
let wantKey = null; // dunia yang seharusnya diputar
let muted = false;

/** nomor urut dunia (1..9), 0 = menu */
export function ostNumber(key) {
  const w = WORLDS[key];
  return w ? parseInt(w.idx, 10) : 0;
}

/** path file OST sebuah dunia, null kalau bukan dunia */
export function ostPath(key) {
  const n = ostNumber(key);
  return n ? `${DIR}${n}.mp3` : null;
}

/** true kalau sedang memutar OST (pad ambient dimatikan) */
export function isOstActive() {
  return !!trackKey;
}

async function fileExists(path) {
  if (probeCache.has(path)) return probeCache.get(path);
  let ok = false;
  try {
    const r = await fetch(path, { method: "HEAD" });
    ok = r.ok;
  } catch (e) {
    ok = false;
  }
  probeCache.set(path, ok);
  return ok;
}

function stopTrack() {
  if (track) {
    try {
      track.pause();
      track.removeAttribute("src");
      track.load();
    } catch (e) {}
  }
  track = null;
  trackKey = null;
}

function startTrack(path, key, n) {
  pad.stop();
  const a = new Audio(path);
  a.loop = true;
  a.preload = "auto";
  a.volume = muted ? 0 : VOL;
  a.addEventListener(
    "error",
    () => {
      if (track === a) {
        stopTrack();
        pad.start(key);
      }
    },
    { once: true },
  );
  a.play().catch(() => {});
  track = a;
  trackKey = key;
  snackbar(`♪ OST ${n}/9 — ${path}`);
}

/**
 * Ganti musik sesuai dunia. `key` = "menu" untuk kembali ke
 * ambient menu, atau kunci dunia (park, server, ...).
 */
export async function playMusic(key) {
  wantKey = key;
  const path = ostPath(key);
  stopTrack();
  if (!path) {
    pad.start(key); // menu: tetap pakai pad ambient
    return;
  }
  const ok = await fileExists(path);
  if (wantKey !== key) return; // sudah pindah dunia
  if (!ok) {
    pad.start(key); // belum ada file: pakai ambient bawaan
    return;
  }
  startTrack(path, key, ostNumber(key));
}

export function stopMusic() {
  wantKey = null;
  stopTrack();
}

export function setMuted(m) {
  muted = m;
  if (track) track.volume = m ? 0 : VOL;
}

/* Pointer pertama = momen autoplay pertama; kalau play() sempat
   ditolak browser, coba lagi di sini. Sekaligus pastikan pad
   ambient tidak hidup bersamaan dengan OST. */
addEventListener(
  "pointerdown",
  () => {
    if (trackKey) {
      pad.stop();
      if (track && track.paused) track.play().catch(() => {});
    }
  },
  { passive: true },
);
