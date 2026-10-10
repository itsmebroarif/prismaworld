/* ============================================================
 * js/core/dom.js — referensi element HTML (leaf, tanpa siklus)
 * Dipisah dari ui.js supaya modul lain boleh membaca `canvas`
 * saat proses load tanpa masalah temporal dead zone.
 * ============================================================ */
import { $ } from "./util.js";

export const canvas = $("#gl"),
  hudEl = $("#hud"),
  fadeEl = $("#fade"),
  landingEl = $("#landing"),
  introCard = $("#introCard"),
  hintBarEl = $("#hintBar"),
  discSheetEl = $("#discSheet"),
  ridePromptEl = $("#ridePrompt"),
  rideHudEl = $("#rideHUD"),
  aboutModal = $("#aboutModal"),
  helpModal = $("#helpModal"),
  pauseModal = $("#pauseModal");
