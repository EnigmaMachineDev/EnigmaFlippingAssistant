import {
  getDashboardStats,
  getProspectStats,
  findPlatformFee,
} from "../lib/pricing";
import type { Item, Evaluation, Settings, DateRange } from "../lib/types";

// ─── Shared fixtures ──────────────────────────────────────────────────────────

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
  id: "base",
  profileId: "test",
  kind: "flip",
  title: "Base Item",
  tags: [],
  status: "acquired",
  photos: [],
  purchasePrice: 100,
  costs: [],
  comps: [],
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

// cost basis = 150 (purchase 100 + repair 50), sold for 300 cash → profit 150
const soldItem: Item = {
  ...baseItem,
  id: "sold-1",
  status: "sold",
  purchasePrice: 100,
  costs: [{ id: "c1", label: "Repair", amount: 50, kind: "materials", addedAt: "2025-01-01T00:00:00.000Z" }],
  soldPrice: 300,
  soldPlatform: "local",
  acquiredAt: "2025-01-01T00:00:00.000Z",
  soldAt: "2025-02-01T00:00:00.000Z",   // 31 days later
};

// cost basis = 200 (purchase only), sold for 100 cash → profit -100
const lossItem: Item = {
  ...baseItem,
  id: "loss-1",
  status: "sold",
  purchasePrice: 200,
  costs: [],
  soldPrice: 100,
  soldPlatform: "local",
  acquiredAt: "2025-01-01T00:00:00.000Z",
  soldAt: "2025-02-01T00:00:00.000Z",
};

const range2025: DateRange = { start: "2025-01-01", end: "2025-12-31" };
const range2024: DateRange = { start: "2024-01-01", end: "2024-12-31" };

// ─── findPlatformFee ──────────────────────────────────────────────────────────

describe("findPlatformFee", () => {
  it("finds a fee by id", () => {
    const fee = findPlatformFee(baseSettings, "reverb");
    expect(fee.percent).toBe(5);
  });

  it("finds a fee by name", () => {
    const fee = findPlatformFee(baseSettings, "eBay");
    expect(fee.percent).toBe(13.25);
  });

  it("returns a zero fee for an unknown platform", () => {
    const fee = findPlatformFee(baseSettings, "nonexistent");
    expect(fee.percent).toBe(0);
    expect(fee.flatFee).toBe(0);
  });

  it("returns a zero fee when platformId is undefined", () => {
    const fee = findPlatformFee(baseSettings, undefined);
    expect(fee.percent).toBe(0);
  });

  it("returns a zero fee when platformFees is empty", () => {
    const fee = findPlatformFee({ ...baseSettings, platformFees: [] }, "reverb");
    expect(fee.percent).toBe(0);
  });

  it("returns zero flatFee when the matched platform has none defined", () => {
    const fee = findPlatformFee(baseSettings, "reverb");
    expect(fee.flatFee ?? 0).toBe(0);
  });
});

// ─── getDashboardStats ────────────────────────────────────────────────────────

describe("getDashboardStats", () => {
  it("returns all-zero stats for an empty item list", () => {
    const stats = getDashboardStats([], baseSettings, range2025);
    expect(stats.totalSold).toBe(0);
    expect(stats.totalProfit).toBe(0);
    expect(stats.avgMarginPct).toBe(0);
    expect(stats.avgDaysToSell).toBe(0);
    expect(stats.bestItem).toBeNull();
    expect(stats.worstItem).toBeNull();
  });

  it("only counts items whose soldAt falls within the range", () => {
    // soldItem.soldAt is 2025-02-01, which is outside range2024
    const stats = getDashboardStats([soldItem], baseSettings, range2024);
    expect(stats.totalSold).toBe(0);
  });

  it("counts items sold within the range", () => {
    const stats = getDashboardStats([soldItem], baseSettings, range2025);
    expect(stats.totalSold).toBe(1);
  });

  it("excludes items that are not sold", () => {
    const unsold: Item = { ...baseItem, id: "u1", status: "listed" };
    const stats = getDashboardStats([unsold], baseSettings, range2025);
    expect(stats.totalSold).toBe(0);
  });

  it("excludes sold items that have no soldAt date", () => {
    const noDate: Item = { ...soldItem, id: "nd", soldAt: undefined };
    const stats = getDashboardStats([noDate], baseSettings, range2025);
    expect(stats.totalSold).toBe(0);
  });

  it("calculates totalProfit for a local-fee sale", () => {
    const stats = getDashboardStats([soldItem], baseSettings, range2025);
    // cost=150, sold=300, 0% fee → profit=150
    expect(stats.totalProfit).toBe(150);
  });

  it("sums profit across multiple sold items", () => {
    const soldItem2: Item = {
      ...soldItem,
      id: "sold-2",
      purchasePrice: 50,
      costs: [],
      soldPrice: 200,
    };
    const stats = getDashboardStats([soldItem, soldItem2], baseSettings, range2025);
    // soldItem profit=150, soldItem2 profit=150
    expect(stats.totalProfit).toBe(300);
    expect(stats.totalSold).toBe(2);
  });

  it("deducts platform fees from profit", () => {
    const reverbSold: Item = {
      ...soldItem,
      id: "reverb-sold",
      soldPlatform: "reverb",
      purchasePrice: 100,
      costs: [],
      soldPrice: 200,
    };
    const stats = getDashboardStats([reverbSold], baseSettings, range2025);
    // net = 200 * 0.95 = 190, cost=100 → profit=90
    expect(stats.totalProfit).toBe(90);
  });

  it("calculates avgDaysToSell from acquiredAt to soldAt", () => {
    const stats = getDashboardStats([soldItem], baseSettings, range2025);
    // 2025-01-01 → 2025-02-01 = 31 days
    expect(stats.avgDaysToSell).toBe(31);
  });

  it("omits items with no acquiredAt from the days-to-sell average", () => {
    const noAcquired: Item = { ...soldItem, id: "na", acquiredAt: undefined };
    const stats = getDashboardStats([noAcquired], baseSettings, range2025);
    expect(stats.avgDaysToSell).toBe(0); // average of empty set
  });

  it("identifies bestItem as the highest-profit item", () => {
    const stats = getDashboardStats([lossItem, soldItem], baseSettings, range2025);
    expect(stats.bestItem?.id).toBe("sold-1"); // profit 150 > -100
  });

  it("identifies worstItem as the lowest-profit item", () => {
    const stats = getDashboardStats([soldItem, lossItem], baseSettings, range2025);
    expect(stats.worstItem?.id).toBe("loss-1"); // profit -100
  });

  it("bestItem and worstItem point to the same item when only one sold", () => {
    const stats = getDashboardStats([soldItem], baseSettings, range2025);
    expect(stats.bestItem?.id).toBe(stats.worstItem?.id);
  });

  it("totalProfit can be negative when all items were sold at a loss", () => {
    const stats = getDashboardStats([lossItem], baseSettings, range2025);
    expect(stats.totalProfit).toBe(-100);
  });
});

// ─── getProspectStats ────────────────────────────────────────────────────────

const baseEval: Evaluation = {
  id: "eval-base",
  profileId: "test",
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
  createdAt: "2025-03-01T00:00:00.000Z",
  updatedAt: "2025-03-01T00:00:00.000Z",
};

describe("getProspectStats", () => {
  it("returns all zeros for an empty evaluation list", () => {
    const stats = getProspectStats([], range2025);
    expect(stats.totalEvaluated).toBe(0);
    expect(stats.bought).toBe(0);
    expect(stats.walked).toBe(0);
    expect(stats.lostToOtherBuyer).toBe(0);
    expect(stats.conversionRate).toBe(0);
  });

  it("only counts evaluations whose createdAt falls within the range", () => {
    // baseEval.createdAt is 2025-03-01, outside range2024
    const stats = getProspectStats([baseEval], range2024);
    expect(stats.totalEvaluated).toBe(0);
  });

  it("counts evaluations within the range", () => {
    const stats = getProspectStats([baseEval], range2025);
    expect(stats.totalEvaluated).toBe(1);
  });

  it("counts 'bought' outcomes", () => {
    const ev: Evaluation = { ...baseEval, id: "e-bought", outcome: "bought" };
    const stats = getProspectStats([ev], range2025);
    expect(stats.bought).toBe(1);
    expect(stats.walked).toBe(0);
    expect(stats.lostToOtherBuyer).toBe(0);
  });

  it("counts 'walked' outcomes", () => {
    const ev: Evaluation = { ...baseEval, id: "e-walked", outcome: "walked" };
    const stats = getProspectStats([ev], range2025);
    expect(stats.walked).toBe(1);
  });

  it("counts 'lost_to_other_buyer' outcomes", () => {
    const ev: Evaluation = { ...baseEval, id: "e-lost", outcome: "lost_to_other_buyer" };
    const stats = getProspectStats([ev], range2025);
    expect(stats.lostToOtherBuyer).toBe(1);
  });

  it("counts all four outcome types correctly in a mixed set", () => {
    const evals: Evaluation[] = [
      { ...baseEval, id: "e1", outcome: "bought" },
      { ...baseEval, id: "e2", outcome: "walked" },
      { ...baseEval, id: "e3", outcome: "lost_to_other_buyer" },
      { ...baseEval, id: "e4", outcome: "pending" },
    ];
    const stats = getProspectStats(evals, range2025);
    expect(stats.totalEvaluated).toBe(4);
    expect(stats.bought).toBe(1);
    expect(stats.walked).toBe(1);
    expect(stats.lostToOtherBuyer).toBe(1);
  });

  it("calculates conversionRate as bought / total × 100", () => {
    const evals: Evaluation[] = [
      { ...baseEval, id: "e1", outcome: "bought" },
      { ...baseEval, id: "e2", outcome: "bought" },
      { ...baseEval, id: "e3", outcome: "walked" },
      { ...baseEval, id: "e4", outcome: "pending" },
    ];
    const stats = getProspectStats(evals, range2025);
    // 2 bought / 4 total = 50%
    expect(stats.conversionRate).toBe(50);
  });

  it("conversionRate is 0 when nothing was bought", () => {
    const evals: Evaluation[] = [
      { ...baseEval, id: "e1", outcome: "walked" },
      { ...baseEval, id: "e2", outcome: "pending" },
    ];
    const stats = getProspectStats(evals, range2025);
    expect(stats.conversionRate).toBe(0);
  });

  it("conversionRate is 100 when everything was bought", () => {
    const evals: Evaluation[] = [
      { ...baseEval, id: "e1", outcome: "bought" },
      { ...baseEval, id: "e2", outcome: "bought" },
    ];
    const stats = getProspectStats(evals, range2025);
    expect(stats.conversionRate).toBe(100);
  });

  it("conversionRate rounds to one decimal place", () => {
    const evals: Evaluation[] = [
      { ...baseEval, id: "e1", outcome: "bought" },
      { ...baseEval, id: "e2", outcome: "walked" },
      { ...baseEval, id: "e3", outcome: "walked" },
    ];
    const stats = getProspectStats(evals, range2025);
    // 1 / 3 ≈ 33.3%
    expect(stats.conversionRate).toBeCloseTo(33.3, 1);
  });
});
