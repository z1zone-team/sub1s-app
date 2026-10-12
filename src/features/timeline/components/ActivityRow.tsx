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
  /** 이동 지도 시트용 촘촘한 줄: 날짜와 요약이 한 줄이고 글자가 한 단계 작다 */
  compact?: boolean;
}

/** 최근 활동 한 줄: 호선 색 막대, 날짜, 출발 → 도착, 요약, 오른쪽에 큰 거리 숫자 */
export function ActivityRow({ color, date, route, summary, distanceKm, last = false, compact = false }: ActivityRowProps) {
  const [part] = valueParts(formatDistanceKm(distanceKm));
  const border = last ? "" : "border-b border-border";
  if (compact) {
    return (
      <View className={`flex-row items-center gap-3 py-3 ${border}`}>
        <View className="h-8.5 w-1 rounded-pill" style={{ backgroundColor: color }} />
        <View className="flex-1">
          <Text className="text-subtitle font-sans-bold">{route}</Text>
          <Text className="mt-0.5 text-small text-text-secondary">
            {date} · {summary}
          </Text>
        </View>
        <Text className="text-base font-sans-bold">
          {part.number}
          {part.unit ? <Text className="ml-0.5 text-small font-sans-semibold text-text-secondary">{part.unit}</Text> : null}
        </Text>
      </View>
    );
  }
  return (
    <View className={`flex-row items-center gap-3.5 py-3.5 ${border}`}>
      <View className="w-1 self-stretch rounded-pill" style={{ backgroundColor: color }} />
      <View className="flex-1">
        <Text className="text-small text-text-secondary">{date}</Text>
        <Text className="mt-0.5 text-base font-sans-bold">{route}</Text>
        <Text className="mt-0.5 text-small font-sans-bold text-text-secondary">{summary}</Text>
      </View>
      <Text className="text-title font-sans-bold">
        {part.number}
        {part.unit ? <Text className="ml-0.5 text-small font-sans-semibold text-text-secondary">{part.unit}</Text> : null}
      </Text>
    </View>
  );
}
