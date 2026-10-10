/* ============================================================
 * js/app.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import { sfx } from "./core/audio.js";
import { playMusic, setMuted as setOstMuted } from "./core/ost.js";
import { actionFrame, actionOnExit, actionOnWorldLoad } from "./action/action_mode.js";
import { camera, renderer } from "./core/engine.js";
import { checkLandmarks, setAccent, showHints, showIntro, updateCompass, updateHUDProgress } from "./core/hud.js";
import { applyTouchMode, touchMode, tryLock } from "./core/input.js";
import { renderFrame, setBlurWas } from "./core/postfx.js";
import { phase, setPhase, setWorld, world } from "./core/state.js";
import { aboutModal, canvas, closeDialog, discSheetEl, fadeEl, helpModal, hintBarEl, hudEl, landingEl, openDialog, pauseModal, rideHudEl, snackbar } from "./core/ui.js";
import { $, wait } from "./core/util.js";
import { WORLDS, refreshWorldRows } from "./core/worlds_meta.js";
import { flyHooks, menuScene } from "./game/menu_scene.js";
import { player } from "./game/player.js";
import { boardRide, checkRideProximity, exitRide, hideRidePrompt } from "./game/rides.js";
import { WORLD_CLASSES } from "./worlds/index.js";

export let busy = false;
export async function fadeSwap(fn) {
  fadeEl.classList.add("on");
  await wait(340);
  fn();
  await wait(90);
  fadeEl.classList.remove("on");
}
export function loadWorld(key) {
  if (world) world.dispose();
  sfx.stopWind();
  setBlurWas(false);
  rideHudEl.classList.add("hidden");
  hideRidePrompt();
  discSheetEl.classList.remove("show");
  setWorld(new WORLD_CLASSES[key](), key);
  const meta = WORLDS[key];
  setAccent(meta.acc);
  hudEl.classList.remove("hidden");
  $("#pauseBtn").classList.remove("hidden");
  $("#hudName").textContent = meta.name;
  updateHUDProgress();
  player.reset(world.spawn.x, world.spawn.z, world.spawn.yaw);
  $("#touchUI").classList.toggle("hidden", !touchMode);
  setPhase("play");
  showIntro(meta);
  showHints();
  playMusic(key);
  actionOnWorldLoad(world.scene, key);
  if (!touchMode) tryLock();
}
export function pickWorld(key) {
  if (busy || !WORLDS[key]) return;
  sfx.click();
  sfx.whoosh();
  closeDialog(false);
  if (!touchMode && document.pointerLockElement !== canvas) tryLock();
  if (phase === "menu") {
    landingEl.classList.add("hide");
    setPhase("travel");
    menuScene.startFly(key);
    flyHooks.onDone = () => {
      busy = true;
      fadeSwap(() => {
        loadWorld(key);
        busy = false;
      });
    };
  } else if (world) {
    busy = true;
    fadeSwap(() => {
      loadWorld(key);
      busy = false;
    });
  }
}
export function exitToMenu() {
  if (busy) return;
  busy = true;
  closeDialog(false);
  if (world && world.riding) {
    world.riding = null;
    sfx.stopWind();
    rideHudEl.classList.add("hidden");
  }
  if (document.pointerLockElement) document.exitPointerLock();
  fadeSwap(() => {
    if (world) {
      world.dispose();
      setWorld(null, null);
    }
    hudEl.classList.add("hidden");
    $("#pauseBtn").classList.add("hidden");
    hintBarEl.classList.add("hidden");
    discSheetEl.classList.remove("show");
    hideRidePrompt();
    rideHudEl.classList.add("hidden");
    $("#touchUI").classList.add("hidden");
    actionOnExit();
    menuScene.reset();
    camera.fov = 68;
    camera.updateProjectionMatrix();
    playMusic("menu");
    landingEl.classList.remove("hide");
    refreshWorldRows();
    setPhase("menu");
    busy = false;
  });
}

/* ================= EVENT UI ================= */
$("#openAboutBtn").addEventListener("click", () => {
  sfx.click();
  refreshWorldRows();
  openDialog(aboutModal);
});
$("#helpBtn").addEventListener("click", () => {
  sfx.click();
  openDialog(helpModal);
});
$("#aboutClose").addEventListener("click", () => {
  sfx.click();
  closeDialog(false);
  if (world) openDialog(pauseModal);
});
aboutModal.addEventListener("click", (e) => {
  if (e.target === aboutModal) {
    closeDialog(false);
    if (world) openDialog(pauseModal);
  }
});
$("#helpClose").addEventListener("click", () => {
  sfx.click();
  closeDialog();
});
helpModal.addEventListener("click", (e) => {
  if (e.target === helpModal) closeDialog();
});
$("#pauseBtn").addEventListener("click", () => {
  sfx.click();
  if (phase === "play") openDialog(pauseModal);
});
$("#pauseResume").addEventListener("click", () => {
  sfx.click();
  closeDialog();
});
$("#pauseSwitch").addEventListener("click", () => {
  sfx.click();
  closeDialog(false);
  refreshWorldRows();
  openDialog(aboutModal);
});
$("#pauseHelp").addEventListener("click", () => {
  sfx.click();
  closeDialog(false);
  openDialog(helpModal);
});
$("#pauseMenu").addEventListener("click", () => {
  sfx.click();
  exitToMenu();
});
$("#ridePrompt").addEventListener("click", () => {
  if (world && world.rideNear && phase === "play")
    boardRide(world.rideNear);
});
$("#rhExit").addEventListener("click", () => {
  sfx.click();
  exitRide();
});
$("#touchSwitch").addEventListener("change", (e) => {
  applyTouchMode(e.target.checked);
  snackbar(
    e.target.checked
      ? "Kontrol sentuh aktif — joystick & geser layar"
      : "Kontrol mouse & keyboard aktif",
  );
});
export let muted = false;
$("#muteBtn").addEventListener("click", () => {
  sfx.ensure();
  muted = !muted;
  sfx.setMuted(muted);
  setOstMuted(muted);
  $("#muteIcon").textContent = muted ? "volume_off" : "volume_up";
  snackbar(muted ? "Suara dimatikan" : "Suara aktif");
});

/* ================= INISIALISASI & LOOP ================= */
document.fonts.ready.then(() => document.body.classList.add("fonts-in"));
applyTouchMode(touchMode);
refreshWorldRows();
export let last = performance.now();
export function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  const t = now / 1000;
  try {
    if (phase === "menu" || phase === "travel") {
      menuScene.update(dt, t);
      renderer.setRenderTarget(null);
      renderer.render(menuScene.scene, camera);
    } else if (world) {
      if (phase === "play") {
        if (world.riding) world.updateRide(dt, t);
        else {
          player.update(dt, world);
          checkRideProximity();
        }
        world.update(dt, t);
        checkLandmarks();
        if (!world.riding) updateCompass();
        actionFrame(dt);
      }
      renderFrame(world.scene);
    }
  } catch (err) {
    console.error(err);
  }
}
requestAnimationFrame(loop);
