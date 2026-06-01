import type { StateStorage } from "zustand/middleware";

/**
 * Serializes localStorage writes to avoid "Another write batch or compaction
 * is already active" errors from rapid Zustand persist updates.
 */
let writeChain: Promise<void> = Promise.resolve();

function enqueueWrite(task: () => void): Promise<void> {
  writeChain = writeChain
    .then(() => {
      task();
    })
    .catch(() => {
      /* keep chain alive after a failed write */
    });
  return writeChain;
}

export const queuedLocalStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === "undefined") return;
    return enqueueWrite(() => {
      localStorage.setItem(name, value);
    });
  },
  removeItem: (name) => {
    if (typeof window === "undefined") return;
    return enqueueWrite(() => {
      localStorage.removeItem(name);
    });
  },
};
