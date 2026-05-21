import React, { useState, useMemo } from "react";
import { ScrollView, View, Text, Pressable, Modal, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Plus, X, Trash2, BarChart2 } from "lucide-react-native";
import { FAB } from "@/components/ui/FAB";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { useProducts, useProductSales, useProductActions } from "@/hooks/useProducts";
import { useStore } from "@/lib/store";
import { useSettings } from "@/hooks/useSettings";
import { formatCurrency, formatDate, nowISO } from "@/lib/format";
import { Colors } from "@/constants/colors";
import type { ProductSale } from "@/lib/types";

type SaleForm = {
  productId: string;
  quantity: string;
  pricePerUnit: string;
  platform: string;
  soldAt: string;
  note: string;
};

export default function SalesScreen() {
  const products = useProducts();
  const allSales = useProductSales();
  const { addProductSale, deleteProductSale } = useProductActions();
  const settings = useSettings();
  const activeProfileId = useStore((s) => s.activeProfileId) ?? "";

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<SaleForm>({
    productId: products[0]?.id ?? "",
    quantity: "1",
    pricePerUnit: "",
    platform: settings.defaultPlatform ?? "",
    soldAt: nowISO().slice(0, 10),
    note: "",
  });

  const salesByProduct = useMemo(() => {
    const map = new Map<string, ProductSale[]>();
    for (const sale of allSales) {
      if (!map.has(sale.productId)) map.set(sale.productId, []);
      map.get(sale.productId)!.push(sale);
    }
    return map;
  }, [allSales]);

  const openLog = () => {
    setForm({
      productId: products[0]?.id ?? "",
      quantity: "1",
      pricePerUnit: String(products[0]?.defaultListPrice ?? ""),
      platform: settings.defaultPlatform ?? "",
      soldAt: nowISO().slice(0, 10),
      note: "",
    });
    setModalOpen(true);
  };

  const handleProductSelect = (id: string) => {
    const p = products.find((pr) => pr.id === id);
    setForm((prev) => ({ ...prev, productId: id, pricePerUnit: String(p?.defaultListPrice ?? "") }));
  };

  const handleSave = () => {
    const qty = parseInt(form.quantity) || 1;
    const price = parseFloat(form.pricePerUnit) || 0;
    if (!form.productId) return;
    addProductSale({
      productId: form.productId,
      profileId: activeProfileId,
      quantity: qty,
      pricePerUnit: price,
      platform: form.platform.trim() || "Other",
      soldAt: form.soldAt ? new Date(form.soldAt).toISOString() : nowISO(),
      note: form.note.trim() || undefined,
    });
    setModalOpen(false);
  };

  const handleDelete = (sale: ProductSale) => {
    Alert.alert("Delete sale?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteProductSale(sale.id) },
    ]);
  };

  const set = (key: keyof SaleForm) => (v: string) => setForm((prev) => ({ ...prev, [key]: v }));

  if (allSales.length === 0 && products.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <EmptyState
          icon={<BarChart2 size={28} color={Colors.muted} />}
          title="No sales yet"
          description="Add products first, then log sales here"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 96 }}>
        {products.map((product) => {
          const sales = (salesByProduct.get(product.id) ?? [])
            .slice()
            .sort((a, b) => b.soldAt.localeCompare(a.soldAt));
          if (sales.length === 0) return null;
          const totalUnits = sales.reduce((s, sale) => s + sale.quantity, 0);
          const totalRevenue = sales.reduce((s, sale) => s + sale.quantity * sale.pricePerUnit, 0);
          return (
            <View key={product.id} className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-foreground">{product.title}</Text>
                <Text className="text-xs text-muted-foreground">
                  {totalUnits} units · {formatCurrency(totalRevenue)}
                </Text>
              </View>
              {sales.map((sale) => (
                <Card key={sale.id}>
                  <CardContent className="pt-3 pb-3 flex-row items-center gap-3">
                    <View className="flex-1 gap-0.5">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-sm font-medium text-foreground">
                          {sale.quantity}× {formatCurrency(sale.pricePerUnit)}
                        </Text>
                        <Text className="text-xs text-muted-foreground">= {formatCurrency(sale.quantity * sale.pricePerUnit)}</Text>
                      </View>
                      <Text className="text-xs text-muted-foreground">
                        {sale.platform} · {formatDate(sale.soldAt)}
                      </Text>
                      {sale.note ? <Text className="text-xs text-muted-foreground">{sale.note}</Text> : null}
                    </View>
                    <Button variant="ghost" size="icon" onPress={() => handleDelete(sale)}>
                      <Trash2 size={14} color={Colors.muted} />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </View>
          );
        })}

        {allSales.length === 0 && (
          <EmptyState
            icon={<BarChart2 size={28} color={Colors.muted} />}
            title="No sales logged"
            description="Tap + to log your first sale"
          />
        )}
      </ScrollView>

      {products.length > 0 && <FAB onPress={openLog}><Plus size={24} color={Colors.text} /></FAB>}

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-4 pt-5 pb-3 border-b border-border">
            <Text className="text-lg font-semibold text-foreground">Log Sale</Text>
            <Pressable onPress={() => setModalOpen(false)}><X size={20} color={Colors.muted} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
            {/* Product selector */}
            <View className="gap-1">
              <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Product</Text>
              <View className="flex-row flex-wrap gap-2 mt-1">
                {products.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => handleProductSelect(p.id)}
                    className="px-3 py-1.5 rounded-full border"
                    style={{
                      borderColor: form.productId === p.id ? Colors.bright : Colors.border,
                      backgroundColor: form.productId === p.id ? Colors.green + "30" : Colors.card,
                    }}
                  >
                    <Text className="text-xs font-medium" style={{ color: form.productId === p.id ? Colors.bright : Colors.muted }}>
                      {p.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input label="Quantity" value={form.quantity} onChangeText={set("quantity")} keyboardType="numeric" placeholder="1" />
              </View>
              <View className="flex-1">
                <Input label="Price / Unit" value={form.pricePerUnit} onChangeText={set("pricePerUnit")} keyboardType="numeric" placeholder="0.00" />
              </View>
            </View>
            <Input label="Platform" value={form.platform} onChangeText={set("platform")} placeholder="e.g. Etsy" />
            <Input label="Date (YYYY-MM-DD)" value={form.soldAt} onChangeText={set("soldAt")} placeholder="2025-01-01" />
            <Input label="Note" value={form.note} onChangeText={set("note")} placeholder="Optional" />

            <Button onPress={handleSave} disabled={!form.productId}>
              <Text className="text-sm font-semibold text-primary-foreground">Log Sale</Text>
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
