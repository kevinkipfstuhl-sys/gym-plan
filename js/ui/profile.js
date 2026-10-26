/* Profil: Ort, Geräte (Mein Gym / Zuhause), Körpergewicht, Pausen, Backup */
import { ctx, commit, esc, fmt, toast, armed, now } from "../ctx.js";
import { EQUIP_TYPES, GEAR, HOME_EXTRA } from "../../data/gear.js";
import { parseNum } from "../session.js";
import { exportState, importState } from "../store.js";

const GEAR_NAME = Object.fromEntries(GEAR.map(g => [g.id, g.name]));
const RESTS = [45, 60, 90, 120, 180];

export function render(root) {
  const p = ctx.state.profile;
  const have = new Set(p.gym.gear);
  const ws = p.weights;
  const last = ws.at(-1);
  const lost = last ? p.startWeight - last.kg : 0;
  root.innerHTML = `<div class="sechead"><h2>Profil</h2><p>Geräte, Gewicht und Backup.</p></div>
    <div class="label">Wo trainierst du meistens?</div>
    <div class="seg">${[["gym", "Gym"], ["home", "Zuhause"]].map(([k, n]) =>
      `<button data-act="place" data-p="${k}" class="${(p.place || "gym") === k ? "on" : ""}">${n}</button>`).join("")}</div>

    <div class="label">Mein Gym · ${have.size} von ${GEAR.length} Geräten</div>
    <p class="muted" style="font-size:var(--text-sm);padding:0 var(--s1)">Hak ab, was es in deinem Gym gibt. Bibliothek, Workouts und „Gerät besetzt“ zeigen dann nur, was bei dir geht.</p>
    ${EQUIP_TYPES.map(t => {
      const gs = GEAR.filter(g => g.equip === t.id);
      if (!gs.length) return "";
      return `<div class="gear-grp"><div class="gh"><b>${t.name}</b>
        <span><button data-act="all" data-e="${t.id}">alle</button><button data-act="none" data-e="${t.id}">keine</button></span></div>
        <div class="gear-list">${gs.map(g => `<button data-act="gear" data-g="${g.id}" class="${have.has(g.id) ? "on" : ""}" aria-pressed="${have.has(g.id)}">${esc(g.name)}</button>`).join("")}</div></div>`;
    }).join("")}

    <div class="label">Zuhause</div>
    <p class="muted" style="font-size:var(--text-sm);padding:0 var(--s1) var(--s2)">Körpergewicht und Widerstandsband sind immer dabei. Zusätzlich vorhanden:</p>
    <div class="gear-list">${HOME_EXTRA.map(g => `<button data-act="home" data-g="${g}" class="${(p.homeExtra || []).includes(g) ? "on" : ""}">${esc(GEAR_NAME[g])}</button>`).join("")}</div>

    <div class="label">Körpergewicht</div>
    <div class="card">
      <div class="row"><div class="grow"><b class="num lime" style="font-size:var(--text-2xl)">${last ? fmt(last.kg, 1) : "–"}</b><span class="muted"> kg</span>
        <div class="muted" style="font-size:var(--text-sm)">Start ${fmt(p.startWeight, 1)} kg${lost > 0 ? ` · <b class="lime">${fmt(lost, 1)} kg</b> verloren` : ""}</div></div></div>
      <div class="row" style="margin-top:var(--s3)"><input class="field grow" inputmode="decimal" placeholder="Neues Gewicht (kg)" id="wtIn" aria-label="Neues Gewicht">
        <button class="btn btn-primary" style="font-size:var(--text-base)" data-act="wt">Speichern</button></div>
      <div style="margin-top:var(--s2)">${[...ws].map((w, i) => ({ w, i })).reverse().slice(0, 8).map(({ w, i }) =>
        `<div class="kv"><span>${new Date(w.d).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}</span>
          <span class="row" style="gap:var(--s2)"><b>${fmt(w.kg, 1)} kg</b><button class="del" data-act="wdel" data-i="${i}" aria-label="Eintrag löschen">✕</button></span></div>`).join("")}</div>
    </div>

    <div class="label">Training</div>
    <div class="card"><div class="toggle" style="min-height:auto"><span>Standard-Pause für neue Übungen</span>
      <select class="field" style="width:110px;min-height:44px" data-in="rest" aria-label="Standard-Pause">${RESTS.map(r =>
        `<option value="${r}" ${r === ctx.state.settings.restDefault ? "selected" : ""}>${r} s</option>`).join("")}</select></div></div>

    <div class="label">Backup</div>
    <div class="card stack">
      <p class="muted" style="font-size:var(--text-sm)">Alle Daten liegen nur auf diesem Gerät. Sichere sie ab und zu als Datei – z. B. vor einem Handywechsel.</p>
      <button class="btn block" data-act="export">Backup exportieren</button>
      <label class="btn block" style="cursor:pointer">Backup importieren<input type="file" accept="application/json,.json" id="impIn" class="sr"></label>
    </div>
    <p class="faint" style="font-size:var(--text-xs);text-align:center;margin-top:var(--s5)">Gym Plan · ${ctx.state.sessions.length} Trainings · ${ctx.state.modules.length} Module</p>`;

  root.onclick = e => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const a = b.dataset.act;
    if (a === "place") commit(s => { s.profile.place = b.dataset.p; });
    else if (a === "gear") commit(s => {
      const g = b.dataset.g, set = new Set(s.profile.gym.gear);
      set.has(g) ? set.delete(g) : set.add(g);
      s.profile.gym.gear = GEAR.map(x => x.id).filter(id => set.has(id));
    });
    else if (a === "all" || a === "none") commit(s => {
      const ids = GEAR.filter(g => g.equip === b.dataset.e).map(g => g.id);
      const set = new Set(s.profile.gym.gear);
      ids.forEach(id => a === "all" ? set.add(id) : set.delete(id));
      s.profile.gym.gear = GEAR.map(x => x.id).filter(id => set.has(id));
    });
    else if (a === "home") commit(s => {
      const g = b.dataset.g, cur = s.profile.homeExtra || [];
      s.profile.homeExtra = cur.includes(g) ? cur.filter(x => x !== g) : [...cur, g];
    });
    else if (a === "wt") {
      const v = parseNum(document.getElementById("wtIn").value);
      if (v === null || v < 30 || v > 300) { toast("Bitte gültiges Gewicht eingeben (30–300 kg)"); return; }
      commit(s => { s.profile.weights.push({ d: now().slice(0, 10), kg: v }); });
      toast("Gewicht gespeichert");
    } else if (a === "wdel" && armed(b)) {
      commit(s => { s.profile.weights.splice(+b.dataset.i, 1); });
      toast("Eintrag gelöscht");
    } else if (a === "export") {
      const blob = new Blob([exportState(ctx.state)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `gymplan-backup-${now().slice(0, 10)}.json`;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
  };
  root.onchange = async e => {
    if (e.target.dataset.in === "rest") commit(s => { s.settings.restDefault = +e.target.value; });
    if (e.target.id === "impIn" && e.target.files[0]) {
      const r = importState(await e.target.files[0].text());
      e.target.value = "";
      if (!r.ok) { toast(r.error); return; }
      if (!confirm(`Backup mit ${r.state.sessions.length} Trainings und ${r.state.modules.length} Modulen laden? Alle aktuellen Daten werden ersetzt.`)) return;
      commit(() => r.state);
      toast("Backup geladen");
    }
  };
}
