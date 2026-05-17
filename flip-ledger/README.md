# Flip Ledger

A React Native mobile app for tracking flipped and built items (guitars, furniture, electronics, hand-built goods) with full profit/loss accounting, buy-side deal evaluation, local-first storage, and JSON/CSV import/export.

## Quick Start

```bash
cd flip-ledger
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android), or press `i`/`a` for simulators.

## Features

### Inventory Tracking
- Track flips (buy → refurb → sell) and builds (materials → build → sell)
- Full cost line-item tracking (materials, labor, fees, shipping)
- Status flow: Sourcing → Acquired → In Progress → Listed → Sold
- Platform-aware profit calculation (Reverb 5%, eBay 13.25%, etc.)
- Recommended pricing: minimum, target, and dream price
- Photo attachments via camera or gallery

### Buy Calculator (Prospects)
- Evaluate any deal before committing money
- Live verdict panel: **BUY / NEGOTIATE / WALK** with color coding
- Calculates max buy price and target buy price working backwards from your estimated sale price
- Tracks the full offer/counter negotiation timeline
- Suggested counter-offer with rationale
- Convert accepted deals directly into tracked inventory items

### Dashboard & Insights
- Profit this month / this year
- Inventory cost basis
- Stale listing alerts
- Monthly goal progress bar
- Profit by category breakdown
- Buy discipline stats (conversion rate, walk-away patterns)

### Settings
- Configurable platform fees (add/edit/delete)
- Min profit floor, target margin %, hourly labor rate
- Monthly profit goal
- Stale listing reminder threshold

### Data Ownership
- 100% local-first — no accounts, no cloud, no telemetry
- Full JSON backup/restore
- CSV export for spreadsheet/tax use
- Sample data: `examples/sample-export.json`

## Data Schema

```
Item
├── id, kind (flip|build), title, category, tags, status
├── purchasePrice, acquiredAt, source
├── costs[] { label, amount, kind }
├── comps[] { description, price, url }
├── listedAt, listedPrice, listedPlatform
└── soldAt, soldPrice, soldPlatform

Evaluation (Buy Calculator)
├── id, title, source, listingUrl
├── askingPrice, estimatedSalePrice, estimatedRefurbCost, estimatedLaborHours
├── intendedSellPlatform
├── offers[] { by, amount, note }
└── outcome (pending|bought|walked|lost_to_other_buyer)

Settings
├── platformFees[] { name, percent, flatFee }
├── minProfitFloor, targetMarginPct, hourlyLaborRate
└── monthlyProfitGoal, remindAfterListedDays
```

## Buy Calculator Math

**Max buy price** = `netFromSale - refurbCost - laborCost - minProfitFloor`

**Target buy price** = `netFromSale - refurbCost - laborCost - (salePrice × targetMargin%)`

**Net from sale** = `salePrice × (1 - platformFee%) - flatFee`

Verdict:
- `asking ≤ targetBuy` → **BUY**
- `targetBuy < asking ≤ maxBuy` → **NEGOTIATE**
- `asking > maxBuy` → **WALK**

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Expo 54 (React Native) |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| Styling | NativeWind v4 (Tailwind) |
| Storage | react-native-mmkv |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Icons | lucide-react-native |

## Testing

```bash
npm test
```

29 unit tests covering the pricing engine — all core math is tested including:
- Sell-side: total cost, recommended prices, realized profit, inventory value
- Buy-side: max buy, target buy, verdict thresholds (boundary cases), counter-offer suggestions

## Project Structure

```
app/
  (tabs)/          # Dashboard, Inventory, Prospects, Insights, Settings
  item/            # Item detail, new item, edit item
  evaluate/        # Evaluation detail, new evaluation, edit evaluation
components/
  ui/              # Button, Card, Input, Pill, FAB, StatCard, EmptyState, Section
  items/           # ItemCard, ItemStatusPill
  evaluations/     # EvaluationCard
  pricing/         # VerdictBadge, VerdictPanel, PricingCard
lib/
  types.ts         # TypeScript interfaces
  schema.ts        # Zod validation schemas
  storage.ts       # MMKV wrapper
  store.ts         # Zustand store
  pricing.ts       # Pure pricing engine functions
  importExport.ts  # JSON/CSV I/O
  seed.ts          # Default settings
  format.ts        # Currency, date, percent formatters
hooks/             # useItems, useEvaluations, useSettings, usePricing
constants/
  colors.ts        # Dark forest green palette (from SoulframeTools)
  theme.ts         # Spacing, radius, font size constants
examples/
  sample-export.json  # Example backup file
STYLE_NOTES.md     # Design system reference
```

## Roadmap (v2)

- Cloud sync / multi-device
- Barcode / serial scanning
- Live marketplace price lookups (eBay/Reverb API)
- Multi-currency / FX conversion
- Receipt OCR for cost entry
- Tax report generation
- Shared inventories / team mode
- Barcode scan for quick item lookup
