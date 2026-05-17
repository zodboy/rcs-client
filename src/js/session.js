// session storage. In Tauri, persists via the Store plugin (writes to a JSON
// file in the app data dir, where Tauri runs the OS keychain integration on
// platforms that support it). In a browser tab (dev), falls back to
// localStorage — never use dev mode with a real production secret.

let backend = null;

async function getBackend() {
  if (backend) return backend;
  if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
    try {
      const { LazyStore } = await import("@tauri-apps/plugin-store");
      const store = new LazyStore("rcs-session.json");
      backend = {
        async get(k)       { return (await store.get(k)) ?? null; },
        async set(k, v)    { await store.set(k, v); await store.save(); },
        async remove(k)    { await store.delete(k); await store.save(); },
        async clear()      { await store.clear(); await store.save(); },
      };
      return backend;
    } catch (_) {}
  }
  backend = {
    async get(k)    { const v = localStorage.getItem(k); return v == null ? null : JSON.parse(v); },
    async set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
    async remove(k) { localStorage.removeItem(k); },
    async clear()   { localStorage.clear(); },
  };
  return backend;
}

const KEY = "session.v1";

export async function loadSession() {
  const b = await getBackend();
  return await b.get(KEY);
}

export async function saveSession(s) {
  const b = await getBackend();
  await b.set(KEY, s);
}

export async function clearSession() {
  const b = await getBackend();
  await b.remove(KEY);
}
