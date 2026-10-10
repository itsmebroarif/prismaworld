/* ============================================================
 * js/core/hud.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import { sfx } from "./audio.js";
import { camera } from "./engine.js";
import { touchMode } from "./input.js";
import { world, worldKey } from "./state.js";
import { discSheetEl, hintBarEl, introCard } from "./ui.js";
import { $ } from "./util.js";
import { WORLDS, disc, saveDisc } from "./worlds_meta.js";
import { player } from "../game/player.js";

export let discT;
export const strip = $("#compassStrip"),
  ppd = 2;
for (let d = -360; d <= 720; d += 45) {
  const sp = document.createElement("span");
  const c = ((d % 360) + 360) % 360;
  if (c % 90 === 0) sp.textContent = "UTSB"[c / 90];
  else sp.className = "tick";
  sp.style.left = 1440 + d * ppd + "px";
  strip.appendChild(sp);
}
export function updateCompass() {
  const deg = ((((-player.yaw * 180) / Math.PI) % 360) + 360) % 360;
  strip.style.transform = `translateX(${$("#compass").offsetWidth / 2 - 1440 - deg * ppd}px)`;
}
export function setAccent(acc) {
  document.documentElement.style.setProperty("--acc", acc);
}
export function updateHUDProgress() {
  if (!world) return;
  const found = world.landmarks.filter((l) => l.found).length,
    total = world.landmarks.length;
  $("#hudCount").textContent = found + "/" + total;
  $("#hudFill").style.width = (found / total) * 100 + "%";
}
export function showDiscSheet(l, allDone = false) {
  const kick = $("#dsKick"),
    ico = $("#dsIcon");
  if (allDone) {
    kick.textContent = "JELAJAHAN SELESAI";
    ico.textContent = "emoji_events";
    $("#dsTitle").textContent = "Semua landmark ditemukan!";
    $("#dsFact").textContent =
      "Kamu telah menjelajahi seluruh dunia ini. Tinggal menikmati pemandangannya — selama apa pun kamu mau.";
  } else {
    kick.textContent = "LANDMARK DITEMUKAN";
    ico.textContent = l.icon;
    $("#dsTitle").textContent = l.title;
    $("#dsFact").textContent = l.fact;
  }
  $("#dsDots").innerHTML = world.landmarks
    .map((x) => `<i class="${x.found ? "on" : ""}"></i>`)
    .join("");
  discSheetEl.classList.add("show");
  clearTimeout(discT);
  discT = setTimeout(
    () => discSheetEl.classList.remove("show"),
    allDone ? 7000 : 5500,
  );
}
export function checkLandmarks() {
  if (!world) return;
  for (const l of world.landmarks) {
    if (l.found) continue;
    const dx = camera.position.x - l.x,
      dz = camera.position.z - l.z;
    if (dx * dx + dz * dz < l.r * l.r) {
      l.found = true;
      disc[worldKey][l.id] = true;
      saveDisc();
      world.onDiscover(l);
      updateHUDProgress();
      sfx.chime();
      if (navigator.vibrate) navigator.vibrate(30);
      showDiscSheet(l);
      if (world.landmarks.every((x) => x.found)) {
        setTimeout(() => {
          showDiscSheet(null, true);
          sfx.fanfare();
          if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
        }, 1600);
      }
    }
  }
}

/* ================= INTRO & HINT ================= */
export let icT;
export function showIntro(meta) {
  $("#icKicker").textContent = "PRISMA WORLDS — DUNIA " + meta.idx;
  $("#icTitle").textContent = meta.name;
  $("#icRule").style.background = meta.acc;
  introCard.style.setProperty("--acc", meta.acc);
  const chips = touchMode
    ? [
        ["gamepad", "Joystick — berjalan"],
        ["swipe", "Geser layar — melihat 360°"],
        ["explore", "Dekati pilar cahaya"],
      ]
    : [
        ["mouse", "Mouse — melihat 360°"],
        ["keyboard", "WASD — berjalan"],
        ["bolt", "Shift lari · Spasi lompat"],
      ];
  $("#icChips").innerHTML = chips
    .map(
      (c) =>
        `<span class="chip"><span class="msr sm">${c[0]}</span>${c[1]}</span>`,
    )
    .join("");
  introCard.classList.remove("show");
  void introCard.offsetWidth;
  introCard.classList.add("show");
  clearTimeout(icT);
  icT = setTimeout(() => introCard.classList.remove("show"), 2600);
}
export function showHints() {
  hintBarEl.innerHTML = (
    touchMode
      ? [
          ["gamepad", "Dorong penuh joystick untuk lari"],
          ["toys", "Dekati wahana lalu ketuk kartunya"],
          ["explore", "Pilar cahaya = landmark"],
        ]
      : [
          ["mouse", "Klik layar untuk mengunci kursor"],
          ["toys", "Tekan E dekat wahana untuk naik"],
          ["explore", "Pilar cahaya = landmark"],
          ["pause", "Esc — jeda"],
        ]
  )
    .map(
      (c) =>
        `<span class="chip"><span class="msr sm">${c[0]}</span>${c[1]}</span>`,
    )
    .join("");
  hintBarEl.classList.remove("hidden", "gone");
  setTimeout(() => hintBarEl.classList.add("gone"), 9000);
}

/* ================= SISTEM WAHANA ================= */
