/* Einstieg: Router, Navigation, Hinweise, Service Worker */
import { ctx, toast } from "./ctx.js";
import { closeSheet } from "./ui/sheet.js";
import * as start from "./ui/start.js";
import * as live from "./ui/live.js";
import * as library from "./ui/library.js";
import * as builder from "./ui/builder.js";
import * as history from "./ui/history.js";
import * as profile from "./ui/profile.js";

/* route → [Modul, Render-Funktion, Nav-Tab] */
const ROUTES = {
  start: [start.render, "start"],
  live: [live.render, null],
  library: [library.renderList, "library"],
  exercise: [library.renderExercise, "library"],
  workout: [library.renderWorkout, "library"],
  builder: [builder.render, "start"],
  history: [history.renderList, "history"],
  session: [history.renderSession, "history"],
  profile: [profile.render, "profile"]
};

const app = document.getElementById("app");
let lastRoute = null;

function parseHash() {
  const [route = "start", ...rest] = location.hash.replace(/^#\/?/, "").split("/");
  return { route: ROUTES[route] ? route : "start", param: rest.length ? decodeURIComponent(rest.join("/")) : null };
}

function render() {
  const { route, param } = parseHash();
  const [fn, tab] = ROUTES[route];
  if (route !== lastRoute) { closeSheet(true); window.scrollTo({ top: 0 }); live.leave?.(); ctx.ui.builder = null; ctx.ui.summary = null; }
  document.body.classList.toggle("live", route === "live");
  document.querySelectorAll("[data-nav]").forEach(b => b.classList.toggle("on", b.dataset.nav === tab));
  document.getElementById("streakN").textContent = ctx.state.sessions.length;
  app.onclick = app.oninput = app.onchange = null;
  fn(app, param);
  lastRoute = route;
}
ctx.render = render;

document.querySelectorAll("[data-nav]").forEach(b =>
  b.addEventListener("click", () => { location.hash = "#/" + b.dataset.nav; }));
window.addEventListener("hashchange", render);

render();

const WARN = {
  migrated: "Deine bisherigen Daten wurden übernommen – Ganzkörper A/B/C sind jetzt Module.",
  "migrated-v2": "Dein Plan, deine Max-Werte, Trainings und dein Gewicht wurden übernommen – die Plan-Tage sind jetzt Module.",
  broken: "Gespeicherte Daten waren beschädigt und wurden gesichert. Die App startet leer.",
  "broken-readonly": "Gespeicherte Daten sind beschädigt und Speicher ist voll – zum Schutz wird nichts gespeichert. Bitte Speicher freimachen.",
  nostorage: "Speichern ist hier nicht möglich – Daten gehen beim Schließen verloren."
};
if (ctx.warning) setTimeout(() => toast(WARN[ctx.warning]), 400);

/* ---------- Service Worker + Update-Hinweis ---------- */
/* lokal beim Entwickeln nur mit ?sw=1, sonst liefert der Cache alte Dateien */
let updating = false;
const devHost =["localhost", "127.0.0.1"].includes(location.hostname) && !location.search.includes("sw=1");
if ("serviceWorker" in navigator && location.protocol !== "file:" && !devHost) {
  navigator.serviceWorker.register("sw.js").then(reg => {
    const offer = w => toast("Update verfügbar", { label: "Neu laden", run: () => { updating = true; w.postMessage({ type: "SKIP_WAITING" }); } });
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener("updatefound", () => {
      const w = reg.installing;
      w?.addEventListener("statechange", () => {
        if (w.state === "installed" && navigator.serviceWorker.controller) offer(w);
      });
    });
  }).catch(() => {});
  /* nur nach "Neu laden" neu starten, nicht bei der allerersten Installation */
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!updating) return;
    updating = false;
    location.reload();
  });
}
