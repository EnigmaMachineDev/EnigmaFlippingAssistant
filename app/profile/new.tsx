import React, { useState } from "react";
import { ScrollView, View, Text, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { PROFILE_PRESETS } from "@/lib/seed";
import { useProfileActions } from "@/hooks/useProfile";
import { Button } from "@/components/ui/Button";
import { Colors } from "@/constants/colors";

const EMOJI_OPTIONS = ["🔄", "🎸", "🪑", "🎨", "📦", "🔨", "🛒", "🪴", "📷", "👗", "🎮", "💿"];

export default function NewProfileScreen() {
  const router = useRouter();
  const { addProfile, setActiveProfile } = useProfileActions();

  const [name, setName] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(PROFILE_PRESETS[0].key);
  const [selectedEmoji, setSelectedEmoji] = useState(PROFILE_PRESETS[0].emoji);

  const preset = PROFILE_PRESETS.find((p) => p.key === selectedPreset) ?? PROFILE_PRESETS[0];

  const handlePresetSelect = (key: string) => {
    const p = PROFILE_PRESETS.find((pr) => pr.key === key);
    setSelectedPreset(key);
    if (p) setSelectedEmoji(p.emoji);
  };

  const handleCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Give this profile a name.");
      return;
    }
    const profile = addProfile({
      name: trimmed,
      emoji: selectedEmoji,
      kind: preset.kind,
      settings: preset.settings,
    });
    setActiveProfile(profile.id);
    router.replace("/(tabs)" as any);
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, gap: 20 }}>
      <View className="pt-4">
        <Text className="text-2xl font-bold text-foreground">New Profile</Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Each profile has its own items, settings, and expenses.
        </Text>
      </View>

      {/* Name */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-foreground">Name</Text>
        <TextInput
          className="bg-input border border-border rounded-lg px-4 py-3 text-sm text-foreground"
          placeholder="e.g. Guitar Flipping, Art Prints..."
          placeholderTextColor={Colors.muted}
          value={name}
          onChangeText={setName}
          autoFocus
        />
      </View>

      {/* Emoji */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-foreground">Icon</Text>
        <View className="flex-row flex-wrap gap-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => setSelectedEmoji(emoji)}
              className="w-11 h-11 rounded-lg items-center justify-center border"
              style={{
                borderColor: selectedEmoji === emoji ? Colors.bright : Colors.border,
                backgroundColor: selectedEmoji === emoji ? Colors.green + "30" : Colors.card,
              }}
            >
              <Text className="text-xl">{emoji}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Preset */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-foreground">Type</Text>
        <View className="gap-2">
          {PROFILE_PRESETS.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => handlePresetSelect(p.key)}
              className="rounded-lg border p-4 gap-1"
              style={{
                borderColor: selectedPreset === p.key ? Colors.bright : Colors.border,
                backgroundColor: selectedPreset === p.key ? Colors.green + "15" : Colors.card,
              }}
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-xl">{p.emoji}</Text>
                <Text className="text-sm font-semibold text-foreground">{p.label}</Text>
                <View
                  className="ml-auto px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: p.kind === "catalog" ? Colors.grace + "30" : Colors.green + "30" }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: p.kind === "catalog" ? Colors.grace : Colors.bright }}
                  >
                    {p.kind === "catalog" ? "Catalog" : "Flip"}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-muted-foreground">{p.description}</Text>
              <Text className="text-xs text-muted-foreground mt-1">
                Defaults: {p.settings.targetMarginPct}% margin · ${p.settings.minProfitFloor} min profit · ${p.settings.hourlyLaborRate}/hr
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Button onPress={handleCreate} disabled={!name.trim()}>
        <Text className="text-sm font-semibold text-primary-foreground">Create Profile</Text>
      </Button>
    </ScrollView>
  );
}
