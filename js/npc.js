import * as THREE from 'three';

export class NPCSystem {
  constructor(scene, world, sfx) {
    this.scene = scene;
    this.world = world;
    this.sfx = sfx;
    this.npcs = [];
    this.guardLaserCooldown = 0;
  }

  addNPC(def) {
    const g = new THREE.Group();
    const skin = new THREE.MeshLambertMaterial({ color: def.skin || 0xf2c9a0 });
    const cloth = new THREE.MeshStandardMaterial({ color: def.cloth || 0x38bdf8, roughness: .85 });
    const pants = new THREE.MeshStandardMaterial({ color: 0x16263a, roughness: .9 });
    const hairM = new THREE.MeshStandardMaterial({ color: def.hair || 0x182430, roughness: .9 });

    // Legs
    const legL = new THREE.Mesh(new THREE.BoxGeometry(.14, .54, .16), pants);
    legL.position.set(-.1, .27, 0);
    const legR = legL.clone(); legR.position.x = .1;

    // Body
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.18, .42, 3, 8), cloth);
    body.position.y = .84;

    // Arms
    const armL = new THREE.Mesh(new THREE.BoxGeometry(.1, .42, .12), cloth);
    armL.position.set(-.27, .92, 0);
    const armR = armL.clone(); armR.position.x = .27;

    // Head & Hair
    const head = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 10), skin);
    head.position.y = 1.28;
    const hair = new THREE.Mesh(new THREE.SphereGeometry(.165, 10, 10), hairM);
    hair.scale.set(1, .7, 1);
    hair.position.set(0, 1.34, -.04);

    g.add(legL, legR, body, armL, armR, head, hair);

    // If Guard: add weapon blaster & armor helmet
    let blaster = null;
    if (def.role === 'guard') {
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(.18, 8, 8), new THREE.MeshStandardMaterial({ color: 0x4ddac2, metalness: .8 }));
      helmet.position.y = 1.35;
      g.add(helmet);

      blaster = new THREE.Mesh(new THREE.BoxGeometry(.08, .12, .32), new THREE.MeshStandardMaterial({ color: 0x33e3ff }));
      blaster.position.set(.27, .82, .18);
      g.add(blaster);
    }

    g.position.set(def.x, 0, def.z);
    g.rotation.y = def.yaw || 0;
    this.scene.add(g);

    // Floating speech bubble element in 3D
    const bubbleCanvas = document.createElement('canvas');
    bubbleCanvas.width = 256; bubbleCanvas.height = 64;
    const bubbleTex = new THREE.CanvasTexture(bubbleCanvas);
    const bubbleSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex, transparent: true }));
    bubbleSprite.scale.set(2.2, .55, 1);
    bubbleSprite.position.set(0, 1.9, 0);
    bubbleSprite.visible = false;
    g.add(bubbleSprite);

    const npcObj = {
      id: def.id,
      name: def.name,
      role: def.role, // 'guard' or 'civilian'
      title: def.title,
      speech: def.speech,
      mesh: g,
      pos: g.position,
      armL,
      armR,
      legL,
      legR,
      blaster,
      bubbleCanvas,
      bubbleTex,
      bubbleSprite,
      origin: new THREE.Vector3(def.x, 0, def.z),
      state: 'idle', // 'idle', 'fleeing', 'combat'
      speechTimeout: 0,
      radius: 2.8
    };

    this.npcs.push(npcObj);
    return npcObj;
  }

  showBubble(npc, text, duration = 3000) {
    const ctx = npc.bubbleCanvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = (npc.role === 'guard') ? 'rgba(0, 56, 47, 0.9)' : 'rgba(255, 53, 103, 0.9)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(6, 6, 244, 52, 16);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Sora, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);

    npc.bubbleTex.needsUpdate = true;
    npc.bubbleSprite.visible = true;
    npc.speechTimeout = duration / 1000;
  }

  update(dt, monstersSystem, weaponManager) {
    const monsters = monstersSystem ? monstersSystem.monsters : [];
    const titan = monstersSystem ? monstersSystem.titan : null;
    const hasThreat = (monsters.length > 0) || (titan && titan.hp > 0);

    this.guardLaserCooldown -= dt;

    for (const npc of this.npcs) {
      // Speech timeout
      if (npc.speechTimeout > 0) {
        npc.speechTimeout -= dt;
        if (npc.speechTimeout <= 0) npc.bubbleSprite.visible = false;
      }

      if (hasThreat) {
        // Find nearest monster or Titan
        let nearest = null;
        let minDist = Infinity;
        if (titan && titan.hp > 0) {
          minDist = npc.pos.distanceTo(titan.pos);
          nearest = titan;
        }
        for (const m of monsters) {
          const d = npc.pos.distanceTo(m.pos);
          if (d < minDist) { minDist = d; nearest = m; }
        }

        if (nearest) {
          if (npc.role === 'civilian') {
            // Panic! Flee away from nearest monster
            const awayX = npc.pos.x - nearest.pos.x;
            const awayZ = npc.pos.z - nearest.pos.z;
            const len = Math.hypot(awayX, awayZ) || 1;
            npc.pos.x += (awayX / len) * 4.5 * dt;
            npc.pos.z += (awayZ / len) * 4.5 * dt;
            npc.mesh.rotation.y = Math.atan2(awayX, awayZ);

            // Wave arms in panic
            const pt = performance.now() / 80;
            npc.armL.rotation.x = 2.4 + Math.sin(pt) * .5;
            npc.armR.rotation.x = 2.4 - Math.sin(pt) * .5;

            // Occasional scream bubble
            if (npc.speechTimeout <= 0 && Math.random() < .008) {
              const screams = ['Awas Monster!!', 'Lariiii!', 'Ada Titan Raksasa!', 'Selamatkan diri!'];
              this.showBubble(npc, screams[Math.floor(Math.random() * screams.length)], 2400);
            }
          } else if (npc.role === 'guard') {
            // Guards stand ground and actively shoot at monsters!
            const toX = nearest.pos.x - npc.pos.x;
            const toZ = nearest.pos.z - nearest.pos.z;
            npc.mesh.rotation.y = Math.atan2(toX, toZ);

            // Aim blaster forward
            npc.armR.rotation.x = -Math.PI / 2;
            npc.armL.rotation.x = -Math.PI / 2;

            if (npc.speechTimeout <= 0 && Math.random() < .007) {
              const shouts = ['Tahan posisi!', 'Tembak monster itu!', 'Fokus ke Titan!', 'Bantu pemain!'];
              this.showBubble(npc, shouts[Math.floor(Math.random() * shouts.length)], 2500);
            }

            // Shoot defensive lasers!
            if (this.guardLaserCooldown <= 0 && minDist < 35) {
              this.guardLaserCooldown = .45;
              this.sfx.shootPistol();

              // Deal 24 damage to monster
              nearest.hp -= 24;
              monstersSystem.spawnDamageText(nearest.pos, 24, false);

              // Laser beam effect
              if (weaponManager) {
                weaponManager.spawnTracer(npc.pos.clone().add(new THREE.Vector3(0, 1.2, 0)), nearest.pos.clone().add(new THREE.Vector3(0, 1.5, 0)), 0x4ddac2);
              }

              if (nearest.hp <= 0) {
                monstersSystem.killMonster(nearest);
              }
            }
          }
        }
      } else {
        // Return arms to normal idle stance
        npc.armL.rotation.x *= Math.max(0, 1 - dt * 4);
        npc.armR.rotation.x *= Math.max(0, 1 - dt * 4);
      }
    }
  }

  getNearest(playerPos, maxDist = 3.5) {
    let best = null;
    let bDist = maxDist;
    for (const npc of this.npcs) {
      const d = playerPos.distanceTo(npc.pos);
      if (d < bDist) {
        bDist = d;
        best = npc;
      }
    }
    return best;
  }

  clear() {
    for (const npc of this.npcs) {
      this.scene.remove(npc.mesh);
    }
    this.npcs = [];
  }
}
