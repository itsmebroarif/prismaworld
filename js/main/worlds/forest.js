/* ============================================================
 * js/main/worlds/forest.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { M, cyl, skyDome, sph } from "../engine.js";
import { World } from "../world_base.js";
import { WORLDS } from "../worlds_meta.js";



// 8. HUTAN LUNARIA
export class ForestWorld extends World {
  constructor() {
    super("forest");
    this.spawn = { x: 0, z: 28, yaw: 0 };
    const S = this.scene;
    S.background = new THREE.Color(0x061122);
    S.fog = new THREE.Fog(0x0a1b33, 30, 110);
    S.add(skyDome(["#020612", "#061328", "#0b2646", "#124174"]));
    S.add(new THREE.HemisphereLight(0x38bdf8, 0x06121f, 0.75));
    const moon = new THREE.DirectionalLight(0x7dd3fc, 0.85);
    moon.position.set(30, 50, 20);
    S.add(moon);

    // Forest Ground
    const forestGround = new THREE.Mesh(
      new THREE.PlaneGeometry(380, 380),
      M.std(0x102524, { r: 0.95 }),
    );
    forestGround.rotation.x = -Math.PI / 2;
    S.add(forestGround);

    // Ancient Rune Tree
    const treeTrunk = cyl(2.2, 3, 13, M.std(0x182c40), 12);
    treeTrunk.position.set(-16, 6.5, -12);
    const rune = new THREE.Mesh(
      new THREE.TorusGeometry(4.2, 0.09, 8, 36),
      M.bas(0x38bdf8, { transparent: true, opacity: 0.85 }),
    );
    rune.rotation.x = Math.PI / 2;
    rune.position.set(-16, 0.15, -12);
    S.add(treeTrunk, rune);

    // Giant glowing mushrooms & crystals
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const r = 16 + Math.random() * 32;
      const mx = Math.cos(a) * r,
        mz = Math.sin(a) * r;
      const st = cyl(0.15, 0.25, 0.8, M.lam(0xc7e1f4), 6);
      st.position.set(mx, 0.4, mz);
      const cap = sph(0.6, M.bas([0x38bdf8, 0x2dd4bf, 0x60a5fa][i % 3]), 8);
      cap.scale.y = 0.5;
      cap.position.set(mx, 0.9, mz);
      S.add(st, cap);
    }

    // Vehicle: Lunaria Glider
    this.addVehicle("glider", 6, 16, 0, "Lunaria Glider", 0x38bdf8);

    // NPCs
    this.npcSystem.addNPC({
      id: "lumina",
      name: "Lumina",
      role: "civilian",
      title: "Peri Cahaya Lunaria",
      speech:
        "Rune kristal safir di pohon purba bergetar pelan. Cahaya kunang-kunang akan membimbingmu melewati kegelapan!",
      x: 3,
      z: 12,
      cloth: 0x38bdf8,
    });
    this.npcSystem.addNPC({
      id: "guard_forest",
      name: "Penjaga Hutan Purba",
      role: "guard",
      title: "Pemanah Cahaya Bulan",
      speech:
        "Hutan ini sakral. Kami tidak akan membiarkan monster Titan mencemari kolam cahaya!",
      x: -5,
      z: 16,
      cloth: 0x0f2438,
    });

    const AC = WORLDS.forest.hex;
    this.landmark({
      id: "ancient_tree",
      x: -16,
      z: -12,
      r: 6,
      color: AC,
      icon: "forest",
      title: "Pohon Purba Lunaria",
      fact: "Pohon tertua dengan ukiran rune magis yang menyala saat bulan purnama.",
    });
    this.landmark({
      id: "stones",
      x: 14,
      z: 16,
      r: 6,
      color: AC,
      icon: "diamond",
      title: "Lingkar Batu Kristal",
      fact: "Delapan batu pelindung yang beresonansi dengan detak jantung hutan.",
    });
    this.landmark({
      id: "shrooms",
      x: -8,
      z: 22,
      r: 5,
      color: AC,
      icon: "spa",
      title: "Jamur Raksasa",
      fact: "Spora jamur ini menerangi hutan malam dengan warna-warni memikat.",
    });
    this.landmark({
      id: "pond",
      x: 6,
      z: -24,
      r: 6,
      color: AC,
      icon: "water",
      title: "Kolam Cahaya Bulan",
      fact: "Airnya memantulkan cahaya bintang bahkan saat langit tertutup kabut.",
    });
    this.landmark({
      id: "wisps",
      x: 22,
      z: -2,
      r: 4,
      color: AC,
      icon: "auto_awesome",
      title: "Lembah Roh Cahaya",
      fact: "Kumpulan roh cahaya kecil yang senang menari di antara dedaunan.",
    });
  }
  clampBounds(p) {
    const r = Math.hypot(p.x, p.z);
    if (r > 66) {
      p.x *= 66 / r;
      p.z *= 66 / r;
    }
  }
}
