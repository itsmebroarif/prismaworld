/* ============================================================
 * js/action/nightvision.js — Night Vision untuk map gelap
 * ============================================================ */
import * as THREE from "three";
import { $ } from "../core/util.js";
import { snackbar } from "../core/ui.js";
import { sfx } from "../core/audio.js";

/** dunia yang areanya gelap */
const DARK_MAPS = new Set(["server", "city", "funfair", "forest", "orbit"]);

export function isDarkMap(key) {
  return DARK_MAPS.has(key);
}

let on = false;
let light = null;
let sceneRef = null;
const _dir = new THREE.Vector3();

function ensureLight() {
  if (light) return light;
  light = new THREE.PointLight(0x9dff9d, 0, 55, 1.2);
  light.name = "nightVisionLight";
  return light;
}

export function setNvScene(scene) {
  sceneRef = scene;
  if (on && sceneRef) {
    ensureLight();
    if (light.parent !== sceneRef) sceneRef.add(light);
  }
}

export function isNvOn() {
  return on;
}

export function toggleNv(force) {
  const next = typeof force === "boolean" ? force : !on;
  if (next === on) return on;
  on = next;
  document.body.classList.toggle("nv", on);
  const btn = $("#nvBtn");
  if (btn) btn.classList.toggle("active", on);
  if (on) {
    if (sceneRef) {
      ensureLight();
      if (light.parent !== sceneRef) sceneRef.add(light);
    }
    sfx.tone({ f: 880, f2: 1320, t: 0.1, type: "square", g: 0.07 });
    snackbar("Night vision ON — area gelap terlihat jelas");
  } else {
    if (light) light.intensity = 0;
    sfx.tone({ f: 1320, f2: 660, t: 0.1, type: "square", g: 0.07 });
    snackbar("Night vision OFF");
  }
  return on;
}

export function updateNv(camera) {
  if (!on || !light) return;
  light.position.copy(camera.position);
  camera.getWorldDirection(_dir);
  light.position.addScaledVector(_dir, 0.5);
  light.intensity = 26;
}

/** dipanggil saat keluar dunia / ganti dunia */
export function resetNv() {
  on = false;
  document.body.classList.remove("nv");
  const btn = $("#nvBtn");
  if (btn) btn.classList.remove("active");
  if (light) light.intensity = 0;
}
