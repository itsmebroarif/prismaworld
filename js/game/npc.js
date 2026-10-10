/* ============================================================
 * js/game/npc.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { M, box, cyl, sph } from "../core/engine.js";
import { world } from "../core/state.js";
import { clamp, rand, randi } from "../core/util.js";
import { player } from "./player.js";

export class NPC {
  constructor(scene, world, cx, cz, r, o = {}) {
    this.world = world;
    this.cx = cx;
    this.cz = cz;
    this.r = r;
    this.speed = o.speed ?? rand(0.9, 1.5);
    this.idle = !!o.idle;
    const g = (this.g = new THREE.Group());
    const skin = M.lam(
      [0xf2c9a0, 0xd9a06b, 0xa9714b, 0x8a5a3a, 0xf7d7c0][randi(0, 4)],
    );
    const cloth = M.std(
      [
        0xff7bac, 0x4ddac2, 0xffc24d, 0x7ce3a0, 0x9d8bff, 0xff8a5c,
        0xf0eaf4, 0x5fb0ff,
      ][randi(0, 7)],
      { r: 0.85 },
    );
    const pants = M.std(0x35304a, { r: 0.9 });
    const hairM = M.std(
      [0x2a2028, 0x4a3222, 0x6e4a2f, 0x1a1a22, 0x8a6a4a][randi(0, 4)],
      { r: 0.9 },
    );
    this.legL = box(0.13, 0.52, 0.15, pants);
    this.legL.position.set(-0.09, 0.26, 0);
    this.legR = this.legL.clone();
    this.legR.position.x = 0.09;
    this.body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.17, 0.4, 3, 8),
      cloth,
    );
    this.body.position.y = 0.82;
    this.armL = box(0.09, 0.4, 0.11, cloth);
    this.armL.position.set(-0.25, 0.9, 0);
    this.armR = this.armL.clone();
    this.armR.position.x = 0.25;
    this.head = sph(0.15, skin, 10);
    this.head.position.y = 1.26;
    this.hair = sph(0.155, hairM, 10);
    this.hair.scale.set(1, 0.72, 1);
    this.hair.position.set(0, 1.32, -0.04);
    g.add(
      this.legL,
      this.legR,
      this.body,
      this.armL,
      this.armR,
      this.head,
      this.hair,
    );
    this.x = cx;
    this.z = cz;
    for (let i = 0; i < 12; i++) {
      const a = rand(0, 6.28),
        rr = r * Math.sqrt(Math.random());
      const x = cx + Math.cos(a) * rr,
        z = cz + Math.sin(a) * rr;
      if (this.free(x, z)) {
        this.x = x;
        this.z = z;
        break;
      }
    }
    this.tx = this.x;
    this.tz = this.z;
    this.ph = rand(0, 6);
    this.wt = 0;
    this.pauseT = rand(0, 2);
    g.position.set(this.x, 0, this.z);
    g.rotation.y = rand(0, 6.28);
    scene.add(g);
    this.pick();
  }
  free(x, z) {
    if (!this.world) return true;
    for (const c of this.world.colC)
      if (Math.hypot(x - c.x, z - c.z) < c.r + 0.5) return false;
    for (const r of this.world.colR)
      if (
        Math.abs(x - r.x) < r.hw + 0.5 &&
        Math.abs(z - r.z) < r.hd + 0.5
      )
        return false;
    return true;
  }
  pick() {
    for (let i = 0; i < 10; i++) {
      const a = rand(0, 6.28),
        rr = this.r * Math.sqrt(Math.random());
      const x = this.cx + Math.cos(a) * rr,
        z = this.cz + Math.sin(a) * rr;
      if (this.free(x, z)) {
        this.tx = x;
        this.tz = z;
        return;
      }
    }
    this.tx = this.cx;
    this.tz = this.cz;
  }
  update(dt, t) {
    let moving = false;
    if (this.idle) {
      this.g.rotation.y += Math.sin(t * 0.5 + this.ph) * 0.0015;
    } else {
      const dx = this.tx - this.x,
        dz = this.tz - this.z,
        d = Math.hypot(dx, dz);
      if (d < 0.4) {
        if (this.pauseT <= 0) {
          this.pick();
          this.pauseT = rand(1, 4);
        } else this.pauseT -= dt;
      } else {
        moving = true;
        const vx = (dx / d) * this.speed,
          vz = (dz / d) * this.speed;
        this.x += vx * dt;
        this.z += vz * dt;
        const ty = Math.atan2(vx, vz);
        let dy = ty - this.g.rotation.y;
        dy =
          ((((dy + Math.PI) % (Math.PI * 2)) + Math.PI * 2) %
            (Math.PI * 2)) -
          Math.PI;
        this.g.rotation.y += dy * Math.min(1, dt * 6);
      }
    }
    this.wt += moving ? dt * this.speed * 3.4 : 0;
    const sw = moving ? Math.sin(this.wt) * 0.55 : 0;
    this.legL.rotation.x = sw;
    this.legR.rotation.x = -sw;
    this.armL.rotation.x = -sw * 0.65;
    this.armR.rotation.x = sw * 0.65;
    this.g.position.set(
      this.x,
      moving ? Math.abs(Math.sin(this.wt)) * 0.035 : 0,
      this.z,
    );
  }
}
export class Pigeon {
  constructor(scene, cx, cz, r) {
    this.cx = cx;
    this.cz = cz;
    this.r = r;
    const g = (this.g = new THREE.Group());
    const body = sph(0.11, M.std(0x8a8f98, { r: 0.9 }), 8);
    body.scale.set(1, 0.9, 1.3);
    const head = sph(0.06, M.std(0x5a5f68), 6);
    head.position.set(0, 0.09, 0.12);
    const beak = cyl(0.008, 0.02, 0.05, M.bas(0xffa64d), 5);
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.08, 0.17);
    const tail = box(0.08, 0.02, 0.1, M.std(0x6a6f78));
    tail.position.set(0, 0.02, -0.13);
    g.add(body, head, beak, tail);
    const a = rand(0, 6.28);
    this.x = cx + Math.cos(a) * r * Math.random();
    this.z = cz + Math.sin(a) * r * Math.random();
    this.tx = this.x;
    this.tz = this.z;
    this.hop = rand(0, 2);
    scene.add(g);
  }
  update(dt) {
    const pd = Math.hypot(player.pos.x - this.x, player.pos.z - this.z);
    if (pd < 2.2) {
      const ax = this.x - player.pos.x,
        az = this.z - player.pos.z,
        l = Math.hypot(ax, az) || 1;
      this.tx = clamp(
        this.x + (ax / l) * 3,
        this.cx - this.r,
        this.cx + this.r,
      );
      this.tz = clamp(
        this.z + (az / l) * 3,
        this.cz - this.r,
        this.cz + this.r,
      );
      this.hop = 0;
    }
    const dx = this.tx - this.x,
      dz = this.tz - this.z,
      d = Math.hypot(dx, dz);
    let moving = false;
    if (d < 0.2) {
      if (Math.random() < dt * 0.4) {
        const a = rand(0, 6.28),
          rr = rand(0, this.r);
        this.tx = this.cx + Math.cos(a) * rr;
        this.tz = this.cz + Math.sin(a) * rr;
      }
    } else {
      moving = true;
      this.x += (dx / d) * 1.1 * dt;
      this.z += (dz / d) * 1.1 * dt;
      this.g.rotation.y = Math.atan2(dx, dz);
    }
    if (moving) this.hop += dt * 9;
    this.g.position.set(
      this.x,
      moving ? Math.abs(Math.sin(this.hop)) * 0.09 : 0,
      this.z,
    );
    this.g.rotation.x = moving ? -0.15 : 0;
  }
}

/* ================= PEMAIN ================= */
