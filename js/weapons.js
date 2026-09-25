import * as THREE from 'three';

export const WEAPON_DEFS = [
  {
    id: 'pistol',
    name: 'Prisma Pulse',
    damage: 35,
    magSize: 15,
    maxAmmo: 90,
    fireRate: .22,
    range: 120,
    color: 0x38bdf8,
    icon: 'crisis_alert',
    recoil: .06,
    sound: 'shootPistol',
    isAuto: false
  },
  {
    id: 'smg',
    name: 'Neon Stinger',
    damage: 22,
    magSize: 40,
    maxAmmo: 240,
    fireRate: .085,
    range: 90,
    color: 0x4ddac2,
    icon: 'bolt',
    recoil: .04,
    sound: 'shootSMG',
    isAuto: true
  },
  {
    id: 'rifle',
    name: 'Vortex AR-9',
    damage: 55,
    magSize: 30,
    maxAmmo: 180,
    fireRate: .14,
    range: 150,
    color: 0xffc24d,
    icon: 'military_tech',
    recoil: .09,
    sound: 'shootRifle',
    isAuto: true
  },
  {
    id: 'sniper',
    name: 'Helios Railgun',
    damage: 260,
    magSize: 5,
    maxAmmo: 30,
    fireRate: 1.1,
    range: 280,
    color: 0x9ad1ff,
    icon: 'flare',
    recoil: .25,
    sound: 'shootSniper',
    isAuto: false,
    hasScope: true
  }
];

export class WeaponManager {
  constructor(camera, scene, sfx) {
    this.camera = camera;
    this.scene = scene;
    this.sfx = sfx;
    this.currentIndex = 0;
    this.ammo = WEAPON_DEFS.map(w => ({ mag: w.magSize, reserve: w.maxAmmo }));
    this.lastShotTime = 0;
    this.isScoped = false;
    this.tracers = [];
    this.floatingTexts = [];
    this.recoilOffset = new THREE.Vector3();
    this.buildGunModels();
  }

  buildGunModels() {
    this.gunGroup = new THREE.Group();
    this.camera.add(this.gunGroup);
    this.gunGroup.position.set(.28, -.24, -.52);

    // Muzzle flash light
    this.muzzleLight = new THREE.PointLight(0xffeedd, 0, 8);
    this.muzzleLight.position.set(0, 0, -.4);
    this.gunGroup.add(this.muzzleLight);

    // Individual gun meshes
    this.gunMeshes = [];
    WEAPON_DEFS.forEach((def, i) => {
      const g = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x221a28, roughness: .4, metalness: .7 });
      const accentMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: .3, metalness: .8 });
      const glowMat = new THREE.MeshBasicMaterial({ color: def.color, toneMapped: false });

      if (def.id === 'pistol') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(.09, .14, .32), bodyMat);
        const barrel = new THREE.Mesh(new THREE.BoxGeometry(.07, .07, .24), accentMat);
        barrel.position.set(0, .03, -.15);
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(.095, .02, .26), glowMat);
        stripe.position.set(0, .06, 0);
        g.add(body, barrel, stripe);
      } else if (def.id === 'smg') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(.11, .16, .44), bodyMat);
        const mag = new THREE.Mesh(new THREE.BoxGeometry(.06, .22, .09), accentMat);
        mag.position.set(0, -.14, -.04);
        mag.rotation.x = .2;
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .22, 10), glowMat);
        barrel.rotateX(Math.PI / 2);
        barrel.position.set(0, .02, -.32);
        g.add(body, mag, barrel);
      } else if (def.id === 'rifle') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(.11, .15, .62), bodyMat);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.032, .032, .38, 12), accentMat);
        barrel.rotateX(Math.PI / 2);
        barrel.position.set(0, .02, -.45);
        const stock = new THREE.Mesh(new THREE.BoxGeometry(.09, .14, .25), accentMat);
        stock.position.set(0, -.03, .38);
        const lightStrip = new THREE.Mesh(new THREE.BoxGeometry(.115, .025, .45), glowMat);
        lightStrip.position.set(0, .065, -.08);
        g.add(body, barrel, stock, lightStrip);
      } else if (def.id === 'sniper') {
        const body = new THREE.Mesh(new THREE.BoxGeometry(.12, .16, .78), bodyMat);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.035, .025, .65, 12), accentMat);
        barrel.rotateX(Math.PI / 2);
        barrel.position.set(0, .03, -.65);
        const scope = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .28, 12), glowMat);
        scope.rotateX(Math.PI / 2);
        scope.position.set(0, .14, -.05);
        g.add(body, barrel, scope);
      }

      g.visible = i === this.currentIndex;
      this.gunGroup.add(g);
      this.gunMeshes.push(g);
    });
  }

  select(index) {
    if (index < 0 || index >= WEAPON_DEFS.length || index === this.currentIndex) return;
    this.currentIndex = index;
    this.gunMeshes.forEach((g, i) => g.visible = i === index);
    this.isScoped = false;
    this.sfx.tone({ f: 480, f2: 640, t: .08, type: 'triangle', g: .12 });
  }

  refillAllAmmo() {
    this.ammo.forEach((a, i) => {
      a.mag = WEAPON_DEFS[i].magSize;
      a.reserve = WEAPON_DEFS[i].maxAmmo;
    });
    this.sfx.tone({ f: 380, f2: 820, t: .2, type: 'sine', g: .2 });
  }

  current() {
    return WEAPON_DEFS[this.currentIndex];
  }

  currentAmmo() {
    return this.ammo[this.currentIndex];
  }

  shoot(monsterSystem, playerPos) {
    const def = this.current();
    const ammoObj = this.currentAmmo();
    const now = performance.now() / 1000;

    if (now - this.lastShotTime < def.fireRate) return false;
    if (ammoObj.mag <= 0) {
      if (ammoObj.reserve > 0) {
        // Auto reload
        this.reload();
      } else {
        this.sfx.tone({ f: 200, f2: 120, t: .06, type: 'square', g: .05 });
      }
      return false;
    }

    ammoObj.mag--;
    this.lastShotTime = now;

    // Audio
    if (typeof this.sfx[def.sound] === 'function') {
      this.sfx[def.sound]();
    }

    // Gun kickback recoil animation
    this.recoilOffset.z = def.recoil;
    this.recoilOffset.y = def.recoil * .4;
    this.muzzleLight.intensity = 15;
    setTimeout(() => { this.muzzleLight.intensity = 0; }, 40);

    // Raycast forward from camera center
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    raycaster.far = def.range;

    // Check hit against active monsters
    let hitPoint = null;
    let hitMonster = null;
    let isCritical = false;

    if (monsterSystem && monsterSystem.monsters.length > 0) {
      const hitResult = monsterSystem.checkHit(raycaster, def.damage);
      if (hitResult) {
        hitPoint = hitResult.point;
        hitMonster = hitResult.monster;
        isCritical = hitResult.crit;
      }
    }

    if (!hitPoint) {
      // Default hit into distance
      const dir = raycaster.ray.direction.clone();
      hitPoint = this.camera.position.clone().addScaledVector(dir, def.range);
    }

    // Spawn visual tracer beam
    this.spawnTracer(this.gunGroup.getWorldPosition(new THREE.Vector3()), hitPoint, def.color);

    // Trigger monster combat alert state if monsters aren't spawned yet
    if (monsterSystem) {
      monsterSystem.onWeaponFired(this.scene, playerPos);
    }

    return true;
  }

  reload() {
    const def = this.current();
    const ammoObj = this.currentAmmo();
    if (ammoObj.mag >= def.magSize || ammoObj.reserve <= 0) return;
    const needed = def.magSize - ammoObj.mag;
    const take = Math.min(needed, ammoObj.reserve);
    ammoObj.mag += take;
    ammoObj.reserve -= take;
    this.sfx.tone({ f: 400, f2: 600, t: .15, type: 'triangle', g: .12 });
  }

  spawnTracer(start, end, color) {
    const dir = new THREE.Vector3().subVectors(end, start);
    const len = dir.length();
    const geom = new THREE.CylinderGeometry(.025, .025, len, 6);
    geom.translate(0, len / 2, 0);
    geom.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: true, opacity: .95 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.copy(start);
    mesh.lookAt(end);
    this.scene.add(mesh);
    this.tracers.push({ mesh, life: .08 });
  }

  update(dt) {
    // Smoothly restore gun recoil offset
    this.recoilOffset.lerp(new THREE.Vector3(0, 0, 0), dt * 14);
    const basePos = this.isScoped ? new THREE.Vector3(0, -.18, -.35) : new THREE.Vector3(.28, -.24, -.52);
    this.gunGroup.position.copy(basePos).add(this.recoilOffset);

    // Update tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const tr = this.tracers[i];
      tr.life -= dt;
      tr.mesh.material.opacity = Math.max(0, tr.life / .08);
      if (tr.life <= 0) {
        this.scene.remove(tr.mesh);
        tr.mesh.geometry.dispose();
        tr.mesh.material.dispose();
        this.tracers.splice(i, 1);
      }
    }
  }
}
