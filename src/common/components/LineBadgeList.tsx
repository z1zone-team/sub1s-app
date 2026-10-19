import React from "react";
import { View } from "react-native";
import { LineBadge } from "./LineBadge";
import { Text } from "./Text";

interface LineBadgeListProps {
  lineIds: readonly string[];
  /** 보여 줄 노선 수. 넘으면 +N으로 줄인다 */
  max?: number;
  size?: "sm" | "md";
}

/** 목록 한 줄에 붙는 노선 배지. 환승역처럼 노선이 많아도 이름과 날짜를 밀어내지 않게 줄인 모양으로 max개까지만 보이고 나머지는 +N이다 */
export function LineBadgeList({ lineIds, max = 3, size = "sm" }: LineBadgeListProps) {
  if (lineIds.length === 0) return null;
  return (
    <View className="shrink-0 flex-row items-center gap-1">
      {lineIds.slice(0, max).map((lineId) => (
        <LineBadge key={lineId} lineId={lineId} size={size} compact />
      ))}
      {lineIds.length > max ? (
        <Text className="text-caption font-sans-bold text-text-secondary">+{lineIds.length - max}</Text>
      ) : null}
    </View>
  );
}
