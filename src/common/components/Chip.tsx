import React from "react";
import { Pressable } from "react-native";
import { Text } from "./Text";
import { cn } from "@/lib/cn";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  leading?: React.ReactNode;
  className?: string;
}

/** 선택할 수 있는 알약 버튼. 즐겨찾기 바로가기, 설문 선택지, 필터에 쓴다 */
export function Chip({ label, selected = false, onPress, leading, className = "" }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={cn("h-control flex-row items-center gap-1.5 rounded-pill border px-3.5", selected ? "border-primary bg-primary-tint" : "border-border bg-bg", className)}
    >
      {leading}
      <Text className={cn("text-body font-sans-semibold", selected ? "text-primary" : "text-text")}>
        {label}
      </Text>
    </Pressable>
  );
}
