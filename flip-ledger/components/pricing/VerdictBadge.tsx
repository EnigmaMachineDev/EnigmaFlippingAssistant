import React from "react";
import { View, Text } from "react-native";
import { CheckCircle, XCircle, Handshake } from "lucide-react-native";
import { VerdictColors } from "@/constants/colors";
import type { BuyVerdict } from "@/lib/types";

const VERDICT_LABELS: Record<BuyVerdict, string> = {
  buy: "BUY",
  negotiate: "NEGOTIATE",
  walk: "WALK",
};

const VERDICT_ICONS = {
  buy: CheckCircle,
  negotiate: Handshake,
  walk: XCircle,
};

interface VerdictBadgeProps {
  verdict: BuyVerdict;
  size?: "sm" | "default" | "lg";
}

export function VerdictBadge({ verdict, size = "default" }: VerdictBadgeProps) {
  const color = VerdictColors[verdict];
  const Icon = VERDICT_ICONS[verdict];
  const iconSize = size === "lg" ? 22 : size === "sm" ? 12 : 16;
  const textClass =
    size === "lg"
      ? "text-lg font-bold"
      : size === "sm"
        ? "text-xs font-bold"
        : "text-sm font-bold";
  const padding = size === "lg" ? "px-4 py-2" : size === "sm" ? "px-2 py-0.5" : "px-3 py-1.5";

  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full ${padding}`}
      style={{ backgroundColor: color + "22", borderWidth: 1, borderColor: color + "66" }}
    >
      <Icon size={iconSize} color={color} />
      <Text className={textClass} style={{ color }}>
        {VERDICT_LABELS[verdict]}
      </Text>
    </View>
  );
}
