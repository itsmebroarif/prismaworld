/* ============================================================
 * js/main/loop.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import * as THREE from "three";
import { camera, menuWorld, minimap, renderer } from "./engine.js";
import { checkInteractions, checkLandmarks, updateCompass } from "./game.js";
import { player } from "./player.js";
import { monsterSystem, phase, weaponManager, world, worldKey } from "./state.js";
import { $ } from "./util.js";

let last = performance.now();
export function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  const t = now / 1000;

  try {
    if (world && phase === "play") {
      // 1. Vehicle Driving or Normal Player
      if (world.drivingVehicle) {
        const v = world.drivingVehicle;
        // Camera chase mode behind vehicle
        const camDist = 6.8;
        const camHeight = 3.2;
        const targetCamPos = v.pos
          .clone()
          .add(
            new THREE.Vector3(
              Math.sin(v.yaw) * camDist,
              camHeight,
              Math.cos(v.yaw) * camDist,
            ),
          );
        camera.position.lerp(targetCamPos, dt * 8);
        camera.lookAt(v.pos.clone().add(new THREE.Vector3(0, 1.4, 0)));
        $("#vhSpeed").textContent = `${v.getSpeedKmh()} km/j`;
      } else if (world.riding) {
        world.updateRide(dt, t);
      } else {
        player.update(dt, world);
        checkInteractions();
      }

      // 2. World & NPCs & Vehicles
      world.update(dt, t);
      checkLandmarks();
      if (!world.riding && !world.drivingVehicle) updateCompass();

      // Render circular minimap tracking player relative to discovered landmarks
      if (minimap) {
        const pPos = world.drivingVehicle
          ? world.drivingVehicle.pos
          : player.pos;
        const pYaw = world.drivingVehicle
          ? world.drivingVehicle.yaw
          : player.yaw;
        minimap.render(pPos, pYaw, world.landmarks, worldKey, dt);
      }

      // 3. Monsters & Titans
      if (monsterSystem) {
        monsterSystem.update(dt, player.pos, camera);
      }

      // 4. Weapons & Tracers
      if (weaponManager) {
        weaponManager.update(dt);
      }

      renderer.render(world.scene, camera);
    } else if (phase === "menu") {
      menuWorld.update(dt, t);
      menuWorld.render();
    }
  } catch (err) {
    console.error(err);
  }
}