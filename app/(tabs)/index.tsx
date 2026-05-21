import React, { useMemo } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Package, TrendingUp, AlertTriangle, ChevronRight, Receipt } from "lucide-react-native";
import { StatCard } from "@/components/ui/StatCard";
import { Section } from "@/components/ui/Section";
import { ItemCard } from "@/components/items/ItemCard";
import { useItems } from "@/hooks/useItems";
import { useSettings } from "@/hooks/useSettings";
import { useActiveProfile } from "@/hooks/useProfile";
import { useExpenses } from "@/hooks/useExpenses";
import { useProducts, useProductSales } from "@/hooks/useProducts";
import { getDashboardStats, getInventoryValue } from "@/lib/pricing";
import { formatCurrency, daysAgo } from "@/lib/format";
import { Colors } from "@/constants/colors";

export default function DashboardScreen() {
  const router = useRouter();
  const profile = useActiveProfile();
  const items = useItems();
  const settings = useSettings();
  const expenses = useExpenses();
  const products = useProducts();
  const productSales = useProductSales();
  const now = new Date();

  const isCatalog = profile?.kind === "catalog";

  const monthRange = useMemo(() => ({
    start: startOfMonth(now).toISOString(),
    end: endOfMonth(now).toISOString(),
  }), []);

  const yearRange = useMemo(() => ({
    start: new Date(now.getFullYear(), 0, 1).toISOString(),
    end: new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString(),
  }), []);

  // Flip profile stats
  const monthStats = useMemo(
    () => getDashboardStats(items, settings, monthRange),
    [items, settings, monthRange]
  );
  const yearStats = useMemo(
    () => getDashboardStats(items, settings, yearRange),
    [items, settings, yearRange]
  );
  const inventoryValue = useMemo(() => getInventoryValue(items, settings), [items, settings]);
  const activeCount = items.filter((i) => i.status !== "sold" && i.status !== "lost").length;

  // Catalog profile stats
  const catalogMonthRevenue = useMemo(() => {
    const start = new Date(monthRange.start).getTime();
    const end = new Date(monthRange.end).getTime();
    return productSales
      .filter((s) => {
        const t = new Date(s.soldAt).getTime();
        return t >= start && t <= end;
      })
      .reduce((sum, s) => sum + s.quantity * s.pricePerUnit, 0);
  }, [productSales, monthRange]);

  const catalogTotalRevenue = useMemo(
    () => productSales.reduce((sum, s) => sum + s.quantity * s.pricePerUnit, 0),
    [productSales]
  );

  const catalogTotalCogs = useMemo(() => {
    return productSales.reduce((sum, s) => {
      const product = products.find((p) => p.id === s.productId);
      return sum + (product?.unitCost ?? 0) * s.quantity;
    }, 0);
  }, [productSales, products]);

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const recentlySold = useMemo(
    () => items
      .filter((i) => i.status === "sold" && i.soldAt)
      .sort((a, b) => (b.soldAt ?? "").localeCompare(a.soldAt ?? ""))
      .slice(0, 5),
    [items]
  );

  const staleListings = useMemo(
    () => items.filter(
      (i) => i.status === "listed" && i.listedAt && daysAgo(i.listedAt) >= settings.remindAfterListedDays
    ),
    [items, settings.remindAfterListedDays]
  );

  const monthGoalPct = settings.monthlyProfitGoal && settings.monthlyProfitGoal > 0
    ? Math.min(100, Math.round((monthStats.totalProfit / settings.monthlyProfitGoal) * 100))
    : null;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <View className="px-4 pt-6 pb-4 flex-row items-start justify-between">
        <View>
          <View className="flex-row items-center gap-2">
            <Text className="text-2xl">{profile?.emoji}</Text>
            <Text className="text-2xl font-bold text-foreground">{profile?.name ?? "Yield"}</Text>
          </View>
          <Text className="text-sm text-muted-foreground mt-0.5">{format(now, "MMMM yyyy")}</Text>
        </View>
        <Pressable
          onPress={() => router.push("/profiles" as any)}
          className="px-3 py-1.5 rounded-full border border-border bg-card"
        >
          <Text className="text-xs text-muted-foreground">Switch</Text>
        </Pressable>
      </View>

      {/* Stats — Flip */}
      {!isCatalog && (
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
              valueColor={monthStats.totalProfit >= 0 ? Colors.bright : Colors.courage}
              icon={<TrendingUp size={14} color={Colors.muted} />}
            />
            <StatCard
              label="This Year"
              value={formatCurrency(yearStats.totalProfit)}
              sub={`${yearStats.totalSold} sold`}
              valueColor={yearStats.totalProfit >= 0 ? Colors.bright : Colors.courage}
            />
          </View>
        </View>
      )}

      {/* Stats — Catalog */}
      {isCatalog && (
        <View className="px-4 gap-3">
          <View className="flex-row gap-3">
            <StatCard
              label="This Month"
              value={formatCurrency(catalogMonthRevenue)}
              sub="revenue"
              valueColor={Colors.bright}
              icon={<TrendingUp size={14} color={Colors.muted} />}
            />
            <StatCard
              label="Products"
              value={`${products.length}`}
              sub="in catalog"
              icon={<Package size={14} color={Colors.muted} />}
            />
          </View>
          <View className="flex-row gap-3">
            <StatCard
              label="Total Revenue"
              value={formatCurrency(catalogTotalRevenue)}
              sub="all time"
              valueColor={Colors.bright}
            />
            <StatCard
              label="Net Profit"
              value={formatCurrency(catalogTotalRevenue - catalogTotalCogs - totalExpenses)}
              sub="after costs"
              valueColor={
                catalogTotalRevenue - catalogTotalCogs - totalExpenses >= 0
                  ? Colors.bright
                  : Colors.courage
              }
            />
          </View>
        </View>
      )}

      {/* Monthly goal (flip only) */}
      {!isCatalog && monthGoalPct !== null && settings.monthlyProfitGoal ? (
        <View className="mx-4 mt-4 p-4 rounded-lg border border-border bg-card gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-muted-foreground">Monthly goal</Text>
            <Text className="text-sm font-semibold text-foreground">
              {formatCurrency(monthStats.totalProfit)} / {formatCurrency(settings.monthlyProfitGoal)}
            </Text>
          </View>
          <View className="h-2 rounded-full bg-muted overflow-hidden">
            <View className="h-full rounded-full bg-primary" style={{ width: `${monthGoalPct}%` }} />
          </View>
          <Text className="text-xs text-muted-foreground text-right">{monthGoalPct}%</Text>
        </View>
      ) : null}

      {/* Expenses summary */}
      <Pressable
        onPress={() => router.push("/expenses" as any)}
        className="mx-4 mt-4 p-4 rounded-lg border border-border bg-card flex-row items-center gap-3"
      >
        <Receipt size={16} color={Colors.muted} />
        <View className="flex-1">
          <Text className="text-sm font-medium text-foreground">Expenses</Text>
          <Text className="text-xs text-muted-foreground">
            {expenses.length > 0
              ? `${expenses.length} entries · ${formatCurrency(totalExpenses)} total`
              : "No overhead costs logged yet"}
          </Text>
        </View>
        <ChevronRight size={14} color={Colors.muted} />
      </Pressable>

      {/* Stale listings (flip only) */}
      {!isCatalog && staleListings.length > 0 ? (
        <View className="mt-6">
          <Section
            title={`Stale Listings (${staleListings.length})`}
            right={
              <View className="flex-row items-center gap-1">
                <AlertTriangle size={12} color={Colors.warning} />
                <Text className="text-xs text-warning">{`>${settings.remindAfterListedDays}d`}</Text>
              </View>
            }
          >
            <View className="gap-2">
              {staleListings.map((item) => <ItemCard key={item.id} item={item} />)}
            </View>
          </Section>
        </View>
      ) : null}

      {/* Recently sold (flip only) */}
      {!isCatalog && recentlySold.length > 0 ? (
        <View className="mt-6">
          <Section title="Recently Sold">
            <View className="gap-2">
              {recentlySold.map((item) => <ItemCard key={item.id} item={item} />)}
            </View>
          </Section>
        </View>
      ) : null}

      {/* Empty state */}
      {!isCatalog && items.length === 0 ? (
        <View className="items-center justify-center py-16 px-8 gap-4">
          <Package size={48} color={Colors.muted} />
          <Text className="text-lg font-semibold text-foreground text-center">Nothing tracked yet</Text>
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

      {isCatalog && products.length === 0 ? (
        <View className="items-center justify-center py-16 px-8 gap-4">
          <Package size={48} color={Colors.muted} />
          <Text className="text-lg font-semibold text-foreground text-center">No products yet</Text>
          <Text className="text-sm text-muted-foreground text-center">
            Add your first product to the catalog to start tracking sales.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
