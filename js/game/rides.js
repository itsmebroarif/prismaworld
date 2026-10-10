/* ============================================================
 * js/game/rides.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import { sfx } from "../core/audio.js";
import { camera } from "../core/engine.js";
import { touchMode, tryLock } from "../core/input.js";
import { phase, world } from "../core/state.js";
import { rideHudEl, ridePromptEl, snackbar } from "../core/ui.js";
import { $, clamp } from "../core/util.js";
import { player } from "./player.js";
import { LAP_NAMES } from "../worlds/funfair.js";

export let promptRide = null;
export function hideRidePrompt() {
  ridePromptEl.classList.remove("show");
  promptRide = null;
}
export function checkRideProximity() {
  if (!world) return;
  if (world.riding || !world.rides.length) {
    if (world.rideNear) {
      world.rideNear = null;
      hideRidePrompt();
    }
    return;
  }
  let best = null,
    bd = 1e9;
  for (const r of world.rides) {
    const d = Math.hypot(player.pos.x - r.x, player.pos.z - r.z);
    if (d < r.r && d < bd) {
      bd = d;
      best = r;
    }
  }
  if (best !== promptRide) {
    promptRide = best;
    world.rideNear = best;
    if (best) {
      $("#rpTitle").textContent = best.label;
      $("#rpIcon").textContent = best.icon;
      ridePromptEl.classList.add("show");
    } else hideRidePrompt();
  }
}
export function boardRide(ride) {
  if (!world || world.riding || phase !== "play" || !ride) return;
  sfx.ensure();
  sfx.click();
  world.riding = {
    type: ride.type,
    label: ride.label,
    elapsed: 0,
    lap: 0,
    s: 0,
    v: 3,
    roll: 0,
    yawOff: 0,
    pitchOff: 0,
    blur: 0,
  };
  world.rideNear = null;
  hideRidePrompt();
  if (navigator.vibrate) navigator.vibrate(20);
  if (touchMode) $("#touchUI").classList.add("hidden");
  rideHudEl.classList.remove("hidden");
  $("#rhName").textContent = ride.label.toUpperCase();
  if (ride.type === "coaster") {
    sfx.startWind();
    snackbar("Prisma Cyclone — 6 lap · ±5 menit. Pegang erat!");
  }
  updateRideHUD(world.riding);
}
export function exitRide() {
  if (!world || !world.riding) return;
  const r = world.riding;
  world.riding = null;
  world.rideNear = null;
  sfx.stopWind();
  hideRidePrompt();
  rideHudEl.classList.add("hidden");
  if (touchMode) $("#touchUI").classList.remove("hidden");
  const def = world.rides.find((x) => x.type === r.type);
  if (def) player.reset(def.exit.x, def.exit.z, def.exit.yaw);
  else player.reset(world.spawn.x, world.spawn.z, world.spawn.yaw);
  camera.fov = world.fovBase;
  camera.updateProjectionMatrix();
  if (!touchMode) tryLock();
}
export function updateRideHUD(r) {
  if (!r) return;
  const m = Math.floor(r.elapsed / 60),
    s2 = String(Math.floor(r.elapsed % 60)).padStart(2, "0");
  $("#rhTime").textContent = m + ":" + s2;
  const fill = $("#rhFill");
  if (r.type === "coaster" && world.coaster) {
    $("#rhLap").textContent = LAP_NAMES[Math.min(r.lap, 5)];
    $("#rhSpeed").textContent = Math.round(r.v * 3.6) + " km/j";
    fill.classList.remove("indet");
    fill.style.width =
      clamp(r.s / (world.coaster.L * 6), 0, 1) * 100 + "%";
  } else {
    $("#rhLap").textContent = r.label;
    $("#rhSpeed").textContent = "santai";
    fill.classList.add("indet");
  }
}

/* ================= ALUR ================= */
