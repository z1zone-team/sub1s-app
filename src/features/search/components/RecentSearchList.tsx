import React from "react";
import { Pressable, View } from "react-native";
import { DesignIcon } from "@/common/components/DesignIcon";
import { LineBadgeList } from "@/common/components/LineBadgeList";
import { Text } from "@/common/components/Text";
import { formatMonthDayKst } from "@/common/utils/format";
import { cn } from "@/lib/cn";
import type { RouteEndpoint } from "@/features/routing/endpoint";
import type { useRecentDestinations } from "@/features/routing/useRecentDestinations";

/** 한 항목에 보여 줄 노선 배지 수. 넘으면 +N으로 줄인다 */
const MAX_BADGES = 2;

interface RecentSearchListProps {
  recent: ReturnType<typeof useRecentDestinations>;
  onSelect: (endpoint: RouteEndpoint) => void;
}

/** 프로토타입의 "최근 검색". 흰 카드 안에 한 줄 56px, 항목마다 삭제 버튼(44px)과 전체 삭제가 있다 */
export function RecentSearchList({ recent, onSelect }: RecentSearchListProps) {
  return (
    <View className="mx-4 mt-3 rounded-xl bg-bg pb-1 pt-1.5">
      <View className="flex-row items-baseline justify-between px-5 pb-1 pt-4">
        <Text className="text-title font-sans-bold">최근 검색</Text>
        {recent.destinations.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => void recent.clear()} className="py-2">
            <Text className="text-body-sm text-text-secondary">전체 삭제</Text>
          </Pressable>
        ) : null}
      </View>
      {recent.destinations.length === 0 ? (
        <Text className="px-5 pb-6 pt-5 text-body text-text-secondary">최근 검색 기록이 없어요</Text>
      ) : (
        <View className="px-5">
          {recent.destinations.map((destination, index) => {
            const lineIds = destination.endpoint.stationId
              ? (recent.linesOfStation.get(destination.endpoint.stationId) ?? [])
              : [];
            return (
              <View
                key={destination.routeIds[0]}
                className={cn(
                  "h-14 flex-row items-center gap-3",
                  index === recent.destinations.length - 1 ? "" : "border-b border-border"
                )}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onSelect(destination.endpoint)}
                  className="h-14 flex-1 flex-row items-center gap-3"
                >
                  <DesignIcon name="clock" size={18} tone="secondary" />
                  <Text numberOfLines={1} className="shrink text-base font-sans-semibold">
                    {destination.endpoint.name}
                  </Text>
                  <LineBadgeList lineIds={lineIds} max={MAX_BADGES} />
                </Pressable>
                <Text className="text-body-sm text-text-secondary">{formatMonthDayKst(destination.searchedAt)}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="기록 삭제"
                  onPress={() => recent.remove(destination)}
                  className="h-11 w-11 items-center justify-center"
                >
                  <DesignIcon name="close" size={14} tone="secondary" strokeWidth={2.2} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
