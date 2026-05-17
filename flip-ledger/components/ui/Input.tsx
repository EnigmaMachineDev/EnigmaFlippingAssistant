import React, { forwardRef } from "react";
import { TextInput, View, Text, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  className?: string;
  prefix?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, className, prefix, ...props }, ref) => {
    return (
      <View className="gap-1">
        {label ? (
          <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </Text>
        ) : null}
        <View
          className={cn(
            "flex-row items-center bg-input border rounded-md",
            error ? "border-destructive" : "border-border",
          )}
        >
          {prefix ? (
            <Text className="pl-3 text-sm text-muted-foreground">{prefix}</Text>
          ) : null}
          <TextInput
            ref={ref}
            className={cn(
              "flex-1 px-3 py-3 text-sm text-foreground",
              prefix && "pl-1",
              className
            )}
            placeholderTextColor="#7a9f7a"
            {...props}
          />
        </View>
        {error ? (
          <Text className="text-xs text-destructive">{error}</Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = "Input";
