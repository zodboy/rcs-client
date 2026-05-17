// API client for rcsd. Two responsibilities:
//   1. Compute HMAC-SHA256 over (METHOD\nPATH\nTS\n + body) and attach headers
//   2. Send the request — via Tauri's HTTP plugin when running in the app,
//      or browser fetch when running in `vite dev` for UI development.

import { encodeUtf8, toHex } from "./util.js";

// detect Tauri runtime cleanly. when running in a browser tab (vite dev),
// we use fetch; when bundled into the Tauri app, we use the HTTP plugin
// to escape the WebView's CORS sandbox.
async function getHttpFetch() {
  if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
    try {
      const mod = await import("@tauri-apps/plugin-http");
      return mod.fetch;
    } catch (_) {
      // fall through to browser fetch
    }
  }
  return window.fetch.bind(window);
}

let cachedFetch = null;
async function http() {
  if (!cachedFetch) cachedFetch = await getHttpFetch();
  return cachedFetch;
}

/* sign the canonical string with a key represented as a 64-char hex string */
async function hmacHex(secretHex, message) {
  if (typeof secretHex !== "string" || secretHex.length % 2 !== 0) {
    throw new Error("invalid secret");
  }
  const keyBytes = new Uint8Array(secretHex.length / 2);
  for (let i = 0; i < secretHex.length; i += 2) {
    keyBytes[i / 2] = parseInt(secretHex.slice(i, i + 2), 16);
  }
  const key = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, encodeUtf8(message));
  return toHex(new Uint8Array(mac));
}

/* canonical string: METHOD\nPATH\nTS\nBODY  (PATH is path-only, no query) */
function canon(method, path, ts, body) {
  return `${method}\n${path}\n${ts}\n${body || ""}`;
}

export class ApiClient {
  constructor({ endpoint, keyId = null, secretHex }) {
    this.endpoint = endpoint.replace(/\/+$/, "");
    this.keyId = keyId;      // null = master key, string = subscriber key
    this.secretHex = secretHex;
  }

  async _request(method, path, bodyObj = null) {
    const body = bodyObj == null ? "" : JSON.stringify(bodyObj);
    const ts = Math.floor(Date.now() / 1000);
    const sig = await hmacHex(this.secretHex, canon(method, path, ts, body));

    const headers = {
      "X-RCS-Ts": String(ts),
      "X-RCS-Auth": sig,
    };
    if (this.keyId) headers["X-RCS-Key-Id"] = this.keyId;
    if (body) headers["Content-Type"] = "application/json";

    const f = await http();
    let resp;
    try {
      resp = await f(this.endpoint + path, {
        method,
        headers,
        body: body || undefined,
      });
    } catch (e) {
      const err = new Error("network");
      err.cause = e;
      err.kind = "network";
      throw err;
    }

    const text = await resp.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch (_) {}

    if (!resp.ok) {
      const err = new Error(json?.error || `http_${resp.status}`);
      err.kind = "http";
      err.status = resp.status;
      err.json = json;
      err.text = text;
      throw err;
    }
    return json;
  }

  /* --- unauthenticated --- */
  async health()  { const f = await http();
    try { const r = await f(this.endpoint + "/api/health"); return r.ok && (await r.json()).ok === true; }
    catch (_) { return false; } }
  async status()  { const f = await http();
    const r = await f(this.endpoint + "/api/status"); return r.json(); }

  /* --- both master and subscriber --- */
  me()                                  { return this._request("GET",  "/api/me"); }
  entitlement(strategy)                 { return this._request("GET",  "/api/entitlement/" + encodeURIComponent(strategy)); }
  evaluate(signal)                      { return this._request("POST", "/api/evaluate", signal); }

  /* --- master only (used by the admin console, not this client) --- */
  rules()                               { return this._request("GET",  "/api/rules"); }
  tiers()                               { return this._request("GET",  "/api/tiers"); }
  keys()                                { return this._request("GET",  "/api/keys"); }

  /* --- agent module endpoints (TODO: not implemented in rcsd yet) ---
     The client wires UI to these paths; flip them on when the patrol
     daemon ships. They're conventionally namespaced under /api/agent/*. */
  agentConfig()                         { return this._request("GET",  "/api/agent/config"); }
  agentConfigSave(cfg)                  { return this._request("PUT",  "/api/agent/config", cfg); }
  agentCreds(provider)                  { return this._request("GET",  "/api/agent/creds/" + encodeURIComponent(provider)); }
  agentCredsSave(provider, blob)        { return this._request("PUT",  "/api/agent/creds/" + encodeURIComponent(provider), blob); }
  agentReports(limit = 20)              { return this._request("GET",  "/api/agent/reports/" + limit); }
}
