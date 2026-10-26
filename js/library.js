/* Bibliotheks-Logik: Verfügbarkeit, Filter, Alternativen, Vorschläge. Kein DOM. */
import { EXERCISES } from "../data/exercises.js";
import { MUSCLE_FILTERS } from "../data/muscles.js";
import { EQUIP_PRIORITY, HOME_BASE } from "../data/gear.js";

export const EX_BY_ID = new Map(EXERCISES.map(e => [e.id, e]));

export function activeGear(profile, place) {
  if (place === "home") return new Set([...HOME_BASE, ...(profile.homeExtra || [])]);
  return new Set(profile.gym.gear);
}

export function isAvailable(ex, gear) {
  return ex.gear === null || gear.has(ex.gear);
}

const byPriorityThenName = (a, b) =>
  EQUIP_PRIORITY[a.equip] - EQUIP_PRIORITY[b.equip] || a.name.localeCompare(b.name, "de");

export function rankExercises(list) {
  return [...list].sort(byPriorityThenName);
}

export function normalize(s) {
  return s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
}

function musclesOf(filterId) {
  const f = MUSCLE_FILTERS.find(m => m.id === filterId);
  return f ? f.muscles : [];
}

export function filterExercises({ q = "", muscle = null, equip = null, gear = null } = {}) {
  const nq = normalize(q.trim());
  const ms = muscle ? musclesOf(muscle) : null;
  return rankExercises(EXERCISES.filter(e =>
    (!nq || normalize(e.name).includes(nq)) &&
    (!ms || e.primary.some(m => ms.includes(m)) || e.secondary.some(m => ms.includes(m))) &&
    (!equip || e.equip === equip) &&
    (!gear || isAvailable(e, gear))
  ));
}

export function alternatives(exId, gear) {
  const ex = EX_BY_ID.get(exId);
  if (!ex) return [];
  const explicit = new Set(ex.alt);
  const cands = EXERCISES.filter(e =>
    e.id !== exId && e.type === ex.type && isAvailable(e, gear) &&
    (explicit.has(e.id) || e.primary[0] === ex.primary[0]));
  return cands.sort((a, b) =>
    EQUIP_PRIORITY[a.equip] - EQUIP_PRIORITY[b.equip] ||
    (explicit.has(b.id) - explicit.has(a.id)) ||
    a.name.localeCompare(b.name, "de"));
}

export function suggestForMuscles(filterIds, gear) {
  const perFilter = filterIds.length === 1 ? 5 : filterIds.length === 2 ? 3 : 2;
  const picked = [];
  const usedGear = new Set();
  for (const fid of filterIds) {
    const ms = musclesOf(fid);
    const cands = rankExercises(EXERCISES.filter(e =>
      e.type === "kraft" && isAvailable(e, gear) && e.primary.some(m => ms.includes(m)) &&
      !picked.some(p => p.id === e.id)));
    const gearKey = e => e.gear ?? "_" + e.id;
    const fresh = cands.filter(e => !usedGear.has(gearKey(e)));
    const rest = cands.filter(e => usedGear.has(gearKey(e)));
    const take = [];
    for (const e of fresh) {
      if (take.length >= perFilter) break;
      if (take.some(t => gearKey(t) === gearKey(e))) continue;
      take.push(e);
    }
    for (const e of [...fresh, ...rest]) {
      if (take.length >= perFilter) break;
      if (!take.includes(e)) take.push(e);
    }
    take.forEach(e => { picked.push(e); usedGear.add(gearKey(e)); });
  }
  return picked.slice(0, 6).map(e => ({ ex: e.id, sets: 3, reps: "10–12", rest: 90 }));
}

export function resolveItems(items, gear) {
  return items.map(it => {
    const ex = EX_BY_ID.get(it.ex);
    if (!ex || isAvailable(ex, gear)) return { ...it };
    const viaAlt = ex.alt.map(id => EX_BY_ID.get(id)).find(a => a && a.type === ex.type && isAvailable(a, gear));
    const repl = viaAlt || alternatives(it.ex, gear)[0];
    if (!repl) return { ...it, unavailable: true };
    return { ...it, ex: repl.id, replacedFrom: it.ex };
  });
}
