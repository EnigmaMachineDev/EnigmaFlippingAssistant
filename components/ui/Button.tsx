import React from "react";
import { Pressable, Text, type PressableProps } from "react-native";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "ghost" | "destructive" | "success";
type Size = "default" | "sm" | "lg" | "icon";

interface ButtonProps extends PressableProps {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
}

const variantStyles: Record<Variant, string> = {
  default: "bg-primary",
  outline: "border border-border bg-transparent",
  ghost: "bg-transparent",
  destructive: "bg-destructive",
  success: "bg-success",
};

const variantTextStyles: Record<Variant, string> = {
  default: "text-primary-foreground",
  outline: "text-foreground",
  ghost: "text-muted-foreground",
  destructive: "text-white",
  success: "text-background",
};

const sizeStyles: Record<Size, string> = {
  default: "px-4 py-3 rounded-md",
  sm: "px-3 py-2 rounded-md",
  lg: "px-6 py-4 rounded-lg",
  icon: "w-10 h-10 rounded-md items-center justify-center",
};

const sizeTextStyles: Record<Size, string> = {
  default: "text-sm font-medium",
  sm: "text-xs font-medium",
  lg: "text-base font-semibold",
  icon: "text-sm",
};

export function Button({
  variant = "default",
  size = "default",
  children,
  className,
  textClassName,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={cn(
        "flex-row items-center justify-center",
        variantStyles[variant],
        sizeStyles[size],
        disabled && "opacity-50",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {typeof children === "string" ? (
        <Text className={cn(variantTextStyles[variant], sizeTextStyles[size], textClassName)}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
