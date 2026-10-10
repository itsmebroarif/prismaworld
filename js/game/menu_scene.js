/* ============================================================
 * js/game/menu_scene.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { G_GEM, M, box, camera, cyl, skyDome, softTex, sph } from "../core/engine.js";
import { clamp, easeInOut, rand } from "../core/util.js";
import { WORLDS } from "../core/worlds_meta.js";

export const flyHooks = { onDone: null };
export class MenuScene {
  constructor() {
    const S = (this.scene = new THREE.Scene());
    S.background = new THREE.Color(0x1b0f22);
    S.fog = new THREE.Fog(0x1b0f22, 16, 52);
    S.add(skyDome(["#150b1c", "#2a1430", "#4a1f42", "#7a3355"]));
    S.add(new THREE.HemisphereLight(0xd9a0c0, 0x241430, 0.75));
    const N = 260,
      pts = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = rand(0, Math.PI * 2),
        r = rand(60, 140),
        y = rand(20, 110);
      pts[i * 3] = Math.cos(a) * r;
      pts[i * 3 + 1] = y;
      pts[i * 3 + 2] = Math.sin(a) * r;
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    S.add(
      new THREE.Points(
        sg,
        new THREE.PointsMaterial({
          color: 0xffd9e6,
          size: 0.5,
          map: softTex,
          transparent: true,
          opacity: 0.7,
          depthWrite: false,
        }),
      ),
    );
    this.prism = new THREE.Group();
    const octa = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.15),
      M.bas(0xff9ec7, { transparent: true, opacity: 0.9 }),
    );
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(octa.geometry),
      new THREE.LineBasicMaterial({
        color: 0xff7bac,
        transparent: true,
        opacity: 0.95,
      }),
    );
    const pl = new THREE.PointLight(0xff7bac, 40, 26, 1.8);
    pl.position.y = 1;
    this.prism.add(octa, wire, pl);
    this.prism.position.y = 2.6;
    S.add(this.prism);
    this.r1 = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.03, 8, 60),
      M.bas(0xff7bac, { transparent: true, opacity: 0.6 }),
    );
    this.r1.rotation.x = Math.PI / 2;
    this.r1.position.y = 2.6;
    this.r2 = new THREE.Mesh(
      new THREE.TorusGeometry(2.6, 0.022, 8, 60),
      M.bas(0x4ddac2, { transparent: true, opacity: 0.35 }),
    );
    this.r2.rotation.x = Math.PI / 2;
    this.r2.position.y = 2.6;
    S.add(this.r1, this.r2);
    const put = (m, x, y, z) => {
      m.position.set(x, y, z);
      return m;
    };
    const T = {
      park: (g) => {
        g.add(
          put(cyl(0.05, 0.07, 0.3, M.std(0x8a5f3d), 6), 0, 0.9, 0),
          put(
            new THREE.Mesh(
              new THREE.ConeGeometry(0.24, 0.45, 7),
              M.std(0x4fbf5e),
            ),
            0,
            1.25,
            0,
          ),
        );
      },
      server: (g) => {
        g.add(
          put(
            box(0.34, 0.5, 0.26, M.std(0x10262a, { r: 0.6 })),
            0,
            1.05,
            0,
          ),
          put(box(0.3, 0.05, 0.02, M.bas(0x4de3d4)), 0, 1.2, 0.14),
        );
      },
      city: (g) => {
        g.add(
          put(
            box(0.26, 0.6, 0.26, M.std(0x2f2b3a, { r: 0.8 })),
            0,
            1.1,
            0,
          ),
          put(box(0.28, 0.06, 0.28, M.bas(0xffd9a0)), 0, 1.15, 0),
        );
      },
      funfair: (g) => {
        g.add(
          put(cyl(0.03, 0.03, 0.4, M.bas(0xff6fb5), 6), 0, 1, 0),
          put(
            new THREE.Mesh(
              new THREE.ConeGeometry(0.3, 0.3, 10),
              M.std(0xff6fb5, { r: 0.8 }),
            ),
            0,
            1.35,
            0,
          ),
        );
      },
      beach: (g) => {
        const um = new THREE.Mesh(
          new THREE.ConeGeometry(0.3, 0.2, 10),
          M.std(0x5ec8f2, { r: 0.8 }),
        );
        um.position.y = 1.3;
        g.add(
          put(cyl(0.02, 0.03, 0.5, M.std(0x8a5f3d), 5), 0, 1.05, 0),
          um,
        );
      },
      desert: (g) => {
        const p = new THREE.Mesh(
          new THREE.ConeGeometry(0.3, 0.45, 4),
          M.std(0xc99a5e, { r: 0.9 }),
        );
        p.rotation.y = Math.PI / 4;
        p.position.y = 1.1;
        g.add(p);
      },
      snow: (g) => {
        g.add(
          put(
            new THREE.Mesh(
              new THREE.ConeGeometry(0.24, 0.5, 7),
              M.std(0x2a5a44, { r: 0.9 }),
            ),
            0,
            1.1,
            0,
          ),
          put(
            new THREE.Mesh(
              new THREE.ConeGeometry(0.17, 0.3, 7),
              M.std(0xf0f5fb, { r: 0.9 }),
            ),
            0,
            1.32,
            0,
          ),
        );
      },
      forest: (g) => {
        g.add(put(cyl(0.06, 0.09, 0.26, M.lam(0xd9cfe6), 6), 0, 1, 0));
        const cap = sph(0.2, M.bas(0xb78bff), 10);
        cap.scale.y = 0.55;
        g.add(put(cap, 0, 1.15, 0));
      },
      orbit: (g) => {
        g.add(put(sph(0.17, M.std(0x3f7fd0, { r: 0.7 }), 12), 0, 1.1, 0));
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.25, 0.02, 6, 24),
          M.bas(0x9ad1ff),
        );
        ring.rotation.x = 1.2;
        g.add(put(ring, 0, 1.1, 0));
      },
    };
    this.shards = [];
    let i = 0;
    for (const key of Object.keys(WORLDS)) {
      const w = WORLDS[key],
        g = new THREE.Group();
      const base = cyl(0.95, 0.55, 0.5, M.std(0x241a2b, { r: 0.85 }), 18);
      base.position.y = -0.25;
      g.add(base);
      const gem = new THREE.Mesh(G_GEM, M.bas(w.hex));
      gem.position.y = 0.3;
      gem.scale.setScalar(0.9);
      g.add(gem);
      T[key](g);
      S.add(g);
      this.shards.push({ key, g, gem, a: (i / 9) * Math.PI * 2 });
      i++;
    }
    const D = 200,
      dp = new Float32Array(D * 3);
    for (let j = 0; j < D; j++) {
      const a = rand(0, 6.28),
        r = rand(4, 16);
      dp[j * 3] = Math.cos(a) * r;
      dp[j * 3 + 1] = rand(0.5, 7);
      dp[j * 3 + 2] = Math.sin(a) * r;
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute("position", new THREE.BufferAttribute(dp, 3));
    this.dust = new THREE.Points(
      dg,
      new THREE.PointsMaterial({
        color: 0xffc9dd,
        size: 0.12,
        map: softTex,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      }),
    );
    S.add(this.dust);
    this.fly = null;
  }
  startFly(key) {
    this.fly = {
      key,
      t: 0,
      fromPos: camera.position.clone(),
      fromQ: camera.quaternion.clone(),
    };
  }
  reset() {
    this.fly = null;
    for (const d of this.shards) d.g.scale.setScalar(1);
  }
  update(dt, t) {
    this.dust.rotation.y += dt * 0.015;
    this.prism.rotation.y += dt * 0.35;
    this.prism.position.y = 2.6 + Math.sin(t * 0.8) * 0.15;
    this.r1.rotation.z += dt * 0.5;
    this.r2.rotation.z -= dt * 0.3;
    for (const d of this.shards) {
      d.a += dt * 0.04;
      d.g.position.set(
        Math.sin(d.a) * 10.2,
        2.5 + Math.sin(t * 0.8 + d.a * 4) * 0.3,
        Math.cos(d.a) * 10.2,
      );
      d.g.rotation.y += dt * 0.2;
      d.gem.rotation.y += dt * 1.5;
    }
    if (this.fly) {
      const f = this.fly;
      f.t += dt / 1.35;
      const k = easeInOut(clamp(f.t, 0, 1));
      const d = this.shards.find((x) => x.key === f.key);
      const dp = d.g.position;
      const out = new THREE.Vector3(dp.x * 0.42, 1.7, dp.z * 0.42);
      camera.position.lerpVectors(f.fromPos, out, k);
      const tmp = new THREE.Object3D();
      tmp.position.copy(camera.position);
      tmp.lookAt(dp);
      camera.quaternion.slerpQuaternions(f.fromQ, tmp.quaternion, k);
      d.g.scale.setScalar(1 + 0.25 * k);
      if (f.t >= 1.15) {
        this.fly = null;
        if (flyHooks.onDone) {
                const cb = flyHooks.onDone;
                flyHooks.onDone = null;
                cb();
              }
      }
      return;
    }
    const a = t * 0.07;
    camera.position.set(
      Math.sin(a) * 14.5,
      5.6 + Math.sin(t * 0.23) * 0.5,
      Math.cos(a) * 14.5,
    );
    camera.lookAt(0, 2.4, 0);
  }
}


/* ================================================================
   DUNIA 1 — TAMAN SEROJA
================================================================ */
export const menuScene = new MenuScene();
