import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "@/theme";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const inactive = disabled || loading;

  const background =
    variant === "primary" ? colors.primary : variant === "secondary" ? colors.bg : "transparent";
  const foreground = variant === "primary" ? colors.onPrimary : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={[
        {
          height: 52,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          backgroundColor: background,
          borderWidth: variant === "secondary" ? 1 : 0,
          borderColor: colors.border,
          opacity: inactive ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={foreground} /> : null}
      <Text style={{ fontSize: 16, fontWeight: "700", color: foreground }}>{label}</Text>
    </Pressable>
  );
}
