import type { Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  currency: "USD",
  minProfitFloor: 50,
  targetMarginPct: 40,
  hourlyLaborRate: 25,
  platformFees: [
    { id: "reverb", name: "Reverb", percent: 5, flatFee: 0 },
    { id: "ebay", name: "eBay", percent: 13.25, flatFee: 0 },
    { id: "facebook", name: "Facebook Marketplace", percent: 0, flatFee: 0 },
    { id: "local", name: "Local / Cash", percent: 0, flatFee: 0 },
    { id: "etsy", name: "Etsy", percent: 6.5, flatFee: 0.2 },
    { id: "craigslist", name: "Craigslist", percent: 0, flatFee: 0 },
  ],
  defaultPlatform: "facebook",
  defaultBuyPctOfRetail: 40,
  remindAfterListedDays: 30,
  theme: "dark",
  schemaVersion: 1,
};
