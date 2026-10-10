/* ============================================================
 * js/core/worlds_meta.js
 * Hasil refactor dari script inline index.html — satu file per fitur.
 * ============================================================ */
import { pickWorld } from "../app.js";
import { addRipple } from "./ui.js";
import { $ } from "./util.js";

export const WORLDS = {
  park: {
    idx: "01",
    name: "Taman Seroja",
    acc: "#7ce3a0",
    hex: 0x7ce3a0,
    icon: "local_florist",
    total: 5,
    desc: "Taman pagi yang cerah — air mancur, danau, kupu-kupu, dan kelopak yang berjatuhan.",
  },
  server: {
    idx: "02",
    name: "Area Server",
    acc: "#4de3d4",
    hex: 0x4de3d4,
    icon: "memory",
    total: 5,
    desc: "Jantung data Prisma: rak yang berkedip, kipas raksasa, dan inti holografik yang berputar.",
  },
  city: {
    idx: "03",
    name: "Kota Senja",
    acc: "#ffb36b",
    hex: 0xffb36b,
    icon: "location_city",
    total: 5,
    desc: "Kota kecil saat matahari terbenam — layar raksasa, monorel, lalu-lalang mobil, dan gang neon.",
  },
  funfair: {
    idx: "04",
    name: "Prisma Land",
    acc: "#ff6fb5",
    hex: 0xff6fb5,
    icon: "attractions",
    total: 5,
    desc: "Taman hiburan! Komedi putar, bianglala, kembang api — dan Prisma Cyclone yang makin lap makin ngebut.",
  },
  beach: {
    idx: "05",
    name: "Pantai Karang",
    acc: "#5ec8f2",
    hex: 0x5ec8f2,
    icon: "beach_access",
    total: 5,
    desc: "Pulau kecil berpasir putih: dermaga kayu, mercusuar tua, dan camar yang selalu berputar.",
  },
  desert: {
    idx: "06",
    name: "Gurun Kalaris",
    acc: "#ff9d5c",
    hex: 0xff9d5c,
    icon: "wb_sunny",
    total: 5,
    desc: "Gurun senja dengan piramida purba, oasis tersembunyi, dan api unggun pengembara.",
  },
  snow: {
    idx: "07",
    name: "Puncak Esna",
    acc: "#a5e8ff",
    hex: 0xa5e8ff,
    icon: "ac_unit",
    total: 5,
    desc: "Dunia salju yang tenang: kabin kayu hangat, danau beku, dan keluarga salju yang menunggu.",
  },
  forest: {
    idx: "08",
    name: "Hutan Lunaria",
    acc: "#b78bff",
    hex: 0xb78bff,
    icon: "forest",
    total: 5,
    desc: "Hutan malam bercahaya: jamur raksasa, kunang-kunang, dan pohon purba berlingkar rune.",
  },
  orbit: {
    idx: "09",
    name: "Stasiun Helios",
    acc: "#9ad1ff",
    hex: 0x9ad1ff,
    icon: "satellite_alt",
    total: 5,
    desc: "Stasiun antariksa mengorbit planet biru. Gravitasinya rendah — lompatanmu melayang jauh.",
  },
};
export let disc = {};
for (const k of Object.keys(WORLDS)) disc[k] = {};
try {
  const saved = JSON.parse(localStorage.getItem("prisma-disc") || "{}");
  for (const k of Object.keys(WORLDS)) disc[k] = { ...(saved[k] || {}) };
} catch (e) {}
export function saveDisc() {
  try {
    localStorage.setItem("prisma-disc", JSON.stringify(disc));
  } catch (e) {}
}
export const discCount = (k) =>
  Object.values(disc[k] || {}).filter(Boolean).length;
export function refreshWorldRows() {
  $("#worldRows").innerHTML = Object.entries(WORLDS)
    .map(([k, w]) => {
      const n = discCount(k);
      const pill =
        n === 0
          ? `<span class="best neutral">BELUM DIJELAJAHI</span>`
          : n === w.total
            ? `<span class="best"><span class="msr sm">check</span>SELESAI</span>`
            : `<span class="best">${n}/${w.total} LANDMARK</span>`;
      return `<div class="grow-row" data-key="${k}" style="--acc:${w.acc}">
<span class="num">${w.idx}</span>
<span class="name"><span class="msr sm">${w.icon}</span>${w.name}</span>${pill}
<span class="desc">${w.desc}</span></div>`;
    })
    .join("");
  document.querySelectorAll("#worldRows .grow-row").forEach((r) => {
    addRipple(r);
    r.addEventListener("click", () => pickWorld(r.dataset.key));
  });
}

/* ================= INPUT — pandang 360° penuh ================= */
