/* ============================================================
 * js/main/worlds/snow.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { M, box, skyDome } from "../engine.js";
import { World } from "../world_base.js";
import { WORLDS } from "../worlds_meta.js";



// 7. PUNCAK ESNA
export class SnowWorld extends World {
  constructor() {
    super("snow");
    this.spawn = { x: 0, z: 26, yaw: 0 };
    const S = this.scene;
    S.background = new THREE.Color(0xb8e6f8);
    S.fog = new THREE.Fog(0xd4f0fc, 50, 190);
    S.add(skyDome(["#3f729b", "#78b5db", "#c0e7f7", "#f4fbfe"]));
    S.add(new THREE.HemisphereLight(0xffffff, 0x6e8a9c, 1.0));
    const sun = new THREE.DirectionalLight(0xfff8ee, 1.3);
    sun.position.set(-30, 60, 40);
    S.add(sun);

    // Snow Ground & Ice Lake
    const snow = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      M.std(0xf0f6fa, { r: 0.95 }),
    );
    snow.rotation.x = -Math.PI / 2;
    S.add(snow);
    const ice = new THREE.Mesh(
      new THREE.CircleGeometry(18, 32),
      M.std(0xa4d8ee, { r: 0.08, m: 0.3 }),
    );
    ice.rotation.x = -Math.PI / 2;
    ice.position.set(-16, 0.05, -10);
    S.add(ice);

    // Cabin
    const cabin = box(6, 4, 5, M.std(0x6e482d));
    cabin.position.set(16, 2, -12);
    S.add(cabin);

    // Vehicle: Frost Snowmobile
    this.addVehicle("snowmobile", 6, 14, 0, "Frost Snowmobile", 0xa5e8ff);

    // NPCs
    this.npcSystem.addNPC({
      id: "freya",
      name: "Freya",
      role: "civilian",
      title: "Pemandu Gletser Esna",
      speech:
        "Keluarga salju di sini menyambut siapa pun yang kedinginan. Ada teh panas di kabin!",
      x: 2,
      z: 12,
      cloth: 0xa5e8ff,
    });
    this.npcSystem.addNPC({
      id: "guard_snow",
      name: "Penjaga Suar Salju",
      role: "guard",
      title: "Penjaga Puncak Gunung",
      speech:
        "Suhu ekstrem tak memadamkan kewaspadaan kami. Monster beku sedang mendekat dari lembah!",
      x: -4,
      z: 16,
      cloth: 0x2d485e,
    });

    const AC = WORLDS.snow.hex;
    this.landmark({
      id: "cabin",
      x: 16,
      z: -12,
      r: 5,
      color: AC,
      icon: "cottage",
      title: "Kabin Kayu Hangat",
      fact: "Tempat berteduh dari badai es dengan perapian kayu yang selalu menyala.",
    });
    this.landmark({
      id: "ice_lake",
      x: -16,
      z: -10,
      r: 7,
      color: AC,
      icon: "ice_skating",
      title: "Danau Es Kristal",
      fact: "Esnya jernih sedalam dua meter dengan pantulan puncak gunung.",
    });
    this.landmark({
      id: "snowmen",
      x: 2,
      z: 18,
      r: 4,
      color: AC,
      icon: "emoji_people",
      title: "Keluarga Boneka Salju",
      fact: "Tiga boneka salju yang setia menjaga jalan setapak menuju puncak.",
    });
    this.landmark({
      id: "peak",
      x: 0,
      z: -30,
      r: 6,
      color: AC,
      icon: "flag",
      title: "Puncak Esna",
      fact: "Titik tertinggi dengan bendera yang berkibar megah di atas awan.",
    });
    this.landmark({
      id: "pine",
      x: -24,
      z: 14,
      r: 4,
      color: AC,
      icon: "park",
      title: "Pinus Tertua",
      fact: "Pohon pinus seratus tahun yang tetap hijau di tengah salju abadi.",
    });
  }
  clampBounds(p) {
    const r = Math.hypot(p.x, p.z);
    if (r > 68) {
      p.x *= 68 / r;
      p.z *= 68 / r;
    }
  }
}
