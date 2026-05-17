// Strategies — show the catalog of strategies the user's tier permits.
// Entitlement is verified per-strategy on demand (since the server only
// returns the user's own list in /me; the catalog of names is the union
// of theirs + a small built-in label table for nicer display).

import { h, $, esc, toast, fmtError } from "../util.js";
import { t } from "../i18n.js";
import { icons } from "../icons.js";

// Display labels for known strategy ids. New ids show their raw id until
// you add an entry here. (Operators ship a CMS update; clients don't need one.)
const STRATEGY_LABELS = {
  "sports_dc":   { name: "Sports — Dixon-Coles",         tag: "Poisson model + Kelly"  },
  "okx_daemon":  { name: "OKX live daemon",              tag: "spot + perp"            },
  "grid_v2":     { name: "Grid v2",                      tag: "range-bound"            },
  "arb_x":       { name: "Cross-exchange arbitrage",     tag: "low-latency"            },
  "trend_btc":   { name: "BTC trend follower",           tag: "momentum"               },
  "vol_target":  { name: "Vol-targeting overlay",        tag: "risk parity"            },
  "mean_rev":    { name: "Mean reversion",               tag: "pairs"                  },
  "options_iv":  { name: "Options IV scalper",           tag: "vega"                   },
};

export function renderStrategies({ api, session }) {
  const el = h(`<div class="view view-enter">
    <div class="card">
      <h2 data-i="strat.title"></h2>
      <div class="sub" data-i="strat.sub"></div>
    </div>
    <div class="card flush" id="s-list-card">
      <div class="list" id="s-list"></div>
    </div>
    <div class="banner banner-info">
      ${icons.info}<span data-i="strat.list.note"></span>
    </div>
  </div>`);

  applyI18n(el);
  const list = $("#s-list", el);

  // build the displayed set: union of the user's own strategies and the
  // known label catalog. "*" wildcard means "show every known strategy
  // as allowed."
  const me = session.me || {};
  const owned = (me.strategies || "").split(",").map(s => s.trim()).filter(Boolean);
  const isWildcard = owned.includes("*");
  const catalog = isWildcard
    ? Object.keys(STRATEGY_LABELS)
    : [...new Set([...owned, ...Object.keys(STRATEGY_LABELS)])];

  if (catalog.length === 0) {
    list.innerHTML = `<div class="empty">
      <div class="e-ico">${icons.empty}</div>
      <div class="e-title">${esc(t("strat.empty.t"))}</div>
      <div class="e-sub">${esc(t("strat.empty.s"))}</div>
    </div>`;
    return el;
  }

  for (const sid of catalog) {
    const lbl = STRATEGY_LABELS[sid] || { name: sid, tag: "" };
    const owns = isWildcard || owned.includes(sid);
    const row = h(`<div class="list-row">
      <div class="lr-ico">${icons.strategy}</div>
      <div class="lr-main">
        <div class="lr-title">${esc(lbl.name)}</div>
        <div class="lr-meta">${esc(sid)}${lbl.tag ? "  ·  " + esc(lbl.tag) : ""}</div>
      </div>
      <div class="lr-tail">
        ${owns
          ? `<span class="pill pill-ok"><span class="dot"></span>${esc(t("strat.allowed"))}</span>`
          : `<span class="pill pill-mute">${esc(t("strat.denied"))}</span>`}
      </div>
    </div>`);
    if (owns) {
      // tap = round-trip /api/entitlement to verify the server agrees right now
      row.classList.add("tap");
      row.style.cursor = "pointer";
      row.onclick = async () => {
        try {
          const r = await api.entitlement(sid);
          toast(`${lbl.name} · ${r.allowed ? t("strat.allowed") : t("strat.denied")}`,
                r.allowed ? "ok" : "err");
        } catch (err) { toast(fmtError(err), "err"); }
      };
    }
    list.appendChild(row);
  }

  return el;
}

function applyI18n(root) {
  root.querySelectorAll("[data-i]").forEach(n => n.textContent = t(n.getAttribute("data-i")));
}
