import * as THREE from 'three';

/**
 * Funfair Attractions & Park Decor Manager for Prisma Land
 * Handles rich 3D models and animations for:
 * 1. Biang Lala (Grand Ferris Wheel with hanging vertical gondolas)
 * 2. Komedi Putar (Ornate Carousel with animated bobbing horses)
 * 3. Roller Coaster (Prisma Cyclone with 3D train, tubular rails, sleepers, trestle supports & station)
 * 4. Menara Terjun Bebas (38m Drop Tower / Free Fall)
 * 5. Kapal Bajak Laut (Swinging Viking Pendulum Ship)
 * 6. Wahana Cangkir Berputar (Spinning Teacups & Giant Teapot)
 * 7. Arkade Musik "Prisma Beat" (Neon dance stage & arcade cabinet for Rhythm Game)
 * 8. Wahana Tembak Sasaran (Carnival Shooting Gallery Booth)
 * 9. Park Atmosphere (Popcorn & Cotton Candy stalls, festive bunting, balloon clusters)
 */

export class FunfairParkManager {
  constructor(world, scene) {
    this.world = world;
    this.scene = scene;

    // Materials cache for high performance
    this.mat = {
      gold: new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.8, roughness: 0.25 }),
      brass: new THREE.MeshStandardMaterial({ color: 0xe6b800, metalness: 0.85, roughness: 0.3 }),
      steel: new THREE.MeshStandardMaterial({ color: 0xd0d8e2, metalness: 0.75, roughness: 0.35 }),
      darkSteel: new THREE.MeshStandardMaterial({ color: 0x3a4250, metalness: 0.8, roughness: 0.4 }),
      magenta: new THREE.MeshStandardMaterial({ color: 0xff3b94, roughness: 0.4 }),
      cyan: new THREE.MeshStandardMaterial({ color: 0x00d2ff, roughness: 0.35 }),
      blue: new THREE.MeshStandardMaterial({ color: 0x1976d2, roughness: 0.4 }),
      wood: new THREE.MeshStandardMaterial({ color: 0x8d5b36, roughness: 0.85 }),
      darkWood: new THREE.MeshStandardMaterial({ color: 0x4e301d, roughness: 0.9 }),
      whiteGlow: new THREE.MeshBasicMaterial({ color: 0xffffff }),
      neonCyan: new THREE.MeshBasicMaterial({ color: 0x00f0ff }),
      neonPink: new THREE.MeshBasicMaterial({ color: 0xff2a85 }),
      neonGold: new THREE.MeshBasicMaterial({ color: 0xffea00 }),
      carnivalRed: new THREE.MeshStandardMaterial({ color: 0xee2c38, roughness: 0.5 }),
      carnivalWhite: new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.6 }),
      stripedRoof: this.createStripedMaterial(0xee2c38, 0xffffff),
      glass: new THREE.MeshPhysicalMaterial({ color: 0xe0f7fa, transparent: true, opacity: 0.45, roughness: 0.1, transmission: 0.8 })
    };

    // Animation tracking states
    this.wheelAng = 0;
    this.carAng = 0;
    this.teacupsAng = 0;
    this.shipAng = 0;
    this.dropY = 2;
    this.dropState = 'climb'; // 'climb', 'wait', 'drop', 'brake'
    this.dropTimer = 0;
    this.coasterTrainProgress = 0;

    // References to groups for updates
    this.ferrisWheel = null;
    this.gondolas = [];
    this.carousel = null;
    this.horses = [];
    this.dropCarriage = null;
    this.vikingShip = null;
    this.teacupsGroup = null;
    this.individualCups = [];
    this.coasterTrain = null;
    this.balloonGroups = [];

    // Build the grand park!
    this.buildGrandFerrisWheel();
    this.buildGrandCarousel();
    this.buildGrandCoasterSystem();
    this.buildDropTower();
    this.buildVikingShip();
    this.buildSpinningTeacups();
    this.buildRhythmArcadeBooth();
    this.buildShootingGalleryBooth();
    this.buildParkAtmosphere();
  }

  createStripedMaterial(c1, c2) {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#' + new THREE.Color(c1).getHexString();
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#' + new THREE.Color(c2).getHexString();
    for (let x = 0; x < 64; x += 16) {
      ctx.fillRect(x, 0, 8, 64);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 1);
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 });
  }

  /* ================= 1. BIANGLALA (GRAND FERRIS WHEEL) ================= */
  buildGrandFerrisWheel() {
    const S = this.scene;
    this.wheelX = 36;
    this.wheelY = 16;
    this.wheelZ = -18;
    this.wheelR = 12.5;

    const baseGroup = new THREE.Group();
    baseGroup.position.set(this.wheelX, 0, this.wheelZ);

    // Boarding Platform & Stairs
    const platGeo = new THREE.BoxGeometry(10, 1.2, 8);
    const plat = new THREE.Mesh(platGeo, this.mat.wood);
    plat.position.set(0, 0.6, 2.5);
    baseGroup.add(plat);

    // Platform Railings
    const railMat = this.mat.brass;
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.9, 0.1), railMat);
    r1.position.set(0, 1.6, 6.4);
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 7.8), railMat);
    r2.position.set(-4.9, 1.6, 2.5);
    const r3 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 7.8), railMat);
    r3.position.set(4.9, 1.6, 2.5);
    baseGroup.add(r1, r2, r3);

    // Entrance Steps
    for (let s = 0; s < 3; s++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(3, 0.35, 0.7), this.mat.darkWood);
      step.position.set(0, 0.18 + s * 0.35, 6.7 + s * 0.65);
      baseGroup.add(step);
    }

    // A-Frame Support Towers (Left & Right)
    const legGeo = new THREE.CylinderGeometry(0.35, 0.55, 17, 8);
    const legMat = this.mat.blue;

    [-3.2, 3.2].forEach(zOff => {
      // Front Leg
      const legF = new THREE.Mesh(legGeo, legMat);
      legF.position.set(-4.2, 8.2, zOff);
      legF.rotation.z = -0.28;
      // Back Leg
      const legB = new THREE.Mesh(legGeo, legMat);
      legB.position.set(4.2, 8.2, zOff);
      legB.rotation.z = 0.28;
      // Cross braces
      const brace = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.25, 0.25), this.mat.steel);
      brace.position.set(0, 7.5, zOff);
      baseGroup.add(legF, legB, brace);
    });

    // Central Axle Hub
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 7.2, 16), this.mat.gold);
    axle.rotation.x = Math.PI / 2;
    axle.position.set(0, this.wheelY, 0);
    baseGroup.add(axle);

    // Rotating Wheel Structure
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(0, this.wheelY, 0);

    // Dual Concentric Steel Rims
    const outerRimGeo = new THREE.TorusGeometry(this.wheelR, 0.22, 8, 36);
    const innerRimGeo = new THREE.TorusGeometry(this.wheelR * 0.72, 0.16, 8, 36);
    const rimMat = this.mat.cyan;

    [-1.2, 1.2].forEach(z => {
      const oRim = new THREE.Mesh(outerRimGeo, rimMat);
      oRim.position.z = z;
      const iRim = new THREE.Mesh(innerRimGeo, this.mat.steel);
      iRim.position.z = z;
      wheelGroup.add(oRim, iRim);
    });

    // Spokes and 12 Gondolas
    const NUM_GONDOLAS = 12;
    const spokeGeo = new THREE.CylinderGeometry(0.08, 0.08, this.wheelR * 2, 6);
    const gondolaColors = [0xff3366, 0x00ccff, 0xffd200, 0x00e676, 0xaa00ff, 0xff9100];

    for (let i = 0; i < NUM_GONDOLAS; i++) {
      const ang = (i / NUM_GONDOLAS) * Math.PI * 2;
      // Radial Spokes
      if (i < NUM_GONDOLAS / 2) {
        [-1.2, 1.2].forEach(z => {
          const spoke = new THREE.Mesh(spokeGeo, this.mat.steel);
          spoke.rotation.z = ang;
          spoke.position.z = z;
          wheelGroup.add(spoke);
        });
      }

      // Crossbars between rims
      const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.4, 6), this.mat.gold);
      cb.rotation.x = Math.PI / 2;
      cb.position.set(Math.cos(ang) * this.wheelR, Math.sin(ang) * this.wheelR, 0);
      wheelGroup.add(cb);

      // Gondola Cabin Group
      const gGroup = new THREE.Group();
      gGroup.position.set(Math.cos(ang) * this.wheelR, Math.sin(ang) * this.wheelR, 0);

      // Cabin Body
      const cCol = gondolaColors[i % gondolaColors.length];
      const cabinMat = new THREE.MeshStandardMaterial({ color: cCol, roughness: 0.35 });
      const cabinBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.3, 1.4), cabinMat);
      cabinBase.position.y = -0.7;

      // Cabin Roof
      const cabinRoof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.65, 4), this.mat.gold);
      cabinRoof.rotation.y = Math.PI / 4;
      cabinRoof.position.y = 0.25;

      // Cabin Windows
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.45, 1.42), this.mat.glass);
      win.position.y = -0.4;

      // Suspension Hanger Bar
      const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 6), this.mat.steel);
      hanger.position.y = 0;

      // Cabin Light inside
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), this.mat.whiteGlow);
      glow.position.y = -0.3;

      gGroup.add(hanger, cabinBase, cabinRoof, win, glow);
      wheelGroup.add(gGroup);

      this.gondolas.push({ group: gGroup, angle: ang });
    }

    // Center Star Emblem
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(1.4), this.mat.neonGold);
    star.position.set(0, 0, 1.3);
    wheelGroup.add(star);

    baseGroup.add(wheelGroup);
    S.add(baseGroup);

    this.ferrisWheel = wheelGroup;
  }

  /* ================= 2. KOMEDI PUTAR (GRAND CAROUSEL) ================= */
  buildGrandCarousel() {
    const S = this.scene;
    this.carX = 0;
    this.carZ = -6;

    const carGroup = new THREE.Group();
    carGroup.position.set(this.carX, 0, this.carZ);

    // Decorative stepped circular base
    const baseP1 = new THREE.Mesh(new THREE.CylinderGeometry(6.6, 6.8, 0.3, 32), this.mat.darkWood);
    baseP1.position.y = 0.15;
    const baseP2 = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.4, 0.35, 32), this.mat.gold);
    baseP2.position.y = 0.45;
    carGroup.add(baseP1, baseP2);

    // Central Mirrored Pillar with lights
    const centerCol = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 4.8, 16), this.mat.brass);
    centerCol.position.y = 2.8;
    carGroup.add(centerCol);

    // Central Column Ornate Crests
    for (let c = 0; c < 6; c++) {
      const crestAng = (c / 6) * Math.PI * 2;
      const crest = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3.2, 0.6), this.mat.gold);
      crest.position.set(Math.cos(crestAng) * 1.7, 2.8, Math.sin(crestAng) * 1.7);
      crest.rotation.y = -crestAng;
      carGroup.add(crest);
    }

    // Carousel Rotating Platform & Roof Group
    const rotor = new THREE.Group();
    rotor.position.y = 0.65;

    // Wooden deck floor
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(5.8, 5.8, 0.18, 32), this.mat.wood);
    rotor.add(deck);

    // Ornate Pavilion Canopy Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(6.2, 2.4, 24), this.mat.stripedRoof);
    roof.position.y = 4.8;
    rotor.add(roof);

    // Golden Spire on top of Carousel
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.6, 8), this.mat.gold);
    spire.position.y = 6.4;
    rotor.add(spire);

    // Scalloped Valance / Fringe with Light Bulbs
    for (let b = 0; b < 24; b++) {
      const bAng = (b / 24) * Math.PI * 2;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), (b % 2 === 0) ? this.mat.neonGold : this.mat.neonPink);
      bulb.position.set(Math.cos(bAng) * 6.0, 3.8, Math.sin(bAng) * 6.0);
      rotor.add(bulb);
    }

    // 10 Bobbing Carousel Horses on Brass Spiral Poles
    const NUM_HORSES = 10;
    const horseColors = [0xffffff, 0x3d2010, 0xd0c0a0, 0x222222, 0xf0e6d2];

    for (let i = 0; i < NUM_HORSES; i++) {
      const ang = (i / NUM_HORSES) * Math.PI * 2;
      const radius = (i % 2 === 0) ? 4.2 : 2.7; // Outer & Inner concentric rings

      const horseGroup = new THREE.Group();
      horseGroup.position.set(Math.cos(ang) * radius, 0, Math.sin(ang) * radius);
      horseGroup.rotation.y = -ang + Math.PI / 2; // Facing tangential direction!

      // Golden Brass Vertical Pole
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.2, 8), this.mat.brass);
      pole.position.y = 2.1;
      horseGroup.add(pole);

      // Modelled Horse Body
      const hColor = horseColors[i % horseColors.length];
      const hMat = new THREE.MeshStandardMaterial({ color: hColor, roughness: 0.6 });

      const mount = new THREE.Group();
      mount.position.y = 1.35; // Default height

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.52, 1.2), hMat);
      // Neck & Head
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.6, 0.35), hMat);
      neck.position.set(0, 0.42, 0.45);
      neck.rotation.x = -0.3;
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.45), hMat);
      head.position.set(0, 0.72, 0.62);
      // Ears
      const earL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), hMat);
      earL.position.set(-0.1, 0.94, 0.52);
      const earR = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), hMat);
      earR.position.set(0.1, 0.94, 0.52);
      // Colorful Saddle
      const saddleMat = new THREE.MeshStandardMaterial({ color: (i % 2 === 0) ? 0xee2c38 : 0x1976d2, roughness: 0.4 });
      const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.14, 0.58), saddleMat);
      saddle.position.set(0, 0.28, 0.0);
      // Golden Stirrups
      const stirrup = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.42, 0.08), this.mat.gold);
      stirrup.position.set(0, 0.05, 0.0);
      // Mane & Tail
      const mane = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.3), this.mat.gold);
      mane.position.set(0, 0.58, 0.35);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.09, 0.5, 6), this.mat.gold);
      tail.position.set(0, -0.15, -0.65);
      tail.rotation.x = 0.5;

      // Legs (galloping pose)
      const legGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.6, 6);
      const fl = new THREE.Mesh(legGeo, hMat); fl.position.set(-0.16, -0.4, 0.45); fl.rotation.x = 0.4;
      const fr = new THREE.Mesh(legGeo, hMat); fr.position.set(0.16, -0.4, 0.45); fr.rotation.x = 0.2;
      const bl = new THREE.Mesh(legGeo, hMat); bl.position.set(-0.16, -0.4, -0.45); bl.rotation.x = -0.5;
      const br = new THREE.Mesh(legGeo, hMat); br.position.set(0.16, -0.4, -0.45); br.rotation.x = -0.3;

      mount.add(torso, neck, head, earL, earR, saddle, stirrup, mane, tail, fl, fr, bl, br);
      horseGroup.add(mount);
      rotor.add(horseGroup);

      this.horses.push({ mount, baseY: 1.35, phase: i * 0.85 });
    }

    carGroup.add(rotor);

    // Surrounding Fence & Ticket Booth
    const fenceMat = this.mat.carnivalWhite;
    for (let f = 0; f < 18; f++) {
      if (f === 0 || f === 1) continue; // Opening gate
      const fAng = (f / 18) * Math.PI * 2;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.1, 8), fenceMat);
      post.position.set(Math.cos(fAng) * 7.5, 0.55, Math.sin(fAng) * 7.5);
      carGroup.add(post);
    }

    S.add(carGroup);
    this.carousel = rotor;
  }

  /* ================= 3. ROLLER COASTER (PRISMA CYCLONE) ================= */
  buildGrandCoasterSystem() {
    const S = this.scene;
    const NP = 240;
    const pts = [];

    // Grand Coaster Circuit with high-speed banked turns and camelback airtime hills
    for (let i = 0; i < NP; i++) {
      const t = i / NP, th = t * Math.PI * 2;
      const R = 96 + 28 * Math.sin(th * 3) + 8 * Math.cos(th * 5);
      // Realistic drops and climbs
      let y = 3.5 + 20 * Math.sin(th * 2 + 0.8);
      if (th > 1.8 && th < 3.8) y += 16 * Math.sin((th - 1.8) / 2 * Math.PI); // Big peak hill
      pts.push(new THREE.Vector3(Math.cos(th) * R, Math.max(2.8, y), Math.sin(th) * R));
    }

    this.curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
    const L = this.curve.getLength();
    this.world.coaster = { curve: this.curve, L, totalLaps: 6 };

    // Station Location
    const p0 = this.curve.getPointAt(0);
    this.stX = p0.x - 3.5;
    this.stZ = p0.z;
    this.world.stX = this.stX;
    this.world.stZ = this.stZ;

    // Track Geometry:
    // 1. Central Heavy Spine
    const spineMat = new THREE.MeshStandardMaterial({ color: 0x00d2ff, metalness: 0.85, roughness: 0.25 });
    const spineGeo = new THREE.TubeGeometry(this.curve, 380, 0.26, 8, true);
    S.add(new THREE.Mesh(spineGeo, spineMat));

    // 2. Parallel Tubular Running Rails (Left & Right)
    const railMat = new THREE.MeshStandardMaterial({ color: 0xf0f4f8, metalness: 0.9, roughness: 0.2 });
    const leftPts = [], rightPts = [];
    const SAMPLE_STEPS = 360;

    for (let i = 0; i < SAMPLE_STEPS; i++) {
      const u = i / SAMPLE_STEPS;
      const pt = this.curve.getPointAt(u);
      const tangent = this.curve.getTangentAt(u).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();

      leftPts.push(pt.clone().addScaledVector(normal, 0.48).add(new THREE.Vector3(0, 0.15, 0)));
      rightPts.push(pt.clone().addScaledVector(normal, -0.48).add(new THREE.Vector3(0, 0.15, 0)));

      // Sleeper Ties every few meters
      if (i % 3 === 0) {
        const tieGeo = new THREE.BoxGeometry(1.2, 0.1, 0.2);
        const tie = new THREE.Mesh(tieGeo, this.mat.darkSteel);
        tie.position.copy(pt);
        tie.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), normal);
        S.add(tie);
      }

      // Vertical Steel Lattice Support Columns down to ground (y = 0)
      if (i % 8 === 0 && pt.y > 4.5) {
        const h = pt.y;
        const colGeo = new THREE.CylinderGeometry(0.3, 0.42, h, 8);
        const col = new THREE.Mesh(colGeo, this.mat.steel);
        col.position.set(pt.x, h / 2, pt.z);

        // Concrete Footer at base
        const footer = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.5, 8), this.mat.darkSteel);
        footer.position.set(pt.x, 0.25, pt.z);
        S.add(col, footer);
      }
    }

    const lCurve = new THREE.CatmullRomCurve3(leftPts, true);
    const rCurve = new THREE.CatmullRomCurve3(rightPts, true);
    S.add(new THREE.Mesh(new THREE.TubeGeometry(lCurve, 380, 0.1, 6, true), railMat));
    S.add(new THREE.Mesh(new THREE.TubeGeometry(rCurve, 380, 0.1, 6, true), railMat));

    // Coaster Station Depot Platform
    this.buildCoasterStation(S, p0);

    // 3-Car Coaster Train Model
    this.buildCoasterTrain(S);
  }

  buildCoasterStation(S, p0) {
    const stationGroup = new THREE.Group();
    stationGroup.position.set(this.stX, 0, this.stZ);

    // Elevated Wooden/Concrete Boarding Deck
    const deck = new THREE.Mesh(new THREE.BoxGeometry(12, 1.4, 8), this.mat.darkSteel);
    deck.position.set(0, 0.7, 0);
    stationGroup.add(deck);

    // Canopy Roof over Station
    const cRoof = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 10), this.mat.magenta);
    cRoof.position.set(0, 5.2, 0);
    stationGroup.add(cRoof);

    // Station Support Pillars
    const pMat = this.mat.steel;
    [[-5.8, -3.8], [-5.8, 3.8], [5.8, -3.8], [5.8, 3.8]].forEach(([x, z]) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4.8, 8), pMat);
      p.position.set(x, 2.8, z);
      stationGroup.add(p);
    });

    // Station Sign
    const signBox = new THREE.Mesh(new THREE.BoxGeometry(7, 1.1, 0.2), this.mat.neonCyan);
    signBox.position.set(0, 4.2, 4.1);
    stationGroup.add(signBox);

    S.add(stationGroup);
  }

  buildCoasterTrain(S) {
    this.coasterTrain = new THREE.Group();
    this.trainCars = [];

    // Create 3 linked cars: Front Engine + 2 Passenger Cars
    const NUM_CARS = 3;
    const CAR_COLORS = [0x00d2ff, 0xff3b94, 0x00d2ff];

    for (let c = 0; c < NUM_CARS; c++) {
      const car = new THREE.Group();
      const carMat = new THREE.MeshStandardMaterial({ color: CAR_COLORS[c], metalness: 0.6, roughness: 0.3 });

      // Car Chassis
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 2.4), carMat);
      body.position.y = 0.55;

      // Aerodynamic Front Wedge for Engine Car
      if (c === 0) {
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.2, 4), carMat);
        nose.rotation.y = Math.PI / 4;
        nose.rotation.x = Math.PI / 2;
        nose.position.set(0, 0.45, 1.4);
        car.add(nose);

        // Headlights
        const hl1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), this.mat.whiteGlow);
        hl1.position.set(-0.45, 0.5, 1.55);
        const hl2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), this.mat.whiteGlow);
        hl2.position.set(0.45, 0.5, 1.55);
        car.add(hl1, hl2);
      }

      // Passenger Seats & Safety Lap Bars
      for (let row = -0.5; row <= 0.5; row += 0.8) {
        const seat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 0.4), this.mat.darkSteel);
        seat.position.set(0, 0.8, row);
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6), this.mat.gold);
        bar.rotation.z = Math.PI / 2;
        bar.position.set(0, 0.95, row + 0.3);
        car.add(seat, bar);
      }

      // Steel Wheels & Bogie
      [-0.6, 0.6].forEach(x => {
        [-0.7, 0.7].forEach(z => {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 8), this.mat.steel);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(x, 0.2, z);
          car.add(wheel);
        });
      });

      car.add(body);
      this.coasterTrain.add(car);
      this.trainCars.push(car);
    }

    S.add(this.coasterTrain);
  }

  /* ================= 4. MENARA TERJUN BEBAS (DROP TOWER) ================= */
  buildDropTower() {
    const S = this.scene;
    this.dropX = -36;
    this.dropZ = -18;
    this.dropTowerHeight = 38;

    const towerGroup = new THREE.Group();
    towerGroup.position.set(this.dropX, 0, this.dropZ);

    // Concrete Base Pedestal
    const basePed = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.8, 1.4, 12), this.mat.darkSteel);
    basePed.position.y = 0.7;
    towerGroup.add(basePed);

    // Central Steel Lattice Truss Tower
    const towerGeo = new THREE.BoxGeometry(2.4, this.dropTowerHeight, 2.4);
    const towerMesh = new THREE.Mesh(towerGeo, this.mat.blue);
    towerMesh.position.y = this.dropTowerHeight / 2 + 1.2;
    towerGroup.add(towerMesh);

    // Tower Summit Finial & Flashing Strobe Beacon
    const topCap = new THREE.Mesh(new THREE.ConeGeometry(2.0, 3.2, 4), this.mat.gold);
    topCap.position.y = this.dropTowerHeight + 2.8;
    const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), this.mat.whiteGlow);
    strobe.position.y = this.dropTowerHeight + 4.6;
    towerGroup.add(topCap, strobe);

    // Circular 8-Seat Carriage that Drops!
    const carriage = new THREE.Group();
    carriage.position.y = 2.4;

    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.35, 8, 16), this.mat.magenta);
    ring.rotation.x = Math.PI / 2;
    carriage.add(ring);

    // 8 Passenger Seats around the ring
    for (let s = 0; s < 8; s++) {
      const sAng = (s / 8) * Math.PI * 2;
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.6), this.mat.gold);
      seat.position.set(Math.cos(sAng) * 2.3, 0.3, Math.sin(sAng) * 2.3);
      seat.rotation.y = -sAng - Math.PI / 2;
      carriage.add(seat);
    }

    towerGroup.add(carriage);
    S.add(towerGroup);

    this.dropCarriage = carriage;
  }

  /* ================= 5. KAPAL BAJAK LAUT (VIKING SHIP PENDULUM) ================= */
  buildVikingShip() {
    const S = this.scene;
    this.shipX = -28;
    this.shipZ = 16;
    this.shipArmLen = 14;

    const shipBase = new THREE.Group();
    shipBase.position.set(this.shipX, 0, this.shipZ);

    // 4 Heavy A-Frame Support Pylons (18m tall)
    const pylonGeo = new THREE.CylinderGeometry(0.35, 0.6, 19, 8);
    const pMat = this.mat.darkSteel;

    [[-3.8, -4.5, 0.22, 0.2], [-3.8, 4.5, 0.22, -0.2], [3.8, -4.5, -0.22, 0.2], [3.8, 4.5, -0.22, -0.2]].forEach(([x, z, rx, rz]) => {
      const pylon = new THREE.Mesh(pylonGeo, pMat);
      pylon.position.set(x, 9.2, z);
      pylon.rotation.x = rx;
      pylon.rotation.z = rz;
      shipBase.add(pylon);
    });

    // Top Pivot Axle Beam
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 9.5, 12), this.mat.brass);
    axle.rotation.x = Math.PI / 2;
    axle.position.set(0, 18.2, 0);
    shipBase.add(axle);

    // Swinging Arm & Ship Group (pivots around axle at y = 18.2)
    const swingGroup = new THREE.Group();
    swingGroup.position.set(0, 18.2, 0);

    // Dual Suspension Truss Arms
    [-2.2, 2.2].forEach(z => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, this.shipArmLen, 0.3), this.mat.steel);
      arm.position.set(0, -this.shipArmLen / 2, z);
      swingGroup.add(arm);
    });

    // Wooden Galleon Ship Hull
    const shipHull = new THREE.Group();
    shipHull.position.set(0, -this.shipArmLen, 0);

    const hullMesh = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.6, 10.5), this.mat.wood);
    // Dragon/Eagle Carved Bow & Stern Tips
    const bow = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.2, 4), this.mat.darkWood);
    bow.position.set(0, 1.2, 5.8);
    bow.rotation.x = 0.5;

    const stern = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3.2, 4), this.mat.darkWood);
    stern.position.set(0, 1.2, -5.8);
    stern.rotation.x = -0.5;

    // Passenger Benches
    for (let b = -4; b <= 4; b += 1.4) {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.45, 0.5), this.mat.brass);
      bench.position.set(0, 0.9, b);
      shipHull.add(bench);
    }

    // Pirate Mast & Flag
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5.2, 8), this.mat.darkWood);
    mast.position.set(0, 3.2, 0);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.2, 1.8), this.mat.carnivalRed);
    flag.position.set(0, 4.6, 0.9);
    shipHull.add(mast, flag);

    shipHull.add(hullMesh, bow, stern);
    swingGroup.add(shipHull);

    shipBase.add(swingGroup);
    S.add(shipBase);

    this.vikingShip = swingGroup;
  }

  /* ================= 6. WAHANA CANGKIR BERPUTAR (SPINNING TEACUPS) ================= */
  buildSpinningTeacups() {
    const S = this.scene;
    this.cupX = 22;
    this.cupZ = 8;

    const tcBase = new THREE.Group();
    tcBase.position.set(this.cupX, 0, this.cupZ);

    // Main Rotating Turntable Floor
    const mainTable = new THREE.Group();
    mainTable.position.y = 0.35;

    const floor = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 7.8, 0.5, 32), this.mat.gold);
    mainTable.add(floor);

    // Giant Center Teapot
    const teapotBody = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 16), this.mat.magenta);
    teapotBody.position.y = 1.9;
    const teapotLid = new THREE.Mesh(new THREE.ConeGeometry(1.2, 0.8, 12), this.mat.gold);
    teapotLid.position.y = 3.6;
    const teapotSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 1.8, 8), this.mat.magenta);
    teapotSpout.position.set(1.5, 2.3, 0);
    teapotSpout.rotation.z = -0.6;
    mainTable.add(teapotBody, teapotLid, teapotSpout);

    // 4 Spinning Teacups on Sub-Turntables
    const cupColors = [0x00d2ff, 0xffea00, 0x00e676, 0xff3b94];
    for (let c = 0; c < 4; c++) {
      const cAng = (c / 4) * Math.PI * 2;
      const subRadius = 4.8;

      const subTable = new THREE.Group();
      subTable.position.set(Math.cos(cAng) * subRadius, 0.3, Math.sin(cAng) * subRadius);

      // Sub plate
      const subPlate = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.9, 0.2, 16), this.mat.carnivalWhite);
      subTable.add(subPlate);

      // The Teacup Body
      const cupMat = new THREE.MeshStandardMaterial({ color: cupColors[c], roughness: 0.3 });
      const cupBody = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 0.9, 1.3, 16, 1, true), cupMat);
      cupBody.position.y = 0.75;
      const cupBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.1, 16), cupMat);
      cupBottom.position.y = 0.15;

      // Handle
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.1, 8, 16), this.mat.gold);
      handle.position.set(1.4, 0.75, 0);
      handle.rotation.y = Math.PI / 2;

      // Center Steering Wheel inside cup
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.05, 8, 16), this.mat.gold);
      wheel.position.y = 0.9;
      wheel.rotation.x = Math.PI / 2;

      const cupObj = new THREE.Group();
      cupObj.add(cupBody, cupBottom, handle, wheel);
      subTable.add(cupObj);

      mainTable.add(subTable);
      this.individualCups.push(cupObj);
    }

    tcBase.add(mainTable);
    S.add(tcBase);

    this.teacupsGroup = mainTable;
  }

  /* ================= 7. ARKADE MUSIK "PRISMA BEAT" (RHYTHM GAME) ================= */
  buildRhythmArcadeBooth() {
    const S = this.scene;
    this.rhythmX = -12;
    this.rhythmZ = 22;

    const rGroup = new THREE.Group();
    rGroup.position.set(this.rhythmX, 0, this.rhythmZ);

    // Glowing Dance Stage Platform
    const stage = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.45, 5.5), this.mat.darkSteel);
    stage.position.y = 0.22;
    rGroup.add(stage);

    // 4 Glowing Dance Pad Arrows on floor (Left, Down, Up, Right)
    const padColors = [0x00f0ff, 0xff2a85, 0x00e676, 0xffea00];
    const padPositions = [[-1.5, 0.5], [-0.5, 0.5], [0.5, 0.5], [1.5, 0.5]];

    padPositions.forEach(([px, pz], idx) => {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.85), new THREE.MeshBasicMaterial({ color: padColors[idx] }));
      pad.position.set(px, 0.48, pz);
      rGroup.add(pad);
    });

    // Arcade Cabinet Machine
    const cab = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.4, 1.4), this.mat.blue);
    cab.position.set(0, 1.9, -1.8);
    rGroup.add(cab);

    // Neon Marquee "PRISMA BEAT"
    const marquee = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.85, 0.3), this.mat.neonPink);
    marquee.position.set(0, 3.8, -1.6);
    rGroup.add(marquee);

    // Equalizer Screen Visualizer
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.6), this.mat.neonCyan);
    screen.position.set(0, 2.3, -1.08);
    rGroup.add(screen);

    // Dual Giant Speaker Towers
    [-2.8, 2.8].forEach(x => {
      const spk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.2, 1.2), this.mat.darkSteel);
      spk.position.set(x, 2.1, -1.8);
      // Woofers
      [1.2, 2.2, 3.2].forEach(y => {
        const woofer = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.08, 8, 16), this.mat.neonGold);
        woofer.position.set(x, y, -1.18);
        rGroup.add(woofer);
      });
      rGroup.add(spk);
    });

    S.add(rGroup);
  }

  /* ================= 8. WAHANA TEMBAK SASARAN (CARNIVAL SHOOTING GALLERY) ================= */
  buildShootingGalleryBooth() {
    const S = this.scene;
    this.shootX = 18;
    this.shootZ = 22;

    const bGroup = new THREE.Group();
    bGroup.position.set(this.shootX, 0, this.shootZ);

    // Wooden Booth Structure
    const counter = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.1, 1.2), this.mat.wood);
    counter.position.set(0, 0.55, 1.4);
    bGroup.add(counter);

    // Back Target Wall & Shelves
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(6.4, 3.2, 0.3), this.mat.darkWood);
    backWall.position.set(0, 1.8, -1.6);
    bGroup.add(backWall);

    // Striped Carnival Canopy Awning
    const awning = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.35, 3.6), this.mat.stripedRoof);
    awning.position.set(0, 3.6, 0);
    awning.rotation.x = 0.15;
    bGroup.add(awning);

    // Target Shelves with targets (Ducks, Stars, Bullseyes)
    [1.2, 2.1].forEach((y, shelfIdx) => {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.1, 0.4), this.mat.brass);
      shelf.position.set(0, y, -1.4);
      bGroup.add(shelf);

      // Add 5 colorful targets on each shelf
      for (let t = -2.2; t <= 2.2; t += 1.1) {
        const target = (shelfIdx === 0)
          ? new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 12), this.mat.carnivalRed) // Bullseye
          : new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.4, 4), this.mat.neonGold); // Gold Star/Duck
        target.position.set(t, y + 0.28, -1.35);
        target.rotation.x = Math.PI / 2;
        bGroup.add(target);
      }
    });

    // Cork Rifles mounted on counter
    [-1.5, 0, 1.5].forEach(x => {
      const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 1.2), this.mat.darkSteel);
      rifle.position.set(x, 1.2, 1.3);
      rifle.rotation.x = 0.1;
      bGroup.add(rifle);
    });

    S.add(bGroup);
  }

  /* ================= 9. PARK ATMOSPHERE (STALLS, BALLOONS, BUNTING) ================= */
  buildParkAtmosphere() {
    const S = this.scene;

    // Popcorn & Cotton Candy Carts
    this.buildFoodCart(S, 14, 12, 'POPCORN', 0xffcc00);
    this.buildFoodCart(S, -14, 12, 'ARUM MANIS', 0xff6fb5);

    // Festive Balloon Clusters (animated floating)
    const balloonColors = [0xff3b94, 0x00d2ff, 0xffea00, 0x00e676, 0xaa00ff];
    [[-8, 30], [8, 30], [-22, 2], [22, -4]].forEach(([bx, bz]) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(bx, 0, bz);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.4, 6), this.mat.steel);
      post.position.y = 1.2;
      bGroup.add(post);

      for (let i = 0; i < 5; i++) {
        const ang = (i / 5) * Math.PI * 2;
        const bMesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), new THREE.MeshStandardMaterial({ color: balloonColors[i], roughness: 0.3 }));
        bMesh.scale.set(1, 1.25, 1);
        bMesh.position.set(Math.cos(ang) * 0.45, 2.8 + (i % 2) * 0.4, Math.sin(ang) * 0.45);
        bGroup.add(bMesh);
      }

      S.add(bGroup);
      this.balloonGroups.push(bGroup);
    });

    // Festive Entrance Archway at (0, 0, 38)
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, 38);

    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 6.2, 12), this.mat.blue);
    postL.position.set(-4.5, 3.1, 0);
    const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 6.2, 12), this.mat.blue);
    postR.position.set(4.5, 3.1, 0);

    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(10.5, 1.2, 0.8), this.mat.magenta);
    archBeam.position.set(0, 6.4, 0);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.4, 0.3), this.mat.neonGold);
    signBoard.position.set(0, 7.5, 0);

    archGroup.add(postL, postR, archBeam, signBoard);
    S.add(archGroup);
  }

  buildFoodCart(S, x, z, title, color) {
    const cGroup = new THREE.Group();
    cGroup.position.set(x, 0, z);

    // Cart Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 1.6), new THREE.MeshStandardMaterial({ color, roughness: 0.5 }));
    body.position.y = 0.9;
    // Striped Roof Canopy
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.2, 4), this.mat.stripedRoof);
    roof.position.y = 2.4;
    roof.rotation.y = Math.PI / 4;
    // Cart Wheels
    [-0.8, 0.8].forEach(wx => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12), this.mat.darkWood);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.4, 0.85);
      cGroup.add(w);
    });

    cGroup.add(body, roof);
    S.add(cGroup);
  }

  /* ================= REAL-TIME ANIMATION LOOP ================= */
  update(dt, t) {
    // 1. Ferris Wheel Continuous Rotation & Keeping Gondolas Upright
    if (this.ferrisWheel) {
      this.wheelAng += dt * 0.18;
      this.ferrisWheel.rotation.z = this.wheelAng;

      // Critical: each gondola rotates opposite to wheelAng so gravity keeps cabins vertically upright!
      for (const g of this.gondolas) {
        g.group.rotation.z = -this.wheelAng;
      }
    }

    // 2. Carousel Continuous Rotation & Horses Bobbing up and down
    if (this.carousel) {
      this.carAng += dt * 0.5;
      this.carousel.rotation.y = this.carAng;

      for (const h of this.horses) {
        h.mount.position.y = h.baseY + Math.sin(t * 3.2 + h.phase) * 0.35;
      }
    }

    // 3. Drop Tower Carriage Cycle (Climb -> Wait -> Drop -> Brake)
    if (this.dropCarriage) {
      this.dropTimer += dt;
      if (this.dropState === 'climb') {
        this.dropY += dt * 5.2; // Slow thrilling ascent
        if (this.dropY >= 35) {
          this.dropY = 35;
          this.dropState = 'wait';
          this.dropTimer = 0;
        }
      } else if (this.dropState === 'wait') {
        if (this.dropTimer >= 2.5) {
          this.dropState = 'drop';
          this.dropTimer = 0;
        }
      } else if (this.dropState === 'drop') {
        // Free fall physics!
        this.dropY -= dt * 28;
        if (this.dropY <= 6) {
          this.dropState = 'brake';
          this.dropTimer = 0;
        }
      } else if (this.dropState === 'brake') {
        // Hydraulic soft deceleration
        this.dropY = Math.max(2.4, this.dropY - dt * 6);
        if (this.dropTimer >= 2.0) {
          this.dropState = 'climb';
          this.dropTimer = 0;
        }
      }
      this.dropCarriage.position.y = this.dropY;
    }

    // 4. Viking Ship Harmonic Pendulum Oscillation
    if (this.vikingShip) {
      this.shipAng = Math.sin(t * 1.4) * 0.78; // Swings up to ~45 degrees back and forth
      this.vikingShip.rotation.z = this.shipAng;
    }

    // 5. Spinning Teacups Rotation
    if (this.teacupsGroup) {
      this.teacupsAng += dt * 0.65;
      this.teacupsGroup.rotation.y = this.teacupsAng;
      // Individual teacups spin on their own axis
      for (const cup of this.individualCups) {
        cup.rotation.y += dt * 2.2;
      }
    }

    // 6. Coaster Train running along the curve in real-time
    if (this.curve && this.coasterTrain) {
      this.coasterTrainProgress = (this.coasterTrainProgress + dt * 0.04) % 1;
      const L = this.world.coaster.L;

      for (let c = 0; c < this.trainCars.length; c++) {
        // Offset each trailing car by 3 meters
        const carOffset = (c * 2.8) / L;
        const u = ((this.coasterTrainProgress - carOffset) % 1 + 1) % 1;
        const pt = this.curve.getPointAt(u);
        const pAhead = this.curve.getPointAt((u + 0.005) % 1);

        this.trainCars[c].position.copy(pt);
        this.trainCars[c].lookAt(pAhead);
      }
    }

    // 7. Balloon Clusters gentle swaying
    for (let i = 0; i < this.balloonGroups.length; i++) {
      this.balloonGroups[i].rotation.z = Math.sin(t * 1.5 + i) * 0.08;
      this.balloonGroups[i].rotation.x = Math.cos(t * 1.2 + i) * 0.06;
    }
  }
}
