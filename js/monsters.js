import * as THREE from 'three';

export class MonsterSystem {
  constructor(sfx) {
    this.sfx = sfx;
    this.monsters = [];
    this.titan = null;
    this.alertActive = false;
    this.floatingTexts = [];
    this.dustParticles = [];
  }

  onWeaponFired(scene, playerPos) {
    // When a shot is fired and no monsters are present, spawn an encounter
    if (!this.alertActive && this.monsters.length === 0 && !this.titan) {
      this.spawnRaid(scene, playerPos);
    }
  }

  spawnRaid(scene, playerPos) {
    this.alertActive = true;
    this.sfx.alarmRaid();

    // 1. Spawn small Shadow Crawlers around the area
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.random() * .4;
      const r = 24 + Math.random() * 12;
      const mx = playerPos.x + Math.cos(a) * r;
      const mz = playerPos.z + Math.sin(a) * r;
      this.spawnCrawler(scene, mx, mz);
    }

    // 2. Spawn medium Golems
    for (let i = 0; i < 2; i++) {
      const a = (i / 2) * Math.PI * 2 + 1.2;
      const r = 32 + Math.random() * 10;
      this.spawnGolem(scene, playerPos.x + Math.cos(a) * r, playerPos.z + Math.sin(a) * r);
    }

    // 3. Spawn TITAN RAKSASA!
    const titanAngle = Math.random() * Math.PI * 2;
    const titanDist = 48;
    this.spawnTitan(scene, playerPos.x + Math.cos(titanAngle) * titanDist, playerPos.z + Math.sin(titanAngle) * titanDist);

    // Show Boss Bar
    const bb = document.getElementById('bossBar');
    if (bb) {
      bb.classList.remove('hidden');
      document.getElementById('bbHp').textContent = '1800 / 1800';
      document.getElementById('bbFill').style.width = '100%';
    }

    // Notify user
    const snackbar = window.snackbar;
    if (snackbar) snackbar('⚠️ ANOMALI MONSTER MUNCUL! TITAN RAKSASA MEMASUKI DUNIA!');
  }

  spawnCrawler(scene, x, z) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x221326, roughness: .6 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3567, toneMapped: false });

    // Spiky insectoid body
    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(.65), mat);
    body.position.y = .75;
    g.add(body);

    // Glowing eyes
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(.1, 6, 6), eyeMat);
    eyeL.position.set(-.22, .88, .45);
    const eyeR = eyeL.clone(); eyeR.position.x = .22;
    g.add(eyeL, eyeR);

    // Legs
    const legs = [];
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(new THREE.ConeGeometry(.1, 1.1, 4), mat);
      const side = (i % 2 === 0) ? -1 : 1;
      const front = (i < 2) ? .35 : -.35;
      leg.position.set(side * .6, .45, front);
      leg.rotation.z = side * .55;
      g.add(leg);
      legs.push(leg);
    }

    g.position.set(x, 0, z);
    scene.add(g);

    this.monsters.push({
      type: 'crawler',
      name: 'Shadow Crawler',
      mesh: g,
      legs,
      pos: g.position,
      hp: 45,
      maxHp: 45,
      speed: 5.5,
      radius: .9,
      scene
    });
  }

  spawnGolem(scene, x, z) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x3d304a, roughness: .9, metalness: .3 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x4ddac2, toneMapped: false });

    // Armored torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 1.2), mat);
    torso.position.y = 1.9;
    // Core rune
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(.35), glowMat);
    core.position.set(0, 1.9, .62);
    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(.7, .6, .7), mat);
    head.position.set(0, 3.2, 0);
    // Heavy arms
    const armL = new THREE.Mesh(new THREE.BoxGeometry(.5, 1.7, .5), mat);
    armL.position.set(-1.1, 2.0, 0);
    const armR = armL.clone(); armR.position.x = 1.1;
    // Legs
    const legL = new THREE.Mesh(new THREE.BoxGeometry(.6, 1.2, .6), mat);
    legL.position.set(-.45, .6, 0);
    const legR = legL.clone(); legR.position.x = .45;

    g.add(torso, core, head, armL, armR, legL, legR);
    g.position.set(x, 0, z);
    scene.add(g);

    this.monsters.push({
      type: 'golem',
      name: 'Cyber Golem',
      mesh: g,
      pos: g.position,
      armL,
      armR,
      core,
      hp: 180,
      maxHp: 180,
      speed: 3.2,
      radius: 1.6,
      scene
    });
  }

  spawnTitan(scene, x, z) {
    const g = new THREE.Group();
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x1f1422, roughness: .95 });
    const magmaMat = new THREE.MeshBasicMaterial({ color: 0xff3855, toneMapped: false });
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x100814, roughness: .8 });

    // Colossal Torso (16m total height scale)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(5.2, 6.5, 3.6), rockMat);
    torso.position.y = 9.8;

    // Glowing Magma Core (Weakpoint on chest!)
    const coreGeom = new THREE.DodecahedronGeometry(1.4);
    const core = new THREE.Mesh(coreGeom, magmaMat);
    core.position.set(0, 10.5, 1.9);

    // Giant Skull / Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 2.4), rockMat);
    head.position.set(0, 14.6, .4);

    // Horns
    const hornL = new THREE.Mesh(new THREE.ConeGeometry(.55, 3.2, 6), hornMat);
    hornL.position.set(-1.5, 16.4, 0);
    hornL.rotation.z = -.5;
    const hornR = hornL.clone();
    hornR.position.x = 1.5;
    hornR.rotation.z = .5;

    // Massive Arms
    const armL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 7.5, 1.6), rockMat);
    armL.position.set(-3.8, 8.5, 0);
    const armR = armL.clone();
    armR.position.x = 3.8;

    // Colossal Legs
    const legL = new THREE.Mesh(new THREE.BoxGeometry(1.9, 7.0, 2.2), rockMat);
    legL.position.set(-1.6, 3.5, 0);
    const legR = legL.clone();
    legR.position.x = 1.6;

    g.add(torso, core, head, hornL, hornR, armL, armR, legL, legR);
    g.position.set(x, 0, z);
    scene.add(g);

    this.titan = {
      mesh: g,
      pos: g.position,
      core,
      armL,
      armR,
      legL,
      legR,
      hp: 1800,
      maxHp: 1800,
      speed: 2.2,
      stompTimer: 0,
      radius: 4.5,
      scene
    };

    this.sfx.titanRoar();
  }

  checkHit(raycaster, damage) {
    let closestHit = null;
    let closestDist = Infinity;
    let hitMonster = null;
    let isCrit = false;

    // 1. Check Titan
    if (this.titan && this.titan.hp > 0) {
      // Check weakpoint core
      const coreIntersects = raycaster.intersectObject(this.titan.core);
      if (coreIntersects.length > 0 && coreIntersects[0].distance < closestDist) {
        closestDist = coreIntersects[0].distance;
        closestHit = coreIntersects[0].point;
        hitMonster = this.titan;
        isCrit = true;
      } else {
        const bodyIntersects = raycaster.intersectObject(this.titan.mesh, true);
        if (bodyIntersects.length > 0 && bodyIntersects[0].distance < closestDist) {
          closestDist = bodyIntersects[0].distance;
          closestHit = bodyIntersects[0].point;
          hitMonster = this.titan;
          isCrit = false;
        }
      }
    }

    // 2. Check other monsters
    for (const m of this.monsters) {
      if (m.hp <= 0) continue;
      const intersects = raycaster.intersectObject(m.mesh, true);
      if (intersects.length > 0 && intersects[0].distance < closestDist) {
        closestDist = intersects[0].distance;
        closestHit = intersects[0].point;
        hitMonster = m;
        isCrit = false;
      }
    }

    if (hitMonster) {
      const actualDamage = isCrit ? Math.round(damage * 2.8) : damage;
      hitMonster.hp -= actualDamage;

      // Audio feedback
      this.sfx.hitMonster(isCrit);

      // Spawn floating damage indicator
      this.spawnDamageText(closestHit, actualDamage, isCrit);

      // Flinch / Flash effect
      hitMonster.mesh.traverse(child => {
        if (child.material && child.material.color) {
          const oldColor = child.material.color.getHex();
          child.material.color.setHex(0xffffff);
          setTimeout(() => {
            try { child.material.color.setHex(oldColor); } catch (e) { }
          }, 60);
        }
      });

      // Check Boss Bar update
      if (hitMonster === this.titan) {
        const pct = Math.max(0, this.titan.hp / this.titan.maxHp);
        document.getElementById('bbHp').textContent = `${Math.max(0, this.titan.hp)} / ${this.titan.maxHp}`;
        document.getElementById('bbFill').style.width = `${pct * 100}%`;
      }

      // Check death
      if (hitMonster.hp <= 0) {
        this.killMonster(hitMonster);
      }

      return { point: closestHit, monster: hitMonster, crit: isCrit };
    }

    return null;
  }

  killMonster(m) {
    this.sfx.monsterDeath();

    // Death explosion particles
    if (m === this.titan) {
      this.sfx.fanfare();
      document.getElementById('bossBar').classList.add('hidden');
      if (window.snackbar) window.snackbar('🎉 TITAN RAKSASA TELAH DIKALAHKAN! Dunia kembali aman!');
      this.titan.scene.remove(this.titan.mesh);
      this.titan = null;
      if (this.monsters.length === 0) this.alertActive = false;
    } else {
      m.scene.remove(m.mesh);
      const idx = this.monsters.indexOf(m);
      if (idx !== -1) this.monsters.splice(idx, 1);
      if (this.monsters.length === 0 && !this.titan) {
        this.alertActive = false;
        if (window.snackbar) window.snackbar('Semua monster di area telah dibasmi!');
      }
    }
  }

  spawnDamageText(pos, dmg, isCrit) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = isCrit ? 'bold 36px Sora, sans-serif' : 'bold 28px Sora, sans-serif';
    ctx.fillStyle = isCrit ? '#ffc24d' : '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000'; ctx.shadowBlur = 8;
    ctx.fillText(isCrit ? `CRIT -${dmg}` : `-${dmg}`, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(isCrit ? 2.5 : 1.8, isCrit ? 1.25 : .9, 1);
    sprite.position.copy(pos).add(new THREE.Vector3(0, .6, 0));

    const targetScene = (this.titan && this.titan.scene) || (this.monsters[0] && this.monsters[0].scene);
    if (targetScene) {
      targetScene.add(sprite);
      this.floatingTexts.push({ sprite, life: .75, scene: targetScene });
    }
  }

  update(dt, playerPos, camera) {
    // 1. Update Crawlers & Golems
    for (const m of this.monsters) {
      if (m.hp <= 0) continue;
      const dx = playerPos.x - m.pos.x;
      const dz = playerPos.z - m.pos.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 1.2) {
        const nx = dx / dist;
        const nz = dz / dist;
        m.pos.x += nx * m.speed * dt;
        m.pos.z += nz * m.speed * dt;
        m.mesh.rotation.y = Math.atan2(nx, nz);

        // Crawler leg animation
        if (m.legs) {
          const t = performance.now() / 100;
          m.legs.forEach((leg, i) => {
            leg.rotation.x = Math.sin(t + i * Math.PI / 2) * .45;
          });
        }
      }
    }

    // 2. Update TITAN
    if (this.titan && this.titan.hp > 0) {
      const t = this.titan;
      const dx = playerPos.x - t.pos.x;
      const dz = playerPos.z - t.pos.z;
      const dist = Math.hypot(dx, dz);

      t.mesh.rotation.y = Math.atan2(dx, dz);

      if (dist > 4.5) {
        const nx = dx / dist;
        const nz = dz / dist;
        t.pos.x += nx * t.speed * dt;
        t.pos.z += nz * t.speed * dt;

        // Giant leg stride animation
        const stride = performance.now() / 420;
        t.legL.rotation.x = Math.sin(stride) * .35;
        t.legR.rotation.x = -Math.sin(stride) * .35;
        t.armL.rotation.x = -Math.sin(stride) * .3;
        t.armR.rotation.x = Math.sin(stride) * .3;

        // Earthquake Stomp & Camera Shake
        t.stompTimer += dt;
        if (t.stompTimer > 1.3) {
          t.stompTimer = 0;
          this.sfx.titanStomp();
          if (dist < 60) {
            const shake = Math.max(0, (60 - dist) / 60) * .025;
            camera.position.y += (Math.random() - .5) * shake;
            camera.position.x += (Math.random() - .5) * shake;
          }
        }
      }
    }

    // 3. Update floating damage numbers
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.sprite.position.y += dt * 1.8;
      ft.sprite.material.opacity = Math.max(0, ft.life / .75);
      if (ft.life <= 0) {
        ft.scene.remove(ft.sprite);
        ft.sprite.material.dispose();
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  clearAll() {
    this.monsters.forEach(m => m.scene.remove(m.mesh));
    this.monsters = [];
    if (this.titan) {
      this.titan.scene.remove(this.titan.mesh);
      this.titan = null;
    }
    this.floatingTexts.forEach(ft => ft.scene.remove(ft.sprite));
    this.floatingTexts = [];
    this.alertActive = false;
    const bb = document.getElementById('bossBar');
    if (bb) bb.classList.add('hidden');
  }
}
