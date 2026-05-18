import React, { useState } from "react";
import {
  ScrollView, View, Text, Pressable, Alert, TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import {
  Pencil, Trash2, Plus, TrendingUp, TrendingDown, Minus, DollarSign,
} from "lucide-react-native";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ItemStatusPill } from "@/components/items/ItemStatusPill";
import { PricingCard } from "@/components/pricing/PricingCard";
import { Section } from "@/components/ui/Section";
import { useItem } from "@/hooks/useItems";
import { useStore } from "@/lib/store";
import { useSettings } from "@/hooks/useSettings";
import { getTotalCost, getRecommendedPrices, getRealizedProfit } from "@/lib/pricing";
import { formatCurrency, formatDate, nowISO } from "@/lib/format";
import { Colors } from "@/constants/colors";
import type { CostKind, ItemStatus } from "@/lib/types";

const COST_KINDS: CostKind[] = ["materials", "labor", "fee", "shipping", "other"];
const STATUS_FLOW: ItemStatus[] = ["sourcing", "acquired", "in_progress", "listed", "sold", "lost"];

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const item = useItem(id);
  const updateItem = useStore((s) => s.updateItem);
  const deleteItem = useStore((s) => s.deleteItem);
  const settings = useSettings();

  const [showAddCost, setShowAddCost] = useState(false);
  const [costLabel, setCostLabel] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [costKind, setCostKind] = useState<CostKind>("materials");

  const [showSell, setShowSell] = useState(false);
  const [soldPrice, setSoldPrice] = useState("");
  const [soldPlatform, setSoldPlatform] = useState(settings.defaultPlatform ?? "local");

  if (!item) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">Item not found</Text>
      </View>
    );
  }

  const totalCost = getTotalCost(item, settings.hourlyLaborRate);
  const recommended = getRecommendedPrices(item, settings);
  const profit = getRealizedProfit(item, settings);

  const handleDelete = () => {
    Alert.alert("Delete Item", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteItem(item.id);
          router.back();
        },
      },
    ]);
  };

  const addCost = () => {
    const amount = parseFloat(costAmount);
    if (!costLabel.trim() || isNaN(amount)) return;
    updateItem(item.id, {
      costs: [
        ...item.costs,
        { id: uuid(), label: costLabel.trim(), amount, kind: costKind, addedAt: nowISO() },
      ],
    });
    setCostLabel("");
    setCostAmount("");
    setShowAddCost(false);
  };

  const removeCost = (costId: string) => {
    updateItem(item.id, { costs: item.costs.filter((c) => c.id !== costId) });
  };

  const advanceStatus = () => {
    const idx = STATUS_FLOW.indexOf(item.status);
    if (idx < STATUS_FLOW.length - 1) {
      const next = STATUS_FLOW[idx + 1];
      if (next === "sold") {
        setShowSell(true);
      } else {
        const updates: Partial<typeof item> = { status: next };
        if (next === "listed") updates.listedAt = nowISO();
        updateItem(item.id, updates);
      }
    }
  };

  const markSold = () => {
    const price = parseFloat(soldPrice);
    if (isNaN(price)) return;
    updateItem(item.id, {
      status: "sold",
      soldPrice: price,
      soldPlatform,
      soldAt: nowISO(),
    });
    setShowSell(false);
  };

  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(item.status) + 1];

  return (
    <>
      <Stack.Screen
        options={{
          title: item.title,
          headerRight: () => (
            <View className="flex-row gap-3 pr-2">
              <Pressable onPress={() => router.push(`/item/${item.id}/edit` as any)}>
                <Pencil size={18} color={Colors.muted} />
              </Pressable>
              <Pressable onPress={handleDelete}>
                <Trash2 size={18} color={Colors.courage} />
              </Pressable>
            </View>
          ),
        }}
      />
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="px-4 pt-4 gap-4">
          {/* Header */}
          <View className="flex-row items-center gap-3 flex-wrap">
            <ItemStatusPill status={item.status} />
            {item.category ? (
              <Text className="text-sm text-muted-foreground">{item.category}</Text>
            ) : null}
            <View className="rounded-full px-2 py-0.5 bg-muted">
              <Text className="text-xs text-muted-foreground capitalize">{item.kind}</Text>
            </View>
          </View>

          {/* Pricing card */}
          <PricingCard
            totalCost={totalCost}
            recommended={recommended}
            listedPrice={item.listedPrice}
            soldPrice={item.soldPrice}
            profit={profit}
          />

          {/* Acquisition info */}
          {(item.purchasePrice != null || item.acquiredAt || item.source) ? (
            <Card>
              <CardHeader><CardTitle>Acquisition</CardTitle></CardHeader>
              <CardContent className="gap-2">
                {item.purchasePrice != null ? (
                  <Row label="Purchase price" value={formatCurrency(item.purchasePrice)} />
                ) : null}
                {item.acquiredAt ? (
                  <Row label="Acquired" value={formatDate(item.acquiredAt)} />
                ) : null}
                {item.source ? (
                  <Row label="Source" value={item.source} />
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {/* Costs */}
          <Card>
            <CardHeader>
              <View className="flex-row items-center justify-between">
                <CardTitle>Costs</CardTitle>
                <Pressable onPress={() => setShowAddCost((v) => !v)}>
                  <Plus size={18} color={Colors.bright} />
                </Pressable>
              </View>
            </CardHeader>
            <CardContent className="gap-2">
              {item.costs.length === 0 && !showAddCost ? (
                <Text className="text-sm text-muted-foreground">No costs added yet</Text>
              ) : null}
              {item.costs.map((cost) => (
                <View key={cost.id} className="flex-row items-center justify-between py-1.5 border-b border-border">
                  <View>
                    <Text className="text-sm text-foreground">{cost.label}</Text>
                    <Text className="text-xs text-muted-foreground capitalize">{cost.kind}</Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Text className="text-sm font-medium tabular-nums text-foreground">
                      {formatCurrency(cost.amount)}
                    </Text>
                    <Pressable onPress={() => removeCost(cost.id)}>
                      <Trash2 size={14} color={Colors.courage} />
                    </Pressable>
                  </View>
                </View>
              ))}
              {showAddCost ? (
                <View className="gap-2 pt-2">
                  <TextInput
                    className="bg-input border border-border rounded-md px-3 py-2.5 text-sm text-foreground"
                    placeholder="Label (e.g. New tuners)"
                    placeholderTextColor={Colors.muted}
                    value={costLabel}
                    onChangeText={setCostLabel}
                  />
                  <TextInput
                    className="bg-input border border-border rounded-md px-3 py-2.5 text-sm text-foreground"
                    placeholder="Amount"
                    placeholderTextColor={Colors.muted}
                    keyboardType="numeric"
                    value={costAmount}
                    onChangeText={setCostAmount}
                  />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {COST_KINDS.map((k) => (
                        <Pressable
                          key={k}
                          onPress={() => setCostKind(k)}
                          className={`px-3 py-1.5 rounded-full border ${costKind === k ? "bg-primary border-primary" : "border-border"}`}
                        >
                          <Text className={`text-xs capitalize ${costKind === k ? "text-primary-foreground" : "text-muted-foreground"}`}>
                            {k}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                  <View className="flex-row gap-2">
                    <Button size="sm" onPress={addCost} className="flex-1">Add</Button>
                    <Button size="sm" variant="ghost" onPress={() => setShowAddCost(false)} className="flex-1">
                      Cancel
                    </Button>
                  </View>
                </View>
              ) : null}
            </CardContent>
          </Card>

          {/* Notes */}
          {item.notes ? (
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent>
                <Text className="text-sm text-foreground leading-relaxed">{item.notes}</Text>
              </CardContent>
            </Card>
          ) : null}

          {/* Actions */}
          {item.status !== "sold" && item.status !== "lost" ? (
            <View className="gap-3">
              {nextStatus && nextStatus !== "sold" ? (
                <Button onPress={advanceStatus}>
                  Mark as {nextStatus.replace("_", " ")}
                </Button>
              ) : null}
              {nextStatus === "sold" || item.status === "listed" ? (
                <Button variant="success" onPress={() => setShowSell(true)}>
                  <DollarSign size={16} color={Colors.bg} />
                  <Text className="text-sm font-semibold text-background ml-1">Mark as Sold</Text>
                </Button>
              ) : null}
              <Button variant="ghost" onPress={() => updateItem(item.id, { status: "lost" })}>
                Mark as Lost
              </Button>
            </View>
          ) : null}

          {/* Sell dialog inline */}
          {showSell ? (
            <Card>
              <CardHeader><CardTitle>Record Sale</CardTitle></CardHeader>
              <CardContent className="gap-4">
                <TextInput
                  className="bg-input border border-border rounded-md px-3 py-2.5 text-sm text-foreground"
                  placeholder="Sale price"
                  placeholderTextColor={Colors.muted}
                  keyboardType="numeric"
                  value={soldPrice}
                  onChangeText={setSoldPrice}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {settings.platformFees.map((p) => (
                      <Pressable
                        key={p.id}
                        onPress={() => setSoldPlatform(p.id)}
                        className={`px-3 py-1.5 rounded-full border ${soldPlatform === p.id ? "bg-primary border-primary" : "border-border"}`}
                      >
                        <Text className={`text-xs ${soldPlatform === p.id ? "text-primary-foreground" : "text-muted-foreground"}`}>
                          {p.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
                <View className="flex-row gap-2">
                  <Button onPress={markSold} className="flex-1">Save Sale</Button>
                  <Button variant="ghost" onPress={() => setShowSell(false)} className="flex-1">Cancel</Button>
                </View>
              </CardContent>
            </Card>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-1 border-b border-border">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm font-medium text-foreground">{value}</Text>
    </View>
  );
}
