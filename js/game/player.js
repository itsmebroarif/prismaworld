/* ============================================================
 * js/game/player.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { sfx } from "../core/audio.js";
import { camera } from "../core/engine.js";
import { input } from "../core/input.js";
import { world } from "../core/state.js";
import { clamp, damp } from "../core/util.js";
import { resolveColliders } from "./world.js";

export class Player {
  constructor() {
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.grounded = true;
    this.eye = 1.62;
    this.bobT = 0;
    this.lastStep = 0;
    this.landDip = 0;
    this.roll = 0;
    this.fov = 68;
  }
  reset(x, z, yaw) {
    this.pos.set(x, 0, z);
    this.vel.set(0, 0, 0);
    this.yaw = yaw;
    this.pitch = 0;
    this.grounded = true;
    this.bobT = 0;
    this.landDip = 0;
    this.roll = 0;
    this.fov = world ? world.fovBase : 68;
    camera.fov = this.fov;
    camera.updateProjectionMatrix();
  }
  update(dt, world) {
    /* 360°: yaw bebas tanpa batas, pitch ±89° */
    this.yaw -= input.lookX;
    this.pitch = clamp(this.pitch - input.lookY, -1.55, 1.55);
    input.lookX = input.lookY = 0;
    const mx = clamp(input.kb.x + input.stick.x, -1, 1),
      my = clamp(input.kb.y + input.stick.y, -1, 1);
    const stickMag = Math.hypot(input.stick.x, input.stick.y);
    const run = input.run || stickMag > 0.92;
    const sp = run ? 7.6 : 4.5,
      sy = Math.sin(this.yaw),
      cy = Math.cos(this.yaw);
    this.vel.x = damp(this.vel.x, (-sy * my + cy * mx) * sp, 12, dt);
    this.vel.z = damp(this.vel.z, (-cy * my - sy * mx) * sp, 12, dt);
    if (input.jumpQ) {
      if (this.grounded) {
        this.vel.y = world.jumpV;
        this.grounded = false;
        sfx.jump();
      }
      input.jumpQ = false;
    }
    this.vel.y -= world.gravity * dt;
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    this.pos.y += this.vel.y * dt;
    if (this.pos.y <= 0) {
      if (!this.grounded) {
        this.landDip = 0.22;
        sfx.land();
      }
      this.pos.y = 0;
      this.vel.y = 0;
      this.grounded = true;
    }
    resolveColliders(this.pos, world);
    world.clampBounds(this.pos);
    const sp2 = Math.hypot(this.vel.x, this.vel.z);
    if (this.grounded && sp2 > 0.4) {
      this.bobT += dt * sp2 * 1.15;
      if (this.bobT - this.lastStep > 2.6) {
        this.lastStep = this.bobT;
        sfx.step();
      }
    }
    const bobY = Math.sin(this.bobT) * 0.05 * Math.min(sp2 / 4.5, 1.5);
    this.landDip = damp(this.landDip, 0, 8, dt);
    this.roll = damp(this.roll, -mx * 0.035, 8, dt);
    camera.position.set(
      this.pos.x,
      this.eye + this.pos.y + bobY - this.landDip,
      this.pos.z,
    );
    camera.rotation.set(this.pitch, this.yaw, this.roll);
    const tf = this.fov + (run && sp2 > 5 ? 6 : 0);
    if (Math.abs(camera.fov - tf) > 0.05) {
      camera.fov = damp(camera.fov, tf, 4, dt);
      camera.updateProjectionMatrix();
    }
  }
}

/* ================= BASIS DUNIA ================= */
export const player = new Player();
