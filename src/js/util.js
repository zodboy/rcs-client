// small helpers shared across modules.

const _enc = new TextEncoder();
export function encodeUtf8(s) { return _enc.encode(s); }

const HEX = "0123456789abcdef";
export function toHex(bytes) {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += HEX[bytes[i] >> 4] + HEX[bytes[i] & 0xf];
  }
  return out;
}

/* DOM micro-helpers */
export function $(sel, root = document) { return root.querySelector(sel); }
export function $$(sel, root = document) { return [...root.querySelectorAll(sel)]; }

/* tiny tagged template that builds an HTMLElement from a single root markup */
export function h(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

/* basic HTML escape for any user-supplied / server-supplied text */
export function esc(s) {
  if (s == null) return "";
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"
  })[c]);
}

/* one-shot toast at the top of the toast host */
export function toast(message, kind = "ok", ms = 2200) {
  const host = document.getElementById("toast-host");
  const el = h(`<div class="toast ${kind}">
    <svg class="tdot" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="6"/></svg>
    <span></span></div>`);
  el.querySelector("span").textContent = message;
  host.appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 260); }, ms);
}

export function fmtError(err) {
  if (!err) return "unknown";
  if (err.kind === "network") return "network";
  if (err.status === 401) return "unauthorized";
  if (err.status === 403) return "forbidden";
  if (err.status === 429) return "rate_limited";
  if (err.status) return `http_${err.status}: ${err.message || ""}`;
  return err.message || String(err);
}
