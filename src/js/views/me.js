// Profile — credentials, account meta, sign-out.

import { h, $, esc, toast } from "../util.js";
import { t, fmtDate } from "../i18n.js";
import { icons } from "../icons.js";

const VERSION = "0.1.0";

export function renderMe({ session, onSignout }) {
  const me = session.me || {};
  const el = h(`<div class="view view-enter">

    <div class="card">
      <h2 data-i="me.title"></h2>
      <div class="spacer-sm"></div>
      <div class="kv"><span class="kv-k" data-i="me.keyId"></span>
        <span class="kv-v mono" id="m-kid"></span></div>
      <div class="kv"><span class="kv-k" data-i="me.tier"></span>
        <span class="kv-v">${esc(me.tier_label || me.tier || "—")}</span></div>
      <div class="kv"><span class="kv-k" data-i="me.status"></span>
        <span class="kv-v"><span class="pill ${me.status === "active" ? "pill-ok" : "pill-danger"}">
          <span class="dot"></span>${esc(t("status." + (me.status || "active")) || me.status)}</span></span></div>
      <div class="kv"><span class="kv-k" data-i="me.rate"></span>
        <span class="kv-v">${esc(me.rate_per_min || t("home.unlimited"))} / min</span></div>
      <div class="kv"><span class="kv-k" data-i="me.created"></span>
        <span class="kv-v">${esc(me.created ? fmtDate(me.created) : "—")}</span></div>
      <div class="kv"><span class="kv-k" data-i="me.expires"></span>
        <span class="kv-v">${esc(me.expires ? fmtDate(me.expires) : t("home.never"))}</span></div>
      <div class="kv"><span class="kv-k" data-i="me.endpoint"></span>
        <span class="kv-v mono" id="m-end"></span></div>

      <div class="spacer"></div>
      <button class="btn btn-soft block" id="m-copy">
        ${icons.copy}<span data-i="me.copy"></span>
      </button>
    </div>

    <div class="card">
      <h2 data-i="me.actions"></h2>
      <div class="spacer-sm"></div>
      <button class="btn btn-danger block" id="m-signout">
        ${icons.out}<span data-i="me.signout"></span>
      </button>
    </div>

    <div class="card">
      <h2 data-i="me.about"></h2>
      <div class="sub">${esc(t("me.version", { v: VERSION }))}</div>
      <div class="sub">${esc(t("app.tag"))}</div>
    </div>

  </div>`);

  applyI18n(el);

  // populate ID fields with overflow handling
  $("#m-kid", el).textContent = session.keyId || "—";
  $("#m-kid", el).style.maxWidth = "60%";
  $("#m-kid", el).style.overflow = "hidden";
  $("#m-kid", el).style.textOverflow = "ellipsis";
  $("#m-end", el).textContent = session.endpoint;
  $("#m-end", el).style.maxWidth = "60%";
  $("#m-end", el).style.overflow = "hidden";
  $("#m-end", el).style.textOverflow = "ellipsis";

  $("#m-copy", el).onclick = async () => {
    try {
      await navigator.clipboard.writeText(session.keyId || "");
      toast(t("me.copied"), "ok", 1200);
    } catch (_) {}
  };

  $("#m-signout", el).onclick = () => {
    if (confirm(t("auth.signoutConfirm"))) onSignout();
  };

  return el;
}

function applyI18n(root) {
  root.querySelectorAll("[data-i]").forEach(n => n.textContent = t(n.getAttribute("data-i")));
}
