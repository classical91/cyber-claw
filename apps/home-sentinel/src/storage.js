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

export function loadState(options = {}) {
  const storage = getStorage();
  const raw = storage.getItem(STORAGE_KEY);

  if (!raw) {
    return createState({ seed: options.seed ?? "sample" });
  }

  try {
    return hydrateState(JSON.parse(raw));
  } catch {
    return createState({ seed: options.seed ?? "sample" });
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
  const next = createState({ seed: options.seed ?? "sample" });
  return saveState(next);
}
