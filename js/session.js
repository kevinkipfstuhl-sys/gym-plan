/* Live-Training: Sessions anlegen, Sätze loggen, Vorschläge, 1RM, Rekorde. Rein, kein DOM.
   Alle Änderungsfunktionen liefern eine neue Session und verändern die alte nicht. */
import { EX_BY_ID } from "./library.js";

export const REPS_RE = /^(\d+([–-]\d+)?(\/Bein)?|\d+ s|\d+ min)$/;

const round4 = x => Math.round(x * 4) / 4;
const clone = s => structuredClone(s);

export function parseNum(str) {
  if (str === null || str === undefined) return null;
  const s = String(str).trim().replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parseReps(str) {
  const m = String(str).match(/(\d+)(?:\s*[–-]\s*(\d+))?/);
  const low = m ? parseInt(m[1]) : 0;
  const high = m && m[2] ? parseInt(m[2]) : low;
  const unit = /\bmin\b/.test(str) ? "min" : /\d\s*s$/.test(str) ? "sec" : "reps";
  return { low, high, unit };
}

export function e1rm(kg, reps) {
  if (!(kg > 0) || !(reps > 0)) return 0;
  return kg * (1 + reps / 30);
}

const doneSetsOf = (session, exId) =>
  session.entries.filter(e => e.ex === exId).flatMap(e => e.sets.filter(s => s.done));

export function lastSetsFor(sessions, exId) {
  const sorted = [...sessions].filter(s => s.end).sort((a, b) => (a.end < b.end ? 1 : -1));
  for (const s of sorted) {
    const d = doneSetsOf(s, exId);
    if (d.length) return d;
  }
  return null;
}

export function bestFor(sessions, exId) {
  let best = { e1rm: 0, kg: 0 };
  for (const s of sessions) for (const set of doneSetsOf(s, exId)) {
    best = { e1rm: Math.max(best.e1rm, e1rm(set.kg, set.reps)), kg: Math.max(best.kg, set.kg || 0) };
  }
  return best;
}

export function suggestSets(item, sessions, exSetting) {
  const ex = EX_BY_ID.get(item.ex);
  const r = parseReps(item.reps);
  const n = Math.max(1, item.sets);
  const row = (kg, reps, sec) => ({ kg, reps, sec, done: false });
  if (ex && ex.type !== "kraft") {
    const sec = r.unit === "min" ? r.low * 60 : r.low;
    return Array.from({ length: n }, () => row(null, null, sec));
  }
  if (exSetting && exSetting.mode === "pct") {
    const max = exSetting.max ?? bestFor(sessions, item.ex).e1rm;
    const kg = round4(max * (exSetting.pct ?? 0.7));
    return Array.from({ length: n }, () => row(kg, r.low, null));
  }
  const last = lastSetsFor(sessions, item.ex);
  return Array.from({ length: n }, (_, i) => {
    if (!last) return row(0, r.low, null);
    const p = last[Math.min(i, last.length - 1)];
    return row(p.kg ?? 0, p.reps ?? r.low, null);
  });
}

const makeEntry = (item, sessions, exSettings) => ({
  ex: item.ex,
  plan: { sets: item.sets, reps: item.reps, rest: item.rest },
  sets: suggestSets(item, sessions, exSettings[item.ex])
});

export function createSession({ name, place, source, items }, sessions, exSettings, now) {
  return {
    id: "s_" + now.replace(/\D/g, ""),
    name, start: now, end: null, place,
    source: { ...source, items: items.map(i => ({ ex: i.ex, sets: i.sets, reps: i.reps, rest: i.rest })) },
    entries: items.map(i => makeEntry(i, sessions, exSettings))
  };
}

export function addEntry(session, item, sessions, exSettings) {
  const s = clone(session);
  s.entries.push(makeEntry(item, sessions, exSettings));
  return s;
}

export function removeEntry(session, idx) {
  const s = clone(session);
  s.entries.splice(idx, 1);
  return s;
}

export function moveEntry(session, from, to) {
  const s = clone(session);
  const [e] = s.entries.splice(from, 1);
  s.entries.splice(to, 0, e);
  return s;
}

export function setSet(session, ei, si, patch) {
  const s = clone(session);
  Object.assign(s.entries[ei].sets[si], patch);
  return s;
}

/* wie setSet; offene Folgesätze mit dem bisherigen Wert übernehmen den neuen */
export function setSetCascade(session, ei, si, patch) {
  const s = clone(session);
  const sets = s.entries[ei].sets;
  for (const [k, v] of Object.entries(patch)) {
    const old = sets[si][k];
    for (let j = si + 1; j < sets.length; j++) if (!sets[j].done && sets[j][k] === old) sets[j][k] = v;
  }
  Object.assign(sets[si], patch);
  return s;
}

export function addSet(session, ei) {
  const s = clone(session);
  const sets = s.entries[ei].sets;
  const last = sets[sets.length - 1] || { kg: 0, reps: parseReps(s.entries[ei].plan.reps).low, sec: null };
  sets.push({ ...last, done: false });
  return s;
}

export function removeSet(session, ei, si) {
  const s = clone(session);
  s.entries[ei].sets.splice(si, 1);
  return s;
}

export function swapEntry(session, idx, newExId, sessions, exSettings) {
  const s = clone(session);
  const old = s.entries[idx];
  const doneSets = old.sets.filter(x => x.done);
  const remaining = doneSets.length ? Math.max(1, old.plan.sets - doneSets.length) : old.plan.sets;
  const fresh = makeEntry({ ex: newExId, sets: remaining, reps: old.plan.reps, rest: old.plan.rest }, sessions, exSettings);
  if (doneSets.length) {
    old.sets = doneSets;
    s.entries.splice(idx + 1, 0, fresh);
  } else {
    s.entries[idx] = fresh;
  }
  return s;
}

export function volume(session) {
  if (session.legacy) return session.legacy.vol;
  let v = 0;
  for (const e of session.entries) for (const x of e.sets) if (x.done && x.kg > 0 && x.reps > 0) v += x.kg * x.reps;
  return Math.round(v);
}

export function doneCount(session) {
  if (session.legacy) return session.legacy.sets;
  return session.entries.reduce((n, e) => n + e.sets.filter(x => x.done).length, 0);
}

export function finishSession(session, sessions, now) {
  const s = clone(session);
  s.end = now;
  s.entries = s.entries.filter(e => e.sets.some(x => x.done));
  const records = [];
  for (const exId of new Set(s.entries.map(e => e.ex))) {
    if (EX_BY_ID.get(exId)?.type !== "kraft") continue;
    const prev = bestFor(sessions, exId);
    const cur = bestFor([s], exId);
    if (prev.e1rm > 0 && cur.e1rm > prev.e1rm) records.push({ ex: exId, kind: "e1rm", value: Math.round(cur.e1rm * 10) / 10 });
    if (prev.kg > 0 && cur.kg > prev.kg) records.push({ ex: exId, kind: "kg", value: cur.kg });
  }
  const durationMin = Math.round((Date.parse(now) - Date.parse(s.start)) / 60000);
  return { session: s, summary: { durationMin, sets: doneCount(s), volume: volume(s), records } };
}

const sig = list => list.map(i => i.ex + ":" + i.sets).join("|");

export function toModuleItems(session) {
  return session.entries.map(e => ({ ex: e.ex, sets: Math.max(e.plan.sets, e.sets.length), reps: e.plan.reps, rest: e.plan.rest }));
}

export function isModified(session) {
  if (!["module", "workout"].includes(session.source.kind)) return true;
  return sig(toModuleItems(session)) !== sig(session.source.items);
}
