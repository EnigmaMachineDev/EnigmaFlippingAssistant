import { useMemo } from "react";
import { useSettings } from "./useSettings";
import {
  getTotalCost,
  getRecommendedPrices,
  getRealizedProfit,
  getBuyVerdict,
  getInventoryValue,
  getDashboardStats,
} from "@/lib/pricing";
import type { Item, Evaluation, DateRange } from "@/lib/types";

export function useItemPricing(item: Item) {
  const settings = useSettings();
  return useMemo(() => ({
    totalCost: getTotalCost(item, settings.hourlyLaborRate),
    recommended: getRecommendedPrices(item, settings),
    profit: getRealizedProfit(item, settings),
  }), [item, settings]);
}

export function useEvaluationVerdict(evaluation: Evaluation) {
  const settings = useSettings();
  return useMemo(
    () => ({ verdict: getBuyVerdict(evaluation, settings) }),
    [evaluation, settings]
  );
}

export function useInventoryValue(items: Item[]) {
  const settings = useSettings();
  return useMemo(() => getInventoryValue(items, settings), [items, settings]);
}

export function useDashboardStats(items: Item[], range: DateRange) {
  const settings = useSettings();
  return useMemo(
    () => getDashboardStats(items, settings, range),
    [items, settings, range]
  );
}
