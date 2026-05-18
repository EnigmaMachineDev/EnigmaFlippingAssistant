import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Alert,
  Pressable,
  TextInput,
} from "react-native";
import {
  Download,
  Upload,
  Trash2,
  Plus,
  Pencil,
  Save,
  X,
} from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { useSettings, useSettingsActions } from "@/hooks/useSettings";
import { useStore } from "@/lib/store";
import { useItems } from "@/hooks/useItems";
import { useEvaluations } from "@/hooks/useEvaluations";
import { exportJSON, exportCSV, readImportFile } from "@/lib/importExport";
import { formatCurrency } from "@/lib/format";
import { Colors } from "@/constants/colors";
import type { PlatformFee } from "@/lib/types";

function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function SettingsScreen() {
  const settings = useSettings();
  const { updateSettings } = useSettingsActions();
  const items = useItems();
  const evaluations = useEvaluations();
  const replaceAll = useStore((s) => s.replaceAll);
  const resetAll = useStore((s) => s.resetAll);

  const [editingFee, setEditingFee] = useState<PlatformFee | null>(null);
  const [newFee, setNewFee] = useState(false);
  const [feeName, setFeeName] = useState("");
  const [feePct, setFeePct] = useState("");
  const [feeFlat, setFeeFlat] = useState("");

  const handleExportJSON = async () => {
    try {
      await exportJSON(items, evaluations, settings);
    } catch (e: any) {
      Alert.alert("Export failed", e.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      await exportCSV(items, evaluations);
    } catch (e: any) {
      Alert.alert("Export failed", e.message);
    }
  };

  const handleImport = async () => {
    const preview = await readImportFile();
    if (!preview.valid || !preview.data) {
      Alert.alert("Import failed", preview.error ?? "Invalid file");
      return;
    }
    Alert.alert(
      "Import Data",
      `This will import ${preview.items} items and ${preview.evaluations} evaluations. Existing data will be replaced.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import",
          onPress: () => {
            replaceAll(preview.data!.items, preview.data!.evaluations, preview.data!.settings);
            Alert.alert("Done", "Data imported successfully.");
          },
        },
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      "Reset All Data",
      "This permanently deletes everything. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "I'm sure, reset everything",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you absolutely sure?",
              "All items, evaluations, and settings will be wiped.",
              [
                { text: "Cancel", style: "cancel" },
                { text: "Yes, delete everything", style: "destructive", onPress: resetAll },
              ]
            );
          },
        },
      ]
    );
  };

  const saveFee = () => {
    const pct = parseFloat(feePct);
    const flat = parseFloat(feeFlat) || 0;
    if (!feeName.trim() || isNaN(pct)) return;

    if (editingFee) {
      updateSettings({
        platformFees: settings.platformFees.map((f) =>
          f.id === editingFee.id
            ? { ...f, name: feeName.trim(), percent: pct, flatFee: flat }
            : f
        ),
      });
    } else {
      updateSettings({
        platformFees: [
          ...settings.platformFees,
          { id: uuid(), name: feeName.trim(), percent: pct, flatFee: flat },
        ],
      });
    }
    setEditingFee(null);
    setNewFee(false);
    setFeeName("");
    setFeePct("");
    setFeeFlat("");
  };

  const startEdit = (fee: PlatformFee) => {
    setEditingFee(fee);
    setFeeName(fee.name);
    setFeePct(String(fee.percent));
    setFeeFlat(fee.flatFee ? String(fee.flatFee) : "");
    setNewFee(false);
  };

  const startNew = () => {
    setNewFee(true);
    setEditingFee(null);
    setFeeName("");
    setFeePct("");
    setFeeFlat("");
  };

  const deleteFee = (id: string) => {
    Alert.alert("Delete platform?", "Remove this fee?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          updateSettings({ platformFees: settings.platformFees.filter((f) => f.id !== id) }),
      },
    ]);
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      <View className="px-4 pt-6 pb-2">
        <Text className="text-2xl font-bold text-foreground">Settings</Text>
      </View>

      {/* Pricing rules */}
      <Section title="Pricing Rules" className="mt-6">
        <Card className="mx-4">
          <CardContent className="pt-4 gap-4">
            <Input
              label="Min Profit Floor ($)"
              keyboardType="numeric"
              value={String(settings.minProfitFloor)}
              onChangeText={(v) => updateSettings({ minProfitFloor: parseFloat(v) || 0 })}
            />
            <Input
              label="Target Margin (%)"
              keyboardType="numeric"
              value={String(settings.targetMarginPct)}
              onChangeText={(v) => updateSettings({ targetMarginPct: parseFloat(v) || 0 })}
            />
            <Input
              label="Hourly Labor Rate ($)"
              keyboardType="numeric"
              value={String(settings.hourlyLaborRate)}
              onChangeText={(v) => updateSettings({ hourlyLaborRate: parseFloat(v) || 0 })}
            />
            <Input
              label="Monthly Profit Goal ($, optional)"
              keyboardType="numeric"
              value={settings.monthlyProfitGoal ? String(settings.monthlyProfitGoal) : ""}
              onChangeText={(v) =>
                updateSettings({ monthlyProfitGoal: parseFloat(v) || undefined })
              }
              placeholder="e.g. 500"
            />
            <Input
              label="Stale Listing Days"
              keyboardType="numeric"
              value={String(settings.remindAfterListedDays)}
              onChangeText={(v) =>
                updateSettings({ remindAfterListedDays: parseInt(v) || 30 })
              }
            />
          </CardContent>
        </Card>
      </Section>

      {/* Platform fees */}
      <Section
        title="Platform Fees"
        className="mt-6"
        right={
          <Pressable onPress={startNew} className="flex-row items-center gap-1">
            <Plus size={14} color={Colors.bright} />
            <Text className="text-xs text-bright">Add</Text>
          </Pressable>
        }
      >
        <Card className="mx-4">
          <CardContent className="pt-4 gap-2">
            {(settings.platformFees ?? []).map((fee) => (
              <View key={fee.id}>
                {editingFee?.id === fee.id ? (
                  <FeeEditor
                    name={feeName}
                    pct={feePct}
                    flat={feeFlat}
                    onChangeName={setFeeName}
                    onChangePct={setFeePct}
                    onChangeFlat={setFeeFlat}
                    onSave={saveFee}
                    onCancel={() => { setEditingFee(null); }}
                  />
                ) : (
                  <View className="flex-row items-center justify-between py-2 border-b border-border">
                    <View>
                      <Text className="text-sm font-medium text-foreground">{fee.name}</Text>
                      <Text className="text-xs text-muted-foreground">
                        {fee.percent}%{fee.flatFee ? ` + ${formatCurrency(fee.flatFee)}` : ""}
                      </Text>
                    </View>
                    <View className="flex-row gap-3">
                      <Pressable onPress={() => startEdit(fee)}>
                        <Pencil size={16} color={Colors.muted} />
                      </Pressable>
                      <Pressable onPress={() => deleteFee(fee.id)}>
                        <Trash2 size={16} color={Colors.courage} />
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            ))}
            {newFee ? (
              <FeeEditor
                name={feeName}
                pct={feePct}
                flat={feeFlat}
                onChangeName={setFeeName}
                onChangePct={setFeePct}
                onChangeFlat={setFeeFlat}
                onSave={saveFee}
                onCancel={() => setNewFee(false)}
              />
            ) : null}
          </CardContent>
        </Card>
      </Section>

      {/* Data */}
      <Section title="Data" className="mt-6">
        <View className="mx-4 gap-3">
          <Button variant="outline" onPress={handleExportJSON} className="flex-row gap-2">
            <Download size={16} color={Colors.text} />
            <Text className="text-sm font-medium text-foreground">Export JSON (Full Backup)</Text>
          </Button>
          <Button variant="outline" onPress={handleExportCSV} className="flex-row gap-2">
            <Download size={16} color={Colors.text} />
            <Text className="text-sm font-medium text-foreground">Export CSV</Text>
          </Button>
          <Button variant="outline" onPress={handleImport} className="flex-row gap-2">
            <Upload size={16} color={Colors.text} />
            <Text className="text-sm font-medium text-foreground">Import JSON</Text>
          </Button>
          <Button variant="destructive" onPress={handleReset} className="flex-row gap-2 mt-2">
            <Trash2 size={16} color="#fff" />
            <Text className="text-sm font-medium text-white">Reset All Data</Text>
          </Button>
        </View>
      </Section>

      {/* About */}
      <Section title="About" className="mt-6">
        <Card className="mx-4">
          <CardContent className="pt-4 gap-1">
            <Text className="text-sm text-foreground font-medium">Flip Ledger</Text>
            <Text className="text-xs text-muted-foreground">Version 1.0.0</Text>
            <Text className="text-xs text-muted-foreground">
              Schema version {settings.schemaVersion}
            </Text>
            <Text className="text-xs text-muted-foreground mt-2">
              All data stored locally on your device. No cloud, no accounts.
            </Text>
          </CardContent>
        </Card>
      </Section>
    </ScrollView>
  );
}

function FeeEditor({
  name, pct, flat, onChangeName, onChangePct, onChangeFlat, onSave, onCancel,
}: {
  name: string; pct: string; flat: string;
  onChangeName: (v: string) => void;
  onChangePct: (v: string) => void;
  onChangeFlat: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <View className="gap-2 py-2 border-b border-border">
      <Input label="Name" value={name} onChangeText={onChangeName} placeholder="Reverb" />
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Input label="%" keyboardType="numeric" value={pct} onChangeText={onChangePct} placeholder="5" />
        </View>
        <View className="flex-1">
          <Input label="Flat fee $" keyboardType="numeric" value={flat} onChangeText={onChangeFlat} placeholder="0" />
        </View>
      </View>
      <View className="flex-row gap-2">
        <Button size="sm" onPress={onSave} className="flex-1 gap-1">
          <Save size={13} color={Colors.text} />
          <Text className="text-xs font-medium text-primary-foreground">Save</Text>
        </Button>
        <Button size="sm" variant="ghost" onPress={onCancel} className="flex-1 gap-1">
          <X size={13} color={Colors.muted} />
          <Text className="text-xs font-medium text-muted-foreground">Cancel</Text>
        </Button>
      </View>
    </View>
  );
}
