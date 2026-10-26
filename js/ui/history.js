/* Verlauf: Liste aller Trainings + Detail einer Session */
import { ctx, commit, go, esc, fmt, toast, armed } from "../ctx.js";
import { EX_BY_ID } from "../library.js";
import { volume, doneCount } from "../session.js";
import { ICON, weekCount } from "./start.js";

const dateLong = d => new Date(d).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "long", year: "numeric" });
const durMin = s => s.legacy ? null : Math.max(1, Math.round((Date.parse(s.end) - Date.parse(s.start)) / 60000));
const sorted = () => [...ctx.state.sessions].sort((a, b) => (a.end < b.end ? 1 : -1));

export function renderList(root) {
  const ss = sorted();
  const total = ss.reduce((t, s) => t + volume(s), 0);
  root.innerHTML = `<div class="sechead"><h2>Verlauf</h2><p>Alle abgeschlossenen Trainings.</p></div>
    <div class="statgrid" style="margin-bottom:var(--s4)">
      <div class="stat"><b>${weekCount(ctx.state.sessions)}/3</b><span>diese Woche</span></div>
      <div class="stat"><b>${fmt(total, 0)}</b><span>kg Volumen gesamt</span></div></div>
    ${ss.length ? ss.map(s => `<div class="list-row">
        <${s.legacy ? "div" : "button"} class="grow" style="text-align:left" ${s.legacy ? "" : `data-act="open" data-id="${esc(s.id)}"`}>
          <div class="t">${esc(s.name)}</div>
          <div class="s">${dateLong(s.end)}${durMin(s) ? " · " + durMin(s) + " min" : ""} · ${doneCount(s)} Sätze${s.legacy ? " · aus alter Version" : ""}</div></${s.legacy ? "div" : "button"}>
        <b class="num lime" style="white-space:nowrap">${fmt(volume(s), 0)} kg</b>
        <button class="del" data-act="del" data-id="${esc(s.id)}" aria-label="Eintrag löschen">✕</button>
      </div>`).join("")
      : `<div class="empty">Noch kein Training abgeschlossen.<br>Starte eins auf der Trainingsseite.</div>`}`;
  root.onclick = e => {
    const b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    if (b.dataset.act === "open") go("session/" + b.dataset.id);
    else if (b.dataset.act === "del" && armed(b)) {
      commit(st => { st.sessions = st.sessions.filter(s => s.id !== b.dataset.id); });
      toast("Eintrag gelöscht");
    }
  };
}

export function renderSession(root, id) {
  const s = ctx.state.sessions.find(x => x.id === id);
  if (!s) { root.innerHTML = `<div class="empty">Training nicht gefunden.</div>`; return; }
  root.innerHTML = `<div class="row" style="margin-bottom:var(--s3)">
      <button class="icon-btn sm" data-act="back" aria-label="Zurück">${ICON.back}</button>
      <span class="muted" style="font-size:var(--text-sm)">Verlauf</span></div>
    <div class="sechead" style="padding-top:0"><h2>${esc(s.name)}</h2><p>${dateLong(s.end)} · ${new Date(s.start).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr</p></div>
    <div class="statgrid" style="grid-template-columns:1fr 1fr 1fr;margin-bottom:var(--s4)">
      <div class="stat"><b>${durMin(s)}</b><span>Minuten</span></div>
      <div class="stat"><b>${doneCount(s)}</b><span>Sätze</span></div>
      <div class="stat"><b>${fmt(volume(s), 0)}</b><span>kg Volumen</span></div></div>
    ${s.entries.map(e => {
      const ex = EX_BY_ID.get(e.ex);
      const t = ex?.type || "kraft";
      return `<div class="card"><button style="text-align:left;width:100%" data-act="ex" data-id="${esc(e.ex)}"><b>${esc(ex?.name || "Unbekannte Übung")}</b></button>
        ${e.sets.filter(x => x.done).map((x, i) => `<div class="kv"><span>Satz ${i + 1}</span><b>${t === "kraft" ? `${fmt(x.kg, 2)} kg × ${esc(x.reps)}`
          : t === "zeit" ? `${esc(x.sec)} s` : `${Math.round(x.sec / 60)} min`}</b></div>`).join("")}</div>`;
    }).join("")}`;
  root.onclick = e => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    if (b.dataset.act === "back") go("history");
    else if (b.dataset.act === "ex") go("exercise/" + b.dataset.id);
  };
}
