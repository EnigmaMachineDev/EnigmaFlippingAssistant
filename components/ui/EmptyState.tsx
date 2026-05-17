import React from "react";
import { View, Text } from "react-native";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <View className={cn("flex-1 items-center justify-center px-8 py-16 gap-4", className)}>
      {icon ? (
        <View className="w-16 h-16 rounded-full bg-muted items-center justify-center">
          {icon}
        </View>
      ) : null}
      <Text className="text-lg font-semibold text-foreground text-center">{title}</Text>
      {description ? (
        <Text className="text-sm text-muted-foreground text-center">{description}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button onPress={onAction} className="mt-2">
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
