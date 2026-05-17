// Auth view — full-screen login with subscription key.
// Validates by calling GET /api/me, which only succeeds when the HMAC matches.

import { h, $, toast, fmtError } from "../util.js";
import { t, getLang, onLangChange } from "../i18n.js";
import { ApiClient } from "../api.js";
import { saveSession } from "../session.js";

const REG_URL = "https://tauri2.buzz/register";

const LOGO_SVG = `
<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <path d="M9 21l5 5 7-10 5 5.5 6-9.5" fill="none" stroke="#fff" stroke-width="3"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export function renderAuth({ onSuccess, openExternal }) {
  const el = h(`<div class="auth fade-in">
    <div class="auth-top">
      <div class="auth-logo">${LOGO_SVG}</div>
      <div class="auth-title" data-i="auth.title"></div>
      <div class="auth-tag" data-i="auth.tag"></div>
    </div>
    <div class="auth-form">
      <div class="field">
        <label data-i="auth.endpoint"></label>
        <input class="input" id="f-endpoint" autocomplete="off" spellcheck="false" />
        <div class="hint" data-i="auth.endpoint.hint"></div>
      </div>
      <div class="field">
        <label data-i="auth.keyId"></label>
        <input class="input" id="f-key" autocomplete="off" spellcheck="false" />
      </div>
      <div class="field">
        <label data-i="auth.secret"></label>
        <input class="input" id="f-sec" type="password" autocomplete="off" spellcheck="false" />
        <div class="hint" data-i="auth.secret.hint"></div>
      </div>
      <button class="btn btn-grad block" id="signin">
        <span class="lbl" data-i="auth.signin"></span>
      </button>
    </div>
    <div class="auth-foot">
      <div class="divider"><span data-i="auth.divider"></span></div>
      <span class="reg-q" data-i="auth.regq"></span>
      <button class="btn-ghost" id="register" data-i="auth.register"></button>
    </div>
  </div>`);

  const fEnd = $("#f-endpoint", el);
  const fKey = $("#f-key", el);
  const fSec = $("#f-sec", el);
  const btn  = $("#signin", el);
  const btnLbl = btn.querySelector(".lbl");

  fEnd.placeholder = t("auth.endpoint.ph");
  fKey.placeholder = t("auth.keyId.ph");
  fSec.placeholder = t("auth.secret.ph");

  // restore the last endpoint as a convenience
  try {
    const saved = localStorage.getItem("rcs.lastEndpoint");
    if (saved) fEnd.value = saved;
  } catch (_) {}

  applyI18n(el);
  onLangChange(() => {
    applyI18n(el);
    fEnd.placeholder = t("auth.endpoint.ph");
    fKey.placeholder = t("auth.keyId.ph");
    fSec.placeholder = t("auth.secret.ph");
  });

  $("#register", el).onclick = () => {
    if (openExternal) openExternal(REG_URL);
    else window.open(REG_URL, "_blank");
  };

  btn.onclick = async () => {
    const endpoint = fEnd.value.trim();
    const keyId    = fKey.value.trim();
    const secret   = fSec.value.trim();
    if (!endpoint || !keyId || !secret) {
      toast(t("g.required"), "err");
      return;
    }
    if (!/^[0-9a-f]+$/i.test(secret) || secret.length % 2 !== 0) {
      toast(t("auth.invalid", { reason: "secret format" }), "err");
      return;
    }
    btn.disabled = true;
    btnLbl.innerHTML = `<span class="spinner"></span>&nbsp; ${t("auth.testing")}`;
    try {
      const api = new ApiClient({ endpoint, keyId, secretHex: secret });
      const me = await api.me();
      // me() succeeded -> HMAC is good, status is active, not expired
      await saveSession({ endpoint, keyId, secretHex: secret });
      try { localStorage.setItem("rcs.lastEndpoint", endpoint); } catch (_) {}
      onSuccess({ endpoint, keyId, secretHex: secret, me });
    } catch (err) {
      toast(t("auth.invalid", { reason: fmtError(err) }), "err", 3200);
      btn.disabled = false;
      btnLbl.textContent = t("auth.signin");
    }
  };

  return el;
}

function applyI18n(root) {
  root.querySelectorAll("[data-i]").forEach(n => {
    n.textContent = t(n.getAttribute("data-i"));
  });
}
