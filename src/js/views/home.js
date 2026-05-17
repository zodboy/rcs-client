// Home — at-a-glance overview: tier hero card, stats, server health.

import { h, $, fmtError } from "../util.js";
import { t, fmtDate } from "../i18n.js";
import { icons } from "../icons.js";

export function renderHome({ api, session }) {
  const el = h(`<div class="view view-enter">
    <div class="card card-hero">
      <h2 class="grad-hero-title"></h2>
      <div class="sub" data-i="home.heroSub"></div>
      <div class="spacer"></div>
      <div class="stat-grid">
        <div class="stat"><div class="k" data-i="home.stat.tier"></div>
          <div class="v" style="color:#fff" id="h-tier">—</div></div>
        <div class="stat"><div class="k" data-i="home.stat.allowed"></div>
          <div class="v" style="color:#fff" id="h-allowed">—</div></div>
        <div class="stat"><div class="k" data-i="home.stat.rate"></div>
          <div class="v sm" style="color:#fff" id="h-rate">—</div></div>
        <div class="stat"><div class="k" data-i="home.stat.expires"></div>
          <div class="v sm" style="color:#fff" id="h-expires">—</div></div>
      </div>
    </div>

    <div class="card">
      <h2 data-i="home.quickLook"></h2>
      <div class="spacer-sm"></div>
      <div class="row between" id="h-server-row">
        <div class="row">
          <div class="list-row" style="padding:0;gap:10px">
            <div class="lr-ico" id="h-server-ico"></div>
            <div class="lr-main">
              <div class="lr-title" id="h-server-title">${t("g.loading")}</div>
              <div class="lr-meta" id="h-server-meta">—</div>
            </div>
          </div>
        </div>
        <button class="btn btn-soft sm" id="h-recheck">${t("strat.check")}</button>
      </div>
    </div>
  </div>`);

  // hero title uses the localised greeting w/ tier; force light text style
  $(".card-hero h2", el).style.color = "#fff";
  $(".card-hero h2", el).style.fontSize = "20px";

  applyI18n(el);

  function paintHero() {
    const me = session.me || {};
    const tier = me.tier_label || me.tier || "—";
    const stratList = (me.strategies || "").split(",").map(s => s.trim()).filter(Boolean);
    const allowed = stratList.length === 0 ? "0" :
      (stratList[0] === "*" ? t("home.unlimited") : String(stratList.length));
    $(".card-hero h2", el).textContent = t("home.tier", { tier });
    $("#h-tier",    el).textContent = tier;
    $("#h-allowed", el).textContent = allowed;
    $("#h-rate",    el).textContent = me.rate_per_min ? me.rate_per_min : t("home.unlimited");
    $("#h-expires", el).textContent = me.expires ? fmtDate(me.expires) : t("home.never");
  }
  paintHero();

  async function checkServer() {
    $("#h-server-title", el).textContent = t("g.loading");
    $("#h-server-meta", el).textContent = session.endpoint;
    $("#h-server-ico", el).innerHTML = `<span class="spinner dark" style="width:16px;height:16px"></span>`;
    try {
      const ok = await api.health();
      const now = Math.floor(Date.now() / 1000);
      $("#h-server-ico", el).innerHTML = ok
        ? `<span style="color:var(--ok)">${icons.check}</span>`
        : `<span style="color:var(--danger)">${icons.cross}</span>`;
      $("#h-server-title", el).textContent = ok ? t("home.serverOk") : t("home.serverDown");
      $("#h-server-meta",  el).textContent = t("home.lastCheck", { when: new Date().toLocaleTimeString() });
    } catch (err) {
      $("#h-server-ico", el).innerHTML = `<span style="color:var(--danger)">${icons.cross}</span>`;
      $("#h-server-title", el).textContent = t("home.serverDown");
      $("#h-server-meta", el).textContent = fmtError(err);
    }
  }
  $("#h-recheck", el).onclick = checkServer;
  checkServer();

  return el;
}

function applyI18n(root) {
  root.querySelectorAll("[data-i]").forEach(n => n.textContent = t(n.getAttribute("data-i")));
}
