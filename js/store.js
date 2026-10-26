/* Laden/Speichern, Migration von gymplan_v1, Export/Import. Storage wird übergeben ({get,set}). */
import { WORKOUTS } from "../data/workouts.js";
import { OLD_TO_NEW, LEGACY_DAY_TO_WORKOUT, LIB_TO_NEW } from "../data/migration-map.js";
import { GEAR, HOME_EXTRA } from "../data/gear.js";
import { REPS_RE } from "./session.js";

export const KEY_V1 = "gymplan_v1";
export const KEY_V2 = "gymplan_v2"; /* frühere v2-App (Profile) – wird nur gelesen */
export const KEY_APP = "gymplan_v3"; /* eigener Speicher dieser Version */

export function defaultState() {
  return {
    version: 3,
    modules: [],
    sessions: [],
    active: null,
    profile: { gym: { gear: GEAR.map(g => g.id) }, homeExtra: [], place: "gym", weights: [], startWeight: 97.9 },
    exSettings: {},
    settings: { restDefault: 90 }
  };
}

const workoutOf = day => WORKOUTS.find(w => w.id === LEGACY_DAY_TO_WORKOUT[day]);

export function migrateV1(v1, now) {
  const s = defaultState();
  s.modules = ["di", "do", "sa"].map(d => {
    const w = workoutOf(d);
    return { id: "m_" + w.id, name: w.name, items: w.items.map(i => ({ ...i })), updated: now };
  });
  for (const [oldId, max] of Object.entries(v1.maxes || {})) {
    const id = OLD_TO_NEW[oldId];
    if (!id || !(max > 0)) continue;
    const pct = (v1.pcts || {})[oldId] ?? 0.7;
    if (!s.exSettings[id] || max > s.exSettings[id].max) s.exSettings[id] = { mode: "pct", max, pct };
  }
  s.sessions = (v1.logs || []).map((l, i) => {
    const w = workoutOf(String(l.short || "").toLowerCase());
    const t = l.d + "T12:00:00";
    return { id: "legacy_" + i, name: w ? w.name : l.day, start: t, end: t, place: "gym",
      source: { kind: "legacy", items: [] }, entries: [], legacy: { sets: l.sets || 0, vol: l.vol || 0 } };
  });
  s.profile.weights = Array.isArray(v1.weights) ? v1.weights.map(w => ({ ...w })) : [];
  return s;
}

/* ---------- Normalisierung: alles, was geladen oder importiert wird, in sichere Form bringen ---------- */
const arr = x => (Array.isArray(x) ? x : []);
const str = (x, d = "") => (x === null || x === undefined ? d : String(x));
const num = x => { if (x === null || x === undefined || x === "") return null; const n = Number(x); return Number.isFinite(n) ? n : null; };
const int = (x, d, lo = 0, hi = Infinity) => { const n = num(x); return n === null ? d : Math.min(hi, Math.max(lo, Math.round(n))); };
const GEAR_IDS = new Set(GEAR.map(g => g.id));

const normItem = it => ({
  ex: str(it?.ex), sets: int(it?.sets, 3, 1, 20),
  reps: REPS_RE.test(str(it?.reps)) ? str(it.reps) : "10–12", rest: int(it?.rest, 90, 0, 600)
});
const normSet = s => ({ kg: num(s?.kg), reps: num(s?.reps), sec: num(s?.sec), done: !!s?.done });
const normEntry = e => ({ ex: str(e?.ex), plan: (({ sets, reps, rest }) => ({ sets, reps, rest }))(normItem(e?.plan)), sets: arr(e?.sets).map(normSet) });

function normSession(s, i) {
  const src = s?.source || {};
  const out = {
    id: str(s?.id, "s_imp" + i), name: str(s?.name, "Training"), start: str(s?.start), end: s?.end ? str(s.end) : null,
    place: s?.place === "home" ? "home" : "gym",
    source: { kind: str(src.kind, "free"), ...(src.id !== undefined ? { id: str(src.id) } : {}), items: arr(src.items).map(normItem).filter(x => x.ex) },
    entries: arr(s?.entries).map(normEntry).filter(e => e.ex)
  };
  if (s?.legacy) out.legacy = { sets: int(s.legacy.sets, 0), vol: num(s.legacy.vol) ?? 0 };
  return out;
}

export function normalizeState(raw) {
  const d = defaultState();
  const p = raw.profile || {};
  const exSettings = {};
  for (const [k, v] of Object.entries(raw.exSettings || {})) {
    if (!v || typeof v !== "object") continue;
    const o = { mode: v.mode === "last" ? "last" : "pct" };
    if (num(v.max) !== null) o.max = num(v.max);
    if (num(v.pct) !== null) o.pct = Math.min(0.95, Math.max(0.3, num(v.pct)));
    exSettings[str(k)] = o;
  }
  return {
    version: 3,
    modules: arr(raw.modules).map((m, i) => ({
      id: str(m?.id, "m_imp" + i), name: str(m?.name, "Modul"), items: arr(m?.items).map(normItem).filter(x => x.ex),
      updated: str(m?.updated)
    })),
    sessions: arr(raw.sessions).map(normSession),
    active: raw.active ? normSession(raw.active, "a") : null,
    profile: {
      gym: { gear: Array.isArray(p.gym?.gear) ? p.gym.gear.map(String).filter(g => GEAR_IDS.has(g)) : d.profile.gym.gear },
      homeExtra: arr(p.homeExtra).map(String).filter(g => HOME_EXTRA.includes(g)),
      place: p.place === "home" ? "home" : "gym",
      weights: arr(p.weights).map(w => ({ d: str(w?.d), kg: num(w?.kg) })).filter(w => w.kg !== null && w.d),
      startWeight: num(p.startWeight) ?? d.profile.startWeight
    },
    exSettings,
    settings: { restDefault: int(raw.settings?.restDefault, d.settings.restDefault, 0, 600) }
  };
}

/* frühere v2-App: aktives Profil → Module, Max-Werte, Verlauf, Gewicht */
export function migrateV2(v2, now) {
  const s = defaultState();
  const profs = v2.profiles || {};
  /* Profil mit den meisten Daten (bei Gleichstand das aktive) – v2 legt beim Einrichten manchmal ein leeres zweites an */
  const score = q => (q?.logs?.length || 0) * 10 + (q?.weights?.length || 0) + (q?.id === v2.active ? 0.5 : 0);
  const p = Object.values(profs).sort((a, b) => score(b) - score(a))[0];
  if (!p) return s;
  const days = (p.plan && Array.isArray(p.plan.days)) ? p.plan.days : [];
  const instById = {};
  s.modules = days.map((d, i) => {
    const items = [];
    for (const inst of d.ex || []) {
      instById[inst.id] = inst;
      const ex = LIB_TO_NEW[inst.lib];
      if (ex) items.push({ ex, sets: inst.sets, reps: inst.reps, rest: inst.rest });
    }
    return { id: "m_v2_" + i, name: d.title ? d.name + " · " + d.title : d.name, items, updated: now };
  });
  for (const [instId, max] of Object.entries(p.maxes || {})) {
    const id = LIB_TO_NEW[instById[instId]?.lib];
    if (!id || !(max > 0)) continue;
    const pct = (p.pcts || {})[instId] ?? 0.7;
    if (!s.exSettings[id] || max > s.exSettings[id].max) s.exSettings[id] = { mode: "pct", max, pct };
  }
  s.sessions = (p.logs || []).map((l, i) => {
    const t = l.d + "T12:00:00";
    const entries = (l.ex || []).filter(x => LIB_TO_NEW[x.lib] && x.sets > 0).map(x => ({
      ex: LIB_TO_NEW[x.lib], plan: { sets: x.of || x.sets, reps: "10–12", rest: 90 },
      sets: Array.from({ length: x.sets }, () => ({ kg: x.w > 0 ? x.w : null, reps: null, sec: null, done: true }))
    }));
    return { id: "v2_" + i, name: l.dayName || "Training", start: t, end: t, place: "gym",
      source: { kind: "legacy", items: [] }, entries, legacy: { sets: l.sets || 0, vol: l.vol || 0 } };
  });
  s.profile.weights = Array.isArray(p.weights) ? p.weights.map(w => ({ d: w.d, kg: w.kg })) : [];
  const first = s.profile.weights[0]?.kg ?? p.body?.weight;
  if (first > 0) s.profile.startWeight = first;
  return normalizeState(s);
}

export function loadState(storage, now) {
  if (!storage) return { state: defaultState(), warning: "nostorage" };
  const raw = storage.get(KEY_APP);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 3) throw new Error("version");
      return { state: normalizeState(parsed), warning: null };
    } catch (e) {
      try { storage.set(KEY_APP + "_broken_" + now.replace(/[:.]/g, "-"), raw); }
      catch (_) { return { state: defaultState(), warning: "broken-readonly", readOnly: true }; } /* Sicherung fehlgeschlagen: nichts überschreiben */
      return { state: defaultState(), warning: "broken" };
    }
  }
  /* Übernahme: zuerst die neuere v2-App, sonst v1. Alte Schlüssel werden nie beschrieben. */
  const tries = [[KEY_V2, d => d && d.profiles && migrateV2(d, now), "migrated-v2"], [KEY_V1, d => d && d.maxes && migrateV1(d, now), "migrated"]];
  for (const [key, migrate, warning] of tries) {
    const old = storage.get(key);
    if (!old) continue;
    try {
      const state = migrate(JSON.parse(old));
      if (!state) continue;
      saveState(storage, state);
      return { state, warning };
    } catch (e) { /* unlesbar: nächste Quelle, alter Wert bleibt liegen */ }
  }
  return { state: defaultState(), warning: null };
}

export function saveState(storage, state) {
  if (!storage) return false;
  try { storage.set(KEY_APP, JSON.stringify(state)); return true; } catch (e) { return false; }
}

export function exportState(state) {
  return JSON.stringify(state, null, 2);
}

export function importState(text) {
  let data;
  try { data = JSON.parse(text); } catch (e) { return { ok: false, error: "Datei ist kein gültiges JSON." }; }
  if (data && data.profiles && typeof data.profiles === "object") return { ok: true, state: migrateV2(data, new Date().toISOString()) }; /* Sicherung der früheren v2-App */
  if (!data || data.version !== 3) return { ok: false, error: "Unbekannte Backup-Version." };
  if (!Array.isArray(data.modules) || !Array.isArray(data.sessions)) return { ok: false, error: "Backup ist unvollständig." };
  return { ok: true, state: normalizeState(data) };
}
