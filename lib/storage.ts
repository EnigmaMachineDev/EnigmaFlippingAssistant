import { createMMKV } from "react-native-mmkv";
import type { MMKV } from "react-native-mmkv";
import type { Item, Evaluation, Settings, Profile, Expense, Product, ProductSale } from "./types";

// Lazy MMKV: creating a Nitro HybridObject at JS module-eval time can crash
// the native side before its registration is finished. Defer until the first
// storage call, which runs from inside React after the bridge is ready.
let _storage: MMKV | null = null;
function mmkv(): MMKV {
  if (_storage == null) _storage = createMMKV({ id: "flip-ledger" });
  return _storage;
}
export const storage: MMKV = new Proxy({} as MMKV, {
  get(_t, prop) {
    const target = mmkv() as any;
    const value = target[prop];
    return typeof value === "function" ? value.bind(target) : value;
  },
}) as MMKV;

const KEYS = {
  items: "flipLedger.items",
  evaluations: "flipLedger.evaluations",
  settings: "flipLedger.settings",
  profiles: "flipLedger.profiles",
  activeProfileId: "flipLedger.activeProfileId",
  expenses: "flipLedger.expenses",
  products: "flipLedger.products",
  productSales: "flipLedger.productSales",
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

  getProfiles(): Profile[] {
    return readJSON<Profile[]>(KEYS.profiles, []);
  },

  setProfiles(profiles: Profile[]): void {
    writeJSON(KEYS.profiles, profiles);
  },

  getActiveProfileId(): string | null {
    return storage.getString(KEYS.activeProfileId) ?? null;
  },

  setActiveProfileId(id: string | null): void {
    if (id) storage.set(KEYS.activeProfileId, id);
    else storage.remove(KEYS.activeProfileId);
  },

  getExpenses(): Expense[] {
    return readJSON<Expense[]>(KEYS.expenses, []);
  },

  setExpenses(expenses: Expense[]): void {
    writeJSON(KEYS.expenses, expenses);
  },

  getProducts(): Product[] {
    return readJSON<Product[]>(KEYS.products, []);
  },

  setProducts(products: Product[]): void {
    writeJSON(KEYS.products, products);
  },

  getProductSales(): ProductSale[] {
    return readJSON<ProductSale[]>(KEYS.productSales, []);
  },

  setProductSales(sales: ProductSale[]): void {
    writeJSON(KEYS.productSales, sales);
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
