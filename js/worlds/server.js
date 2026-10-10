/* ============================================================
 * js/worlds/server.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { M, box, cyl, softTex, sph } from "../core/engine.js";
import { canvas } from "../core/ui.js";
import { clamp, rand, randi } from "../core/util.js";
import { WORLDS } from "../core/worlds_meta.js";
import { World } from "../game/world.js";

export class ServerWorld extends World {
  constructor() {
    super("server");
    this.spawn = { x: 0, z: 19.5, yaw: 0 };
    this.fovBase = 72;
    const S = this.scene;
    S.background = new THREE.Color(0x051316);
    S.fog = new THREE.Fog(0x051316, 18, 58);
    S.add(new THREE.HemisphereLight(0x3a5a58, 0x0a1416, 0.55));
    const dl = new THREE.DirectionalLight(0x9adfd6, 0.32);
    dl.position.set(5, 10, 3);
    S.add(dl);
    for (const x of [-16, 16]) {
      const p = new THREE.PointLight(0x2ee6d2, 7, 26, 1.8);
      p.position.set(x, 5.4, 0);
      S.add(p);
    }
    const gc = document.createElement("canvas");
    gc.width = gc.height = 256;
    const gx = gc.getContext("2d");
    gx.fillStyle = "#071b1e";
    gx.fillRect(0, 0, 256, 256);
    gx.strokeStyle = "#0d3a40";
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
    gx.fillStyle = "#155e66";
    for (let i = 0; i < 10; i++)
      gx.fillRect(rand(0, 240), rand(0, 240), rand(8, 26), 3);
    const gtex = new THREE.CanvasTexture(gc);
    gtex.wrapS = gtex.wrapT = THREE.RepeatWrapping;
    gtex.repeat.set(16, 11);
    gtex.colorSpace = THREE.SRGBColorSpace;
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(64, 44),
      new THREE.MeshStandardMaterial({
        map: gtex,
        roughness: 0.75,
        metalness: 0.2,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    S.add(floor);
    const ceil = new THREE.Mesh(
      new THREE.PlaneGeometry(64, 44),
      M.std(0x04141a, { r: 0.9 }),
    );
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = 6.4;
    S.add(ceil);
    const wallMat = M.std(0x0a2225, { r: 0.85 });
    [
      [64.8, 0.6, 0, -22.2],
      [64.8, 0.6, 0, 22.2],
      [0.6, 44.8, -32.2, 0],
      [0.6, 44.8, 32.2, 0],
    ].forEach(([w, d, x, z]) => {
      const m = box(w, 6.5, d, wallMat);
      m.position.set(x, 3.25, z);
      S.add(m);
    });
    const trim = M.bas(0x14d2c2);
    [
      [63, 0.08, 0.08, 0, 3, -21.85],
      [63, 0.08, 0.08, 0, 3, 21.85],
      [0.08, 0.08, 43, -31.85, 3, 0],
      [0.08, 0.08, 43, 31.85, 3, 0],
    ].forEach(([w, h, d, x, y, z]) => {
      const m = box(w, h, d, trim);
      m.position.set(x, y, z);
      S.add(m);
    });
    [
      [-31.4, -21.4],
      [31.4, -21.4],
      [-31.4, 21.4],
      [31.4, 21.4],
    ].forEach(([x, z]) => {
      const p = box(0.9, 6.5, 0.9, M.std(0x0e2a2e, { r: 0.7 }));
      p.position.set(x, 3.25, z);
      S.add(p);
    });
    for (const z of [-16, -8, 8, 16])
      for (let x = -26; x <= 26; x += 13) {
        const b = box(7, 0.12, 0.5, M.bas(0x5fbfb5));
        b.position.set(x, 6.3, z);
        S.add(b);
      }
    this.leds = [];
    const bodyMat = M.std(0x0e2427, { r: 0.55, m: 0.35 }),
      ventMat = M.std(0x091b1e, { r: 0.8 });
    const ledBase = [0x2ee6d2, 0xff5fa2, 0xffc24d];
    for (const rz of [-13, -5, 5, 13])
      for (let x = -24; x <= 24; x += 4.8) {
        if (Math.abs(x) < 3.4) continue;
        if (Math.abs(Math.abs(x) - 9.6) < 1.7) continue;
        if (Math.random() < 0.08) continue;
        const g = new THREE.Group();
        g.position.set(x, 0, rz);
        g.rotation.y = rz < 0 ? 0 : Math.PI;
        const body = box(1.7, 2.35, 1.05, bodyMat);
        body.position.y = 1.175;
        const vent = box(1.5, 0.5, 0.06, ventMat);
        vent.position.set(0, 1.2, 0.56);
        const lm = M.bas(0x2ee6d2);
        const led = box(1.55, 0.1, 0.06, lm);
        led.position.set(0, 2.05, 0.56);
        g.add(body, vent, led);
        S.add(g);
        this.leds.push({
          m: lm,
          base: new THREE.Color(ledBase[randi(0, 2)]),
          ph: rand(0, 6),
        });
        this.rCol(x, rz, 0.95, 0.62);
      }
    this.animFns.push((dt, t) => {
      for (const l of this.leds)
        l.m.color
          .copy(l.base)
          .multiplyScalar(
            0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2.6 + l.ph)),
          );
    });
    const core = new THREE.Group();
    const cbase = cyl(
      1.5,
      1.8,
      0.35,
      M.std(0x0d2a2c, { r: 0.6, m: 0.4 }),
      16,
    );
    cbase.position.y = 0.17;
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 1.15, 6.1, 12, 1, true),
      M.bas(0x35e0d0, {
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    beam.position.y = 3.3;
    const octa = new THREE.Mesh(
      new THREE.OctahedronGeometry(1),
      M.bas(0x5ffcef),
    );
    octa.position.y = 2.5;
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(octa.geometry),
      new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
      }),
    );
    wire.position.y = 2.5;
    wire.scale.setScalar(1.03);
    const cl = new THREE.PointLight(0x35e0d0, 30, 20, 1.8);
    cl.position.y = 3;
    const piv1 = new THREE.Group(),
      piv2 = new THREE.Group();
    const ring1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.035, 8, 48),
      M.bas(0x2ee6d2),
    );
    ring1.rotation.x = Math.PI / 2;
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(2, 0.03, 8, 48),
      M.bas(0xff5fa2),
    );
    ring2.rotation.x = Math.PI / 2;
    piv1.add(ring1);
    piv2.add(ring2);
    piv1.position.y = piv2.position.y = 2.5;
    piv1.rotation.z = 1.1;
    piv2.rotation.z = -0.9;
    core.add(cbase, beam, octa, wire, cl, piv1, piv2);
    S.add(core);
    this.cCol(0, 0, 2.1);
    this.animFns.push((dt, t) => {
      octa.rotation.y += dt * 0.9;
      wire.rotation.y += dt * 0.9;
      piv1.rotation.y += dt * 0.8;
      piv2.rotation.y -= dt * 0.55;
      const s = 1 + Math.sin(t * 2) * 0.04;
      octa.scale.setScalar(s);
      wire.scale.setScalar(1.03 * s);
    });
    this.fans = [];
    for (const cx of [-13, 13]) {
      const body = cyl(
        1.5,
        1.6,
        3.6,
        M.std(0x11333a, { r: 0.6, m: 0.35 }),
        18,
      );
      body.position.set(cx, 1.8, 18);
      const frame = new THREE.Mesh(
        new THREE.TorusGeometry(1.15, 0.09, 8, 24),
        M.std(0x1d4a52, { r: 0.5, m: 0.4 }),
      );
      frame.rotation.x = Math.PI / 2;
      frame.position.set(cx, 1.8, 16.32);
      const blades = new THREE.Group();
      blades.position.set(cx, 1.8, 16.34);
      for (let i = 0; i < 3; i++) {
        const b = box(1.9, 0.22, 0.05, M.std(0x2ee6d2, { r: 0.4 }));
        b.rotation.z = (i * Math.PI * 2) / 3;
        blades.add(b);
      }
      const hub = sph(0.24, M.std(0x0a2225, { r: 0.5 }), 10);
      hub.position.set(cx, 1.8, 16.34);
      S.add(body, frame, blades, hub);
      this.fans.push(blades);
      this.cCol(cx, 18, 1.75);
    }
    this.animFns.push((dt) => {
      for (const f of this.fans) f.rotation.z += dt * 9;
    });
    const mc = document.createElement("canvas");
    mc.width = 512;
    mc.height = 144;
    const mtx = mc.getContext("2d");
    const mtex = new THREE.CanvasTexture(mc);
    mtex.colorSpace = THREE.SRGBColorSpace;
    const mframe = box(11.4, 3.6, 0.3, M.std(0x08181b, { r: 0.7 }));
    mframe.position.set(0, 2.2, -21.9);
    const mscr = new THREE.Mesh(
      new THREE.PlaneGeometry(10.6, 3),
      M.bas(0xffffff, { map: mtex }),
    );
    mscr.position.set(0, 2.2, -21.72);
    S.add(mframe, mscr);
    let mLast = 0;
    this.animFns.push((dt, t) => {
      if (t - mLast < 0.13) return;
      mLast = t;
      mtx.fillStyle = "#04191b";
      mtx.fillRect(0, 0, 512, 144);
      mtx.font = "12px monospace";
      for (let c = 0; c < 8; c++)
        for (let r2 = 0; r2 < 8; r2++) {
          mtx.fillStyle = Math.random() < 0.06 ? "#ff5fa2" : "#35e0d0";
          mtx.fillText(
            Math.random().toString(16).slice(2, 8).toUpperCase(),
            8 + c * 64,
            16 + r2 * 13,
          );
        }
      mtx.fillStyle = "#ffc24d";
      for (let i = 0; i < 28; i++) {
        const h = rand(3, 20);
        mtx.fillRect(8 + i * 18, 124 - h, 10, h);
      }
      mtex.needsUpdate = true;
    });
    const hc = document.createElement("canvas");
    hc.width = 256;
    hc.height = 192;
    const htx = hc.getContext("2d");
    const htex = new THREE.CanvasTexture(hc);
    htex.colorSpace = THREE.SRGBColorSpace;
    const nodes = [];
    for (let i = 0; i < 14; i++)
      nodes.push([rand(24, 232), rand(24, 168)]);
    const links = [];
    for (let i = 0; i < 12; i++) links.push([randi(0, 13), randi(0, 13)]);
    const holo = new THREE.Mesh(
      new THREE.PlaneGeometry(3.8, 2.85),
      M.bas(0xffffff, {
        map: htex,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
      }),
    );
    holo.position.set(14, 2.5, -16.5);
    const holoBase = cyl(0.35, 0.5, 0.9, M.std(0x103030, { r: 0.6 }), 8);
    holoBase.position.set(14, 0.45, -16.5);
    S.add(holo, holoBase);
    this.cCol(14, -16.5, 0.7);
    let hLast = 0;
    this.animFns.push((dt, t) => {
      holo.rotation.y = Math.sin(t * 0.4) * 0.6;
      holo.position.y = 2.5 + Math.sin(t * 1.2) * 0.1;
      if (t - hLast < 0.2) return;
      hLast = t;
      htx.fillStyle = "rgba(4,26,28,.9)";
      htx.fillRect(0, 0, 256, 192);
      htx.strokeStyle = "rgba(77,227,212,.35)";
      htx.lineWidth = 1;
      for (const [a, b] of links) {
        htx.beginPath();
        htx.moveTo(nodes[a][0], nodes[a][1]);
        htx.lineTo(nodes[b][0], nodes[b][1]);
        htx.stroke();
      }
      nodes.forEach(([x, y], i) => {
        const r = 2.5 + Math.sin(t * 3 + i) * 1.5;
        htx.fillStyle = i % 4 === 0 ? "#ff5fa2" : "#4de3d4";
        htx.beginPath();
        htx.arc(x, y, r, 0, 7);
        htx.fill();
      });
      htex.needsUpdate = true;
    });
    const mf = box(2.3, 3.1, 1.3, M.std(0x14282c, { r: 0.5, m: 0.4 }));
    mf.position.set(-27.5, 1.55, -13);
    const mfled = box(2.1, 0.14, 0.06, M.bas(0xffc24d));
    mfled.position.set(-27.5, 2.7, -12.32);
    const ant = cyl(0.03, 0.03, 1.2, M.bas(0xffc24d), 6);
    ant.position.set(-27.5, 3.8, -13);
    const warn = sph(0.12, M.bas(0xffc24d), 8);
    warn.position.set(-27.5, 4.45, -13);
    S.add(mf, mfled, ant, warn);
    this.rCol(-27.5, -13, 1.25, 0.75);
    this.animFns.push((dt, t) => {
      warn.visible = Math.sin(t * 4) > -0.2;
    });
    const mkStream = (lanes, dir, color, count) => {
      const pos = new Float32Array(count * 3),
        sp = [];
      for (let i = 0; i < count; i++) {
        pos[i * 3] = rand(-30, 30);
        pos[i * 3 + 1] = rand(0.4, 2.4);
        pos[i * 3 + 2] =
          lanes[randi(0, lanes.length - 1)] + rand(-0.5, 0.5);
        sp.push(rand(3, 6.5) * dir);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      S.add(
        new THREE.Points(
          g,
          new THREE.PointsMaterial({
            color,
            size: 0.11,
            map: softTex,
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
        ),
      );
      this.animFns.push((dt) => {
        const p = g.attributes.position;
        for (let i = 0; i < count; i++) {
          let x = p.getX(i) + sp[i] * dt;
          if (x > 30) x = -30;
          if (x < -30) x = 30;
          p.setX(i, x);
        }
        p.needsUpdate = true;
      });
    };
    mkStream([-9, 9], 1, 0x35e0d0, 130);
    mkStream([-17.5, 17.5], -1, 0xff5fa2, 110);
    const AC = WORLDS.server.hex;
    this.landmark({
      id: "core",
      x: 0,
      z: 0,
      r: 4.6,
      color: AC,
      icon: "memory",
      title: "Inti Prisma",
      fact: "Otak seluruh jaringan. Kabel serat optik sepanjang 2,7 km terhubung ke oktahedron ini.",
    });
    this.landmark({
      id: "cooling",
      x: 0,
      z: 15,
      r: 2.6,
      color: AC,
      icon: "air",
      title: "Koridor Pendingin",
      fact: "Kipas raksasa ini memindahkan cukup udara untuk mendinginkan 4.000 rak server setiap menitnya.",
    });
    this.landmark({
      id: "mainframe",
      x: -25.5,
      z: -13,
      r: 4.4,
      color: AC,
      icon: "dns",
      title: "Rak Utama",
      fact: "Rak pertama yang dipasang di fasilitas ini — masih menyala sejak hari pertama tanpa sekali pun mati.",
    });
    this.landmark({
      id: "holo",
      x: 14,
      z: -16.5,
      r: 4.2,
      color: AC,
      icon: "hub",
      title: "Peta Jaringan",
      fact: "Hologram lansung lalu lintas data global. Setiap titik terang adalah kota yang sedang terhubung.",
    });
    this.landmark({
      id: "terminal",
      x: 0,
      z: -19.5,
      r: 4.2,
      color: AC,
      icon: "monitor",
      title: "Terminal Cahaya",
      fact: "Dinding monitor ini menampilkan log sistem secara langsung — jutaan baris berjalan setiap detik.",
    });
    this.spawnNPC(2, 0, 9, 2);
  }
  clampBounds(p) {
    p.x = clamp(p.x, -30.8, 30.8);
    p.z = clamp(p.z, -20.8, 20.8);
  }
}

/* ================================================================
   DUNIA 3 — KOTA SENJA
================================================================ */
