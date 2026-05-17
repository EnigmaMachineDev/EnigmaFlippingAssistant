import React, { useState } from "react";
import {
  ScrollView, View, Text, Pressable, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "@/lib/store";
import { useSettings } from "@/hooks/useSettings";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { nowISO } from "@/lib/format";
import { Colors } from "@/constants/colors";
import type { ItemKind, ItemStatus } from "@/lib/types";

const STATUS_OPTIONS: ItemStatus[] = ["sourcing", "acquired", "in_progress", "listed"];

export default function NewItemScreen() {
  const router = useRouter();
  const addItem = useStore((s) => s.addItem);
  const settings = useSettings();

  const [kind, setKind] = useState<ItemKind>("flip");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<ItemStatus>("acquired");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [acquiredAt, setAcquiredAt] = useState(nowISO().slice(0, 10));
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setError("");
    addItem({
      kind,
      title: title.trim(),
      category: category.trim() || undefined,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      status,
      photos: [],
      purchasePrice: kind === "flip" && purchasePrice ? parseFloat(purchasePrice) : undefined,
      acquiredAt: acquiredAt || undefined,
      source: source.trim() || undefined,
      costs: [],
      comps: [],
      notes: notes.trim() || undefined,
    });
    router.back();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-4 pt-6 gap-4">
          {/* Kind toggle */}
          <Card>
            <CardHeader>
              <CardTitle>Type</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="flex-row gap-3">
                {(["flip", "build"] as ItemKind[]).map((k) => (
                  <Pressable
                    key={k}
                    onPress={() => setKind(k)}
                    className={`flex-1 py-3 rounded-md items-center border ${kind === k ? "bg-primary border-primary" : "border-border bg-transparent"}`}
                  >
                    <Text
                      className={`text-sm font-medium capitalize ${kind === k ? "text-primary-foreground" : "text-muted-foreground"}`}
                    >
                      {k}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Basics */}
          <Card>
            <CardHeader><CardTitle>Basics</CardTitle></CardHeader>
            <CardContent className="gap-4">
              <Input
                label="Title *"
                value={title}
                onChangeText={setTitle}
                placeholder="1978 Fender Stratocaster"
                error={error}
              />
              <Input
                label="Category"
                value={category}
                onChangeText={setCategory}
                placeholder="Guitar"
              />
              <Input
                label="Tags (comma-separated)"
                value={tags}
                onChangeText={setTags}
                placeholder="vintage, electric"
              />
            </CardContent>
          </Card>

          {/* Status */}
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
                    <Text
                      className={`text-xs font-medium capitalize ${status === s ? "text-primary-foreground" : "text-muted-foreground"}`}
                    >
                      {s.replace("_", " ")}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Acquisition */}
          {kind === "flip" ? (
            <Card>
              <CardHeader><CardTitle>Acquisition</CardTitle></CardHeader>
              <CardContent className="gap-4">
                <Input
                  label="Purchase Price ($)"
                  keyboardType="numeric"
                  value={purchasePrice}
                  onChangeText={setPurchasePrice}
                  prefix="$"
                  placeholder="0.00"
                />
                <Input
                  label="Acquired Date"
                  value={acquiredAt}
                  onChangeText={setAcquiredAt}
                  placeholder="YYYY-MM-DD"
                />
                <Input
                  label="Source"
                  value={source}
                  onChangeText={setSource}
                  placeholder="Facebook Marketplace"
                />
              </CardContent>
            </Card>
          ) : null}

          {/* Notes */}
          <Card>
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent>
              <Input
                label=""
                value={notes}
                onChangeText={setNotes}
                placeholder="Any notes about this item…"
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: "top" }}
              />
            </CardContent>
          </Card>
        </View>
      </ScrollView>

      {/* Sticky save */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-3 bg-background border-t border-border">
        <Button size="lg" onPress={handleSave}>Save Item</Button>
      </View>
    </KeyboardAvoidingView>
  );
}
