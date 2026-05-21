import {
  getTotalCost,
  getRecommendedPrices,
  getRealizedProfit,
  getInventoryValue,
  getMaxBuyPrice,
  getTargetBuyPrice,
  getBuyVerdict,
} from "../lib/pricing";
import type { Item, Evaluation, Settings } from "../lib/types";

const baseSettings: Settings = {
  currency: "USD",
  minProfitFloor: 50,
  targetMarginPct: 40,
  hourlyLaborRate: 25,
  platformFees: [
    { id: "local", name: "Local / Cash", percent: 0, flatFee: 0 },
    { id: "reverb", name: "Reverb", percent: 5, flatFee: 0 },
    { id: "ebay", name: "eBay", percent: 13.25, flatFee: 0 },
  ],
  defaultPlatform: "local",
  defaultBuyPctOfRetail: 40,
  remindAfterListedDays: 30,
  theme: "dark",
  schemaVersion: 1,
};

const baseItem: Item = {
  id: "item-1",
  kind: "flip",
  title: "Test Guitar",
  tags: [],
  status: "acquired",
  photos: [],
  purchasePrice: 100,
  costs: [
    { id: "c1", label: "New tuners", amount: 30, kind: "materials", addedAt: "2024-01-01" },
    { id: "c2", label: "Labor", amount: 50, kind: "labor", addedAt: "2024-01-01" },
  ],
  comps: [],
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

const baseEval: Evaluation = {
  id: "eval-1",
  title: "Test Eval",
  photos: [],
  askingPrice: 150,
  estimatedSalePrice: 300,
  estimatedRefurbCost: 40,
  estimatedLaborHours: 2,
  intendedSellPlatform: "local",
  comps: [],
  offers: [],
  outcome: "pending",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

// ─── getTotalCost ────────────────────────────────────────────────────────────

describe("getTotalCost", () => {
  it("sums purchasePrice + all costs", () => {
    expect(getTotalCost(baseItem, 25)).toBe(180); // 100 + 30 + 50
  });

  it("handles zero purchase price (builds)", () => {
    const buildItem: Item = { ...baseItem, purchasePrice: undefined };
    expect(getTotalCost(buildItem, 25)).toBe(80);
  });

  it("handles no costs", () => {
    const simple: Item = { ...baseItem, costs: [] };
    expect(getTotalCost(simple, 25)).toBe(100);
  });
});

// ─── getRecommendedPrices ────────────────────────────────────────────────────

describe("getRecommendedPrices", () => {
  it("minimum covers cost + profit floor (0% fee)", () => {
    const { minimum } = getRecommendedPrices(baseItem, baseSettings);
    // totalCost=180, floor=50 => minimum = 230
    expect(minimum).toBe(230);
  });

  it("dream is at least recommended * 1.15", () => {
    const { recommended, dream } = getRecommendedPrices(baseItem, baseSettings);
    expect(dream).toBeGreaterThanOrEqual(recommended * 1.15 - 0.01);
  });

  it("uses comp max for dream if higher", () => {
    const item: Item = {
      ...baseItem,
      comps: [{ id: "c1", description: "Comp", price: 1000, addedAt: "2024-01-01" }],
    };
    const { dream } = getRecommendedPrices(item, baseSettings);
    expect(dream).toBe(1000);
  });

  it("accounts for platform fee in minimum price (Reverb 5%)", () => {
    const item: Item = { ...baseItem, listedPlatform: "reverb" };
    const { minimum } = getRecommendedPrices(item, baseSettings);
    // Need to net 230, fee 5% => list = 230 / 0.95 ≈ 242.11
    expect(minimum).toBeCloseTo(242.11, 1);
  });
});

// ─── getRealizedProfit ───────────────────────────────────────────────────────

describe("getRealizedProfit", () => {
  it("returns null for non-sold items", () => {
    expect(getRealizedProfit(baseItem, baseSettings)).toBeNull();
  });

  it("calculates profit for sold item (no fee)", () => {
    const sold: Item = {
      ...baseItem,
      status: "sold",
      soldPrice: 300,
      soldPlatform: "local",
    };
    // net = 300, cost = 180, profit = 120
    expect(getRealizedProfit(sold, baseSettings)).toBe(120);
  });

  it("deducts platform fee (Reverb 5%)", () => {
    const sold: Item = {
      ...baseItem,
      status: "sold",
      soldPrice: 300,
      soldPlatform: "reverb",
    };
    // net = 300 * 0.95 = 285, profit = 285 - 180 = 105
    expect(getRealizedProfit(sold, baseSettings)).toBe(105);
  });

  it("can return negative profit", () => {
    const sold: Item = {
      ...baseItem,
      status: "sold",
      soldPrice: 100,
      soldPlatform: "local",
    };
    // net = 100, cost = 180, profit = -80
    expect(getRealizedProfit(sold, baseSettings)).toBe(-80);
  });
});

// ─── getInventoryValue ───────────────────────────────────────────────────────

describe("getInventoryValue", () => {
  it("sums cost basis of non-sold items", () => {
    const items: Item[] = [
      { ...baseItem, id: "a", status: "acquired" },
      { ...baseItem, id: "b", status: "listed" },
      { ...baseItem, id: "c", status: "sold" },
    ];
    // a + b = 180 + 180 = 360; c is sold, excluded
    expect(getInventoryValue(items, baseSettings)).toBe(360);
  });

  it("excludes lost items", () => {
    const items: Item[] = [
      { ...baseItem, id: "a", status: "lost" },
    ];
    expect(getInventoryValue(items, baseSettings)).toBe(0);
  });
});

// ─── getMaxBuyPrice ──────────────────────────────────────────────────────────

describe("getMaxBuyPrice", () => {
  it("subtracts fee, refurb, labor, and floor from sale price", () => {
    // sale=300, fee=0%, refurb=40, labor=2*25=50, floor=50
    // max = 300 - 0 - 40 - 50 - 50 = 160
    expect(getMaxBuyPrice(baseEval, baseSettings)).toBe(160);
  });

  it("returns negative when deal is impossible", () => {
    const impossibleEval: Evaluation = {
      ...baseEval,
      estimatedSalePrice: 80,
      estimatedRefurbCost: 40,
      estimatedLaborHours: 2,
    };
    // max = 80 - 40 - 50 - 50 = -60
    expect(getMaxBuyPrice(impossibleEval, baseSettings)).toBe(-60);
  });

  it("accounts for platform fee (Reverb 5%)", () => {
    const reverbEval: Evaluation = { ...baseEval, intendedSellPlatform: "reverb" };
    // net = 300 * 0.95 = 285
    // max = 285 - 40 - 50 - 50 = 145
    expect(getMaxBuyPrice(reverbEval, baseSettings)).toBe(145);
  });

  it("handles zero refurb and labor", () => {
    const simpleEval: Evaluation = {
      ...baseEval,
      estimatedRefurbCost: 0,
      estimatedLaborHours: 0,
    };
    // max = 300 - 0 - 0 - 50 = 250
    expect(getMaxBuyPrice(simpleEval, baseSettings)).toBe(250);
  });

  it("handles 0% platform fee correctly", () => {
    const simpleEval: Evaluation = { ...baseEval, intendedSellPlatform: "local" };
    expect(getMaxBuyPrice(simpleEval, baseSettings)).toBe(160);
  });
});

// ─── getTargetBuyPrice ───────────────────────────────────────────────────────

describe("getTargetBuyPrice", () => {
  it("targets margin instead of floor", () => {
    // sale=300, margin=40%, targetProfit = 300*0.4=120
    // target = 300 - 40 - 50 - 120 = 90
    expect(getTargetBuyPrice(baseEval, baseSettings)).toBe(90);
  });

  it("target is less than or equal to max", () => {
    const max = getMaxBuyPrice(baseEval, baseSettings);
    const target = getTargetBuyPrice(baseEval, baseSettings);
    expect(target).toBeLessThanOrEqual(max);
  });
});

// ─── getBuyVerdict ───────────────────────────────────────────────────────────

describe("getBuyVerdict", () => {
  it("returns BUY when asking <= targetBuy", () => {
    const ev: Evaluation = { ...baseEval, askingPrice: 90 };
    expect(getBuyVerdict(ev, baseSettings).verdict).toBe("buy");
  });

  it("returns NEGOTIATE when targetBuy < asking <= maxBuy", () => {
    const ev: Evaluation = { ...baseEval, askingPrice: 130 };
    const result = getBuyVerdict(ev, baseSettings);
    expect(result.verdict).toBe("negotiate");
  });

  it("returns WALK when asking > maxBuy", () => {
    const ev: Evaluation = { ...baseEval, askingPrice: 200 };
    expect(getBuyVerdict(ev, baseSettings).verdict).toBe("walk");
  });

  it("returns WALK when max buy is negative", () => {
    const ev: Evaluation = {
      ...baseEval,
      estimatedSalePrice: 60,
      askingPrice: 10,
    };
    expect(getBuyVerdict(ev, baseSettings).verdict).toBe("walk");
  });

  it("exposes projected profit at asking", () => {
    const ev: Evaluation = { ...baseEval, askingPrice: 150 };
    const result = getBuyVerdict(ev, baseSettings);
    // net=300, refurb=40, labor=50, asking=150 => profit = 300-40-50-150 = 60
    expect(result.projectedProfitAtAsking).toBe(60);
  });

  it("boundary: asking == targetBuy => BUY", () => {
    const target = getTargetBuyPrice(baseEval, baseSettings);
    const ev: Evaluation = { ...baseEval, askingPrice: target };
    expect(getBuyVerdict(ev, baseSettings).verdict).toBe("buy");
  });

  it("boundary: asking == maxBuy => NEGOTIATE", () => {
    const max = getMaxBuyPrice(baseEval, baseSettings);
    const ev: Evaluation = { ...baseEval, askingPrice: max };
    expect(getBuyVerdict(ev, baseSettings).verdict).toBe("negotiate");
  });
});

