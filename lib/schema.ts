import { z } from "zod";

export const CostEntrySchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Label required"),
  amount: z.number().min(0, "Amount must be >= 0"),
  kind: z.enum(["materials", "labor", "fee", "shipping", "other"]),
  addedAt: z.string(),
});

export const CompEntrySchema = z.object({
  id: z.string(),
  url: z.string().url().optional().or(z.literal("")),
  description: z.string().min(1, "Description required"),
  price: z.number().min(0),
  addedAt: z.string(),
});

export const ItemSchema = z.object({
  id: z.string(),
  profileId: z.string().optional(),
  kind: z.enum(["flip", "build"]),
  title: z.string().min(1, "Title required"),
  category: z.string().optional(),
  tags: z.array(z.string()),
  status: z.enum(["sourcing", "acquired", "in_progress", "listed", "sold", "lost"]),
  photos: z.array(z.string()),

  purchasePrice: z.number().min(0).optional(),
  acquiredAt: z.string().optional(),
  source: z.string().optional(),

  costs: z.array(CostEntrySchema),

  listedAt: z.string().optional(),
  listedPrice: z.number().min(0).optional(),
  listedPlatform: z.string().optional(),

  soldAt: z.string().optional(),
  soldPrice: z.number().min(0).optional(),
  soldPlatform: z.string().optional(),
  buyerNotes: z.string().optional(),

  comps: z.array(CompEntrySchema),

  targetMarginPct: z.number().min(0).max(100).optional(),

  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const OfferEntrySchema = z.object({
  id: z.string(),
  by: z.enum(["seller", "me"]),
  amount: z.number().min(0),
  at: z.string(),
  note: z.string().optional(),
});

export const EvaluationSchema = z.object({
  id: z.string(),
  profileId: z.string().optional(),
  title: z.string().min(1, "Title required"),
  category: z.string().optional(),
  photos: z.array(z.string()),
  source: z.string().optional(),
  listingUrl: z.string().optional(),

  askingPrice: z.number().min(0),

  retailPrice: z.number().min(0).optional(),
  targetBuyPctOfRetail: z.number().min(0).max(100).optional(),

  estimatedSalePrice: z.number().min(0),
  estimatedRefurbCost: z.number().min(0),
  estimatedLaborHours: z.number().min(0),
  intendedSellPlatform: z.string(),

  comps: z.array(CompEntrySchema),
  offers: z.array(OfferEntrySchema),

  outcome: z.enum(["pending", "bought", "walked", "lost_to_other_buyer"]),
  outcomeNotes: z.string().optional(),
  linkedItemId: z.string().optional(),

  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PlatformFeeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  percent: z.number().min(0).max(100),
  flatFee: z.number().min(0).optional(),
});

export const SettingsSchema = z.object({
  currency: z.string(),
  minProfitFloor: z.number().min(0),
  targetMarginPct: z.number().min(0).max(100),
  hourlyLaborRate: z.number().min(0),
  platformFees: z.array(PlatformFeeSchema),
  defaultPlatform: z.string().optional(),
  monthlyProfitGoal: z.number().min(0).optional(),
  defaultBuyPctOfRetail: z.number().min(0).max(100),
  remindAfterListedDays: z.number().min(1),
  theme: z.literal("dark"),
  schemaVersion: z.number(),
});

export const ExportDataSchema = z.object({
  schemaVersion: z.number(),
  exportedAt: z.string(),
  items: z.array(ItemSchema),
  evaluations: z.array(EvaluationSchema),
  settings: SettingsSchema,
});

export type ItemFormValues = z.infer<typeof ItemSchema>;
export type EvaluationFormValues = z.infer<typeof EvaluationSchema>;
