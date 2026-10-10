/* ============================================================
 * js/main/worlds/desert.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { M, skyDome } from "../engine.js";
import { World } from "../world_base.js";
import { WORLDS } from "../worlds_meta.js";



// 6. GURUN KALARIS
export class DesertWorld extends World {
  constructor() {
    super("desert");
    this.spawn = { x: 0, z: 28, yaw: 0 };
    const S = this.scene;
    S.background = new THREE.Color(0xb56338);
    S.fog = new THREE.Fog(0xd27d4c, 60, 210);
    S.add(skyDome(["#381c10", "#7a381e", "#d26a38", "#ffc285"]));
    S.add(new THREE.HemisphereLight(0xffcaa0, 0x3d2212, 0.9));
    const sun = new THREE.DirectionalLight(0xffeedd, 1.4);
    sun.position.set(-60, 50, 30);
    S.add(sun);

    // Sand Plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(450, 450),
      M.std(0xdca068, { r: 0.95 }),
    );
    ground.rotation.x = -Math.PI / 2;
    S.add(ground);

    // Ancient Pyramid
    const pyr = new THREE.Mesh(
      new THREE.ConeGeometry(24, 28, 4),
      M.std(0xc4854c, { r: 0.9 }),
    );
    pyr.position.set(0, 14, -36);
    pyr.rotation.y = Math.PI / 4;
    S.add(pyr);

    // Vehicle: Kalaris Rover
    this.addVehicle("sand_crawler", 8, 16, 0, "Kalaris Rover", 0xff9d5c);

    // NPCs
    this.npcSystem.addNPC({
      id: "malik",
      name: "Malik",
      role: "civilian",
      title: "Pengembara Karavan Kuno",
      speech:
        "Pasir ini menyimpan rahasia ribuan tahun. Jangan remehkan gemuruh di kejauhan — itu langkah kaki Titan!",
      x: 3,
      z: 14,
      cloth: 0xff9d5c,
    });
    this.npcSystem.addNPC({
      id: "guard_desert",
      name: "Penjaga Oasis",
      role: "guard",
      title: "Pemanah Senjata Plasma",
      speech:
        "Kami menjaga persediaan air oasis dari monster gurun. Tembak mereka tepat di mata!",
      x: -5,
      z: 18,
      cloth: 0x4a2a16,
    });

    const AC = WORLDS.desert.hex;
    this.landmark({
      id: "pyramid",
      x: 0,
      z: -36,
      r: 8,
      color: AC,
      icon: "change_history",
      title: "Piramida Kalaris",
      fact: "Piramida purba yang menurut legenda dibangun oleh para Titan zaman dahulu.",
    });
    this.landmark({
      id: "oasis",
      x: -22,
      z: 4,
      r: 6,
      color: AC,
      icon: "water_drop",
      title: "Oasis Tersembunyi",
      fact: "Satu-satunya mata air jernih yang tak pernah kering di tengah gurun.",
    });
    this.landmark({
      id: "camp",
      x: 20,
      z: 8,
      r: 5,
      color: AC,
      icon: "fireplace",
      title: "Kamp Pengembara",
      fact: "Tempat para pengelana berkumpul di sekitar api unggun saat malam dingin.",
    });
    this.landmark({
      id: "statue_desert",
      x: -16,
      z: -20,
      r: 4,
      color: AC,
      icon: "monument",
      title: "Patung Sphinx Terkubur",
      fact: "Tenggelam setengah badan di dalam badai pasir berabad-abad.",
    });
    this.landmark({
      id: "canyon",
      x: 24,
      z: -24,
      r: 5,
      color: AC,
      icon: "landscape",
      title: "Jurang Kalaris",
      fact: "Celah ngarai bebatuan merah tempat angin berdesau kencang.",
    });
  }
  clampBounds(p) {
    const r = Math.hypot(p.x, p.z);
    if (r > 74) {
      p.x *= 74 / r;
      p.z *= 74 / r;
    }
  }
}
