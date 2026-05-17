import React from "react";
import { View, Text } from "react-native";
import { cn } from "@/lib/utils";

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  right?: React.ReactNode;
}

export function Section({ title, children, className, right }: SectionProps) {
  return (
    <View className={cn("gap-3", className)}>
      {title ? (
        <View className="flex-row items-center justify-between px-4">
          <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </Text>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}
