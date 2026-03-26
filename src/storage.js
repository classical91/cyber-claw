import { createState, hydrateState } from "./securityModel.js";

const STORAGE_KEY = "home-sentinel/state";
const memoryStorage = new Map();

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return {
      getItem(key) {
        return memoryStorage.has(key) ? memoryStorage.get(key) : null;
      },
      setItem(key, value) {
        memoryStorage.set(key, value);
      },
      removeItem(key) {
        memoryStorage.delete(key);
      }
    };
  }
}

function looksLikeSeededDemoState(state) {
  if (!state || typeof state !== "object") {
    return false;
  }

  if (Array.isArray(state.commandLog) && state.commandLog.some((entry) => String(entry?.id ?? "").startsWith("seed-"))) {
    return true;
  }

  const demoAlertIds = new Set(["garage-heartbeat", "back-gate-battery", "front-delivery"]);
  if (Array.isArray(state.alerts) && state.alerts.some((alert) => demoAlertIds.has(alert?.id))) {
    return true;
  }

  return false;
}

export function loadState(options = {}) {
  const storage = getStorage();
  const raw = storage.getItem(STORAGE_KEY);

  if (!raw) {
    return createState({ seed: options.seed ?? "blank" });
  }

  try {
    const parsed = JSON.parse(raw);

    if (looksLikeSeededDemoState(parsed)) {
      const next = createState({ seed: "blank" });
      storage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    }

    return hydrateState(parsed);
  } catch {
    return createState({ seed: options.seed ?? "blank" });
  }
}

export function saveState(state) {
  const storage = getStorage();
  const next = hydrateState({
    ...state,
    updatedAt: new Date().toISOString()
  });

  storage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function resetState(options = {}) {
  const next = createState({ seed: options.seed ?? "blank" });
  return saveState(next);
}
