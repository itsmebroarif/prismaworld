/* ============================================================
 * js/main/worlds/server.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { M, box, skyDome } from "../engine.js";
import { World } from "../world_base.js";
import { WORLDS } from "../worlds_meta.js";



// 2. AREA SERVER
export class ServerWorld extends World {
  constructor() {
    super("server");
    this.spawn = { x: 0, z: 24, yaw: 0 };
    const S = this.scene;
    S.background = new THREE.Color(0x0e1822);
    S.fog = new THREE.Fog(0x122230, 40, 160);
    S.add(skyDome(["#0a1420", "#102838", "#1c4558", "#4de3d4"]));
    S.add(new THREE.HemisphereLight(0x4de3d4, 0x081018, 0.8));
    const dl = new THREE.DirectionalLight(0x7df6ea, 1.1);
    dl.position.set(20, 50, 20);
    S.add(dl);

    // Floor grids
    const fl = new THREE.Mesh(
      new THREE.PlaneGeometry(350, 350),
      M.std(0x141e28, { r: 0.4, m: 0.7 }),
    );
    fl.rotation.x = -Math.PI / 2;
    S.add(fl);

    // Server Racks
    for (let x = -30; x <= 30; x += 12) {
      for (let z = -30; z <= 10; z += 15) {
        if (Math.abs(x) < 8 && Math.abs(z) < 8) continue;
        const rack = box(2.4, 6.2, 4.2, M.std(0x182432, { r: 0.3, m: 0.8 }));
        rack.position.set(x, 3.1, z);
        const neon = box(2.45, 0.12, 4.25, M.bas(0x4de3d4));
        neon.position.set(x, 4.2, z);
        S.add(rack, neon);
      }
    }

    // Vehicle: Quantum Hovercar
    this.addVehicle("hovercar", 6, 16, 0, "Quantum Hover", 0x4de3d4);

    // NPCs
    this.npcSystem.addNPC({
      id: "ray",
      name: "Mekanik Ray",
      role: "civilian",
      title: "Admin Sistem Inti",
      speech:
        "Suhu prosesor meningkat! Anomali kode sedang menarik perhatian monster titan ke mainframe.",
      x: 3,
      z: 8,
      cloth: 0x4de3d4,
    });
    this.npcSystem.addNPC({
      id: "sentry",
      name: "Unit Patroli S-01",
      role: "guard",
      title: "Robot Keamanan Server",
      speech:
        "Protokol pertahanan aktif. Mengisi daya blaster plasma untuk mengamankan data warga.",
      x: -4,
      z: 12,
      cloth: 0x1f4455,
    });

    const AC = WORLDS.server.hex;
    this.landmark({
      id: "core",
      x: 0,
      z: 0,
      r: 6,
      color: AC,
      icon: "memory",
      title: "Inti Komputasi Quantum",
      fact: "Tempat miliaran data dunia Prisma diproses dalam bentuk kristal cahaya.",
    });
    this.landmark({
      id: "fan",
      x: 24,
      z: -20,
      r: 6,
      color: AC,
      icon: "mode_fan",
      title: "Kipas Pendingin Raksasa",
      fact: "Menjaga temperatur server tetap beku meski Titan mengamuk.",
    });
    this.landmark({
      id: "relay",
      x: -24,
      z: -18,
      r: 5,
      color: AC,
      icon: "cell_tower",
      title: "Relai Frekuensi Tinggi",
      fact: "Memancarkan sinyal ke stasiun antariksa Helios di orbit.",
    });
    this.landmark({
      id: "terminal",
      x: 18,
      z: 18,
      r: 4,
      color: AC,
      icon: "terminal",
      title: "Terminal Operator",
      fact: "Pusat diagnosis anomali sistem sebelum portal monster terbuka.",
    });
    this.landmark({
      id: "substation",
      x: -18,
      z: 20,
      r: 4,
      color: AC,
      icon: "electric_bolt",
      title: "Gardu Daya Neon",
      fact: "Mengalirkan daya plasma ke seluruh sirkuit kota.",
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
