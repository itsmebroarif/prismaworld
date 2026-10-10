/* ============================================================
 * js/main/dom.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import { $ } from "./util.js";

export const canvas = $("#gl"),
  hudEl = $("#hud"),
  fadeEl = $("#fade"),
  landingEl = $("#landing"),
  introCard = $("#introCard"),
  hintBarEl = $("#hintBar"),
  discSheetEl = $("#discSheet"),
  actionPromptEl = $("#actionPrompt"),
  rideHudEl = $("#rideHUD"),
  vehicleHudEl = $("#vehicleHUD"),
  bossBarEl = $("#bossBar"),
  weaponHudEl = $("#weaponHUD"),
  touchCombatEl = $("#touchCombat"),
  sniperScopeEl = $("#sniperScope"),
  reticleEl = $("#reticle"),
  aboutModal = $("#aboutModal"),
  helpModal = $("#helpModal"),
  pauseModal = $("#pauseModal"),
  arsenalModal = $("#arsenalModal"),
  titanModal = $("#titanModal"),
  npcModal = $("#npcModal");
