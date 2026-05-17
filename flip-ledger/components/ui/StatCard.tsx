import React from "react";
import { View, Text } from "react-native";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ label, value, sub, valueColor, icon, className }: StatCardProps) {
  return (
    <View className={cn("flex-1 rounded-lg border border-border bg-card p-4 gap-1", className)}>
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-xs text-muted-foreground uppercase tracking-wider">{label}</Text>
        {icon}
      </View>
      <Text
        className="text-2xl font-bold"
        style={valueColor ? { color: valueColor } : { color: "#c8e6c8" }}
      >
        {value}
      </Text>
      {sub ? <Text className="text-xs text-muted-foreground">{sub}</Text> : null}
    </View>
  );
}
