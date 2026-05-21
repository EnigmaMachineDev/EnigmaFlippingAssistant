import type {
  Item,
  Evaluation,
  Settings,
  PlatformFee,
  DateRange,
  RecommendedPrices,
  BuyVerdictResult,
  CounterOfferSuggestion,
  DashboardStats,
  ProspectStats,
} from "./types";
import { differenceInDays } from "date-fns";

// ─── Helpers ────────────────────────────────────────────────────────────────

export function findPlatformFee(
  settings: Settings,
  platformId?: string
): PlatformFee {
  const found = (settings.platformFees ?? []).find(
    (p) => p.id === platformId || p.name === platformId
  );
  return found ?? { id: "", name: "", percent: 0, flatFee: 0 };
}

/** Net seller receives after platform fee on a given sale price. */
function netAfterFee(salePrice: number, fee: PlatformFee): number {
  const flat = fee.flatFee ?? 0;
  return salePrice * (1 - fee.percent / 100) - flat;
}

/** List price needed to net a specific amount after fees. */
function listPriceForNet(targetNet: number, fee: PlatformFee): number {
  const flat = fee.flatFee ?? 0;
  const rate = fee.percent / 100;
  if (rate >= 1) return targetNet + flat;
  return (targetNet + flat) / (1 - rate);
}

// ─── Sell-side ───────────────────────────────────────────────────────────────

export function getTotalCost(item: Item, hourlyRate: number): number {
  const purchase = item.purchasePrice ?? 0;
  const costSum = item.costs.reduce((sum, c) => sum + c.amount, 0);
  return purchase + costSum;
}

export function getRecommendedPrices(
  item: Item,
  settings: Settings
): RecommendedPrices {
  const platform = findPlatformFee(settings, item.listedPlatform ?? settings.defaultPlatform);
  const totalCost = getTotalCost(item, settings.hourlyLaborRate);
  const marginPct = item.targetMarginPct ?? settings.targetMarginPct;

  const minimum = listPriceForNet(
    totalCost + settings.minProfitFloor,
    platform
  );

  const targetNet = totalCost / (1 - marginPct / 100);
  const recommended = listPriceForNet(targetNet, platform);

  let dream = recommended * 1.15;
  if (item.comps.length > 0) {
    const maxComp = Math.max(...item.comps.map((c) => c.price));
    dream = Math.max(maxComp, dream);
  }

  return {
    minimum: Math.round(minimum * 100) / 100,
    recommended: Math.round(recommended * 100) / 100,
    dream: Math.round(dream * 100) / 100,
  };
}

export function getRealizedProfit(item: Item, settings: Settings): number | null {
  if (item.status !== "sold" || item.soldPrice == null) return null;
  const platform = findPlatformFee(settings, item.soldPlatform ?? settings.defaultPlatform);
  const net = netAfterFee(item.soldPrice, platform);
  const cost = getTotalCost(item, settings.hourlyLaborRate);
  return Math.round((net - cost) * 100) / 100;
}

export function getInventoryValue(items: Item[], settings: Settings): number {
  return items
    .filter((i) => i.status !== "sold" && i.status !== "lost")
    .reduce((sum, i) => sum + getTotalCost(i, settings.hourlyLaborRate), 0);
}

export function getDashboardStats(
  items: Item[],
  settings: Settings,
  range: DateRange
): DashboardStats {
  const rangeStart = new Date(range.start);
  const rangeEnd = new Date(range.end);

  const soldInRange = items.filter((i) => {
    if (i.status !== "sold" || !i.soldAt) return false;
    const d = new Date(i.soldAt);
    return d >= rangeStart && d <= rangeEnd;
  });

  const profits = soldInRange.map((i) => getRealizedProfit(i, settings) ?? 0);
  const totalProfit = profits.reduce((s, p) => s + p, 0);
  const totalSold = soldInRange.length;

  const margins = soldInRange
    .map((i) => {
      const p = getRealizedProfit(i, settings);
      if (p == null || !i.soldPrice || i.soldPrice === 0) return null;
      const platform = findPlatformFee(settings, i.soldPlatform ?? settings.defaultPlatform);
      const net = netAfterFee(i.soldPrice, platform);
      return net > 0 ? (p / net) * 100 : 0;
    })
    .filter((m): m is number => m !== null);

  const avgMarginPct =
    margins.length > 0
      ? margins.reduce((s, m) => s + m, 0) / margins.length
      : 0;

  const daysToSell = soldInRange
    .filter((i) => i.acquiredAt && i.soldAt)
    .map((i) =>
      Math.abs(differenceInDays(new Date(i.soldAt!), new Date(i.acquiredAt!)))
    );

  const avgDaysToSell =
    daysToSell.length > 0
      ? daysToSell.reduce((s, d) => s + d, 0) / daysToSell.length
      : 0;

  const profitByItem = soldInRange.map((i) => ({
    item: i,
    profit: getRealizedProfit(i, settings) ?? 0,
  }));

  profitByItem.sort((a, b) => b.profit - a.profit);

  return {
    totalSold,
    totalProfit: Math.round(totalProfit * 100) / 100,
    avgMarginPct: Math.round(avgMarginPct * 10) / 10,
    avgDaysToSell: Math.round(avgDaysToSell),
    bestItem: profitByItem[0]?.item ?? null,
    worstItem: profitByItem[profitByItem.length - 1]?.item ?? null,
  };
}

// ─── Buy-side ────────────────────────────────────────────────────────────────

function effectiveSalePrice(evaluation: Evaluation): number {
  if (evaluation.estimatedSalePrice > 0) return evaluation.estimatedSalePrice;
  return evaluation.retailPrice ?? 0;
}

export function getMaxBuyPrice(
  evaluation: Evaluation,
  settings: Settings
): number {
  const platform = findPlatformFee(settings, evaluation.intendedSellPlatform);
  const netFromSale = netAfterFee(effectiveSalePrice(evaluation), platform);
  const laborCost = evaluation.estimatedLaborHours * settings.hourlyLaborRate;
  const max =
    netFromSale -
    evaluation.estimatedRefurbCost -
    laborCost -
    settings.minProfitFloor;
  return Math.round(max * 100) / 100;
}

export function getTargetBuyPrice(
  evaluation: Evaluation,
  settings: Settings
): number {
  if (evaluation.retailPrice && evaluation.retailPrice > 0) {
    const pct = evaluation.targetBuyPctOfRetail ?? settings.defaultBuyPctOfRetail;
    return Math.round(evaluation.retailPrice * (pct / 100) * 100) / 100;
  }
  const platform = findPlatformFee(settings, evaluation.intendedSellPlatform);
  const netFromSale = netAfterFee(evaluation.estimatedSalePrice, platform);
  const laborCost = evaluation.estimatedLaborHours * settings.hourlyLaborRate;
  const targetProfit = (evaluation.estimatedSalePrice * settings.targetMarginPct) / 100;
  return Math.round((netFromSale - evaluation.estimatedRefurbCost - laborCost - targetProfit) * 100) / 100;
}

export function getBuyVerdict(
  evaluation: Evaluation,
  settings: Settings
): BuyVerdictResult {
  const maxBuy = getMaxBuyPrice(evaluation, settings);
  const targetBuy = getTargetBuyPrice(evaluation, settings);
  const platform = findPlatformFee(settings, evaluation.intendedSellPlatform);
  const salePriceForProjection = effectiveSalePrice(evaluation);
  const netFromSale = netAfterFee(salePriceForProjection, platform);
  const laborCost = evaluation.estimatedLaborHours * settings.hourlyLaborRate;
  const projectedProfitAtAsking =
    Math.round(
      (netFromSale -
        evaluation.estimatedRefurbCost -
        laborCost -
        evaluation.askingPrice) *
        100
    ) / 100;

  const projectedMarginAtAsking =
    netFromSale > 0
      ? Math.round((projectedProfitAtAsking / netFromSale) * 1000) / 10
      : 0;

  const retailMode = evaluation.retailPrice != null && evaluation.retailPrice > 0;
  const buyPct = evaluation.targetBuyPctOfRetail ?? settings.defaultBuyPctOfRetail;

  let verdict: BuyVerdictResult["verdict"];
  let reasoning: string;

  if (maxBuy < 0) {
    verdict = "walk";
    reasoning = `Deal is dead at any price — even at $0 you'd only net $${(netFromSale - evaluation.estimatedRefurbCost - laborCost).toFixed(0)}, which is below your $${settings.minProfitFloor} floor.`;
  } else if (evaluation.askingPrice <= targetBuy) {
    verdict = "buy";
    if (retailMode) {
      reasoning = `Retail $${evaluation.retailPrice} × ${buyPct}% = target $${targetBuy.toFixed(0)}. Asking $${evaluation.askingPrice} is at or below target. Expected profit: $${projectedProfitAtAsking.toFixed(0)}.`;
    } else {
      reasoning = `Asking price of $${evaluation.askingPrice} is at or below your target buy of $${targetBuy.toFixed(0)}. Expected profit: $${projectedProfitAtAsking.toFixed(0)}.`;
    }
  } else if (evaluation.askingPrice <= maxBuy) {
    verdict = "negotiate";
    if (retailMode) {
      reasoning = `Retail $${evaluation.retailPrice} × ${buyPct}% = target $${targetBuy.toFixed(0)}. Asking $${evaluation.askingPrice} is above target — try to get to $${targetBuy.toFixed(0)}.`;
    } else {
      reasoning = `At $${evaluation.askingPrice} you'd net $${projectedProfitAtAsking.toFixed(0)} — above floor but below target. Try to get to $${targetBuy.toFixed(0)}.`;
    }
  } else {
    verdict = "walk";
    if (retailMode) {
      reasoning = `Retail $${evaluation.retailPrice} × ${buyPct}% = target $${targetBuy.toFixed(0)}. Asking $${evaluation.askingPrice} is above your max of $${maxBuy.toFixed(0)}.`;
    } else {
      reasoning = `Asking $${evaluation.askingPrice} is above your max of $${maxBuy.toFixed(0)}. You'd lose $${Math.abs(projectedProfitAtAsking).toFixed(0)} after all costs.`;
    }
  }

  return {
    verdict,
    maxBuy,
    targetBuy,
    projectedProfitAtAsking,
    projectedMarginAtAsking,
    reasoning,
  };
}

export function getProspectStats(
  evaluations: Evaluation[],
  range: DateRange
): ProspectStats {
  const rangeStart = new Date(range.start);
  const rangeEnd = new Date(range.end);

  const inRange = evaluations.filter((e) => {
    const d = new Date(e.createdAt);
    return d >= rangeStart && d <= rangeEnd;
  });

  const bought = inRange.filter((e) => e.outcome === "bought").length;
  const walked = inRange.filter((e) => e.outcome === "walked").length;
  const lostToOtherBuyer = inRange.filter(
    (e) => e.outcome === "lost_to_other_buyer"
  ).length;

  const conversionRate =
    inRange.length > 0 ? Math.round((bought / inRange.length) * 1000) / 10 : 0;

  return {
    totalEvaluated: inRange.length,
    bought,
    walked,
    lostToOtherBuyer,
    avgAskingOverMax: 0,
    conversionRate,
  };
}
