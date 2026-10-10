/* ============================================================
 * js/main/compass.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */
import { buildAndroidWorldCards } from "./android_ui.js";
import { $ } from "./util.js";

const cStrip = $("#compassStrip");

if (cStrip) {
  let str = "";
  for (let i = 0; i < 720; i += 15) {
    const label =
      i % 90 === 0
        ? i % 360 === 0
          ? "U"
          : i % 360 === 90
            ? "T"
            : i % 360 === 180
              ? "S"
              : "B"
        : "";
    str += `<span style="left:${i * 4}px" class="${label ? "" : "tick"}">${label}</span>`;
  }
  cStrip.innerHTML = str;
}


/* ================= MAIN TICK LOOP ================= */

