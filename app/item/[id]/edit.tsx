import React, { useState } from "react";
import {
  ScrollView, View, Text, Pressable, KeyboardAvoidingView, Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useItem } from "@/hooks/useItems";
import { useStore } from "@/lib/store";
import { useSettings } from "@/hooks/useSettings";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import type { ItemStatus } from "@/lib/types";

const STATUS_OPTIONS: ItemStatus[] = ["sourcing", "acquired", "in_progress", "listed", "sold", "lost"];

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const item = useItem(id);
  const updateItem = useStore((s) => s.updateItem);
  const settings = useSettings();

  const [title, setTitle] = useState(item?.title ?? "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [tags, setTags] = useState(item?.tags.join(", ") ?? "");
  const [status, setStatus] = useState<ItemStatus>(item?.status ?? "acquired");
  const [purchasePrice, setPurchasePrice] = useState(item?.purchasePrice ? String(item.purchasePrice) : "");
  const [acquiredAt, setAcquiredAt] = useState(item?.acquiredAt?.slice(0, 10) ?? "");
  const [source, setSource] = useState(item?.source ?? "");
  const [listedPrice, setListedPrice] = useState(item?.listedPrice ? String(item.listedPrice) : "");
  const [listedPlatform, setListedPlatform] = useState(item?.listedPlatform ?? settings.defaultPlatform ?? "");
  const [soldPrice, setSoldPrice] = useState(item?.soldPrice ? String(item.soldPrice) : "");
  const [soldPlatform, setSoldPlatform] = useState(item?.soldPlatform ?? settings.defaultPlatform ?? "");
  const [soldAt, setSoldAt] = useState(item?.soldAt?.slice(0, 10) ?? "");
  const [targetMarginPct, setTargetMarginPct] = useState(
    item?.targetMarginPct != null ? String(item.targetMarginPct) : ""
  );
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [error, setError] = useState("");

  if (!item) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">Item not found</Text>
      </View>
    );
  }

  const handleSave = () => {
    if (!title.trim()) { setError("Title required"); return; }
    setError("");
    updateItem(item.id, {
      title: title.trim(),
      category: category.trim() || undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      status,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      acquiredAt: acquiredAt || undefined,
      source: source.trim() || undefined,
      listedPrice: listedPrice ? parseFloat(listedPrice) : undefined,
      listedPlatform: listedPlatform || undefined,
      soldPrice: soldPrice ? parseFloat(soldPrice) : undefined,
      soldPlatform: soldPlatform || undefined,
      soldAt: soldAt || undefined,
      targetMarginPct: targetMarginPct ? parseFloat(targetMarginPct) : undefined,
      notes: notes.trim() || undefined,
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
          <Card>
            <CardHeader><CardTitle>Basics</CardTitle></CardHeader>
            <CardContent className="gap-4">
              <Input label="Title *" value={title} onChangeText={setTitle} error={error} />
              <Input label="Category" value={category} onChangeText={setCategory} placeholder="Guitar" />
              <Input label="Tags (comma-separated)" value={tags} onChangeText={setTags} placeholder="vintage, electric" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Status</CardTitle></CardHeader>
            <CardContent>
              <View className="flex-row flex-wrap gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setStatus(s)}
                    className={`px-3 py-2 rounded-full border ${status === s ? "bg-primary border-primary" : "border-border"}`}
                  >
                    <Text className={`text-xs font-medium capitalize ${status === s ? "text-primary-foreground" : "text-muted-foreground"}`}>
                      {s.replace("_", " ")}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </CardContent>
          </Card>

          {item.kind === "flip" ? (
            <Card>
              <CardHeader><CardTitle>Acquisition</CardTitle></CardHeader>
              <CardContent className="gap-4">
                <Input label="Purchase Price ($)" keyboardType="numeric" prefix="$" value={purchasePrice} onChangeText={setPurchasePrice} placeholder="0.00" />
                <Input label="Acquired Date" value={acquiredAt} onChangeText={setAcquiredAt} placeholder="YYYY-MM-DD" />
                <Input label="Source" value={source} onChangeText={setSource} placeholder="Facebook Marketplace" />
              </CardContent>
            </Card>
          ) : null}

          {(status === "listed" || status === "sold") ? (
            <Card>
              <CardHeader><CardTitle>Listing</CardTitle></CardHeader>
              <CardContent className="gap-4">
                <Input label="Listed Price ($)" keyboardType="numeric" prefix="$" value={listedPrice} onChangeText={setListedPrice} />
                <Input label="Platform" value={listedPlatform} onChangeText={setListedPlatform} placeholder="Reverb" />
              </CardContent>
            </Card>
          ) : null}

          {status === "sold" ? (
            <Card>
              <CardHeader><CardTitle>Sale</CardTitle></CardHeader>
              <CardContent className="gap-4">
                <Input label="Sold Price ($)" keyboardType="numeric" prefix="$" value={soldPrice} onChangeText={setSoldPrice} />
                <Input label="Sold Platform" value={soldPlatform} onChangeText={setSoldPlatform} />
                <Input label="Sold Date" value={soldAt} onChangeText={setSoldAt} placeholder="YYYY-MM-DD" />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader><CardTitle>Pricing Override</CardTitle></CardHeader>
            <CardContent className="gap-4">
              <Input
                label={`Target Margin % (default: ${settings.targetMarginPct}%)`}
                keyboardType="numeric"
                value={targetMarginPct}
                onChangeText={setTargetMarginPct}
                placeholder={`${settings.targetMarginPct} (from settings)`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent>
              <Input label="" value={notes} onChangeText={setNotes} placeholder="Notes…" multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: "top" }} />
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
