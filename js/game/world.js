/* ============================================================
 * js/game/world.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { disposeScene, makeBeacon, makeBurst } from "../core/engine.js";
import { world } from "../core/state.js";
import { WORLDS, disc } from "../core/worlds_meta.js";
import { NPC, Pigeon } from "./npc.js";

export function resolveColliders(p, world) {
  const R = 0.35;
  const push = (cx, cz, cr) => {
    const dx = p.x - cx,
      dz = p.z - cz,
      d = Math.hypot(dx, dz),
      m = cr + R;
    if (d < m && d > 1e-4) {
      p.x = cx + (dx / d) * m;
      p.z = cz + (dz / d) * m;
    }
  };
  for (const c of world.colC) push(c.x, c.z, c.r);
  for (const r of world.colR) {
    const dx = p.x - r.x,
      dz = p.z - r.z;
    if (Math.abs(dx) < r.hw + R && Math.abs(dz) < r.hd + R) {
      const px = r.hw + R - Math.abs(dx),
        pz = r.hd + R - Math.abs(dz);
      if (px < pz) p.x = r.x + (dx >= 0 ? 1 : -1) * (r.hw + R);
      else p.z = r.z + (dz >= 0 ? 1 : -1) * (r.hd + R);
    }
  }
  if (world.dynCol) for (const c of world.dynCol) push(c.x, c.z, c.r);
}
export class World {
  constructor(key) {
    this.scene = new THREE.Scene();
    this.key = key;
    this.colC = [];
    this.colR = [];
    this.dynCol = null;
    this.landmarks = [];
    this.animFns = [];
    this.bursts = [];
    this.npcs = [];
    this.pigeons = [];
    this.rides = [];
    this.riding = null;
    this.rideNear = null;
    this.spawn = { x: 0, z: 20, yaw: 0 };
    this.fovBase = 70;
    this.gravity = 22;
    this.jumpV = 7.4;
  }
  cCol(x, z, r) {
    this.colC.push({ x, z, r });
  }
  rCol(x, z, hw, hd) {
    this.colR.push({ x, z, hw, hd });
  }
  spawnNPC(n, cx, cz, r, o = {}) {
    for (let i = 0; i < n; i++)
      this.npcs.push(new NPC(this.scene, this, cx, cz, r, o));
  }
  spawnPigeons(n, cx, cz, r) {
    for (let i = 0; i < n; i++)
      this.pigeons.push(new Pigeon(this.scene, cx, cz, r));
  }
  landmark(def) {
    def.found = !!(disc[this.key] && disc[this.key][def.id]);
    const b = makeBeacon(def.color || WORLDS[this.key].hex);
    b.position.set(def.x, 0, def.z);
    if (def.found) b.visible = false;
    def.beacon = b;
    this.scene.add(b);
    this.landmarks.push(def);
    const ph = def.x * 0.7;
    this.animFns.push((dt, t) => {
      if (def.found) return;
      b.userData.gem.rotation.y += dt * 2.2;
      b.position.y = Math.sin(t * 2 + ph) * 0.12;
      b.userData.ring.material.opacity =
        0.35 + 0.2 * Math.sin(t * 3 + ph);
    });
  }
  onDiscover(l) {
    l.found = true;
    l.beacon.visible = false;
    this.bursts.push(
      makeBurst(
        this.scene,
        new THREE.Vector3(l.x, 1.3, l.z),
        l.color || WORLDS[this.key].hex,
      ),
    );
  }
  updateRide(dt, t) {}
  update(dt, t) {
    for (const f of this.animFns) f(dt, t);
    for (let i = this.bursts.length - 1; i >= 0; i--)
      if (this.bursts[i].update(dt)) this.bursts.splice(i, 1);
    for (const n of this.npcs) n.update(dt, t);
    for (const p of this.pigeons) p.update(dt);
  }
  clampBounds(p) {}
  dispose() {
    disposeScene(this.scene);
  }
}

/* ================= SCENE MENU — 9 pecahan dunia ================= */
