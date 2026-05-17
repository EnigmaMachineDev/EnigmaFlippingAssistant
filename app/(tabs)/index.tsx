import React, { useMemo } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Package, TrendingUp, AlertTriangle } from "lucide-react-native";
import { StatCard } from "@/components/ui/StatCard";
import { Section } from "@/components/ui/Section";
import { ItemCard } from "@/components/items/ItemCard";
import { useItems } from "@/hooks/useItems";
import { useSettings } from "@/hooks/useSettings";
import {
  getDashboardStats,
  getInventoryValue,
  getRealizedProfit,
} from "@/lib/pricing";
import { formatCurrency } from "@/lib/format";
import { daysAgo } from "@/lib/format";
import { Colors } from "@/constants/colors";

export default function DashboardScreen() {
  const router = useRouter();
  const items = useItems();
  const settings = useSettings();
  const now = new Date();

  const monthRange = useMemo(() => ({
    start: startOfMonth(now).toISOString(),
    end: endOfMonth(now).toISOString(),
  }), []);

  const yearRange = useMemo(() => ({
    start: new Date(now.getFullYear(), 0, 1).toISOString(),
    end: new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString(),
  }), []);

  const monthStats = useMemo(
    () => getDashboardStats(items, settings, monthRange),
    [items, settings, monthRange]
  );

  const yearStats = useMemo(
    () => getDashboardStats(items, settings, yearRange),
    [items, settings, yearRange]
  );

  const inventoryValue = useMemo(
    () => getInventoryValue(items, settings),
    [items, settings]
  );

  const activeCount = items.filter(
    (i) => i.status !== "sold" && i.status !== "lost"
  ).length;

  const recentlySold = useMemo(
    () =>
      items
        .filter((i) => i.status === "sold" && i.soldAt)
        .sort((a, b) => (b.soldAt ?? "").localeCompare(a.soldAt ?? ""))
        .slice(0, 5),
    [items]
  );

  const staleListings = useMemo(
    () =>
      items.filter(
        (i) =>
          i.status === "listed" &&
          i.listedAt &&
          daysAgo(i.listedAt) >= settings.remindAfterListedDays
      ),
    [items, settings.remindAfterListedDays]
  );

  const monthGoalPct =
    settings.monthlyProfitGoal && settings.monthlyProfitGoal > 0
      ? Math.min(
          100,
          Math.round((monthStats.totalProfit / settings.monthlyProfitGoal) * 100)
        )
      : null;

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Header */}
      <View className="px-4 pt-6 pb-4">
        <Text className="text-2xl font-bold text-foreground">Flip Ledger</Text>
        <Text className="text-sm text-muted-foreground">
          {format(now, "MMMM yyyy")}
        </Text>
      </View>

      {/* Stat cards */}
      <View className="px-4 gap-3">
        <View className="flex-row gap-3">
          <StatCard
            label="Inventory"
            value={formatCurrency(inventoryValue)}
            sub="cost basis"
            icon={<Package size={14} color={Colors.muted} />}
          />
          <StatCard label="Active" value={`${activeCount}`} sub="items" />
        </View>
        <View className="flex-row gap-3">
          <StatCard
            label="This Month"
            value={formatCurrency(monthStats.totalProfit)}
            sub={`${monthStats.totalSold} sold`}
            valueColor={
              monthStats.totalProfit >= 0 ? Colors.bright : Colors.courage
            }
            icon={<TrendingUp size={14} color={Colors.muted} />}
          />
          <StatCard
            label="This Year"
            value={formatCurrency(yearStats.totalProfit)}
            sub={`${yearStats.totalSold} sold`}
            valueColor={
              yearStats.totalProfit >= 0 ? Colors.bright : Colors.courage
            }
          />
        </View>
      </View>

      {/* Monthly goal */}
      {monthGoalPct !== null && settings.monthlyProfitGoal ? (
        <View className="mx-4 mt-4 p-4 rounded-lg border border-border bg-card gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">Monthly goal</Text>
            <Text className="text-sm font-semibold text-foreground">
              {formatCurrency(monthStats.totalProfit)} / {formatCurrency(settings.monthlyProfitGoal)}
            </Text>
          </View>
          <View className="h-2 rounded-full bg-muted overflow-hidden">
            <View
              className="h-full rounded-full bg-primary"
              style={{ width: `${monthGoalPct}%` }}
            />
          </View>
          <Text className="text-xs text-muted-foreground text-right">{monthGoalPct}%</Text>
        </View>
      ) : null}

      {/* Stale listings */}
      {staleListings.length > 0 ? (
        <View className="mt-6">
          <Section
            title={`Stale Listings (${staleListings.length})`}
            right={
              <View className="flex-row items-center gap-1">
                <AlertTriangle size={12} color={Colors.warning} />
                <Text className="text-xs text-warning">
                  {`>${settings.remindAfterListedDays}d`}
                </Text>
              </View>
            }
          >
            <View className="gap-2">
              {staleListings.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </View>
          </Section>
        </View>
      ) : null}

      {/* Recently sold */}
      {recentlySold.length > 0 ? (
        <View className="mt-6">
          <Section title="Recently Sold">
            <View className="gap-2">
              {recentlySold.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </View>
          </Section>
        </View>
      ) : null}

      {items.length === 0 ? (
        <View className="items-center justify-center py-16 px-8 gap-4">
          <Package size={48} color={Colors.muted} />
          <Text className="text-lg font-semibold text-foreground text-center">
            Nothing tracked yet
          </Text>
          <Text className="text-sm text-muted-foreground text-center">
            Add your first item from the Inventory tab, or evaluate a buy from Prospects.
          </Text>
          <Pressable
            onPress={() => router.push("/item/new" as any)}
            className="mt-2 px-6 py-3 rounded-lg bg-primary"
          >
            <Text className="text-sm font-semibold text-primary-foreground">Add First Item</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}
