/* ============================================================
 * js/main/worlds/funfair.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { FunfairParkManager } from "../../funfair_rides.js";
import { M, camera, skyDome } from "../engine.js";
import { exitRide, updateRideHUD } from "../game.js";
import { input } from "../input.js";
import { sfx, snackbar } from "../sound.js";
import { clamp, damp } from "../util.js";
import { World } from "../world_base.js";
import { WORLDS } from "../worlds_meta.js";



// 4. PRISMA LAND (Amusement Park: Biang Lala, Komedi Putar, Coaster, Drop Tower, Viking Ship, Cangkir Putar, Rhythm Game & Shooting Gallery)
export class FunWorld extends World {
  constructor() {
    super("funfair");
    this.spawn = { x: 0, z: 42, yaw: 0 };
    const S = this.scene;
    S.background = new THREE.Color(0x2d153e);
    S.fog = new THREE.Fog(0x4a1e52, 80, 260);
    S.add(skyDome(["#1e102f", "#5e2365", "#ff4d82", "#ffc163"]));
    S.add(new THREE.HemisphereLight(0xffe6f2, 0x2a1b3d, 1.0));
    const dl = new THREE.DirectionalLight(0xffecd0, 1.35);
    dl.position.set(-50, 75, 30);
    S.add(dl);

    // Park Ground with festival paths
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(500, 500),
      M.std(0x3e8a52, { r: 0.9 }),
    );
    ground.rotation.x = -Math.PI / 2;
    S.add(ground);

    // Paved Central Plaza
    const plaza = new THREE.Mesh(
      new THREE.CircleGeometry(32, 32),
      M.std(0x5a6372, { r: 0.8 }),
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.02;
    S.add(plaza);

    // Instantiate complete park attractions & atmosphere manager!
    this.parkManager = new FunfairParkManager(this, S);

    // Rides available to board and ride!
    this.rides = [
      {
        type: "coaster",
        x: this.stX,
        z: this.stZ,
        r: 6.5,
        label: "Prisma Cyclone (Coaster)",
        icon: "rocket_launch",
        exit: { x: this.stX - 2, z: this.stZ, yaw: Math.PI / 2 },
      },
      {
        type: "carousel",
        x: 0,
        z: -6,
        r: 7.5,
        label: "Komedi Putar Prisma",
        icon: "toys",
        exit: { x: 7.5, z: -6, yaw: Math.PI / 2 },
      },
      {
        type: "wheel",
        x: this.parkManager.wheelX,
        z: this.parkManager.wheelZ,
        r: 8.5,
        label: "Bianglala Senja (Ferris Wheel)",
        icon: "donut_large",
        exit: {
          x: this.parkManager.wheelX,
          z: this.parkManager.wheelZ + 10,
          yaw: 0,
        },
      },
      {
        type: "droptower",
        x: this.parkManager.dropX,
        z: this.parkManager.dropZ,
        r: 6.5,
        label: "Menara Terjun Bebas (Drop Tower)",
        icon: "arrow_downward",
        exit: {
          x: this.parkManager.dropX + 5,
          z: this.parkManager.dropZ,
          yaw: Math.PI / 2,
        },
      },
      {
        type: "vikingship",
        x: this.parkManager.shipX,
        z: this.parkManager.shipZ,
        r: 7.5,
        label: "Kapal Bajak Laut (Viking Ship)",
        icon: "sailing",
        exit: {
          x: this.parkManager.shipX + 6,
          z: this.parkManager.shipZ,
          yaw: Math.PI / 2,
        },
      },
      {
        type: "teacups",
        x: this.parkManager.cupX,
        z: this.parkManager.cupZ,
        r: 8.5,
        label: "Cangkir Berputar (Spinning Teacups)",
        icon: "coffee",
        exit: {
          x: this.parkManager.cupX + 8,
          z: this.parkManager.cupZ,
          yaw: Math.PI / 2,
        },
      },
    ];

    // Interactive minigames booths!
    this.minigames = [
      {
        id: "rhythm",
        x: this.parkManager.rhythmX,
        z: this.parkManager.rhythmZ,
        r: 6.0,
        label: "Main Prisma Beat (Rhythm Game)",
        icon: "music_note",
      },
      {
        id: "shooting",
        x: this.parkManager.shootX,
        z: this.parkManager.shootZ,
        r: 6.0,
        label: "Main Tembak Sasaran Karnaval",
        icon: "crisis_alert",
      },
    ];

    // Vehicle: Cyclone Racer Kart
    this.addVehicle("kart", 12, 34, 0, "Cyclone Kart", 0xff3b94);

    // NPCs
    this.npcSystem.addNPC({
      id: "luna",
      name: "Luna",
      role: "civilian",
      title: "Pemandu Wahana Prisma",
      speech:
        "Selamat datang di Prisma Land! Coba semua wahana: Bianglala, Komedi Putar, Coaster, Drop Tower, Kapal Ayun, dan Arkade Musik Prisma Beat!",
      x: 4,
      z: 24,
      cloth: 0xff3b94,
    });
    this.npcSystem.addNPC({
      id: "guard_fun",
      name: "Satpam Bobi",
      role: "guard",
      title: "Keamanan Taman Bermain",
      speech:
        "Aku selalu waspada menjaga keamanan festival! Nikmati wahana dan arkade sepuasnya!",
      x: -4,
      z: 28,
      cloth: 0x3d2b4a,
    });
    this.npcSystem.addNPC({
      id: "dj_max",
      name: "DJ Max",
      role: "civilian",
      title: "DJ Panggung Prisma Beat",
      speech:
        "Siap menari dan ikuti ketukan? Buka arkade musik Prisma Beat di panggung neon ini!",
      x: this.parkManager.rhythmX + 2.5,
      z: this.parkManager.rhythmZ + 1.2,
      cloth: 0x00d2ff,
    });

    const AC = WORLDS.funfair.hex;
    this.landmark({
      id: "coaster",
      x: this.stX,
      z: this.stZ,
      r: 6.5,
      color: AC,
      icon: "rocket_launch",
      title: "Stasiun Prisma Cyclone",
      fact: "Roller coaster 5 menit legendaris dengan kecepatan 160 km/j dan 6 putaran!",
    });
    this.landmark({
      id: "carousel",
      x: 0,
      z: -6,
      r: 7,
      color: AC,
      icon: "toys",
      title: "Komedi Putar Prisma",
      fact: "Wahana klasik dengan kuda-kuda kayu berukir halus & lampu gemerlap.",
    });
    this.landmark({
      id: "wheel",
      x: this.parkManager.wheelX,
      z: this.parkManager.wheelZ,
      r: 8,
      color: AC,
      icon: "donut_large",
      title: "Bianglala Senja",
      fact: "Melihat panorama seluruh taman bermain dari ketinggian 28 meter!",
    });
    this.landmark({
      id: "droptower",
      x: this.parkManager.dropX,
      z: this.parkManager.dropZ,
      r: 6.5,
      color: AC,
      icon: "arrow_downward",
      title: "Menara Terjun Bebas",
      fact: "Sensasi terjun bebas dari puncak menara baja 38 meter!",
    });
    this.landmark({
      id: "vikingship",
      x: this.parkManager.shipX,
      z: this.parkManager.shipZ,
      r: 7,
      color: AC,
      icon: "sailing",
      title: "Kapal Bajak Laut Samudra",
      fact: "Sensasi terombang-ambing di udara dengan ayunan pendulum raksasa 75 derajat.",
    });
    this.landmark({
      id: "teacups",
      x: this.parkManager.cupX,
      z: this.parkManager.cupZ,
      r: 7.5,
      color: AC,
      icon: "coffee",
      title: "Wahana Cangkir Berputar",
      fact: "Berputar ria di dalam cangkir raksasa mengelilingi teko emas.",
    });
    this.landmark({
      id: "rhythm",
      x: this.parkManager.rhythmX,
      z: this.parkManager.rhythmZ,
      r: 6,
      color: AC,
      icon: "music_note",
      title: "Panggung Prisma Beat",
      fact: "Arkade musik ritme interaktif dengan lagu-lagu synthesizer berenergi tinggi.",
    });
    this.landmark({
      id: "shooting",
      x: this.parkManager.shootX,
      z: this.parkManager.shootZ,
      r: 6,
      color: AC,
      icon: "crisis_alert",
      title: "Stan Tembak Sasaran",
      fact: "Uji ketangkasan menembak bebek renang dan bintang emas dalam 30 detik!",
    });
  }

  update(dt, t) {
    super.update(dt, t);
    if (this.parkManager) {
      this.parkManager.update(dt, t);
    }
  }

  // FIXED RIDE CAMERA FOR ALL RIDES
  updateRide(dt, t) {
    const r = this.riding;
    if (!r) return;
    r.elapsed += dt;
    r.yawOff -= input.lookX;
    r.pitchOff = clamp(r.pitchOff - input.lookY, -1.3, 1.3);
    input.lookX = input.lookY = 0;

    if (r.type === "coaster") {
      const c = this.coaster;
      r.v = damp(r.v, 14 + r.lap * 6.5, 1.8, dt);
      r.s += r.v * dt;
      const u = ((r.s % c.L) / c.L + 1) % 1;
      const newLap = Math.floor(r.s / c.L);
      if (newLap !== r.lap) {
        r.lap = newLap;
        if (newLap >= 6) {
          snackbar(
            "Prisma Cyclone selesai! Terima kasih sudah menaiki wahana.",
          );
          exitRide();
          return;
        }
        snackbar(`Prisma Cyclone: LAP ${r.lap + 1}/6!`);
      }
      const p1 = c.curve.getPointAt(u);
      const p2 = c.curve.getPointAt((u + 0.008) % 1);
      const tangent = p2.clone().sub(p1).normalize();

      camera.position.copy(p1).add(new THREE.Vector3(0, 1.2, 0));
      camera.lookAt(p1.clone().add(tangent.clone().multiplyScalar(10)));
      camera.rotateY(r.yawOff);
      camera.rotateX(r.pitchOff);
      sfx.setWind(r.v);
    } else if (r.type === "carousel") {
      const a = this.parkManager ? this.parkManager.carAng : 0;
      camera.position.set(
        Math.cos(a) * 4.2,
        1.8 + Math.sin(t * 3.2) * 0.35,
        -6 + Math.sin(a) * 4.2,
      );
      camera.rotation.set(r.pitchOff, -a + Math.PI / 2 + r.yawOff, 0);
    } else if (r.type === "wheel") {
      const a = this.parkManager ? this.parkManager.wheelAng : 0;
      const px =
        this.parkManager.wheelX + Math.cos(a) * this.parkManager.wheelR;
      const py =
        this.parkManager.wheelY + Math.sin(a) * this.parkManager.wheelR;
      camera.position.set(px, py + 1.1, this.parkManager.wheelZ);
      camera.rotation.set(r.pitchOff, Math.PI / 2 + r.yawOff, 0);
    } else if (r.type === "droptower") {
      const dy = this.parkManager ? this.parkManager.dropY : 2;
      camera.position.set(
        this.parkManager.dropX,
        dy + 1.3,
        this.parkManager.dropZ + 2.4,
      );
      camera.rotation.set(r.pitchOff, r.yawOff, 0);
      if (this.parkManager && this.parkManager.dropState === "drop") {
        sfx.setWind(28);
      } else {
        sfx.setWind(0);
      }
    } else if (r.type === "vikingship") {
      const sa = this.parkManager ? this.parkManager.shipAng : 0;
      const pz =
        this.parkManager.shipZ + Math.sin(sa) * this.parkManager.shipArmLen;
      const py = 18.2 - Math.cos(sa) * this.parkManager.shipArmLen;
      camera.position.set(this.parkManager.shipX, py + 1.2, pz);
      camera.rotation.set(sa + r.pitchOff, Math.PI / 2 + r.yawOff, 0);
    } else if (r.type === "teacups") {
      const ta = this.parkManager ? this.parkManager.teacupsAng : 0;
      const px = this.parkManager.cupX + Math.cos(ta) * 4.8;
      const pz = this.parkManager.cupZ + Math.sin(ta) * 4.8;
      camera.position.set(px, 1.5, pz);
      camera.rotation.set(r.pitchOff, ta * 3.2 + r.yawOff, 0);
    }

    updateRideHUD(r);
  }
  clampBounds(p) {
    const r = Math.hypot(p.x, p.z);
    if (r > 150) {
      p.x *= 150 / r;
      p.z *= 150 / r;
    }
  }
}
