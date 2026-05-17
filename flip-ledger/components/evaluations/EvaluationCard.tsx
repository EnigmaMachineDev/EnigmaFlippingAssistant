import React from "react";
import { Pressable, View, Text } from "react-native";
import { useRouter } from "expo-router";
import { Card } from "@/components/ui/Card";
import { VerdictBadge } from "@/components/pricing/VerdictBadge";
import { formatCurrency } from "@/lib/format";
import { getBuyVerdict } from "@/lib/pricing";
import { useSettings } from "@/hooks/useSettings";
import { Colors } from "@/constants/colors";
import type { Evaluation } from "@/lib/types";

interface EvaluationCardProps {
  evaluation: Evaluation;
}

export function EvaluationCard({ evaluation }: EvaluationCardProps) {
  const router = useRouter();
  const settings = useSettings();
  const verdict = getBuyVerdict(evaluation, settings);
  const lastOffer = evaluation.offers[evaluation.offers.length - 1];

  return (
    <Pressable onPress={() => router.push(`/evaluate/${evaluation.id}` as any)}>
      <Card className="mx-4">
        <View className="p-4 gap-2">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="text-base font-semibold text-foreground flex-1" numberOfLines={1}>
              {evaluation.title}
            </Text>
            <VerdictBadge verdict={verdict.verdict} size="sm" />
          </View>
          <View className="flex-row items-center gap-4">
            <View>
              <Text className="text-xs text-muted-foreground">Asking</Text>
              <Text className="text-sm font-semibold text-foreground tabular-nums">
                {formatCurrency(evaluation.askingPrice)}
              </Text>
            </View>
            <View>
              <Text className="text-xs text-muted-foreground">Max buy</Text>
              <Text
                className="text-sm font-semibold tabular-nums"
                style={{ color: verdict.maxBuy >= 0 ? Colors.text : Colors.courage }}
              >
                {verdict.maxBuy >= 0 ? formatCurrency(verdict.maxBuy) : "No deal"}
              </Text>
            </View>
            {lastOffer ? (
              <View>
                <Text className="text-xs text-muted-foreground">Last offer</Text>
                <Text className="text-sm font-semibold text-foreground tabular-nums">
                  {formatCurrency(lastOffer.amount)}
                </Text>
              </View>
            ) : null}
          </View>
          {evaluation.source ? (
            <Text className="text-xs text-muted-foreground">{evaluation.source}</Text>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}
