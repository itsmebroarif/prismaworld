/* ============================================================
 * js/main/world_base.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { Vehicle } from "../vehicle.js";
import { NPCSystem } from "../npc.js";
import { makeBeacon } from "./engine.js";
import { input } from "./input.js";
import { sfx } from "./sound.js";
import { monsterSystem, weaponManager } from "./state.js";
import { WORLDS, disc } from "./worlds_meta.js";



/* ================= BASE WORLD CLASS ================= */
export class World {
  constructor(key) {
    this.scene = new THREE.Scene();
    this.key = key;
    this.landmarks = [];
    this.animFns = [];
    this.bursts = [];
    this.rides = [];
    this.riding = null;
    this.vehicles = [];
    this.drivingVehicle = null;
    this.npcSystem = new NPCSystem(this.scene, this, sfx);
    this.spawn = { x: 0, z: 20, yaw: 0 };
    this.fovBase = 68;
    this.gravity = 22;
    this.jumpV = 7.4;
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
      b.userData.ring.material.opacity = 0.35 + 0.2 * Math.sin(t * 3 + ph);
    });
  }
  addVehicle(type, x, z, yaw, name, color) {
    const v = new Vehicle(this.scene, this, type, x, z, yaw, name, color);
    this.vehicles.push(v);
    return v;
  }
  update(dt, t) {
    for (const f of this.animFns) f(dt, t);
    for (let i = this.bursts.length - 1; i >= 0; i--)
      if (this.bursts[i].update(dt)) this.bursts.splice(i, 1);
    this.npcSystem.update(dt, monsterSystem, weaponManager);
    for (const v of this.vehicles) v.update(dt, input, sfx);
  }
  updateRide(dt, t) {}
  clampBounds(p) {}
  dispose() {
    this.vehicles.forEach((v) => v.dispose());
    this.vehicles = [];
    this.npcSystem.clear();
  }
}
