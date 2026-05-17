import React, { useState, useMemo } from "react";
import {
  ScrollView, View, Text, Pressable, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "@/lib/store";
import { useSettings } from "@/hooks/useSettings";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { VerdictPanel } from "@/components/pricing/VerdictPanel";
import { getBuyVerdict } from "@/lib/pricing";
import { nowISO } from "@/lib/format";
import { Colors } from "@/constants/colors";
import type { Evaluation } from "@/lib/types";

export default function NewEvaluationScreen() {
  const router = useRouter();
  const { addEvaluation, addItem } = useStore((s) => ({
    addEvaluation: s.addEvaluation,
    addItem: s.addItem,
  }));
  const settings = useSettings();

  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [listingUrl, setListingUrl] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [estimatedSalePrice, setEstimatedSalePrice] = useState("");
  const [estimatedRefurbCost, setEstimatedRefurbCost] = useState("0");
  const [estimatedLaborHours, setEstimatedLaborHours] = useState("0");
  const [platform, setPlatform] = useState(settings.defaultPlatform ?? "local");
  const [error, setError] = useState("");

  const partialEval: Evaluation | null = useMemo(() => {
    const asking = parseFloat(askingPrice);
    const sale = parseFloat(estimatedSalePrice);
    if (isNaN(asking) || isNaN(sale) || !title.trim()) return null;
    return {
      id: "preview",
      title: title.trim(),
      photos: [],
      askingPrice: asking,
      estimatedSalePrice: sale,
      estimatedRefurbCost: parseFloat(estimatedRefurbCost) || 0,
      estimatedLaborHours: parseFloat(estimatedLaborHours) || 0,
      intendedSellPlatform: platform,
      comps: [],
      offers: [],
      outcome: "pending",
      createdAt: nowISO(),
      updatedAt: nowISO(),
    };
  }, [title, askingPrice, estimatedSalePrice, estimatedRefurbCost, estimatedLaborHours, platform]);

  const verdict = useMemo(
    () => (partialEval ? getBuyVerdict(partialEval, settings) : null),
    [partialEval, settings]
  );

  const handleSaveProspect = () => {
    if (!title.trim()) { setError("Title required"); return; }
    const asking = parseFloat(askingPrice);
    const sale = parseFloat(estimatedSalePrice);
    if (isNaN(asking) || isNaN(sale)) { setError("Enter asking and estimated sale prices"); return; }
    setError("");
    addEvaluation({
      title: title.trim(),
      source: source.trim() || undefined,
      listingUrl: listingUrl.trim() || undefined,
      photos: [],
      askingPrice: asking,
      estimatedSalePrice: sale,
      estimatedRefurbCost: parseFloat(estimatedRefurbCost) || 0,
      estimatedLaborHours: parseFloat(estimatedLaborHours) || 0,
      intendedSellPlatform: platform,
      comps: [],
      offers: [],
      outcome: "pending",
    });
    router.back();
  };

  const handleBoughtIt = () => {
    if (!title.trim()) { setError("Title required"); return; }
    const asking = parseFloat(askingPrice);
    const sale = parseFloat(estimatedSalePrice);
    if (isNaN(asking)) { setError("Enter asking price"); return; }
    setError("");
    const ev = addEvaluation({
      title: title.trim(),
      source: source.trim() || undefined,
      listingUrl: listingUrl.trim() || undefined,
      photos: [],
      askingPrice: asking,
      estimatedSalePrice: isNaN(sale) ? asking : sale,
      estimatedRefurbCost: parseFloat(estimatedRefurbCost) || 0,
      estimatedLaborHours: parseFloat(estimatedLaborHours) || 0,
      intendedSellPlatform: platform,
      comps: [],
      offers: [],
      outcome: "bought",
    });
    const item = addItem({
      kind: "flip",
      title: title.trim(),
      tags: [],
      status: "acquired",
      photos: [],
      purchasePrice: asking,
      acquiredAt: nowISO(),
      source: source.trim() || undefined,
      costs: [
        ...(parseFloat(estimatedRefurbCost) > 0
          ? [{ id: "seed-refurb", label: "Estimated refurb (from evaluation)", amount: parseFloat(estimatedRefurbCost), kind: "materials" as const, addedAt: nowISO() }]
          : []),
      ],
      comps: [],
    });
    useStore.getState().updateEvaluation(ev.id, { linkedItemId: item.id });
    router.replace(`/item/${item.id}` as any);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View className="px-4 pt-6 gap-4">
          <Card>
            <CardHeader><CardTitle>Deal Info</CardTitle></CardHeader>
            <CardContent className="gap-4">
              <Input label="Title *" value={title} onChangeText={setTitle} placeholder="1965 Silvertone — Craigslist" error={error} />
              <Input label="Source" value={source} onChangeText={setSource} placeholder="Facebook Marketplace" />
              <Input label="Listing URL" value={listingUrl} onChangeText={setListingUrl} placeholder="https://…" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Numbers</CardTitle></CardHeader>
            <CardContent className="gap-4">
              <Input label="Asking Price ($) *" keyboardType="numeric" prefix="$" value={askingPrice} onChangeText={setAskingPrice} placeholder="150" />
              <Input label="Estimated Sale Price ($) *" keyboardType="numeric" prefix="$" value={estimatedSalePrice} onChangeText={setEstimatedSalePrice} placeholder="300" />
              <Input label="Estimated Refurb Cost ($)" keyboardType="numeric" prefix="$" value={estimatedRefurbCost} onChangeText={setEstimatedRefurbCost} />
              <Input label="Estimated Labor Hours" keyboardType="numeric" value={estimatedLaborHours} onChangeText={setEstimatedLaborHours} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Sell Platform</CardTitle></CardHeader>
            <CardContent>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {settings.platformFees.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => setPlatform(p.id)}
                      className={`px-3 py-2 rounded-full border ${platform === p.id ? "bg-primary border-primary" : "border-border"}`}
                    >
                      <Text className={`text-xs ${platform === p.id ? "text-primary-foreground" : "text-muted-foreground"}`}>
                        {p.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </CardContent>
          </Card>

          {/* Live verdict */}
          {verdict ? (
            <View>
              <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-0.5">
                Live Verdict
              </Text>
              <VerdictPanel verdict={verdict} />
            </View>
          ) : (
            <View className="rounded-lg border border-border bg-card p-4 items-center">
              <Text className="text-sm text-muted-foreground">
                Fill in the prices above to see your verdict
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-background border-t border-border gap-3">
        <Button size="lg" variant="success" onPress={handleBoughtIt}>
          <Text className="text-base font-semibold text-background">I Bought It →</Text>
        </Button>
        <Button size="default" variant="outline" onPress={handleSaveProspect}>
          Save as Prospect
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
