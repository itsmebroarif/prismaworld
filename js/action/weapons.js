/* ============================================================
 * js/action/weapons.js — 5 senjata Mode Action
 * baton, pistol, uzi, m4a1, machine gun (+ ammo & viewmodel)
 * ============================================================ */
import * as THREE from "three";
import { sfx } from "../core/audio.js";
import { $ } from "../core/util.js";

export const WEAPONS = [
  {
    id: "baton",
    name: "Prisma Baton",
    icon: "sports_martial_arts",
    melee: true,
    dmg: 55,
    rate: 0.42,
    range: 3.6,
    mag: 0,
    reserve: 0,
    reload: 0,
    auto: false,
    color: 0xffd166,
    hold: [0.24, -0.18, -0.42],
    sound: "baton",
  },
  {
    id: "pistol",
    name: "Prisma Pistol",
    icon: "gps_fixed",
    dmg: 38,
    rate: 0.2,
    range: 120,
    mag: 15,
    reserve: 90,
    reload: 1.0,
    auto: false,
    color: 0x38bdf8,
    hold: [0.24, -0.2, -0.46],
    sound: "pistol",
  },
  {
    id: "uzi",
    name: "UZI Sting",
    icon: "bolt",
    dmg: 19,
    rate: 0.07,
    range: 90,
    mag: 32,
    reserve: 192,
    reload: 1.4,
    auto: true,
    color: 0x4ddac2,
    hold: [0.24, -0.2, -0.44],
    sound: "uzi",
  },
  {
    id: "m4a1",
    name: "M4A1 Vortex",
    icon: "military_tech",
    dmg: 42,
    rate: 0.11,
    range: 160,
    mag: 30,
    reserve: 180,
    reload: 1.7,
    auto: true,
    color: 0xffc24d,
    hold: [0.24, -0.2, -0.5],
    sound: "rifle",
  },
  {
    id: "mg",
    name: "Vulcan Machine Gun",
    icon: "local_fire_department",
    dmg: 26,
    rate: 0.05,
    range: 130,
    mag: 80,
    reserve: 400,
    reload: 2.6,
    auto: true,
    color: 0xff5f7e,
    hold: [0.26, -0.24, -0.54],
    sound: "mg",
  },
];

const CENTER = new THREE.Vector2(0, 0);
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const GUN_DARK = 0x27303f;

const mStd = (c, m = 0.55, r = 0.5) =>
  new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: r });

const bx = (w, h, d, c) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mStd(c));
const cy = (r1, r2, h, c, seg = 10) =>
  new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mStd(c));

/* --- model tiap senjata (viewmodel sederhana) --- */
function buildModel(def) {
  const g = new THREE.Group();
  const c = def.color;
  let muzzle;

  if (def.id === "baton") {
    const shaft = cy(0.026, 0.032, 0.66, GUN_DARK, 10);
    shaft.rotation.x = Math.PI / 2;
    g.add(shaft);
    const grip = cy(0.036, 0.036, 0.2, 0x1a2030, 10);
    grip.rotation.x = Math.PI / 2;
    grip.position.z = 0.2;
    g.add(grip);
    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.036, 10, 8),
      new THREE.MeshStandardMaterial({
        color: c,
        emissive: c,
        emissiveIntensity: 1.4,
        metalness: 0.2,
        roughness: 0.3,
      }),
    );
    tip.position.z = -0.33;
    g.add(tip);
    muzzle = new THREE.Object3D();
    muzzle.position.set(0, 0, -0.36);
    g.add(muzzle);
  } else if (def.id === "pistol") {
    const body = bx(0.07, 0.09, 0.24, GUN_DARK);
    g.add(body);
    const slide = bx(0.075, 0.05, 0.26, c);
    slide.position.set(0, 0.05, -0.02);
    g.add(slide);
    const grip = bx(0.06, 0.16, 0.08, 0x1a2030);
    grip.position.set(0, -0.1, 0.07);
    grip.rotation.x = -0.22;
    g.add(grip);
    const bar = cy(0.018, 0.018, 0.1, GUN_DARK, 8);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(0, 0.01, -0.17);
    g.add(bar);
    muzzle = new THREE.Object3D();
    muzzle.position.set(0, 0.01, -0.23);
    g.add(muzzle);
  } else if (def.id === "uzi") {
    const body = bx(0.08, 0.13, 0.3, GUN_DARK);
    g.add(body);
    const top = bx(0.085, 0.04, 0.3, c);
    top.position.y = 0.08;
    g.add(top);
    const mag = bx(0.05, 0.18, 0.07, 0x1a2030);
    mag.position.set(0, -0.14, 0.06);
    g.add(mag);
    const bar = cy(0.017, 0.017, 0.14, GUN_DARK, 8);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(0, 0.03, -0.2);
    g.add(bar);
    const stock = bx(0.05, 0.05, 0.12, GUN_DARK);
    stock.position.set(0, -0.02, 0.2);
    g.add(stock);
    muzzle = new THREE.Object3D();
    muzzle.position.set(0, 0.03, -0.27);
    g.add(muzzle);
  } else if (def.id === "m4a1") {
    const body = bx(0.07, 0.1, 0.46, GUN_DARK);
    g.add(body);
    const rail = bx(0.055, 0.03, 0.4, c);
    rail.position.set(0, 0.065, -0.04);
    g.add(rail);
    const bar = cy(0.019, 0.019, 0.26, GUN_DARK, 8);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(0, 0.01, -0.34);
    g.add(bar);
    const hand = bx(0.06, 0.07, 0.16, 0x1a2030);
    hand.position.set(0, -0.02, -0.2);
    g.add(hand);
    const grip = bx(0.055, 0.15, 0.07, 0x1a2030);
    grip.position.set(0, -0.1, 0.06);
    grip.rotation.x = -0.2;
    g.add(grip);
    const stock = bx(0.05, 0.09, 0.16, GUN_DARK);
    stock.position.set(0, -0.01, 0.29);
    g.add(stock);
    const scope = cy(0.03, 0.03, 0.1, GUN_DARK, 10);
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.11, 0.02);
    g.add(scope);
    muzzle = new THREE.Object3D();
    muzzle.position.set(0, 0.01, -0.47);
    g.add(muzzle);
  } else {
    // machine gun
    const body = bx(0.1, 0.14, 0.54, GUN_DARK);
    g.add(body);
    const heat = bx(0.075, 0.06, 0.24, c);
    heat.position.set(0, 0.05, -0.24);
    g.add(heat);
    const bar = cy(0.026, 0.03, 0.3, GUN_DARK, 10);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(0, 0.01, -0.44);
    g.add(bar);
    const ammoBox = bx(0.12, 0.14, 0.14, 0x1a2030);
    ammoBox.position.set(0.06, -0.08, 0.06);
    g.add(ammoBox);
    const grip = bx(0.055, 0.14, 0.07, 0x1a2030);
    grip.position.set(0, -0.13, 0.16);
    grip.rotation.x = -0.18;
    g.add(grip);
    const bipod = cy(0.01, 0.01, 0.16, GUN_DARK, 6);
    bipod.position.set(0.03, -0.11, -0.3);
    bipod.rotation.z = 0.5;
    g.add(bipod);
    const bipod2 = bipod.clone();
    bipod2.position.x = -0.03;
    bipod2.rotation.z = -0.5;
    g.add(bipod2);
    muzzle = new THREE.Object3D();
    muzzle.position.set(0, 0.01, -0.58);
    g.add(muzzle);
  }

  g.userData.muzzle = muzzle;
  g.position.set(def.hold[0], def.hold[1], def.hold[2]);
  return g;
}

function playShot(kind) {
  switch (kind) {
    case "baton":
      sfx.whoosh();
      sfx.tone({ f: 180, f2: 90, t: 0.12, type: "triangle", g: 0.16 });
      break;
    case "pistol":
      sfx.noise({ t: 0.14, g: 0.22, fl: 2600 });
      sfx.tone({ f: 420, f2: 160, t: 0.08, type: "square", g: 0.1 });
      break;
    case "uzi":
      sfx.noise({ t: 0.07, g: 0.16, fl: 3400 });
      break;
    case "rifle":
      sfx.noise({ t: 0.16, g: 0.24, fl: 2200 });
      sfx.tone({ f: 260, f2: 110, t: 0.1, type: "sawtooth", g: 0.1 });
      break;
    default: // mg
      sfx.noise({ t: 0.09, g: 0.2, fl: 1800 });
      sfx.tone({ f: 200, f2: 120, t: 0.07, type: "square", g: 0.08 });
      break;
  }
}

export class WeaponRig {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.pivot = new THREE.Group();
    this.root.add(this.pivot);
    scene.add(this.root);

    this.models = WEAPONS.map((w) => buildModel(w));
    this.models.forEach((m) => this.pivot.add(m));

    this.ammo = WEAPONS.map((w) => w.mag);
    this.reserve = WEAPONS.map((w) => w.reserve);
    this.index = 1;
    this.lastShot = -99;
    this.reloading = 0;
    this.recoil = 0;
    this.swing = 0;
    this.flashT = 0;
    this.tracers = [];
    this.onKill = null;

    this.flash = new THREE.PointLight(0xffd9a0, 0, 7, 2);
    this.flash.position.set(0.24, -0.14, -0.7);
    this.root.add(this.flash);

    this.select(this.index);
    this.buildStrip();
  }

  buildStrip() {
    const strip = $("#wepStrip");
    if (!strip) return;
    strip.innerHTML = "";
    WEAPONS.forEach((w, i) => {
      const b = document.createElement("button");
      b.className = "wbtn";
      b.type = "button";
      b.dataset.i = i;
      b.innerHTML = `<span class="msr">${w.icon}</span><i>${i + 1}</i>`;
      b.title = w.name;
      strip.appendChild(b);
    });
  }

  select(i) {
    this.index = (i + WEAPONS.length) % WEAPONS.length;
    this.models.forEach((m, k) => (m.visible = k === this.index));
    this.reloading = 0;
    this.swing = 0;
    this.syncHud();
  }

  current() {
    return WEAPONS[this.index];
  }

  /** tembak; return true kalau peluru/senjata benar-benar keluar */
  shoot(camera, monsters) {
    const w = this.current();
    const now = performance.now() / 1000;
    if (this.reloading > 0) return false;
    if (now - this.lastShot < w.rate) return false;
    if (!w.melee) {
      if (this.ammo[this.index] <= 0) {
        this.lastShot = now - w.rate + 0.35;
        sfx.tone({ f: 150, f2: 90, t: 0.05, type: "square", g: 0.06 });
        this.syncHud();
        return false;
      }
      this.ammo[this.index]--;
    }
    this.lastShot = now;
    playShot(w.sound);
    this.recoil = Math.min(1, this.recoil + (w.melee ? 0.5 : 0.75));
    if (w.melee) this.swing = 1;
    this.flashT = w.melee ? 0.05 : 0.07;

    // kamera tidak menempel ke scene — matriksnya harus diperbarui manual
    // supaya arah peluru persis sama dengan tampilan layar
    camera.updateMatrixWorld();
    const ray = new THREE.Raycaster();
    ray.far = w.range;
    ray.setFromCamera(CENTER, camera);
    const res = monsters ? monsters.checkHit(ray, w.dmg) : null;
    if (res && res.killed && this.onKill) this.onKill();

    const end = _v1.copy(ray.ray.direction).multiplyScalar(w.range).add(ray.ray.origin);
    if (res) end.copy(res.point);

    // tracer dari laras ke titik kena
    const model = this.models[this.index];
    this.root.updateMatrixWorld(true);
    const from = _v2.setFromMatrixPosition(model.userData.muzzle.matrixWorld);
    this.spawnTracer(from, end, w.color, w.melee);
    this.syncHud();
    return true;
  }

  spawnTracer(from, to, color, melee) {
    const dist = from.distanceTo(to);
    const geo = new THREE.CylinderGeometry(
      melee ? 0.02 : 0.012,
      melee ? 0.02 : 0.006,
      1,
      6,
      1,
      true,
    );
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: melee ? 0.75 : 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(from).lerp(to, 0.5);
    m.lookAt(to);
    m.scale.z = Math.max(0.05, dist);
    this.scene.add(m);
    this.tracers.push({ m, t: 0, dur: melee ? 0.12 : 0.07 });
  }

  reload() {
    const w = this.current();
    if (w.melee || this.reloading > 0) return;
    const i = this.index;
    if (this.ammo[i] >= w.mag || this.reserve[i] <= 0) return;
    this.reloading = w.reload;
    sfx.tone({ f: 500, f2: 900, t: 0.18, type: "square", g: 0.08 });
    this.syncHud();
  }

  update(dt, camera) {
    if (this.reloading > 0) {
      this.reloading -= dt;
      if (this.reloading <= 0) {
        this.reloading = 0;
        const w = this.current();
        const i = this.index;
        const need = w.mag - this.ammo[i];
        const take = Math.min(need, this.reserve[i]);
        this.ammo[i] += take;
        this.reserve[i] -= take;
        sfx.tone({ f: 700, f2: 1100, t: 0.08, type: "square", g: 0.07 });
        this.syncHud();
      }
    }
    this.recoil = Math.max(0, this.recoil - dt * 6);
    this.swing = Math.max(0, this.swing - dt * 3.2);
    this.flashT = Math.max(0, this.flashT - dt);
    this.flash.intensity = this.flashT > 0 ? 6 * (this.flashT / 0.07) : 0;

    // ikuti kamera
    this.root.position.copy(camera.position);
    this.root.quaternion.copy(camera.quaternion);
    const sw = Math.sin(performance.now() * 0.004) * 0.006;
    this.pivot.position.set(sw * 0.4, sw * 0.3 - this.recoil * 0.02, this.recoil * 0.06);
    this.pivot.rotation.set(
      this.recoil * 0.28 - Math.abs(this.swing) * 1.1,
      this.swing * 0.7,
      this.swing * 0.9,
    );

    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.t += dt;
      const k = 1 - t.t / t.dur;
      if (k <= 0) {
        this.scene.remove(t.m);
        t.m.geometry.dispose();
        t.m.material.dispose();
        this.tracers.splice(i, 1);
      } else {
        t.m.material.opacity = k * 0.95;
      }
    }
  }

  syncHud() {
    const w = this.current();
    const name = $("#wepName");
    const ammo = $("#wepAmmo");
    const icon = $("#wepIcon");
    if (name) name.textContent = w.name;
    if (icon) icon.textContent = w.icon;
    if (ammo) {
      if (w.melee) {
        ammo.textContent = "MELEE";
        ammo.classList.remove("low");
      } else if (this.reloading > 0) {
        ammo.textContent = "RELOAD…";
        ammo.classList.add("low");
      } else {
        ammo.textContent = `${this.ammo[this.index]} / ${this.reserve[this.index]}`;
        ammo.classList.toggle("low", this.ammo[this.index] === 0);
      }
    }
    document.querySelectorAll("#wepStrip .wbtn").forEach((b) => {
      b.classList.toggle("active", +b.dataset.i === this.index);
    });
  }

  dispose() {
    this.tracers.forEach((t) => {
      this.scene.remove(t.m);
      t.m.geometry.dispose();
      t.m.material.dispose();
    });
    this.tracers = [];
    this.models.forEach((m) => {
      m.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    });
    this.scene.remove(this.root);
  }
}
