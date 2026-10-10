/* ============================================================
 * js/worlds/funfair.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { sfx } from "../core/audio.js";
import { M, PolyCurve, box, camera, cyl, makeBurst, mkSign, mkSprite, skyDome, sph } from "../core/engine.js";
import { input } from "../core/input.js";
import { canvas, snackbar } from "../core/ui.js";
import { clamp, damp, rand, randi } from "../core/util.js";
import { WORLDS } from "../core/worlds_meta.js";
import { exitRide, updateRideHUD } from "../game/rides.js";
import { World } from "../game/world.js";

export const LAP_NAMES = [
  "LAP 1 · Pemanasan",
  "LAP 2 · Mulai ngebut",
  "LAP 3 · Makin kencang",
  "LAP 4 · Kencang sekali!",
  "LAP 5 · TOP SPEED!",
  "LAP 6 · SUPERSONIC!!",
];
export class FunWorld extends World {
  constructor() {
    super("funfair");
    this.spawn = { x: 0, z: 50, yaw: 0 };
    this.fovBase = 72;
    this.rideTmp = new THREE.Object3D();
    this.m4 = new THREE.Matrix4();
    const S = this.scene;
    S.background = new THREE.Color(0x3a1a4a);
    S.fog = new THREE.Fog(0xd88bc0, 120, 360);
    S.add(skyDome(["#2a1a4a", "#7a2f6e", "#ff5f8a", "#ffc46b"]));
    S.add(new THREE.HemisphereLight(0xffd9ec, 0x3a2a4a, 0.85));
    const dl = new THREE.DirectionalLight(0xffe0c0, 1.0);
    dl.position.set(-40, 60, 20);
    S.add(dl);
    mkSprite(S, 0xffd9a8, 30, [-60, 40, -80]);
    this.clouds = [];
    for (let i = 0; i < 7; i++)
      this.clouds.push(
        mkSprite(
          S,
          0xffc4d8,
          rand(20, 40),
          [rand(-130, 130), rand(35, 60), rand(-130, 130)],
          { opacity: rand(0.4, 0.7) },
        ),
      );
    this.animFns.push((dt) => {
      for (const c of this.clouds) {
        c.position.x += dt * 1.2;
        if (c.position.x > 140) c.position.x = -140;
      }
    });
    const field = new THREE.Mesh(
      new THREE.PlaneGeometry(520, 520),
      M.std(0x4aa35e, { r: 1 }),
    );
    field.rotation.x = -Math.PI / 2;
    S.add(field);
    const pc = document.createElement("canvas");
    pc.width = pc.height = 512;
    const pctx = pc.getContext("2d");
    pctx.fillStyle = "#f5e9d8";
    pctx.fillRect(0, 0, 512, 512);
    const pieCols = [
      "#ff9ec7",
      "#8fe0c8",
      "#ffd166",
      "#9db8ff",
      "#ffa98f",
      "#c9a5f0",
    ];
    for (let i = 0; i < 12; i++) {
      pctx.fillStyle = pieCols[i % 6];
      pctx.beginPath();
      pctx.moveTo(256, 256);
      pctx.arc(
        256,
        256,
        252,
        (i / 12) * Math.PI * 2,
        ((i + 1) / 12) * Math.PI * 2,
      );
      pctx.fill();
    }
    pctx.strokeStyle = "#fff5ea";
    pctx.lineWidth = 10;
    pctx.beginPath();
    pctx.arc(256, 256, 180, 0, 7);
    pctx.stroke();
    pctx.fillStyle = "#ff6fb5";
    pctx.beginPath();
    pctx.arc(256, 256, 34, 0, 7);
    pctx.fill();
    const ptex = new THREE.CanvasTexture(pc);
    ptex.colorSpace = THREE.SRGBColorSpace;
    const plaza = new THREE.Mesh(
      new THREE.CircleGeometry(26, 48),
      new THREE.MeshStandardMaterial({ map: ptex, roughness: 0.9 }),
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.03;
    S.add(plaza);
    const archMat = M.std(0x8a4a6e, { r: 0.7 });
    const p1 = box(1, 7, 1, archMat);
    p1.position.set(-4.5, 3.5, 44);
    const p2 = p1.clone();
    p2.position.x = 4.5;
    const beam = box(10.5, 1.3, 1.2, M.std(0xff6fb5, { r: 0.6 }));
    beam.position.set(0, 7.4, 44);
    const archSign = mkSign("PRISMA LAND", "#ff6fb5", 9, 2.1);
    archSign.position.set(0, 7.4, 44.7);
    S.add(p1, p2, beam, archSign);
    this.rCol(-4.5, 44, 0.6, 0.6);
    this.rCol(4.5, 44, 0.6, 0.6);
    [
      [-4.5, 44],
      [4.5, 44],
    ].forEach(([x, z]) => {
      const f = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 0.8, 6),
        M.bas(0xffc24d),
      );
      f.position.set(x, 8.2, z);
      S.add(f);
    });
    const fenceMat = M.std(0x6e5a7a, { r: 0.8 });
    for (let i = 0; i < 36; i++) {
      const th = (i / 36) * Math.PI * 2;
      if (Math.abs(Math.atan2(Math.sin(th), Math.cos(th))) < 0.13)
        continue;
      const x = Math.cos(th) * 52,
        z = Math.sin(th) * 52;
      const post = cyl(0.07, 0.09, 1.25, fenceMat, 6);
      post.position.set(x, 0.62, z);
      S.add(post);
      this.cCol(x, z, 0.16);
      const nx = ((i + 1) / 36) * Math.PI * 2;
      if (Math.abs(Math.atan2(Math.sin(nx), Math.cos(nx))) < 0.13)
        continue;
      const mid = (th + nx) / 2,
        mx = Math.cos(mid) * 52,
        mz = Math.sin(mid) * 52;
      for (const h of [0.55, 1.05]) {
        const seg = box(9.1, 0.06, 0.06, fenceMat);
        seg.position.set(mx, h, mz);
        seg.rotation.y = -mid - Math.PI / 2;
        S.add(seg);
      }
    }
    [[0.13], [-0.13]].forEach(([a]) => {
      const gp = box(0.45, 1.9, 0.45, M.std(0xff6fb5, { r: 0.6 }));
      gp.position.set(Math.cos(a) * 52, 0.95, Math.sin(a) * 52);
      S.add(gp);
    });
    for (let i = 0; i < 10; i++) {
      const a = rand(0, 6.28);
      if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.4) continue;
      const r = rand(44, 50),
        x = Math.cos(a) * r,
        z = Math.sin(a) * r;
      const tr = cyl(0.16, 0.22, 1.6, M.std(0x7a5a3d), 7);
      tr.position.set(x, 0.8, z);
      const cn = sph(1.3, M.std(0x4aa85e, { r: 0.95 }), 9);
      cn.position.set(x, 2.6, z);
      S.add(tr, cn);
      this.cCol(x, z, 0.5);
    }
    /* ===== KOMEDI PUTAR ===== */
    this.carAng = 0;
    this.carX = 0;
    this.carZ = -6;
    const CX = 0,
      CZ = -6;
    const carGroup = new THREE.Group();
    carGroup.position.set(CX, 0, CZ);
    S.add(carGroup);
    const basePlat = cyl(
      4.8,
      5.1,
      0.45,
      M.std(0xe8dcc8, { r: 0.85 }),
      24,
    );
    basePlat.position.set(CX, 0.22, CZ);
    S.add(basePlat);
    const cc = document.createElement("canvas");
    cc.width = 256;
    cc.height = 64;
    const ccx = cc.getContext("2d");
    for (let i = 0; i < 16; i++) {
      ccx.fillStyle = i % 2 ? "#ff8fb8" : "#fff3ea";
      ccx.fillRect(i * 16, 0, 16, 64);
    }
    const ctex = new THREE.CanvasTexture(cc);
    ctex.colorSpace = THREE.SRGBColorSpace;
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(5.1, 2.2, 24),
      new THREE.MeshStandardMaterial({ map: ctex, roughness: 0.8 }),
    );
    roof.position.y = 5.6;
    carGroup.add(roof);
    const hub = cyl(
      0.2,
      0.24,
      3.2,
      M.std(0xd9a84d, { r: 0.5, m: 0.5 }),
      10,
    );
    hub.position.y = 3.4;
    carGroup.add(hub);
    const finS = sph(0.28, M.bas(0xffc24d), 10);
    finS.position.y = 6.9;
    carGroup.add(finS);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const l = sph(0.08, M.bas(0xfff0c2), 6);
      l.position.set(Math.cos(a) * 4.7, 4.62, Math.sin(a) * 4.7);
      carGroup.add(l);
    }
    const horseCols = [
      0xf6f1ea, 0xff9ec7, 0xf6f1ea, 0x9db8ff, 0xf6f1ea, 0x8fe0c8,
      0xf6f1ea, 0xffc4a0,
    ];
    this.horses = [];
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4,
        g = new THREE.Group();
      const pole = cyl(
        0.05,
        0.05,
        3.5,
        M.std(0xc9b8a8, { r: 0.5, m: 0.4 }),
        6,
      );
      pole.position.y = 1.75;
      const body = box(0.34, 0.34, 1.05, M.std(horseCols[k], { r: 0.7 }));
      body.position.y = 1.05;
      const head = box(0.22, 0.26, 0.34, M.std(horseCols[k], { r: 0.7 }));
      head.position.set(0, 1.32, -0.6);
      head.rotation.x = 0.35;
      const mane = box(0.06, 0.2, 0.3, M.bas(0xffc24d));
      mane.position.set(0, 1.42, -0.48);
      const saddle = box(
        0.3,
        0.07,
        0.34,
        M.bas([0xff5f7e, 0x4ddac2, 0xffc24d, 0x7ce3a0][k % 4]),
      );
      saddle.position.set(0, 1.26, 0.12);
      g.add(pole, body, head, mane, saddle);
      if (k % 2 === 0) {
        const kid = new THREE.Group();
        const kb = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.11, 0.24, 3, 8),
          M.std([0xff7bac, 0x4ddac2, 0xffc24d][(k / 2) | 0], { r: 0.85 }),
        );
        kb.position.y = 0.32;
        const kh = sph(0.1, M.lam(0xf2c9a0), 8);
        kh.position.y = 0.58;
        kid.add(kb, kh);
        kid.position.set(0, 1.28, 0.12);
        g.add(kid);
      }
      g.position.set(Math.cos(a) * 3.1, 0, Math.sin(a) * 3.1);
      carGroup.add(g);
      this.horses.push(g);
    }
    this.animFns.push((dt, t) => {
      this.carAng += dt * 0.5;
      carGroup.rotation.y = this.carAng;
      this.horses.forEach((h, k) => {
        h.position.y = 0.15 + Math.sin(t * 2.4 + k) * 0.3;
      });
    });
    this.cCol(CX, CZ, 5.1);
    /* ===== BIANGLALA ===== */
    this.wheelAng = 0;
    const WX = 30,
      WZ = -18,
      HUB = 12.5,
      WR = 9.5;
    this.wheelX = WX;
    this.wheelZ = WZ;
    this.wheelY = HUB;
    this.wheelR = WR;
    const wGroup = new THREE.Group();
    wGroup.position.set(WX, HUB, WZ);
    S.add(wGroup);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(WR, 0.22, 10, 48),
      M.std(0xff6fb5, { r: 0.5 }),
    );
    wGroup.add(rim);
    const rimIn = new THREE.Mesh(
      new THREE.TorusGeometry(WR * 0.55, 0.12, 8, 36),
      M.std(0xffc24d, { r: 0.5 }),
    );
    wGroup.add(rimIn);
    for (let i = 0; i < 8; i++) {
      const sp = cyl(0.05, 0.05, WR * 2, M.std(0xf0eaf4, { r: 0.5 }), 6);
      sp.rotation.z = (i * Math.PI) / 8;
      wGroup.add(sp);
    }
    const wLegMat = M.std(0x5a4a6e, { r: 0.7 });
    for (const sz of [-1.5, 1.5])
      for (const sx of [1, -1]) {
        const leg = cyl(0.16, 0.22, 13.3, wLegMat, 8);
        leg.position.set(WX + sx * 2.25, 6.25, WZ + sz);
        leg.rotation.z = sx * 0.346;
        S.add(leg);
      }
    const axle = cyl(
      0.14,
      0.14,
      4.6,
      M.std(0x8a7a9a, { r: 0.4, m: 0.5 }),
      10,
    );
    axle.rotation.x = Math.PI / 2;
    axle.position.set(WX, HUB, WZ);
    S.add(axle);
    this.gondolas = [];
    const gcols = [
      0xff5f7e, 0x4ddac2, 0xffc24d, 0x7ce3a0, 0x9d8bff, 0xff8a5c,
      0xf0eaf4, 0x5fb0ff, 0xff7bac, 0x8fe0c8,
    ];
    for (let i = 0; i < 10; i++) {
      const g = new THREE.Group();
      const cabin = box(1.15, 1, 1.35, M.std(gcols[i], { r: 0.6 }));
      cabin.position.y = -0.35;
      const bar = box(0.08, 0.6, 0.08, M.std(0x5a4a6e));
      bar.position.y = 0.2;
      g.add(cabin, bar);
      S.add(g);
      this.gondolas.push(g);
    }
    this.animFns.push((dt) => {
      this.wheelAng += dt * 0.16;
      wGroup.rotation.z = this.wheelAng;
      this.gondolas.forEach((g, i) => {
        const a = this.wheelAng + (i * Math.PI) / 5;
        g.position.set(
          WX + Math.cos(a) * WR,
          HUB + Math.sin(a) * WR - 0.8,
          WZ,
        );
      });
    });
    this.cCol(WX - 4.2, WZ, 0.5);
    this.cCol(WX + 4.2, WZ, 0.5);
    /* ===== PANGGUNG ===== */
    const stage = new THREE.Group();
    stage.position.set(-16, 0, 8);
    stage.rotation.y = Math.atan2(16, -8);
    S.add(stage);
    const sPlat = box(7, 0.5, 4.5, M.std(0x6e5a7a, { r: 0.85 }));
    sPlat.position.y = 0.25;
    stage.add(sPlat);
    const sWall = box(7, 3, 0.3, M.std(0x3d2f4a, { r: 0.85 }));
    sWall.position.set(0, 1.9, -2.1);
    stage.add(sWall);
    const sRoof = box(7.5, 0.25, 5.2, M.std(0xff6fb5, { r: 0.6 }));
    sRoof.position.y = 3.5;
    stage.add(sRoof);
    for (const sx of [-3.6, 3.6]) {
      const sp = box(0.7, 1.3, 0.7, M.std(0x2a2233, { r: 0.8 }));
      sp.position.set(sx, 0.65, 0.9);
      stage.add(sp);
    }
    const spotPivots = [];
    for (const [sx, col] of [
      [-2.2, 0x4ddac2],
      [2.2, 0xff6fb5],
    ]) {
      const piv = new THREE.Group();
      piv.position.set(sx, 3.2, -1.4);
      stage.add(piv);
      const beam2 = new THREE.Mesh(
        new THREE.ConeGeometry(0.9, 9, 12, 1, true),
        M.bas(col, {
          transparent: true,
          opacity: 0.16,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      beam2.position.y = 4.5;
      piv.add(beam2);
      spotPivots.push({ piv, ph: rand(0, 6) });
    }
    this.animFns.push((dt, t) => {
      for (const s of spotPivots) s.piv.rotation.y = t * 0.9 + s.ph;
    });
    this.rCol(-16, 8, 3.6, 2.4);
    /* ===== KIOS ===== */
    const stall = (x, z, text, c) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = Math.atan2(-x, -z);
      S.add(g);
      const body = box(2.6, 2.2, 1.6, M.std(0x6e5a7a, { r: 0.85 }));
      body.position.y = 1.1;
      g.add(body);
      const counter = box(2.9, 0.12, 0.7, M.std(0x9a7350, { r: 0.85 }));
      counter.position.set(0, 1.05, 0.95);
      g.add(counter);
      const roof = box(3.1, 0.16, 2.5, M.std(c, { r: 0.8 }));
      roof.position.y = 2.55;
      roof.rotation.x = 0.12;
      g.add(roof);
      const sign = mkSign(text, c, 2.3, 0.8);
      sign.position.set(0, 2.1, 0.85);
      g.add(sign);
      this.rCol(x, z, 1.6, 1.1);
    };
    stall(13, 11, "POPCORN", "#ffc24d");
    stall(17, 5, "ES KRIM", "#4ddac2");
    stall(11, 2, "DONAT", "#ff8a5c");
    const bc = new THREE.Group();
    bc.position.set(-9, 0, -17);
    S.add(bc);
    const bBase = box(1.2, 0.9, 0.8, M.std(0x8a6a4a, { r: 0.85 }));
    bBase.position.y = 0.45;
    bc.add(bBase);
    const bPole = cyl(0.04, 0.04, 3, M.std(0x5a4a6e), 6);
    bPole.position.y = 2;
    bc.add(bPole);
    const bcols2 = [
      0xff5f7e, 0x4ddac2, 0xffc24d, 0x9d8bff, 0x7ce3a0, 0xff8a5c,
    ];
    this.balloons = [];
    for (let i = 0; i < 6; i++) {
      const b = sph(0.28, M.std(bcols2[i], { r: 0.4 }), 10);
      b.position.set(
        rand(-0.3, 0.3),
        3.3 + rand(0, 0.5),
        rand(-0.3, 0.3),
      );
      bc.add(b);
      this.balloons.push({ m: b, ph: rand(0, 6) });
    }
    this.animFns.push((dt, t) => {
      for (const b of this.balloons)
        b.m.position.y = 3.35 + Math.sin(t * 1.3 + b.ph) * 0.14;
    });
    this.cCol(-9, -17, 0.9);
    const tb = new THREE.Group();
    tb.position.set(6, 0, 37);
    tb.rotation.y = Math.PI;
    S.add(tb);
    const tbBody = box(1.7, 2.3, 1.5, M.std(0xff9ec7, { r: 0.8 }));
    tbBody.position.y = 1.15;
    tb.add(tbBody);
    const tbRoof = box(2.1, 0.2, 1.9, M.std(0xff6fb5, { r: 0.7 }));
    tbRoof.position.y = 2.45;
    tb.add(tbRoof);
    const tbSign = mkSign("TIKET", "#ffc24d", 1.5, 0.6);
    tbSign.position.set(0, 1.5, 0.78);
    tb.add(tbSign);
    this.rCol(6, 37, 1, 1);
    /* lampu gantung antar tiang plaza */
    const polePts = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2,
        x = Math.cos(a) * 21,
        z = Math.sin(a) * 21;
      const pole = cyl(0.06, 0.08, 4, M.std(0x5a4a6e, { r: 0.7 }), 8);
      pole.position.set(x, 2, z);
      S.add(pole);
      const cap = sph(0.14, M.bas(0xfff0c2), 8);
      cap.position.set(x, 4.05, z);
      S.add(cap);
      this.cCol(x, z, 0.15);
      polePts.push(new THREE.Vector3(x, 3.9, z));
    }
    const bulbCols = [0xffd9a8, 0xffb3d5, 0xa5f0e4, 0xfff3d6];
    polePts.forEach((q0, i) => {
      const q1 = polePts[(i + 1) % 6],
        mid = q0.clone().add(q1).multiplyScalar(0.5);
      mid.y = 3.0;
      for (let j = 0; j < 7; j++) {
        const t = (j + 1) / 8,
          it = 1 - t;
        const pos = new THREE.Vector3(
          it * it * q0.x + 2 * it * t * mid.x + t * t * q1.x,
          it * it * q0.y + 2 * it * t * mid.y + t * t * q1.y,
          it * it * q0.z + 2 * it * t * mid.z + t * t * q1.z,
        );
        const b = sph(0.075, M.bas(bulbCols[(i + j) % 4]), 6);
        b.position.copy(pos);
        S.add(b);
      }
    });
    /* ===== PROMENADE KE TIMUR ===== */
    const pathBox = box(70, 0.05, 4.4, M.std(0x8f7f9e, { r: 0.95 }));
    pathBox.position.set(69, 0.04, 0);
    S.add(pathBox);
    for (let x = 36; x <= 102; x += 11)
      for (const sz of [-3.4, 3.4]) {
        const post = cyl(0.06, 0.08, 3, M.std(0x5a4a6e, { r: 0.7 }), 8);
        post.position.set(x, 1.5, sz);
        const head = sph(0.18, M.bas(0xffd9a8), 8);
        head.position.set(x, 3.1, sz);
        S.add(post, head);
        this.cCol(x, sz, 0.22);
      }
    this.buildCoaster(S);
    const p0 = this.coaster.curve.getPointAt(0);
    const stX = p0.x - 3.3;
    const deck2 = box(6, 0.14, 13, M.std(0x6e5a7a, { r: 0.85 }));
    deck2.position.set(stX, 0.07, p0.z);
    S.add(deck2);
    for (const sz of [-5.6, 5.6])
      for (const sx of [-2.6, 2.6]) {
        const post = cyl(0.09, 0.09, 4.4, M.std(0x5a4a6e, { r: 0.7 }), 8);
        post.position.set(stX + sx, 2.3, p0.z + sz);
        S.add(post);
      }
    const roofS = box(6.6, 0.25, 13.6, M.std(0xff6fb5, { r: 0.6 }));
    roofS.position.set(stX, 4.6, p0.z);
    S.add(roofS);
    const stSign = mkSign("PRISMA CYCLONE", "#ff6fb5", 6.4, 1.6);
    stSign.position.set(stX, 5.5, p0.z);
    stSign.rotation.y = -Math.PI / 2;
    S.add(stSign);
    for (const sx of [-1.8, 1.8]) {
      const rail2 = box(0.08, 0.65, 11, M.std(0xc9b8a8, { r: 0.7 }));
      rail2.position.set(stX + sx, 0.85, p0.z);
      S.add(rail2);
    }
    this.rides = [
      {
        type: "carousel",
        x: CX,
        z: CZ,
        r: 6.4,
        label: "Komedi Putar",
        icon: "toys",
        exit: { x: 6.2, z: -6, yaw: 2.3 },
      },
      {
        type: "wheel",
        x: WX,
        z: WZ,
        r: 7.4,
        label: "Bianglala Prisma",
        icon: "donut_large",
        exit: { x: 30, z: -6, yaw: Math.PI / 2 },
      },
      {
        type: "coaster",
        x: stX,
        z: p0.z,
        r: 4.5,
        label: "Prisma Cyclone",
        icon: "rocket_launch",
        exit: { x: 103, z: 0, yaw: Math.PI / 2 },
      },
    ];
    let fwT = 2.5;
    this.animFns.push((dt) => {
      fwT -= dt;
      if (fwT > 0) return;
      fwT = rand(3.5, 7);
      const col = [0xff6fb5, 0x4ddac2, 0xffc24d, 0x7ce3a0, 0x9d8bff][
        randi(0, 4)
      ];
      this.bursts.push(
        makeBurst(
          S,
          new THREE.Vector3(rand(-26, 26), rand(30, 52), rand(-26, 26)),
          col,
          { ring: false },
        ),
      );
    });
    this.spawnNPC(12, 0, 0, 20);
    this.spawnNPC(2, 98, 2, 1.4, { idle: true });
    const AC = WORLDS.funfair.hex;
    this.landmark({
      id: "arch",
      x: 0,
      z: 41,
      r: 5,
      color: AC,
      icon: "flag",
      title: "Gerbang Prisma Land",
      fact: "Pintu masuk tertua di taman ini. Benderanya diganti setiap musim, tapi tulisannya tidak pernah berubah: selamat datang.",
    });
    this.landmark({
      id: "carousel",
      x: -7.5,
      z: -6,
      r: 4.5,
      color: AC,
      icon: "toys",
      title: "Komedi Putar",
      fact: "Kuda-kuda kayunya diukir satu per satu. Konon kuda merah muda selalu paling cepat — hanya mitos, kata operatornya.",
    });
    this.landmark({
      id: "wheel",
      x: WX,
      z: WZ,
      r: 7,
      color: AC,
      icon: "donut_large",
      title: "Bianglala Prisma",
      fact: "Dari titik tertingginya, saat senja, kamu bisa melihat seluruh taman berubah warna dalam satu putaran.",
    });
    this.landmark({
      id: "coaster",
      x: 103,
      z: 0,
      r: 5,
      color: AC,
      icon: "rocket_launch",
      title: "Stasiun Prisma Cyclone",
      fact: "Wahana legendaris: enam putaran, lima menit, dan setiap putaran lebih cepat dari sebelumnya.",
    });
    this.landmark({
      id: "stage",
      x: -16,
      z: 13.5,
      r: 4.5,
      color: AC,
      icon: "celebration",
      title: "Panggung Kembang Api",
      fact: "Setiap malam kembang api ditembakkan dari sini — dan setiap meledak, kerumunan bersorak dalam bahasa yang sama.",
    });
  }
  buildCoaster(S) {
    const NP = 240,
      pts = [];
    const HP = [
      [0, 2],
      [0.05, 2],
      [0.13, 46],
      [0.16, 40],
      [0.22, 7],
      [0.27, 24],
      [0.31, 7],
      [0.38, 30],
      [0.44, 6],
      [0.5, 6],
      [0.53, 16],
      [0.56, 6],
      [0.59, 14],
      [0.63, 6],
      [0.7, 26],
      [0.74, 5],
      [0.78, 5],
      [0.83, 20],
      [0.86, 4],
      [0.92, 14],
      [0.96, 6],
      [1, 2],
    ];
    const ZS = [
      [0, 0.05, 4],
      [0.05, 0.13, 5.5],
      [0.13, 0.22, 32],
      [0.22, 0.31, 21],
      [0.31, 0.38, 18],
      [0.38, 0.44, 28],
      [0.44, 0.53, 25],
      [0.53, 0.63, 21],
      [0.63, 0.74, 5.5],
      [0.74, 0.78, 9],
      [0.78, 0.86, 28],
      [0.86, 0.92, 22],
      [0.92, 1, 8],
    ];
    const hAt = (t) => {
      for (let i = 1; i < HP.length; i++)
        if (t <= HP[i][0]) {
          const a = HP[i - 1],
            b = HP[i];
          return a[1] + ((b[1] - a[1]) * (t - a[0])) / (b[0] - a[0]);
        }
      return 2;
    };
    const zAt = (t) => {
      for (const z of ZS) if (t >= z[0] && t < z[1]) return z[2];
      return 10;
    };
    for (let i = 0; i < NP; i++) {
      const t = i / NP,
        th = t * Math.PI * 2;
      const R = 100 + 30 * Math.sin(th * 3) + 12 * Math.sin(th * 5 + 1.3);
      pts.push(
        new THREE.Vector3(Math.cos(th) * R, hAt(t), Math.sin(th) * R),
      );
    }
    const curve = new THREE.CatmullRomCurve3(
      pts,
      true,
      "catmullrom",
      0.5,
    );
    curve.arcLengthDivisions = 2000;
    const L = curve.getLength();
    const LU = 1200,
      lut = new Float32Array(LU + 1);
    for (let j = 0; j <= LU; j++) {
      let t = j / LU;
      try {
        t = curve.getUtoTmapping(j / LU);
      } catch (e) {}
      lut[j] = Math.max(3, zAt(((t % 1) + 1) % 1));
    }
    const mult = [1, 1.45, 2, 2.6, 3.2, 3.9],
      VMAX = 50;
    const lapTimeAt = (m) => {
      let T = 0;
      for (let j = 0; j < LU; j++) {
        const v = Math.min(lut[j] * m, VMAX);
        T += L / LU / Math.max(v, 0.5);
      }
      return T;
    };
    let K = 1;
    for (let it = 0; it < 48; it++) {
      let total = 0;
      for (const m of mult) total += lapTimeAt(K * m);
      if (Math.abs(total - 300) < 1.5) break;
      K *= 1 + (total / 300 - 1) * 0.6;
    }
    this.coaster = { curve, L, LU, lut, mult, K, VMAX };
    const UPV = new THREE.Vector3(0, 1, 0);
    this.cFrame = (u) => {
      u = ((u % 1) + 1) % 1;
      const p = curve.getPointAt(u),
        T = curve.getTangentAt(u).normalize();
      const right = new THREE.Vector3().crossVectors(T, UPV).normalize();
      const up = new THREE.Vector3().crossVectors(right, T).normalize();
      return { p, T, right, up };
    };
    const NS = 880,
      rl = [],
      rr = [];
    for (let i = 0; i < NS; i++) {
      const f = this.cFrame(i / NS);
      rl.push(f.p.clone().addScaledVector(f.right, -0.55));
      rr.push(f.p.clone().addScaledVector(f.right, 0.55));
    }
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xd8dde6,
      roughness: 0.35,
      metalness: 0.85,
    });
    S.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(new PolyCurve(rl), NS, 0.085, 5, true),
        railMat,
      ),
    );
    S.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(new PolyCurve(rr), NS, 0.085, 5, true),
        railMat,
      ),
    );
    const nT = Math.floor(L / 2.4);
    const ties = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1.5, 0.12, 0.55),
      M.std(0x4a3550, { r: 0.8 }),
      nT,
    );
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < nT; i++) {
      const f = this.cFrame((i + 0.5) / nT);
      m4.makeBasis(f.right, f.up, f.T);
      m4.setPosition(
        f.p.x - f.up.x * 0.14,
        f.p.y - f.up.y * 0.14,
        f.p.z - f.up.z * 0.14,
      );
      ties.setMatrixAt(i, m4);
    }
    S.add(ties);
    const sups = [];
    for (let s = 10; s < L - 8; s += 14) {
      const f = this.cFrame(s / L);
      if (f.p.y > 2.2) sups.push(f.p.clone());
    }
    const supMesh = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.22, 0.3, 1, 8),
      M.std(0x3d2f4a, { r: 0.7 }),
      sups.length,
    );
    sups.forEach((p, i) => {
      const h = p.y - 0.5;
      m4.makeScale(1, h, 1);
      m4.setPosition(p.x, h / 2, p.z);
      supMesh.setMatrixAt(i, m4);
    });
    S.add(supMesh);
    this.carts = [];
    const carCols = [0xff6fb5, 0xffffff, 0xff6fb5];
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group();
      const body = box(1.05, 0.5, 1.7, M.std(carCols[i], { r: 0.5 }));
      body.position.y = 0.3;
      const rim2 = box(1.09, 0.1, 1.74, M.bas(0xffc24d));
      rim2.position.y = 0.56;
      const seat = box(0.7, 0.34, 0.6, M.std(0x2a2233, { r: 0.9 }));
      seat.position.set(0, 0.62, -0.35);
      g.add(body, rim2, seat);
      if (i === 0) {
        const nose = new THREE.Mesh(
          new THREE.ConeGeometry(0.5, 0.8, 4),
          M.std(0xff6fb5, { r: 0.5 }),
        );
        nose.rotation.x = Math.PI / 2;
        nose.rotation.y = Math.PI / 4;
        nose.position.set(0, 0.3, 1.2);
        g.add(nose);
      }
      S.add(g);
      this.carts.push(g);
    }
    this.demoS = 0;
    this.animFns.push((dt) => {
      if (this.riding && this.riding.type === "coaster") return;
      this.demoS += dt * 10;
      this.placeCarts(this.demoS, 0);
    });
  }
  placeCarts(s, roll) {
    const c = this.coaster;
    for (let i = 0; i < this.carts.length; i++) {
      const si = s - 1.4 - i * 4.2;
      const u = (((si / c.L / 1) % 1) + 1) % 1;
      const f = this.cFrame(u);
      const up = f.up.clone().applyAxisAngle(f.T, roll);
      const right = f.right.clone().applyAxisAngle(f.T, roll);
      this.m4.makeBasis(right, up, f.T);
      this.m4.setPosition(
        f.p.x + up.x * 0.42,
        f.p.y + up.y * 0.42,
        f.p.z + up.z * 0.42,
      );
      const g = this.carts[i];
      g.quaternion.setFromRotationMatrix(this.m4);
      g.position.setFromMatrixPosition(this.m4);
    }
  }
  updateRide(dt, t) {
    const r = this.riding;
    if (!r) return;
    r.yawOff -= input.lookX;
    r.pitchOff = clamp(r.pitchOff - input.lookY, -1.35, 1.35);
    input.lookX = input.lookY = 0;
    r.elapsed += dt;
    if (r.type === "coaster") this.rideCoaster(dt, t);
    else if (r.type === "carousel") this.rideCarousel(dt, t);
    else this.rideWheel(dt);
    updateRideHUD(r);
  }
  rideCoaster(dt, t) {
    const c = this.coaster,
      r = this.riding;
    const u = (((r.s / c.L) % 1) + 1) % 1;
    const idx = clamp(Math.floor(u * c.LU), 0, c.LU - 1);
    const vT = Math.min(
      c.lut[idx] * c.K * c.mult[Math.min(r.lap, 5)],
      c.VMAX,
    );
    r.v = damp(r.v, vT, 1.6, dt);
    r.s += r.v * dt;
    const newLap = Math.floor(r.s / c.L);
    if (newLap !== r.lap) {
      r.lap = newLap;
      if (newLap >= 6) {
        snackbar("Lima menit penuh adrenalin — Prisma Cyclone selesai!");
        exitRide();
        return;
      }
      snackbar(LAP_NAMES[Math.min(newLap, 5)]);
    }
    const f1 = this.cFrame(u),
      ahead = this.cFrame((u + 0.004) % 1);
    const h1 = Math.atan2(f1.T.x, f1.T.z),
      h2 = Math.atan2(ahead.T.x, ahead.T.z);
    let dh = h2 - h1;
    while (dh > Math.PI) dh -= Math.PI * 2;
    while (dh < -Math.PI) dh += Math.PI * 2;
    r.roll = damp(r.roll, clamp(-dh * 22, -0.85, 0.85), 4, dt);
    const up = f1.up.clone().applyAxisAngle(f1.T, r.roll);
    camera.position.copy(f1.p).addScaledVector(up, 1.05);
    this.rideTmp.position.copy(camera.position);
    this.rideTmp.up.copy(up);
    this.rideTmp.lookAt(ahead.p);
    this.rideTmp.rotateY(r.yawOff);
    this.rideTmp.rotateX(r.pitchOff);
    camera.quaternion.copy(this.rideTmp.quaternion);
    const sh = clamp((r.v - 24) / 40, 0, 1) * 0.01;
    if (sh > 0.001) {
      camera.rotateZ(Math.sin(t * 61) * sh);
      camera.rotateX(Math.sin(t * 47 + 2) * sh * 0.7);
    }
    const tf = clamp(68 + r.v * 0.62, 68, 105);
    camera.fov = damp(camera.fov, tf, 3, dt);
    camera.updateProjectionMatrix();
    this.placeCarts(r.s, r.roll);
    r.blur =
      clamp((r.v - 14) / 34, 0, 1) * 0.62 + (r.lap >= 4 ? 0.12 : 0);
    sfx.setWind(r.v);
  }
  rideCarousel(dt, t) {
    const r = this.riding,
      a = this.carAng;
    const hy = 1.35 + Math.sin(t * 2.4) * 0.3;
    camera.position.set(
      this.carX + Math.cos(a) * 3.1,
      hy,
      this.carZ + Math.sin(a) * 3.1,
    );
    const a2 = a + 0.55;
    this.rideTmp.position.copy(camera.position);
    this.rideTmp.up.set(0, 1, 0);
    this.rideTmp.lookAt(
      this.carX + Math.cos(a2) * 3.1,
      hy + 0.2,
      this.carZ + Math.sin(a2) * 3.1,
    );
    this.rideTmp.rotateY(r.yawOff);
    this.rideTmp.rotateX(r.pitchOff);
    camera.quaternion.copy(this.rideTmp.quaternion);
    camera.fov = damp(camera.fov, 70, 3, dt);
    camera.updateProjectionMatrix();
    r.blur = 0;
  }
  rideWheel(dt) {
    const r = this.riding,
      a = this.wheelAng;
    const px = this.wheelX + Math.cos(a) * this.wheelR,
      py = this.wheelY + Math.sin(a) * this.wheelR;
    camera.position.set(px, py + 1, this.wheelZ);
    this.rideTmp.position.copy(camera.position);
    this.rideTmp.up.set(0, 1, 0);
    this.rideTmp.lookAt(this.wheelX, py + 1, this.wheelZ);
    this.rideTmp.rotateY(r.yawOff);
    this.rideTmp.rotateX(r.pitchOff);
    camera.quaternion.copy(this.rideTmp.quaternion);
    camera.fov = damp(camera.fov, 70, 3, dt);
    camera.updateProjectionMatrix();
    r.blur = 0;
  }
  clampBounds(p) {
    if (p.x > 46) {
      p.x = clamp(p.x, 0, 113);
      p.z = clamp(p.z, -5.2, 5.2);
    } else {
      const r = Math.hypot(p.x, p.z);
      if (r > 52) {
        p.x *= 52 / r;
        p.z *= 52 / r;
      }
    }
  }
}

/* ================================================================
   DUNIA 5 — PANTAI KARANG
================================================================ */
