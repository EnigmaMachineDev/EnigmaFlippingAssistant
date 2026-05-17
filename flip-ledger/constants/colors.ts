export const Colors = {
  bg: "#0a0f0a",
  panel: "#0f1a0f",
  card: "#142014",
  hover: "#1a2e1a",
  accent: "#2d5a2d",
  border: "#1e3a1e",

  text: "#c8e6c8",
  muted: "#7a9f7a",
  dim: "#3a5a3a",

  green: "#4a8c4a",
  bright: "#6abf6a",

  courage: "#e57373",
  courageLgt: "#ffcdd2",
  spirit: "#81c784",
  spiritLgt: "#c8e6c9",
  grace: "#7986cb",
  graceLgt: "#c5cae9",
  warning: "#f59e0b",
  warningLgt: "#fef3c7",

  tabActive: "#4a8c4a",
  tabInactive: "#7a9f7a",
} as const;

export const StatusColors: Record<string, string> = {
  sourcing: "#7a9f7a",
  acquired: "#7986cb",
  in_progress: "#f59e0b",
  listed: "#a78bfa",
  sold: "#81c784",
  lost: "#e57373",
};

export const VerdictColors = {
  buy: "#81c784",
  negotiate: "#f59e0b",
  walk: "#e57373",
} as const;
