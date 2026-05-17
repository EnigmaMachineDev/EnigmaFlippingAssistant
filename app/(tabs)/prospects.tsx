import React, { useMemo, useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Plus, Calculator, ChevronDown, ChevronUp } from "lucide-react-native";
import { FAB } from "@/components/ui/FAB";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { EvaluationCard } from "@/components/evaluations/EvaluationCard";
import { useEvaluations } from "@/hooks/useEvaluations";
import { Colors } from "@/constants/colors";
import { daysAgo } from "@/lib/format";

export default function ProspectsScreen() {
  const router = useRouter();
  const evaluations = useEvaluations();
  const [showWalkAways, setShowWalkAways] = useState(false);

  const pending = useMemo(
    () =>
      evaluations
        .filter((e) => e.outcome === "pending")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [evaluations]
  );

  const recentWalkAways = useMemo(
    () =>
      evaluations
        .filter(
          (e) =>
            (e.outcome === "walked" || e.outcome === "lost_to_other_buyer") &&
            daysAgo(e.updatedAt) <= 30
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [evaluations]
  );

  const converted = useMemo(
    () =>
      evaluations
        .filter((e) => e.outcome === "bought")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 10),
    [evaluations]
  );

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }}>
        {/* CTA */}
        <View className="px-4 pt-6 pb-4 gap-3">
          <Text className="text-xl font-bold text-foreground">Buy Calculator</Text>
          <Text className="text-sm text-muted-foreground">
            Evaluate any deal before you spend a dollar.
          </Text>
          <Button
            size="lg"
            onPress={() => router.push("/evaluate/new" as any)}
            className="flex-row gap-2"
          >
            <Calculator size={18} color={Colors.text} />
            <Text className="text-base font-semibold text-primary-foreground">
              Evaluate a Buy
            </Text>
          </Button>
        </View>

        {/* Active prospects */}
        {pending.length > 0 ? (
          <Section title={`Active Prospects (${pending.length})`} className="mt-2">
            <View className="gap-2">
              {pending.map((ev) => (
                <EvaluationCard key={ev.id} evaluation={ev} />
              ))}
            </View>
          </Section>
        ) : (
          <View className="px-4 py-6">
            <EmptyState
              icon={<Calculator size={28} color={Colors.muted} />}
              title="No active prospects"
              description="Tap 'Evaluate a Buy' to analyse a deal before you commit."
            />
          </View>
        )}

        {/* Walk-aways */}
        {recentWalkAways.length > 0 ? (
          <View className="mt-6">
            <Pressable
              onPress={() => setShowWalkAways((v) => !v)}
              className="flex-row items-center justify-between px-4 mb-3"
            >
              <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Walk-Aways ({recentWalkAways.length})
              </Text>
              {showWalkAways ? (
                <ChevronUp size={16} color={Colors.muted} />
              ) : (
                <ChevronDown size={16} color={Colors.muted} />
              )}
            </Pressable>
            {showWalkAways ? (
              <View className="gap-2">
                {recentWalkAways.map((ev) => (
                  <EvaluationCard key={ev.id} evaluation={ev} />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Converted */}
        {converted.length > 0 ? (
          <Section title={`Converted (${converted.length})`} className="mt-6">
            <View className="gap-2">
              {converted.map((ev) => (
                <EvaluationCard key={ev.id} evaluation={ev} />
              ))}
            </View>
          </Section>
        ) : null}
      </ScrollView>

      <FAB onPress={() => router.push("/evaluate/new" as any)}>
        <Plus size={24} color={Colors.text} />
      </FAB>
    </View>
  );
}
