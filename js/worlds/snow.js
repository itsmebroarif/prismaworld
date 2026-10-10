/* ============================================================
 * js/worlds/snow.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { M, box, cyl, mkSprite, skyDome, softTex, sph } from "../core/engine.js";
import { rand } from "../core/util.js";
import { WORLDS } from "../core/worlds_meta.js";
import { World } from "../game/world.js";

export class SnowWorld extends World {
  constructor() {
    super("snow");
    this.spawn = { x: 0, z: 34, yaw: 0 };
    this.fovBase = 70;
    const S = this.scene;
    S.background = new THREE.Color(0x9db8dd);
    S.fog = new THREE.Fog(0xdfe9f5, 60, 170);
    S.add(skyDome(["#5a7ab5", "#9db8dd", "#dce8f5", "#f8fbff"]));
    S.add(new THREE.HemisphereLight(0xe8f2ff, 0x8a9ab5, 1.0));
    const sun = new THREE.DirectionalLight(0xfff4e0, 1.0);
    sun.position.set(40, 55, 25);
    S.add(sun);
    const base = new THREE.Mesh(
      new THREE.PlaneGeometry(500, 500),
      M.std(0xeef4fa, { r: 1 }),
    );
    base.rotation.x = -Math.PI / 2;
    base.receiveShadow = true;
    S.add(base);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2,
        r = rand(30, 52);
      const m = sph(rand(7, 13), M.std(0xf5f9fd, { r: 1 }), 14);
      m.scale.y = rand(0.14, 0.22);
      m.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      S.add(m);
    }
    const peak = new THREE.Mesh(
      new THREE.ConeGeometry(15, 19, 7),
      M.std(0xf8fbff, { r: 0.95 }),
    );
    peak.position.set(0, 8.6, -34);
    S.add(peak);
    this.cCol(0, -34, 10);
    const flagPole = cyl(0.04, 0.04, 2.4, M.std(0x5a6a7a), 6);
    flagPole.position.set(0, 19.6, -34);
    S.add(flagPole);
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.6),
      M.bas(0xff6fb5, { side: THREE.DoubleSide }),
    );
    flag.position.set(0.6, 20.4, -34);
    S.add(flag);
    const pine = (x, z, s) => {
      const tr = cyl(0.12 * s, 0.16 * s, 0.9 * s, M.std(0x6e4a2f), 7);
      tr.position.set(x, 0.45 * s, z);
      const c1 = new THREE.Mesh(
        new THREE.ConeGeometry(1 * s, 1.6 * s, 8),
        M.std(0x2a5a44, { r: 0.95 }),
      );
      c1.position.set(x, 1.5 * s, z);
      const c2 = new THREE.Mesh(
        new THREE.ConeGeometry(0.72 * s, 1.3 * s, 8),
        M.std(0x2a5a44, { r: 0.95 }),
      );
      c2.position.set(x, 2.4 * s, z);
      const snow2 = new THREE.Mesh(
        new THREE.ConeGeometry(0.4 * s, 0.8 * s, 8),
        M.std(0xf5f9fd, { r: 0.95 }),
      );
      snow2.position.set(x, 3.05 * s, z);
      S.add(tr, c1, c2, snow2);
      this.cCol(x, z, 0.42 * s + 0.1);
    };
    const excl = [
      [0, 0, 10],
      [-18, 8, 7],
      [16, -12, 12],
      [2, 20, 6],
      [0, -34, 13],
      [0, 34, 5],
      [-30, -18, 5],
    ];
    const free = (x, z) =>
      !excl.some((e) => Math.hypot(x - e[0], z - e[1]) < e[2]);
    let tn = 0,
      guard = 0;
    while (tn < 20 && guard++ < 500) {
      const a = rand(0, 6.28),
        r = rand(14, 54),
        x = Math.cos(a) * r,
        z = Math.sin(a) * r;
      if (!free(x, z)) continue;
      pine(x, z, rand(0.9, 1.6));
      tn++;
    }
    pine(-30, -18, 2.4);
    const cab = new THREE.Group();
    cab.position.set(-18, 0, 8);
    cab.rotation.y = 0.4;
    S.add(cab);
    const cBody = box(5, 3, 4, M.std(0x7a5638, { r: 0.9 }));
    cBody.position.y = 1.5;
    cab.add(cBody);
    for (const sd of [-1, 1]) {
      const r2 = box(3.4, 0.22, 4.6, M.std(0x5a3d28, { r: 0.9 }));
      r2.position.set(sd * 1.35, 3.6, 0);
      r2.rotation.z = sd * 0.62;
      cab.add(r2);
    }
    const chim = box(0.6, 1.4, 0.6, M.std(0x8a8578, { r: 0.95 }));
    chim.position.set(1.2, 4.2, -0.8);
    cab.add(chim);
    for (const [wx] of [-1.3, 1.3]) {
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 0.8),
        M.bas(0xffd9a0),
      );
      win.position.set(wx, 1.6, 2.02);
      cab.add(win);
    }
    const door = box(0.9, 1.7, 0.08, M.std(0x4a3320, { r: 0.9 }));
    door.position.set(0, 0.85, 2.03);
    cab.add(door);
    const cLight = new THREE.PointLight(0xffc98a, 8, 12, 1.8);
    cLight.position.set(-18, 2.2, 10);
    S.add(cLight);
    this.rCol(-18, 8, 2.9, 2.4);
    const smoke = [
      mkSprite(S, 0xdfe9f5, 0.8, [-16.7, 5.4, 7.2], { opacity: 0.4 }),
      mkSprite(S, 0xdfe9f5, 0.6, [-16.5, 5.8, 7], { opacity: 0.35 }),
    ];
    const lake = new THREE.Mesh(
      new THREE.CircleGeometry(10, 36),
      M.std(0xa8d8ef, { r: 0.08, m: 0.2 }),
    );
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(16, 0.05, -12);
    S.add(lake);
    const lakeRim = new THREE.Mesh(
      new THREE.RingGeometry(10, 10.8, 36),
      M.std(0xf5f9fd, { r: 1 }),
    );
    lakeRim.rotation.x = -Math.PI / 2;
    lakeRim.position.set(16, 0.03, -12);
    S.add(lakeRim);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const cr = new THREE.Mesh(
        new THREE.OctahedronGeometry(rand(0.3, 0.6)),
        M.bas(0x9adfff),
      );
      cr.position.set(
        16 + Math.cos(a) * 11.4,
        rand(0.3, 0.8),
        -12 + Math.sin(a) * 11.4,
      );
      cr.rotation.set(rand(0, 3), rand(0, 3), 0);
      S.add(cr);
    }
    const snowman = (x, z, s) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      const b1 = sph(0.55 * s, M.std(0xf8fbff, { r: 0.95 }), 12);
      b1.position.y = 0.5 * s;
      const b2 = sph(0.4 * s, M.std(0xf8fbff, { r: 0.95 }), 12);
      b2.position.y = 1.2 * s;
      const b3 = sph(0.3 * s, M.std(0xf8fbff, { r: 0.95 }), 10);
      b3.position.y = 1.75 * s;
      const nose = cyl(0.03, 0.06, 0.3, M.bas(0xff8a3c), 6);
      nose.rotation.x = Math.PI / 2;
      nose.position.set(0, 1.75 * s, 0.35 * s);
      const hat = cyl(0.18 * s, 0.18 * s, 0.3 * s, M.std(0x2a2233), 10);
      hat.position.y = 2.05 * s;
      const brim = cyl(0.3 * s, 0.3 * s, 0.05 * s, M.std(0x2a2233), 10);
      brim.position.y = 1.92 * s;
      const arm = cyl(0.03, 0.04, 0.9 * s, M.std(0x6e4a2f), 5);
      arm.rotation.z = 1.1;
      arm.position.set(0.6 * s, 1.3 * s, 0);
      g.add(b1, b2, b3, nose, hat, brim, arm);
      S.add(g);
      this.cCol(x, z, 0.6 * s);
    };
    snowman(2, 20, 1.3);
    snowman(3.6, 19, 0.9);
    snowman(0.6, 19.2, 0.7);
    const SN2 = 320,
      sp2 = new Float32Array(SN2 * 3),
      sd2 = [];
    for (let i = 0; i < SN2; i++) {
      sp2[i * 3] = rand(-55, 55);
      sp2[i * 3 + 1] = rand(0, 22);
      sp2[i * 3 + 2] = rand(-55, 55);
      sd2.push({ fs: rand(0.8, 1.8), ph: rand(0, 6) });
    }
    const sg2 = new THREE.BufferGeometry();
    sg2.setAttribute("position", new THREE.BufferAttribute(sp2, 3));
    S.add(
      new THREE.Points(
        sg2,
        new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.14,
          map: softTex,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
        }),
      ),
    );
    this.animFns.push((dt, t) => {
      const p = sg2.attributes.position;
      for (let i = 0; i < SN2; i++) {
        const d = sd2[i];
        let y = p.getY(i) - d.fs * dt;
        let x = p.getX(i) + Math.sin(t * 0.8 + d.ph) * dt * 0.8;
        if (y < 0) y = 22;
        p.setY(i, y);
        p.setX(i, x);
      }
      p.needsUpdate = true;
      smoke.forEach((s, i) => {
        const k = ((t * 0.35 + i) % 1.8) / 1.8;
        s.position.set(
          -16.7 + Math.sin(k * 5 + i) * 0.4,
          5 + k * 4.5,
          7.2,
        );
        s.material.opacity = 0.35 * (1 - k);
        s.scale.setScalar(0.7 + k * 2.2);
      });
      flag.rotation.y = Math.sin(t * 2.2) * 0.4;
    });
    const AC = WORLDS.snow.hex;
    this.landmark({
      id: "cabin",
      x: -18,
      z: 8,
      r: 5.4,
      color: AC,
      icon: "cottage",
      title: "Kabin Kayu",
      fact: "Jendelanya selalu hangat menguning. Pemiliknya meninggalkan teh panas di meja — untuk siapa pun yang lewat.",
    });
    this.landmark({
      id: "lake",
      x: 16,
      z: -12,
      r: 11,
      color: AC,
      icon: "ice_skating",
      title: "Danau Beku",
      fact: "Esnya setebal dua meter dan bening seperti kaca. Kristal di tepinya berdengung pelan saat matahari terbit.",
    });
    this.landmark({
      id: "snowmen",
      x: 2,
      z: 20,
      r: 4.4,
      color: AC,
      icon: "emoji_people",
      title: "Keluarga Salju",
      fact: "Dibangun tiga bersaudara setiap awal musim. Topi milik yang paling kecil selalu miring — tidak ada yang tahu kenapa.",
    });
    this.landmark({
      id: "oldtree",
      x: -30,
      z: -18,
      r: 4.4,
      color: AC,
      icon: "park",
      title: "Pohon Tertua",
      fact: "Satu-satunya pinus yang bertahan dari badai seratus tahun lalu. Saljunya tidak pernah menempel terlalu lama.",
    });
    this.landmark({
      id: "peak",
      x: 0,
      z: -20,
      r: 6,
      color: AC,
      icon: "flag",
      title: "Puncak Esna",
      fact: "Titik tertinggi dunia ini. Bendera merah mudanya dipasang oleh pendaki pertama — dan belum pernah diturunkan.",
    });
    this.spawnNPC(3, -12, 6, 6);
  }
  clampBounds(p) {
    const r = Math.hypot(p.x, p.z);
    if (r > 58) {
      p.x *= 58 / r;
      p.z *= 58 / r;
    }
  }
}

/* ================================================================
   DUNIA 8 — HUTAN LUNARIA
================================================================ */
