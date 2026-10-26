/* Bibliothek: Übungen + Workouts, Übungsdetail, Workout-Detail */
import { ctx, commit, go, esc, fmt, toast } from "../ctx.js";
import { MUSCLE_FILTERS } from "../../data/muscles.js";
import { EQUIP_TYPES, GEAR } from "../../data/gear.js";
import { WORKOUTS } from "../../data/workouts.js";
import { EX_BY_ID, filterExercises, activeGear, alternatives, resolveItems, normalize } from "../library.js";
import { bestFor, e1rm, parseNum, addEntry } from "../session.js";
import { bodySvg, muscleTags, musclesOfItems } from "../body.js";
import { exRow, EQUIP_NAME } from "./picker.js";
import { ICON, estMin, openStart } from "./start.js";

const GEAR_NAME = Object.fromEntries(GEAR.map(g => [g.id, g.name]));
const PLACE_LABEL = { gym: "Gym", home: "Zuhause", kh: "Kurzhanteln" };
const lib = { tab: "ex", q: "", muscle: null, equip: null, avail: true };

const backBar = (label, to) => `<div class="row" style="margin-bottom:var(--s3)">
  <button class="icon-btn sm" data-act="back" data-to="${to}" aria-label="Zurück">${ICON.back}</button>
  <span class="muted" style="font-size:var(--text-sm)">${label}</span></div>`;

function gearNow() { return activeGear(ctx.state.profile, ctx.state.profile.place || "gym"); }

/* ---------- Liste ---------- */
function exList() {
  const list = filterExercises({ q: lib.q, muscle: lib.muscle, equip: lib.equip, gear: lib.avail ? gearNow() : null });
  if (!list.length) return `<div class="empty">Keine Übung gefunden.${lib.avail ? "<br>Tipp: „Nur verfügbar“ ausschalten." : ""}</div>`;
  return `<p class="faint" style="font-size:var(--text-xs);padding:0 var(--s1) var(--s2)">${list.length} Übungen</p>` +
    list.map(e => exRow(e, { act: "open-ex" })).join("");
}

function woList() {
  const nq = normalize(lib.q.trim());
  const ws = WORKOUTS.filter(w => (!nq || normalize(w.name).includes(nq)) && (!lib.muscle || w.tags.includes(lib.muscle)));
  const groups = ["gym", "kh", "home"].map(p => [p, ws.filter(w => w.place === p)]).filter(([, l]) => l.length);
  if (!groups.length) return `<div class="empty">Kein Workout gefunden.</div>`;
  return groups.map(([p, l]) => `<div class="label">${PLACE_LABEL[p]}</div>` + l.map(w => {
    const mu = musclesOfItems(w.items);
    return `<button class="list-row" data-act="open-wo" data-id="${w.id}">
      <div class="mini-body">${bodySvg(mu.primary, mu.secondary)}</div>
      <div class="grow"><div class="t">${esc(w.name)}</div><div class="s">${w.items.length} Übungen · ca. ${estMin(w.items)} min</div></div>
      <span class="end">${ICON.chev}</span></button>`;
  }).join("")).join("");
}

export function renderList(root, param) {
  if (param === "workouts") lib.tab = "wo";
  const isEx = lib.tab === "ex";
  root.innerHTML = `<div class="sechead"><h2>Bibliothek</h2></div>
    <div class="seg" style="margin-bottom:var(--s3)">
      <button data-act="tab" data-t="ex" class="${isEx ? "on" : ""}">Übungen</button>
      <button data-act="tab" data-t="wo" class="${!isEx ? "on" : ""}">Workouts (${WORKOUTS.length})</button></div>
    <div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
      <input class="field" type="search" placeholder="${isEx ? "Übung suchen" : "Workout suchen"}" value="${esc(lib.q)}" data-in="q" enterkeyhint="search"></div>
    <div class="chips" style="margin-top:var(--s3)">
      <button class="chip ${!lib.muscle ? "on" : ""}" data-act="mus" data-m="">Alle Muskeln</button>
      ${MUSCLE_FILTERS.map(f => `<button class="chip ${lib.muscle === f.id ? "on" : ""}" data-act="mus" data-m="${f.id}">${f.name}</button>`).join("")}</div>
    ${isEx ? `<div class="chips">
      <button class="chip ${!lib.equip ? "on" : ""}" data-act="eq" data-e="">Alle Geräte</button>
      ${EQUIP_TYPES.map(t => `<button class="chip ${lib.equip === t.id ? "on" : ""}" data-act="eq" data-e="${t.id}">${t.name}</button>`).join("")}</div>
    <div class="toggle"><span>Nur verfügbar (${ctx.state.profile.place === "home" ? "Zuhause" : "Mein Gym"})</span>
      <button class="switch ${lib.avail ? "on" : ""}" data-act="avail" aria-label="Nur verfügbare Übungen"></button></div>` : ""}
    <div id="libList">${isEx ? exList() : woList()}</div>`;

  root.oninput = e => {
    if (e.target.dataset.in !== "q") return;
    lib.q = e.target.value;
    document.getElementById("libList").innerHTML = lib.tab === "ex" ? exList() : woList();
  };
  root.onclick = e => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const a = b.dataset.act;
    if (a === "tab") { lib.tab = b.dataset.t; if (location.hash !== "#/library") location.hash = "#/library"; else ctx.render(); }
    else if (a === "mus") { lib.muscle = b.dataset.m || null; ctx.render(); }
    else if (a === "eq") { lib.equip = b.dataset.e || null; ctx.render(); }
    else if (a === "avail") { lib.avail = !lib.avail; ctx.render(); }
    else if (a === "open-ex") go("exercise/" + b.dataset.id);
    else if (a === "open-wo") go("workout/" + b.dataset.id);
  };
}

/* ---------- Übungsdetail ---------- */
function chart(points) {
  if (points.length < 2) return "";
  const W = 320, H = 120, P = 18;
  const vs = points.map(p => p.v), lo = Math.min(...vs), hi = Math.max(...vs), span = hi - lo || 1;
  const x = i => P + i * (W - 2 * P) / (points.length - 1);
  const y = v => H - P - (v - lo) / span * (H - 2 * P);
  const d = points.map((p, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p.v).toFixed(1)).join(" ");
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Verlauf geschätztes Max">
    <path class="a" d="${d} L${x(points.length - 1)} ${H - P} L${x(0)} ${H - P} Z"/><path class="l" d="${d}"/>
    ${points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.v)}" r="3.5"/>`).join("")}
    <text x="${P}" y="${H - 3}">${p0(points[0].d)}</text><text x="${W - P}" y="${H - 3}" text-anchor="end">${p0(points.at(-1).d)}</text>
  </svg>`;
}
const p0 = d => new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });

export function renderExercise(root, id) {
  const ex = EX_BY_ID.get(id);
  if (!ex) { root.innerHTML = `<div class="empty">Übung nicht gefunden.</div>`; return; }
  const st = ctx.state;
  const best = bestFor(st.sessions, id);
  const pts = st.sessions.filter(s => s.end && s.entries.some(e => e.ex === id))
    .sort((a, b) => (a.end < b.end ? -1 : 1)).slice(-12)
    .map(s => ({ d: s.end, v: Math.max(...s.entries.filter(e => e.ex === id).flatMap(e => e.sets.filter(x => x.done).map(x => e1rm(x.kg, x.reps)))) }))
    .filter(p => p.v > 0);
  const setg = st.exSettings[id] || { mode: "last" };
  const alts = alternatives(id, gearNow()).slice(0, 5);
  root.innerHTML = backBar("Bibliothek", "library") + `
    <div class="ex-hero" style="padding-top:0"><div class="grow">
      <h2 style="font-size:var(--text-xl)">${esc(ex.name)}</h2>
      <div class="gear muted" style="font-size:var(--text-sm)">${EQUIP_NAME[ex.equip]}${ex.gear ? " · " + esc(GEAR_NAME[ex.gear]) : ""}</div>
      ${muscleTags(ex)}</div>
      <div style="flex:none">${bodySvg(ex.primary, ex.secondary, "lg").replace('body-lg"', 'body-lg" style="height:150px"')}</div></div>
    <div class="card"><b style="font-size:var(--text-sm)">Ausführung</b><p class="muted" style="font-size:var(--text-sm);margin-top:4px">${esc(ex.cue)}</p></div>
    ${st.active ? `<button class="btn block" style="margin-top:var(--s3)" data-act="add-live">${ICON.plus.replace("<svg", '<svg width="20" height="20"')} Ins laufende Training</button>` : ""}
    ${ex.type === "kraft" ? `
    <div class="label">Dein Fortschritt</div>
    <div class="card">${best.e1rm > 0 ? `<div class="statgrid" style="margin-bottom:var(--s2)">
        <div><b class="num lime" style="font-size:var(--text-xl)">${fmt(best.kg, 2)} kg</b><div class="faint" style="font-size:var(--text-xs)">höchstes Gewicht</div></div>
        <div><b class="num lime" style="font-size:var(--text-xl)">${fmt(best.e1rm, 1)} kg</b><div class="faint" style="font-size:var(--text-xs)">geschätztes Max (1RM)</div></div></div>${chart(pts)}`
      : `<p class="muted" style="font-size:var(--text-sm)">Noch keine Sätze geloggt.</p>`}</div>
    <div class="label">Gewichtsvorschlag im Training</div>
    <div class="card stack">
      <div class="seg"><button data-act="mode" data-m="last" class="${setg.mode !== "pct" ? "on" : ""}">Letztes Mal</button>
        <button data-act="mode" data-m="pct" class="${setg.mode === "pct" ? "on" : ""}">Max × %</button></div>
      ${setg.mode === "pct" ? `<div class="row">
        <label class="grow"><span class="faint" style="font-size:var(--text-xs)">Max (kg)</span><input class="field num" inputmode="decimal" data-in="max" value="${setg.max ?? ""}" placeholder="${best.e1rm ? fmt(best.e1rm, 1) + " (geschätzt)" : "z. B. 60"}"></label>
        <label style="width:96px"><span class="faint" style="font-size:var(--text-xs)">Prozent</span><input class="field num" inputmode="numeric" data-in="pct" value="${Math.round((setg.pct ?? 0.7) * 100)}"></label></div>
        <p class="muted" style="font-size:var(--text-sm)">Arbeitsgewicht: <b class="lime num">${fmt(Math.round((setg.max ?? best.e1rm) * (setg.pct ?? 0.7) * 4) / 4, 2)} kg</b>${setg.max == null ? " (aus geschätztem Max)" : ""}</p>`
      : `<p class="muted" style="font-size:var(--text-sm)">Jeder Satz startet mit Gewicht und Wiederholungen vom letzten Training.</p>`}
    </div>` : ""}
    ${alts.length ? `<div class="label">Alternativen</div>${alts.map(e => exRow(e, { act: "open-ex" })).join("")}` : ""}`;

  root.onchange = e => {
    const f = e.target.dataset.in;
    if (!f) return;
    const v = parseNum(e.target.value);
    commit(s => {
      const cur = s.exSettings[id] || { mode: "pct", pct: 0.7 };
      if (f === "max") cur.max = v === null ? undefined : v;
      if (f === "pct") { if (v === null || v < 30 || v > 95) { toast("Prozent zwischen 30 und 95"); return; } cur.pct = v / 100; }
      s.exSettings[id] = cur;
    });
  };
  root.onclick = e => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const a = b.dataset.act;
    if (a === "back") go(b.dataset.to);
    else if (a === "open-ex") go("exercise/" + b.dataset.id);
    else if (a === "mode") commit(s => { s.exSettings[id] = { ...(s.exSettings[id] || { pct: 0.7 }), mode: b.dataset.m }; });
    else if (a === "add-live") {
      commit(s => {
        const item = { ex: id, sets: ex.type === "cardio" ? 1 : 3, reps: ex.type === "zeit" ? "45 s" : ex.type === "cardio" ? "10 min" : "10–12", rest: ex.type === "cardio" ? 0 : s.settings.restDefault };
        s.active = addEntry(s.active, item, s.sessions, s.exSettings);
      }, { render: false });
      ctx.ui.liveIndex = ctx.state.active.entries.length - 1;
      go("live");
    }
  };
}

/* ---------- Workout-Detail ---------- */
export function renderWorkout(root, id) {
  const w = WORKOUTS.find(x => x.id === id);
  if (!w) { root.innerHTML = `<div class="empty">Workout nicht gefunden.</div>`; return; }
  const mu = musclesOfItems(w.items);
  const res = resolveItems(w.items, activeGear(ctx.state.profile, w.place === "home" ? "home" : ctx.state.profile.place || "gym"));
  root.innerHTML = backBar("Workouts", "library/workouts") + `
    <div class="ex-hero" style="padding-top:0"><div class="grow">
      <span class="badge">${PLACE_LABEL[w.place]}</span>
      <h2 style="font-size:var(--text-xl);margin-top:6px">${esc(w.name)}</h2>
      <div class="muted" style="font-size:var(--text-sm)">${w.items.length} Übungen · ca. ${estMin(w.items)} min</div></div>
      <div style="flex:none">${bodySvg(mu.primary, mu.secondary, "lg").replace('body-lg"', 'body-lg" style="height:130px"')}</div></div>
    <div class="row" style="margin-bottom:var(--s4)">
      <button class="btn btn-primary grow" data-act="start">Starten</button>
      <button class="btn grow" data-act="dup">Duplizieren & anpassen</button></div>
    ${w.items.map((it, i) => {
      const e = EX_BY_ID.get(it.ex), r = res[i];
      const note = r.replacedFrom ? ` · <span class="badge lime">bei dir: ${esc(EX_BY_ID.get(r.ex).name)}</span>` : r.unavailable ? ` · <span class="badge warn">nicht verfügbar</span>` : "";
      return exRow(e, { act: "open-ex", extra: `<br><span class="num" style="color:var(--text)">${esc(it.sets)} × ${esc(it.reps)}</span>${it.rest ? ` · Pause ${it.rest} s` : ""}${note}` });
    }).join("")}`;
  root.onclick = e => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const a = b.dataset.act;
    if (a === "back") go(b.dataset.to);
    else if (a === "open-ex") go("exercise/" + b.dataset.id);
    else if (a === "start") openStart({ step: "place-only", module: w, kind: "workout" });
    else if (a === "dup") { ctx.ui.draft = { name: w.name, items: structuredClone(w.items) }; go("builder"); }
  };
}
