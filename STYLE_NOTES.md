# Style Guide — Flip Ledger

Extracted from sibling repos: SoulframeTools (web), EnigmaMachineTimeManagementSystem (NativeWind/RN), EnigmaAlarmAndTimerSystem (RN).

---

## Color Palette

### Base (dark forest green — always dark mode)
| Token | Hex | Usage |
|---|---|---|
| `bg` | `#0a0f0a` | App background, screen background |
| `panel` | `#0f1a0f` | Navigation bars, headers |
| `card` | `#142014` | Cards, surface elements |
| `hover` | `#1a2e1a` | Input backgrounds, secondary surface |
| `accent` | `#2d5a2d` | Accent surface, active backgrounds |
| `border` | `#1e3a1e` | All borders and dividers |

### Text
| Token | Hex | Usage |
|---|---|---|
| `text` | `#c8e6c8` | Primary text, headings |
| `muted` | `#7a9f7a` | Secondary text, labels, placeholders |
| `dim` | `#3a5a3a` | Disabled, very secondary text |

### Green scale
| Token | Hex | Usage |
|---|---|---|
| `green` | `#4a8c4a` | Primary buttons, active indicators |
| `bright` | `#6abf6a` | Highlighted values, titles, success |

### Semantic / Virtue colors
| Token | Hex | Usage |
|---|---|---|
| `courage` | `#e57373` | Destructive, negative values, errors, WALK verdict |
| `courage-light` | `#ffcdd2` | Background tint for destructive |
| `spirit` | `#81c784` | Success, sold status, BUY verdict |
| `spirit-light` | `#c8e6c9` | Background tint for success |
| `grace` | `#7986cb` | Info, listed status |
| `grace-light` | `#c5cae9` | Background tint for info |
| `amber` | `#f59e0b` | Warning, in-progress, NEGOTIATE verdict |
| `amber-light` | `#fef3c7` | Background tint for warning |

### Status pill color mapping
| Status | Color |
|---|---|
| sourcing | `#7a9f7a` (muted green) |
| acquired | `#7986cb` (grace/blue) |
| in_progress | `#f59e0b` (amber) |
| listed | `#a78bfa` (violet) |
| sold | `#81c784` (spirit/green) |
| lost | `#e57373` (courage/red) |

### Buy verdict color mapping
| Verdict | Color | Icon |
|---|---|---|
| BUY | `#81c784` (spirit green) | CheckCircle |
| NEGOTIATE | `#f59e0b` (amber) | Handshake |
| WALK | `#e57373` (courage red) | XCircle |

---

## Typography

- **Headings / titles**: `Cinzel` (serif) — used for screen titles, feature headings
- **Body / UI text**: `Inter` (sans-serif) — used for all body text, labels, inputs
- **Monospaced numbers**: `tabular-nums` variant class on all currency/number displays

### Scale (NativeWind)
| Class | Usage |
|---|---|
| `text-xs` | Labels, captions, timestamps |
| `text-sm` | Body text, secondary info |
| `text-base` | Card titles, list items |
| `text-lg` | Section headings |
| `text-xl` | Screen subtitles |
| `text-2xl` | Screen titles |
| `text-3xl` | Dashboard hero numbers |

### Font weights
- `font-normal` — body text
- `font-medium` — button labels, form labels
- `font-semibold` — card titles, section headers
- `font-bold` — screen titles, stat values

---

## Border Radius
- `rounded-sm` (0.3rem) — tiny elements
- `rounded-md` (0.4rem) — inputs, small buttons
- `rounded-lg` (0.5rem) — cards, standard containers
- `rounded-xl` — large cards, modal sheets
- `rounded-full` — pills, badges

---

## Spacing
- Consistent 4pt grid (multiples of 4)
- Card padding: `p-4`
- Section gap: `gap-3` or `gap-4`
- Screen horizontal padding: `px-4`
- Screen vertical padding: `py-4`
- Minimum touch target: 44pt (use `min-h-11 min-w-11`)

---

## Component Patterns

### Cards
```
bg-card border border-border rounded-lg overflow-hidden
```
- Use gradient overlays for featured cards: `bg-gradient-to-br from-[color]/40 to-card`
- Hover/active: `border-green` (lighten border on press)

### Buttons
| Variant | Classes |
|---|---|
| Primary | `bg-primary px-4 py-2 rounded-md` |
| Outline | `border border-border bg-transparent px-4 py-2 rounded-md` |
| Ghost | `bg-transparent px-4 py-2 rounded-md` |
| Destructive | `bg-destructive px-4 py-2 rounded-md` |
| Disabled | `opacity-50` |

### Inputs
```
bg-hover border border-border rounded-md px-3 py-2.5 text-sm text-foreground
placeholder: text-muted
focus: border-green
```

### Pills / Badges
```
rounded-full px-2.5 py-0.5 text-xs font-medium
```

### FAB (Floating Action Button)
```
absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg
```

### Section headers
```
text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1
```

### Navigation (tab bar)
- Background: `#0f1a0f` (panel)
- Active: `#4a8c4a` (green primary)
- Inactive: `#7a9f7a` (muted)
- Border top: `#1e3a1e` (border)

---

## Iconography
- Library: `lucide-react-native`
- Default size: `16` for inline, `20` for standalone, `24` for tab icons
- Default color: `#7a9f7a` (muted), `#c8e6c8` (active/primary)
- Always pair color-only status indicators with an icon for accessibility

---

## Shadows / Elevation
- Prefer subtle borders (`border-border`) over heavy shadows
- FABs and modals: light shadow via React Native `shadow*` props
- No heavy drop shadows

---

## Dark Mode
- App is **always dark mode** — no light mode toggle. `theme: "dark"` is the only option.
- Background is near-black dark forest green, not pure black

---

## Motion / Transitions
- Transition duration: 150–200ms
- Scale on press for cards: `scale-[1.02]` (web) / `Animated` in RN
- Smooth status updates, no jarring jumps

---

## Profit / Loss Display
- Positive profit: `text-[#6abf6a]` (bright green) + up arrow icon
- Negative profit: `text-[#e57373]` (courage red) + down arrow icon
- Zero: `text-[#7a9f7a]` (muted)
- Always use `tabular-nums` for currency alignment in lists
