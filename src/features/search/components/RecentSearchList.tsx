import React from "react";
import { Pressable, View } from "react-native";
import { DesignIcon } from "@/common/components/DesignIcon";
import { LineBadge } from "@/common/components/LineBadge";
import { Text } from "@/common/components/Text";
import { formatMonthDayKst } from "@/common/utils/format";
import type { RouteEndpoint } from "@/features/routing/endpoint";
import type { useRecentDestinations } from "@/features/routing/useRecentDestinations";

interface RecentSearchListProps {
  recent: ReturnType<typeof useRecentDestinations>;
  onSelect: (endpoint: RouteEndpoint) => void;
}

/** 프로토타입의 "최근 검색". 한 줄 56px, 항목마다 삭제 버튼과 전체 삭제가 있다 */
export function RecentSearchList({ recent, onSelect }: RecentSearchListProps) {
  return (
    <View>
      <View className="flex-row items-baseline justify-between px-5 pb-1 pt-7">
        <Text className="text-title font-sans-bold">최근 검색</Text>
        {recent.destinations.length > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => void recent.clear()} className="py-2">
            <Text className="text-body-sm text-text-secondary">전체 삭제</Text>
          </Pressable>
        ) : null}
      </View>
      {recent.destinations.length === 0 ? (
        <Text className="px-5 py-6 text-body text-text-secondary">최근 검색 기록이 없어요</Text>
      ) : (
        <View className="px-5">
          {recent.destinations.map((destination) => {
            const lineIds = destination.endpoint.stationId
              ? recent.linesOfStation.get(destination.endpoint.stationId) ?? []
              : [];
            return (
              <View key={destination.routeIds[0]} className="h-14 flex-row items-center gap-3 border-b border-border">
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onSelect(destination.endpoint)}
                  className="h-14 flex-1 flex-row items-center gap-3"
                >
                  <DesignIcon name="clock" size={18} tone="secondary" />
                  <Text numberOfLines={1} className="shrink text-base font-sans-semibold">
                    {destination.endpoint.name}
                  </Text>
                  <View className="flex-row gap-1">
                    {lineIds.map((lineId) => (
                      <LineBadge key={lineId} lineId={lineId} size="sm" />
                    ))}
                  </View>
                </Pressable>
                <Text className="text-body-sm text-text-secondary">{formatMonthDayKst(destination.searchedAt)}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="기록 삭제"
                  onPress={() => recent.remove(destination)}
                  className="h-8 w-8 items-center justify-center"
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
