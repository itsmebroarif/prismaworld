import * as THREE from 'three';

export class Vehicle {
  constructor(scene, world, type, x, z, yaw, name, color = 0x38bdf8) {
    this.scene = scene;
    this.world = world;
    this.type = type;
    this.name = name;
    this.color = color;
    this.pos = new THREE.Vector3(x, 0, z);
    this.vel = new THREE.Vector3();
    this.yaw = yaw;
    this.speed = 0;
    this.steer = 0;
    this.maxSpeed = 26; // ~94 km/h
    this.accel = 20;
    this.brake = 30;
    this.turnSpeed = 2.4;
    this.mounted = false;
    this.radius = 2.2;
    this.g = new THREE.Group();
    this.buildModel(color);
    this.g.position.copy(this.pos);
    this.g.rotation.y = this.yaw;
    scene.add(this.g);
  }

  buildModel(color) {
    const M = {
      body: new THREE.MeshStandardMaterial({ color, roughness: .35, metalness: .7 }),
      trim: new THREE.MeshStandardMaterial({ color: 0x1f1624, roughness: .6, metalness: .4 }),
      glow: new THREE.MeshBasicMaterial({ color, toneMapped: false }),
      wheel: new THREE.MeshStandardMaterial({ color: 0x151218, roughness: .85 }),
      light: new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
      brakeLight: new THREE.MeshBasicMaterial({ color: 0xff2244, toneMapped: false })
    };

    // Main Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, .65, 3.4), M.body);
    chassis.position.y = .62;
    this.g.add(chassis);

    // Cabin / Canopy
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, .6, 1.8), M.trim);
    cabin.position.set(0, 1.15, -.15);
    this.g.add(cabin);

    // Windshield visor
    const visor = new THREE.Mesh(new THREE.BoxGeometry(1.42, .4, .8), new THREE.MeshBasicMaterial({ color: 0x33e3ff, transparent: true, opacity: .7 }));
    visor.position.set(0, 1.25, .55);
    visor.rotation.x = -.3;
    this.g.add(visor);

    // Front Bumper / Wedge
    const nose = new THREE.Mesh(new THREE.ConeGeometry(.9, 1.1, 4), M.body);
    nose.rotation.x = Math.PI / 2;
    nose.rotation.y = Math.PI / 4;
    nose.position.set(0, .6, 1.8);
    this.g.add(nose);

    // Headlights
    [-.65, .65].forEach(sx => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(.32, .14, .08), M.light);
      hl.position.set(sx, .72, 1.72);
      this.g.add(hl);
    });

    // Tail Brake lights
    [-.7, .7].forEach(sx => {
      const bl = new THREE.Mesh(new THREE.BoxGeometry(.36, .14, .08), M.brakeLight);
      bl.position.set(sx, .72, -1.72);
      this.g.add(bl);
    });

    // 4 Wheels with rims
    this.wheels = [];
    const wGeom = new THREE.CylinderGeometry(.42, .42, .32, 16);
    wGeom.rotateZ(Math.PI / 2);
    [
      { x: -1.05, y: .42, z: 1.1, front: true },
      { x: 1.05, y: .42, z: 1.1, front: true },
      { x: -1.05, y: .42, z: -1.1, front: false },
      { x: 1.05, y: .42, z: -1.1, front: false }
    ].forEach(wPos => {
      const wPivot = new THREE.Group();
      wPivot.position.set(wPos.x, wPos.y, wPos.z);
      const wMesh = new THREE.Mesh(wGeom, M.wheel);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .34, 8), M.glow);
      rim.rotateZ(Math.PI / 2);
      wMesh.add(rim);
      wPivot.add(wMesh);
      this.g.add(wPivot);
      this.wheels.push({ pivot: wPivot, mesh: wMesh, front: wPos.front });
    });

    // Rear Spoiler
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.8, .08, .36), M.trim);
    spoiler.position.set(0, 1.3, -1.6);
    const postL = new THREE.Mesh(new THREE.BoxGeometry(.08, .4, .08), M.trim);
    postL.position.set(-.6, 1.1, -1.6);
    const postR = postL.clone(); postR.position.x = .6;
    this.g.add(spoiler, postL, postR);
  }

  update(dt, input, sfx) {
    if (this.mounted) {
      const moveY = input.kb.y !== 0 ? input.kb.y : input.stick.y;
      const steerX = input.kb.x !== 0 ? input.kb.x : input.stick.x;
      const turbo = input.run ? 1.4 : 1.0;

      // Acceleration / Deceleration
      if (moveY > 0) {
        this.speed = Math.min(this.speed + this.accel * dt * turbo, this.maxSpeed * turbo);
      } else if (moveY < 0) {
        this.speed = Math.max(this.speed - this.brake * dt, -this.maxSpeed * .4);
      } else {
        // Friction slowdown
        if (this.speed > 0) this.speed = Math.max(0, this.speed - 12 * dt);
        else if (this.speed < 0) this.speed = Math.min(0, this.speed + 12 * dt);
      }

      // Steering
      if (Math.abs(this.speed) > .1) {
        const dir = this.speed >= 0 ? 1 : -1;
        this.yaw -= steerX * this.turnSpeed * dt * dir * (0.5 + Math.abs(this.speed) / this.maxSpeed);
      }

      // Update position
      const vx = -Math.sin(this.yaw) * this.speed;
      const vz = -Math.cos(this.yaw) * this.speed;
      this.pos.x += vx * dt;
      this.pos.z += vz * dt;

      // Wheel animation
      const wRot = (this.speed / .42) * dt;
      this.wheels.forEach(w => {
        w.mesh.rotation.x += wRot;
        if (w.front) {
          w.pivot.rotation.y = -steerX * .45;
        }
      });

      // Sound update
      sfx.vehicleEngine(Math.abs(this.speed));
    } else {
      if (Math.abs(this.speed) > .1) {
        this.speed *= Math.max(0, 1 - dt * 4);
        this.pos.x -= Math.sin(this.yaw) * this.speed * dt;
        this.pos.z -= Math.cos(this.yaw) * this.speed * dt;
      } else {
        this.speed = 0;
      }
    }

    // World bounds clamping
    this.world.clampBounds(this.pos);
    this.g.position.copy(this.pos);
    this.g.rotation.y = this.yaw;
  }

  getSpeedKmh() {
    return Math.round(Math.abs(this.speed) * 3.6);
  }

  getExitPos() {
    // Return a spot 2 meters to the left of the vehicle
    const ex = this.pos.x - Math.cos(this.yaw) * 2.2;
    const ez = this.pos.z + Math.sin(this.yaw) * 2.2;
    return { x: ex, z: ez, yaw: this.yaw };
  }

  dispose() {
    this.scene.remove(this.g);
  }
}
