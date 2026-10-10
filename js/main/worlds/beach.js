/* ============================================================
 * js/main/worlds/beach.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { M, cyl, skyDome } from "../engine.js";
import { World } from "../world_base.js";
import { WORLDS } from "../worlds_meta.js";



// 5. PANTAI KARANG
export class BeachWorld extends World {
  constructor() {
    super("beach");
    this.spawn = { x: 0, z: 28, yaw: 0 };
    const S = this.scene;
    S.background = new THREE.Color(0x8fd2f3);
    S.fog = new THREE.Fog(0xbfe3f5, 70, 200);
    S.add(skyDome(["#2f7fd8", "#7ec3f0", "#cfeefb", "#ffe9d0"]));
    S.add(new THREE.HemisphereLight(0xbfe8ff, 0xd9c290, 0.95));
    const sun = new THREE.DirectionalLight(0xfff1d6, 1.3);
    sun.position.set(50, 70, 30);
    S.add(sun);

    // Ocean & Sand
    const sea = new THREE.Mesh(
      new THREE.CircleGeometry(320, 36),
      M.std(0x2f9fd8, { r: 0.1, m: 0.3 }),
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -0.1;
    S.add(sea);
    const sand = new THREE.Mesh(
      new THREE.CircleGeometry(65, 36),
      M.std(0xe6d29e, { r: 0.95 }),
    );
    sand.rotation.x = -Math.PI / 2;
    S.add(sand);

    // Lighthouse
    const lh = cyl(2, 3.2, 18, M.std(0xf0ede8), 16);
    lh.position.set(35, 9, -20);
    const lhTop = cyl(2.2, 2.2, 2, M.std(0xff3550), 16);
    lhTop.position.set(35, 19, -20);
    S.add(lh, lhTop);

    // Vehicle: Dune Buggy
    this.addVehicle("dune_buggy", 8, 16, 0, "Dune Buggy Pantai", 0x5ec8f2);

    // NPCs
    this.npcSystem.addNPC({
      id: "bram",
      name: "Kapten Bram",
      role: "civilian",
      title: "Pelaut Pantai Karang",
      speech:
        "Ombak hari ini membawa cerita kuno tentang monster yang tertidur di dasar palung laut!",
      x: 3,
      z: 14,
      cloth: 0x5ec8f2,
    });
    this.npcSystem.addNPC({
      id: "guard_beach",
      name: "Pengawas Pantai",
      role: "guard",
      title: "Penjaga Menara Mercusuar",
      speech:
        "Menara suar siap memandu kapal dan menembaki monster jika mereka mendekati garis pantai!",
      x: -5,
      z: 18,
      cloth: 0x243e4f,
    });

    const AC = WORLDS.beach.hex;
    this.landmark({
      id: "lighthouse",
      x: 35,
      z: -20,
      r: 6,
      color: AC,
      icon: "light",
      title: "Mercusuar Karang",
      fact: "Telah memandu kapal selama dua ratus tahun melewati karang tajam.",
    });
    this.landmark({
      id: "pier",
      x: 0,
      z: -18,
      r: 5,
      color: AC,
      icon: "anchor",
      title: "Dermaga Kayu Camar",
      fact: "Tempat bertenggernya ratusan burung camar setiap sore hari.",
    });
    this.landmark({
      id: "reef",
      x: -30,
      z: 0,
      r: 6,
      color: AC,
      icon: "water",
      title: "Taman Karang Biru",
      fact: "Terumbu karang dangkal penuh ikan bercahaya warna-warni.",
    });
    this.landmark({
      id: "palms",
      x: 18,
      z: 12,
      r: 4,
      color: AC,
      icon: "nature",
      title: "Hutan Kelapa",
      fact: "Pohon-pohon kelapa menjulang tinggi tertiup angin sepoi-sepoi.",
    });
    this.landmark({
      id: "shell",
      x: -14,
      z: 20,
      r: 4,
      color: AC,
      icon: "scatter_plot",
      title: "Gua Kerang Kristal",
      fact: "Gua kecil di mana kerang-kerang mengeluarkan desau ombak abadi.",
    });
  }
  clampBounds(p) {
    const r = Math.hypot(p.x, p.z);
    if (r > 62) {
      p.x *= 62 / r;
      p.z *= 62 / r;
    }
  }
}
