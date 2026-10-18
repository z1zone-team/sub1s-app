import React from "react";
import { View } from "react-native";
import { compactLineLabel, getLineInfo, lineTextColor } from "@/theme";
import { Text } from "./Text";
import { cn } from "@/lib/cn";

interface LineBadgeProps {
  lineId: string;
  /** "급행"처럼 배지 옆에 붙는 짧은 표시 */
  suffix?: string;
  size?: "sm" | "md";
  /** 한 글자 동그라미로 줄인다(예: GTX-A는 G, 경의중앙은 경). 목록처럼 좁은 곳에서 노선이 많을 때 쓴다 */
  compact?: boolean;
}

const BOX = {
  sm: "h-5 min-w-5",
  md: "h-6 min-w-6",
} as const;

const BOX_PADDING = { sm: "px-1.5", md: "px-2" } as const;
const FONT = { sm: "text-caption", md: "text-small" } as const;

/** 한 글자 숫자 호선은 동그랗게, 글자가 긴 노선은 알약 모양으로 보여 준다. 호선 색은 노선마다 달라 style로 준다 */
export function LineBadge({ lineId, suffix, size = "md", compact = false }: LineBadgeProps) {
  const line = getLineInfo(lineId);
  const label = compact ? compactLineLabel(lineId) : line.shortLabel;
  const isRound = label.length === 1;

  return (
    <View className="flex-row items-center gap-1">
      <View
        accessibilityLabel={line.name}
        className={cn("items-center justify-center rounded-pill", BOX[size], isRound ? "" : BOX_PADDING[size])}
        style={{ backgroundColor: line.color }}
      >
        <Text className={cn(FONT[size], "font-sans-bold")} style={{ color: lineTextColor(line.color) }}>
          {label}
        </Text>
      </View>
      {suffix ? <Text className={cn(FONT[size], "font-sans-bold")}>{suffix}</Text> : null}
    </View>
  );
}
