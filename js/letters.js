const SEEN_KEY = "val_igloo_seen";
const LOCAL_KEY = "val_igloo_letters";

export function loadLocalLetters() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveLocalLetter(letter) {
  const all = loadLocalLetters();
  all.push(letter);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  return all;
}

export async function loadLetters() {
  let fileLetters = [];
  try {
    const response = await fetch(`./letters.json?t=${Date.now()}`);
    if (response.ok) {
      const data = await response.json();
      fileLetters = data.letters || [];
    }
  } catch {
    fileLetters = [];
  }
  const merged = [...fileLetters, ...loadLocalLetters()];
  const byId = new Map();
  merged.forEach((letter) => byId.set(letter.id, letter));
  return [...byId.values()].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export function getSeenId() {
  return localStorage.getItem(SEEN_KEY) || "";
}

export function markSeen(id) {
  if (id) localStorage.setItem(SEEN_KEY, id);
}

export function latestUnread(letters) {
  if (!letters.length) return null;
  const latest = letters[letters.length - 1];
  return latest.id !== getSeenId() ? latest : null;
}

export function notifyNewLetter(letter) {
  const toast = document.getElementById("toast");
  if (toast) {
    toast.hidden = false;
    toast.textContent = `Miguel te dejó una carta nueva: ${letter.title}`;
    window.clearTimeout(notifyNewLetter._t);
    notifyNewLetter._t = window.setTimeout(() => {
      toast.hidden = true;
    }, 5200);
  }
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Carta nueva de Miguel", { body: letter.title });
  }
}
