/* ============================================================
 * js/main/player.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { camera } from "./engine.js";
import { input } from "./input.js";
import { sfx } from "./sound.js";
import { world } from "./state.js";
import { clamp, damp } from "./util.js";



/* ================= PLAYER ================= */
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
    camera.fov = world ? world.fovBase : 68;
    camera.updateProjectionMatrix();
  }
  update(dt, world) {
    this.yaw -= input.lookX;
    this.pitch = clamp(this.pitch - input.lookY, -1.52, 1.52);
    input.lookX = input.lookY = 0;

    const mx = clamp(input.kb.x + input.stick.x, -1, 1),
      my = clamp(input.kb.y + input.stick.y, -1, 1);
    const stickMag = Math.hypot(input.stick.x, input.stick.y);
    const run = input.run || stickMag > 0.92;
    const sp = run ? 7.8 : 4.6,
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
        this.landDip = 0.2;
        sfx.land();
      }
      this.pos.y = 0;
      this.vel.y = 0;
      this.grounded = true;
    }

    world.clampBounds(this.pos);

    const sp2 = Math.hypot(this.vel.x, this.vel.z);
    if (this.grounded && sp2 > 0.4) {
      this.bobT += dt * sp2 * 1.2;
      if (this.bobT - this.lastStep > 2.6) {
        this.lastStep = this.bobT;
        sfx.step();
      }
    }
    const bobY = Math.sin(this.bobT) * 0.05 * Math.min(sp2 / 4.6, 1.5);
    this.landDip = damp(this.landDip, 0, 8, dt);
    this.roll = damp(this.roll, -mx * 0.035, 8, dt);

    camera.position.set(
      this.pos.x,
      this.eye + this.pos.y + bobY - this.landDip,
      this.pos.z,
    );
    camera.rotation.set(this.pitch, this.yaw, this.roll);
  }
}
export const player = new Player();
