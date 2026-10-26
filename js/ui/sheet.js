/* Bottom-Sheet. build() liefert {title, body, foot?}; Klicks auf [data-act] gehen an onAct(act, el, e).
   Rückgabe: { close, refresh } */
import { esc } from "../ctx.js";

let current = null;

export function openSheet({ build, onAct, onInput, onClose }) {
  closeSheet(true);
  const root = document.getElementById("sheet-root");
  root.innerHTML = `<div class="sheet-bg" data-close></div>
    <div class="sheet" role="dialog" aria-modal="true">
      <div class="sheet-grip" data-close></div>
      <div class="sheet-head"><h3></h3>
        <button class="icon-btn sm" data-close aria-label="Schließen"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </div>
      <div class="sheet-body"></div><div class="sheet-foot" hidden></div>
    </div>`;
  const sheet = root.querySelector(".sheet");
  const api = {
    refresh(keepScroll = true) {
      const b = sheet.querySelector(".sheet-body");
      const y = b.scrollTop;
      const v = build();
      sheet.querySelector("h3").textContent = v.title || "";
      b.innerHTML = v.body;
      const f = sheet.querySelector(".sheet-foot");
      f.hidden = !v.foot; f.innerHTML = v.foot || "";
      if (keepScroll) b.scrollTop = y;
      v.mount?.(sheet);
    },
    close() { closeSheet(); },
    el: sheet
  };
  sheet.addEventListener("click", e => {
    const a = e.target.closest("[data-act]");
    if (a && sheet.contains(a)) onAct?.(a.dataset.act, a, e, api);
  });
  if (onInput) sheet.addEventListener("input", e => onInput(e, api));
  root.querySelectorAll("[data-close]").forEach(el => el.addEventListener("click", () => closeSheet()));
  /* nach unten wischen schließt */
  let y0 = null;
  sheet.querySelector(".sheet-grip").parentElement.addEventListener("touchstart", e => {
    if (e.target.closest(".sheet-head,.sheet-grip")) y0 = e.touches[0].clientY;
  }, { passive: true });
  sheet.addEventListener("touchend", e => {
    if (y0 !== null && e.changedTouches[0].clientY - y0 > 70) closeSheet();
    y0 = null;
  });
  current = { root, onClose };
  api.refresh(false);
  void root.offsetHeight; /* Reflow erzwingen, damit die Einblend-Animation startet */
  root.classList.add("open");
  return api;
}

export function closeSheet(immediate = false) {
  if (!current) return;
  const { root, onClose } = current;
  current = null;
  root.classList.remove("open");
  onClose?.();
  if (immediate) root.innerHTML = "";
  else setTimeout(() => { if (!current) root.innerHTML = ""; }, 320);
}

