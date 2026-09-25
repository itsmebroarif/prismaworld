import * as THREE from 'three';

/**
 * MenuWorldScene
 * Menampilkan animasi 3D World (Planet Prisma) yang rapih, hidup, dan memukau
 * dengan estetika Material Design 3 Blue.
 */
export class MenuWorldScene {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    
    // Kamera khusus Menu dengan sudut pandang elegan
    this.camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 300);
    this.camera.position.set(0, 0.2, 11.2);

    // Variabel interaksi (mouse & touch drag)
    this.targetRotY = 0;
    this.targetRotX = 0.22;
    this.currentRotY = 0;
    this.currentRotX = 0.22;
    this.isDragging = false;
    this.lastPointerX = 0;
    this.lastPointerY = 0;

    this.clouds = [];
    this.satellites = [];
    this.animatedObjects = [];

    this.initLights();
    this.initStarfield();
    this.initPlanet();
    this.initAtmosphere();
    this.initLandmarks();
    this.initRings();
    this.initSatellite();
    this.initInteraction();

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });
  }

  initLights() {
    // Hemisphere light bernuansa Material Blue
    const hemi = new THREE.HemisphereLight(0x8bc9ff, 0x051329, 0.9);
    this.scene.add(hemi);

    // Cahaya utama (Matahari) menyinari permukaan planet
    const sun = new THREE.DirectionalLight(0xf0f8ff, 2.2);
    sun.position.set(16, 12, 14);
    this.scene.add(sun);

    // Rim light biru safir dari belakang untuk siluet atmosfer
    const rim = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rim.position.set(-18, -6, -12);
    this.scene.add(rim);

    // Soft fill light
    const fill = new THREE.PointLight(0x0284c7, 1.2, 30);
    fill.position.set(-10, 8, 8);
    this.scene.add(fill);
  }

  initStarfield() {
    // Background Space Dome bernuansa Material Deep Blue
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 16;
    skyCanvas.height = 256;
    const ctx = skyCanvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#020612');
    grad.addColorStop(0.35, '#061326');
    grad.addColorStop(0.7, '#0c2340');
    grad.addColorStop(1, '#113359');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 16, 256);

    const skyTex = new THREE.CanvasTexture(skyCanvas);
    skyTex.colorSpace = THREE.SRGBColorSpace;
    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(180, 24, 16),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false })
    );
    this.scene.add(skyDome);

    // Gugusan Bintang (380 titik bintang)
    const starCount = 380;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const starPalette = [
      new THREE.Color('#38bdf8'),
      new THREE.Color('#7dd3fc'),
      new THREE.Color('#bae6fd'),
      new THREE.Color('#ffffff'),
      new THREE.Color('#60a5fa')
    ];

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 70 + Math.random() * 80;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const col = starPalette[Math.floor(Math.random() * starPalette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Partikel bintang bersinar
    const starMat = new THREE.PointsMaterial({
      size: 1.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    this.stars = new THREE.Points(starGeo, starMat);
    this.scene.add(this.stars);
  }

  initPlanet() {
    this.globeGroup = new THREE.Group();
    this.globeGroup.rotation.x = 0.22; // Kemiringan aksial bumi elegan
    this.scene.add(this.globeGroup);

    // 1. Bola Samudera (Ocean Sphere)
    const oceanRadius = 3.6;
    const oceanGeo = new THREE.SphereGeometry(oceanRadius, 48, 48);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0d2847, // Material Deep Blue Ocean
      roughness: 0.32,
      metalness: 0.25,
      flatShading: false
    });
    this.ocean = new THREE.Mesh(oceanGeo, oceanMat);
    this.globeGroup.add(this.ocean);

    // 2. Benua & Kepulauan (Continents)
    this.landGroup = new THREE.Group();
    this.globeGroup.add(this.landGroup);

    const continentSpecs = [
      { lat: 25, lon: 30, size: 1.45, color: 0x10b981, peak: 0.22 },   // Benua Zamrud
      { lat: -15, lon: 65, size: 1.25, color: 0x2dd4bf, peak: 0.18 },  // Wilayah Seroja (Teal)
      { lat: 40, lon: 140, size: 1.35, color: 0x38bdf8, peak: 0.24 },  // Zona Esna (Cyan Salju)
      { lat: -25, lon: 170, size: 1.15, color: 0xf59e0b, peak: 0.19 }, // Kepulauan Gurun Emas
      { lat: 10, lon: -45, size: 1.55, color: 0x059669, peak: 0.25 },  // Daratan Tropis
      { lat: -45, lon: -30, size: 1.2, color: 0x38bdf8, peak: 0.26 },  // Kutub Selatan Kristal
      { lat: 55, lon: -110, size: 1.3, color: 0x0284c7, peak: 0.28 },  // Zona Metropolis
      { lat: -10, lon: -125, size: 1.1, color: 0x14b8a6, peak: 0.16 }, // Kepulauan Pantai Karang
      { lat: 72, lon: 0, size: 1.0, color: 0xf8fafc, peak: 0.32 },     // Puncak Salju Abadi
    ];

    continentSpecs.forEach(spec => {
      this.createContinent(oceanRadius, spec);
    });

    // 3. Lapisan Awan Mengapung (Drifting Low-Poly Clouds)
    this.cloudsGroup = new THREE.Group();
    this.globeGroup.add(this.cloudsGroup);

    const cloudCount = 14;
    for (let i = 0; i < cloudCount; i++) {
      const lat = (Math.random() - 0.5) * 110;
      const lon = (i / cloudCount) * 360 + (Math.random() * 20);
      const r = oceanRadius + 0.36 + Math.random() * 0.15;
      const cloud = this.createCloudMesh();
      const pos = this.latLonToVec3(lat, lon, r);
      cloud.position.copy(pos);
      cloud.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
      cloud.userData = { speed: 0.003 + Math.random() * 0.004, r, lat, lon };
      this.cloudsGroup.add(cloud);
      this.clouds.push(cloud);
    }
  }

  createContinent(oceanRadius, spec) {
    const phi = (90 - spec.lat) * (Math.PI / 180);
    const theta = (spec.lon + 180) * (Math.PI / 180);

    // Bentuk landmass dengan silinder rendah berundak & kubus bulat bergaya low-poly modern
    const group = new THREE.Group();
    const count = 5 + Math.floor(spec.size * 3);

    const landMat = new THREE.MeshStandardMaterial({
      color: spec.color,
      roughness: 0.8,
      metalness: 0.1,
      flatShading: true
    });

    const beachMat = new THREE.MeshStandardMaterial({
      color: 0xfcd34d, // Pasir pantai emas
      roughness: 0.9,
      flatShading: true
    });

    const peakMat = new THREE.MeshStandardMaterial({
      color: 0xf0fdfa, // Puncak gunung salju
      roughness: 0.7,
      flatShading: true
    });

    for (let i = 0; i < count; i++) {
      const offLat = spec.lat + (Math.random() - 0.5) * (spec.size * 18);
      const offLon = spec.lon + (Math.random() - 0.5) * (spec.size * 22);
      const h = spec.peak * (0.6 + Math.random() * 0.6);
      const rad = 0.35 + Math.random() * (spec.size * 0.45);

      const pos = this.latLonToVec3(offLat, offLon, oceanRadius + h * 0.35);
      const norm = pos.clone().normalize();

      // Base daratan
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.85, rad, h + 0.12, 7), landMat);
      mesh.position.copy(pos);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), norm);
      group.add(mesh);

      // Garis pantai pantai pasir di tepi
      if (i % 2 === 0) {
        const bPos = this.latLonToVec3(offLat + (Math.random() - 0.5) * 4, offLon + (Math.random() - 0.5) * 5, oceanRadius + 0.04);
        const bMesh = new THREE.Mesh(new THREE.CylinderGeometry(rad * 1.15, rad * 1.25, 0.08, 6), beachMat);
        bMesh.position.copy(bPos);
        bMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bPos.clone().normalize());
        group.add(bMesh);
      }

      // Puncak gunung bersalju
      if (h > 0.22) {
        const pPos = this.latLonToVec3(offLat, offLon, oceanRadius + h + 0.15);
        const pMesh = new THREE.Mesh(new THREE.ConeGeometry(rad * 0.5, 0.35, 5), peakMat);
        pMesh.position.copy(pPos);
        pMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), norm);
        group.add(pMesh);
      }
    }

    this.landGroup.add(group);
  }

  createCloudMesh() {
    const cg = new THREE.Group();
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.6,
      transparent: true,
      opacity: 0.88,
      flatShading: true
    });

    const puffCount = 3 + Math.floor(Math.random() * 3);
    for (let p = 0; p < puffCount; p++) {
      const sz = 0.22 + Math.random() * 0.16;
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(sz, 1), cloudMat);
      puff.position.set((p - puffCount / 2) * 0.22, (Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.1);
      cg.add(puff);
    }
    return cg;
  }

  initAtmosphere() {
    // Lapisan Pijar Atmosfer (Cyan-Blue Fresnel Halo)
    const atmoGeo = new THREE.SphereGeometry(3.92, 36, 36);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    this.atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
    this.globeGroup.add(this.atmosphere);

    // Lingkaran luar glowing halo
    const glowGeo = new THREE.RingGeometry(3.8, 4.3, 48);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.haloRing = new THREE.Mesh(glowGeo, glowMat);
    this.scene.add(this.haloRing);
  }

  initLandmarks() {
    // Tambahkan miniatur landmark 3D di permukaan globe
    // 1. Cyber Spire Metropolis (Kota Senja)
    const cityPos = this.latLonToVec3(52, -105, 3.8);
    const cityNorm = cityPos.clone().normalize();
    const cityGroup = new THREE.Group();
    cityGroup.position.copy(cityPos);
    cityGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), cityNorm);

    const bldgMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

    for (let i = 0; i < 4; i++) {
      const bh = 0.35 + i * 0.18;
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, bh, 0.12), bldgMat);
      b.position.set((i % 2 - 0.5) * 0.16, bh / 2, (Math.floor(i / 2) - 0.5) * 0.16);
      cityGroup.add(b);

      if (i === 3) {
        // Spire utama dengan pemancar antena
        const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.04, 0.3, 6), glowMat);
        spire.position.set(b.position.x, bh + 0.15, b.position.z);
        cityGroup.add(spire);
      }
    }
    this.globeGroup.add(cityGroup);

    // 2. Kincir Angin & Taman Seroja
    const parkPos = this.latLonToVec3(-12, 60, 3.82);
    const parkGroup = new THREE.Group();
    parkGroup.position.copy(parkPos);
    parkGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), parkPos.clone().normalize());

    const millTower = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.42, 6), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 }));
    millTower.position.y = 0.21;
    parkGroup.add(millTower);

    // Baling-baling berputar
    const blades = new THREE.Group();
    blades.position.set(0, 0.38, 0.07);
    const bladeMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    for (let b = 0; b < 3; b++) {
      const bm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.01), bladeMat);
      bm.rotation.z = (b / 3) * Math.PI * 2;
      bm.position.y = Math.cos(bm.rotation.z) * 0.14;
      bm.position.x = Math.sin(bm.rotation.z) * 0.14;
      blades.add(bm);
    }
    parkGroup.add(blades);
    this.animatedObjects.push({ obj: blades, type: 'spin', speed: 2.4 });
    this.globeGroup.add(parkGroup);

    // 3. Mini Coaster Ribbon (Prisma Land)
    const coasterPos = this.latLonToVec3(22, 28, 3.8);
    const coasterGroup = new THREE.Group();
    coasterGroup.position.copy(coasterPos);
    coasterGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), coasterPos.clone().normalize());

    const coasterRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.03, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    coasterRing.rotation.x = Math.PI / 3;
    coasterRing.position.y = 0.28;
    coasterGroup.add(coasterRing);

    // Kereta coaster meluncur
    const cart = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.12), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    coasterGroup.add(cart);
    this.animatedObjects.push({ obj: cart, type: 'coaster', ring: coasterRing, speed: 3.2 });
    this.globeGroup.add(coasterGroup);
  }

  initRings() {
    // Cincin Kosmik Prisma (Material Blue Rings System)
    this.ringsGroup = new THREE.Group();
    this.ringsGroup.rotation.x = Math.PI / 4.2;
    this.ringsGroup.rotation.y = 0.18;
    this.globeGroup.add(this.ringsGroup);

    // 1. Cincin halus berpendar
    const ringGeo = new THREE.RingGeometry(4.7, 6.2, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const mainRing = new THREE.Mesh(ringGeo, ringMat);
    this.ringsGroup.add(mainRing);

    // 2. Cincin sekunder luar yang tipis
    const outerRingGeo = new THREE.RingGeometry(6.4, 6.6, 64);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    this.ringsGroup.add(outerRing);

    // 3. Debu Partikel Cincin (180 titik orbit berputar)
    const partCount = 180;
    const partGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(partCount * 3);
    for (let i = 0; i < partCount; i++) {
      const angle = (i / partCount) * Math.PI * 2;
      const dist = 4.8 + Math.random() * 1.6;
      pos[i * 3] = Math.cos(angle) * dist;
      pos[i * 3 + 1] = Math.sin(angle) * dist;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.14;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const partMat = new THREE.PointsMaterial({
      size: 1.4,
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    this.ringParticles = new THREE.Points(partGeo, partMat);
    this.ringsGroup.add(this.ringParticles);
  }

  initSatellite() {
    // Pesawat pengorbit / Satelit Prisma
    this.satOrbit = new THREE.Group();
    this.satOrbit.rotation.x = -Math.PI / 5;
    this.globeGroup.add(this.satOrbit);

    const satGroup = new THREE.Group();
    const satBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.12, 0.28),
      new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.9, roughness: 0.2 })
    );
    const panelL = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.02, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.3 })
    );
    panelL.position.x = -0.34;
    const panelR = panelL.clone();
    panelR.position.x = 0.34;

    // Beacon bercahaya di ekor
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    beacon.position.z = 0.15;

    satGroup.add(satBody, panelL, panelR, beacon);
    satGroup.position.set(5.2, 0, 0);
    this.satOrbit.add(satGroup);
    this.sat = satGroup;

    // Bulan Mini (Mini Moonlet) di orbit terluar
    const moonGeo = new THREE.SphereGeometry(0.45, 14, 14);
    const moonMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9, flatShading: true });
    this.moon = new THREE.Mesh(moonGeo, moonMat);
    this.moonOrbit = new THREE.Group();
    this.moonOrbit.rotation.z = 0.3;
    this.moon.position.set(7.5, 0, 0);
    this.moonOrbit.add(this.moon);
    this.globeGroup.add(this.moonOrbit);
  }

  initInteraction() {
    // Interaktivitas: Mouse & Touch drag untuk memutar dan mengagumi dunia
    const onDown = e => {
      this.isDragging = true;
      this.lastPointerX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      this.lastPointerY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    };

    const onMove = e => {
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      if (this.isDragging) {
        const dx = clientX - this.lastPointerX;
        const dy = clientY - this.lastPointerY;
        this.targetRotY += dx * 0.005;
        this.targetRotX = Math.max(-0.6, Math.min(0.8, this.targetRotX + dy * 0.004));
        this.lastPointerX = clientX;
        this.lastPointerY = clientY;
      } else {
        // Subtle tilt parallax saat kursor digerakkan
        const nx = (clientX / window.innerWidth) * 2 - 1;
        const ny = -(clientY / window.innerHeight) * 2 + 1;
        this.camera.position.x = nx * 0.6;
        this.camera.position.y = 0.2 + ny * 0.4;
        this.camera.lookAt(0, 0, 0);
      }
    };

    const onUp = () => {
      this.isDragging = false;
    };

    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
  }

  latLonToVec3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -(radius * Math.sin(phi) * Math.cos(theta)),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  update(dt, t) {
    // 1. Rotasi otomatis planet
    this.targetRotY += dt * 0.12;

    // Smooth lerp rotasi
    this.currentRotY += (this.targetRotY - this.currentRotY) * 0.1;
    this.currentRotX += (this.targetRotX - this.currentRotX) * 0.1;

    this.globeGroup.rotation.y = this.currentRotY;
    this.globeGroup.rotation.x = this.currentRotX;

    // Floating motion lembut (gelombang sinus)
    this.globeGroup.position.y = Math.sin(t * 0.85) * 0.14;

    // Posisikan halo ring agar selalu menghadap kamera
    if (this.haloRing) {
      this.haloRing.position.copy(this.globeGroup.position);
      this.haloRing.lookAt(this.camera.position);
    }

    // 2. Putaran cincin & partikel
    if (this.ringParticles) {
      this.ringParticles.rotation.z -= dt * 0.08;
    }

    // 3. Gerakan awan mengapung
    for (const c of this.clouds) {
      c.userData.lon += c.userData.speed * 40;
      const pos = this.latLonToVec3(c.userData.lat, c.userData.lon, c.userData.r);
      c.position.copy(pos);
      c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
    }

    // 4. Orbit satelit & bulan mini
    if (this.satOrbit) {
      this.satOrbit.rotation.z += dt * 0.45;
      this.sat.rotation.y += dt * 0.8;
    }
    if (this.moonOrbit) {
      this.moonOrbit.rotation.y += dt * 0.16;
      this.moon.rotation.y += dt * 0.25;
    }

    // 5. Animasi landmark mini (baling-baling, coaster)
    for (const a of this.animatedObjects) {
      if (a.type === 'spin') {
        a.obj.rotation.z += dt * a.speed;
      } else if (a.type === 'coaster') {
        const ang = t * a.speed;
        a.obj.position.set(Math.cos(ang) * 0.32, 0.28 + Math.sin(ang * 2) * 0.05, Math.sin(ang) * 0.32);
        a.obj.rotation.y = -ang;
      }
    }

    // 6. Kelap-kelip bintang
    if (this.stars) {
      this.stars.rotation.y += dt * 0.01;
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
