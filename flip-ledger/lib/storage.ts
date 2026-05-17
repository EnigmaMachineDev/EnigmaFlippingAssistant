import { createMMKV } from "react-native-mmkv";
import type { MMKV } from "react-native-mmkv";
import type { Item, Evaluation, Settings } from "./types";

export const storage: MMKV = createMMKV({ id: "flip-ledger" });

const KEYS = {
  items: "flipLedger.items",
  evaluations: "flipLedger.evaluations",
  settings: "flipLedger.settings",
  schemaVersion: "flipLedger.schemaVersion",
  initialized: "flipLedger.initialized",
} as const;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = storage.getString(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

export const StorageService = {
  isInitialized(): boolean {
    return storage.getBoolean(KEYS.initialized) ?? false;
  },

  markInitialized(): void {
    storage.set(KEYS.initialized, true);
  },

  getItems(): Item[] {
    return readJSON<Item[]>(KEYS.items, []);
  },

  setItems(items: Item[]): void {
    writeJSON(KEYS.items, items);
  },

  getEvaluations(): Evaluation[] {
    return readJSON<Evaluation[]>(KEYS.evaluations, []);
  },

  setEvaluations(evaluations: Evaluation[]): void {
    writeJSON(KEYS.evaluations, evaluations);
  },

  getSettings(): Settings | null {
    return readJSON<Settings | null>(KEYS.settings, null);
  },

  setSettings(settings: Settings): void {
    writeJSON(KEYS.settings, settings);
  },

  getSchemaVersion(): number {
    return storage.getNumber(KEYS.schemaVersion) ?? 0;
  },

  setSchemaVersion(version: number): void {
    storage.set(KEYS.schemaVersion, version);
  },

  clearAll(): void {
    storage.clearAll();
  },
};
