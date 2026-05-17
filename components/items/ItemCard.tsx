import React from "react";
import { Pressable, View, Text } from "react-native";
import { useRouter } from "expo-router";
import { TrendingUp, TrendingDown, Minus, Tag } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { ItemStatusPill } from "./ItemStatusPill";
import { formatCurrency, formatDate, daysAgo } from "@/lib/format";
import { getTotalCost, getRealizedProfit } from "@/lib/pricing";
import { useSettings } from "@/hooks/useSettings";
import { Colors } from "@/constants/colors";
import type { Item } from "@/lib/types";

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const router = useRouter();
  const settings = useSettings();
  const totalCost = getTotalCost(item, settings.hourlyLaborRate);
  const profit = getRealizedProfit(item, settings);
  const daysHeld = item.acquiredAt ? daysAgo(item.acquiredAt) : null;

  const ProfitIcon =
    profit == null ? Minus : profit > 0 ? TrendingUp : TrendingDown;
  const profitColor =
    profit == null
      ? Colors.muted
      : profit > 0
        ? Colors.bright
        : Colors.courage;

  return (
    <Pressable onPress={() => router.push(`/item/${item.id}` as any)}>
      <Card className="mx-4">
        <View className="p-4 flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
              {item.title}
            </Text>
            <View className="flex-row items-center gap-2 flex-wrap">
              <ItemStatusPill status={item.status} size="sm" />
              {item.kind === "build" ? (
                <View className="rounded-full px-2 py-0.5 bg-muted">
                  <Text className="text-xs text-muted-foreground">Build</Text>
                </View>
              ) : null}
              {item.category ? (
                <View className="flex-row items-center gap-1">
                  <Tag size={10} color={Colors.muted} />
                  <Text className="text-xs text-muted-foreground">{item.category}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View className="items-end gap-1">
            <Text className="text-sm font-semibold text-foreground tabular-nums">
              {formatCurrency(totalCost)}
            </Text>
            <Text className="text-xs text-muted-foreground">cost basis</Text>
          </View>
        </View>
        {(profit != null || daysHeld != null) ? (
          <View className="flex-row items-center justify-between px-4 pb-3 gap-2">
            {profit != null ? (
              <View className="flex-row items-center gap-1">
                <ProfitIcon size={14} color={profitColor} />
                <Text className="text-sm font-bold tabular-nums" style={{ color: profitColor }}>
                  {formatCurrency(profit)}
                </Text>
                <Text className="text-xs text-muted-foreground">profit</Text>
              </View>
            ) : item.listedPrice ? (
              <View className="flex-row items-center gap-1">
                <Text className="text-xs text-muted-foreground">Listed:</Text>
                <Text className="text-sm font-semibold text-foreground tabular-nums">
                  {formatCurrency(item.listedPrice)}
                </Text>
              </View>
            ) : <View />}
            {daysHeld != null ? (
              <Text className="text-xs text-muted-foreground">
                {item.status === "sold" && item.soldAt
                  ? `Sold ${formatDate(item.soldAt)}`
                  : `${daysHeld}d held`}
              </Text>
            ) : null}
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}
