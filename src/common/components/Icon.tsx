import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme";

export type IconName = React.ComponentProps<typeof Ionicons>["name"];
export type IconTone = "text" | "secondary" | "disabled" | "primary" | "onPrimary" | "error";

const TONE_KEY = {
  text: "text",
  secondary: "textSecondary",
  disabled: "textDisabled",
  primary: "primary",
  onPrimary: "onPrimary",
  error: "error",
} as const;

interface IconProps {
  name: IconName;
  size?: number;
  tone?: IconTone;
}

/** 글꼴에 없는 글자(‹ ✕ ■)는 네모로 깨지므로 아이콘은 이 컴포넌트로 그린다. 색은 디자인 토큰 팔레트에서 고른다 */
export function Icon({ name, size = 20, tone = "text" }: IconProps) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={colors[TONE_KEY[tone]]} />;
}
