/* ============================================================
 * js/main/engine.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { MenuWorldScene } from "../menu_world.js";
import { Minimap } from "../minimap.js";
import { RhythmGame } from "../rhythm_game.js";
import { CarnivalShootingGame } from "../carnival_games.js";
import { canvas } from "./dom.js";
import { touchMode } from "./input.js";
import { sfx } from "./sound.js";
import { $, rand } from "./util.js";



/* ================= THREE.JS ENGINE CORE ================= */
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

renderer.setPixelRatio(Math.min(devicePixelRatio, touchMode ? 1.8 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

export const camera = new THREE.PerspectiveCamera(
  68,
  innerWidth / innerHeight,
  0.1,
  700,
);

camera.rotation.order = "YXZ";

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

export const menuWorld = new MenuWorldScene(renderer);
export const minimap = new Minimap({
  containerEl: $("#minimapContainer"),
  canvasEl: $("#minimapCanvas"),
  toggleBtnEl: $("#minimapToggleBtn"),
});
export const rhythmGame = new RhythmGame({
  containerEl: $("#rhythmModal"),
  sfx,
});
export const carnivalShootingGame = new CarnivalShootingGame({
  containerEl: $("#shootingModal"),
  sfx,
});
export const M = {
  std: (c, o = {}) =>
    new THREE.MeshStandardMaterial({
      color: c,
      roughness: o.r ?? 0.85,
      metalness: o.m ?? 0,
    }),
  lam: (c) => new THREE.MeshLambertMaterial({ color: c }),
  bas: (c, o = {}) =>
    new THREE.MeshBasicMaterial({ color: c, toneMapped: false, ...o }),
};
export const box = (w, h, d, mat) =>
  new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
export const cyl = (rt, rb, h, mat, seg = 16) =>
  new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
export const sph = (r, mat, s = 12) =>
  new THREE.Mesh(new THREE.SphereGeometry(r, s, s), mat);
const softTex = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,.7)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.userData = { keep: true };
  return t;
})();
export function skyDome(colors, size = 260) {
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 256;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 256);
  colors.forEach((col, i) => g.addColorStop(i / (colors.length - 1), col));
  x.fillStyle = g;
  x.fillRect(0, 0, 16, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.SphereGeometry(size, 24, 16),
    new THREE.MeshBasicMaterial({
      map: t,
      side: THREE.BackSide,
      fog: false,
      toneMapped: false,
    }),
  );
}
function mkSprite(scene, color, size, pos, o = {}) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: softTex,
      color,
      transparent: true,
      opacity: o.opacity ?? 1,
      depthWrite: false,
      fog: false,
    }),
  );
  s.scale.setScalar(size);
  s.position.set(...pos);
  scene.add(s);
  return s;
}
export function makeBeacon(color) {
  const g = new THREE.Group();
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), M.bas(color));
  gem.position.y = 2.75;
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.24, 2.7, 8, 1, true),
    M.bas(color, {
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  beam.position.y = 1.4;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.5, 0.62, 36),
    M.bas(color, { transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  g.add(gem, beam, ring);
  g.userData = { gem, ring };
  return g;
}
export function makeBurst(scene, pos, color) {
  const g = new THREE.Group();
  scene.add(g);
  const items = [];
  const col = new THREE.Color(color);
  for (let i = 0; i < 24; i++) {
    const m = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.12),
      M.bas(col.clone().offsetHSL(rand(0, 0.06), 0, rand(-0.08, 0.12))),
    );
    m.position.copy(pos);
    items.push({
      m,
      v: new THREE.Vector3(rand(-1, 1), rand(-0.1, 1.5), rand(-1, 1))
        .normalize()
        .multiplyScalar(rand(3, 7)),
      rs: rand(4, 10),
    });
    g.add(m);
  }
  let life = 0;
  return {
    update(dt) {
      life += dt;
      for (const it of items) {
        it.v.y -= 13 * dt;
        it.m.position.addScaledVector(it.v, dt);
        it.m.rotation.x += it.rs * dt;
        it.m.scale.multiplyScalar(Math.max(0, 1 - dt * 1.8));
      }
      if (life > 0.85) {
        scene.remove(g);
        items.forEach((it) => it.m.material.dispose());
        return true;
      }
      return false;
    },
  };
}
function mkSign(text, color, w, h) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 96;
  const x = c.getContext("2d");
  x.strokeStyle = color;
  x.shadowColor = color;
  x.shadowBlur = 14;
  x.lineWidth = 6;
  x.strokeRect(10, 10, 236, 76);
  x.fillStyle = "#fff";
  x.shadowBlur = 20;
  x.font = "700 38px Sora, sans-serif";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(text, 128, 50);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    M.bas(0xffffff, { map: t, transparent: true }),
  );
}
