import React, { useMemo } from "react";
import { ScrollView, View, Text } from "react-native";
import { format, startOfYear, endOfYear } from "date-fns";
import { TrendingUp, TrendingDown, Target, Clock } from "lucide-react-native";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Section } from "@/components/ui/Section";
import { useItems } from "@/hooks/useItems";
import { useEvaluations } from "@/hooks/useEvaluations";
import { useSettings } from "@/hooks/useSettings";
import { getDashboardStats, getProspectStats } from "@/lib/pricing";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Colors } from "@/constants/colors";

export default function InsightsScreen() {
  const items = useItems();
  const evaluations = useEvaluations();
  const settings = useSettings();
  const now = new Date();

  const yearRange = useMemo(() => ({
    start: startOfYear(now).toISOString(),
    end: endOfYear(now).toISOString(),
  }), []);

  const yearStats = useMemo(
    () => getDashboardStats(items, settings, yearRange),
    [items, settings, yearRange]
  );

  const prospectStats = useMemo(
    () => getProspectStats(evaluations, yearRange),
    [evaluations, yearRange]
  );

  const soldItems = items.filter((i) => i.status === "sold");

  const byCategory = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    soldItems.forEach((i) => {
      const cat = i.category ?? "Uncategorized";
      const existing = map.get(cat) ?? { count: 0, total: 0 };
      const profit = i.soldPrice ? i.soldPrice - (i.purchasePrice ?? 0) - i.costs.reduce((s, c) => s + c.amount, 0) : 0;
      map.set(cat, { count: existing.count + 1, total: existing.total + profit });
    });
    return Array.from(map.entries())
      .map(([cat, d]) => ({ cat, ...d }))
      .sort((a, b) => b.total - a.total);
  }, [soldItems]);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <View className="px-4 pt-6 pb-2">
        <Text className="text-2xl font-bold text-foreground">Insights</Text>
        <Text className="text-sm text-muted-foreground">{format(now, "yyyy")} overview</Text>
      </View>

      {/* Year stats */}
      <View className="px-4 gap-3 mt-4">
        <View className="flex-row gap-3">
          <StatCard
            label="Total Profit"
            value={formatCurrency(yearStats.totalProfit)}
            valueColor={yearStats.totalProfit >= 0 ? Colors.bright : Colors.courage}
            icon={<TrendingUp size={14} color={Colors.muted} />}
          />
          <StatCard
            label="Items Sold"
            value={`${yearStats.totalSold}`}
          />
        </View>
        <View className="flex-row gap-3">
          <StatCard
            label="Avg Margin"
            value={formatPercent(yearStats.avgMarginPct)}
            icon={<Target size={14} color={Colors.muted} />}
          />
          <StatCard
            label="Avg Days to Sell"
            value={`${yearStats.avgDaysToSell}`}
            icon={<Clock size={14} color={Colors.muted} />}
          />
        </View>
      </View>

      {/* Best/worst */}
      {(yearStats.bestItem || yearStats.worstItem) ? (
        <View className="px-4 mt-6 gap-3">
          {yearStats.bestItem ? (
            <Card>
              <CardHeader>
                <View className="flex-row items-center gap-2">
                  <TrendingUp size={16} color={Colors.bright} />
                  <CardTitle>Best Flip</CardTitle>
                </View>
              </CardHeader>
              <CardContent>
                <Text className="text-base font-semibold text-foreground">
                  {yearStats.bestItem.title}
                </Text>
                {yearStats.bestItem.soldPrice ? (
                  <Text className="text-sm text-muted-foreground mt-1">
                    Sold {formatCurrency(yearStats.bestItem.soldPrice)}
                  </Text>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
          {yearStats.worstItem && yearStats.worstItem.id !== yearStats.bestItem?.id ? (
            <Card>
              <CardHeader>
                <View className="flex-row items-center gap-2">
                  <TrendingDown size={16} color={Colors.courage} />
                  <CardTitle>Worst Flip</CardTitle>
                </View>
              </CardHeader>
              <CardContent>
                <Text className="text-base font-semibold text-foreground">
                  {yearStats.worstItem.title}
                </Text>
              </CardContent>
            </Card>
          ) : null}
        </View>
      ) : null}

      {/* Category breakdown */}
      {byCategory.length > 0 ? (
        <Section title="Profit by Category" className="mt-6">
          <Card className="mx-4">
            <CardContent className="pt-4 gap-2">
              {byCategory.map(({ cat, count, total }) => (
                <View key={cat} className="flex-row items-center justify-between py-1.5 border-b border-border">
                  <View>
                    <Text className="text-sm font-medium text-foreground">{cat}</Text>
                    <Text className="text-xs text-muted-foreground">{count} sold</Text>
                  </View>
                  <Text
                    className="text-sm font-bold tabular-nums"
                    style={{ color: total >= 0 ? Colors.bright : Colors.courage }}
                  >
                    {formatCurrency(total)}
                  </Text>
                </View>
              ))}
            </CardContent>
          </Card>
        </Section>
      ) : null}

      {/* Buy discipline */}
      {prospectStats.totalEvaluated > 0 ? (
        <Section title="Buy Discipline" className="mt-6">
          <Card className="mx-4">
            <CardContent className="pt-4 gap-2">
              <Row label="Deals evaluated" value={`${prospectStats.totalEvaluated}`} />
              <Row label="Bought" value={`${prospectStats.bought}`} valueColor={Colors.bright} />
              <Row label="Walked away" value={`${prospectStats.walked}`} />
              <Row label="Lost to other buyer" value={`${prospectStats.lostToOtherBuyer}`} />
              <Row
                label="Conversion rate"
                value={formatPercent(prospectStats.conversionRate)}
                valueColor={Colors.text}
              />
            </CardContent>
          </Card>
        </Section>
      ) : null}

      {soldItems.length === 0 && evaluations.length === 0 ? (
        <View className="items-center justify-center py-16 px-8">
          <Text className="text-lg font-semibold text-foreground text-center">No data yet</Text>
          <Text className="text-sm text-muted-foreground text-center mt-2">
            Sell some items or evaluate deals to see your stats here.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View className="flex-row items-center justify-between py-1.5 border-b border-border">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text
        className="text-sm font-semibold tabular-nums"
        style={{ color: valueColor ?? Colors.text }}
      >
        {value}
      </Text>
    </View>
  );
}
