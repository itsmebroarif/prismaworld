/* ============================================================
 * js/main/game.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { WeaponManager } from "../weapons.js";
import { MonsterSystem } from "../monsters.js";
import { actionPromptEl, discSheetEl, hudEl, introCard, npcModal, rideHudEl, vehicleHudEl, weaponHudEl } from "./dom.js";
import { camera, carnivalShootingGame, makeBurst, rhythmGame } from "./engine.js";
import { applyTouchMode, touchMode, tryLock } from "./input.js";
import { player } from "./player.js";
import { pad, sfx, snackbar } from "./sound.js";
import { monsterSystem, phase, setMonsterSystem, setPhase, setWeaponManager, setWorld, weaponManager, world, worldKey } from "./state.js";
import { currentPromptTarget } from "./ui.js";
import { $ } from "./util.js";
import { WORLD_CLASSES } from "./world_index.js";
import { WORLDS, disc, discCount, setAccent } from "./worlds_meta.js";

export function loadWorld(key) {
  if (world) world.dispose();
  if (monsterSystem) monsterSystem.clearAll();

  sfx.stopWind();
  sfx.stopEngine();

  rideHudEl.classList.add("hidden");
  vehicleHudEl.classList.add("hidden");
  actionPromptEl.classList.remove("show");
  discSheetEl.classList.remove("show");

  setWorld(new WORLD_CLASSES[key](), key);

  // Initialize Weapon & Monster Systems
  setMonsterSystem(new MonsterSystem(sfx));
  setWeaponManager(new WeaponManager(camera, world.scene, sfx));

  const meta = WORLDS[key];
  setAccent(meta.acc);

  hudEl.classList.remove("hidden");
  $("#pauseBtn").classList.remove("hidden");
  $("#raidBtn").classList.remove("hidden");
  $("#minimapToggleBtn")?.classList.remove("hidden");
  if (key === "funfair") {
    $("#carnivalGamesBtn")?.classList.remove("hidden");
  } else {
    $("#carnivalGamesBtn")?.classList.add("hidden");
  }
  weaponHudEl.classList.remove("hidden");

  $("#hudName").textContent = meta.name;
  updateHUDProgress();
  updateWeaponHUD();

  player.reset(world.spawn.x, world.spawn.z, world.spawn.yaw);
  applyTouchMode(touchMode);

  setPhase("play");
  showIntro(meta);
  pad.start(key);

  if (!touchMode) tryLock();
}
function updateHUDProgress() {
  const found = discCount(worldKey);
  const total = WORLDS[worldKey].total;
  $("#hudCount").textContent = `${found}/${total}`;
  $("#hudFill").style.width = `${(found / total) * 100}%`;
}
export function updateWeaponHUD() {
  if (!weaponManager) return;
  const def = weaponManager.current();
  const ammo = weaponManager.currentAmmo();
  $("#wepName").textContent = def.name;
  $("#wepAmmo").textContent = `${ammo.mag} / ${ammo.reserve}`;
  $("#wepIco").textContent = def.icon;
  document.querySelectorAll(".wep-btn").forEach((btn, i) => {
    btn.classList.toggle("active", i === weaponManager.currentIndex);
  });
}
function showIntro(meta) {
  $("#icKicker").textContent = `DUNIA ${meta.idx} · PRISMA WORLDS`;
  $("#icTitle").textContent = meta.name;
  $("#icRule").style.background = meta.acc;
  $("#icChips").innerHTML = `
    <span class="chip"><span class="msr sm">explore</span>${meta.total} Landmark</span>
    <span class="chip"><span class="msr sm">electric_car</span>Kendaraan</span>
    <span class="chip"><span class="msr sm">military_tech</span>Arsenal &amp; Titan</span>
  `;
  introCard.classList.remove("show");
  void introCard.offsetWidth;
  introCard.classList.add("show");
  setTimeout(() => introCard.classList.remove("show"), 2800);
}


/* ================= INTERACTION PROMPT LOGIC ================= */
export function checkInteractions() {
  if (!world || phase !== "play") return;

  // 1. If currently driving a vehicle
  if (world.drivingVehicle) {
    actionPromptEl.classList.remove("show");
    currentPromptTarget = null;
    return;
  }
  // 2. If currently riding coaster/wheel/carousel
  if (world.riding) {
    actionPromptEl.classList.remove("show");
    currentPromptTarget = null;
    return;
  }

  let nearestTarget = null;
  let minDistance = 3.4;

  // Check vehicles
  for (const v of world.vehicles) {
    const d = player.pos.distanceTo(v.pos);
    if (d < minDistance) {
      minDistance = d;
      nearestTarget = {
        type: "vehicle",
        obj: v,
        label: `Kendarai ${v.name}`,
        icon: "electric_car",
      };
    }
  }

  // Check NPCs
  const npc = world.npcSystem.getNearest(player.pos, minDistance);
  if (npc) {
    minDistance = player.pos.distanceTo(npc.pos);
    nearestTarget = {
      type: "npc",
      obj: npc,
      label: `Bicara dengan ${npc.name}`,
      icon: "forum",
    };
  }

  // Check rides
  for (const r of world.rides) {
    const d = Math.hypot(player.pos.x - r.x, player.pos.z - r.z);
    if (d < r.r && d < minDistance) {
      minDistance = d;
      nearestTarget = {
        type: "ride",
        obj: r,
        label: `Naik ${r.label}`,
        icon: r.icon,
      };
    }
  }

  // Check minigames
  if (world.minigames) {
    for (const mg of world.minigames) {
      const d = Math.hypot(player.pos.x - mg.x, player.pos.z - mg.z);
      if (d < mg.r && d < minDistance) {
        minDistance = d;
        nearestTarget = {
          type: "minigame",
          obj: mg,
          label: mg.label,
          icon: mg.icon,
        };
      }
    }
  }

  if (nearestTarget) {
    currentPromptTarget = nearestTarget;
    $("#apTitle").textContent = nearestTarget.label;
    $("#apIcon").textContent = nearestTarget.icon;
    actionPromptEl.classList.add("show");
  } else {
    currentPromptTarget = null;
    actionPromptEl.classList.remove("show");
  }
}
export function handleInteraction() {
  if (!currentPromptTarget) return;
  sfx.click();

  if (currentPromptTarget.type === "vehicle") {
    boardVehicle(currentPromptTarget.obj);
  } else if (currentPromptTarget.type === "npc") {
    openNPCDialog(currentPromptTarget.obj);
  } else if (currentPromptTarget.type === "ride") {
    boardRide(currentPromptTarget.obj);
  } else if (currentPromptTarget.type === "minigame") {
    if (currentPromptTarget.obj.id === "rhythm") {
      rhythmGame.open();
    } else if (currentPromptTarget.obj.id === "shooting") {
      carnivalShootingGame.open();
    }
  }
}


// Vehicle Board & Exit
function boardVehicle(v) {
  world.drivingVehicle = v;
  v.mounted = true;
  actionPromptEl.classList.remove("show");
  vehicleHudEl.classList.remove("hidden");
  $("#vhTitle").textContent = v.name;
  snackbar(`Kamu mengendarai ${v.name}! Gunakan WASD/Joystick untuk menyetir.`);
}
export function exitVehicle() {
  if (!world || !world.drivingVehicle) return;
  const v = world.drivingVehicle;
  v.mounted = false;
  world.drivingVehicle = null;
  sfx.stopEngine();
  vehicleHudEl.classList.add("hidden");
  const ex = v.getExitPos();
  player.reset(ex.x, ex.z, ex.yaw);
}


// Rides Board & Exit
function boardRide(ride) {
  if (!world || world.riding || phase !== "play") return;
  sfx.click();
  world.riding = {
    type: ride.type,
    label: ride.label,
    elapsed: 0,
    lap: 0,
    s: 0,
    v: 4,
    roll: 0,
    yawOff: 0,
    pitchOff: 0,
  };
  actionPromptEl.classList.remove("show");
  rideHudEl.classList.remove("hidden");
  $("#rhName").textContent = ride.label.toUpperCase();
  if (ride.type === "coaster") {
    sfx.startWind();
    snackbar("Prisma Cyclone dimulai! Pegangan erat-erat ya.");
  } else if (ride.type === "wheel") {
    snackbar("Menikmati panorama indah dari Bianglala Senja!");
  } else if (ride.type === "droptower") {
    snackbar("Menara Terjun Bebas: Bersiaplah meluncur dari puncak 38 meter!");
  } else if (ride.type === "vikingship") {
    snackbar("Kapal Bajak Laut: Sensasi berayun tinggi di udara!");
  } else if (ride.type === "carousel") {
    snackbar("Komedi Putar: Berputar manis di atas kuda kayu klasik!");
  } else if (ride.type === "teacups") {
    snackbar("Cangkir Berputar: Wahana ria berputar mengitari teko emas!");
  }
  updateRideHUD(world.riding);
}
export function exitRide() {
  if (!world || !world.riding) return;
  const r = world.riding;
  world.riding = null;
  sfx.stopWind();
  rideHudEl.classList.add("hidden");
  const def = world.rides.find((x) => x.type === r.type);
  if (def) player.reset(def.exit.x, def.exit.z, def.exit.yaw);
  else player.reset(world.spawn.x, world.spawn.z, world.spawn.yaw);
}
export function updateRideHUD(r) {
  if (!r) return;
  const m = Math.floor(r.elapsed / 60),
    s2 = String(Math.floor(r.elapsed % 60)).padStart(2, "0");
  $("#rhTime").textContent = `${m}:${s2}`;
  const fill = $("#rhFill");
  if (r.type === "coaster") {
    $("#rhLap").textContent = `LAP ${r.lap + 1}/6`;
    $("#rhSpeed").textContent = `${Math.round(r.v * 3.6)} km/j`;
    fill.classList.remove("indet");
    fill.style.width = `${Math.min(100, (r.s / (world.coaster.L * 6)) * 100)}%`;
  } else if (r.type === "wheel") {
    const py = world.parkManager
      ? Math.round(
          world.parkManager.wheelY +
            Math.sin(world.parkManager.wheelAng) * world.parkManager.wheelR,
        )
      : 16;
    $("#rhLap").textContent = `Tinggi: ${py}m`;
    $("#rhSpeed").textContent = "12 RPM";
    fill.classList.add("indet");
  } else if (r.type === "droptower") {
    const dy = world.parkManager ? Math.round(world.parkManager.dropY) : 2;
    $("#rhLap").textContent = `Tinggi: ${dy}m`;
    $("#rhSpeed").textContent = world.parkManager
      ? world.parkManager.dropState.toUpperCase()
      : "SIAP";
    fill.classList.add("indet");
  } else if (r.type === "vikingship") {
    const deg = world.parkManager
      ? Math.round(Math.abs(world.parkManager.shipAng * (180 / Math.PI)))
      : 0;
    $("#rhLap").textContent = `Ayunan: ${deg}°`;
    $("#rhSpeed").textContent = "AYUN MAKSIMAL";
    fill.classList.add("indet");
  } else if (r.type === "teacups") {
    $("#rhLap").textContent = "Cangkir Putar";
    $("#rhSpeed").textContent = "45 RPM";
    fill.classList.add("indet");
  } else if (r.type === "carousel") {
    $("#rhLap").textContent = "Komedi Putar";
    $("#rhSpeed").textContent = "18 RPM";
    fill.classList.add("indet");
  } else {
    $("#rhLap").textContent = r.label;
    $("#rhSpeed").textContent = "—";
    fill.classList.add("indet");
  }
}


// NPC Dialog
function openNPCDialog(npc) {
  sfx.chime();
  $("#npcName").textContent = npc.name;
  $("#npcRole").textContent = npc.title;
  $("#npcSpeech").textContent = npc.speech;
  npcModal.classList.add("open");
  setPhase("paused");
}


$("#npcActionWeapon").addEventListener("click", () => {
  if (weaponManager) weaponManager.refillAllAmmo();
  snackbar("Senjata & Amunisi terisi penuh! Siap tempur!");
  npcModal.classList.remove("open");
  setPhase("play");
  if (!touchMode) tryLock();
});

$("#npcActionRaid").addEventListener("click", () => {
  npcModal.classList.remove("open");
  setPhase("play");
  if (monsterSystem) monsterSystem.spawnRaid(world.scene, player.pos);
  if (!touchMode) tryLock();
});

$("#npcActionClose").addEventListener("click", () => {
  npcModal.classList.remove("open");
  setPhase("play");
  if (!touchMode) tryLock();
});

// Landmark Check
export function checkLandmarks() {
  if (!world) return;
  for (const l of world.landmarks) {
    if (l.found) continue;
    const d = Math.hypot(player.pos.x - l.x, player.pos.z - l.z);
    if (d < l.r) {
      l.found = true;
      l.beacon.visible = false;
      disc[worldKey][l.id] = true;
      try {
        localStorage.setItem("prisma-disc", JSON.stringify(disc));
      } catch (e) {}
      sfx.fanfare();
      world.bursts.push(
        makeBurst(world.scene, new THREE.Vector3(l.x, 1.2, l.z), l.color),
      );
      updateHUDProgress();
      // Show disc sheet
      $("#dsTitle").textContent = l.title;
      $("#dsFact").textContent = l.fact;
      $("#dsIcon").textContent = l.icon || "explore";
      discSheetEl.classList.add("show");
      setTimeout(() => discSheetEl.classList.remove("show"), 5000);
      break;
    }
  }
}


// Compass HUD
export function updateCompass() {
  const deg = ((((-player.yaw * 180) / Math.PI) % 360) + 360) % 360;
  const strip = $("#compassStrip");
  if (strip) strip.style.transform = `translateX(${-deg * 4}px)`;
}
