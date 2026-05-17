import React from "react";
import { Pressable } from "react-native";
import { cn } from "@/lib/utils";

interface FABProps {
  onPress: () => void;
  children: React.ReactNode;
  className?: string;
}

export function FAB({ onPress, children, className }: FABProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center",
        className
      )}
      style={{ elevation: 6 }}
    >
      {children}
    </Pressable>
  );
}
