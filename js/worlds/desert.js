/* ============================================================
 * js/worlds/desert.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { M, cyl, mkSprite, skyDome, softTex, sph } from "../core/engine.js";
import { rand } from "../core/util.js";
import { WORLDS } from "../core/worlds_meta.js";
import { World } from "../game/world.js";

export class DesertWorld extends World {
  constructor() {
    super("desert");
    this.spawn = { x: 0, z: 34, yaw: 0 };
    this.fovBase = 70;
    const S = this.scene;
    S.background = new THREE.Color(0xc25e7a);
    S.fog = new THREE.Fog(0xe8b088, 70, 220);
    S.add(skyDome(["#3a2a6a", "#c25e7a", "#ff9459", "#ffd98a"]));
    S.add(new THREE.HemisphereLight(0xffc9a0, 0x6a4a3a, 0.7));
    const sun = new THREE.DirectionalLight(0xffc07a, 1.2);
    sun.position.set(-50, 45, 40);
    S.add(sun);
    mkSprite(S, 0xffdf9a, 44, [-90, 26, -70]);
    const base = new THREE.Mesh(
      new THREE.PlaneGeometry(500, 500),
      M.std(0xd9a86b, { r: 1 }),
    );
    base.rotation.x = -Math.PI / 2;
    S.add(base);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + rand(-0.2, 0.2),
        r = rand(40, 64);
      const d = sph(rand(12, 22), M.std(0xd49c63, { r: 1 }), 14);
      d.scale.y = rand(0.12, 0.2);
      d.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      S.add(d);
    }
    const pyr = new THREE.Mesh(
      new THREE.ConeGeometry(15, 20, 4),
      M.std(0xc99a5e, { r: 0.95 }),
    );
    pyr.position.set(28, 10, -26);
    pyr.rotation.y = Math.PI / 4;
    S.add(pyr);
    const pyr2 = new THREE.Mesh(
      new THREE.ConeGeometry(8, 10, 4),
      M.std(0xc99a5e, { r: 0.95 }),
    );
    pyr2.position.set(12, 5, -40);
    pyr2.rotation.y = Math.PI / 4;
    S.add(pyr2);
    this.rCol(28, -26, 10.5, 10.5);
    this.rCol(12, -40, 5.6, 5.6);
    const ruin = (x, z, h) => {
      const c = cyl(0.55, 0.68, h, M.std(0xd9c8a8, { r: 0.95 }), 10);
      c.position.set(x, h / 2, z);
      S.add(c);
      this.cCol(x, z, 0.8);
    };
    ruin(-30, 10, 4.2);
    ruin(-33, 13, 2.6);
    ruin(-27, 14, 3.4);
    ruin(-31, 17, 1.6);
    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(2, 0.45, 8, 20, Math.PI),
      M.std(0xd9c8a8, { r: 0.95 }),
    );
    arch.position.set(-25, 2.4, 10);
    S.add(arch);
    this.cCol(-25, 10, 2.3);
    const oWater = new THREE.Mesh(
      new THREE.CircleGeometry(5.5, 28),
      M.std(0x3fbfae, { r: 0.15 }),
    );
    oWater.rotation.x = -Math.PI / 2;
    oWater.position.set(8, 0.06, 26);
    S.add(oWater);
    this.cCol(8, 26, 5.8);
    const oRim = new THREE.Mesh(
      new THREE.RingGeometry(5.5, 6.6, 28),
      M.std(0xc9a878, { r: 1 }),
    );
    oRim.rotation.x = -Math.PI / 2;
    oRim.position.set(8, 0.03, 26);
    S.add(oRim);
    for (const [ox, oz] of [
      [4, 22],
      [12, 23],
      [11, 30],
    ]) {
      const tr = cyl(0.12, 0.16, 3.4, M.std(0x8a6a4a, { r: 0.95 }), 7);
      tr.position.set(ox, 1.7, oz);
      const fr = new THREE.Mesh(
        new THREE.ConeGeometry(1.6, 1, 7),
        M.std(0x4a9a55, { r: 0.95 }),
      );
      fr.position.set(ox, 3.6, oz);
      S.add(tr, fr);
      this.cCol(ox, oz, 0.5);
    }
    const cactus = (x, z, s) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      const body = cyl(
        0.32 * s,
        0.38 * s,
        2.2 * s,
        M.std(0x3f8f5a, { r: 0.9 }),
        10,
      );
      body.position.y = 1.1 * s;
      g.add(body);
      for (const sd of [-1, 1])
        if (Math.random() < 0.8) {
          const armH = cyl(
            0.16 * s,
            0.18 * s,
            0.7 * s,
            M.std(0x3f8f5a, { r: 0.9 }),
            8,
          );
          armH.position.set(sd * 0.55 * s, 1.3 * s, 0);
          const armV = cyl(
            0.16 * s,
            0.18 * s,
            0.8 * s,
            M.std(0x3f8f5a, { r: 0.9 }),
            8,
          );
          armV.position.set(sd * 0.55 * s, 1.7 * s, 0);
          armH.rotation.z = Math.PI / 2;
          g.add(armH, armV);
        }
      S.add(g);
      this.cCol(x, z, 0.42 * s + 0.1);
    };
    const excl = [
      [28, -26, 18],
      [12, -40, 11],
      [-30, 13, 10],
      [8, 26, 9],
      [0, 8, 5],
      [-18, -28, 6],
      [0, 34, 5],
    ];
    const free = (x, z) =>
      !excl.some((e) => Math.hypot(x - e[0], z - e[1]) < e[2]);
    let cn = 0,
      guard = 0;
    while (cn < 12 && guard++ < 400) {
      const a = rand(0, 6.28),
        r = rand(14, 58),
        x = Math.cos(a) * r,
        z = Math.sin(a) * r;
      if (!free(x, z)) continue;
      cactus(x, z, rand(0.8, 1.5));
      cn++;
    }
    const giant = new THREE.Group();
    giant.position.set(-18, 0, -28);
    const gb = cyl(0.7, 0.85, 5, M.std(0x3f8f5a, { r: 0.9 }), 12);
    gb.position.y = 2.5;
    giant.add(gb);
    for (const sd of [-1, 1]) {
      const a1 = cyl(0.3, 0.34, 1.6, M.std(0x3f8f5a, { r: 0.9 }), 8);
      a1.rotation.z = Math.PI / 2;
      a1.position.set(sd * 1.1, 2.8, 0);
      const a2 = cyl(0.3, 0.34, 1.8, M.std(0x3f8f5a, { r: 0.9 }), 8);
      a2.position.set(sd * 1.85, 3.6, 0);
      giant.add(a1, a2);
    }
    const flower = sph(0.28, M.bas(0xff7bac), 8);
    flower.position.y = 5.2;
    giant.add(flower);
    S.add(giant);
    this.cCol(-18, -28, 1.1);
    const fg = new THREE.Group();
    fg.position.set(0, 0, 8);
    S.add(fg);
    for (let i = 0; i < 4; i++) {
      const log = cyl(0.09, 0.11, 1.2, M.std(0x6e4a2a, { r: 0.95 }), 7);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = (i * Math.PI) / 4;
      log.position.y = 0.1;
      fg.add(log);
    }
    const flame = mkSprite(S, 0xff9d3c, 1.6, [0, 0.7, 8], {
      opacity: 0.9,
    });
    const flame2 = mkSprite(S, 0xffd166, 1, [0, 0.9, 8], {
      opacity: 0.9,
    });
    const flLight = new THREE.PointLight(0xff9d3c, 9, 12, 1.8);
    flLight.position.set(0, 1.2, 8);
    S.add(flLight);
    const smokes = [
      mkSprite(S, 0xd9c8b8, 0.9, [0, 1.5, 8], { opacity: 0.35 }),
      mkSprite(S, 0xd9c8b8, 0.7, [0.3, 1.8, 8], { opacity: 0.3 }),
    ];
    this.animFns.push((dt, t) => {
      const fl = 0.8 + Math.sin(t * 11) * 0.2 + Math.sin(t * 23) * 0.1;
      flame.scale.setScalar(1.6 * fl);
      flame2.scale.setScalar(fl);
      flLight.intensity = 8 + Math.sin(t * 13) * 2.5;
      smokes.forEach((s, i) => {
        const k = ((t * 0.4 + i) % 1.6) / 1.6;
        s.position.set(Math.sin(k * 6 + i) * 0.4, 1.3 + k * 4, 8);
        s.material.opacity = 0.32 * (1 - k);
        s.scale.setScalar(0.7 + k * 2);
      });
    });
    this.cCol(0, 8, 1);
    const tw = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.65),
      M.std(0x9a7a4a, { r: 1 }),
    );
    S.add(tw);
    const DN = 70,
      dp = new Float32Array(DN * 3);
    for (let i = 0; i < DN; i++) {
      dp[i * 3] = rand(-60, 60);
      dp[i * 3 + 1] = rand(0.2, 2.2);
      dp[i * 3 + 2] = rand(-60, 60);
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute("position", new THREE.BufferAttribute(dp, 3));
    S.add(
      new THREE.Points(
        dg,
        new THREE.PointsMaterial({
          color: 0xf0d0a8,
          size: 0.14,
          map: softTex,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
        }),
      ),
    );
    this.animFns.push((dt) => {
      tw.position.x += dt * 6;
      if (tw.position.x > 60) tw.position.x = -60;
      tw.rotation.z -= dt * 6;
      tw.position.z = -8 + Math.sin(tw.position.x * 0.3) * 4;
      tw.position.y =
        0.65 + Math.abs(Math.sin(tw.position.x * 1.4)) * 0.25;
      const p = dg.attributes.position;
      for (let i = 0; i < DN; i++) {
        let x = p.getX(i) + dt * 7;
        if (x > 60) x = -60;
        p.setX(i, x);
      }
      p.needsUpdate = true;
    });
    const AC = WORLDS.desert.hex;
    this.landmark({
      id: "pyramid",
      x: 16.5,
      z: -16,
      r: 5,
      color: AC,
      icon: "change_history",
      title: "Piramida Kalaris",
      fact: "Tidak ada yang tahu siapa membangunnya. Pasir di sisinya selalu rapi — padahal angin gurun tidak pernah berhenti.",
    });
    this.landmark({
      id: "oasis",
      x: 8,
      z: 26,
      r: 7.5,
      color: AC,
      icon: "water_drop",
      title: "Oasis Tersembunyi",
      fact: "Airnya tidak pernah kering walau musim terpanas. Pengembara menyebutnya titik istirahat paling damai di gurun.",
    });
    this.landmark({
      id: "ruins",
      x: -29,
      z: 13,
      r: 6,
      color: AC,
      icon: "account_balance",
      title: "Reruntuhan Sunyi",
      fact: "Pilar-pilar ini sisa dari kota kuno. Jika hening, katanya kamu bisa mendengar gema loncengnya.",
    });
    this.landmark({
      id: "cactus",
      x: -18,
      z: -28,
      r: 4.6,
      color: AC,
      icon: "grass",
      title: "Kaktus Raksasa",
      fact: "Tertua dan tertinggi di gurun ini — bungunya mekar hanya satu malam setiap tahun.",
    });
    this.landmark({
      id: "campfire",
      x: 0,
      z: 8,
      r: 4,
      color: AC,
      icon: "local_fire_department",
      title: "Api Unggun Pengembara",
      fact: "Api ini tidak pernah benar-benar padam. Setiap pengembara yang lewat menambah satu kayu — begitulah tradisinya.",
    });
    this.spawnNPC(2, -2, 4, 10);
  }
  clampBounds(p) {
    const r = Math.hypot(p.x, p.z);
    if (r > 62) {
      p.x *= 62 / r;
      p.z *= 62 / r;
    }
  }
}

/* ================================================================
   DUNIA 7 — PUNCAK ESNA
================================================================ */
