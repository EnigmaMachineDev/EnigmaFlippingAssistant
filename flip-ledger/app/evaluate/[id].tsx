import React, { useState } from "react";
import {
  ScrollView, View, Text, Pressable, Alert, TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Plus, Pencil, Trash2, Lightbulb } from "lucide-react-native";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VerdictPanel } from "@/components/pricing/VerdictPanel";
import { VerdictBadge } from "@/components/pricing/VerdictBadge";
import { Section } from "@/components/ui/Section";
import { useEvaluation } from "@/hooks/useEvaluations";
import { useStore } from "@/lib/store";
import { useSettings } from "@/hooks/useSettings";
import { getBuyVerdict, suggestCounterOffer } from "@/lib/pricing";
import { formatCurrency, formatDate, nowISO } from "@/lib/format";
import { Colors } from "@/constants/colors";
import type { EvaluationOutcome } from "@/lib/types";

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function EvaluationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const evaluation = useEvaluation(id);
  const { updateEvaluation, deleteEvaluation, addItem } = useStore((s) => ({
    updateEvaluation: s.updateEvaluation,
    deleteEvaluation: s.deleteEvaluation,
    addItem: s.addItem,
  }));
  const settings = useSettings();

  const [showAddOffer, setShowAddOffer] = useState(false);
  const [offerBy, setOfferBy] = useState<"me" | "seller">("me");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerNote, setOfferNote] = useState("");
  const [showCounter, setShowCounter] = useState(false);

  if (!evaluation) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">Evaluation not found</Text>
      </View>
    );
  }

  const verdict = getBuyVerdict(evaluation, settings);
  const counter = suggestCounterOffer(evaluation, settings);

  const logOffer = () => {
    const amount = parseFloat(offerAmount);
    if (isNaN(amount)) return;
    updateEvaluation(evaluation.id, {
      offers: [
        ...evaluation.offers,
        { id: uuid(), by: offerBy, amount, at: nowISO(), note: offerNote.trim() || undefined },
      ],
    });
    setOfferAmount("");
    setOfferNote("");
    setShowAddOffer(false);
  };

  const setOutcome = (outcome: EvaluationOutcome) => {
    const label = outcome === "walked" ? "Walked Away" : "Lost to Other Buyer";
    Alert.alert(`Mark as ${label}?`, "This will archive the prospect.", [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => updateEvaluation(evaluation.id, { outcome }) },
    ]);
  };

  const markBought = () => {
    Alert.alert("Mark as Bought?", "This will create a new Item linked to this evaluation.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Create Item",
        onPress: () => {
          const lastOffer = evaluation.offers[evaluation.offers.length - 1];
          const purchasePrice = lastOffer?.by === "seller"
            ? lastOffer.amount
            : evaluation.askingPrice;
          const item = addItem({
            kind: "flip",
            title: evaluation.title,
            tags: [],
            status: "acquired",
            photos: [],
            purchasePrice,
            acquiredAt: nowISO(),
            source: evaluation.source,
            costs: evaluation.estimatedRefurbCost > 0
              ? [{ id: uuid(), label: "Estimated refurb (from eval)", amount: evaluation.estimatedRefurbCost, kind: "materials", addedAt: nowISO() }]
              : [],
            comps: [],
          });
          updateEvaluation(evaluation.id, { outcome: "bought", linkedItemId: item.id });
          router.replace(`/item/${item.id}` as any);
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert("Delete Evaluation?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteEvaluation(evaluation.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: evaluation.title,
          headerRight: () => (
            <View className="flex-row gap-3 pr-2">
              <Pressable onPress={() => router.push(`/evaluate/${evaluation.id}/edit` as any)}>
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
          {/* Verdict */}
          <VerdictPanel verdict={verdict} />

          {/* Info */}
          <Card>
            <CardHeader><CardTitle>Deal Info</CardTitle></CardHeader>
            <CardContent className="gap-2">
              <Row label="Asking price" value={formatCurrency(evaluation.askingPrice)} />
              <Row label="Est. sale price" value={formatCurrency(evaluation.estimatedSalePrice)} />
              <Row label="Est. refurb cost" value={formatCurrency(evaluation.estimatedRefurbCost)} />
              <Row label="Est. labor hours" value={`${evaluation.estimatedLaborHours}h`} />
              <Row label="Platform" value={evaluation.intendedSellPlatform} />
              {evaluation.source ? <Row label="Source" value={evaluation.source} /> : null}
            </CardContent>
          </Card>

          {/* Counter suggestion */}
          <Pressable
            onPress={() => setShowCounter((v) => !v)}
            className="flex-row items-center gap-2 px-4 py-3 rounded-lg border border-border bg-card"
          >
            <Lightbulb size={16} color={Colors.warning} />
            <Text className="text-sm font-medium text-foreground flex-1">
              Suggested counter: {counter.amount > 0 ? formatCurrency(counter.amount) : "No viable counter"}
            </Text>
          </Pressable>
          {showCounter ? (
            <Card>
              <CardContent className="pt-4">
                <Text className="text-sm text-muted-foreground leading-relaxed">
                  {counter.rationale}
                </Text>
              </CardContent>
            </Card>
          ) : null}

          {/* Offers timeline */}
          <Section
            title={`Offers (${evaluation.offers.length})`}
            right={
              <Pressable onPress={() => setShowAddOffer((v) => !v)} className="flex-row items-center gap-1">
                <Plus size={14} color={Colors.bright} />
                <Text className="text-xs text-bright">Log offer</Text>
              </Pressable>
            }
          >
            <Card className="mx-4">
              <CardContent className="pt-4 gap-2">
                {evaluation.offers.length === 0 ? (
                  <Text className="text-sm text-muted-foreground">No offers logged yet</Text>
                ) : null}
                {evaluation.offers.map((offer) => (
                  <View key={offer.id} className="flex-row items-start gap-3 py-2 border-b border-border">
                    <View
                      className="w-2 h-2 rounded-full mt-1.5"
                      style={{ backgroundColor: offer.by === "me" ? Colors.bright : Colors.muted }}
                    />
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm font-semibold text-foreground tabular-nums">
                          {formatCurrency(offer.amount)}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          {offer.by === "me" ? "You" : "Seller"} · {formatDate(offer.at)}
                        </Text>
                      </View>
                      {offer.note ? (
                        <Text className="text-xs text-muted-foreground mt-0.5">{offer.note}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
                {showAddOffer ? (
                  <View className="gap-2 pt-2">
                    <View className="flex-row gap-2">
                      {(["me", "seller"] as const).map((by) => (
                        <Pressable
                          key={by}
                          onPress={() => setOfferBy(by)}
                          className={`flex-1 py-2 rounded-md border items-center ${offerBy === by ? "bg-primary border-primary" : "border-border"}`}
                        >
                          <Text className={`text-xs font-medium ${offerBy === by ? "text-primary-foreground" : "text-muted-foreground"}`}>
                            {by === "me" ? "My offer" : "Seller's offer"}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <TextInput
                      className="bg-input border border-border rounded-md px-3 py-2.5 text-sm text-foreground"
                      placeholder="Amount"
                      placeholderTextColor={Colors.muted}
                      keyboardType="numeric"
                      value={offerAmount}
                      onChangeText={setOfferAmount}
                    />
                    <TextInput
                      className="bg-input border border-border rounded-md px-3 py-2.5 text-sm text-foreground"
                      placeholder="Note (optional)"
                      placeholderTextColor={Colors.muted}
                      value={offerNote}
                      onChangeText={setOfferNote}
                    />
                    <View className="flex-row gap-2">
                      <Button size="sm" onPress={logOffer} className="flex-1">Log Offer</Button>
                      <Button size="sm" variant="ghost" onPress={() => setShowAddOffer(false)} className="flex-1">Cancel</Button>
                    </View>
                  </View>
                ) : null}
              </CardContent>
            </Card>
          </Section>

          {/* Outcome actions */}
          {evaluation.outcome === "pending" ? (
            <View className="gap-3">
              <Button variant="success" onPress={markBought}>
                <Text className="text-sm font-semibold text-background">I Bought It → Create Item</Text>
              </Button>
              <Button variant="outline" onPress={() => setOutcome("walked")}>
                Walked Away
              </Button>
              <Button variant="outline" onPress={() => setOutcome("lost_to_other_buyer")}>
                Lost to Other Buyer
              </Button>
            </View>
          ) : (
            <View className="p-4 rounded-lg border border-border bg-card">
              <Text className="text-sm text-muted-foreground text-center">
                Outcome: <Text className="font-semibold text-foreground capitalize">
                  {evaluation.outcome.replace(/_/g, " ")}
                </Text>
              </Text>
              {evaluation.linkedItemId ? (
                <Pressable
                  onPress={() => router.push(`/item/${evaluation.linkedItemId}` as any)}
                  className="mt-2 items-center"
                >
                  <Text className="text-sm text-bright underline">View linked item →</Text>
                </Pressable>
              ) : null}
            </View>
          )}
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
