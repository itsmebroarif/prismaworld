/* ============================================================
 * js/worlds/city.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { M, box, cyl, mkSign, mkSprite, rectPath, skyDome, softTex, sph } from "../core/engine.js";
import { touchMode } from "../core/input.js";
import { canvas } from "../core/ui.js";
import { clamp, rand, randi } from "../core/util.js";
import { WORLDS } from "../core/worlds_meta.js";
import { World } from "../game/world.js";

export class CityWorld extends World {
  constructor() {
    super("city");
    this.spawn = { x: 0, z: 21, yaw: 0 };
    this.fovBase = 72;
    const S = this.scene;
    S.background = new THREE.Color(0x3a2436);
    S.fog = new THREE.Fog(0xb26a83, 60, 175);
    S.add(skyDome(["#2b2f66", "#7e4577", "#d76a72", "#ffb36b"]));
    S.add(new THREE.HemisphereLight(0xd98a9a, 0x2a2030, 0.5));
    const sun = new THREE.DirectionalLight(0xffb877, 1.35);
    sun.position.set(-28, 32, -62);
    if (!touchMode) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, {
        left: -60,
        right: 60,
        top: 60,
        bottom: -60,
        near: 5,
        far: 180,
      });
      sun.shadow.bias = -0.0005;
    }
    S.add(sun);
    mkSprite(S, 0xff8f7a, 60, [-70, 16, -210], { opacity: 0.5 });
    mkSprite(S, 0xffe0a8, 26, [-58, 13, -195]);
    this.clouds = [];
    for (let i = 0; i < 8; i++)
      this.clouds.push(
        mkSprite(
          S,
          0xffb9c9,
          rand(18, 36),
          [rand(-130, 130), rand(28, 48), rand(-130, 130)],
          { opacity: rand(0.45, 0.75) },
        ),
      );
    this.animFns.push((dt) => {
      for (const c of this.clouds) {
        c.position.x += dt * 1.5;
        if (c.position.x > 140) c.position.x = -140;
      }
    });
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(110, 110),
      M.std(0x2b2833, { r: 0.95 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    S.add(ground);
    const rc = document.createElement("canvas");
    rc.width = rc.height = 128;
    const rx = rc.getContext("2d");
    rx.fillStyle = "#2b2933";
    rx.fillRect(0, 0, 128, 128);
    rx.fillStyle = "#cfc9bb";
    for (let y = 0; y < 128; y += 42) rx.fillRect(60, y + 6, 8, 24);
    rx.fillStyle = "rgba(255,255,255,.07)";
    rx.fillRect(6, 0, 2, 128);
    rx.fillRect(120, 0, 2, 128);
    const rtex = new THREE.CanvasTexture(rc);
    rtex.wrapS = rtex.wrapT = THREE.RepeatWrapping;
    rtex.colorSpace = THREE.SRGBColorSpace;
    const road = (w, l, x, z, rot) => {
      const t = rtex.clone();
      t.needsUpdate = true;
      t.repeat.set(1, l / 8);
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, l),
        new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 }),
      );
      m.rotation.x = -Math.PI / 2;
      if (rot) m.rotation.z = Math.PI / 2;
      m.position.set(x, 0.03, z);
      S.add(m);
    };
    const ringRoad = (H) => {
      road(7, 2 * H - 7, H, 0);
      road(7, 2 * H - 7, -H, 0);
      road(7, 2 * H + 7, 0, H, true);
      road(7, 2 * H + 7, 0, -H, true);
    };
    ringRoad(28);
    ringRoad(44);
    road(7, 11.5, 0, 18.75);
    road(7, 11.5, 0, -18.75);
    road(7, 11.5, 18.75, 0, true);
    road(7, 11.5, -18.75, 0, true);
    const swMat = M.std(0x37333f, { r: 0.95 });
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) {
        const a = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), swMat);
        a.rotation.x = -Math.PI / 2;
        a.position.set(17.5 * sx, 0.015, 17.5 * sz);
        a.receiveShadow = true;
        S.add(a);
        const b = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), swMat);
        b.rotation.x = -Math.PI / 2;
        b.position.set(36 * sx, 0.015, 36 * sz);
        b.receiveShadow = true;
        S.add(b);
      }
    const pc = document.createElement("canvas");
    pc.width = pc.height = 512;
    const pctx = pc.getContext("2d");
    pctx.fillStyle = "#d9b98d";
    pctx.fillRect(0, 0, 512, 512);
    for (let r = 36, i = 0; r < 256; r += 38, i++) {
      pctx.strokeStyle = i % 2 ? "#c98a6b" : "#e8cfae";
      pctx.lineWidth = 9;
      pctx.beginPath();
      pctx.arc(256, 256, r, 0, 7);
      pctx.stroke();
    }
    pctx.strokeStyle = "rgba(201,138,107,.55)";
    pctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      pctx.beginPath();
      pctx.moveTo(256 + Math.cos(a) * 36, 256 + Math.sin(a) * 36);
      pctx.lineTo(256 + Math.cos(a) * 250, 256 + Math.sin(a) * 250);
      pctx.stroke();
    }
    pctx.fillStyle = "#ff7bac";
    pctx.beginPath();
    pctx.arc(256, 256, 26, 0, 7);
    pctx.fill();
    const ptex = new THREE.CanvasTexture(pc);
    ptex.colorSpace = THREE.SRGBColorSpace;
    const plaza = new THREE.Mesh(
      new THREE.CircleGeometry(13, 48),
      new THREE.MeshStandardMaterial({ map: ptex, roughness: 0.9 }),
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.028;
    plaza.receiveShadow = true;
    S.add(plaza);
    const fb = cyl(1.9, 2.2, 0.6, M.std(0x8a7a92, { r: 0.85 }), 20);
    fb.position.set(0, 0.3, 2);
    const fw = new THREE.Mesh(
      new THREE.CircleGeometry(1.7, 20),
      M.std(0x6fc4e8, { r: 0.15 }),
    );
    fw.rotation.x = -Math.PI / 2;
    fw.position.set(0, 0.55, 2);
    const fp2 = cyl(0.28, 0.4, 1, M.std(0x8a7a92, { r: 0.85 }), 10);
    fp2.position.set(0, 0.9, 2);
    S.add(fb, fw, fp2);
    this.cCol(0, 2, 2.3);
    const SPR = 26,
      spr = new Float32Array(SPR * 3),
      sv = [];
    for (let i = 0; i < SPR; i++) {
      spr[i * 3] = rand(-0.2, 0.2);
      spr[i * 3 + 1] = rand(0.6, 1.4);
      spr[i * 3 + 2] = 2 + rand(-0.2, 0.2);
      sv.push({
        x: rand(-0.4, 0.4),
        y: rand(1.8, 2.6),
        z: rand(-0.4, 0.4),
      });
    }
    const sgeo = new THREE.BufferGeometry();
    sgeo.setAttribute("position", new THREE.BufferAttribute(spr, 3));
    S.add(
      new THREE.Points(
        sgeo,
        new THREE.PointsMaterial({
          color: 0xd9f4ff,
          size: 0.1,
          map: softTex,
          transparent: true,
          opacity: 0.8,
          depthWrite: false,
        }),
      ),
    );
    this.animFns.push((dt) => {
      const p = sgeo.attributes.position;
      for (let i = 0; i < SPR; i++) {
        const v = sv[i];
        v.y -= 7 * dt;
        p.setXYZ(
          i,
          p.getX(i) + v.x * dt,
          Math.max(0.56, p.getY(i) + v.y * dt),
          p.getZ(i) + v.z * dt,
        );
        if (p.getY(i) <= 0.58) {
          p.setXYZ(i, rand(-0.1, 0.1), 1.45, 2 + rand(-0.1, 0.1));
          v.x = rand(-0.4, 0.4);
          v.y = rand(1.8, 2.6);
          v.z = rand(-0.4, 0.4);
        }
      }
      p.needsUpdate = true;
    });
    const sc = document.createElement("canvas");
    sc.width = 256;
    sc.height = 128;
    const sx2 = sc.getContext("2d");
    const stex = new THREE.CanvasTexture(sc);
    stex.colorSpace = THREE.SRGBColorSpace;
    const slides = [
      ["#ff7bac", "#ffb36b", "KOTA SENJA", "Selamat datang, penjelajah"],
      ["#4ddac2", "#7ce3a0", "MONOREL 04", "Berangkat setiap 3 menit"],
      ["#ffc24d", "#ff7bac", "PASAR SENJA", "Buka hingga jam 9 malam"],
    ];
    const sframe = box(11, 6, 0.7, M.std(0x1c1a24, { r: 0.7 }));
    sframe.position.set(0, 4.6, -10.5);
    sframe.castShadow = true;
    const leg1 = box(0.6, 1.8, 0.6, M.std(0x1c1a24));
    leg1.position.set(-3.5, 0.9, -10.5);
    const leg2 = leg1.clone();
    leg2.position.x = 3.5;
    const scr = new THREE.Mesh(
      new THREE.PlaneGeometry(10.2, 5.2),
      M.bas(0xffffff, { map: stex }),
    );
    scr.position.set(0, 4.6, -10.1);
    S.add(sframe, leg1, leg2, scr);
    this.rCol(0, -10.5, 5.7, 0.8);
    let sLast = 0;
    this.animFns.push((dt, t) => {
      if (t - sLast < 0.5) return;
      sLast = t;
      const sl = slides[Math.floor(t / 4) % slides.length];
      const g = sx2.createLinearGradient(0, 0, 256, 128);
      g.addColorStop(0, sl[0]);
      g.addColorStop(1, sl[1]);
      sx2.fillStyle = g;
      sx2.fillRect(0, 0, 256, 128);
      sx2.fillStyle = "rgba(255,255,255,.1)";
      for (let y = 0; y < 128; y += 4) sx2.fillRect(0, y, 256, 1);
      sx2.textAlign = "center";
      sx2.fillStyle = "#fff";
      sx2.font = "700 26px Sora, sans-serif";
      sx2.fillText(sl[2], 128, 62);
      sx2.font = "500 13px Manrope, sans-serif";
      sx2.fillText(sl[3], 128, 88);
      stex.needsUpdate = true;
    });
    const winTex = [0, 1, 2].map(() => {
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 128;
      const x = c.getContext("2d");
      x.fillStyle = "#050509";
      x.fillRect(0, 0, 64, 128);
      const cols = [
        "#ffd9a0",
        "#ffe9cf",
        "#ffb3c8",
        "#a5f0e4",
        "#fff3d6",
      ];
      for (let yy = 0; yy < 16; yy++)
        for (let xx = 0; xx < 4; xx++)
          if (Math.random() < 0.5) {
            x.fillStyle = cols[randi(0, 4)];
            x.fillRect(xx * 16 + 3, yy * 8 + 2, 10, 5);
          }
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    });
    const wallCols = [0x2f2b3a, 0x332b36, 0x2a2e33];
    const roofMat = M.std(0x211e2a, { r: 0.9 });
    const blinkers = [];
    const addBuilding = (x, z, w, d, h, mi = 0) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const rx2 = Math.max(1, Math.round(w / 2.4)),
        ry2 = Math.max(1, Math.round(h / 2.6));
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++)
        uv.setXY(i, uv.getX(i) * rx2, uv.getY(i) * ry2);
      const b = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: wallCols[mi],
          roughness: 0.85,
          emissive: 0xffffff,
          emissiveMap: winTex[mi],
          emissiveIntensity: 1.1,
        }),
      );
      b.position.set(x, h / 2, z);
      b.castShadow = true;
      b.receiveShadow = true;
      S.add(b);
      const cap = box(w + 0.25, 0.35, d + 0.25, roofMat);
      cap.position.set(x, h + 0.1, z);
      S.add(cap);
      if (h > 20) {
        const ant = cyl(0.05, 0.05, 3.4, M.std(0x1a1822, { r: 0.8 }), 6);
        ant.position.set(x, h + 2, z);
        S.add(ant);
        const bl = sph(0.14, M.bas(0xff4d5e), 8);
        bl.position.set(x, h + 3.8, z);
        S.add(bl);
        blinkers.push(bl);
      }
      this.rCol(x, z, w / 2 + 0.1, d / 2 + 0.1);
    };
    for (const sx of [1, -1])
      for (const sz of [1, -1]) {
        if (!(sx === 1 && sz === -1))
          addBuilding(
            13.5 * sx,
            13.5 * sz,
            4.6,
            4.6,
            rand(9, 18),
            randi(0, 2),
          );
        addBuilding(21 * sx, 14 * sz, 5.5, 5, rand(8, 16), randi(0, 2));
        addBuilding(
          14 * sz,
          21.5 * sx,
          5.5,
          5.5,
          rand(10, 20),
          randi(0, 2),
        );
        addBuilding(
          21.5 * sx,
          21.5 * sz,
          4.2,
          4.2,
          rand(7, 14),
          randi(0, 2),
        );
        addBuilding(
          32.5 * sx,
          32.5 * sz,
          5.5,
          5.5,
          rand(14, 26),
          randi(0, 2),
        );
      }
    for (const [x, z] of [
      [36, 18],
      [-36, 18],
      [36, -18],
      [-36, -18],
      [18, 36],
      [-18, 36],
      [18, -36],
      [-18, -36],
    ])
      addBuilding(x, z, 5, 5, rand(5, 8), randi(0, 2));
    addBuilding(13.5, -13.5, 4.4, 4.4, 34, 0);
    const deck = cyl(3.2, 3.2, 0.9, M.std(0x3a3448, { r: 0.7 }), 16);
    deck.position.set(13.5, 34.6, -13.5);
    const rail = new THREE.Mesh(
      new THREE.TorusGeometry(3.1, 0.05, 6, 32),
      M.std(0x4a4656),
    );
    rail.rotation.x = Math.PI / 2;
    rail.position.set(13.5, 35.3, -13.5);
    S.add(deck, rail);
    addBuilding(-32, -32, 6.5, 6.5, 5, 0);
    const rgrass = new THREE.Mesh(
      new THREE.PlaneGeometry(5.9, 5.9),
      M.std(0x55bb5e, { r: 1 }),
    );
    rgrass.rotation.x = -Math.PI / 2;
    rgrass.position.set(-32, 5.33, -32);
    S.add(rgrass);
    for (let i = 0; i < 3; i++) {
      const tx = -32 + rand(-2, 2),
        tz = -32 + rand(-2, 2);
      const tr = cyl(0.1, 0.13, 1, M.std(0x8a5f3d), 6);
      tr.position.set(tx, 5.85, tz);
      const cn = sph(0.6, M.std(0x4fbf5e, { r: 0.9 }), 8);
      cn.position.set(tx, 6.8, tz);
      S.add(tr, cn);
    }
    for (const [wx, wz, ww, wd] of [
      [0, 2.95, 5.9, 0.12],
      [0, -2.95, 5.9, 0.12],
      [2.95, 0, 0.12, 5.9],
      [-2.95, 0, 0.12, 5.9],
    ]) {
      const r2 = box(ww, 0.5, wd, M.std(0x4a4656));
      r2.position.set(-32 + wx, 5.55, -32 + wz);
      S.add(r2);
    }
    const putSign = (text, color, x, y, z, ry, w = 3, h = 1.15) => {
      const s = mkSign(text, color, w, h);
      s.position.set(x, y, z);
      s.rotation.y = ry;
      S.add(s);
    };
    putSign("KOPI SANA", "#ff5fa2", 21, 3.2, 11.4, Math.PI);
    putSign("HOTEL", "#4ddac2", 11.4, 3.2, 21.5, -Math.PI / 2);
    putSign("MARKET 24", "#ffc24d", -17.2, 3.2, -16.6, 0);
    putSign("NEON", "#ff5fa2", -13.2, 3, -14, -Math.PI / 2, 2.2, 0.9);
    putSign("BIOSKOP", "#4ddac2", -15, 3, -14, Math.PI / 2, 2.2, 0.9);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.9, 4.6),
      M.bas(0xff5fa2, { transparent: true, opacity: 0.4 }),
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(-14, 0.05, -14);
    S.add(glow);
    const planter = (x, z) => {
      const g = new THREE.Group();
      const p = cyl(1.1, 1.3, 0.7, M.std(0x6e4a3a, { r: 0.9 }), 10);
      p.position.y = 0.35;
      p.castShadow = true;
      const b = sph(0.85, M.std(0x4fbf5e, { r: 0.95 }), 10);
      b.position.y = 1.15;
      b.scale.y = 0.8;
      g.add(p, b);
      g.position.set(x, 0, z);
      S.add(g);
      this.cCol(x, z, 1.4);
    };
    planter(6.5, 6.5);
    planter(-6.5, 6.5);
    planter(6.5, -6.5);
    planter(-6.5, -6.5);
    const bench = (x, z) => {
      const g = new THREE.Group();
      const seat = box(1.7, 0.09, 0.55, M.std(0x5a4a5e, { r: 0.85 }));
      seat.position.y = 0.5;
      const back = box(1.7, 0.45, 0.07, M.std(0x5a4a5e, { r: 0.85 }));
      back.position.set(0, 0.82, -0.26);
      g.add(seat, back);
      g.position.set(x, 0, z);
      g.rotation.y = Math.atan2(-x, -z);
      S.add(g);
      this.cCol(x, z, 0.95);
    };
    bench(9.2, 2);
    bench(-9.2, -2);
    bench(2, 9.2);
    const lampP = (x, z) => {
      const g = new THREE.Group();
      const post = cyl(
        0.06,
        0.09,
        3.1,
        M.std(0x3a3542, { r: 0.6, m: 0.3 }),
        8,
      );
      post.position.y = 1.55;
      const head = sph(0.22, M.bas(0xffd9a0), 10);
      head.position.y = 3.2;
      g.add(post, head);
      g.position.set(x, 0, z);
      S.add(g);
      this.cCol(x, z, 0.25);
    };
    [
      [8.5, 8.5],
      [-8.5, -8.5],
      [8.5, -8.5],
      [-8.5, 8.5],
      [23.5, 23.5],
      [-23.5, 23.5],
      [23.5, -23.5],
      [-23.5, -23.5],
    ].forEach((p) => lampP(p[0], p[1]));
    const banners = [];
    [
      [9, 6.5, "#ff7bac"],
      [6.5, -9, "#4ddac2"],
      [-9, -6.5, "#ffc24d"],
      [-6.5, 9, "#ff7bac"],
    ].forEach(([x, z, c], i) => {
      const g = new THREE.Group();
      const pole = cyl(0.05, 0.05, 3.7, M.std(0x3a3542, { r: 0.6 }), 6);
      pole.position.y = 1.85;
      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(0.85, 1.9),
        M.bas(c, { side: THREE.DoubleSide }),
      );
      flag.position.set(0.5, 2.6, 0);
      g.add(pole, flag);
      g.position.set(x, 0, z);
      S.add(g);
      this.cCol(x, z, 0.18);
      banners.push({ f: flag, ph: i });
    });
    const treeC = (x, z) => {
      const tr = cyl(0.14, 0.18, 1.4, M.std(0x8a5f3d), 7);
      tr.position.set(x, 0.7, z);
      const cn = sph(0.9, M.std(0x5cae62, { r: 0.95 }), 9);
      cn.position.set(x, 2, z);
      cn.castShadow = true;
      S.add(tr, cn);
      this.cCol(x, z, 0.4);
    };
    treeC(3.8, 19);
    treeC(-3.8, -19);
    treeC(19, 3.8);
    treeC(-19, -3.8);
    const railMat = M.std(0x3a3542, { r: 0.7 });
    for (let i = 0; i < 4; i++) {
      const h = box(i < 2 ? 73 : 1.4, 0.5, i < 2 ? 1.4 : 73, railMat);
      if (i < 2) h.position.set(0, 9.5, i === 0 ? -36 : 36);
      else h.position.set(i === 2 ? 36 : -36, 9.53, 0);
      S.add(h);
    }
    for (const [x, z] of [
      [-36, -36],
      [36, -36],
      [-36, 36],
      [36, 36],
      [-36, 0],
      [36, 0],
      [0, -36],
      [0, 36],
    ]) {
      const p = cyl(0.4, 0.5, 9.5, railMat, 10);
      p.position.set(x, 4.75, z);
      S.add(p);
      this.cCol(x, z, 0.7);
    }
    const stPlat = box(9, 0.5, 3.2, M.std(0x2f2b3a, { r: 0.8 }));
    stPlat.position.set(-7, 8.75, 33.4);
    const stRoof = box(10, 0.3, 3.4, M.std(0x3a3448, { r: 0.7 }));
    stRoof.position.set(-7, 10.9, 33.2);
    const st1 = cyl(0.15, 0.15, 2, M.std(0x3a3542), 8);
    st1.position.set(-10.5, 9.9, 33.4);
    const st2 = st1.clone();
    st2.position.x = -3.5;
    const stCol = cyl(0.4, 0.5, 8.7, railMat, 10);
    stCol.position.set(-7, 4.35, 35);
    const stSign = mkSign("MONOREL", "#4ddac2", 3.4, 1.3);
    stSign.position.set(-7, 11.6, 33.4);
    stSign.rotation.y = Math.PI;
    S.add(stPlat, stRoof, st1, st2, stCol, stSign);
    this.cCol(-7, 35, 0.7);
    this.train = { s: 0, cars: [] };
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group();
      const body = box(2, 1.5, 4.8, M.std(0xff8fb0, { r: 0.5 }));
      body.position.y = 0.75;
      const win = box(2.04, 0.5, 4, M.bas(0x1e1c26));
      win.position.y = 0.95;
      g.add(body, win);
      S.add(g);
      this.train.cars.push(g);
    }
    this.cars = [];
    this.dynCol = [];
    const carCols = [0xff5f5f, 0x4ddac2, 0xffc24d, 0xf0eaf4, 0xff7bac];
    const mkCar = (H, dir) => {
      const g = new THREE.Group();
      const body = box(
        0.95,
        0.5,
        2,
        M.std(carCols[randi(0, 4)], { r: 0.5, m: 0.2 }),
      );
      body.position.y = 0.45;
      body.castShadow = true;
      const cab = box(0.8, 0.4, 1, M.std(0x1e1c26, { r: 0.4 }));
      cab.position.set(0, 0.85, -0.1);
      const hl = box(0.7, 0.12, 0.08, M.bas(0xfff6d8));
      hl.position.set(0, 0.4, 1.02);
      const tl = box(0.7, 0.1, 0.08, M.bas(0xff4d5e));
      tl.position.set(0, 0.4, -1.02);
      g.add(body, cab, hl, tl);
      S.add(g);
      this.cars.push({ g, H, s: rand(0, 200), sp: rand(7, 9.5) * dir });
      this.dynCol.push({ x: 0, z: 0, r: 1.15 });
    };
    for (let i = 0; i < 6; i++) mkCar(28, 1);
    for (let i = 0; i < 4; i++) mkCar(44, -1);
    this.animFns.push((dt, t) => {
      for (const b of blinkers) b.visible = Math.sin(t * 3.5) > 0;
      for (const b of banners)
        b.f.rotation.y = Math.sin(t * 2 + b.ph) * 0.3;
      this.train.s += dt * 5.5;
      this.train.cars.forEach((g, i) => {
        const p = rectPath(36, this.train.s - i * 5.6);
        g.position.set(p.x, 9.75, p.z);
        g.rotation.y = p.a;
      });
      this.cars.forEach((c, i) => {
        c.s += c.sp * dt;
        const p = rectPath(c.H, c.s),
          pn = rectPath(c.H, c.s + Math.sign(c.sp) * 0.6);
        const hx = pn.x - p.x,
          hz = pn.z - p.z,
          hl2 = Math.hypot(hx, hz) || 1;
        const rx3 = (-hz / hl2) * 1.6,
          rz3 = (hx / hl2) * 1.6;
        c.g.position.set(p.x + rx3, 0.05, p.z + rz3);
        c.g.rotation.y = Math.atan2(hx, hz);
        this.dynCol[i].x = c.g.position.x;
        this.dynCol[i].z = c.g.position.z;
      });
    });
    const AC = WORLDS.city.hex;
    this.landmark({
      id: "tower",
      x: 13.5,
      z: -13.5,
      r: 5,
      color: AC,
      icon: "visibility",
      title: "Menara Pandang",
      fact: "Bangunan tertinggi di kota ini. Dari puncaknya, dikabarkan kamu bisa melihat taman — dan bahkan gema lampu server.",
    });
    this.landmark({
      id: "screen",
      x: 0,
      z: -6.5,
      r: 6,
      color: AC,
      icon: "smart_display",
      title: "Layar Raksasa Plaza",
      fact: "Layar selebar sepuluh meter di jantung kota — semua pengumuman tayang di sini, termasuk salam untukmu.",
    });
    this.landmark({
      id: "neon",
      x: -14,
      z: -14,
      r: 3.2,
      color: AC,
      icon: "lightbulb",
      title: "Gang Neon",
      fact: "Lorong sempit paling fotogenik di kota ini. Papan neonya menyala persis saat matahari tenggelam.",
    });
    this.landmark({
      id: "station",
      x: -7,
      z: 34,
      r: 4.8,
      color: AC,
      icon: "tram",
      title: "Stasiun Monorel",
      fact: "Kereta monorel mengelilingi kota tanpa henti. Penumpangnya? Hanya bayangan senja — dan kamu.",
    });
    this.landmark({
      id: "roof",
      x: -32,
      z: -27,
      r: 4.6,
      color: AC,
      icon: "forest",
      title: "Taman Atap",
      fact: "Warga menanam pohon di atap gedung ini. Dari jalan, dedaunannya terlihat seperti oasis melayang.",
    });
    this.spawnNPC(10, 0, 0, 11);
    this.spawnNPC(3, 0, 7, 1, { idle: true });
    this.spawnPigeons(4, 0, 4, 6);
  }
  clampBounds(p) {
    p.x = clamp(p.x, -46.5, 46.5);
    p.z = clamp(p.z, -46.5, 46.5);
  }
}

/* ================================================================
   DUNIA 4 — PRISMA LAND (theme park + roller coaster)
================================================================ */
