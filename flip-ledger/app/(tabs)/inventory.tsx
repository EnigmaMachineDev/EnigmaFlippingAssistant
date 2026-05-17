import React, { useState, useMemo } from "react";
import {
  FlatList,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, Plus, SlidersHorizontal, Package } from "lucide-react-native";
import { FAB } from "@/components/ui/FAB";
import { Pill } from "@/components/ui/Pill";
import { EmptyState } from "@/components/ui/EmptyState";
import { ItemCard } from "@/components/items/ItemCard";
import { useItems } from "@/hooks/useItems";
import { Colors, StatusColors } from "@/constants/colors";
import type { ItemStatus, ItemKind } from "@/lib/types";

const STATUS_FILTERS: { label: string; value: ItemStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Sourcing", value: "sourcing" },
  { label: "Acquired", value: "acquired" },
  { label: "In Progress", value: "in_progress" },
  { label: "Listed", value: "listed" },
  { label: "Sold", value: "sold" },
  { label: "Lost", value: "lost" },
];

type SortKey = "recent" | "oldest" | "title";

export default function InventoryScreen() {
  const router = useRouter();
  const items = useItems();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ItemStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("recent");

  const filtered = useMemo(() => {
    let list = [...items];
    if (statusFilter !== "all") {
      list = list.filter((i) => i.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      if (sortKey === "recent") return b.createdAt.localeCompare(a.createdAt);
      if (sortKey === "oldest") return a.createdAt.localeCompare(b.createdAt);
      if (sortKey === "title") return a.title.localeCompare(b.title);
      return 0;
    });
    return list;
  }, [items, search, statusFilter, sortKey]);

  return (
    <View className="flex-1 bg-background">
      {/* Search */}
      <View className="px-4 pt-4 pb-2 gap-3">
        <View className="flex-row items-center bg-input border border-border rounded-lg px-3 gap-2">
          <Search size={16} color={Colors.muted} />
          <TextInput
            className="flex-1 py-3 text-sm text-foreground"
            placeholder="Search items…"
            placeholderTextColor={Colors.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Status filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {STATUS_FILTERS.map((f) => (
            <Pressable key={f.value} onPress={() => setStatusFilter(f.value)}>
              <Pill
                label={f.label}
                color={
                  statusFilter === f.value
                    ? f.value === "all" ? Colors.green : StatusColors[f.value]
                    : undefined
                }
                className={
                  statusFilter === f.value
                    ? ""
                    : "border border-border bg-transparent"
                }
                textClassName={
                  statusFilter !== f.value ? "text-muted-foreground" : undefined
                }
              />
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => <ItemCard item={item} />}
        ItemSeparatorComponent={() => <View className="h-2" />}
        contentContainerStyle={{ paddingVertical: 8, paddingBottom: 96 }}
        ListEmptyComponent={
          <EmptyState
            icon={<Package size={28} color={Colors.muted} />}
            title={search ? "No results" : "No items yet"}
            description={
              search
                ? "Try a different search or clear filters"
                : "Tap + to add your first flip or build"
            }
          />
        }
      />

      <FAB onPress={() => router.push("/item/new" as any)}>
        <Plus size={24} color={Colors.text} />
      </FAB>
    </View>
  );
}
