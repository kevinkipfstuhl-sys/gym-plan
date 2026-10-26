/* Gemeinsamer Laufzeit-Kontext: State, Speichern, Navigation, Toast, Pausentimer, Helfer.
   Liegt getrennt von app.js, damit Views ihn importieren können ohne Import-Zyklus. */
import { loadState, saveState } from "./store.js";

function makeStorage() {
  try {
    const ls = window["local" + "Storage"];
    ls.setItem("__t", "1"); ls.removeItem("__t");
    return { get: k => ls.getItem(k), set: (k, v) => ls.setItem(k, v) };
  } catch (e) { return null; }
}

export const now = () => new Date().toISOString();

const storage = makeStorage();
const loaded = loadState(storage, now());

export const ctx = {
  state: loaded.state,
  warning: loaded.warning,
  readOnly: !!loaded.readOnly,
  ui: { liveIndex: null },
  render: () => {}
};

export function persist() {
  if (ctx.readOnly) return; /* beschädigte Daten konnten nicht gesichert werden: nichts überschreiben */
  if (!saveState(storage, ctx.state) && storage) toast("Speichern fehlgeschlagen – Speicher voll?");
}

/* mutator darf den State verändern oder einen neuen zurückgeben */
export function commit(mutator, { render = true } = {}) {
  const r = mutator(ctx.state);
  if (r && r !== ctx.state) ctx.state = r;
  persist();
  if (render) ctx.render();
}

export function go(route) {
  const h = "#/" + route;
  if (location.hash === h) ctx.render(); else location.hash = h;
}

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const fmt = (x, d = 2) => (Math.round(x * 10 ** d) / 10 ** d).toLocaleString("de-DE");
export const vibrate = ms => { try { navigator.vibrate?.(ms); } catch (e) { /* nicht unterstützt */ } };

/* ---------- Toast ---------- */
let toastT = null;
export function toast(msg, action) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  if (action) {
    const b = document.createElement("button");
    b.textContent = action.label;
    b.onclick = () => { t.classList.remove("show"); action.run(); };
    t.appendChild(b);
  }
  t.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("show"), action ? 8000 : 2600);
}

/* ---------- Pausentimer (zeitstempelbasiert, läuft auch bei gesperrtem Bildschirm korrekt) ---------- */
let timerEnd = 0, timerInt = null;
const mmss = s => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
function tick() {
  const left = Math.max(0, Math.round((timerEnd - Date.now()) / 1000));
  document.getElementById("timerT").textContent = mmss(left);
  if (left <= 0) { stopTimer(); vibrate([200, 100, 200]); toast("Pause vorbei – nächster Satz"); }
}
export function startTimer(sec) {
  if (!(sec > 0)) return;
  timerEnd = Date.now() + sec * 1000;
  clearInterval(timerInt);
  timerInt = setInterval(tick, 250);
  tick();
  document.getElementById("timer").classList.add("show");
}
export function stopTimer() {
  clearInterval(timerInt); timerInt = null;
  document.getElementById("timer").classList.remove("show");
}
document.getElementById("timer").addEventListener("click", e => {
  const b = e.target.closest("[data-timer]");
  if (!b) return;
  if (b.dataset.timer === "skip") return stopTimer();
  timerEnd = Math.max(Date.now() + 5000, timerEnd + parseInt(b.dataset.timer) * 1000);
  tick();
});

/* ---------- Zwei-Tipp-Bestätigung für Löschen ---------- */
export function armed(btn) {
  if (btn.dataset.armed) return true;
  const label = btn.textContent;
  btn.dataset.armed = "1"; btn.classList.add("armed"); btn.textContent = "Wirklich?";
  setTimeout(() => { if (!btn.isConnected) return; delete btn.dataset.armed; btn.classList.remove("armed"); btn.textContent = label; }, 2600);
  return false;
}
