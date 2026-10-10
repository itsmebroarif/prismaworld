/* ============================================================
 * js/main/worlds/city.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { M, box, skyDome } from "../engine.js";
import { World } from "../world_base.js";
import { WORLDS } from "../worlds_meta.js";



// 3. KOTA SENJA
export class CityWorld extends World {
  constructor() {
    super("city");
    this.spawn = { x: 0, z: 26, yaw: 0 };
    const S = this.scene;
    S.background = new THREE.Color(0x351a28);
    S.fog = new THREE.Fog(0x4a2236, 50, 180);
    S.add(skyDome(["#1e0d1d", "#5c223c", "#c45a4a", "#ffb36b"]));
    S.add(new THREE.HemisphereLight(0xffb36b, 0x1c121e, 0.9));
    const sun = new THREE.DirectionalLight(0xffa868, 1.4);
    sun.position.set(-50, 40, -40);
    S.add(sun);

    // Asphalt ground
    const street = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      M.std(0x221a24, { r: 0.7 }),
    );
    street.rotation.x = -Math.PI / 2;
    S.add(street);

    // Skyscrapers
    for (let x = -40; x <= 40; x += 20) {
      for (let z = -40; z <= 0; z += 20) {
        if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;
        const h = 18 + Math.random() * 26;
        const bldg = box(14, h, 14, M.std(0x2d2232, { r: 0.5, m: 0.5 }));
        bldg.position.set(x, h / 2, z);
        S.add(bldg);
      }
    }

    // Vehicle: Cyber Roadster
    this.addVehicle("roadster", 8, 14, 0, "Cyber Roadster", 0xffb36b);

    // NPCs
    this.npcSystem.addNPC({
      id: "barista",
      name: "Barista Senja",
      role: "civilian",
      title: "Pemilik Kafe Neon",
      speech:
        "Kopi hangat siap disajikan! Hati-hati, jika suara langkah kaki Titan berdentum, larilah ke kafe ini!",
      x: 2,
      z: 12,
      cloth: 0xffb36b,
    });
    this.npcSystem.addNPC({
      id: "cop",
      name: "Polisi Kota Senja",
      role: "guard",
      title: "Satuan Keamanan Distrik",
      speech:
        "Area ini dalam pengawasan. Jika Titan mencoba menginjak gedung, bantu kami dengan senapan serbumu!",
      x: -6,
      z: 14,
      cloth: 0x4d3855,
    });

    const AC = WORLDS.city.hex;
    this.landmark({
      id: "plaza",
      x: 0,
      z: 0,
      r: 6,
      color: AC,
      icon: "storefront",
      title: "Plaza Neon Senja",
      fact: "Pusat kehidupan kota di mana aroma kopi dan gemerlap billboard bertemu.",
    });
    this.landmark({
      id: "monorail",
      x: 0,
      z: -25,
      r: 6,
      color: AC,
      icon: "tram",
      title: "Stasiun Monorel Layang",
      fact: "Jalur kereta cepat yang membelah gedung pencakar langit.",
    });
    this.landmark({
      id: "screen",
      x: 26,
      z: -10,
      r: 5,
      color: AC,
      icon: "tv",
      title: "Layar Hologram Raksasa",
      fact: "Menampilkan berita cuaca senja dan peringatan darurat monster.",
    });
    this.landmark({
      id: "alley",
      x: -25,
      z: 12,
      r: 5,
      color: AC,
      icon: "nightlife",
      title: "Gang Lampion Neon",
      fact: "Lorong penuh warung lampion yang menyala syahdu saat petang tiba.",
    });
    this.landmark({
      id: "bridge_city",
      x: 18,
      z: 20,
      r: 4,
      color: AC,
      icon: "bridge",
      title: "Jembatan Senja Barat",
      fact: "Pemandangan matahari terbenam paling indah di seluruh kota.",
    });
  }
  clampBounds(p) {
    const r = Math.hypot(p.x, p.z);
    if (r > 72) {
      p.x *= 72 / r;
      p.z *= 72 / r;
    }
  }
}
