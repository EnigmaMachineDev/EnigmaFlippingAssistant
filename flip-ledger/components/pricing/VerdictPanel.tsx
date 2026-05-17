import React from "react";
import { View, Text } from "react-native";
import { VerdictBadge } from "./VerdictBadge";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Colors } from "@/constants/colors";
import type { BuyVerdictResult } from "@/lib/types";

interface VerdictPanelProps {
  verdict: BuyVerdictResult;
  askingPrice?: number;
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View className="flex-row items-center justify-between py-1.5 border-b border-border">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm font-semibold tabular-nums" style={{ color: valueColor ?? Colors.text }}>
        {value}
      </Text>
    </View>
  );
}

export function VerdictPanel({ verdict }: VerdictPanelProps) {
  const profitColor =
    verdict.projectedProfitAtAsking > 0
      ? Colors.bright
      : verdict.projectedProfitAtAsking < 0
        ? Colors.courage
        : Colors.muted;

  return (
    <Card>
      <CardContent className="pt-4 gap-3">
        <View className="items-center py-2">
          <VerdictBadge verdict={verdict.verdict} size="lg" />
        </View>
        <Row label="Max buy price" value={verdict.maxBuy >= 0 ? formatCurrency(verdict.maxBuy) : "No viable deal"} />
        <Row label="Target buy price" value={verdict.targetBuy >= 0 ? formatCurrency(verdict.targetBuy) : "—"} />
        <Row
          label="Profit at asking"
          value={formatCurrency(verdict.projectedProfitAtAsking)}
          valueColor={profitColor}
        />
        <Row
          label="Margin at asking"
          value={formatPercent(verdict.projectedMarginAtAsking)}
          valueColor={profitColor}
        />
        <View className="py-2">
          <Text className="text-xs text-muted-foreground italic leading-relaxed">
            {verdict.reasoning}
          </Text>
        </View>
      </CardContent>
    </Card>
  );
}
