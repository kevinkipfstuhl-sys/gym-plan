/* Stilisierte Muskel-Silhouette (vorne + hinten) als SVG-String */
import { MUSCLES } from "../data/muscles.js";
import { EX_BY_ID } from "./library.js";

const R = (x, y, w, h, r) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
const E = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
const C = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
const P = d => `<path d="${d}"/>`;
const pair = (f, x, ...a) => f(x, ...a) + f(100 - x, ...a);
const pairR = (x, y, w, h, r) => R(x, y, w, h, r) + R(100 - x - w, y, w, h, r);

const BASE = C(50, 15, 10) + R(45, 24, 10, 8, 3) + R(30, 32, 40, 76, 14) + R(34, 102, 32, 18, 8) +
  pair(E, 20, 98, 5, 13) + pair(C, 19, 116, 4.5) + pair(E, 42, 166, 6, 5) + pair(E, 41, 217, 6, 4);

const FRONT = {
  schulter_s: pair(E, 21, 47, 5.5, 9),
  schulter_v: pair(E, 30, 42, 8, 7),
  brust: pairR(33, 47, 16, 15, 6),
  bizeps: pair(E, 23, 71, 6, 12),
  bauch: [41, 51].flatMap(x => [65, 78, 91].map(y => R(x, y, 8, 11, 3))).join("") + pairR(34, 66, 5, 30, 3),
  quad: pair(E, 42, 138, 8, 24),
  _shin: pairR(37, 172, 9, 40, 4)
};

const BACK = {
  lat: P("M40 29 L60 29 L69 39 L31 39 Z") + P("M32 45 L48 49 L48 80 L39 88 Z") + P("M68 45 L52 49 L52 80 L61 88 Z"),
  schulter_h: pair(E, 28, 43, 8, 7),
  trizeps: pair(E, 23, 68, 6, 12),
  unterer_ruecken: R(42, 85, 16, 18, 5),
  po: pair(E, 42, 116, 9, 10),
  beinbeuger: pair(E, 42, 146, 7.5, 20),
  waden: pair(E, 41, 186, 6, 15)
};

function figure(parts, primary, secondary) {
  let g = `<g class="base">${BASE}</g>`;
  for (const [m, shapes] of Object.entries(parts)) {
    if (m.startsWith("_")) { g += `<g class="base">${shapes}</g>`; continue; }
    const cls = primary.includes(m) ? "m p" : secondary.includes(m) ? "m s" : "m";
    g += `<g class="${cls}" data-m="${m}">${shapes}</g>`;
  }
  return `<svg viewBox="0 0 100 230" aria-hidden="true">${g}</svg>`;
}

export function bodySvg(primary = [], secondary = [], size = "sm") {
  return `<div class="body-fig body-${size}">${figure(FRONT, primary, secondary)}${figure(BACK, primary, secondary)}</div>`;
}

const NAME = new Map(MUSCLES.map(m => [m.id, m.name]));
export function muscleLabel(ids) {
  return ids.map(id => NAME.get(id) || id).join(", ");
}

/* Muskeln einer Liste von Items (Module/Workouts): primär = alle primären, sekundär = Rest */
export function musclesOfItems(items) {
  const p = new Set(), s = new Set();
  for (const it of items) {
    const e = EX_BY_ID.get(it.ex);
    if (!e || e.type === "cardio") continue;
    e.primary.forEach(m => p.add(m));
    e.secondary.forEach(m => s.add(m));
  }
  return { primary: [...p], secondary: [...s].filter(m => !p.has(m)) };
}

/* Muskel-Tags (Punkt + Text) */
export function muscleTags(ex) {
  return `<div class="mtags">${ex.primary.map(m => `<span class="mtag p">${NAME.get(m)}</span>`).join("")}${ex.secondary.map(m => `<span class="mtag">${NAME.get(m)}</span>`).join("")}</div>`;
}
