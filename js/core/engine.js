/* ============================================================
 * js/core/engine.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { canvas } from "./dom.js";
import { clamp, rand } from "./util.js";
import { NPC } from "../game/npc.js";

/* mode sentuh dihitung sendiri di sini — celah impor ke input.js
   dibuka supaya tidak ada siklus impor saat load */
const isTouchDevice =
  matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;

/* ================= THREE — INTI ================= */
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouchDevice ? 1.8 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
export const camera = new THREE.PerspectiveCamera(
  68,
  innerWidth / innerHeight,
  0.1,
  600,
);
camera.rotation.order = "YXZ";
export function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
addEventListener("resize", onResize);
addEventListener("orientationchange", () => setTimeout(onResize, 300));

export const M = {
  std: (c, o = {}) =>
    new THREE.MeshStandardMaterial({
      color: c,
      roughness: o.r ?? 0.9,
      metalness: o.m ?? 0,
    }),
  lam: (c) => new THREE.MeshLambertMaterial({ color: c }),
  bas: (c, o = {}) =>
    new THREE.MeshBasicMaterial({ color: c, toneMapped: false, ...o }),
};
export function box(w, h, d, mat) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
}
export function cyl(rt, rb, h, mat, seg = 16) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
}
export function sph(r, mat, s = 12) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, s, s), mat);
}
export const softTex = (() => {
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
  t.userData.keep = true;
  return t;
})();
export function keep(g) {
  g.userData.keep = true;
  return g;
}
export const G_GEM = keep(new THREE.OctahedronGeometry(0.3)),
  G_BEAM = keep(new THREE.CylinderGeometry(0.06, 0.24, 2.7, 8, 1, true)),
  G_RING = keep(new THREE.RingGeometry(0.5, 0.62, 36)),
  G_TETRA = keep(new THREE.TetrahedronGeometry(0.09));
export function disposeScene(scene) {
  scene.traverse((o) => {
    if (o.geometry && !o.geometry.userData.keep) o.geometry.dispose();
    if (o.material) {
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      ms.forEach((m) => {
        for (const k in m) {
          const v = m[k];
          if (v && v.isTexture && !v.userData.keep) v.dispose();
        }
        m.dispose();
      });
    }
  });
}
export function skyDome(colors, size = 250) {
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 256;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, 256);
  colors.forEach((col, i) =>
    g.addColorStop(i / (colors.length - 1), col),
  );
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
export function mkSprite(scene, color, size, pos, o = {}) {
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
  const gem = new THREE.Mesh(G_GEM, M.bas(color));
  gem.position.y = 2.75;
  gem.scale.setScalar(1.15);
  const beam = new THREE.Mesh(
    G_BEAM,
    M.bas(color, {
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  beam.position.y = 1.4;
  const ring = new THREE.Mesh(
    G_RING,
    M.bas(color, {
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  g.add(gem, beam, ring);
  g.userData = { gem, ring };
  return g;
}
export function makeBurst(scene, pos, color, o = {}) {
  const g = new THREE.Group();
  scene.add(g);
  const items = [];
  const col = new THREE.Color(color);
  for (let i = 0; i < (o.n || 24); i++) {
    const m = new THREE.Mesh(
      G_TETRA,
      M.bas(col.clone().offsetHSL(rand(0, 0.06), 0, rand(-0.08, 0.12))),
    );
    m.position.copy(pos);
    m.scale.setScalar(rand(0.6, 1.6));
    items.push({
      m,
      v: new THREE.Vector3(rand(-1, 1), rand(-0.1, 1.5), rand(-1, 1))
        .normalize()
        .multiplyScalar(rand(2.5, 6.5)),
      rs: rand(4, 10),
    });
    g.add(m);
  }
  let ring = null;
  if (o.ring !== false) {
    ring = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 0.5, 40),
      M.bas(color, {
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, 0.06, pos.z);
    scene.add(ring);
  }
  let life = 0;
  return {
    update(dt) {
      life += dt;
      for (const it of items) {
        it.v.y -= 13 * dt;
        it.m.position.addScaledVector(it.v, dt);
        it.m.rotation.x += it.rs * dt;
        it.m.scale.multiplyScalar(Math.max(0, 1 - dt * 1.7));
      }
      if (ring) {
        ring.scale.setScalar(1 + life * 8);
        ring.material.opacity = Math.max(0, 0.7 * (1 - life / 0.8));
      }
      if (life > 0.85) {
        scene.remove(g);
        if (ring) {
          scene.remove(ring);
          ring.geometry.dispose();
          ring.material.dispose();
        }
        items.forEach((it) => it.m.material.dispose());
        return true;
      }
      return false;
    },
  };
}
export function mkSign(text, color, w, h) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 96;
  const x = c.getContext("2d");
  x.strokeStyle = color;
  x.shadowColor = color;
  x.shadowBlur = 16;
  x.lineWidth = 7;
  x.strokeRect(12, 12, 232, 72);
  x.fillStyle = "#fff";
  x.shadowBlur = 22;
  x.font = "700 40px Sora, sans-serif";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(text, 128, 52);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    M.bas(0xffffff, { map: t, transparent: true }),
  );
}
export function rectPath(H, s) {
  const L = 2 * H,
    per = 8 * H;
  s = ((s % per) + per) % per;
  if (s < L) return { x: -H + s, z: -H, a: Math.PI / 2 };
  s -= L;
  if (s < L) return { x: H, z: -H + s, a: 0 };
  s -= L;
  if (s < L) return { x: H - s, z: H, a: -Math.PI / 2 };
  s -= L;
  return { x: -H, z: H - s, a: Math.PI };
}
export class PolyCurve extends THREE.Curve {
  constructor(pts) {
    super();
    this.pts = pts;
  }
  getPoint(t, target = new THREE.Vector3()) {
    const n = this.pts.length - 1,
      f = clamp(t, 0, 1) * n,
      i = Math.floor(f);
    return target.lerpVectors(
      this.pts[Math.min(i, n)],
      this.pts[Math.min(i + 1, n)],
      f - i,
    );
  }
}

/* ================= NPC & MERPATI ================= */
