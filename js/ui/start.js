/* Startbildschirm + Start-Sheet (Gym/Zuhause → Muskelgruppe / Workout / Modul / leer) */
import { ctx, commit, go, esc, toast, now } from "../ctx.js";
import { openSheet, closeSheet } from "./sheet.js";
import { MUSCLE_FILTERS } from "../../data/muscles.js";
import { WORKOUTS } from "../../data/workouts.js";
import { EX_BY_ID, activeGear, suggestForMuscles, resolveItems } from "../library.js";
import { createSession, doneCount } from "../session.js";
import { bodySvg, musclesOfItems } from "../body.js";

export const ICON = {
  play: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`,
  chev: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>`,
  body: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="2.5"/><path d="M5 9l7 1.5L19 9M12 10.5V15m0 0l-3 6m3-6l3 6"/></svg>`,
  list: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>`,
  free: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 9v6M9 12h6"/></svg>`
};

/* grobe Dauer: pro Satz 40 s Arbeit + Pause */
export function estMin(items) {
  const sec = items.reduce((t, i) => {
    const r = /min/.test(i.reps) ? parseInt(i.reps) * 60 : 40;
    return t + i.sets * r + Math.max(0, i.sets - 1) * i.rest;
  }, 0);
  return Math.max(5, Math.round(sec / 300) * 5);
}

export function weekCount(sessions) {
  const d = new Date(); const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7)); mon.setHours(0, 0, 0, 0);
  return sessions.filter(s => new Date(s.end || s.start) >= mon).length;
}

const PLACE_NAME = { gym: "Gym", home: "Zuhause" };

export function workoutsForPlace(place, profile) {
  return WORKOUTS.filter(w => w.place === place ||
    (w.place === "kh" && (place === "gym" || (profile.homeExtra || []).includes("kurzhanteln"))));
}

/* Gemeinsamer Einstieg für alle Startwege */
export function startSession({ name, source, items, place }) {
  const s = ctx.state;
  if (s.active) {
    toast("Es läuft schon ein Training", { label: "Öffnen", run: () => go("live") });
    return false;
  }
  const pl = place || s.profile.place || "gym";
  const resolved = resolveItems(items, activeGear(s.profile, pl)).map(({ ex, sets, reps, rest }) => ({ ex, sets, reps, rest }));
  commit(st => {
    st.profile.place = pl;
    st.active = createSession({ name, place: pl, source, items: resolved }, st.sessions, st.exSettings, now());
  }, { render: false });
  ctx.ui.liveIndex = 0;
  closeSheet(true);
  go("live");
  return true;
}

function moduleCard(m) {
  const mu = musclesOfItems(m.items);
  return `<div class="modcard">
    <button class="top" style="width:100%;text-align:left" data-act="start-mod" data-id="${esc(m.id)}">
      <div class="grow"><h3>${esc(m.name)}</h3>
        <div class="meta">${m.items.length} Übungen · ca. ${estMin(m.items)} min</div></div>
      <div class="mini-body">${bodySvg(mu.primary, mu.secondary, "sm")}</div>
    </button>
    <div class="acts">
      <button class="btn btn-sm" data-act="start-mod" data-id="${esc(m.id)}" style="background:var(--lime);color:var(--on-lime);border-color:var(--lime)">Starten</button>
      <button class="btn btn-sm" data-act="edit-mod" data-id="${esc(m.id)}">Bearbeiten</button>
      <button class="btn btn-sm" data-act="dup-mod" data-id="${esc(m.id)}">Duplizieren</button>
    </div>
  </div>`;
}

export function render(root) {
  const s = ctx.state;
  const wk = weekCount(s.sessions);
  const a = s.active;
  root.innerHTML = `
    <button class="hero-start" data-act="${a ? "resume" : "open-start"}">
      <span>${a ? "Training fortsetzen" : "Training starten"}<small>${a
        ? `${esc(a.name)} · ${doneCount(a)} Sätze · seit ${new Date(a.start).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`
        : "Muskelgruppe, Workout oder eigenes Modul"}</small></span>${ICON.play}
    </button>
    <div class="statgrid" style="margin-top:var(--s3)">
      <div class="stat"><b>${wk}/3</b><span>Trainings diese Woche</span>
        <div class="week">${[0, 1, 2].map(i => `<i class="${i < wk ? "on" : ""}"></i>`).join("")}</div></div>
      <button class="stat" style="text-align:left" data-act="workouts"><b>${WORKOUTS.length}</b><span>fertige Workouts ansehen →</span></button>
    </div>
    <div class="row label" style="padding-right:0"><span class="grow">Deine Module</span>
      <button class="btn btn-sm btn-ghost" data-act="new-mod" style="color:var(--lime)">${ICON.plus.replace("<svg", '<svg width="18" height="18"')} Neu</button></div>
    ${s.modules.length ? s.modules.map(moduleCard).join("") :
      `<div class="empty">Noch keine eigenen Module.<br>Bau dir eins aus der Bibliothek – oder speichere ein spontanes Training am Ende als Modul.
        <br><button class="btn" data-act="new-mod">Modul bauen</button></div>`}`;

  root.onclick = e => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const id = b.dataset.id;
    const act = b.dataset.act;
    if (act === "resume") go("live");
    else if (act === "open-start") openStart();
    else if (act === "workouts") go("library/workouts");
    else if (act === "new-mod") go("builder");
    else if (act === "edit-mod") go("builder/" + id);
    else if (act === "dup-mod") {
      commit(st => {
        const m = st.modules.find(x => x.id === id);
        st.modules.push({ ...structuredClone(m), id: "m_" + Date.now(), name: m.name + " (Kopie)", updated: now() });
      });
      toast("Modul dupliziert");
    } else if (act === "start-mod") {
      const m = s.modules.find(x => x.id === id);
      openStart({ step: "place-only", module: m });
    }
  };
}

/* ---------- Start-Sheet ---------- */
export function openStart(init = {}) {
  const st = ctx.state;
  const v = { step: init.step || "choose", place: st.profile.place || "gym", muscles: [], module: init.module || null, kind: init.kind || "module" };
  const gear = () => activeGear(ctx.state.profile, v.place);
  const placeSeg = () => `<div class="seg" style="margin-bottom:var(--s4)">${["gym", "home"].map(p =>
    `<button data-act="place" data-p="${p}" class="${v.place === p ? "on" : ""}">${PLACE_NAME[p]}</button>`).join("")}</div>`;

  const views = {
    choose: () => ({
      title: "Was trainierst du heute?",
      body: placeSeg() + `<div class="opt-grid">
        <button class="opt" data-act="go" data-s="muscle">${ICON.body}<div><b>Nach Muskelgruppe</b><span>Ich sag was, die App stellt zusammen</span></div></button>
        <button class="opt" data-act="go" data-s="workouts">${ICON.star}<div><b>Fertiges Workout</b><span>${workoutsForPlace(v.place, st.profile).length} passend für ${PLACE_NAME[v.place]}</span></div></button>
        <button class="opt" data-act="go" data-s="modules">${ICON.list}<div><b>Eigenes Modul</b><span>${st.modules.length} gespeichert</span></div></button>
        <button class="opt" data-act="free">${ICON.free}<div><b>Leer starten</b><span>Übungen unterwegs hinzufügen</span></div></button>
      </div>`
    }),
    "place-only": () => ({
      title: v.module.name,
      body: `<p class="muted" style="font-size:var(--text-sm);margin-bottom:var(--s3)">Wo trainierst du? Fehlende Geräte werden automatisch ersetzt.</p>` + placeSeg() + replaceNote(v.module.items),
      foot: `<button class="btn btn-primary" data-act="start-module">Los geht's</button>`
    }),
    muscle: () => {
      const sug = v.muscles.length ? suggestForMuscles(v.muscles, gear()) : [];
      return {
        title: "Welche Muskeln?",
        body: placeSeg() + `<div class="musgrid">${MUSCLE_FILTERS.map(f =>
          `<button data-act="mus" data-m="${f.id}" class="${v.muscles.includes(f.id) ? "on" : ""}">${f.name}</button>`).join("")}</div>
          ${sug.length ? `<div class="label">Vorschlag · Maschinen zuerst</div>${sug.map(i => {
            const e = EX_BY_ID.get(i.ex);
            return `<div class="list-row"><div class="mini-body">${bodySvg(e.primary, e.secondary)}</div><div class="grow"><div class="t">${esc(e.name)}</div><div class="s">${i.sets} × ${i.reps}</div></div></div>`;
          }).join("")}<p class="faint" style="font-size:var(--text-xs);margin-top:var(--s2)">Übungen kannst du im Training jederzeit tauschen oder ergänzen.</p>` :
            `<p class="muted" style="font-size:var(--text-sm);margin-top:var(--s4)">Tipp eine oder mehrere Gruppen an.</p>`}`,
        foot: `<button class="btn btn-ghost" data-act="go" data-s="choose">Zurück</button><button class="btn btn-primary" data-act="start-muscle" ${sug.length ? "" : "disabled"}>Los · ${sug.length} Übungen</button>`
      };
    },
    workouts: () => ({
      title: "Fertiges Workout",
      body: placeSeg() + workoutsForPlace(v.place, st.profile).map(w => {
        const mu = musclesOfItems(w.items);
        const r = resolveItems(w.items, gear());
        const rep = r.filter(x => x.replacedFrom).length, na = r.filter(x => x.unavailable).length;
        return `<button class="list-row" data-act="start-workout" data-id="${w.id}">
          <div class="mini-body">${bodySvg(mu.primary, mu.secondary)}</div>
          <div class="grow"><div class="t">${esc(w.name)}</div><div class="s">${w.items.length} Übungen · ca. ${estMin(w.items)} min
          ${rep ? ` · <span class="badge lime">${rep} ersetzt</span>` : ""}${na ? ` · <span class="badge warn">${na} fehlt</span>` : ""}</div></div>
          <span class="end">${ICON.chev}</span></button>`;
      }).join(""),
      foot: `<button class="btn btn-ghost" data-act="go" data-s="choose">Zurück</button>`
    }),
    modules: () => ({
      title: "Eigenes Modul",
      body: placeSeg() + (st.modules.length ? st.modules.map(m => {
        const mu = musclesOfItems(m.items);
        return `<button class="list-row" data-act="start-modlist" data-id="${esc(m.id)}">
          <div class="mini-body">${bodySvg(mu.primary, mu.secondary)}</div>
          <div class="grow"><div class="t">${esc(m.name)}</div><div class="s">${m.items.length} Übungen · ca. ${estMin(m.items)} min</div></div>
          <span class="end">${ICON.chev}</span></button>`;
      }).join("") : `<div class="empty">Noch keine Module gespeichert.<br><button class="btn" data-act="new-mod">Modul bauen</button></div>`),
      foot: `<button class="btn btn-ghost" data-act="go" data-s="choose">Zurück</button>`
    })
  };

  function replaceNote(items) {
    const r = resolveItems(items, gear());
    const rep = r.filter(x => x.replacedFrom);
    const na = r.filter(x => x.unavailable);
    if (!rep.length && !na.length) return `<p class="muted" style="font-size:var(--text-sm)">Alle ${items.length} Übungen sind verfügbar.</p>`;
    return rep.map(x => `<div class="kv"><span>${esc(EX_BY_ID.get(x.replacedFrom).name)}</span><b>→ ${esc(EX_BY_ID.get(x.ex).name)}</b></div>`).join("") +
      na.map(x => `<div class="kv"><span>${esc(EX_BY_ID.get(x.ex).name)}</span><b class="lime" style="color:var(--danger)">nicht verfügbar</b></div>`).join("");
  }

  openSheet({
    build: () => views[v.step](),
    onAct(act, el, e, api) {
      if (act === "place") { v.place = el.dataset.p; api.refresh(); }
      else if (act === "go") { v.step = el.dataset.s; api.refresh(false); }
      else if (act === "mus") {
        const m = el.dataset.m;
        v.muscles = v.muscles.includes(m) ? v.muscles.filter(x => x !== m) : [...v.muscles, m];
        api.refresh();
      } else if (act === "start-muscle") {
        const names = v.muscles.map(id => MUSCLE_FILTERS.find(f => f.id === id).name);
        startSession({ name: names.join(" + "), source: { kind: "muscle" }, items: suggestForMuscles(v.muscles, gear()), place: v.place });
      } else if (act === "start-workout") {
        const w = WORKOUTS.find(x => x.id === el.dataset.id);
        startSession({ name: w.name, source: { kind: "workout", id: w.id }, items: w.items, place: v.place });
      } else if (act === "start-modlist") {
        v.module = st.modules.find(x => x.id === el.dataset.id); v.kind = "module";
        v.step = "place-only"; api.refresh(false);
      } else if (act === "start-module") {
        startSession({ name: v.module.name, source: { kind: v.kind, id: v.module.id }, items: v.module.items, place: v.place });
      } else if (act === "free") {
        startSession({ name: "Freies Training", source: { kind: "free" }, items: [], place: v.place });
      } else if (act === "new-mod") { closeSheet(true); go("builder"); }
    }
  });
}
