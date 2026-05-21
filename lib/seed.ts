import type { Settings, ProfileKind } from "./types";

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

export interface ProfilePreset {
  key: string;
  label: string;
  description: string;
  emoji: string;
  kind: ProfileKind;
  settings: Settings;
}

export const PROFILE_PRESETS: ProfilePreset[] = [
  {
    key: "flip",
    label: "Flipping",
    description: "Unique items you buy and resell — guitars, furniture, collectibles",
    emoji: "🔄",
    kind: "flip",
    settings: {
      ...DEFAULT_SETTINGS,
      minProfitFloor: 50,
      targetMarginPct: 40,
      hourlyLaborRate: 25,
      defaultPlatform: "facebook",
    },
  },
  {
    key: "catalog",
    label: "Catalog Sales",
    description: "Products you sell repeatedly — prints, handmade goods, digital art",
    emoji: "📦",
    kind: "catalog",
    settings: {
      ...DEFAULT_SETTINGS,
      minProfitFloor: 10,
      targetMarginPct: 55,
      hourlyLaborRate: 15,
      defaultPlatform: "etsy",
      platformFees: [
        { id: "etsy", name: "Etsy", percent: 6.5, flatFee: 0.2 },
        { id: "shopify", name: "Shopify", percent: 2.9, flatFee: 0.3 },
        { id: "gumroad", name: "Gumroad", percent: 10, flatFee: 0 },
        { id: "local", name: "Local / Cash", percent: 0, flatFee: 0 },
        { id: "ebay", name: "eBay", percent: 13.25, flatFee: 0 },
      ],
    },
  },
  {
    key: "build",
    label: "Building",
    description: "Items you make or restore — woodworking, repairs, crafts",
    emoji: "🔨",
    kind: "flip",
    settings: {
      ...DEFAULT_SETTINGS,
      minProfitFloor: 30,
      targetMarginPct: 50,
      hourlyLaborRate: 35,
      defaultPlatform: "local",
    },
  },
];
