import React from "react";
import { ActivityIndicator, Pressable } from "react-native";
import { useTheme } from "@/theme";
import { Text } from "./Text";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const CONTAINER: Record<Variant, string> = {
  primary: "bg-primary",
  secondary: "bg-bg border border-border",
  ghost: "bg-transparent",
};

const LABEL: Record<Variant, string> = {
  primary: "text-on-primary",
  secondary: "text-text",
  ghost: "text-text",
};

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  className = "",
}: ButtonProps) {
  const { colors } = useTheme();
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      className={cn("h-control-lg flex-row items-center justify-center gap-2 rounded-md", CONTAINER[variant], inactive ? "opacity-50" : "", className)}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.onPrimary : colors.text} />
      ) : null}
      <Text className={cn("text-base font-sans-bold", LABEL[variant])}>{label}</Text>
    </Pressable>
  );
}
