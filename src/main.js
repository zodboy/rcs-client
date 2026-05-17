// Main entry. Boots the app shell, runs the auth gate, mounts views.

import { $, h, toast } from "./js/util.js";
import { t, LANGUAGES, getLang, setLang, onLangChange } from "./js/i18n.js";
import { ApiClient } from "./js/api.js";
import { loadSession, saveSession, clearSession } from "./js/session.js";
import { icons, ICON_GRAD_DEFS } from "./js/icons.js";

import { renderAuth }       from "./js/views/auth.js";
import { renderHome }       from "./js/views/home.js";
import { renderStrategies } from "./js/views/strategies.js";
import { renderRisk }       from "./js/views/risk.js";
import { renderAI }         from "./js/views/ai.js";
import { renderMe }         from "./js/views/me.js";

document.documentElement.setAttribute("lang", getLang());
document.body.insertAdjacentHTML("afterbegin", ICON_GRAD_DEFS);

let session = null;        // { endpoint, keyId, secretHex, me }
let api     = null;
let currentTab = "home";
let langMenu = null;       // open menu element, if any

const TABS = [
  { id: "home",     ico: icons.home,     i18n: "tab.home"     },
  { id: "strategy", ico: icons.strategy, i18n: "tab.strategy" },
  { id: "risk",     ico: icons.risk,     i18n: "tab.risk"     },
  { id: "ai",       ico: icons.ai,       i18n: "tab.ai"       },
  { id: "me",       ico: icons.me,       i18n: "tab.me"       },
];

async function boot() {
  const root = $("#app");
  const saved = await loadSession();

  if (!saved || !saved.endpoint || !saved.keyId || !saved.secretHex) {
    return mountAuth(root);
  }

  // try silently re-verifying the saved credentials. If it fails, drop to auth.
  api = new ApiClient(saved);
  try {
    const me = await api.me();
    session = { ...saved, me };
    mountShell(root);
  } catch (_) {
    await clearSession();
    mountAuth(root);
  }
}

function mountAuth(root) {
  api = null; session = null;
  root.replaceChildren();
  // a slim nav on top of the auth screen, mostly to hold the language switcher
  const slimNav = h(`<div class="nav" style="border-bottom:none;background:transparent">
    <div class="spacer"></div>
    <button class="lang-btn" id="lang-btn">${icons.globe}<span id="lang-label"></span></button>
  </div>`);
  const wrap = h(`<div style="display:flex;flex-direction:column;height:100%"></div>`);
  wrap.appendChild(slimNav);
  const view = renderAuth({
    onSuccess: async ({ endpoint, keyId, secretHex, me }) => {
      session = { endpoint, keyId, secretHex, me };
      api = new ApiClient(session);
      mountShell(root);
    },
    openExternal: openExternalUrl,
  });
  wrap.appendChild(view);
  root.appendChild(wrap);
  bindLangButton(wrap);
  refreshLangLabel(wrap);
}

function mountShell(root) {
  root.replaceChildren();
  const shell = h(`<div class="shell">
    <div class="nav">
      <div class="brand">
        <div class="mark">
          <svg viewBox="0 0 20 20" fill="none" stroke="white" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 11l3 3 4-6 3 3 3-5"/>
          </svg>
        </div>
        <div class="word">${t("app.name")}</div>
        <div class="section" id="nav-section"></div>
      </div>
      <div class="spacer"></div>
      <button class="lang-btn" id="lang-btn">${icons.globe}<span id="lang-label"></span></button>
    </div>
    <div class="content" id="content"></div>
    <div class="tabbar" id="tabbar"></div>
  </div>`);
  root.appendChild(shell);

  // render tab bar
  const tb = $("#tabbar", shell);
  for (const tab of TABS) {
    const btn = h(`<button data-tab="${tab.id}">${tab.ico}<span class="lbl"></span></button>`);
    btn.querySelector(".lbl").textContent = t(tab.i18n);
    btn.onclick = () => switchTab(tab.id);
    tb.appendChild(btn);
  }

  bindLangButton(shell);
  refreshLangLabel(shell);
  switchTab(currentTab || "home");

  onLangChange(() => {
    // refresh nav + tab labels without remounting
    refreshLangLabel(shell);
    [...tb.children].forEach((btn, i) => {
      btn.querySelector(".lbl").textContent = t(TABS[i].i18n);
    });
    // re-mount the current view so its strings refresh too
    switchTab(currentTab);
  });
}

function switchTab(id) {
  currentTab = id;
  const tb = $("#tabbar");
  if (tb) [...tb.children].forEach(b =>
    b.classList.toggle("on", b.dataset.tab === id));

  const content = $("#content");
  if (!content) return;
  content.replaceChildren();

  const section = $("#nav-section");
  const tab = TABS.find(t => t.id === id);
  if (section && tab) section.textContent = "·  " + t(tab.i18n);

  let view;
  switch (id) {
    case "home":     view = renderHome({ api, session }); break;
    case "strategy": view = renderStrategies({ api, session }); break;
    case "risk":     view = renderRisk({ api }); break;
    case "ai":       view = renderAI({ api }); break;
    case "me":       view = renderMe({ session, onSignout: signOut }); break;
    default:         view = renderHome({ api, session });
  }
  content.appendChild(view);
  content.scrollTop = 0;
}

async function signOut() {
  await clearSession();
  api = null; session = null;
  currentTab = "home";
  mountAuth($("#app"));
}

/* ---- language menu ---- */

function bindLangButton(root) {
  const btn = root.querySelector("#lang-btn");
  if (!btn) return;
  btn.onclick = (e) => {
    e.stopPropagation();
    if (langMenu) { closeLangMenu(); return; }
    openLangMenu(btn);
  };
}

function refreshLangLabel(root) {
  const lbl = root.querySelector("#lang-label");
  if (!lbl) return;
  const cur = LANGUAGES.find(l => l.code === getLang());
  lbl.textContent = cur ? cur.native : "EN";
}

function openLangMenu(anchorBtn) {
  const menu = h(`<div class="lang-menu" role="menu"></div>`);
  for (const l of LANGUAGES) {
    const item = h(`<button>
      <span>${l.native}</span>
      <span>
        ${l.status === "stub" ? `<span class="stub">${t("lang.partial")}</span>` : ""}
        <svg class="tick" viewBox="0 0 16 16" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 8l3 3 7-7"/></svg>
      </span>
    </button>`);
    if (l.code === getLang()) item.classList.add("on");
    item.onclick = () => {
      setLang(l.code);
      closeLangMenu();
    };
    menu.appendChild(item);
  }
  document.body.appendChild(menu);
  // anchor below the button
  const r = anchorBtn.getBoundingClientRect();
  menu.style.top  = (r.bottom + 6) + "px";
  menu.style.right = (window.innerWidth - r.right) + "px";

  langMenu = menu;
  setTimeout(() => document.addEventListener("click", onDocClick), 0);
}
function closeLangMenu() {
  if (!langMenu) return;
  langMenu.remove();
  langMenu = null;
  document.removeEventListener("click", onDocClick);
}
function onDocClick(e) {
  if (langMenu && !langMenu.contains(e.target)) closeLangMenu();
}

/* ---- open external URL safely ---- */
async function openExternalUrl(url) {
  if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
    try {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(url);
      return;
    } catch (e) {
      // fall back
    }
  }
  window.open(url, "_blank", "noopener");
}

boot();
