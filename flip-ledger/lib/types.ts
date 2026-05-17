export type ItemStatus = "sourcing" | "acquired" | "in_progress" | "listed" | "sold" | "lost";
export type ItemKind = "flip" | "build";
export type EvaluationOutcome = "pending" | "bought" | "walked" | "lost_to_other_buyer";
export type BuyVerdict = "buy" | "negotiate" | "walk";
export type CostKind = "materials" | "labor" | "fee" | "shipping" | "other";

export interface CostEntry {
  id: string;
  label: string;
  amount: number;
  kind: CostKind;
  addedAt: string;
}

export interface CompEntry {
  id: string;
  url?: string;
  description: string;
  price: number;
  addedAt: string;
}

export interface Item {
  id: string;
  kind: ItemKind;
  title: string;
  category?: string;
  tags: string[];
  status: ItemStatus;
  photos: string[];

  purchasePrice?: number;
  acquiredAt?: string;
  source?: string;

  costs: CostEntry[];

  listedAt?: string;
  listedPrice?: number;
  listedPlatform?: string;

  soldAt?: string;
  soldPrice?: number;
  soldPlatform?: string;
  buyerNotes?: string;

  comps: CompEntry[];

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferEntry {
  id: string;
  by: "seller" | "me";
  amount: number;
  at: string;
  note?: string;
}

export interface Evaluation {
  id: string;
  title: string;
  category?: string;
  photos: string[];
  source?: string;
  listingUrl?: string;

  askingPrice: number;

  estimatedSalePrice: number;
  estimatedRefurbCost: number;
  estimatedLaborHours: number;
  intendedSellPlatform: string;

  comps: CompEntry[];
  offers: OfferEntry[];

  outcome: EvaluationOutcome;
  outcomeNotes?: string;
  linkedItemId?: string;

  createdAt: string;
  updatedAt: string;
}

export interface PlatformFee {
  id: string;
  name: string;
  percent: number;
  flatFee?: number;
}

export interface Settings {
  currency: string;
  minProfitFloor: number;
  targetMarginPct: number;
  hourlyLaborRate: number;
  platformFees: PlatformFee[];
  defaultPlatform?: string;
  monthlyProfitGoal?: number;
  remindAfterListedDays: number;
  theme: "dark";
  schemaVersion: number;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface RecommendedPrices {
  minimum: number;
  recommended: number;
  dream: number;
}

export interface BuyVerdictResult {
  verdict: BuyVerdict;
  maxBuy: number;
  targetBuy: number;
  projectedProfitAtAsking: number;
  projectedMarginAtAsking: number;
  reasoning: string;
}

export interface CounterOfferSuggestion {
  amount: number;
  rationale: string;
}

export interface DashboardStats {
  totalSold: number;
  totalProfit: number;
  avgMarginPct: number;
  avgDaysToSell: number;
  bestItem: Item | null;
  worstItem: Item | null;
}

export interface ProspectStats {
  totalEvaluated: number;
  bought: number;
  walked: number;
  lostToOtherBuyer: number;
  avgAskingOverMax: number;
  conversionRate: number;
}

export interface ExportData {
  schemaVersion: number;
  exportedAt: string;
  items: Item[];
  evaluations: Evaluation[];
  settings: Settings;
}
