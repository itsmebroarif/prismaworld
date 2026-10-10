/* ============================================================
 * js/action/mochi.js — Gelombang "Monster Mochi Gemes"
 * Monster bulat menggemaskan yang berdatangan mendekati pemain.
 * ============================================================ */
import * as THREE from "three";
import { sfx } from "../core/audio.js";

const PASTEL = [0xff9ec7, 0x9ed8ff, 0xffe08a, 0xc8a2ff, 0x9ef7c6];
const EYE = new THREE.MeshStandardMaterial({ color: 0x26222c, roughness: 0.35 });
const EYE_HI = new THREE.MeshBasicMaterial({ color: 0xffffff });
const BLUSH = new THREE.MeshBasicMaterial({
  color: 0xff6fa5,
  transparent: true,
  opacity: 0.65,
  depthWrite: false,
});
const MOUTH = new THREE.MeshStandardMaterial({ color: 0x8a3b57, roughness: 0.6 });

const sph = (r, m, w = 16, h = 12) => new THREE.Mesh(new THREE.SphereGeometry(r, w, h), m);

/** satu monster mochi lucu */
function buildMochi(color, big) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0.05,
    emissive: 0x000000,
  });
  const s = big ? 1 : 1;
  const body = sph(0.55 * s, bodyMat, 20, 16);
  body.scale.set(1, 0.88, 1);
  body.position.y = 0.5 * s;
  g.add(body);

  // mata besar
  const eyeGeo = sph(0.1 * s, EYE, 12, 10);
  [-0.2, 0.2].forEach((x) => {
    const e = eyeGeo.clone();
    e.position.set(x * s, 0.62 * s, 0.46 * s);
    g.add(e);
    const h = sph(0.033 * s, EYE_HI, 8, 6);
    h.position.set((x + 0.03) * s, 0.66 * s, 0.54 * s);
    g.add(h);
  });

  // pipi merona
  const bl = new THREE.Mesh(new THREE.CircleGeometry(0.11 * s, 14), BLUSH);
  bl.position.set(-0.34 * s, 0.5 * s, 0.44 * s);
  bl.rotation.y = -0.5;
  g.add(bl);
  const br = bl.clone();
  br.position.x = 0.34 * s;
  br.rotation.y = 0.5;
  g.add(br);

  // mulut senyum
  const mo = new THREE.Mesh(new THREE.TorusGeometry(0.09 * s, 0.02 * s, 6, 14, Math.PI), MOUTH);
  mo.position.set(0, 0.47 * s, 0.5 * s);
  mo.rotation.z = Math.PI;
  g.add(mo);

  // kaki kecil
  const footGeo = sph(0.13 * s, bodyMat, 10, 8);
  [-0.22, 0.22].forEach((x) => {
    const f = footGeo.clone();
    f.position.set(x * s, 0.1 * s, 0.1 * s);
    g.add(f);
  });

  // tangan kecil
  const armGeo = sph(0.11 * s, bodyMat, 10, 8);
  [-0.52, 0.52].forEach((x) => {
    const a = armGeo.clone();
    a.position.set(x * s, 0.5 * s, 0.05 * s);
    g.add(a);
  });

  if (big) {
    // mahkota raja mochi
    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3 * s, 0.36 * s, 0.2 * s, 8, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0xffd166,
        metalness: 0.9,
        roughness: 0.25,
        side: THREE.DoubleSide,
      }),
    );
    crown.position.y = 1.02 * s;
    g.add(crown);
    for (let i = 0; i < 8; i++) {
      const p = sph(0.06 * s, crown.material, 6, 5);
      const a = (i / 8) * Math.PI * 2;
      p.position.set(Math.cos(a) * 0.3 * s, 1.14 * s, Math.sin(a) * 0.3 * s);
      g.add(p);
    }
  }

  g.userData.bodyMat = bodyMat;
  return g;
}

function textSprite(text, color) {
  const c = document.createElement("canvas");
  c.width = 160;
  c.height = 80;
  const x = c.getContext("2d");
  x.font = "bold 52px system-ui, -apple-system, sans-serif";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.lineWidth = 9;
  x.strokeStyle = "rgba(10,14,22,.85)";
  x.strokeText(text, 80, 40);
  x.fillStyle = color;
  x.fillText(text, 80, 40);
  const tex = new THREE.CanvasTexture(c);
  const sp = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 0.55),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false }),
  );
  sp.renderOrder = 999;
  return sp;
}

export class MochiSwarm {
  constructor(scene) {
    this.scene = scene;
    this.monsters = [];
    this.fx = [];
  }

  get count() {
    return this.monsters.length;
  }

  spawnWave(n, waveNo, center) {
    const bossWave = waveNo % 5 === 0;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 16 + Math.random() * 12;
      const big = bossWave && i === 0;
      this.spawnOne(
        center.x + Math.cos(a) * r,
        center.z + Math.sin(a) * r,
        big,
        waveNo,
      );
    }
    sfx.tone({ f: 520, f2: 780, t: 0.18, type: "sine", g: 0.12 });
  }

  spawnOne(x, z, big, waveNo) {
    const color = big ? 0xffd166 : PASTEL[Math.floor(Math.random() * PASTEL.length)];
    const mesh = buildMochi(color, big);
    mesh.position.set(x, 0, z);
    const scale = big ? 2.3 : 0.9 + Math.random() * 0.35;
    mesh.scale.setScalar(scale);
    this.scene.add(mesh);

    const m = {
      mesh,
      baseScale: scale,
      hp: big ? 420 + waveNo * 60 : 45 + waveNo * 11,
      maxHp: big ? 420 + waveNo * 60 : 45 + waveNo * 11,
      speed: big ? 1.5 : 2.1 + Math.random() * 0.9,
      radius: 0.55 * scale,
      dmg: big ? 2 : 1,
      cd: Math.random(),
      t: Math.random() * 6,
      hitT: 0,
      big,
      mat: mesh.userData.bodyMat,
      flash: 0,
    };
    mesh.userData.__mochi = m;
    this.monsters.push(m);
    return m;
  }

  /** raycast dari kamera; return {point, killed} atau null */
  checkHit(ray, dmg) {
    if (!this.monsters.length) return null;
    const meshes = this.monsters.map((m) => m.mesh);
    // pastikan posisi terkini terpakai (monster bisa baru lahir frame ini)
    for (const m of meshes) m.updateMatrixWorld(true);
    const hits = ray.intersectObjects(meshes, true);
    if (!hits.length) return null;

    let p = hits[0].object;
    while (p && !p.userData.__mochi) p = p.parent;
    const m = p ? p.userData.__mochi : null;
    const point = hits[0].point.clone();
    if (!m) return { point, killed: false };

    m.hp -= dmg;
    m.hitT = 0.14;
    m.mat.emissive.setHex(0xffffff);
    m.flash = 0.12;
    this.spawnText(String(Math.round(dmg)), m.big ? "#ffe08a" : "#ffffff", point);

    let killed = false;
    if (m.hp <= 0) {
      this.kill(m);
      killed = true;
    }
    return { point, killed };
  }

  kill(m) {
    const i = this.monsters.indexOf(m);
    if (i < 0) return;
    this.monsters.splice(i, 1);
    this.scene.remove(m.mesh);
    m.mesh.traverse((o) => {
      if (o.geometry && o.geometry !== undefined) o.geometry.dispose();
      if (o.material && o.material !== EYE && o.material !== BLUSH && o.material !== MOUTH)
        o.material.dispose();
    });
    this.burst(m.mesh.position.clone().setY(0.6 * m.baseScale), m.mat.color.getHex(), m.big ? 20 : 10);
    sfx.tone({ f: m.big ? 320 : 720, f2: m.big ? 140 : 460, t: 0.14, type: "sine", g: 0.14 });
    sfx.whoosh();
  }

  spawnText(text, color, at) {
    const sp = textSprite(text, color);
    sp.position.copy(at);
    this.scene.add(sp);
    this.fx.push({ obj: sp, t: 0, dur: 0.75, kind: "text", vy: 1.6 });
  }

  burst(pos, color, n) {
    for (let i = 0; i < n; i++) {
      const s = sph(0.07 + Math.random() * 0.07, new THREE.MeshBasicMaterial({ color }));
      s.position.copy(pos);
      this.scene.add(s);
      this.fx.push({
        obj: s,
        t: 0,
        dur: 0.55,
        kind: "puff",
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          2 + Math.random() * 4,
          (Math.random() - 0.5) * 6,
        ),
      });
    }
  }

  /**
   * gerakkan semua mochi; return jumlah damage yang masuk ke pemain
   */
  update(dt, playerPos) {
    let damage = 0;
    for (let i = 0; i < this.monsters.length; i++) {
      const m = this.monsters[i];
      m.t += dt;
      m.cd -= dt;
      if (m.hitT > 0) {
        m.hitT -= dt;
        if (m.hitT <= 0) m.mat.emissive.setHex(0x000000);
      }

      const dx = playerPos.x - m.mesh.position.x;
      const dz = playerPos.z - m.mesh.position.z;
      const dist = Math.hypot(dx, dz);
      const reach = 1.15 + m.radius;

      if (dist > reach) {
        const sp = m.speed * dt;
        m.mesh.position.x += (dx / dist) * sp;
        m.mesh.position.z += (dz / dist) * sp;
        m.mesh.rotation.y = Math.atan2(dx, dz);
      } else if (m.cd <= 0) {
        m.cd = m.big ? 1.1 : 1.35;
        damage += m.dmg;
        m.hitT = 0.1;
      }

      // wobble + lompat-lompat lucu
      const wob = Math.sin(m.t * 9) * 0.09;
      const hop = Math.abs(Math.sin(m.t * (m.big ? 4 : 6))) * (m.big ? 0.28 : 0.16);
      m.mesh.scale.set(
        m.baseScale * (1 + wob),
        m.baseScale * (1 - wob) * (1 + hop * 0.5),
        m.baseScale * (1 + wob),
      );
      m.mesh.position.y = hop * m.baseScale + (m.hitT > 0 ? 0.12 : 0);
    }

    // dorong monster agar tidak menumpuk di satu titik
    for (let i = 0; i < this.monsters.length; i++) {
      for (let j = i + 1; j < this.monsters.length; j++) {
        const a = this.monsters[i],
          b = this.monsters[j];
        const dx = b.mesh.position.x - a.mesh.position.x;
        const dz = b.mesh.position.z - a.mesh.position.z;
        const d = Math.hypot(dx, dz) || 0.001;
        const min = a.radius + b.radius;
        if (d < min) {
          const push = ((min - d) / d) * 0.5;
          a.mesh.position.x -= dx * push;
          a.mesh.position.z -= dz * push;
          b.mesh.position.x += dx * push;
          b.mesh.position.z += dz * push;
        }
      }
    }

    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.t += dt;
      const k = 1 - f.t / f.dur;
      if (k <= 0) {
        this.scene.remove(f.obj);
        if (f.obj.geometry) f.obj.geometry.dispose();
        if (f.obj.material) {
          if (f.obj.material.map) f.obj.material.map.dispose();
          f.obj.material.dispose();
        }
        this.fx.splice(i, 1);
        continue;
      }
      if (f.kind === "text") {
        f.obj.position.y += f.vy * dt;
        f.obj.material.opacity = k;
        f.obj.scale.setScalar(1 + (1 - k) * 0.35);
      } else {
        f.vel.y -= 14 * dt;
        f.obj.position.addScaledVector(f.vel, dt);
        f.obj.scale.setScalar(Math.max(0.01, k));
      }
    }
    return damage;
  }

  clear() {
    const wipe = (arr) => {
      arr.forEach((o) => {
        this.scene.remove(o.obj || o.mesh);
        const target = o.obj || o.mesh;
        if (target && target.traverse)
          target.traverse((x) => {
            if (x.geometry) x.geometry.dispose();
            if (x.material && x.material.map) x.material.map.dispose();
            if (x.material) x.material.dispose();
          });
      });
      arr.length = 0;
    };
    wipe(this.monsters.map((m) => ({ mesh: m.mesh })));
    wipe(this.fx);
    this.monsters.length = 0;
  }
}
