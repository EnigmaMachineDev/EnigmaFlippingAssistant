// Mock native modules that aren't available in the test environment
jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "/tmp/",
  EncodingType: { UTF8: "utf8", Base64: "base64" },
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue("{}"),
}));
jest.mock("expo-sharing", () => ({
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

import * as fs from "fs";
import * as path from "path";
import {
  buildExportData,
  serializeExport,
  parseImportJSON,
} from "../lib/importExport";
import { migrateExportData, needsMigration } from "../lib/migrate";
import { ExportDataSchema } from "../lib/schema";
import type { Item, Evaluation, Settings, ExportData } from "../lib/types";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const baseSettings: Settings = {
  currency: "USD",
  minProfitFloor: 50,
  targetMarginPct: 40,
  hourlyLaborRate: 25,
  platformFees: [
    { id: "local", name: "Local / Cash", percent: 0, flatFee: 0 },
    { id: "reverb", name: "Reverb", percent: 5, flatFee: 0 },
  ],
  defaultPlatform: "local",
  defaultBuyPctOfRetail: 40,
  remindAfterListedDays: 30,
  theme: "dark",
  schemaVersion: 1,
};

const item1: Item = {
  id: "item-1",
  profileId: "test",
  kind: "flip",
  title: "1978 Fender Stratocaster",
  category: "Guitar",
  tags: ["vintage", "electric"],
  status: "sold",
  photos: [],
  purchasePrice: 450,
  acquiredAt: "2025-03-15T00:00:00.000Z",
  source: "Estate Sale",
  costs: [
    { id: "c1", label: "New tuners", amount: 25, kind: "materials", addedAt: "2025-03-16T00:00:00.000Z" },
    { id: "c2", label: "Setup", amount: 75, kind: "labor", addedAt: "2025-03-16T00:00:00.000Z" },
  ],
  listedAt: "2025-03-20T00:00:00.000Z",
  listedPrice: 900,
  listedPlatform: "reverb",
  soldAt: "2025-04-02T00:00:00.000Z",
  soldPrice: 875,
  soldPlatform: "reverb",
  comps: [{ id: "comp1", description: "Similar sold comp", price: 950, addedAt: "2025-03-15T00:00:00.000Z" }],
  notes: "All original except tuners",
  createdAt: "2025-03-15T00:00:00.000Z",
  updatedAt: "2025-04-02T00:00:00.000Z",
};

const item2: Item = {
  id: "item-2",
  profileId: "test",
  kind: "build",
  title: "Walnut Charcuterie Board",
  category: "Woodwork",
  tags: ["handmade"],
  status: "listed",
  photos: [],
  costs: [
    { id: "c3", label: "Walnut slab", amount: 18, kind: "materials", addedAt: "2025-05-01T00:00:00.000Z" },
  ],
  listedAt: "2025-05-10T00:00:00.000Z",
  listedPrice: 75,
  listedPlatform: "local",
  comps: [],
  createdAt: "2025-05-01T00:00:00.000Z",
  updatedAt: "2025-05-10T00:00:00.000Z",
};

const eval1: Evaluation = {
  id: "eval-1",
  profileId: "test",
  title: "1965 Silvertone 1457",
  photos: [],
  source: "Facebook Marketplace",
  askingPrice: 200,
  estimatedSalePrice: 380,
  estimatedRefurbCost: 30,
  estimatedLaborHours: 2,
  intendedSellPlatform: "reverb",
  comps: [],
  offers: [
    { id: "o1", by: "seller", amount: 200, at: "2025-05-15T10:00:00.000Z" },
    { id: "o2", by: "me", amount: 150, at: "2025-05-15T10:30:00.000Z", note: "Counter" },
  ],
  outcome: "pending",
  createdAt: "2025-05-15T00:00:00.000Z",
  updatedAt: "2025-05-15T00:00:00.000Z",
};

const items = [item1, item2];
const evaluations = [eval1];

// ─── buildExportData ──────────────────────────────────────────────────────────

describe("buildExportData", () => {
  it("includes all items and evaluations", () => {
    const data = buildExportData(items, evaluations, baseSettings);
    expect(data.items).toHaveLength(2);
    expect(data.evaluations).toHaveLength(1);
  });

  it("sets schemaVersion to 1", () => {
    const data = buildExportData(items, evaluations, baseSettings);
    expect(data.schemaVersion).toBe(1);
  });

  it("includes exportedAt timestamp", () => {
    const data = buildExportData(items, evaluations, baseSettings);
    expect(data.exportedAt).toBeTruthy();
    expect(new Date(data.exportedAt).getTime()).not.toBeNaN();
  });

  it("includes settings", () => {
    const data = buildExportData(items, evaluations, baseSettings);
    expect(data.settings.currency).toBe("USD");
    expect(data.settings.platformFees).toHaveLength(2);
  });
});

// ─── Round-trip ───────────────────────────────────────────────────────────────

describe("round-trip: serialize → parse → identical state", () => {
  it("produces valid JSON string", () => {
    const data = buildExportData(items, evaluations, baseSettings);
    const json = serializeExport(data);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("items survive the full round-trip", () => {
    const exported = buildExportData(items, evaluations, baseSettings);
    const json = serializeExport(exported);
    const { data: imported, valid } = parseImportJSON(json);

    expect(valid).toBe(true);
    expect(imported!.items).toHaveLength(items.length);

    const roundTrippedItem1 = imported!.items.find((i) => i.id === item1.id)!;
    expect(roundTrippedItem1.title).toBe(item1.title);
    expect(roundTrippedItem1.purchasePrice).toBe(item1.purchasePrice);
    expect(roundTrippedItem1.soldPrice).toBe(item1.soldPrice);
    expect(roundTrippedItem1.costs).toHaveLength(item1.costs.length);
    expect(roundTrippedItem1.costs[0].amount).toBe(item1.costs[0].amount);
    expect(roundTrippedItem1.comps).toHaveLength(item1.comps.length);
    expect(roundTrippedItem1.tags).toEqual(item1.tags);
  });

  it("evaluations survive the full round-trip", () => {
    const exported = buildExportData(items, evaluations, baseSettings);
    const json = serializeExport(exported);
    const { data: imported, valid } = parseImportJSON(json);

    expect(valid).toBe(true);
    expect(imported!.evaluations).toHaveLength(evaluations.length);

    const rt = imported!.evaluations[0];
    expect(rt.id).toBe(eval1.id);
    expect(rt.askingPrice).toBe(eval1.askingPrice);
    expect(rt.offers).toHaveLength(eval1.offers.length);
    expect(rt.offers[1].note).toBe("Counter");
    expect(rt.outcome).toBe("pending");
  });

  it("settings survive the full round-trip", () => {
    const exported = buildExportData(items, evaluations, baseSettings);
    const json = serializeExport(exported);
    const { data: imported } = parseImportJSON(json);

    expect(imported!.settings.currency).toBe("USD");
    expect(imported!.settings.minProfitFloor).toBe(50);
    expect(imported!.settings.targetMarginPct).toBe(40);
    expect(imported!.settings.platformFees).toHaveLength(2);
    expect(imported!.settings.platformFees[0].percent).toBe(0);
  });

  it("optional fields (undefined) survive round-trip as absent", () => {
    const exported = buildExportData([item2], [], baseSettings);
    const json = serializeExport(exported);
    const { data: imported } = parseImportJSON(json);

    const rt = imported!.items[0];
    expect(rt.purchasePrice).toBeUndefined();
    expect(rt.soldPrice).toBeUndefined();
    expect(rt.notes).toBeUndefined();
  });

  it("empty collections survive round-trip", () => {
    const exported = buildExportData([], [], baseSettings);
    const json = serializeExport(exported);
    const { data: imported, valid } = parseImportJSON(json);

    expect(valid).toBe(true);
    expect(imported!.items).toHaveLength(0);
    expect(imported!.evaluations).toHaveLength(0);
  });
});

// ─── parseImportJSON validation ───────────────────────────────────────────────

describe("parseImportJSON", () => {
  it("returns valid=false for empty string", () => {
    const result = parseImportJSON("");
    expect(result.valid).toBe(false);
  });

  it("returns valid=false for invalid JSON", () => {
    const result = parseImportJSON("not json at all {{{");
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("returns valid=false for valid JSON with wrong shape", () => {
    const result = parseImportJSON(JSON.stringify({ wrong: "shape" }));
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid file format");
  });

  it("returns valid=false if items entry has missing required field", () => {
    const bad = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      items: [{ id: "x" }],  // missing kind, title, tags, status, photos, costs, comps
      evaluations: [],
      settings: baseSettings,
    };
    const result = parseImportJSON(JSON.stringify(bad));
    expect(result.valid).toBe(false);
  });

  it("returns item and evaluation counts on success", () => {
    const data = buildExportData(items, evaluations, baseSettings);
    const result = parseImportJSON(serializeExport(data));
    expect(result.valid).toBe(true);
    expect(result.items).toBe(2);
    expect(result.evaluations).toBe(1);
  });

  it("accepts all valid ItemStatus values", () => {
    const statuses = ["sourcing", "acquired", "in_progress", "listed", "sold", "lost"] as const;
    for (const status of statuses) {
      const testItem: Item = { ...item1, id: `i-${status}`, status };
      const data = buildExportData([testItem], [], baseSettings);
      const result = parseImportJSON(serializeExport(data));
      expect(result.valid).toBe(true);
    }
  });

  it("accepts all valid EvaluationOutcome values", () => {
    const outcomes = ["pending", "bought", "walked", "lost_to_other_buyer"] as const;
    for (const outcome of outcomes) {
      const testEval: Evaluation = { ...eval1, id: `e-${outcome}`, outcome };
      const data = buildExportData([], [testEval], baseSettings);
      const result = parseImportJSON(serializeExport(data));
      expect(result.valid).toBe(true);
    }
  });
});

// ─── Schema migration ────────────────────────────────────────────────────────

describe("schema migration", () => {
  it("v1 data does not need migration", () => {
    expect(needsMigration(1)).toBe(false);
  });

  it("v0 data needs migration", () => {
    expect(needsMigration(0)).toBe(true);
  });

  it("migrateExportData passes v1 data through unchanged (no migrations applied)", () => {
    const data = buildExportData(items, evaluations, baseSettings);
    const { data: migrated, migrationsApplied } = migrateExportData(data);
    expect(migrationsApplied).toHaveLength(0);
    expect(migrated.schemaVersion).toBe(1);
    expect(migrated.items).toHaveLength(items.length);
    expect(migrated.evaluations).toHaveLength(evaluations.length);
  });

  it("migrateExportData does not mutate the input", () => {
    const data = buildExportData(items, evaluations, baseSettings);
    const original = JSON.stringify(data);
    migrateExportData(data);
    expect(JSON.stringify(data)).toBe(original);
  });
});

// ─── Sample export file ───────────────────────────────────────────────────────

describe("examples/sample-export.json", () => {
  it("is valid JSON", () => {
    const filePath = path.join(__dirname, "../examples/sample-export.json");
    const text = fs.readFileSync(filePath, "utf8");
    expect(() => JSON.parse(text)).not.toThrow();
  });

  it("passes ExportDataSchema validation", () => {
    const filePath = path.join(__dirname, "../examples/sample-export.json");
    const text = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(text);
    const result = ExportDataSchema.safeParse(parsed);
    expect(result.success).toBe(true);
  });

  it("round-trips cleanly", () => {
    const filePath = path.join(__dirname, "../examples/sample-export.json");
    const text = fs.readFileSync(filePath, "utf8");
    const { valid, items, evaluations } = parseImportJSON(text);
    expect(valid).toBe(true);
    expect(items).toBeGreaterThan(0);
    expect(evaluations).toBeGreaterThan(0);
  });
});

// ─── CSV structure ───────────────────────────────────────────────────────────

describe("CSV export structure", () => {
  function buildCSV(testItems: Item[], testEvals: Evaluation[]): string {
    const itemHeader =
      "id,kind,title,category,status,purchasePrice,totalCosts,soldPrice,soldPlatform,profit,acquiredAt,soldAt,tags";
    const itemRows = testItems.map((i) => {
      const totalCosts = i.costs.reduce((s, c) => s + c.amount, 0);
      const profit =
        i.soldPrice != null
          ? (i.soldPrice - (i.purchasePrice ?? 0) - totalCosts).toFixed(2)
          : "";
      return [
        i.id, i.kind,
        `"${i.title.replace(/"/g, '""')}"`,
        i.category ?? "", i.status,
        i.purchasePrice ?? "", totalCosts.toFixed(2),
        i.soldPrice ?? "", i.soldPlatform ?? "", profit,
        i.acquiredAt ?? "", i.soldAt ?? "",
        `"${i.tags.join(", ")}"`,
      ].join(",");
    });
    const evalHeader =
      "id,title,category,askingPrice,estimatedSalePrice,estimatedRefurbCost,estimatedLaborHours,intendedSellPlatform,outcome,createdAt";
    const evalRows = testEvals.map((e) =>
      [e.id, `"${e.title}"`, e.category ?? "", e.askingPrice, e.estimatedSalePrice,
       e.estimatedRefurbCost, e.estimatedLaborHours, e.intendedSellPlatform, e.outcome, e.createdAt
      ].join(",")
    );
    return "ITEMS\n" + [itemHeader, ...itemRows].join("\n") + "\n\nEVALUATIONS\n" + [evalHeader, ...evalRows].join("\n");
  }

  it("contains ITEMS and EVALUATIONS sections", () => {
    const csv = buildCSV(items, evaluations);
    expect(csv).toContain("ITEMS");
    expect(csv).toContain("EVALUATIONS");
  });

  it("item row count matches input", () => {
    const csv = buildCSV(items, evaluations);
    const itemSection = csv.split("\n\nEVALUATIONS")[0];
    const rows = itemSection.split("\n").slice(2); // skip "ITEMS\n" and header
    expect(rows).toHaveLength(items.length);
  });

  it("calculates profit correctly in CSV row", () => {
    const csv = buildCSV([item1], []);
    // soldPrice=875, purchasePrice=450, costs=100 → profit=325
    expect(csv).toContain("325.00");
  });

  it("leaves profit blank for unsold items", () => {
    const csv = buildCSV([item2], []);
    const lines = csv.split("\n");
    const dataRow = lines.find((l) => l.includes("item-2"))!;
    // profit column should be empty (two consecutive commas near end)
    expect(dataRow).toBeTruthy();
    const cols = dataRow.split(",");
    expect(cols[9]).toBe(""); // profit column
  });

  it("escapes double quotes in titles", () => {
    const weirdItem: Item = { ...item1, id: "q", title: `He said "hello"` };
    const csv = buildCSV([weirdItem], []);
    expect(csv).toContain(`"He said ""hello"""`);
  });

  it("evaluation row count matches input", () => {
    const csv = buildCSV(items, evaluations);
    const evalSection = csv.split("\n\nEVALUATIONS\n")[1];
    const rows = evalSection.split("\n").slice(1); // skip header
    expect(rows).toHaveLength(evaluations.length);
  });
});
