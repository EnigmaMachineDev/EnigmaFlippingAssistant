import React from "react";
import { View, Text } from "react-native";
import { TrendingUp, TrendingDown, Minus } from "lucide-react-native";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Colors } from "@/constants/colors";
import type { RecommendedPrices } from "@/lib/types";

interface PricingCardProps {
  totalCost: number;
  recommended: RecommendedPrices;
  listedPrice?: number;
  soldPrice?: number;
  profit: number | null;
}

export function PricingCard({ totalCost, recommended, listedPrice, soldPrice, profit }: PricingCardProps) {
  const profitColor =
    profit == null
      ? Colors.muted
      : profit > 0
        ? Colors.bright
        : Colors.courage;

  const ProfitIcon = profit == null ? Minus : profit > 0 ? TrendingUp : TrendingDown;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pricing</CardTitle>
      </CardHeader>
      <CardContent className="gap-2">
        <Row label="Total cost basis" value={formatCurrency(totalCost)} />
        <View className="h-px bg-border my-1" />
        <Row label="Minimum price" value={formatCurrency(recommended.minimum)} />
        <Row label="Recommended" value={formatCurrency(recommended.recommended)} highlight />
        <Row label="Dream price" value={formatCurrency(recommended.dream)} />
        {listedPrice ? (
          <>
            <View className="h-px bg-border my-1" />
            <Row label="Listed at" value={formatCurrency(listedPrice)} />
          </>
        ) : null}
        {soldPrice != null && profit != null ? (
          <>
            <View className="h-px bg-border my-1" />
            <Row label="Sold at" value={formatCurrency(soldPrice)} />
            <View className="flex-row items-center justify-between py-1">
              <Text className="text-sm text-muted-foreground">Realized profit</Text>
              <View className="flex-row items-center gap-1">
                <ProfitIcon size={14} color={profitColor} />
                <Text className="text-sm font-bold tabular-nums" style={{ color: profitColor }}>
                  {formatCurrency(profit)}
                </Text>
              </View>
            </View>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className={`text-sm ${highlight ? "text-foreground font-medium" : "text-muted-foreground"}`}>
        {label}
      </Text>
      <Text
        className={`text-sm tabular-nums ${highlight ? "font-bold text-bright" : "font-medium text-foreground"}`}
      >
        {value}
      </Text>
    </View>
  );
}
