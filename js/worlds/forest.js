/* ============================================================
 * js/worlds/forest.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { M, box, cyl, mkSprite, skyDome, softTex, sph } from "../core/engine.js";
import { rand, randi } from "../core/util.js";
import { WORLDS } from "../core/worlds_meta.js";
import { World } from "../game/world.js";

export class ForestWorld extends World {
  constructor() {
    super("forest");
    this.spawn = { x: 0, z: 38, yaw: 0 };
    this.fovBase = 70;
    const S = this.scene;
    S.background = new THREE.Color(0x0c0a20);
    S.fog = new THREE.Fog(0x141028, 25, 95);
    S.add(skyDome(["#060614", "#0e0c26", "#241a4a", "#3a2a6e"]));
    S.add(new THREE.HemisphereLight(0x5a4a8a, 0x0a120e, 0.55));
    const moonL = new THREE.DirectionalLight(0x8a7ad0, 0.55);
    moonL.position.set(30, 50, 20);
    S.add(moonL);
    mkSprite(S, 0xe8e2ff, 16, [45, 55, 30]);
    mkSprite(S, 0xb9a5ff, 30, [45, 55, 30], { opacity: 0.25 });
    const ST = 300,
      stp = new Float32Array(ST * 3);
    for (let i = 0; i < ST; i++) {
      const a = rand(0, 6.28),
        ph2 = rand(0.05, 0.45),
        r = 170;
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
          color: 0xcfd8ff,
          size: 0.55,
          map: softTex,
          transparent: true,
          opacity: 0.8,
          depthWrite: false,
        }),
      ),
    );
    const base = new THREE.Mesh(
      new THREE.PlaneGeometry(500, 500),
      M.std(0x14261e, { r: 1 }),
    );
    base.rotation.x = -Math.PI / 2;
    S.add(base);
    const tree = (x, z, s) => {
      const tr = cyl(
        0.14 * s,
        0.2 * s,
        2.4 * s,
        M.std(0x2e2438, { r: 0.95 }),
        7,
      );
      tr.position.set(x, 1.2 * s, z);
      const c1 = sph(1.1 * s, M.std(0x16302a, { r: 0.95 }), 9);
      c1.position.set(x, 3 * s, z);
      c1.scale.y = 0.85;
      const c2 = sph(0.8 * s, M.std(0x1a382e, { r: 0.95 }), 9);
      c2.position.set(x + 0.4 * s, 2.4 * s, z + 0.3 * s);
      S.add(tr, c1, c2);
      this.cCol(x, z, 0.42 * s + 0.1);
    };
    const excl = [
      [0, 0, 8],
      [-18, -14, 7],
      [14, 16, 9],
      [6, -26, 8],
      [0, 38, 5],
      [-8, 22, 6],
      [25, -2, 4],
    ];
    const free = (x, z) =>
      !excl.some((e) => Math.hypot(x - e[0], z - e[1]) < e[2]);
    let tn = 0,
      guard = 0;
    while (tn < 24 && guard++ < 600) {
      const a = rand(0, 6.28),
        r = rand(12, 52),
        x = Math.cos(a) * r,
        z = Math.sin(a) * r;
      if (!free(x, z)) continue;
      tree(x, z, rand(0.9, 1.7));
      tn++;
    }
    const ancient = new THREE.Group();
    ancient.position.set(-18, 0, -14);
    S.add(ancient);
    const aTr = cyl(2.2, 3, 13, M.std(0x3a2a48, { r: 0.95 }), 12);
    aTr.position.y = 6.5;
    ancient.add(aTr);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const root = box(1.2, 1, 3.4, M.std(0x3a2a48, { r: 0.95 }));
      root.position.set(Math.cos(a) * 2.6, 0.4, Math.sin(a) * 2.6);
      root.rotation.y = -a;
      root.rotation.z = 0.35;
      ancient.add(root);
    }
    for (let i = 0; i < 4; i++) {
      const c = sph(rand(3, 4.4), M.std(0x1a3a30, { r: 0.95 }), 10);
      c.position.set(rand(-3.5, 3.5), 13 + rand(0, 3), rand(-3.5, 3.5));
      ancient.add(c);
    }
    const rune = new THREE.Mesh(
      new THREE.TorusGeometry(4.2, 0.09, 8, 48),
      M.bas(0xb78bff, { transparent: true, opacity: 0.8 }),
    );
    rune.rotation.x = Math.PI / 2;
    rune.position.y = 0.15;
    ancient.add(rune);
    const aLight = new THREE.PointLight(0xb78bff, 14, 16, 1.8);
    aLight.position.set(-18, 3, -14);
    S.add(aLight);
    this.cCol(-18, -14, 3.4);
    const mushCols = [0x4ddac2, 0xb78bff, 0xff7bac];
    const mush = (x, z, s, glow) => {
      const st = cyl(0.1 * s, 0.15 * s, 0.5 * s, M.lam(0xd9cfe6), 7);
      st.position.set(x, 0.25 * s, z);
      const cap = sph(
        0.42 * s,
        glow
          ? M.bas(mushCols[randi(0, 2)])
          : M.std(mushCols[randi(0, 2)], { r: 0.6 }),
        10,
      );
      cap.scale.y = 0.55;
      cap.position.set(x, 0.55 * s, z);
      S.add(st, cap);
    };
    for (let i = 0; i < 16; i++) {
      const a = rand(0, 6.28),
        r = rand(8, 44),
        x = Math.cos(a) * r,
        z = Math.sin(a) * r;
      if (!free(x, z)) continue;
      mush(x, z, rand(0.8, 1.6), Math.random() < 0.5);
    }
    for (let i = 0; i < 4; i++) {
      const x = -8 + Math.cos(i * 1.7) * 3.4,
        z = 22 + Math.sin(i * 1.7) * 3.4;
      mush(x, z, rand(3, 4.2), true);
    }
    for (let i = 0; i < 2; i++) {
      const pl = new THREE.PointLight(mushCols[i], 5, 8, 1.8);
      pl.position.set(
        -8 + Math.cos(i * 2.5) * 3,
        2,
        22 + Math.sin(i * 2.5) * 3,
      );
      S.add(pl);
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = new THREE.Mesh(
        new THREE.DodecahedronGeometry(rand(0.75, 1)),
        M.std(0x4a4258, { r: 0.95 }),
      );
      r.position.set(
        14 + Math.cos(a) * 7,
        rand(0.5, 0.9),
        16 + Math.sin(a) * 7,
      );
      r.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
      S.add(r);
      this.cCol(14 + Math.cos(a) * 7, 16 + Math.sin(a) * 7, 0.9);
    }
    const pedestal = cyl(0.5, 0.65, 1, M.std(0x4a4258, { r: 0.9 }), 8);
    pedestal.position.set(14, 0.5, 16);
    S.add(pedestal);
    const crys = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.45),
      M.bas(0xb78bff),
    );
    crys.position.set(14, 1.7, 16);
    S.add(crys);
    const pond = new THREE.Mesh(
      new THREE.CircleGeometry(6, 32),
      M.bas(0x2a5a7a),
    );
    pond.rotation.x = -Math.PI / 2;
    pond.position.set(6, 0.04, -26);
    S.add(pond);
    const pondGlow = new THREE.Mesh(
      new THREE.CircleGeometry(5.4, 32),
      M.bas(0x7ad0ff, { transparent: true, opacity: 0.25 }),
    );
    pondGlow.rotation.x = -Math.PI / 2;
    pondGlow.position.set(6, 0.06, -26);
    S.add(pondGlow);
    for (let i = 0; i < 5; i++)
      mkSprite(
        S,
        0x9adfff,
        0.5,
        [6 + rand(-4, 4), 0.25, -26 + rand(-4, 4)],
        { opacity: 0.8 },
      );
    this.cCol(6, -26, 6.4);
    for (let i = 0; i < 14; i++) {
      const t = i / 13,
        x = Math.sin(t * 3) * 6,
        z = 34 - t * 30;
      const st2 = new THREE.Mesh(
        new THREE.CircleGeometry(0.4, 10),
        M.bas(0x4a4a6e, { transparent: true, opacity: 0.6 }),
      );
      st2.rotation.x = -Math.PI / 2;
      st2.position.set(x, 0.03, z);
      S.add(st2);
    }
    const FF = 46,
      ffp = new Float32Array(FF * 3),
      ffd = [];
    for (let i = 0; i < FF; i++) {
      const a = rand(0, 6.28),
        r = rand(4, 40);
      ffd.push({
        x: Math.cos(a) * r,
        z: Math.sin(a) * r,
        ph: rand(0, 6),
        r: rand(1, 3),
        sp: rand(0.3, 0.7),
      });
      ffp[i * 3] = ffd[i].x;
      ffp[i * 3 + 1] = 1.4;
      ffp[i * 3 + 2] = ffd[i].z;
    }
    const ffg = new THREE.BufferGeometry();
    ffg.setAttribute("position", new THREE.BufferAttribute(ffp, 3));
    S.add(
      new THREE.Points(
        ffg,
        new THREE.PointsMaterial({
          color: 0xd9ff8a,
          size: 0.16,
          map: softTex,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      ),
    );
    const wisps = [];
    for (let i = 0; i < 4; i++)
      wisps.push(
        mkSprite(
          S,
          0xd9c2ff,
          0.8,
          [25 + rand(-2, 2), rand(1, 2), -2 + rand(-2, 2)],
          { opacity: 0.7 },
        ),
      );
    this.animFns.push((dt, t) => {
      rune.rotation.z += dt * 0.15;
      rune.material.opacity = 0.55 + 0.3 * Math.sin(t * 2);
      crys.rotation.y += dt;
      aLight.intensity = 12 + Math.sin(t * 2) * 4;
      crys.position.y = 1.7 + Math.sin(t * 1.6) * 0.2;
      const p = ffg.attributes.position;
      for (let i = 0; i < FF; i++) {
        const d = ffd[i];
        p.setXYZ(
          i,
          d.x + Math.cos(t * d.sp + d.ph) * d.r,
          1.4 + Math.sin(t * 0.7 + d.ph) * 0.7,
          d.z + Math.sin(t * d.sp + d.ph) * d.r,
        );
      }
      p.needsUpdate = true;
      wisps.forEach((w, i) => {
        w.position.y =
          1.4 +
          Math.sin(t * 1.1 + i * 2) * 0.5 +
          ((t * 0.4 + i) % 2) * 1.6;
        w.material.opacity = 0.55 * (1 - ((t * 0.4 + i) % 2) / 2);
      });
    });
    const AC = WORLDS.forest.hex;
    this.landmark({
      id: "ancient",
      x: -18,
      z: -14,
      r: 6.4,
      color: AC,
      icon: "forest",
      title: "Pohon Purba",
      fact: "Usianya lebih tua dari hutan ini sendiri. Rune ungu di kakinya menyala setiap malam — tidak ada yang tahu siapa mengukirnya.",
    });
    this.landmark({
      id: "stones",
      x: 14,
      z: 16,
      r: 6,
      color: AC,
      icon: "diamond",
      title: "Lingkar Batu",
      fact: "Delapan batu melingkari kristal melayang. Konon berdiri di tengahnya saat tengah malam membuatmu bisa mendengar hutan bernapas.",
    });
    this.landmark({
      id: "shrooms",
      x: -8,
      z: 22,
      r: 5,
      color: AC,
      icon: "spa",
      title: "Jamur Lunaria",
      fact: "Empat jamur raksasa bercahaya ini tumbuh dalam satu malam — dan tidak pernah layu sejak itu.",
    });
    this.landmark({
      id: "pond",
      x: 6,
      z: -26,
      r: 7.5,
      color: AC,
      icon: "water",
      title: "Kolam Cahaya",
      fact: "Airnya memantulkan bulan bahkan saat mendung. Kunang-kunang selalu berkumpul di sini menjelang subuh.",
    });
    this.landmark({
      id: "wisp",
      x: 25,
      z: -2,
      r: 4.4,
      color: AC,
      icon: "auto_awesome",
      title: "Wisp Hutan",
      fact: "Cahaya kecil yang melayang naik-turun di antara pepohonan. Mengikutinya katanya membawa keberuntungan.",
    });
    this.spawnNPC(2, 4, 4, 8);
  }
  clampBounds(p) {
    const r = Math.hypot(p.x, p.z);
    if (r > 54) {
      p.x *= 54 / r;
      p.z *= 54 / r;
    }
  }
}

/* ================================================================
   DUNIA 9 — STASIUN HELIOS (gravitasi rendah)
================================================================ */
