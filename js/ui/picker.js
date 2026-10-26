/* Übungsauswahl im Sheet (Suche, Muskel-Chips, "nur verfügbar"); einfach oder mehrfach */
import { ctx, esc } from "../ctx.js";
import { openSheet, closeSheet } from "./sheet.js";
import { MUSCLE_FILTERS } from "../../data/muscles.js";
import { EQUIP_TYPES } from "../../data/gear.js";
import { filterExercises, activeGear } from "../library.js";
import { bodySvg, muscleLabel } from "../body.js";

export const EQUIP_NAME = Object.fromEntries(EQUIP_TYPES.map(e => [e.id, e.name]));

export function exRow(e, { act = "pick", sel = null, extra = "" } = {}) {
  return `<button class="list-row${sel ? " sel" : ""}" data-act="${act}" data-id="${e.id}">
    <div class="mini-body">${bodySvg(e.primary, e.secondary)}</div>
    <div class="grow"><div class="t">${esc(e.name)}</div>
      <div class="s">${muscleLabel(e.primary)} · ${EQUIP_NAME[e.equip]}${extra}</div></div>
    ${sel !== null ? `<span class="check">${sel ? "✓" : ""}</span>` : ""}
  </button>`;
}

export function openPicker({ title = "Übung hinzufügen", multi = false, onDone, muscle = null }) {
  const p = ctx.state.profile;
  const place = ctx.state.active?.place || p.place || "gym";
  const v = { q: "", muscle, avail: true, sel: [] };
  const list = () => {
    const ex = filterExercises({ q: v.q, muscle: v.muscle, gear: v.avail ? activeGear(p, place) : null });
    if (!ex.length) return `<div class="empty">Nichts gefunden.${v.avail ? "<br>Tipp: „Nur verfügbar“ ausschalten." : ""}</div>`;
    return ex.map(e => exRow(e, { sel: multi ? v.sel.includes(e.id) : null })).join("");
  };
  openSheet({
    build: () => ({
      title,
      body: `<div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input class="field" type="search" placeholder="Übung suchen" value="${esc(v.q)}" data-in="q" enterkeyhint="search"></div>
        <div class="chips" style="margin-top:var(--s3)">
          <button class="chip ${!v.muscle ? "on" : ""}" data-act="mus" data-m="">Alle</button>
          ${MUSCLE_FILTERS.map(f => `<button class="chip ${v.muscle === f.id ? "on" : ""}" data-act="mus" data-m="${f.id}">${f.name}</button>`).join("")}
        </div>
        <div class="toggle"><span>Nur verfügbar (${place === "home" ? "Zuhause" : "Mein Gym"})</span><button class="switch ${v.avail ? "on" : ""}" data-act="avail" aria-label="Nur verfügbare Übungen"></button></div>
        <div class="pick-list">${list()}</div>`,
      foot: multi ? `<button class="btn btn-primary" data-act="done" ${v.sel.length ? "" : "disabled"}>${v.sel.length} hinzufügen</button>` : ""
    }),
    onInput(e, api) {
      if (e.target.dataset.in !== "q") return;
      v.q = e.target.value;
      api.el.querySelector(".pick-list").innerHTML = list();
    },
    onAct(act, el, e, api) {
      if (act === "mus") { v.muscle = el.dataset.m || null; api.refresh(); }
      else if (act === "avail") { v.avail = !v.avail; api.refresh(); }
      else if (act === "pick") {
        const id = el.dataset.id;
        if (!multi) { closeSheet(); onDone([id]); return; }
        v.sel = v.sel.includes(id) ? v.sel.filter(x => x !== id) : [...v.sel, id];
        el.classList.toggle("sel");
        el.querySelector(".check").textContent = v.sel.includes(id) ? "✓" : "";
        const b = api.el.querySelector("[data-act=done]");
        b.disabled = !v.sel.length; b.textContent = v.sel.length + " hinzufügen";
      } else if (act === "done") { closeSheet(); onDone(v.sel); }
    }
  });
}
