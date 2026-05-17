import React from "react";
import { View, Text } from "react-native";
import { cn } from "@/lib/utils";

interface PillProps {
  label: string;
  color?: string;
  className?: string;
  textClassName?: string;
  size?: "sm" | "default";
}

export function Pill({ label, color, className, textClassName, size = "default" }: PillProps) {
  return (
    <View
      className={cn(
        "rounded-full items-center justify-center",
        size === "sm" ? "px-2 py-0.5" : "px-3 py-1",
        className
      )}
      style={color ? { backgroundColor: color + "33" } : undefined}
    >
      <Text
        className={cn(
          "font-medium",
          size === "sm" ? "text-xs" : "text-xs",
          textClassName
        )}
        style={color ? { color } : undefined}
      >
        {label}
      </Text>
    </View>
  );
}
