/* ============================================================
 * js/main/worlds/park.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { M, cyl, skyDome, sph } from "../engine.js";
import { World } from "../world_base.js";
import { WORLDS } from "../worlds_meta.js";



/* ================= 9 DUNIA IMPLEMENTASI ================= */

// 1. TAMAN SEROJA
export class ParkWorld extends World {
  constructor() {
    super("park");
    this.spawn = { x: 0, z: 28, yaw: 0 };
    const S = this.scene;
    S.background = new THREE.Color(0xa5e0f7);
    S.fog = new THREE.Fog(0xc2ebf9, 70, 220);
    S.add(skyDome(["#4fa8e8", "#86ccf4", "#c9ecf8", "#e8f7fd"]));
    S.add(new THREE.HemisphereLight(0xe8f5e9, 0x4a6b4a, 0.9));
    const dl = new THREE.DirectionalLight(0xfff6dd, 1.2);
    dl.position.set(40, 70, 30);
    S.add(dl);

    // Ground grass
    const grass = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      M.std(0x62b872, { r: 0.95 }),
    );
    grass.rotation.x = -Math.PI / 2;
    S.add(grass);

    // Lake
    const lake = new THREE.Mesh(
      new THREE.CircleGeometry(24, 36),
      M.std(0x38a8e8, { r: 0.1, m: 0.4 }),
    );
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(-15, 0.04, -8);
    S.add(lake);

    // Fountain
    const fBasin = cyl(6, 6.4, 0.6, M.std(0xe0d6ca), 24);
    fBasin.position.set(0, 0.3, 0);
    S.add(fBasin);
    const fJet = cyl(0.4, 0.6, 2.2, M.std(0xe0d6ca), 12);
    fJet.position.set(0, 1.2, 0);
    S.add(fJet);

    // Trees
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      const r = 26 + Math.random() * 40;
      const tx = Math.cos(a) * r,
        tz = Math.sin(a) * r;
      const trunk = cyl(0.2, 0.3, 2.2, M.std(0x6e4a28), 6);
      trunk.position.set(tx, 1.1, tz);
      const crown = sph(1.6, M.std(0x429955, { r: 0.9 }), 8);
      crown.position.set(tx, 2.8, tz);
      S.add(trunk, crown);
    }

    // Vehicle: Prisma Buggy
    this.addVehicle("buggy", 8, 18, 0, "Prisma Buggy", 0x7ce3a0);

    // NPCs
    this.npcSystem.addNPC({
      id: "citra",
      name: "Citra",
      role: "civilian",
      title: "Sang Botanis · Taman Seroja",
      speech:
        "Halo pengelana! Bunga-bunga seroja ini bersinar indah di pagi hari. Tapi waspadalah, kabarnya ada anomali Titan yang mengintai!",
      x: 3,
      z: 12,
      cloth: 0x7ce3a0,
    });
    this.npcSystem.addNPC({
      id: "rian",
      name: "Rian",
      role: "guard",
      title: "Pengawal Keamanan Seroja",
      speech:
        "Aku bersiaga di sini untuk melindungi warga dari serangan monster. Jika portal terbuka, tembakkan senjatamu!",
      x: -4,
      z: 16,
      cloth: 0x2e3b4e,
    });

    const AC = WORLDS.park.hex;
    this.landmark({
      id: "fountain",
      x: 0,
      z: 0,
      r: 5,
      color: AC,
      icon: "water",
      title: "Air Mancur Pusat",
      fact: "Pusat pertemuan warga Taman Seroja yang selalu jernih dan tenang.",
    });
    this.landmark({
      id: "lake",
      x: -15,
      z: -8,
      r: 8,
      color: AC,
      icon: "waves",
      title: "Danau Teratai Biru",
      fact: "Danau alami di mana pantulan awan tampak seperti cermin cair.",
    });
    this.landmark({
      id: "pavilion",
      x: 18,
      z: -12,
      r: 5,
      color: AC,
      icon: "roofing",
      title: "Gazebo Bunga",
      fact: "Tempat berteduh favorit para pelancong saat matahari terik.",
    });
    this.landmark({
      id: "bridge",
      x: -15,
      z: 14,
      r: 4,
      color: AC,
      icon: "panorama_horizontal",
      title: "Jembatan Kayu",
      fact: "Menghubungkan tepian danau dengan bukit pinus kecil.",
    });
    this.landmark({
      id: "statue",
      x: 22,
      z: 16,
      r: 4,
      color: AC,
      icon: "person",
      title: "Monumen Harmoni",
      fact: "Didirikan sebagai lambang persahabatan antar dunia Prisma.",
    });
  }
  clampBounds(p) {
    const r = Math.hypot(p.x, p.z);
    if (r > 75) {
      p.x *= 75 / r;
      p.z *= 75 / r;
    }
  }
}
