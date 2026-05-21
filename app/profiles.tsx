import React from "react";
import { ScrollView, View, Text, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Plus, Trash2 } from "lucide-react-native";
import { useProfiles, useProfileActions } from "@/hooks/useProfile";
import { useStore } from "@/lib/store";
import { formatCurrency } from "@/lib/format";
import { Colors } from "@/constants/colors";

function profileStats(profileId: string, items: any[], productSales: any[], expenses: any[]) {
  const profItems = items.filter((i: any) => i.profileId === profileId);
  const profSales = productSales.filter((s: any) => s.profileId === profileId);
  const profExpenses = expenses.filter((e: any) => e.profileId === profileId);

  const itemProfit = profItems
    .filter((i: any) => i.status === "sold" && i.soldPrice != null)
    .reduce((sum: number, i: any) => {
      const costs = (i.costs ?? []).reduce((c: number, x: any) => c + x.amount, 0);
      return sum + (i.soldPrice - (i.purchasePrice ?? 0) - costs);
    }, 0);

  const saleRevenue = profSales.reduce((sum: number, s: any) => sum + s.quantity * s.pricePerUnit, 0);
  const expenseTotal = profExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);

  const activeItems = profItems.filter((i: any) => i.status !== "sold" && i.status !== "lost").length;

  return { profit: itemProfit + saleRevenue - expenseTotal, activeItems, expenseTotal };
}

export default function ProfilesScreen() {
  const router = useRouter();
  const profiles = useProfiles();
  const { deleteProfile, setActiveProfile } = useProfileActions();
  const items = useStore((s) => s.items);
  const productSales = useStore((s) => s.productSales);
  const expenses = useStore((s) => s.expenses);

  const handleSelect = (id: string) => {
    setActiveProfile(id);
    router.replace("/(tabs)" as any);
  };

  const handleDelete = (id: string, name: string) => {
    if (profiles.length <= 1) {
      Alert.alert("Can't Delete", "You need at least one profile.");
      return;
    }
    Alert.alert(
      `Delete "${name}"?`,
      "All items, evaluations, products, and expenses in this profile will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteProfile(id) },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View className="pt-8 pb-2">
        <Text className="text-3xl font-bold text-foreground">Yield</Text>
        <Text className="text-sm text-muted-foreground mt-1">Select a profile to get started</Text>
      </View>

      {profiles.map((profile) => {
        const stats = profileStats(profile.id, items, productSales, expenses);
        const kindLabel = profile.kind === "catalog" ? "Catalog" : "Flip";
        return (
          <Pressable
            key={profile.id}
            onPress={() => handleSelect(profile.id)}
            className="rounded-xl border border-border bg-card p-4 gap-3"
          >
            <View className="flex-row items-start justify-between">
              <View className="flex-row items-center gap-3 flex-1">
                <Text className="text-3xl">{profile.emoji}</Text>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-foreground">{profile.name}</Text>
                  <View className="flex-row items-center gap-2 mt-0.5">
                    <View
                      className="px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: profile.kind === "catalog" ? Colors.grace + "30" : Colors.green + "30" }}
                    >
                      <Text
                        className="text-xs font-medium"
                        style={{ color: profile.kind === "catalog" ? Colors.grace : Colors.bright }}
                      >
                        {kindLabel}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <Pressable
                onPress={() => handleDelete(profile.id, profile.name)}
                hitSlop={12}
                className="p-1"
              >
                <Trash2 size={16} color={Colors.muted} />
              </Pressable>
            </View>

            <View className="flex-row gap-4 border-t border-border pt-3">
              <View>
                <Text className="text-xs text-muted-foreground">Total Profit</Text>
                <Text
                  className="text-base font-semibold"
                  style={{ color: stats.profit >= 0 ? Colors.bright : Colors.courage }}
                >
                  {formatCurrency(stats.profit)}
                </Text>
              </View>
              {profile.kind === "flip" && (
                <View>
                  <Text className="text-xs text-muted-foreground">Active Items</Text>
                  <Text className="text-base font-semibold text-foreground">{stats.activeItems}</Text>
                </View>
              )}
              <View>
                <Text className="text-xs text-muted-foreground">Expenses</Text>
                <Text className="text-base font-semibold text-foreground">
                  {formatCurrency(stats.expenseTotal)}
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}

      <Pressable
        onPress={() => router.push("/profile/new" as any)}
        className="rounded-xl border border-dashed border-border items-center justify-center py-6 flex-row gap-2"
      >
        <Plus size={18} color={Colors.muted} />
        <Text className="text-sm text-muted-foreground font-medium">New Profile</Text>
      </Pressable>
    </ScrollView>
  );
}
