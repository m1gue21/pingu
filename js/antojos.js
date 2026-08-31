const LOCAL_KEY = "val_igloo_antojos";
const CONFIG_KEY = "val_igloo_antojos_config";

let configCache = null;
let syncEnabled = false;

export function isSyncEnabled() {
  return syncEnabled;
}

export function loadLocalAntojos() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveLocalAntojos(antojos) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(antojos));
  return antojos;
}

async function loadConfig() {
  if (configCache) return configCache;
  try {
    const response = await fetch(`./antojos-config.json?t=${Date.now()}`);
    if (response.ok) {
      configCache = await response.json();
    }
  } catch {
    configCache = null;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG_KEY) || "null");
    if (saved?.syncUrl && saved?.secret) {
      configCache = { ...configCache, ...saved };
    }
  } catch {
    // ignore
  }
  syncEnabled = Boolean(configCache?.syncUrl && configCache?.secret);
  return configCache || { syncUrl: "", secret: "" };
}

function syncGetUrl(config) {
  const url = new URL(config.syncUrl);
  url.searchParams.set("secret", config.secret);
  return url.toString();
}

async function fetchRemoteAntojos(config) {
  const response = await fetch(syncGetUrl(config));
  if (!response.ok) throw new Error("sync-read-failed");
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.antojos || [];
}

async function postRemoteAction(config, payload) {
  const response = await fetch(config.syncUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ secret: config.secret, ...payload }),
  });
  if (!response.ok) throw new Error("sync-write-failed");
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  const antojos = data.antojos || [];
  saveLocalAntojos(antojos);
  return antojos;
}

async function loadFileAntojos() {
  try {
    const response = await fetch(`./antojos.json?t=${Date.now()}`);
    if (response.ok) {
      const data = await response.json();
      return data.antojos || [];
    }
  } catch {
    // ignore
  }
  return [];
}

export async function loadAntojos() {
  const config = await loadConfig();
  if (syncEnabled) {
    try {
      const remote = await fetchRemoteAntojos(config);
      saveLocalAntojos(remote);
      return remote;
    } catch {
      const local = loadLocalAntojos();
      if (local.length) return local;
    }
  }

  const fileAntojos = await loadFileAntojos();
  const local = loadLocalAntojos();
  if (!local.length) return fileAntojos;
  if (!fileAntojos.length) return local;
  const byId = new Map();
  fileAntojos.forEach((item) => byId.set(item.id, item));
  local.forEach((item) => byId.set(item.id, item));
  return [...byId.values()].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

async function persistAntojos(mutate) {
  const current = await loadAntojos();
  const next = mutate(current);
  saveLocalAntojos(next);
  return next;
}

export async function addAntojo(text) {
  const trimmed = text.trim();
  if (!trimmed) return loadAntojos();

  const config = await loadConfig();
  if (syncEnabled) {
    try {
      return await postRemoteAction(config, { action: "add", text: trimmed });
    } catch {
      // fallback
    }
  }

  const item = {
    id: `antojo-${Date.now()}`,
    text: trimmed,
    done: false,
    date: new Date().toISOString().slice(0, 10),
  };
  return persistAntojos((all) => [...all, item]);
}

export async function toggleAntojo(id) {
  const config = await loadConfig();
  if (syncEnabled) {
    try {
      return await postRemoteAction(config, { action: "toggle", id });
    } catch {
      // fallback
    }
  }
  return persistAntojos((all) =>
    all.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
  );
}

export async function removeAntojo(id) {
  const config = await loadConfig();
  if (syncEnabled) {
    try {
      return await postRemoteAction(config, { action: "remove", id });
    } catch {
      // fallback
    }
  }
  return persistAntojos((all) => all.filter((item) => item.id !== id));
}

export async function exportAntojos() {
  const antojos = await loadAntojos();
  const blob = new Blob([JSON.stringify({ antojos }, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "antojos.json";
  link.click();
}
