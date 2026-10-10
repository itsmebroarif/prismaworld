/* ============================================================
 * js/worlds/beach.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { M, box, cyl, mkSign, mkSprite, skyDome, sph } from "../core/engine.js";
import { rand } from "../core/util.js";
import { WORLDS } from "../core/worlds_meta.js";
import { World } from "../game/world.js";

export class BeachWorld extends World {
  constructor() {
    super("beach");
    this.spawn = { x: 0, z: 40, yaw: 0 };
    this.fovBase = 70;
    const S = this.scene;
    S.background = new THREE.Color(0x8fd2f3);
    S.fog = new THREE.Fog(0xbfe3f5, 70, 190);
    S.add(skyDome(["#2f7fd8", "#7ec3f0", "#cfeefb", "#ffe9d0"]));
    S.add(new THREE.HemisphereLight(0xbfe8ff, 0xd9c290, 0.95));
    const sun = new THREE.DirectionalLight(0xfff1d6, 1.4);
    sun.position.set(50, 70, 30);
    S.add(sun);
    mkSprite(S, 0xfff6d0, 26, [80, 60, 40]);
    this.clouds = [];
    for (let i = 0; i < 7; i++)
      this.clouds.push(
        mkSprite(
          S,
          0xffffff,
          rand(18, 34),
          [rand(-120, 120), rand(30, 55), rand(-120, 120)],
          { opacity: rand(0.5, 0.85) },
        ),
      );
    this.animFns.push((dt) => {
      for (const c of this.clouds) {
        c.position.x += dt * 1.6;
        if (c.position.x > 130) c.position.x = -130;
      }
    });
    const sea = new THREE.Mesh(
      new THREE.CircleGeometry(300, 48),
      M.std(0x2f9fd8, { r: 0.15 }),
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.y = -0.12;
    S.add(sea);
    const sand = new THREE.Mesh(
      new THREE.CircleGeometry(62, 48),
      M.std(0xe6d29e, { r: 1 }),
    );
    sand.rotation.x = -Math.PI / 2;
    sand.receiveShadow = true;
    S.add(sand);
    const foam1 = new THREE.Mesh(
      new THREE.RingGeometry(60, 61.4, 64),
      M.bas(0xffffff, {
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      }),
    );
    foam1.rotation.x = -Math.PI / 2;
    foam1.position.y = -0.06;
    S.add(foam1);
    const foam2 = new THREE.Mesh(
      new THREE.RingGeometry(63, 64.2, 64),
      M.bas(0xffffff, {
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      }),
    );
    foam2.rotation.x = -Math.PI / 2;
    foam2.position.y = -0.07;
    S.add(foam2);
    this.animFns.push((dt, t) => {
      const k = (Math.sin(t * 0.7) + 1) / 2;
      foam1.material.opacity = 0.25 + 0.35 * k;
      foam1.scale.setScalar(1 + Math.sin(t * 0.7) * 0.012);
      foam2.material.opacity = 0.1 + 0.25 * (1 - k);
    });
    const palm = (x, z, s) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      let px = 0,
        py = 0,
        lean = rand(0.06, 0.14) * (Math.random() < 0.5 ? -1 : 1);
      for (let i = 0; i < 3; i++) {
        const seg = cyl(
          0.11 * s * (1 - i * 0.18),
          0.14 * s * (1 - i * 0.18),
          1.5 * s,
          M.std(0x8a6a4a, { r: 0.95 }),
          7,
        );
        px += lean * s * i * 0.8;
        py += 1.4 * s * 0.94;
        seg.position.set(px, py, 0);
        seg.rotation.z = -lean * i * 0.6;
        g.add(seg);
      }
      for (let i = 0; i < 7; i++) {
        const piv = new THREE.Group();
        piv.position.set(px, py + 0.8 * s, 0);
        piv.rotation.y = (i / 7) * Math.PI * 2;
        const fr = box(
          2.5 * s,
          0.06,
          0.44 * s,
          M.std(0x3fa050, { r: 0.9 }),
        );
        fr.position.set(1.1 * s, 0, 0);
        fr.rotation.z = -0.42;
        piv.add(fr);
        g.add(piv);
      }
      for (let i = 0; i < 2; i++) {
        const co = sph(0.14 * s, M.std(0x6e4a2a, { r: 0.9 }), 6);
        co.position.set(
          px + rand(-0.2, 0.2),
          py + 0.4 * s,
          rand(-0.2, 0.2),
        );
        g.add(co);
      }
      S.add(g);
      this.cCol(x, z, 0.4 * s + 0.1);
    };
    const excl = [
      [0, 40, 6],
      [34, -6, 26],
      [-28, 18, 5],
      [-40, -14, 6],
      [18, 20, 4],
      [0, -48, 10],
      [58, -6, 8],
    ];
    const free = (x, z) =>
      !excl.some((e) => Math.hypot(x - e[0], z - e[1]) < e[2]);
    let pn = 0,
      guard = 0;
    while (pn < 10 && guard++ < 500) {
      const a = rand(0, 6.28),
        r = rand(20, 54),
        x = Math.cos(a) * r,
        z = Math.sin(a) * r;
      if (!free(x, z)) continue;
      palm(x, z, rand(0.9, 1.4));
      pn++;
    }
    palm(-28, 18, 1.7);
    const ucols = [0xff5f7e, 0x4ddac2, 0xffc24d, 0x9d8bff, 0xff8a5c];
    for (let i = 0; i < 5; i++) {
      const x = rand(-30, 20),
        z = rand(14, 40);
      if (!free(x, z)) continue;
      const pole = cyl(0.04, 0.05, 2.4, M.std(0x8a7a6a), 6);
      pole.position.set(x, 1.2, z);
      const um = new THREE.Mesh(
        new THREE.ConeGeometry(1.5, 0.7, 10),
        M.std(ucols[i], { r: 0.8 }),
      );
      um.position.set(x, 2.3, z);
      const tow = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 1.9),
        M.std(ucols[(i + 2) % 5], { r: 1 }),
      );
      tow.rotation.x = -Math.PI / 2;
      tow.rotation.z = rand(0, 3);
      tow.position.set(x + 1.6, 0.02, z + rand(-0.6, 0.6));
      S.add(pole, um, tow);
      this.cCol(x, z, 0.3);
    }
    for (let i = 0; i < 4; i++) {
      const b = sph(0.34, M.std(ucols[i], { r: 0.5 }), 12);
      b.position.set(rand(-20, 15), 0.34, rand(20, 42));
      S.add(b);
      this.cCol(b.position.x, b.position.z, 0.4);
    }
    const wood = M.std(0x9a7350, { r: 0.9 });
    for (let i = 0; i < 12; i++) {
      const pl = box(2, 0.1, 2, wood);
      pl.position.set(34 + i * 2.1, 0.05, -6);
      pl.rotation.y = rand(-0.05, 0.05);
      S.add(pl);
      if (i % 2 === 0)
        for (const sz of [-1, 1]) {
          const post = cyl(0.08, 0.1, 1.4, wood, 6);
          post.position.set(34 + i * 2.1, 0.1, -6 + sz * 1.05);
          S.add(post);
        }
    }
    const deckEnd = box(4.4, 0.1, 4.4, wood);
    deckEnd.position.set(59.5, 0.05, -6);
    S.add(deckEnd);
    for (const [wx, wz] of [
      [57.4, -8.2],
      [61.6, -8.2],
      [57.4, -3.8],
      [61.6, -3.8],
    ]) {
      const post = cyl(0.09, 0.11, 1.5, wood, 6);
      post.position.set(wx, 0.1, wz);
      S.add(post);
    }
    const pierSign = mkSign("DERMAGA", "#5ec8f2", 2.6, 1);
    pierSign.position.set(59.5, 1.4, -6);
    pierSign.rotation.y = Math.PI / 2;
    S.add(pierSign);
    const LH = [-40, -14];
    const lhb = cyl(1.6, 2, 11, M.std(0xf0eaf4, { r: 0.8 }), 14);
    lhb.position.set(LH[0], 5.5, LH[1]);
    S.add(lhb);
    this.cCol(...LH, 2.1);
    for (const y of [2.2, 5.4, 8.6]) {
      const band = cyl(1.68, 1.68, 1, M.std(0xff5f5f, { r: 0.8 }), 14);
      band.position.set(LH[0], y, LH[1]);
      S.add(band);
    }
    const cabin = cyl(1.15, 1.15, 1.2, M.bas(0x2a2233), 14);
    cabin.position.set(LH[0], 11.6, LH[1]);
    S.add(cabin);
    const lRoof = new THREE.Mesh(
      new THREE.ConeGeometry(1.35, 0.9, 14),
      M.std(0xff5f5f, { r: 0.7 }),
    );
    lRoof.position.set(LH[0], 12.7, LH[1]);
    S.add(lRoof);
    const beamGrp = new THREE.Group();
    beamGrp.position.set(LH[0], 11.6, LH[1]);
    S.add(beamGrp);
    for (const dir of [0, Math.PI]) {
      const lb = new THREE.Mesh(
        new THREE.ConeGeometry(1.2, 16, 10, 1, true),
        M.bas(0xfff3c2, {
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      lb.rotation.z = Math.PI / 2 + dir;
      lb.position.set(Math.cos(dir) * 8, 0, 0);
      beamGrp.add(lb);
    }
    this.animFns.push((dt) => {
      beamGrp.rotation.y += dt * 0.8;
    });
    for (let i = 0; i < 5; i++) {
      const r = new THREE.Mesh(
        new THREE.DodecahedronGeometry(rand(1.2, 2.4)),
        M.std(0x8a8578, { r: 0.95 }),
      );
      r.position.set(rand(-14, 14), rand(0.2, 0.7), -48 + rand(-3, 3));
      r.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
      S.add(r);
      this.cCol(r.position.x, r.position.z, 1.8);
    }
    const wg = new THREE.Group();
    wg.position.set(18, 0, 20);
    wg.rotation.y = Math.atan2(-18, -20);
    S.add(wg);
    const wBody = box(2.6, 2.1, 1.6, M.std(0xb08a5a, { r: 0.9 }));
    wBody.position.y = 1.05;
    wg.add(wBody);
    const wRoof = new THREE.Mesh(
      new THREE.ConeGeometry(2.4, 1.1, 4),
      M.std(0x5a8a5a, { r: 0.9 }),
    );
    wRoof.position.y = 2.6;
    wRoof.rotation.y = Math.PI / 4;
    wg.add(wRoof);
    const wSign = mkSign("KELAPA ES", "#5ec8f2", 2.2, 0.8);
    wSign.position.set(0, 1.7, 0.85);
    wg.add(wSign);
    this.rCol(18, 20, 1.5, 1.1);
    const gulls = [];
    const gwR = new THREE.PlaneGeometry(0.9, 0.3);
    gwR.translate(0.45, 0, 0);
    const gwL = new THREE.PlaneGeometry(0.9, 0.3);
    gwL.translate(-0.45, 0, 0);
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group(),
        cm = M.bas(0xffffff, { side: THREE.DoubleSide });
      const wl = new THREE.Mesh(gwL, cm),
        wr = new THREE.Mesh(gwR, cm);
      g.add(wl, wr, box(0.1, 0.08, 0.4, M.std(0xf0eaf4)));
      S.add(g);
      gulls.push({
        g,
        wl,
        wr,
        cx: rand(30, 60),
        cz: rand(-40, -5),
        r: rand(6, 14),
        sp: rand(0.25, 0.5),
        ph: rand(0, 6),
        y: rand(8, 15),
      });
    }
    const buoys = [];
    for (let i = 0; i < 3; i++) {
      const b = sph(0.4, M.std(0xff5f5f, { r: 0.6 }), 10);
      const b2 = sph(0.41, M.bas(0xffffff), 10);
      b2.scale.y = 0.4;
      b.add(b2);
      b.position.set(rand(66, 76), 0, rand(-20, 20));
      S.add(b);
      buoys.push({ m: b, ph: rand(0, 6) });
    }
    this.animFns.push((dt, t) => {
      for (const gl of gulls) {
        const a = t * gl.sp + gl.ph;
        gl.g.position.set(
          gl.cx + Math.cos(a) * gl.r,
          gl.y + Math.sin(t * 0.9 + gl.ph) * 1.2,
          gl.cz + Math.sin(a) * gl.r,
        );
        gl.g.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a));
        const fl = Math.sin(t * 7 + gl.ph) * 0.7;
        gl.wl.rotation.y = fl;
        gl.wr.rotation.y = -fl;
      }
      for (const b of buoys) {
        b.m.position.y = -0.1 + Math.sin(t * 1.4 + b.ph) * 0.18;
        b.m.rotation.z = Math.sin(t * 1.1 + b.ph) * 0.12;
      }
    });
    const AC = WORLDS.beach.hex;
    this.landmark({
      id: "pier",
      x: 56,
      z: -6,
      r: 5.5,
      color: AC,
      icon: "sailing",
      title: "Dermaga Karang",
      fact: "Dibangun penuh kesabaran papan demi papan. Ujungnya adalah titik terbaik menonton matahari terbenam.",
    });
    this.landmark({
      id: "lighthouse",
      x: -40,
      z: -14,
      r: 5,
      color: AC,
      icon: "light",
      title: "Mercusuar Tua",
      fact: "Berputar tanpa henti sejak 40 tahun lalu. Cahayanya katanya pernah memandu seekor paus tersesat kembali ke laut.",
    });
    this.landmark({
      id: "palm",
      x: -28,
      z: 18,
      r: 4.6,
      color: AC,
      icon: "park",
      title: "Kelapa Tua",
      fact: "Pohon tertua di pulau ini. Buahnya tidak boleh dipetik — katanya untuk penghuni pulau yang lebih dulu.",
    });
    this.landmark({
      id: "rocks",
      x: 0,
      z: -46,
      r: 6,
      color: AC,
      icon: "landscape",
      title: "Batu Wajah",
      fact: "Dari sudut tertentu, susunan batu ini terlihat seperti wajah yang tersenyum. Laut mengukirnya selama ribuan tahun.",
    });
    this.landmark({
      id: "warung",
      x: 18,
      z: 20,
      r: 4.4,
      color: AC,
      icon: "storefront",
      title: "Warung Kelapa Es",
      fact: "Semua kelapa di sini dipetik pagi-pagi. Pemiliknya selalu menyisipkan sedikit gula aren — resep rahasia keluarga.",
    });
    this.spawnNPC(8, 0, 16, 18);
  }
  clampBounds(p) {
    const r = Math.hypot(p.x, p.z);
    if (r > 58.5) {
      p.x *= 58.5 / r;
      p.z *= 58.5 / r;
    }
  }
}

/* ================================================================
   DUNIA 6 — GURUN KALARIS
================================================================ */
