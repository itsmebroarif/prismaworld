/* ============================================================
 * js/worlds/orbit.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { M, box, cyl, mkSign, softTex, sph } from "../core/engine.js";
import { strip } from "../core/hud.js";
import { canvas } from "../core/ui.js";
import { rand } from "../core/util.js";
import { WORLDS } from "../core/worlds_meta.js";
import { World } from "../game/world.js";

export class OrbitWorld extends World {
  constructor() {
    super("orbit");
    this.spawn = { x: 0, z: 22, yaw: 0 };
    this.fovBase = 72;
    this.gravity = 7.5;
    this.jumpV = 6.2;
    const S = this.scene;
    S.background = new THREE.Color(0x04060c);
    S.add(new THREE.HemisphereLight(0x4a5a7a, 0x0a0e18, 0.5));
    const dl = new THREE.DirectionalLight(0x9ad1ff, 0.35);
    dl.position.set(30, 20, 10);
    S.add(dl);
    const SN = 520,
      stp = new Float32Array(SN * 3);
    for (let i = 0; i < SN; i++) {
      const a = rand(0, 6.28),
        ph2 = rand(0.02, 0.5),
        r = rand(150, 190);
      stp[i * 3] = Math.cos(a) * r * Math.cos(ph2);
      stp[i * 3 + 1] = Math.sin(ph2) * r;
      stp[i * 3 + 2] = Math.sin(a) * r * Math.cos(ph2);
    }
    const stg = new THREE.BufferGeometry();
    stg.setAttribute("position", new THREE.BufferAttribute(stp, 3));
    S.add(
      new THREE.Points(
        stg,
        new THREE.PointsMaterial({
          color: 0xcfe4ff,
          size: 0.7,
          map: softTex,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
          fog: false,
        }),
      ),
    );
    const planet = new THREE.Group();
    planet.position.set(150, 10, 0);
    S.add(planet);
    const pBody = sph(30, M.std(0x3f7fd0, { r: 0.75 }), 24);
    planet.add(pBody);
    for (let i = 0; i < 6; i++) {
      const cont = sph(rand(4, 8), M.std(0x4fae6a, { r: 0.85 }), 10);
      const a = rand(0, 6.28),
        b = rand(-0.9, 0.9);
      cont.position
        .set(
          Math.cos(a) * 29 * Math.cos(b),
          29 * Math.sin(b),
          Math.sin(a) * 29 * Math.cos(b),
        )
        .multiplyScalar(0.94);
      cont.scale.y = 0.4;
      planet.add(cont);
    }
    const atmo = sph(
      31.5,
      M.bas(0x7ab8ff, {
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }),
      24,
    );
    planet.add(atmo);
    const moonPiv = new THREE.Group();
    planet.add(moonPiv);
    const moon = sph(5.5, M.std(0xb8bcc8, { r: 0.95 }), 14);
    moon.position.set(48, 4, 0);
    moonPiv.add(moon);
    this.animFns.push((dt, t) => {
      planet.rotation.y += dt * 0.02;
      moonPiv.rotation.y += dt * 0.05;
    });
    const gc = document.createElement("canvas");
    gc.width = gc.height = 256;
    const gx = gc.getContext("2d");
    gx.fillStyle = "#10161f";
    gx.fillRect(0, 0, 256, 256);
    gx.strokeStyle = "#1e3a54";
    gx.lineWidth = 2;
    for (let i = 0; i <= 256; i += 32) {
      gx.beginPath();
      gx.moveTo(i, 0);
      gx.lineTo(i, 256);
      gx.stroke();
      gx.beginPath();
      gx.moveTo(0, i);
      gx.lineTo(256, i);
      gx.stroke();
    }
    gx.fillStyle = "#2a5a8a";
    for (let i = 0; i < 8; i++)
      gx.fillRect(rand(0, 240), rand(0, 240), rand(6, 20), 3);
    const gtex = new THREE.CanvasTexture(gc);
    gtex.wrapS = gtex.wrapT = THREE.RepeatWrapping;
    gtex.repeat.set(8, 8);
    gtex.colorSpace = THREE.SRGBColorSpace;
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(30, 48),
      new THREE.MeshStandardMaterial({
        map: gtex,
        roughness: 0.6,
        metalness: 0.3,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    S.add(floor);
    for (const r of [10, 20]) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(r - 0.08, r, 64),
        M.bas(0x4a8ac2, { transparent: true, opacity: 0.5 }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.02;
      S.add(ring);
    }
    /* dinding dengan 2 jendela: +x (planet) dan -z (dok) */
    const W1 = Math.PI / 2,
      W1W = 0.55,
      W2 = Math.PI,
      W2W = 0.35;
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x141a24,
      roughness: 0.7,
      metalness: 0.3,
      side: THREE.BackSide,
    });
    [
      [W1 + W1W, W2 - W2W],
      [W2 + W2W, W1 - W1W + Math.PI * 2],
    ].forEach(([s, e]) => {
      const m = new THREE.Mesh(
        new THREE.CylinderGeometry(30, 30, 7, 40, 1, true, s, e - s),
        wallMat,
      );
      m.position.y = 3.5;
      S.add(m);
    });
    const glassMat = M.bas(0x9ad1ff, {
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const win1 = new THREE.Mesh(
      new THREE.CylinderGeometry(
        29.8,
        29.8,
        4.6,
        40,
        1,
        true,
        W1 - W1W,
        W1W * 2,
      ),
      glassMat,
    );
    win1.position.y = 3.6;
    S.add(win1);
    const win2 = new THREE.Mesh(
      new THREE.CylinderGeometry(
        29.8,
        29.8,
        4.6,
        40,
        1,
        true,
        W2 - W2W,
        W2W * 2,
      ),
      glassMat.clone(),
    );
    win2.position.y = 3.6;
    S.add(win2);
    const frameMat = M.std(0x2a3444, { r: 0.4, m: 0.6 });
    for (const [cA, half] of [
      [W1, W1W],
      [W2, W2W],
    ]) {
      for (const off of [-half, half]) {
        const th = cA + off;
        const post = box(0.5, 4.8, 0.5, frameMat);
        post.position.set(Math.sin(th) * 29.6, 3.55, Math.cos(th) * 29.6);
        S.add(post);
      }
      for (const y of [1.25, 5.95]) {
        const f = new THREE.Mesh(
          new THREE.CylinderGeometry(
            29.85,
            29.85,
            0.35,
            40,
            1,
            true,
            cA - half,
            half * 2,
          ),
          frameMat,
        );
        f.position.y = y;
        S.add(f);
      }
    }
    const ceil = new THREE.Mesh(
      new THREE.CircleGeometry(30, 48),
      M.std(0x0c121c, { r: 0.8 }),
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = 7;
    S.add(ceil);
    for (let i = 0; i < 3; i++) {
      const strip = new THREE.Mesh(
        new THREE.TorusGeometry(8 + i * 8, 0.07, 6, 48),
        M.bas(0x9ad1ff, { transparent: true, opacity: 0.7 }),
      );
      strip.rotation.x = Math.PI / 2;
      strip.position.y = 6.9;
      S.add(strip);
    }
    /* holomeja */
    const holo = new THREE.Group();
    S.add(holo);
    const hBase = cyl(
      0.9,
      1.2,
      0.9,
      M.std(0x1a2432, { r: 0.5, m: 0.4 }),
      16,
    );
    hBase.position.y = 0.45;
    holo.add(hBase);
    const hWire = new THREE.Mesh(
      new THREE.SphereGeometry(1.3, 14, 10),
      new THREE.MeshBasicMaterial({
        color: 0x4ddac2,
        wireframe: true,
        toneMapped: false,
        transparent: true,
        opacity: 0.7,
      }),
    );
    hWire.position.y = 2.4;
    holo.add(hWire);
    const hCore = sph(
      0.5,
      M.bas(0x9adfff, { transparent: true, opacity: 0.5 }),
      12,
    );
    hCore.position.y = 2.4;
    holo.add(hCore);
    const hLight = new THREE.PointLight(0x4ddac2, 12, 12, 1.8);
    hLight.position.set(0, 2.4, 0);
    S.add(hLight);
    this.animFns.push((dt, t) => {
      hWire.rotation.y += dt * 0.6;
      hCore.scale.setScalar(1 + Math.sin(t * 2) * 0.12);
    });
    this.cCol(0, 0, 1.5);
    /* kapsul cryo */
    for (const [cx, cz] of [
      [-16, 10],
      [-19, 6],
      [-20, 1],
      [-19, -4],
      [-16, -8],
    ]) {
      const g = new THREE.Group();
      g.position.set(cx, 0, cz);
      g.rotation.y = Math.atan2(-cx, -cz);
      S.add(g);
      const pod = cyl(
        0.75,
        0.75,
        2.4,
        M.bas(0x9ad1ff, {
          transparent: true,
          opacity: 0.16,
          depthWrite: false,
        }),
        12,
      );
      pod.position.y = 1.6;
      const cap = sph(
        0.75,
        M.bas(0x9ad1ff, {
          transparent: true,
          opacity: 0.16,
          depthWrite: false,
        }),
        12,
      );
      cap.position.y = 2.8;
      cap.scale.y = 0.6;
      const inner = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.4, 1.2, 4, 10),
        M.bas(0x4ddac2, { transparent: true, opacity: 0.3 }),
      );
      inner.position.y = 1.7;
      const pb = box(1.7, 0.5, 1.7, M.std(0x1a2432, { r: 0.5, m: 0.4 }));
      pb.position.y = 0.25;
      const led2 = box(1.5, 0.08, 0.08, M.bas(0x4ddac2));
      led2.position.set(0, 0.6, 0.85);
      g.add(pod, cap, inner, pb, led2);
      this.cCol(cx, cz, 0.95);
    }
    /* antena */
    const ant = new THREE.Group();
    ant.position.set(20, 0, 15);
    S.add(ant);
    const mast = cyl(
      0.06,
      0.1,
      5.4,
      M.std(0x2a3444, { r: 0.5, m: 0.5 }),
      8,
    );
    mast.position.y = 2.7;
    ant.add(mast);
    for (const [ay, ar] of [
      [3.4, 0.9],
      [4.6, 0.6],
    ]) {
      const dish = new THREE.Mesh(
        new THREE.ConeGeometry(ar, 0.4, 12, 1, true),
        M.std(0x8a97ad, { r: 0.4, m: 0.6, side: THREE.DoubleSide }),
      );
      dish.position.set(0, ay, 0.2);
      dish.rotation.x = 0.9;
      ant.add(dish);
    }
    const blink = sph(0.12, M.bas(0xff4d5e), 8);
    blink.position.set(0, 5.6, 0);
    ant.add(blink);
    this.animFns.push((dt, t) => {
      blink.visible = Math.sin(t * 4) > 0;
      ant.rotation.y = Math.sin(t * 0.2) * 0.4;
    });
    this.cCol(20, 15, 0.5);
    /* konsol dok + kapal di luar jendela -z */
    const dc = new THREE.Group();
    dc.position.set(0, 0, -25);
    S.add(dc);
    const dcBase = box(2.4, 0.9, 1, M.std(0x1a2432, { r: 0.5, m: 0.4 }));
    dcBase.position.y = 0.45;
    dc.add(dcBase);
    const dcScr = box(2, 0.8, 0.08, M.bas(0x4ddac2));
    dcScr.position.set(0, 1.3, -0.3);
    dcScr.rotation.x = -0.3;
    dc.add(dcScr);
    const dcSign = mkSign("DOCK 7", "#4ddac2", 2.2, 0.8);
    dcSign.position.set(0, 2.2, 0);
    dc.add(dcSign);
    this.rCol(0, -25, 1.3, 0.6);
    const ship = new THREE.Group();
    ship.position.set(0, 2.5, -44);
    S.add(ship);
    const sBody = box(1.6, 1, 3.2, M.std(0xdfe6f0, { r: 0.4, m: 0.5 }));
    ship.add(sBody);
    const sCab = sph(0.6, M.std(0x4ddac2, { r: 0.2 }), 10);
    sCab.position.set(0, 0.6, -0.6);
    ship.add(sCab);
    const sEng = cyl(0.3, 0.4, 0.7, M.bas(0x9adfff), 10);
    sEng.rotation.x = Math.PI / 2;
    sEng.position.set(0, 0, 2);
    ship.add(sEng);
    this.animFns.push((dt, t) => {
      ship.position.y = 2.5 + Math.sin(t * 0.8) * 0.25;
      ship.rotation.y = Math.sin(t * 0.3) * 0.2;
    });
    /* properti melayang */
    const props = [];
    for (let i = 0; i < 6; i++) {
      const m =
        i % 2
          ? box(0.4, 0.26, 0.3, M.std(0x8a97ad, { r: 0.5, m: 0.4 }))
          : sph(0.2, M.std(0x4ddac2, { r: 0.3 }), 10);
      m.position.set(rand(-20, 20), rand(1.6, 4), rand(-16, 16));
      if (Math.hypot(m.position.x, m.position.z) < 3) m.position.x += 6;
      S.add(m);
      props.push({
        m,
        y0: m.position.y,
        ph: rand(0, 6),
        rs: rand(0.2, 0.6),
      });
    }
    const DN = 120,
      dp = new Float32Array(DN * 3);
    for (let i = 0; i < DN; i++) {
      dp[i * 3] = rand(-28, 28);
      dp[i * 3 + 1] = rand(0.3, 6.5);
      dp[i * 3 + 2] = rand(-28, 28);
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute("position", new THREE.BufferAttribute(dp, 3));
    S.add(
      new THREE.Points(
        dg,
        new THREE.PointsMaterial({
          color: 0x9ad1ff,
          size: 0.08,
          map: softTex,
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
        }),
      ),
    );
    this.animFns.push((dt, t) => {
      props.forEach((p2) => {
        p2.m.position.y = p2.y0 + Math.sin(t * 0.7 + p2.ph) * 0.4;
        p2.m.rotation.y += dt * p2.rs;
        p2.m.rotation.x += dt * p2.rs * 0.6;
      });
    });
    const AC = WORLDS.orbit.hex;
    this.landmark({
      id: "window",
      x: 24,
      z: 0,
      r: 5,
      color: AC,
      icon: "public",
      title: "Jendela Bumi",
      fact: "Planet biru itu berputar sangat pelan dari sini. Awak penjaga mengatakan kamu tidak akan pernah bosan menatapnya.",
    });
    this.landmark({
      id: "holo",
      x: 0,
      z: 0,
      r: 4.4,
      color: AC,
      icon: "travel_explore",
      title: "Holomeja Navigasi",
      fact: "Bola kawat hijau ini adalah peta seluruh jaringan Prisma — termasuk sembilan dunia yang baru saja kamu jelajahi.",
    });
    this.landmark({
      id: "cryo",
      x: -17.5,
      z: 4,
      r: 6,
      color: AC,
      icon: "bedtime",
      title: "Kapsul Cryo",
      fact: "Lima kapsul tidur panjang. Isinya? Kru pertama Helios — mereka memilih bermimpi selagi stasiun mengorbit.",
    });
    this.landmark({
      id: "dock",
      x: 0,
      z: -22,
      r: 5,
      color: AC,
      icon: "rocket_launch",
      title: "Teluk Dok 7",
      fact: 'Kapal kecil di luar kaca itu siap terbang kapan saja. Tujuannya tertulis di layar navigasinya: "ke mana pun".',
    });
    this.landmark({
      id: "antenna",
      x: 20,
      z: 15,
      r: 4.2,
      color: AC,
      icon: "settings_input_antenna",
      title: "Antena Helios",
      fact: 'Satu-satunya alat komunikasi dengan bumi. Setiap malam ia mengirim satu pesan pendek: "semua baik-baik saja".',
    });
    this.spawnNPC(2, 0, 3, 2, { idle: true });
  }
  clampBounds(p) {
    const r = Math.hypot(p.x, p.z);
    if (r > 27.5) {
      p.x *= 27.5 / r;
      p.z *= 27.5 / r;
    }
  }
}

/* ================= MOTION BLUR (afterimage ping-pong) ================= */
