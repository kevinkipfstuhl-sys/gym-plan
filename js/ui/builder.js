/* Modul-Baukasten: Name, Übungen, Sätze/Wdh./Pause, Reihenfolge per Ziehen */
import { ctx, commit, go, esc, toast, now, armed } from "../ctx.js";
import { EX_BY_ID } from "../library.js";
import { bodySvg, muscleLabel } from "../body.js";
import { openPicker, EQUIP_NAME } from "./picker.js";
import { bindDrag } from "./live.js";
import { ICON } from "./start.js";
import { REPS_RE } from "../session.js";

const RESTS = [0, 30, 45, 60, 90, 120, 180];
const DRAG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 9h14M5 15h14"/></svg>`;

export function defaultItem(id, restDefault) {
  const t = EX_BY_ID.get(id)?.type;
  return { ex: id, sets: t === "cardio" ? 1 : 3, reps: t === "zeit" ? "45 s" : t === "cardio" ? "10 min" : "10–12", rest: t === "cardio" ? 0 : restDefault };
}

function draftFor(param) {
  const key = param || "new";
  if (ctx.ui.builder && ctx.ui.builder.key === key) return ctx.ui.builder;
  let d;
  if (!param && ctx.ui.draft) { d = { key, id: null, ...ctx.ui.draft }; ctx.ui.draft = null; }
  else if (param) {
    const m = ctx.state.modules.find(x => x.id === param);
    d = m ? { key, id: m.id, name: m.name, items: structuredClone(m.items) } : { key, id: null, name: "", items: [] };
  } else d = { key, id: null, name: "", items: [] };
  return (ctx.ui.builder = d);
}

export function render(root, param) {
  const d = draftFor(param);
  const valid = () => d.name.trim() && d.items.length && d.items.every(i => REPS_RE.test(i.reps));
  root.innerHTML = `
    <div class="row" style="margin-bottom:var(--s3)">
      <button class="icon-btn sm" data-act="back" aria-label="Zurück">${ICON.back}</button>
      <span class="muted" style="font-size:var(--text-sm)">${d.id ? "Modul bearbeiten" : "Neues Modul"}</span></div>
    <input class="field" style="font-family:var(--font-display);font-size:var(--text-lg)" data-in="name" placeholder="Name, z. B. Brust & Schulter" value="${esc(d.name)}" aria-label="Name des Moduls">
    <div class="label">${d.items.length} Übungen</div>
    <div class="blist">${d.items.map((it, i) => {
      const e = EX_BY_ID.get(it.ex);
      return `<div class="bitem" data-row="${i}">
        <div class="row">
          <span class="drag" data-drag="${i}" aria-label="Ziehen zum Sortieren">${DRAG}</span>
          <div class="mini-body">${e ? bodySvg(e.primary, e.secondary) : ""}</div>
          <div class="grow"><div class="t">${esc(e?.name || "Unbekannte Übung")}</div>
            <div class="faint" style="font-size:var(--text-xs)">${e ? muscleLabel(e.primary) + " · " + EQUIP_NAME[e.equip] : ""}</div></div>
          <button class="del" data-act="rm" data-i="${i}" aria-label="Entfernen">✕</button>
        </div>
        <div class="cfg">
          <div><label>Sätze</label><div class="mini-step"><button data-act="sets" data-i="${i}" data-d="-1" aria-label="weniger Sätze">−</button><span>${esc(it.sets)}</span><button data-act="sets" data-i="${i}" data-d="1" aria-label="mehr Sätze">+</button></div></div>
          <div><label>Wdh. / Zeit</label><input class="field${REPS_RE.test(it.reps) ? "" : " err"}" data-in="reps" data-i="${i}" value="${esc(it.reps)}" aria-label="Wiederholungen"></div>
          <div><label>Pause</label><select class="field" data-in="rest" data-i="${i}" aria-label="Pause">${[...new Set([...RESTS, it.rest])].sort((a, b) => a - b).map(r =>
            `<option value="${r}" ${r === it.rest ? "selected" : ""}>${r ? r + " s" : "keine"}</option>`).join("")}</select></div>
        </div></div>`;
    }).join("")}</div>
    ${d.items.length ? "" : `<div class="empty">Noch keine Übungen.<br>Tipp auf „Übungen hinzufügen“ – Maschinen stehen jeweils oben.</div>`}
    <button class="btn block" style="margin-top:var(--s3)" data-act="add">${ICON.plus.replace("<svg", '<svg width="20" height="20"')} Übungen hinzufügen</button>
    <p class="faint" style="font-size:var(--text-xs);margin-top:var(--s3)">Wdh.-Format: „10“, „8–10“, „10/Bein“, „45 s“ oder „15 min“.</p>
    <button class="btn btn-primary block" style="margin-top:var(--s5)" data-act="save" ${valid() ? "" : "disabled"}>Modul speichern</button>
    ${d.id ? `<div class="row" style="margin-top:var(--s3)"><button class="btn grow" data-act="dup">Duplizieren</button><button class="btn btn-danger grow" data-act="delete">Löschen</button></div>` : ""}`;

  const saveBtn = () => { const b = root.querySelector("[data-act=save]"); if (b) b.disabled = !valid(); };
  bindDrag(root.querySelector(".blist"), (from, to) => {
    const [x] = d.items.splice(from, 1); d.items.splice(to, 0, x); ctx.render();
  });
  root.oninput = e => {
    const f = e.target.dataset.in, i = +e.target.dataset.i;
    if (f === "name") d.name = e.target.value;
    else if (f === "reps") {
      d.items[i].reps = e.target.value.trim().replace(/(\d)-(\d)/, "$1–$2");
      e.target.classList.toggle("err", !REPS_RE.test(d.items[i].reps));
    }
    saveBtn();
  };
  root.onchange = e => {
    if (e.target.dataset.in === "rest") d.items[+e.target.dataset.i].rest = +e.target.value;
  };
  root.onclick = e => {
    const b = e.target.closest("[data-act]");
    if (!b || b.disabled) return;
    const i = +b.dataset.i;
    switch (b.dataset.act) {
      case "back": go("start"); break;
      case "sets": d.items[i].sets = Math.min(10, Math.max(1, d.items[i].sets + +b.dataset.d)); ctx.render(); break;
      case "rm": if (armed(b)) { d.items.splice(i, 1); ctx.render(); } break;
      case "add":
        openPicker({ title: "Übungen hinzufügen", multi: true, onDone: ids => {
          ids.forEach(id => d.items.push(defaultItem(id, ctx.state.settings.restDefault)));
          ctx.render();
        } });
        break;
      case "save": {
        const mod = { id: d.id || "m_" + Date.now(), name: d.name.trim(), items: d.items.map(({ ex, sets, reps, rest }) => ({ ex, sets, reps, rest })), updated: now() };
        commit(s => {
          const k = s.modules.findIndex(m => m.id === mod.id);
          if (k >= 0) s.modules[k] = mod; else s.modules.push(mod);
        }, { render: false });
        ctx.ui.builder = null;
        toast(d.id ? "Modul gespeichert" : "Modul angelegt");
        go("start");
        break;
      }
      case "dup":
        ctx.ui.draft = { name: d.name + " (Kopie)", items: structuredClone(d.items) };
        ctx.ui.builder = null;
        if (location.hash === "#/builder") ctx.render(); else location.hash = "#/builder";
        break;
      case "delete":
        if (!armed(b)) return;
        commit(s => { s.modules = s.modules.filter(m => m.id !== d.id); }, { render: false });
        ctx.ui.builder = null;
        toast("Modul gelöscht");
        go("start");
        break;
    }
  };
}
