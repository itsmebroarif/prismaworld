/* ============================================================
 * js/main/world_index.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import { BeachWorld } from "./worlds/beach.js";
import { CityWorld } from "./worlds/city.js";
import { DesertWorld } from "./worlds/desert.js";
import { ForestWorld } from "./worlds/forest.js";
import { FunWorld } from "./worlds/funfair.js";
import { OrbitWorld } from "./worlds/orbit.js";
import { ParkWorld } from "./worlds/park.js";
import { ServerWorld } from "./worlds/server.js";
import { SnowWorld } from "./worlds/snow.js";

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
