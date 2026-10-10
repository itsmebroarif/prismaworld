/* ============================================================
 * js/main/worlds_meta.js
 * Hasil refactor dari monolit main.js — satu file per fitur.
 * ============================================================ */


/* ================= 9 DUNIA METADATA ================= */
export const WORLDS = {
  park: {
    idx: "01",
    name: "Taman Seroja",
    acc: "#7ce3a0",
    hex: 0x7ce3a0,
    icon: "local_florist",
    cat: "nature",
    total: 5,
    desc: "Taman pagi cerah — air mancur, danau, kupu-kupu, Prisma Buggy & botanis ramah.",
  },
  server: {
    idx: "02",
    name: "Area Server",
    acc: "#4de3d4",
    hex: 0x4de3d4,
    icon: "memory",
    cat: "scifi",
    total: 5,
    desc: "Jantung data Prisma: rak holografik, kipas raksasa, Quantum Hover & mekanik sistem.",
  },
  city: {
    idx: "03",
    name: "Kota Senja",
    acc: "#ffb36b",
    hex: 0xffb36b,
    icon: "location_city",
    cat: "scifi",
    total: 5,
    desc: "Metropolis senja neon: layar raksasa, monorel lalu-lalang, Cyber Roadster & barista.",
  },
  funfair: {
    idx: "04",
    name: "Prisma Land",
    acc: "#00b0ff",
    hex: 0x00b0ff,
    icon: "attractions",
    cat: "action",
    total: 8,
    desc: "Taman hiburan megah! Bianglala, komedi putar, roller coaster, drop tower, kapal ayun, cangkir berputar & arkade ritme Prisma Beat!",
  },
  beach: {
    idx: "05",
    name: "Pantai Karang",
    acc: "#5ec8f2",
    hex: 0x5ec8f2,
    icon: "beach_access",
    cat: "nature",
    total: 5,
    desc: "Pulau berpasir putih: mercusuar tua, camar laut, dermaga kayu & buggy pantai.",
  },
  desert: {
    idx: "06",
    name: "Gurun Kalaris",
    acc: "#ff9d5c",
    hex: 0xff9d5c,
    icon: "wb_sunny",
    cat: "combat",
    total: 5,
    desc: "Gurun senja dengan piramida kuno, oasis tersembunyi, rover tempur & pengembara.",
  },
  snow: {
    idx: "07",
    name: "Puncak Esna",
    acc: "#a5e8ff",
    hex: 0xa5e8ff,
    icon: "ac_unit",
    cat: "nature",
    total: 5,
    desc: "Kabin hangat di danau beku kristal, keluarga salju & snowmobile penjelajah gletser.",
  },
  forest: {
    idx: "08",
    name: "Hutan Lunaria",
    acc: "#38bdf8",
    hex: 0x38bdf8,
    icon: "forest",
    cat: "nature",
    total: 5,
    desc: "Hutan malam bercahaya: rune purba, kristal bercahaya, glider safir & peri malam.",
  },
  orbit: {
    idx: "09",
    name: "Stasiun Helios",
    acc: "#9ad1ff",
    hex: 0x9ad1ff,
    icon: "satellite_alt",
    cat: "scifi",
    total: 5,
    desc: "Stasiun antariksa bumi berotasi gravitasi rendah, lunar rover & komandan pertahanan.",
  },
};
export let disc = {};

for (const k of Object.keys(WORLDS)) disc[k] = {};
try {
  const saved = JSON.parse(localStorage.getItem("prisma-disc") || "{}");
  for (const k of Object.keys(WORLDS)) disc[k] = { ...(saved[k] || {}) };
} catch (e) {}
export const discCount = (k) => Object.values(disc[k] || {}).filter(Boolean).length;
export function setAccent(col) {
  document.documentElement.style.setProperty("--acc", col);
}
