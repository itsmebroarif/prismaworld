/* ============================================================
 * js/main/android_ui.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import { arsenalModal, fadeEl, helpModal, landingEl, titanModal } from "./dom.js";
import { loadWorld } from "./game.js";
import { sfx, snackbar } from "./sound.js";
import { addRipple, openDialog } from "./ui.js";
import { $, wait } from "./util.js";
import { WORLDS, discCount } from "./worlds_meta.js";



/* ================= MODERN ANDROID MAIN MENU CONTROLLER ================= */
export function buildAndroidWorldCards(filter = "all") {
  const grid = $("#m3WorldGrid");
  if (!grid) return;
  grid.innerHTML = Object.entries(WORLDS)
    .filter(([k, w]) => {
      if (filter === "all") return true;
      return w.cat === filter;
    })
    .map(([k, w]) => {
      const n = discCount(k);
      return `
      <div class="w-card" data-key="${k}" style="--card-acc:${w.acc}">
        <div>
          <div class="w-top">
            <div class="w-ico"><span class="msr">${w.icon}</span></div>
            <span class="w-idx">${w.idx}</span>
          </div>
          <div class="w-name">${w.name}</div>
          <div class="w-desc">${w.desc}</div>
          <div class="w-tags">
            <span class="w-tag">${n}/${w.total} Landmark</span>
            <span class="w-tag">Kendaraan</span>
            <span class="w-tag">Titan Boss</span>
          </div>
        </div>
        <button class="w-btn"><span class="msr sm">play_arrow</span>Jelajahi Dunia</button>
      </div>
    `;
    })
    .join("");

  document.querySelectorAll(".w-card").forEach((card) => {
    addRipple(card);
    card.addEventListener("click", () => {
      sfx.click();
      sfx.whoosh();
      const key = card.dataset.key;
      fadeSwap(() => loadWorld(key));
    });
  });
}


// Clock updates
setInterval(() => {
  const d = new Date();
  const clk = $("#androidClock");
  if (clk)
    clk.textContent = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}, 1000);

// Category filter chips
document.querySelectorAll(".m3-chips-row .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    sfx.click();
    document
      .querySelectorAll(".m3-chips-row .chip")
      .forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    buildAndroidWorldCards(chip.dataset.filter);
  });
});

// Android Bottom Navigation Tabs
$("#tabWorlds").addEventListener("click", () => {
  sfx.click();
  setActiveTab("tabWorlds");
  $("#m3HeroCard").style.display = "block";
  buildAndroidWorldCards("all");
});
$("#tabArsenal").addEventListener("click", () => {
  sfx.click();
  openDialog(arsenalModal);
});
$("#tabTitans").addEventListener("click", () => {
  sfx.click();
  openDialog(titanModal);
});
$("#tabControls").addEventListener("click", () => {
  sfx.click();
  openDialog(helpModal);
});

function setActiveTab(id) {
  document
    .querySelectorAll(".m3-nav-bar .nav-tab")
    .forEach((t) => t.classList.toggle("active", t.id === id));
}
export const m3DeviceEl = $(".m3-device");
export const worldViewOverlayEl = $("#worldViewOverlay");
function setViewWorldMode(show) {
  if (show) {
    sfx.click();
    if (m3DeviceEl) m3DeviceEl.classList.add("minimized");
    if (worldViewOverlayEl) worldViewOverlayEl.classList.remove("hidden");
    snackbar("Mode Jelajah 3D Dunia Aktif. Geser untuk memutar!");
  } else {
    sfx.click();
    if (m3DeviceEl) m3DeviceEl.classList.remove("minimized");
    if (worldViewOverlayEl) worldViewOverlayEl.classList.add("hidden");
  }
}


$("#toggleViewWorldBtn")?.addEventListener("click", () =>
  setViewWorldMode(true),
);
$("#backToMenuBtn")?.addEventListener("click", () => setViewWorldMode(false));

$("#quickPlayBtn").addEventListener("click", () => {
  sfx.click();
  sfx.whoosh();
  fadeSwap(() => loadWorld("funfair"));
});
$("#m3HelpBtn").addEventListener("click", () => openDialog(helpModal));

export async function fadeSwap(fn) {
  fadeEl.classList.add("on");
  landingEl.classList.add("hide");
  if (worldViewOverlayEl) worldViewOverlayEl.classList.add("hidden");
  if (m3DeviceEl) m3DeviceEl.classList.remove("minimized");
  await wait(350);
  fn();
  await wait(100);
  fadeEl.classList.remove("on");
}
