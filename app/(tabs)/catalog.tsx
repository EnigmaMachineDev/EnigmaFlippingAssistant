import React, { useState } from "react";
import { ScrollView, View, Text, Pressable, Modal, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { Plus, Pencil, Trash2, ShoppingBag, X } from "lucide-react-native";
import { FAB } from "@/components/ui/FAB";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { useProducts, useProductSales, useProductActions } from "@/hooks/useProducts";
import { useStore } from "@/lib/store";
import { formatCurrency } from "@/lib/format";
import { Colors } from "@/constants/colors";
import type { Product } from "@/lib/types";

type ProductForm = {
  title: string;
  description: string;
  unitCost: string;
  defaultListPrice: string;
  defaultPlatform: string;
  notes: string;
};

const blankForm = (): ProductForm => ({
  title: "", description: "", unitCost: "", defaultListPrice: "", defaultPlatform: "", notes: "",
});

function ProductCard({ product, onEdit, onDelete }: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const sales = useProductSales(product.id);
  const totalUnits = sales.reduce((s, sale) => s + sale.quantity, 0);
  const totalRevenue = sales.reduce((s, sale) => s + sale.quantity * sale.pricePerUnit, 0);
  const profit = totalRevenue - product.unitCost * totalUnits;
  const margin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0;

  return (
    <Card>
      <CardContent className="pt-4 gap-3">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 gap-0.5">
            <Text className="text-sm font-semibold text-foreground">{product.title}</Text>
            {product.description ? (
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>{product.description}</Text>
            ) : null}
            {product.defaultPlatform ? (
              <Text className="text-xs text-muted-foreground">via {product.defaultPlatform}</Text>
            ) : null}
          </View>
          <View className="flex-row gap-1">
            <Button variant="ghost" size="icon" onPress={onEdit}><Pencil size={14} color={Colors.muted} /></Button>
            <Button variant="ghost" size="icon" onPress={onDelete}><Trash2 size={14} color={Colors.courage} /></Button>
          </View>
        </View>
        <View className="flex-row gap-4 pt-2 border-t border-border">
          <View>
            <Text className="text-xs text-muted-foreground">Cost / List</Text>
            <Text className="text-xs font-medium text-foreground">
              {formatCurrency(product.unitCost)} / {formatCurrency(product.defaultListPrice)}
            </Text>
          </View>
          <View>
            <Text className="text-xs text-muted-foreground">Units Sold</Text>
            <Text className="text-xs font-medium text-foreground">{totalUnits}</Text>
          </View>
          <View>
            <Text className="text-xs text-muted-foreground">Profit</Text>
            <Text className="text-xs font-medium" style={{ color: profit >= 0 ? Colors.bright : Colors.courage }}>
              {formatCurrency(profit)} ({margin}%)
            </Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

export default function CatalogScreen() {
  const products = useProducts();
  const { addProduct, updateProduct, deleteProduct } = useProductActions();
  const activeProfileId = useStore((s) => s.activeProfileId) ?? "";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(blankForm());

  const openAdd = () => { setEditingProduct(null); setForm(blankForm()); setModalOpen(true); };
  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      title: p.title, description: p.description ?? "",
      unitCost: String(p.unitCost), defaultListPrice: String(p.defaultListPrice),
      defaultPlatform: p.defaultPlatform ?? "", notes: p.notes ?? "",
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    const data = {
      profileId: activeProfileId,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      tags: [] as string[],
      unitCost: parseFloat(form.unitCost) || 0,
      defaultListPrice: parseFloat(form.defaultListPrice) || 0,
      defaultPlatform: form.defaultPlatform.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
    if (editingProduct) updateProduct(editingProduct.id, data);
    else addProduct(data);
    setModalOpen(false);
  };

  const handleDelete = (p: Product) => {
    Alert.alert(`Delete "${p.title}"?`, "All sales for this product will also be deleted.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteProduct(p.id) },
    ]);
  };

  const set = (key: keyof ProductForm) => (v: string) => setForm((prev) => ({ ...prev, [key]: v }));

  return (
    <View className="flex-1 bg-background">
      {products.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={28} color={Colors.muted} />}
          title="No products yet"
          description="Add a product to start tracking repeated sales"
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 96 }}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onEdit={() => openEdit(p)} onDelete={() => handleDelete(p)} />
          ))}
        </ScrollView>
      )}

      <FAB onPress={openAdd}><Plus size={24} color={Colors.text} /></FAB>

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-4 pt-5 pb-3 border-b border-border">
            <Text className="text-lg font-semibold text-foreground">{editingProduct ? "Edit Product" : "New Product"}</Text>
            <Pressable onPress={() => setModalOpen(false)}><X size={20} color={Colors.muted} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
            <Input label="Name" value={form.title} onChangeText={set("title")} placeholder="e.g. 8×10 Landscape Print" />
            <Input label="Description" value={form.description} onChangeText={set("description")} placeholder="Optional" />
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input label="Unit Cost" value={form.unitCost} onChangeText={set("unitCost")} keyboardType="numeric" placeholder="0.00" />
              </View>
              <View className="flex-1">
                <Input label="Default List Price" value={form.defaultListPrice} onChangeText={set("defaultListPrice")} keyboardType="numeric" placeholder="0.00" />
              </View>
            </View>
            <Input label="Default Platform" value={form.defaultPlatform} onChangeText={set("defaultPlatform")} placeholder="e.g. Etsy" />
            <Input label="Notes" value={form.notes} onChangeText={set("notes")} placeholder="Optional" />
            <Button onPress={handleSave} disabled={!form.title.trim()}>
              <Text className="text-sm font-semibold text-primary-foreground">Save Product</Text>
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
