import React from "react";
import { Pressable } from "react-native";
import { Text } from "./Text";
import { cn } from "@/lib/cn";

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  leading?: React.ReactNode;
  /** 지도 위 바로가기처럼 낮은 칩(36px). 기본은 터치 영역 44px */
  compact?: boolean;
  className?: string;
}

/** 선택할 수 있는 알약 버튼. 즐겨찾기 바로가기, 설문 선택지, 필터에 쓴다 */
export function Chip({ label, selected = false, onPress, onLongPress, leading, compact = false, className = "" }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      onLongPress={onLongPress}
      className={cn(compact ? "h-9" : "h-control", "flex-row items-center gap-1.5 rounded-pill border px-3.5", selected ? "border-primary bg-primary-tint" : "border-border bg-bg", className)}
    >
      {leading}
      <Text className={cn("text-body font-sans-semibold", selected ? "text-primary" : "text-text")}>
        {label}
      </Text>
    </Pressable>
  );
}
