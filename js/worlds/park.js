/* ============================================================
 * js/worlds/park.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { M, box, cyl, mkSprite, skyDome, softTex, sph } from "../core/engine.js";
import { touchMode } from "../core/input.js";
import { rand, randi } from "../core/util.js";
import { WORLDS } from "../core/worlds_meta.js";
import { World } from "../game/world.js";

export class ParkWorld extends World {
  constructor() {
    super("park");
    this.spawn = { x: 0, z: 30, yaw: 0 };
    this.fovBase = 70;
    const S = this.scene;
    S.background = new THREE.Color(0xaee2f7);
    S.fog = new THREE.Fog(0xd6eef9, 50, 135);
    S.add(skyDome(["#3fa0e8", "#8fd2f3", "#e8f7fb", "#ffe1ea"]));
    S.add(new THREE.HemisphereLight(0xbfe4ff, 0x3f8f4f, 0.85));
    const sun = new THREE.DirectionalLight(0xfff1d6, 1.55);
    sun.position.set(45, 60, 30);
    if (!touchMode) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, {
        left: -55,
        right: 55,
        top: 55,
        bottom: -55,
        near: 5,
        far: 170,
      });
      sun.shadow.bias = -0.0005;
    }
    S.add(sun);
    mkSprite(S, 0xfff3cf, 20, [70, 58, 60]);
    this.clouds = [];
    for (let i = 0; i < 9; i++)
      this.clouds.push(
        mkSprite(
          S,
          0xffffff,
          rand(15, 32),
          [rand(-120, 120), rand(32, 54), rand(-120, 120)],
          { opacity: rand(0.5, 0.85) },
        ),
      );
    this.animFns.push((dt) => {
      for (const c of this.clouds) {
        c.position.x += dt * 1.3;
        if (c.position.x > 135) c.position.x = -135;
      }
    });
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(70, 48),
      M.std(0x53bd5c, { r: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    S.add(ground);
    const excl = [
      [0, 0, 10],
      [17, -11, 9.8],
      [-17, -15, 6],
      [-19, 13, 6],
      [16, 16, 10],
      [0, 20, 3.2],
      [0, 30, 4],
    ];
    const free = (x, z) =>
      !excl.some((e) => Math.hypot(x - e[0], z - e[1]) < e[2]);
    const dummy = new THREE.Object3D(),
      tcol = new THREE.Color();
    const tufts = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.09, 0.42, 4),
      M.lam(0xffffff),
      420,
    );
    let n = 0,
      guard = 0;
    while (n < 420 && guard++ < 4000) {
      const a = rand(0, 6.283),
        r = Math.sqrt(Math.random()) * 45,
        x = Math.cos(a) * r,
        z = Math.sin(a) * r;
      if (!free(x, z)) continue;
      dummy.position.set(x, 0.2, z);
      dummy.rotation.set(
        rand(-0.15, 0.15),
        rand(0, 6),
        rand(-0.15, 0.15),
      );
      const s = rand(0.7, 1.5);
      dummy.scale.set(s, s * rand(0.9, 1.6), s);
      dummy.updateMatrix();
      tufts.setMatrixAt(n, dummy.matrix);
      tufts.setColorAt(
        n,
        tcol.setHSL(rand(0.28, 0.36), 0.55, rand(0.3, 0.45)),
      );
      n++;
    }
    tufts.count = n;
    S.add(tufts);
    const plaza = new THREE.Mesh(
      new THREE.CircleGeometry(8, 40),
      M.std(0xdec9a0, { r: 0.95 }),
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.02;
    plaza.receiveShadow = true;
    S.add(plaza);
    const wat = new THREE.Mesh(
      new THREE.CircleGeometry(2.45, 24),
      M.std(0x54c8ec, { r: 0.15 }),
    );
    wat.rotation.x = -Math.PI / 2;
    wat.position.y = 0.68;
    const basin = cyl(2.7, 3, 0.7, M.std(0xd8c6a2, { r: 0.85 }), 24);
    basin.position.y = 0.35;
    basin.castShadow = true;
    const ped = cyl(0.5, 0.68, 1.3, M.std(0xd8c6a2, { r: 0.85 }), 10);
    ped.position.y = 1.3;
    const bowl = cyl(1.25, 0.95, 0.32, M.std(0xd8c6a2, { r: 0.85 }), 14);
    bowl.position.y = 2.05;
    bowl.castShadow = true;
    const lotus = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.34),
      M.bas(0xff9ec7),
    );
    lotus.position.y = 2.75;
    S.add(basin, wat, ped, bowl, lotus);
    this.cCol(0, 0, 3.2);
    const FN = 90,
      fpos = new Float32Array(FN * 3),
      fv = [];
    for (let i = 0; i < FN; i++) {
      fpos[i * 3] = rand(-0.3, 0.3);
      fpos[i * 3 + 1] = rand(0.7, 2.2);
      fpos[i * 3 + 2] = rand(-0.3, 0.3);
      fv.push({
        x: rand(-0.6, 0.6),
        y: rand(3, 4.3),
        z: rand(-0.6, 0.6),
      });
    }
    const fgeo = new THREE.BufferGeometry();
    fgeo.setAttribute("position", new THREE.BufferAttribute(fpos, 3));
    S.add(
      new THREE.Points(
        fgeo,
        new THREE.PointsMaterial({
          color: 0xd9f4ff,
          size: 0.13,
          map: softTex,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
        }),
      ),
    );
    this.animFns.push((dt, t) => {
      lotus.rotation.y += dt * 0.8;
      lotus.position.y = 2.75 + Math.sin(t * 1.5) * 0.06;
      const p = fgeo.attributes.position;
      for (let i = 0; i < FN; i++) {
        const v = fv[i];
        v.y -= 8.5 * dt;
        p.setXYZ(
          i,
          p.getX(i) + v.x * dt,
          Math.max(0.68, p.getY(i) + v.y * dt),
          p.getZ(i) + v.z * dt,
        );
        if (p.getY(i) <= 0.7) {
          p.setXYZ(i, rand(-0.2, 0.2), 2.15, rand(-0.2, 0.2));
          v.x = rand(-0.6, 0.6);
          v.y = rand(3, 4.3);
          v.z = rand(-0.6, 0.6);
        }
      }
      p.needsUpdate = true;
    });
    const pavGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.07, 7);
    const pavA = M.std(0xdbc9a4, { r: 0.95 }),
      pavB = M.std(0xcbb793, { r: 0.95 });
    const path = (x1, z1, x2, z2, b) => {
      const mx = (x1 + x2) / 2,
        mz = (z1 + z2) / 2,
        dx = x2 - x1,
        dz = z2 - z1,
        l = Math.hypot(dx, dz);
      const cx = mx - (dz / l) * b,
        cz = mz + (dx / l) * b,
        nn = Math.max(8, Math.round(l / 1.15));
      for (let i = 0; i <= nn; i++) {
        const t = i / nn,
          it = 1 - t;
        const p = new THREE.Mesh(pavGeo, i % 2 ? pavA : pavB);
        p.position.set(
          it * it * x1 + 2 * it * t * cx + t * t * x2,
          0.035,
          it * it * z1 + 2 * it * t * cz + t * t * z2,
        );
        p.scale.setScalar(rand(0.85, 1.1));
        p.rotation.y = rand(0, 6);
        p.receiveShadow = true;
        S.add(p);
      }
    };
    const link = (x, z, b) => {
      const l = Math.hypot(x, z),
        ux = x / l,
        uz = z / l;
      path(ux * 8.6, uz * 8.6, x - ux * 2.8, z - uz * 2.8, b);
    };
    link(-17, -15, 2.5);
    link(17, -11, 2);
    link(-19, 13, 2);
    link(16, 16, 2);
    path(0, 8.6, 0, 31, 1.2);
    this.gSph = new THREE.SphereGeometry(1, 10, 8);
    const trunkMat = M.std(0x8a5f3d, { r: 0.95 });
    const canopyMats = [0x4fbf5e, 0x63cf6f, 0x3fae57].map((c) =>
      M.std(c, { r: 0.9 }),
    );
    const pinkMat = M.std(0xffa9d0, { r: 0.9 });
    const sways = [];
    const addTree = (x, z, s, pink) => {
      const g = new THREE.Group();
      const trunk = cyl(0.16 * s, 0.24 * s, 1.7 * s, trunkMat, 7);
      trunk.position.y = 0.85 * s;
      trunk.castShadow = true;
      const cG = new THREE.Group(),
        m = pink ? pinkMat : canopyMats[randi(0, 2)];
      for (let i = 0, n2 = pink ? 4 : 3; i < n2; i++) {
        const b = new THREE.Mesh(this.gSph, m);
        b.scale.setScalar(rand(0.8, 1.25) * s);
        b.position.set(
          rand(-0.5, 0.5) * s,
          1.7 * s + rand(0, 0.7) * s,
          rand(-0.5, 0.5) * s,
        );
        b.castShadow = true;
        cG.add(b);
      }
      g.add(trunk, cG);
      g.position.set(x, 0, z);
      S.add(g);
      sways.push({ g: cG, ph: rand(0, 6) });
      this.cCol(x, z, 0.42 * s + 0.1);
    };
    let tn = 0;
    guard = 0;
    while (tn < 15 && guard++ < 600) {
      const a = rand(0, 6.283),
        r = rand(11, 42),
        x = Math.cos(a) * r,
        z = Math.sin(a) * r;
      if (!free(x, z)) continue;
      addTree(x, z, rand(0.9, 1.5), Math.random() < 0.25);
      tn++;
    }
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2 + rand(-0.1, 0.1);
      addTree(
        Math.cos(a) * rand(41, 44),
        Math.sin(a) * rand(41, 44),
        rand(1.1, 1.6),
        Math.random() < 0.3,
      );
    }
    addTree(-17, -15, 2.7, true);
    const rim = new THREE.Mesh(
      new THREE.RingGeometry(6.8, 7.8, 40),
      M.std(0xe3d3a8, { r: 0.95 }),
    );
    rim.rotation.x = -Math.PI / 2;
    rim.position.set(17, 0.02, -11);
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(6.8, 40),
      M.std(0x4fc4e8, { r: 0.15 }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(17, 0.05, -11);
    S.add(rim, water);
    this.cCol(17, -11, 8.2);
    const ripples = [];
    for (let i = 0; i < 3; i++) {
      const r = new THREE.Mesh(
        new THREE.RingGeometry(0.45, 0.52, 32),
        M.bas(0xe6faff, { transparent: true, opacity: 0.5 }),
      );
      r.rotation.x = -Math.PI / 2;
      r.position.set(17 + rand(-4, 4), 0.08, -11 + rand(-4, 4));
      S.add(r);
      ripples.push({ m: r, t: i * 0.5 });
    }
    const ducks = [];
    const mkDuck = () => {
      const g = new THREE.Group();
      const body = sph(0.3, M.std(0xf6f3ec, { r: 0.8 }), 10);
      body.scale.set(1, 0.8, 1.35);
      const head = sph(0.17, M.std(0xf6f3ec, { r: 0.8 }), 8);
      head.position.set(0, 0.28, 0.34);
      const beak = cyl(0.02, 0.06, 0.16, M.bas(0xff9d3c), 6);
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 0.26, 0.5);
      g.add(body, head, beak);
      return g;
    };
    for (let i = 0; i < 3; i++) {
      const d = mkDuck();
      S.add(d);
      ducks.push({
        g: d,
        a: rand(0, 6),
        r: rand(2.5, 4.5),
        sp: rand(0.22, 0.4),
      });
    }
    this.animFns.push((dt, t) => {
      for (const r of ripples) {
        r.t += dt;
        const k = (r.t % 1.5) / 1.5;
        r.m.scale.setScalar(0.5 + k * 4.5);
        r.m.material.opacity = 0.5 * (1 - k);
      }
      for (const d of ducks) {
        d.a += d.sp * dt;
        d.g.position.set(
          17 + Math.cos(d.a) * d.r,
          0.07,
          -11 + Math.sin(d.a) * d.r,
        );
        d.g.rotation.y = Math.atan2(-Math.sin(d.a), Math.cos(d.a));
      }
    });
    const gz = new THREE.Group();
    gz.position.set(-19, 0, 13);
    const fl = cyl(2.9, 3.1, 0.16, M.std(0xdcc9a4, { r: 0.9 }), 12);
    fl.position.y = 0.08;
    fl.receiveShadow = true;
    gz.add(fl);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const post = cyl(0.13, 0.13, 2.7, M.std(0x9a7350, { r: 0.85 }), 8);
      post.position.set(Math.cos(a) * 2.3, 1.55, Math.sin(a) * 2.3);
      post.castShadow = true;
      gz.add(post);
      this.cCol(-19 + Math.cos(a) * 2.3, 13 + Math.sin(a) * 2.3, 0.2);
    }
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(3.5, 1.7, 6),
      M.std(0xd9698a, { r: 0.8 }),
    );
    roof.position.y = 3.6;
    roof.castShadow = true;
    const fin = sph(0.22, M.std(0xffd166, { r: 0.5 }), 10);
    fin.position.y = 4.6;
    gz.add(roof, fin);
    S.add(gz);
    const fieldC = new THREE.Mesh(
      new THREE.CircleGeometry(7.8, 32),
      M.std(0x63c968, { r: 1 }),
    );
    fieldC.rotation.x = -Math.PI / 2;
    fieldC.position.set(16, 0.025, 16);
    S.add(fieldC);
    const FN2 = 240,
      stems = new THREE.InstancedMesh(
        new THREE.CylinderGeometry(0.02, 0.03, 0.5, 5),
        M.lam(0x3f9e4e),
        FN2,
      );
    const bloss = new THREE.InstancedMesh(
      this.gSph,
      M.lam(0xffffff),
      FN2,
    );
    const fcols = [
      "#ff5f7e",
      "#ffd166",
      "#ff8fa3",
      "#ffffff",
      "#ff9d5c",
    ].map((c) => new THREE.Color(c));
    for (let i = 0; i < FN2; i++) {
      const a = rand(0, 6.28),
        r = Math.sqrt(Math.random()) * 7.2;
      const x = 16 + Math.cos(a) * r,
        z = 16 + Math.sin(a) * r;
      dummy.position.set(x, 0.25, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      stems.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, 0.56, z);
      dummy.scale.setScalar(0.12);
      dummy.updateMatrix();
      bloss.setMatrixAt(i, dummy.matrix);
      bloss.setColorAt(i, fcols[randi(0, 4)]);
    }
    S.add(stems, bloss);
    const bench = (x, z) => {
      const g = new THREE.Group();
      const seat = box(1.7, 0.09, 0.55, M.std(0x9a6f4b, { r: 0.85 }));
      seat.position.y = 0.52;
      seat.castShadow = true;
      const l1 = box(0.08, 0.5, 0.5, M.std(0x5a4632, { r: 0.9 }));
      l1.position.set(-0.7, 0.26, 0);
      const l2 = l1.clone();
      l2.position.x = 0.7;
      const back = box(1.7, 0.5, 0.07, M.std(0x9a6f4b, { r: 0.85 }));
      back.position.set(0, 0.85, -0.28);
      back.castShadow = true;
      g.add(seat, l1, l2, back);
      g.position.set(x, 0, z);
      g.rotation.y = Math.atan2(-x, -z);
      S.add(g);
      this.cCol(x, z, 0.95);
    };
    bench(4.6, 9.6);
    bench(-9.2, -3.4);
    bench(10, -7.6);
    const lamp = (x, z) => {
      const g = new THREE.Group();
      const post = cyl(
        0.06,
        0.09,
        2.7,
        M.std(0x46505a, { r: 0.6, m: 0.3 }),
        8,
      );
      post.position.y = 1.35;
      post.castShadow = true;
      const head = sph(0.24, M.bas(0xfff0c2), 10);
      head.position.y = 2.8;
      g.add(post, head);
      g.position.set(x, 0, z);
      S.add(g);
      this.cCol(x, z, 0.24);
    };
    [
      [2.2, 15.5],
      [-5.5, -9.5],
      [12, 4.5],
      [-12, 8.5],
      [15.5, 10.5],
      [-13.5, -12],
    ].forEach((p) => lamp(p[0], p[1]));
    const wGeoR = new THREE.PlaneGeometry(0.24, 0.17);
    wGeoR.translate(0.12, 0, 0);
    const wGeoL = new THREE.PlaneGeometry(0.24, 0.17);
    wGeoL.translate(-0.12, 0, 0);
    const bcols = [0xff5f7e, 0xffc24d, 0x4ddac2, 0xff7bac];
    const flies = [];
    for (let i = 0; i < 7; i++) {
      const g = new THREE.Group(),
        cm = M.bas(bcols[i % 4], { side: THREE.DoubleSide });
      const wl = new THREE.Mesh(wGeoL, cm),
        wr = new THREE.Mesh(wGeoR, cm);
      g.add(wl, wr, box(0.04, 0.04, 0.26, M.std(0x3a3230)));
      S.add(g);
      flies.push({
        g,
        wl,
        wr,
        cx: Math.random() < 0.6 ? 16 : 0,
        cz: Math.random() < 0.6 ? 16 : 0,
        r: rand(1.5, 4),
        sp: rand(0.5, 0.9),
        ph: rand(0, 6),
      });
    }
    const PN = 110,
      petals = new THREE.InstancedMesh(
        new THREE.PlaneGeometry(0.18, 0.13),
        M.bas(0xffb3d5, { side: THREE.DoubleSide }),
        PN,
      );
    const pd = [];
    for (let i = 0; i < PN; i++) {
      const nearSakura = Math.random() < 0.7;
      const a = rand(0, 6.28),
        r = nearSakura ? rand(1, 9) : rand(0, 7);
      const cx = nearSakura ? -17 : 0,
        cz = nearSakura ? -15 : 0;
      pd.push({
        x: cx + Math.cos(a) * r,
        y: rand(0.5, 6),
        z: cz + Math.sin(a) * r,
        fs: rand(0.5, 0.9),
        ph: rand(0, 6),
        rs: rand(1, 3),
      });
    }
    S.add(petals);
    this.animFns.push((dt, t) => {
      for (const f of flies) {
        const a = t * f.sp + f.ph;
        f.g.position.set(
          f.cx + Math.cos(a) * f.r,
          1.1 + Math.sin(t * 1.7 + f.ph) * 0.5,
          f.cz + Math.sin(a) * f.r,
        );
        f.g.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a));
        const fl2 = Math.sin(t * 13 + f.ph) * 0.85;
        f.wl.rotation.y = fl2;
        f.wr.rotation.y = -fl2;
      }
      for (let i = 0; i < PN; i++) {
        const p = pd[i];
        p.y -= p.fs * dt;
        p.x += Math.sin(t * 1.2 + p.ph) * dt * 0.7;
        if (p.y < 0.05) p.y = rand(4, 6.5);
        dummy.position.set(p.x, p.y, p.z);
        dummy.rotation.set(t * p.rs, p.ph, t * p.rs * 0.7);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        petals.setMatrixAt(i, dummy.matrix);
      }
      petals.instanceMatrix.needsUpdate = true;
      for (const s of sways) {
        s.g.rotation.z = Math.sin(t * 1.1 + s.ph) * 0.035;
        s.g.rotation.x = Math.sin(t * 0.9 + s.ph) * 0.02;
      }
    });
    const AC = WORLDS.park.hex;
    this.landmark({
      id: "fountain",
      x: 0,
      z: 0,
      r: 4.8,
      color: AC,
      icon: "water_drop",
      title: "Air Mancur Seroja",
      fact: "Patung lotus di puncaknya berputar pelan sepanjang hari — katanya mengikuti arah matahari.",
    });
    this.landmark({
      id: "sakura",
      x: -17,
      z: -15,
      r: 4.6,
      color: AC,
      icon: "park",
      title: "Pohon Seroja Tua",
      fact: "Ditanam saat taman pertama kali dibuka. Setiap musim, kelopaknya turun seperti salju merah muda.",
    });
    this.landmark({
      id: "pond",
      x: 17,
      z: -11,
      r: 9.6,
      color: AC,
      icon: "waves",
      title: "Danau Cermin",
      fact: "Bebek-bebek di danau ini punya jadwal sendiri — mereka berputar searah jarum jam sepanjang hari.",
    });
    this.landmark({
      id: "gazebo",
      x: -19,
      z: 13,
      r: 3.9,
      color: AC,
      icon: "deck",
      title: "Gazebo Angin",
      fact: "Tempat terbaik berlindung dari panas. Desain atapnya katanya membuat angin terasa dua kali lebih sejuk.",
    });
    this.landmark({
      id: "flowers",
      x: 16,
      z: 16,
      r: 9,
      color: AC,
      icon: "local_florist",
      title: "Ladang Bunga",
      fact: "Lebih dari dua ratus bunga dari lima warna. Kupu-kupu taman selalu kembali ke sini menjelang siang.",
    });
    this.spawnNPC(6, 0, 6, 16);
    this.spawnNPC(2, -19, 13, 1.2, { idle: true });
    this.spawnPigeons(3, 0, 6, 6);
  }
  clampBounds(p) {
    const r = Math.hypot(p.x, p.z);
    if (r > 45) {
      p.x *= 45 / r;
      p.z *= 45 / r;
    }
  }
}

/* ================================================================
   DUNIA 2 — AREA SERVER
================================================================ */
