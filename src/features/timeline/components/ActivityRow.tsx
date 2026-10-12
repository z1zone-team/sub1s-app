import React from "react";
import { View } from "react-native";
import { Text } from "@/common/components/Text";
import { formatDistanceKm } from "@/common/utils/format";
import { valueParts } from "@/features/guide/arrivedView";

interface ActivityRowProps {
  /** 첫 탑승 호선 색. 왼쪽 4px 세로 막대로 보인다 */
  color: string;
  date: string;
  route: string;
  summary: string;
  distanceKm: number;
  last?: boolean;
}

/** 최근 활동 한 줄: 호선 색 막대, 날짜, 출발 → 도착, 요약, 오른쪽에 큰 거리 숫자 */
export function ActivityRow({ color, date, route, summary, distanceKm, last = false }: ActivityRowProps) {
  const [part] = valueParts(formatDistanceKm(distanceKm));
  return (
    <View className={last ? "flex-row items-center gap-3.5 py-3.5" : "flex-row items-center gap-3.5 border-b border-border py-3.5"}>
      <View className="w-1 self-stretch rounded-pill" style={{ backgroundColor: color }} />
      <View className="flex-1">
        <Text className="text-small text-text-secondary">{date}</Text>
        <Text className="mt-0.5 text-base font-sans-bold">{route}</Text>
        <Text className="mt-0.5 text-small font-sans-bold text-text-secondary">{summary}</Text>
      </View>
      <Text className="text-title font-sans-extrabold">
        {part.number}
        {part.unit ? <Text className="ml-0.5 text-small font-sans-semibold text-text-secondary">{part.unit}</Text> : null}
      </Text>
    </View>
  );
}
