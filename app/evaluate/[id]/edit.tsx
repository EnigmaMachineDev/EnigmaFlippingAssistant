import React, { useState } from "react";
import {
  ScrollView, View, Text, Pressable, KeyboardAvoidingView, Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEvaluation } from "@/hooks/useEvaluations";
import { useStore } from "@/lib/store";
import { useSettings } from "@/hooks/useSettings";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

export default function EditEvaluationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const evaluation = useEvaluation(id);
  const updateEvaluation = useStore((s) => s.updateEvaluation);
  const settings = useSettings();

  const [title, setTitle] = useState(evaluation?.title ?? "");
  const [source, setSource] = useState(evaluation?.source ?? "");
  const [listingUrl, setListingUrl] = useState(evaluation?.listingUrl ?? "");
  const [askingPrice, setAskingPrice] = useState(evaluation?.askingPrice ? String(evaluation.askingPrice) : "");
  const [retailPrice, setRetailPrice] = useState(evaluation?.retailPrice ? String(evaluation.retailPrice) : "");
  const [buyPctOfRetail, setBuyPctOfRetail] = useState(evaluation?.targetBuyPctOfRetail != null ? String(evaluation.targetBuyPctOfRetail) : "");
  const [estSale, setEstSale] = useState(evaluation?.estimatedSalePrice ? String(evaluation.estimatedSalePrice) : "");
  const [estRefurb, setEstRefurb] = useState(evaluation?.estimatedRefurbCost ? String(evaluation.estimatedRefurbCost) : "0");
  const [estLabor, setEstLabor] = useState(evaluation?.estimatedLaborHours ? String(evaluation.estimatedLaborHours) : "0");
  const [platform, setPlatform] = useState(evaluation?.intendedSellPlatform ?? settings.defaultPlatform ?? "local");
  const [error, setError] = useState("");

  if (!evaluation) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">Evaluation not found</Text>
      </View>
    );
  }

  const handleSave = () => {
    if (!title.trim()) { setError("Title required"); return; }
    const asking = parseFloat(askingPrice);
    const retail = parseFloat(retailPrice);
    const sale = parseFloat(estSale);
    const hasRetail = !isNaN(retail) && retail > 0;
    const hasSale = !isNaN(sale) && sale > 0;
    if (isNaN(asking)) { setError("Enter asking price"); return; }
    if (!hasRetail && !hasSale) { setError("Enter retail price or estimated sale price"); return; }
    setError("");
    updateEvaluation(evaluation.id, {
      title: title.trim(),
      source: source.trim() || undefined,
      listingUrl: listingUrl.trim() || undefined,
      askingPrice: asking,
      retailPrice: hasRetail ? retail : undefined,
      targetBuyPctOfRetail: buyPctOfRetail ? parseFloat(buyPctOfRetail) : undefined,
      estimatedSalePrice: hasSale ? sale : 0,
      estimatedRefurbCost: parseFloat(estRefurb) || 0,
      estimatedLaborHours: parseFloat(estLabor) || 0,
      intendedSellPlatform: platform,
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-4 pt-6 gap-4">
          {error ? <Text className="text-destructive text-sm">{error}</Text> : null}
          <Card>
            <CardHeader><CardTitle>Deal Info</CardTitle></CardHeader>
            <CardContent className="gap-4">
              <Input label="Title *" value={title} onChangeText={setTitle} />
              <Input label="Source" value={source} onChangeText={setSource} />
              <Input label="Listing URL" value={listingUrl} onChangeText={setListingUrl} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Numbers</CardTitle></CardHeader>
            <CardContent className="gap-4">
              <Input label="Asking Price ($)" keyboardType="numeric" prefix="$" value={askingPrice} onChangeText={setAskingPrice} />
              <Input label="Retail Price ($)" keyboardType="numeric" prefix="$" value={retailPrice} onChangeText={setRetailPrice} placeholder="200" />
              <Input
                label={`Buy target % of retail (default: ${settings.defaultBuyPctOfRetail}%)`}
                keyboardType="numeric"
                value={buyPctOfRetail}
                onChangeText={setBuyPctOfRetail}
                placeholder={String(settings.defaultBuyPctOfRetail)}
              />
              <Input label="Estimated Sale Price ($)" keyboardType="numeric" prefix="$" value={estSale} onChangeText={setEstSale} />
              <Input label="Estimated Refurb Cost ($)" keyboardType="numeric" prefix="$" value={estRefurb} onChangeText={setEstRefurb} />
              <Input label="Estimated Labor Hours" keyboardType="numeric" value={estLabor} onChangeText={setEstLabor} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Sell Platform</CardTitle></CardHeader>
            <CardContent>
              <View className="flex-row flex-wrap gap-2">
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
            </CardContent>
          </Card>
        </View>
      </ScrollView>
      <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-background border-t border-border">
        <Button size="lg" onPress={handleSave}>Save Changes</Button>
      </View>
    </KeyboardAvoidingView>
  );
}
