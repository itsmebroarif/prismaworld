/* ============================================================
 * js/worlds/index.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import { BeachWorld } from "./beach.js";
import { CityWorld } from "./city.js";
import { DesertWorld } from "./desert.js";
import { ForestWorld } from "./forest.js";
import { FunWorld } from "./funfair.js";
import { OrbitWorld } from "./orbit.js";
import { ParkWorld } from "./park.js";
import { ServerWorld } from "./server.js";
import { SnowWorld } from "./snow.js";

export const WORLD_CLASSES = {
  park: ParkWorld,
  server: ServerWorld,
  city: CityWorld,
  funfair: FunWorld,
  beach: BeachWorld,
  desert: DesertWorld,
  snow: SnowWorld,
  forest: ForestWorld,
  orbit: OrbitWorld,
};
