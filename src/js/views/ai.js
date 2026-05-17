// AI — upload the user's own AI API key + exchange API keys to the VPS,
// and configure the patrol schedule. The patrol module is not deployed yet
// (this client wires the UI to the planned /api/agent/* endpoints; flip the
// agent on and these inputs work immediately).

import { h, $, esc, toast, fmtError } from "../util.js";
import { t } from "../i18n.js";
import { icons } from "../icons.js";

const AI_PROVIDERS = [
  { id: "deepseek",  label: "DeepSeek",   keyHint: "sk-…" },
  { id: "openai",    label: "OpenAI",     keyHint: "sk-…" },
  { id: "anthropic", label: "Anthropic",  keyHint: "sk-ant-…" },
  { id: "moonshot",  label: "Moonshot",   keyHint: "sk-…" },
];

const EXCHANGES = [
  { id: "okx",       label: "OKX",        usesPassphrase: true  },
  { id: "binance",   label: "Binance",    usesPassphrase: false },
  { id: "bybit",     label: "Bybit",      usesPassphrase: false },
];

export function renderAI({ api }) {
  const el = h(`<div class="view view-enter">

    <div class="banner banner-warn">
      ${icons.warn}<span>
        <strong data-i="ai.todo"></strong> · <span data-i="ai.todoBody"></span>
      </span>
    </div>

    <div class="card">
      <h2 data-i="ai.title"></h2>
      <div class="sub" data-i="ai.sub"></div>

      <div class="field"><label data-i="ai.provider"></label>
        <select class="select" id="ai-provider"></select>
      </div>
      <div class="field"><label data-i="ai.model"></label>
        <input class="input" id="ai-model" placeholder="deepseek-chat" />
      </div>
      <div class="field"><label data-i="ai.apiKey"></label>
        <input class="input" id="ai-key" type="password" />
        <div class="hint" id="ai-key-status"></div>
      </div>
      <button class="btn btn-grad block" id="ai-save" data-i="ai.upload"></button>
    </div>

    <div class="card">
      <h2 data-i="ai.exch"></h2>
      <div class="banner banner-warn" style="margin:0 0 13px 0">
        ${icons.warn}<span data-i="ai.exch.note"></span>
      </div>
      <div class="field"><label data-i="ai.exch"></label>
        <select class="select" id="ex-id"></select>
      </div>
      <div class="field"><label data-i="ai.exch.key"></label>
        <input class="input" id="ex-key" type="password" />
      </div>
      <div class="field"><label data-i="ai.exch.secret"></label>
        <input class="input" id="ex-secret" type="password" />
      </div>
      <div class="field" id="ex-pp-row"><label data-i="ai.exch.passphrase"></label>
        <input class="input" id="ex-pp" type="password" />
      </div>
      <button class="btn btn-grad block" id="ex-save" data-i="ai.upload"></button>
    </div>

    <div class="card">
      <h2 data-i="patrol.title"></h2>
      <div class="sub" data-i="patrol.sub"></div>

      <div class="row between" style="margin-bottom:13px">
        <label data-i="patrol.enabled"></label>
        <div class="switch" id="p-enabled" role="switch" tabindex="0"></div>
      </div>

      <div class="field"><label data-i="patrol.period"></label>
        <input class="input" id="p-period" type="number" min="1" max="1440" value="15" />
      </div>
      <div class="field"><label data-i="patrol.cond"></label>
        <textarea class="textarea" id="p-cond" rows="4"
placeholder="position drawdown > 5%
spread widens > 2x of 1h average
funding rate flips sign"></textarea>
        <div class="hint" data-i="patrol.cond.hint"></div>
      </div>
      <div class="field"><label data-i="patrol.task"></label>
        <textarea class="textarea" id="p-task" rows="3"
placeholder="Look at the current positions and the recent price action. If anything looks dangerous, say BLOCK and one line why. Otherwise say OK."></textarea>
        <div class="hint" data-i="patrol.task.hint"></div>
      </div>
      <button class="btn btn-grad block" id="p-save" data-i="patrol.save"></button>
    </div>

  </div>`);

  applyI18n(el);

  // populate selects
  const aiSel = $("#ai-provider", el);
  AI_PROVIDERS.forEach(p =>
    aiSel.appendChild(h(`<option value="${esc(p.id)}">${esc(p.label)}</option>`)));
  const exSel = $("#ex-id", el);
  EXCHANGES.forEach(x =>
    exSel.appendChild(h(`<option value="${esc(x.id)}">${esc(x.label)}</option>`)));

  function updateExchPP() {
    const cur = EXCHANGES.find(x => x.id === exSel.value);
    $("#ex-pp-row", el).style.display = cur && cur.usesPassphrase ? "" : "none";
  }
  exSel.onchange = updateExchPP; updateExchPP();
  aiSel.onchange = () => {
    const cur = AI_PROVIDERS.find(p => p.id === aiSel.value);
    if (cur) $("#ai-key", el).placeholder = cur.keyHint;
  };
  $("#ai-key", el).placeholder = AI_PROVIDERS[0].keyHint;

  // switch toggle
  const sw = $("#p-enabled", el);
  sw.onclick = () => sw.classList.toggle("on");
  sw.onkeydown = e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); sw.click(); } };

  // try to hydrate from server (will fail silently while agent module isn't deployed)
  hydrate();

  $("#ai-save", el).onclick = async () => {
    const btn = $("#ai-save", el);
    const provider = aiSel.value;
    const apiKey = $("#ai-key", el).value.trim();
    const model = $("#ai-model", el).value.trim();
    if (!apiKey) { toast(t("g.required"), "err"); return; }
    await uploadCreds(btn, "ai/" + provider, { provider, model, api_key: apiKey });
    $("#ai-key", el).value = "";
    $("#ai-key-status", el).textContent = t("ai.apiKey.set");
  };

  $("#ex-save", el).onclick = async () => {
    const btn = $("#ex-save", el);
    const id = exSel.value;
    const blob = {
      exchange: id,
      api_key: $("#ex-key", el).value.trim(),
      api_secret: $("#ex-secret", el).value.trim(),
      passphrase: $("#ex-pp", el).value.trim() || undefined,
    };
    if (!blob.api_key || !blob.api_secret) { toast(t("g.required"), "err"); return; }
    await uploadCreds(btn, "exch/" + id, blob);
    $("#ex-key", el).value = $("#ex-secret", el).value = $("#ex-pp", el).value = "";
  };

  $("#p-save", el).onclick = async () => {
    const btn = $("#p-save", el);
    const cfg = {
      enabled:    $("#p-enabled", el).classList.contains("on"),
      period_min: parseInt($("#p-period", el).value, 10) || 15,
      conditions: $("#p-cond", el).value,
      task:       $("#p-task", el).value,
    };
    const original = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>`;
    try {
      await api.agentConfigSave(cfg);
      toast(t("g.saved"), "ok");
    } catch (err) {
      // agent module not deployed yet -> 404 from rcsd. Show explanatory toast.
      if (err.status === 404) toast(t("ai.todo"), "err", 3000);
      else                    toast(fmtError(err), "err");
    } finally {
      btn.disabled = false; btn.textContent = original;
    }
  };

  async function uploadCreds(btn, providerPath, blob) {
    const original = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${t("ai.uploading")}`;
    try {
      await api.agentCredsSave(providerPath, blob);
      toast(t("ai.uploaded"), "ok", 2800);
    } catch (err) {
      if (err.status === 404) toast(t("ai.todo"), "err", 3000);
      else                    toast(fmtError(err), "err");
    } finally {
      btn.disabled = false; btn.textContent = original;
    }
  }

  async function hydrate() {
    try {
      const cfg = await api.agentConfig();
      if (!cfg) return;
      if (cfg.enabled) sw.classList.add("on");
      if (cfg.period_min) $("#p-period", el).value = cfg.period_min;
      if (cfg.conditions) $("#p-cond", el).value = cfg.conditions;
      if (cfg.task) $("#p-task", el).value = cfg.task;
    } catch (_) { /* expected while agent module is not deployed */ }
  }

  return el;
}

function applyI18n(root) {
  root.querySelectorAll("[data-i]").forEach(n => n.textContent = t(n.getAttribute("data-i")));
}
