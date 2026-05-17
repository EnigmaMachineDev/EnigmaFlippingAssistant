import { create } from "zustand";
import { StorageService } from "./storage";
import { DEFAULT_SETTINGS } from "./seed";
import { nowISO } from "./format";
import type { Item, Evaluation, Settings } from "./types";

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface AppState {
  items: Item[];
  evaluations: Evaluation[];
  settings: Settings;
  initialized: boolean;

  initialize: () => void;

  // Items
  addItem: (item: Omit<Item, "id" | "createdAt" | "updatedAt">) => Item;
  updateItem: (id: string, changes: Partial<Item>) => void;
  deleteItem: (id: string) => void;

  // Evaluations
  addEvaluation: (ev: Omit<Evaluation, "id" | "createdAt" | "updatedAt">) => Evaluation;
  updateEvaluation: (id: string, changes: Partial<Evaluation>) => void;
  deleteEvaluation: (id: string) => void;

  // Settings
  updateSettings: (changes: Partial<Settings>) => void;

  // Data management
  resetAll: () => void;
  replaceAll: (items: Item[], evaluations: Evaluation[], settings: Settings) => void;
}

export const useStore = create<AppState>((set, get) => ({
  items: [],
  evaluations: [],
  settings: DEFAULT_SETTINGS,
  initialized: false,

  initialize() {
    if (get().initialized) return;
    const isFirstLaunch = !StorageService.isInitialized();

    if (isFirstLaunch) {
      StorageService.setSettings(DEFAULT_SETTINGS);
      StorageService.setItems([]);
      StorageService.setEvaluations([]);
      StorageService.setSchemaVersion(1);
      StorageService.markInitialized();
    }

    set({
      items: StorageService.getItems(),
      evaluations: StorageService.getEvaluations(),
      settings: StorageService.getSettings() ?? DEFAULT_SETTINGS,
      initialized: true,
    });
  },

  addItem(partial) {
    const now = nowISO();
    const item: Item = {
      ...partial,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    };
    const items = [...get().items, item];
    set({ items });
    StorageService.setItems(items);
    return item;
  },

  updateItem(id, changes) {
    const items = get().items.map((i) =>
      i.id === id ? { ...i, ...changes, updatedAt: nowISO() } : i
    );
    set({ items });
    StorageService.setItems(items);
  },

  deleteItem(id) {
    const items = get().items.filter((i) => i.id !== id);
    set({ items });
    StorageService.setItems(items);
  },

  addEvaluation(partial) {
    const now = nowISO();
    const ev: Evaluation = {
      ...partial,
      id: uuid(),
      createdAt: now,
      updatedAt: now,
    };
    const evaluations = [...get().evaluations, ev];
    set({ evaluations });
    StorageService.setEvaluations(evaluations);
    return ev;
  },

  updateEvaluation(id, changes) {
    const evaluations = get().evaluations.map((e) =>
      e.id === id ? { ...e, ...changes, updatedAt: nowISO() } : e
    );
    set({ evaluations });
    StorageService.setEvaluations(evaluations);
  },

  deleteEvaluation(id) {
    const evaluations = get().evaluations.filter((e) => e.id !== id);
    set({ evaluations });
    StorageService.setEvaluations(evaluations);
  },

  updateSettings(changes) {
    const settings = { ...get().settings, ...changes };
    set({ settings });
    StorageService.setSettings(settings);
  },

  resetAll() {
    StorageService.clearAll();
    StorageService.setSettings(DEFAULT_SETTINGS);
    StorageService.setItems([]);
    StorageService.setEvaluations([]);
    StorageService.setSchemaVersion(1);
    StorageService.markInitialized();
    set({ items: [], evaluations: [], settings: DEFAULT_SETTINGS });
  },

  replaceAll(items, evaluations, settings) {
    StorageService.setItems(items);
    StorageService.setEvaluations(evaluations);
    StorageService.setSettings(settings);
    set({ items, evaluations, settings });
  },
}));
