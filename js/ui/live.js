/* Live-Training: eine Übung pro Bildschirm, Sätze loggen, Gerät tauschen, Liste bearbeiten, abschließen */
import { ctx, commit, go, esc, fmt, toast, now, vibrate, startTimer, stopTimer, armed } from "../ctx.js";
import { openSheet, closeSheet } from "./sheet.js";
import { openPicker, exRow, EQUIP_NAME } from "./picker.js";
import { EX_BY_ID, alternatives, activeGear } from "../library.js";
import { GEAR } from "../../data/gear.js";
import {
  parseNum, setSet, setSetCascade, addSet, removeSet, addEntry, removeEntry, moveEntry, swapEntry,
  doneCount, volume, finishSession, isModified, toModuleItems
} from "../session.js";
import { bodySvg, muscleTags } from "../body.js";
import { ICON } from "./start.js";

const GEAR_NAME = Object.fromEntries(GEAR.map(g => [g.id, g.name]));
const CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
const DRAG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 9h14M5 15h14"/></svg>`;

let durInt = null, wakeLock = null;

const mmss = ms => { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600); const m = Math.floor(s / 60) % 60;
  return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s % 60).padStart(2, "0"); };

async function requestWake() {
  try { if (navigator.wakeLock && !wakeLock) { wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release", () => { wakeLock = null; }); } } catch (e) { /* nicht verfügbar */ }
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && document.body.classList.contains("live")) requestWake();
});

export function leave() {
  clearInterval(durInt); durInt = null;
  try { wakeLock?.release(); } catch (e) { /* egal */ }
  wakeLock = null;
}

const act = () => ctx.state.active;
const update = (fn, render = true) => commit(st => { st.active = fn(st.active); }, { render });
const gearNow = () => activeGear(ctx.state.profile, act().place);

/* ---------- Satz-Zeilen ---------- */
function stepper(ei, si, field, value, step, unit) {
  return `<div class="stepper">
    <button data-act="step" data-ei="${ei}" data-si="${si}" data-f="${field}" data-d="${-step}" aria-label="weniger">−</button>
    <label><input type="text" inputmode="decimal" value="${esc(value === null || value === undefined ? "" : String(value).replace(".", ","))}"
      data-in="${field}" data-ei="${ei}" data-si="${si}" aria-label="${unit}"><small>${unit}</small></label>
    <button data-act="step" data-ei="${ei}" data-si="${si}" data-f="${field}" data-d="${step}" aria-label="mehr">+</button>
  </div>`;
}

function setRows(entry, ei, ex) {
  return entry.sets.map((s, si) => {
    let cells;
    if (ex.type === "kraft") cells = stepper(ei, si, "kg", s.kg, 2.5, "kg") + stepper(ei, si, "reps", s.reps, 1, "Wdh.");
    else if (ex.type === "zeit") cells = stepper(ei, si, "sec", s.sec, 5, "Sek.");
    else cells = stepper(ei, si, "min", s.sec === null ? null : Math.round(s.sec / 60), 1, "Min.");
    return `<div class="setrow${ex.type === "kraft" ? "" : " single"}${s.done ? " done" : ""}">
      <span class="no">${si + 1}</span>${cells}
      <button class="check-btn" data-act="check" data-ei="${ei}" data-si="${si}" aria-label="Satz ${si + 1} erledigt">${CHECK}</button>
    </div>`;
  }).join("");
}

/* ---------- Render ---------- */
export function render(root) {
  if (ctx.ui.summary) return renderDone(root);
  const a = act();
  if (!a) { go("start"); return; }
  requestWake();
  const n = a.entries.length;
  /* nach Neustart der App: zur ersten Übung mit offenen Sätzen */
  if (ctx.ui.liveIndex === null) ctx.ui.liveIndex = Math.max(0, a.entries.findIndex(e => e.sets.some(s => !s.done)));
  const idx = ctx.ui.liveIndex = Math.min(Math.max(0, ctx.ui.liveIndex), Math.max(0, n - 1));
  const entry = a.entries[idx];
  const ex = entry && (EX_BY_ID.get(entry.ex) || { id: entry.ex, name: "Unbekannte Übung", primary: [], secondary: [], equip: "koerper", gear: null, type: "kraft", cue: "", alt: [] });
  const allDone = entry && entry.sets.length > 0 && entry.sets.every(s => s.done);
  const last = idx === n - 1;
  const unavailable = ex && ex.gear && !gearNow().has(ex.gear);

  root.innerHTML = `<div class="live">
    <div class="live-top">
      <div class="row">
        <button class="icon-btn sm" data-act="back" aria-label="Zur Startseite (Training läuft weiter)">${ICON.back}</button>
        <div class="ttl"><b>${esc(a.name)}</b><span><span id="liveDur">${mmss(Date.now() - Date.parse(a.start))}</span> · ${doneCount(a)} Sätze</span></div>
        <button class="btn btn-sm" data-act="finish" style="min-width:76px">Fertig</button>
      </div>
      ${n ? `<div class="progress">${a.entries.map((e, i) => `<i class="${i === idx ? "cur" : e.sets.length && e.sets.every(s => s.done) ? "done" : ""}"></i>`).join("")}</div>` : ""}
    </div>
    <div class="live-body" id="liveBody">
      ${!n ? `<div class="empty" style="margin-top:var(--s5)">Noch keine Übung im Training.<br><button class="btn btn-primary" data-act="add">${ICON.plus.replace("<svg", '<svg width="20" height="20"')} Übung hinzufügen</button></div>` : `
      <div class="ex-hero">
        <div class="grow">
          <div class="pos">Übung ${idx + 1} von ${n}</div>
          <h2>${esc(ex.name)}</h2>
          <div class="gear">${EQUIP_NAME[ex.equip] || ""}${ex.gear ? " · " + esc(GEAR_NAME[ex.gear] || ex.gear) : ""}</div>
          ${unavailable ? `<span class="badge warn" style="margin-top:6px">nicht in deinem Geräte-Profil</span>` : ""}
          ${muscleTags(ex)}
        </div>
        <div style="height:132px;flex:none">${bodySvg(ex.primary, ex.secondary, "lg").replace('body-lg"', 'body-lg" style="height:132px"')}</div>
      </div>
      ${ex.cue ? `<details class="cue"><summary>Ausführung <span class="faint">▾</span></summary>${esc(ex.cue)}</details>` : ""}
      <div class="plan-line"><span>Plan ${esc(entry.plan.sets)} × ${esc(entry.plan.reps)}</span><span>${entry.plan.rest ? "Pause " + esc(entry.plan.rest) + " s" : "keine Pause"}</span></div>
      ${setRows(entry, idx, ex)}
      <div class="set-actions">
        <button class="btn btn-sm" data-act="add-set">+ Satz</button>
        <button class="btn btn-sm" data-act="rm-set" ${entry.sets.length > 1 ? "" : "disabled"}>− Satz</button>
      </div>`}
    </div>
    ${n ? `<div class="live-bar"><div class="in">
      <button class="icon-btn" data-act="prev" ${idx === 0 ? "disabled" : ""} aria-label="Vorherige Übung">${ICON.back}</button>
      <button class="btn busy" data-act="busy">Gerät besetzt</button>
      <button class="icon-btn" data-act="list" aria-label="Übungsliste">${ICON.list}</button>
      ${last
        ? `<button class="btn next ${allDone ? "btn-primary" : ""}" data-act="finish">Fertig</button>`
        : `<button class="btn next ${allDone ? "btn-primary" : ""}" data-act="next">Weiter ${ICON.chev}</button>`}
    </div></div>` : ""}
  </div>`;

  clearInterval(durInt);
  durInt = setInterval(() => {
    const el = document.getElementById("liveDur");
    if (el && act()) el.textContent = mmss(Date.now() - Date.parse(act().start));
  }, 1000);

  root.onclick = e => onClick(e);
  root.oninput = e => onInput(e);
  root.onchange = e => onChange(e);
  bindSwipe(root.querySelector("#liveBody"));
}

/* Eingabe sofort speichern, aber nicht neu rendern: sonst gehen Fokus und der nächste Tipp (✓, ±) verloren */
const fieldVal = (f, s) => f === "min" ? (s.sec === null ? "" : String(Math.round(s.sec / 60)))
  : f === "kg" ? (s.kg === null ? "" : String(s.kg).replace(".", ",")) : String(s[f] ?? "");

function onInput(e) {
  const t = e.target;
  if (!t.dataset.in) return;
  const ei = +t.dataset.ei, si = +t.dataset.si, f = t.dataset.in;
  const v = parseNum(t.value);
  if (v === null) return;
  const patch = f === "min" ? { sec: Math.round(v) * 60 } : f === "reps" || f === "sec" ? { [f]: Math.round(v) } : { kg: Math.round(v * 4) / 4 };
  update(s => setSetCascade(s, ei, si, patch), false);
  /* übernommene Werte in den folgenden Feldern sichtbar machen */
  const sets = act().entries[ei].sets;
  document.querySelectorAll(`input[data-in="${f}"][data-ei="${ei}"]`).forEach(inp => {
    const sj = +inp.dataset.si;
    if (sj > si && inp !== document.activeElement) inp.value = fieldVal(f, sets[sj]);
  });
}

/* beim Verlassen des Felds nur die Anzeige auf den gespeicherten Wert normalisieren */
function onChange(e) {
  const t = e.target;
  if (!t.dataset.in || !act()) return;
  const s = act().entries[+t.dataset.ei]?.sets[+t.dataset.si];
  if (s) t.value = fieldVal(t.dataset.in, s);
}

function onClick(e) {
  const b = e.target.closest("[data-act]");
  if (!b || b.disabled) return;
  const a = act();
  const ei = +b.dataset.ei, si = +b.dataset.si;
  switch (b.dataset.act) {
    case "back": go("start"); break;
    case "prev": ctx.ui.liveIndex--; ctx.render(); window.scrollTo({ top: 0 }); break;
    case "next": ctx.ui.liveIndex++; ctx.render(); window.scrollTo({ top: 0 }); break;
    case "step": {
      const s = a.entries[ei].sets[si];
      const f = b.dataset.f, d = parseFloat(b.dataset.d);
      let patch;
      if (f === "kg") patch = { kg: Math.max(0, Math.round(((s.kg || 0) + d) * 4) / 4) };
      else if (f === "reps") patch = { reps: Math.max(0, (s.reps || 0) + d) };
      else if (f === "sec") patch = { sec: Math.max(0, (s.sec || 0) + d) };
      else patch = { sec: Math.max(0, Math.round((s.sec || 0) / 60 + d) * 60) };
      update(x => setSetCascade(x, ei, si, patch));
      break;
    }
    case "check": {
      const was = a.entries[ei].sets[si].done;
      update(x => setSet(x, ei, si, { done: !was }));
      if (!was) {
        vibrate(30);
        const entry = act().entries[ei];
        const allDone = entry.sets.every(s => s.done);
        if (!allDone || ei < act().entries.length - 1) startTimer(entry.plan.rest);
      } else stopTimer();
      break;
    }
    case "add-set": update(x => addSet(x, ctx.ui.liveIndex)); break;
    case "rm-set": update(x => removeSet(x, ctx.ui.liveIndex, x.entries[ctx.ui.liveIndex].sets.length - 1)); break;
    case "add": pickAndAdd(); break;
    case "busy": openBusy(); break;
    case "list": openList(); break;
    case "finish": openFinish(); break;
  }
}

/* Wischen links/rechts wechselt die Übung */
function bindSwipe(el) {
  if (!el) return;
  let x0 = null, y0 = 0;
  el.addEventListener("touchstart", e => {
    if (e.target.closest("input,.stepper")) { x0 = null; return; }
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY;
  }, { passive: true });
  el.addEventListener("touchend", e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    x0 = null;
    if (Math.abs(dx) < 60 || Math.abs(dy) > 50) return;
    const n = act().entries.length;
    const i = ctx.ui.liveIndex + (dx < 0 ? 1 : -1);
    if (i < 0 || i >= n) return;
    ctx.ui.liveIndex = i; ctx.render(); window.scrollTo({ top: 0 });
  });
}

/* ---------- Sheets ---------- */
function pickAndAdd(afterIdx = null) {
  openPicker({
    multi: true,
    onDone(ids) {
      const restDefault = ctx.state.settings.restDefault;
      commit(st => {
        for (const id of ids) {
          const ex = EX_BY_ID.get(id);
          const item = { ex: id, sets: ex.type === "cardio" ? 1 : 3, reps: ex.type === "zeit" ? "45 s" : ex.type === "cardio" ? "10 min" : "10–12", rest: ex.type === "cardio" ? 0 : restDefault };
          st.active = addEntry(st.active, item, st.sessions, st.exSettings);
        }
      }, { render: false });
      ctx.ui.liveIndex = afterIdx ?? act().entries.length - ids.length;
      ctx.render();
      toast(ids.length === 1 ? "Übung hinzugefügt" : ids.length + " Übungen hinzugefügt");
    }
  });
}

function openBusy() {
  const idx = ctx.ui.liveIndex;
  const entry = act().entries[idx];
  const alts = alternatives(entry.ex, gearNow());
  openSheet({
    build: () => ({
      title: "Gerät besetzt – Alternative",
      body: `<p class="muted" style="font-size:var(--text-sm);margin-bottom:var(--s3)">Gleiche Muskeln, nur Geräte aus deinem Profil. Erledigte Sätze bleiben bei der bisherigen Übung.</p>
        ${alts.length ? alts.map(e => exRow(e, { act: "swap" })).join("") : `<div class="empty">Keine passende Alternative verfügbar.</div>`}
        <button class="btn block" style="margin-top:var(--s3)" data-act="other">Andere Übung suchen</button>`
    }),
    onAct(a, el) {
      if (a === "swap") swapTo(el.dataset.id);
      else if (a === "other") openPicker({ title: "Übung tauschen", muscle: null, onDone: ids => swapTo(ids[0]) });
    }
  });
  function swapTo(id) {
    const hadDone = act().entries[idx].sets.some(s => s.done);
    commit(st => { st.active = swapEntry(st.active, idx, id, st.sessions, st.exSettings); }, { render: false });
    if (hadDone) ctx.ui.liveIndex = idx + 1;
    closeSheet(true);
    ctx.render();
    toast("Getauscht: " + EX_BY_ID.get(id).name);
  }
}

function openList() {
  const api = openSheet({
    build: () => {
      const a = act();
      return {
        title: "Übungen im Training",
        body: `<div class="dlist">${a.entries.map((e, i) => {
          const ex = EX_BY_ID.get(e.ex);
          const d = e.sets.filter(s => s.done).length;
          return `<div class="list-row${i === ctx.ui.liveIndex ? " sel" : ""}" data-row="${i}" style="padding-left:4px">
            <span class="drag" data-drag="${i}" aria-label="Ziehen zum Sortieren">${DRAG}</span>
            <button class="grow" style="text-align:left" data-act="jump" data-i="${i}"><div class="t">${esc(ex?.name || e.ex)}</div><div class="s">${d}/${e.sets.length} Sätze</div></button>
            <button class="del" data-act="rm" data-i="${i}" aria-label="Entfernen">✕</button>
          </div>`;
        }).join("")}</div>
        <button class="btn block" style="margin-top:var(--s3)" data-act="add">${ICON.plus.replace("<svg", '<svg width="20" height="20"')} Übung hinzufügen</button>`,
        mount: el => bindDrag(el.querySelector(".dlist"), (from, to) => {
          const cur = ctx.ui.liveIndex;
          commit(st => { st.active = moveEntry(st.active, from, to); }, { render: false });
          /* aktuelle Übung bleibt die aktuelle */
          if (from === cur) ctx.ui.liveIndex = to;
          else if (from < cur && to >= cur) ctx.ui.liveIndex--;
          else if (from > cur && to <= cur) ctx.ui.liveIndex++;
          ctx.render(); api.refresh();
        })
      };
    },
    onAct(a, el, e, api) {
      if (a === "jump") { ctx.ui.liveIndex = +el.dataset.i; closeSheet(); ctx.render(); }
      else if (a === "rm") {
        if (!armed(el)) return;
        const i = +el.dataset.i;
        commit(st => { st.active = removeEntry(st.active, i); }, { render: false });
        if (ctx.ui.liveIndex >= i && ctx.ui.liveIndex > 0) ctx.ui.liveIndex--;
        ctx.render(); api.refresh();
      } else if (a === "add") { closeSheet(true); pickAndAdd(); }
    }
  });
}

/* Ziehen zum Sortieren (Pointer Events) */
export function bindDrag(listEl, onMove) {
  if (!listEl) return;
  listEl.querySelectorAll("[data-drag]").forEach(h => {
    h.addEventListener("pointerdown", e => {
      e.preventDefault();
      const row = h.closest("[data-row],.bitem");
      const rows = [...listEl.children];
      const from = rows.indexOf(row);
      const y0 = e.clientY;
      const mids = rows.map(r => { const b = r.getBoundingClientRect(); return b.top + b.height / 2; });
      let to = from;
      row.classList.add("dragging");
      h.setPointerCapture(e.pointerId);
      const move = ev => {
        const dy = ev.clientY - y0;
        row.style.transform = `translateY(${dy}px)`;
        const y = mids[from] + dy;
        to = mids.filter((m, i) => i !== from && m < y).length;
      };
      const up = () => {
        h.removeEventListener("pointermove", move);
        h.removeEventListener("pointerup", up);
        h.removeEventListener("pointercancel", up);
        row.classList.remove("dragging"); row.style.transform = "";
        if (to !== from) onMove(from, to);
      };
      h.addEventListener("pointermove", move);
      h.addEventListener("pointerup", up);
      h.addEventListener("pointercancel", up);
    });
  });
}

function openFinish() {
  const a = act();
  const d = doneCount(a);
  openSheet({
    build: () => ({
      title: "Training beenden?",
      body: `<div class="statgrid">
          <div class="stat"><b>${d}</b><span>Sätze erledigt</span></div>
          <div class="stat"><b>${fmt(volume(a), 0)}</b><span>kg Volumen</span></div></div>
        ${d ? "" : `<p class="muted" style="font-size:var(--text-sm);margin-top:var(--s3)">Noch kein Satz erledigt – speichern geht erst mit mindestens einem Satz.</p>`}`,
      foot: `<button class="btn btn-danger" data-act="discard">Verwerfen</button>
        <button class="btn btn-primary" data-act="save" ${d ? "" : "disabled"}>Speichern</button>`
    }),
    onAct(x, el) {
      if (x === "discard") {
        if (!armed(el)) return;
        stopTimer();
        commit(st => { st.active = null; }, { render: false });
        closeSheet(true); go("start"); toast("Training verworfen");
      } else if (x === "save") {
        stopTimer();
        const cur = act();
        const modified = isModified(cur);
        const moduleItems = toModuleItems(cur);
        const { session, summary } = finishSession(cur, ctx.state.sessions, now());
        commit(st => { st.sessions.push(session); st.active = null; }, { render: false });
        ctx.ui.summary = { session, summary, modified, moduleItems };
        closeSheet(true); ctx.render(); window.scrollTo({ top: 0 });
      }
    }
  });
}

/* ---------- Abschluss-Bildschirm ---------- */
function renderDone(root) {
  const { session, summary, modified, moduleItems } = ctx.ui.summary;
  const src = session.source;
  const mod = src.kind === "module" ? ctx.state.modules.find(m => m.id === src.id) : null;
  root.innerHTML = `<div class="live" style="padding:0 var(--s4) var(--s6)">
    <div class="done-hero"><div class="pos lime" style="font-family:var(--font-display);font-weight:600;letter-spacing:.6px">GESPEICHERT</div>
      <h2>Sauber gearbeitet.</h2><p>${esc(session.name)}</p></div>
    <div class="statgrid" style="grid-template-columns:1fr 1fr 1fr">
      <div class="stat"><b>${summary.durationMin}</b><span>Minuten</span></div>
      <div class="stat"><b>${summary.sets}</b><span>Sätze</span></div>
      <div class="stat"><b>${fmt(summary.volume, 0)}</b><span>kg Volumen</span></div>
    </div>
    ${summary.records.length ? `<div class="label">Neue Rekorde</div><div class="card">${summary.records.map(r =>
      `<div class="rec"><span class="badge lime">${r.kind === "kg" ? "Höchstes Gewicht" : "Geschätztes Max"}</span><span class="grow">${esc(EX_BY_ID.get(r.ex)?.name || r.ex)}</span><b class="num lime">${fmt(r.value, 1)} kg</b></div>`).join("")}</div>` : ""}
    ${modified ? `<div class="label">${mod ? "Modul anpassen?" : "Als Modul speichern?"}</div>
      <div class="card stack">
        ${mod ? `<p class="muted" style="font-size:var(--text-sm)">Du hast heute Übungen geändert. Soll „${esc(mod.name)}“ so übernommen werden?</p>
          <button class="btn block" data-act="update-mod">Modul aktualisieren</button>` : ""}
        <input class="field" id="modName" value="${esc(mod ? mod.name + " (neu)" : session.name)}" aria-label="Name des Moduls">
        <button class="btn block" data-act="save-mod">Als neues Modul speichern</button>
      </div>` : ""}
    <button class="btn btn-primary block" style="margin-top:var(--s5)" data-act="close">Fertig</button>
  </div>`;
  root.onclick = e => {
    const b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    if (b.dataset.act === "close") { ctx.ui.summary = null; go("start"); }
    else if (b.dataset.act === "update-mod") {
      commit(st => { const m = st.modules.find(x => x.id === mod.id); m.items = moduleItems; m.updated = now(); }, { render: false });
      b.disabled = true; b.textContent = "Modul aktualisiert ✓"; toast("Modul aktualisiert");
    } else if (b.dataset.act === "save-mod") {
      const name = document.getElementById("modName").value.trim();
      if (!name) { toast("Bitte einen Namen eingeben"); return; }
      commit(st => { st.modules.push({ id: "m_" + Date.now(), name, items: moduleItems, updated: now() }); }, { render: false });
      b.disabled = true; b.textContent = "Gespeichert ✓"; toast("Modul gespeichert");
    }
  };
}
