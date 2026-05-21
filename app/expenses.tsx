import React, { useState } from "react";
import { ScrollView, View, Text, Pressable, Modal, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Plus, Trash2, X, ChevronLeft } from "lucide-react-native";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FAB } from "@/components/ui/FAB";
import { useExpenses, useExpenseActions } from "@/hooks/useExpenses";
import { useStore } from "@/lib/store";
import { useActiveProfile } from "@/hooks/useProfile";
import { formatCurrency, formatDate, nowISO } from "@/lib/format";
import { Colors } from "@/constants/colors";
import type { Expense, ExpenseKind } from "@/lib/types";

const KIND_OPTIONS: { value: ExpenseKind; label: string }[] = [
  { value: "supplies", label: "Supplies" },
  { value: "tools", label: "Tools" },
  { value: "fees", label: "Fees" },
  { value: "other", label: "Other" },
];

type ExpenseForm = { label: string; amount: string; kind: ExpenseKind; note: string };
const blankForm = (): ExpenseForm => ({ label: "", amount: "", kind: "supplies", note: "" });

function totalByKind(expenses: Expense[]) {
  const map: Record<string, number> = {};
  for (const e of expenses) {
    map[e.kind] = (map[e.kind] ?? 0) + e.amount;
  }
  return map;
}

export default function ExpensesScreen() {
  const router = useRouter();
  const profile = useActiveProfile();
  const expenses = useExpenses();
  const { addExpense, deleteExpense } = useExpenseActions();
  const activeProfileId = useStore((s) => s.activeProfileId) ?? "";

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ExpenseForm>(blankForm());

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const byKind = totalByKind(expenses);
  const sorted = [...expenses].sort((a, b) => b.addedAt.localeCompare(a.addedAt));

  const handleSave = () => {
    if (!form.label.trim() || !form.amount) return;
    addExpense({
      profileId: activeProfileId,
      label: form.label.trim(),
      amount: parseFloat(form.amount) || 0,
      kind: form.kind,
      addedAt: nowISO(),
      note: form.note.trim() || undefined,
    });
    setModalOpen(false);
  };

  const handleDelete = (e: Expense) => {
    Alert.alert(`Delete "${e.label}"?`, undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteExpense(e.id) },
    ]);
  };

  const set = (key: keyof ExpenseForm) => (v: string) => setForm((prev) => ({ ...prev, [key]: v }));

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 pt-12 pb-4 border-b border-border">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={22} color={Colors.muted} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">Expenses</Text>
          <Text className="text-xs text-muted-foreground">{profile?.name}</Text>
        </View>
        <Text className="text-base font-semibold" style={{ color: Colors.courage }}>
          {formatCurrency(total)}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 96 }}>
        {/* Breakdown by kind */}
        {expenses.length > 0 && (
          <View className="flex-row flex-wrap gap-3">
            {KIND_OPTIONS.filter((k) => byKind[k.value]).map((k) => (
              <View key={k.value} className="flex-1 min-w-[80px] rounded-lg border border-border bg-card p-3 gap-0.5">
                <Text className="text-xs text-muted-foreground">{k.label}</Text>
                <Text className="text-sm font-semibold text-foreground">{formatCurrency(byKind[k.value] ?? 0)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* List */}
        {sorted.length === 0 ? (
          <View className="items-center py-16 gap-3">
            <Text className="text-4xl">📦</Text>
            <Text className="text-base font-semibold text-foreground">No expenses yet</Text>
            <Text className="text-sm text-muted-foreground text-center">
              Track overhead costs like shipping boxes, tools, or platform fees that aren't tied to a specific item.
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {sorted.map((expense) => (
              <Card key={expense.id}>
                <CardContent className="pt-3 pb-3 flex-row items-center gap-3">
                  <View className="flex-1 gap-0.5">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm font-medium text-foreground">{expense.label}</Text>
                      <View
                        className="px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: Colors.border }}
                      >
                        <Text className="text-xs text-muted-foreground capitalize">{expense.kind}</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-muted-foreground">{formatDate(expense.addedAt)}</Text>
                    {expense.note ? <Text className="text-xs text-muted-foreground">{expense.note}</Text> : null}
                  </View>
                  <Text className="text-sm font-semibold text-foreground">{formatCurrency(expense.amount)}</Text>
                  <Button variant="ghost" size="icon" onPress={() => handleDelete(expense)}>
                    <Trash2 size={14} color={Colors.muted} />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <FAB onPress={() => { setForm(blankForm()); setModalOpen(true); }}>
        <Plus size={24} color={Colors.text} />
      </FAB>

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-4 pt-5 pb-3 border-b border-border">
            <Text className="text-lg font-semibold text-foreground">Add Expense</Text>
            <Pressable onPress={() => setModalOpen(false)}><X size={20} color={Colors.muted} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
            <Input label="Label" value={form.label} onChangeText={set("label")} placeholder="e.g. Shipping boxes (25-pack)" />
            <Input label="Amount" value={form.amount} onChangeText={set("amount")} keyboardType="numeric" placeholder="0.00" />

            <View className="gap-1">
              <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</Text>
              <View className="flex-row flex-wrap gap-2 mt-1">
                {KIND_OPTIONS.map((k) => (
                  <Pressable
                    key={k.value}
                    onPress={() => setForm((prev) => ({ ...prev, kind: k.value }))}
                    className="px-3 py-1.5 rounded-full border"
                    style={{
                      borderColor: form.kind === k.value ? Colors.bright : Colors.border,
                      backgroundColor: form.kind === k.value ? Colors.green + "30" : Colors.card,
                    }}
                  >
                    <Text className="text-xs font-medium" style={{ color: form.kind === k.value ? Colors.bright : Colors.muted }}>
                      {k.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Input label="Note" value={form.note} onChangeText={set("note")} placeholder="Optional" />

            <Button onPress={handleSave} disabled={!form.label.trim() || !form.amount}>
              <Text className="text-sm font-semibold text-primary-foreground">Add Expense</Text>
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
