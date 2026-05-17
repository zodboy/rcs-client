// Risk — read-only view of the active ruleset (display only; edits go via
// proposal+approval on the operator side). Plus an evaluation tester that
// fires a synthetic signal at /api/evaluate to show users what the rules do.

import { h, $, esc, toast, fmtError } from "../util.js";
import { t } from "../i18n.js";
import { icons } from "../icons.js";

const ACTION_PILL = {
  allow:    "pill-ok",
  alert:    "pill-warn",
  throttle: "pill-warn",
  block:    "pill-danger",
  halt:     "pill-danger",
};

export function renderRisk({ api }) {
  const el = h(`<div class="view view-enter">
    <div class="card">
      <h2 data-i="risk.title"></h2>
      <div class="sub" data-i="risk.sub"></div>
      <div id="r-meta" class="row" style="gap:8px;margin-top:6px"></div>
    </div>
    <div class="card flush"><div class="list" id="r-list">
      <div style="padding:18px"><div class="skel skel-line w60"></div>
        <div class="skel skel-line w80"></div><div class="skel skel-line w40"></div></div>
    </div></div>
    <div class="card">
      <h2 data-i="risk.evalTitle"></h2>
      <div class="sub" data-i="risk.evalSub"></div>
      <div class="field"><label data-i="risk.field.bid"></label>
        <input class="input" id="ev-bid" type="number" step="0.0001" value="42000"></div>
      <div class="field"><label data-i="risk.field.ask"></label>
        <input class="input" id="ev-ask" type="number" step="0.0001" value="42010"></div>
      <div class="field"><label data-i="risk.field.last"></label>
        <input class="input" id="ev-last" type="number" step="0.0001" value="42005"></div>
      <div class="field"><label data-i="risk.field.vol"></label>
        <input class="input" id="ev-vol" type="number" step="0.0001" value="12.5"></div>
      <button class="btn btn-grad block" id="ev-run" data-i="risk.evalRun"></button>
      <div class="spacer-sm"></div>
      <pre class="code-out" id="ev-out" hidden></pre>
    </div>
  </div>`);

  applyI18n(el);

  loadRules();

  $("#ev-run", el).onclick = async () => {
    const btn = $("#ev-run", el);
    const original = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>`;
    try {
      const r = await api.evaluate({
        symbol: "BTC-USDT",
        bid:  parseFloat($("#ev-bid", el).value),
        ask:  parseFloat($("#ev-ask", el).value),
        last: parseFloat($("#ev-last", el).value),
        vol:  parseFloat($("#ev-vol", el).value),
      });
      const out = $("#ev-out", el);
      out.hidden = false;
      out.textContent = JSON.stringify(r, null, 2);
      const action = (r && r.action) || "allow";
      toast(`→ ${t("risk.action." + action) || action}`,
        ["block","halt"].includes(action) ? "err" : "ok");
    } catch (err) {
      toast(fmtError(err), "err");
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  };

  async function loadRules() {
    const list = $("#r-list", el);
    const meta = $("#r-meta", el);
    try {
      const rs = await api.rules();
      const rules = (rs && rs.rules) || [];
      const n = rules.length;
      meta.innerHTML = `<span class="pill pill-mute">${
        esc(n === 1 ? t("risk.ruleCount", { n }) : t("risk.ruleCountP", { n }))}</span>`;
      if (n === 0) {
        list.innerHTML = `<div class="empty">
          <div class="e-ico">${icons.empty}</div>
          <div class="e-title">${esc(t("risk.empty.t"))}</div>
          <div class="e-sub">${esc(t("risk.empty.s"))}</div></div>`;
        return;
      }
      list.innerHTML = "";
      for (const rule of rules) {
        const pill = ACTION_PILL[rule.action] || "pill-mute";
        const terms = (rule.terms || []).map(tm =>
          esc(t("risk.term", {
            field: t("risk.field." + tm.field) || tm.field,
            op: tm.op, value: tm.value
          }))).join(`  <span class="dim">${esc((rule.logic||"and").toUpperCase())}</span>  `);
        const row = h(`<div class="list-row">
          <div class="lr-ico">${icons.shield}</div>
          <div class="lr-main">
            <div class="lr-title">${esc(rule.id || "rule")}</div>
            <div class="lr-meta">${terms || "<i>—</i>"} · ${esc(t("risk.severity",{n: rule.severity ?? 0}))}</div>
          </div>
          <div class="lr-tail">
            <span class="pill ${pill}">${esc(t("risk.action." + rule.action) || rule.action)}</span>
          </div>
        </div>`);
        if (rule.enabled === false) row.style.opacity = ".5";
        list.appendChild(row);
      }
    } catch (err) {
      // /api/rules is master-only. Subscribers cannot see it directly.
      // Show a friendly note instead of an error.
      if (err.status === 403) {
        list.innerHTML = `<div class="empty">
          <div class="e-ico">${icons.shield}</div>
          <div class="e-title">${esc(t("risk.title"))}</div>
          <div class="e-sub">${esc(t("risk.sub"))}</div></div>`;
        meta.innerHTML = `<span class="pill pill-mute">server-side only</span>`;
      } else {
        list.innerHTML = `<div class="empty">
          <div class="e-ico">${icons.warn}</div>
          <div class="e-sub">${esc(fmtError(err))}</div></div>`;
      }
    }
  }

  return el;
}

function applyI18n(root) {
  root.querySelectorAll("[data-i]").forEach(n => n.textContent = t(n.getAttribute("data-i")));
}
