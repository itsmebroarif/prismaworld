/* ============================================================
 * js/main/worlds/orbit.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { M, box, skyDome } from "../engine.js";
import { World } from "../world_base.js";
import { WORLDS } from "../worlds_meta.js";



// 9. STASIUN HELIOS (Orbit & Low Gravity)
export class OrbitWorld extends World {
  constructor() {
    super("orbit");
    this.spawn = { x: 0, z: 26, yaw: 0 };
    this.gravity = 11; // Low gravity!
    this.jumpV = 8.8; // High floating jumps!
    const S = this.scene;
    S.background = new THREE.Color(0x04060d);
    S.fog = new THREE.Fog(0x060914, 50, 220);
    S.add(skyDome(["#02040a", "#060a18", "#0c1630", "#1c3468"]));
    S.add(new THREE.HemisphereLight(0x9ad1ff, 0x060a14, 0.85));
    const dl = new THREE.DirectionalLight(0xe8f4ff, 1.4);
    dl.position.set(40, 60, -30);
    S.add(dl);

    // Planet Earth backdrop in space!
    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(45, 32, 24),
      M.std(0x286ec4, { r: 0.4 }),
    );
    earth.position.set(-110, 40, -130);
    S.add(earth);

    // Station Deck
    const deck = new THREE.Mesh(
      new THREE.CircleGeometry(65, 32),
      M.std(0x182434, { r: 0.3, m: 0.8 }),
    );
    deck.rotation.x = -Math.PI / 2;
    S.add(deck);

    // Solar panels
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const sp = box(14, 0.2, 5, M.std(0x102844, { r: 0.2, m: 0.9 }));
      sp.position.set(Math.cos(a) * 44, 4, Math.sin(a) * 44);
      sp.rotation.y = a;
      S.add(sp);
    }

    // Vehicle: Helios Moon Rover
    this.addVehicle("rover", 8, 14, 0, "Helios Moon Rover", 0x9ad1ff);

    // NPCs
    this.npcSystem.addNPC({
      id: "orion",
      name: "Komandan Orion",
      role: "civilian",
      title: "Komandan Stasiun Helios",
      speech:
        "Selamat datang di orbit bumi! Gravitasi di sini rendah, membuat lompatanmu melayang jauh ke angkasa.",
      x: 3,
      z: 12,
      cloth: 0x9ad1ff,
    });
    this.npcSystem.addNPC({
      id: "guard_space",
      name: "Android Sentry-9",
      role: "guard",
      title: "Robot Pengawal Orbital",
      speech:
        "Mendeteksi fluktuasi gravitasi abnormal. Titan luar angkasa sedang memasuki atmosfer stasiun!",
      x: -5,
      z: 16,
      cloth: 0x1a2e48,
    });

    const AC = WORLDS.orbit.hex;
    this.landmark({
      id: "earth_view",
      x: 0,
      z: -28,
      r: 6,
      color: AC,
      icon: "public",
      title: "Balkon Pandang Bumi",
      fact: "Pemandangan spektakuler bumi biru yang berputar megah di bawah stasiun.",
    });
    this.landmark({
      id: "antenna",
      x: 26,
      z: 0,
      r: 5,
      color: AC,
      icon: "satellite",
      title: "Antena Komunikasi Utama",
      fact: "Menghubungkan sinyal komunikasi antar 9 dunia Prisma.",
    });
    this.landmark({
      id: "solar",
      x: -28,
      z: 0,
      r: 6,
      color: AC,
      icon: "solar_power",
      title: "Panel Surya Orbital",
      fact: "Menyerap energi murni matahari untuk menyalakan stasiun.",
    });
    this.landmark({
      id: "dock",
      x: 0,
      z: 32,
      r: 5,
      color: AC,
      icon: "flight_takeoff",
      title: "Dermaga Pesawat Ruang Angkasa",
      fact: "Pintu gerbang kedatangan para astronot dari permukaan planet.",
    });
    this.landmark({
      id: "grav_core",
      x: 0,
      z: 0,
      r: 5,
      color: AC,
      icon: "hub",
      title: "Generator Gravitasi Buatan",
      fact: "Inti pemutar gravitasi stasiun yang menjaga kita tetap menjejak lantai.",
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
