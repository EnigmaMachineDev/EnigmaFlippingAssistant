import { create } from "zustand";
import { StorageService } from "./storage";
import { DEFAULT_SETTINGS } from "./seed";
import { nowISO } from "./format";
import type {
  Item, Evaluation, Settings, Profile, Expense, Product, ProductSale,
} from "./types";

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface AppState {
  profiles: Profile[];
  activeProfileId: string | null;
  items: Item[];
  evaluations: Evaluation[];
  expenses: Expense[];
  products: Product[];
  productSales: ProductSale[];
  initialized: boolean;

  initialize: () => void;

  // Profiles
  addProfile: (profile: Omit<Profile, "id" | "createdAt">) => Profile;
  updateProfile: (id: string, changes: Partial<Omit<Profile, "id" | "createdAt">>) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;

  // Settings (updates active profile's settings)
  updateSettings: (changes: Partial<Settings>) => void;

  // Items
  addItem: (item: Omit<Item, "id" | "createdAt" | "updatedAt">) => Item;
  updateItem: (id: string, changes: Partial<Item>) => void;
  deleteItem: (id: string) => void;

  // Evaluations
  addEvaluation: (ev: Omit<Evaluation, "id" | "createdAt" | "updatedAt">) => Evaluation;
  updateEvaluation: (id: string, changes: Partial<Evaluation>) => void;
  deleteEvaluation: (id: string) => void;

  // Expenses
  addExpense: (expense: Omit<Expense, "id">) => Expense;
  updateExpense: (id: string, changes: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Products (catalog)
  addProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => Product;
  updateProduct: (id: string, changes: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Product Sales (catalog)
  addProductSale: (sale: Omit<ProductSale, "id">) => ProductSale;
  updateProductSale: (id: string, changes: Partial<ProductSale>) => void;
  deleteProductSale: (id: string) => void;

  // Data management
  resetAll: () => void;
  replaceAll: (items: Item[], evaluations: Evaluation[], settings: Settings) => void;
}

export const useStore = create<AppState>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  items: [],
  evaluations: [],
  expenses: [],
  products: [],
  productSales: [],
  initialized: false,

  initialize() {
    if (get().initialized) return;

    const isFirstLaunch = !StorageService.isInitialized();

    if (isFirstLaunch) {
      // Brand new install — create a default flip profile
      const defaultProfile: Profile = {
        id: uuid(),
        name: "My Profile",
        emoji: "🔄",
        kind: "flip",
        settings: DEFAULT_SETTINGS,
        createdAt: nowISO(),
      };
      StorageService.setProfiles([defaultProfile]);
      StorageService.setActiveProfileId(defaultProfile.id);
      StorageService.setItems([]);
      StorageService.setEvaluations([]);
      StorageService.setExpenses([]);
      StorageService.setProducts([]);
      StorageService.setProductSales([]);
      StorageService.setSchemaVersion(1);
      StorageService.markInitialized();

      set({
        profiles: [defaultProfile],
        activeProfileId: defaultProfile.id,
        items: [],
        evaluations: [],
        expenses: [],
        products: [],
        productSales: [],
        initialized: true,
      });
      return;
    }

    // Existing install — load profiles (or migrate from pre-profile data)
    let profiles = StorageService.getProfiles();
    let activeProfileId = StorageService.getActiveProfileId();

    const rawItems = StorageService.getItems();
    const rawEvaluations = StorageService.getEvaluations();

    // Migration: pre-profile install has items/evaluations but no profiles
    if (profiles.length === 0) {
      const storedSettings = StorageService.getSettings();
      const migratedSettings: Settings = storedSettings
        ? { ...DEFAULT_SETTINGS, ...storedSettings }
        : DEFAULT_SETTINGS;

      const defaultProfile: Profile = {
        id: uuid(),
        name: "My Profile",
        emoji: "🔄",
        kind: "flip",
        settings: migratedSettings,
        createdAt: nowISO(),
      };
      profiles = [defaultProfile];
      activeProfileId = defaultProfile.id;
      StorageService.setProfiles(profiles);
      StorageService.setActiveProfileId(activeProfileId);
    }

    // Ensure activeProfileId points to a real profile
    if (!activeProfileId || !profiles.find((p) => p.id === activeProfileId)) {
      activeProfileId = profiles[0]?.id ?? null;
      StorageService.setActiveProfileId(activeProfileId);
    }

    // Normalize items — assign profileId if missing (pre-profile data)
    const fallbackProfileId = activeProfileId ?? profiles[0]?.id ?? "";
    const normalizedItems = rawItems.map((item) => ({
      ...item,
      profileId: (item as any).profileId ?? fallbackProfileId,
      costs: item.costs ?? [],
      comps: item.comps ?? [],
      tags: item.tags ?? [],
      photos: item.photos ?? [],
    }));

    const normalizedEvaluations = rawEvaluations.map((ev) => ({
      ...ev,
      profileId: (ev as any).profileId ?? fallbackProfileId,
      comps: ev.comps ?? [],
      offers: ev.offers ?? [],
      photos: ev.photos ?? [],
    }));

    // Persist migrated items if they changed
    if (rawItems.some((i) => !(i as any).profileId)) {
      StorageService.setItems(normalizedItems);
    }
    if (rawEvaluations.some((e) => !(e as any).profileId)) {
      StorageService.setEvaluations(normalizedEvaluations);
    }

    set({
      profiles,
      activeProfileId,
      items: normalizedItems,
      evaluations: normalizedEvaluations,
      expenses: StorageService.getExpenses(),
      products: StorageService.getProducts(),
      productSales: StorageService.getProductSales(),
      initialized: true,
    });
  },

  // ─── Profiles ──────────────────────────────────────────────────────────────

  addProfile(partial) {
    const profile: Profile = { ...partial, id: uuid(), createdAt: nowISO() };
    const profiles = [...get().profiles, profile];
    set({ profiles });
    StorageService.setProfiles(profiles);
    return profile;
  },

  updateProfile(id, changes) {
    const profiles = get().profiles.map((p) =>
      p.id === id ? { ...p, ...changes } : p
    );
    set({ profiles });
    StorageService.setProfiles(profiles);
  },

  deleteProfile(id) {
    const profiles = get().profiles.filter((p) => p.id !== id);
    // Clean up all data for this profile
    const items = get().items.filter((i) => i.profileId !== id);
    const evaluations = get().evaluations.filter((e) => e.profileId !== id);
    const expenses = get().expenses.filter((e) => e.profileId !== id);
    const products = get().products.filter((p) => p.profileId !== id);
    const productSales = get().productSales.filter((s) => s.profileId !== id);

    let activeProfileId = get().activeProfileId;
    if (activeProfileId === id) {
      activeProfileId = profiles[0]?.id ?? null;
      StorageService.setActiveProfileId(activeProfileId);
    }

    set({ profiles, items, evaluations, expenses, products, productSales, activeProfileId });
    StorageService.setProfiles(profiles);
    StorageService.setItems(items);
    StorageService.setEvaluations(evaluations);
    StorageService.setExpenses(expenses);
    StorageService.setProducts(products);
    StorageService.setProductSales(productSales);
  },

  setActiveProfile(id) {
    set({ activeProfileId: id });
    StorageService.setActiveProfileId(id);
  },

  // ─── Settings ──────────────────────────────────────────────────────────────

  updateSettings(changes) {
    const { profiles, activeProfileId } = get();
    const profiles2 = profiles.map((p) =>
      p.id === activeProfileId
        ? { ...p, settings: { ...p.settings, ...changes } }
        : p
    );
    set({ profiles: profiles2 });
    StorageService.setProfiles(profiles2);
  },

  // ─── Items ─────────────────────────────────────────────────────────────────

  addItem(partial) {
    const now = nowISO();
    const item: Item = { ...partial, id: uuid(), createdAt: now, updatedAt: now };
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

  // ─── Evaluations ───────────────────────────────────────────────────────────

  addEvaluation(partial) {
    const now = nowISO();
    const ev: Evaluation = { ...partial, id: uuid(), createdAt: now, updatedAt: now };
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

  // ─── Expenses ──────────────────────────────────────────────────────────────

  addExpense(partial) {
    const expense: Expense = { ...partial, id: uuid() };
    const expenses = [...get().expenses, expense];
    set({ expenses });
    StorageService.setExpenses(expenses);
    return expense;
  },

  updateExpense(id, changes) {
    const expenses = get().expenses.map((e) =>
      e.id === id ? { ...e, ...changes } : e
    );
    set({ expenses });
    StorageService.setExpenses(expenses);
  },

  deleteExpense(id) {
    const expenses = get().expenses.filter((e) => e.id !== id);
    set({ expenses });
    StorageService.setExpenses(expenses);
  },

  // ─── Products ──────────────────────────────────────────────────────────────

  addProduct(partial) {
    const now = nowISO();
    const product: Product = { ...partial, id: uuid(), createdAt: now, updatedAt: now };
    const products = [...get().products, product];
    set({ products });
    StorageService.setProducts(products);
    return product;
  },

  updateProduct(id, changes) {
    const products = get().products.map((p) =>
      p.id === id ? { ...p, ...changes, updatedAt: nowISO() } : p
    );
    set({ products });
    StorageService.setProducts(products);
  },

  deleteProduct(id) {
    const products = get().products.filter((p) => p.id !== id);
    const productSales = get().productSales.filter((s) => s.productId !== id);
    set({ products, productSales });
    StorageService.setProducts(products);
    StorageService.setProductSales(productSales);
  },

  // ─── Product Sales ─────────────────────────────────────────────────────────

  addProductSale(partial) {
    const sale: ProductSale = { ...partial, id: uuid() };
    const productSales = [...get().productSales, sale];
    set({ productSales });
    StorageService.setProductSales(productSales);
    return sale;
  },

  updateProductSale(id, changes) {
    const productSales = get().productSales.map((s) =>
      s.id === id ? { ...s, ...changes } : s
    );
    set({ productSales });
    StorageService.setProductSales(productSales);
  },

  deleteProductSale(id) {
    const productSales = get().productSales.filter((s) => s.id !== id);
    set({ productSales });
    StorageService.setProductSales(productSales);
  },

  // ─── Data management ───────────────────────────────────────────────────────

  resetAll() {
    StorageService.clearAll();
    const defaultProfile: Profile = {
      id: uuid(),
      name: "My Profile",
      emoji: "🔄",
      kind: "flip",
      settings: DEFAULT_SETTINGS,
      createdAt: nowISO(),
    };
    StorageService.setProfiles([defaultProfile]);
    StorageService.setActiveProfileId(defaultProfile.id);
    StorageService.setItems([]);
    StorageService.setEvaluations([]);
    StorageService.setExpenses([]);
    StorageService.setProducts([]);
    StorageService.setProductSales([]);
    StorageService.setSchemaVersion(1);
    StorageService.markInitialized();
    set({
      profiles: [defaultProfile],
      activeProfileId: defaultProfile.id,
      items: [],
      evaluations: [],
      expenses: [],
      products: [],
      productSales: [],
    });
  },

  replaceAll(items, evaluations, settings) {
    const { profiles, activeProfileId } = get();
    const profiles2 = profiles.map((p) =>
      p.id === activeProfileId ? { ...p, settings } : p
    );
    StorageService.setItems(items);
    StorageService.setEvaluations(evaluations);
    StorageService.setProfiles(profiles2);
    set({ items, evaluations, profiles: profiles2 });
  },
}));
