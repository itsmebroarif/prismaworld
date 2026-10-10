/* ============================================================
 * main.js — entry point
 * Monolit lama dipecah menjadi modul per-fitur di js/main/
 * ============================================================ */
import { buildAndroidWorldCards } from "./js/main/android_ui.js";
import { loop } from "./js/main/loop.js";
import "./js/main/menu.js";
import "./js/main/compass.js";

/* ================= BOOT ================= */
buildAndroidWorldCards("all");
document.fonts.ready.then(() => document.body.classList.add("fonts-in"));

requestAnimationFrame(loop);
