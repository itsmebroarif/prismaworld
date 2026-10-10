/* ============================================================
 * js/main/menu.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import { buildAndroidWorldCards, fadeSwap, m3DeviceEl, worldViewOverlayEl } from "./android_ui.js";
import { actionPromptEl, bossBarEl, discSheetEl, helpModal, hudEl, landingEl, pauseModal, rideHudEl, touchCombatEl, vehicleHudEl, weaponHudEl } from "./dom.js";
import { rhythmGame } from "./engine.js";
import { exitRide, exitVehicle, handleInteraction, updateWeaponHUD } from "./game.js";
import { player } from "./player.js";
import { pad, sfx, snackbar } from "./sound.js";
import { monsterSystem, setPhase, setWorld, weaponManager, world } from "./state.js";
import { closeDialog, openDialog } from "./ui.js";
import { $ } from "./util.js";

function exitToMenu() {
  fadeSwap(() => {
    if (world) {
      world.dispose();
      setWorld(null, null);
    }
    if (monsterSystem) monsterSystem.clearAll();
    sfx.stopWind();
    sfx.stopEngine();
    hudEl.classList.add("hidden");
    $("#pauseBtn").classList.add("hidden");
    $("#raidBtn").classList.add("hidden");
    $("#minimapToggleBtn")?.classList.add("hidden");
    $("#carnivalGamesBtn")?.classList.add("hidden");
    $("#ambientTrackToast")?.classList.remove("show");
    weaponHudEl.classList.add("hidden");
    touchCombatEl.classList.add("hidden");
    bossBarEl.classList.add("hidden");
    vehicleHudEl.classList.add("hidden");
    rideHudEl.classList.add("hidden");
    actionPromptEl.classList.remove("show");
    discSheetEl.classList.remove("show");
    landingEl.classList.remove("hide");
    if (m3DeviceEl) m3DeviceEl.classList.remove("minimized");
    if (worldViewOverlayEl) worldViewOverlayEl.classList.add("hidden");
    buildAndroidWorldCards("all");
    pad.start("menu");
    setPhase("menu");
  });
}


/* ================= EVENT BINDINGS ================= */
actionPromptEl.addEventListener("click", handleInteraction);
$("#vhExit").addEventListener("click", exitVehicle);
$("#rhExit").addEventListener("click", exitRide);
$("#carnivalGamesBtn")?.addEventListener("click", () => {
  sfx.click();
  rhythmGame.open();
});
$("#raidBtn").addEventListener("click", () => {
  sfx.click();
  if (monsterSystem && world) monsterSystem.spawnRaid(world.scene, player.pos);
});
$("#pauseBtn").addEventListener("click", () => {
  sfx.click();
  openDialog(pauseModal);
});
$("#pauseResume").addEventListener("click", () => {
  sfx.click();
  closeDialog();
});
$("#pauseRaid").addEventListener("click", () => {
  sfx.click();
  closeDialog();
  if (monsterSystem && world) monsterSystem.spawnRaid(world.scene, player.pos);
});
$("#pauseSwitch").addEventListener("click", () => {
  sfx.click();
  closeDialog(false);
  exitToMenu();
});
$("#pauseHelp").addEventListener("click", () => {
  sfx.click();
  closeDialog(false);
  openDialog(helpModal);
});
$("#pauseMenu").addEventListener("click", () => {
  sfx.click();
  closeDialog(false);
  exitToMenu();
});

$("#helpClose").addEventListener("click", () => {
  sfx.click();
  closeDialog();
});
$("#arsenalClose").addEventListener("click", () => {
  sfx.click();
  closeDialog();
});
$("#titanClose").addEventListener("click", () => {
  sfx.click();
  closeDialog();
});

// Weapon Strip in HUD
document.querySelectorAll(".wep-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const idx = parseInt(btn.dataset.wep, 10);
    if (weaponManager) weaponManager.select(idx);
    updateWeaponHUD();
  });
});

let muted = false;

$("#muteBtn").addEventListener("click", () => {
  sfx.ensure();
  muted = !muted;
  sfx.setMuted(muted);
  $("#muteIcon").textContent = muted ? "volume_off" : "volume_up";
  snackbar(muted ? "Suara dimatikan" : "Suara aktif");
});

// Setup Compass strip ticks

