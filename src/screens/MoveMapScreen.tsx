import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import type { TravelStatsPeriod } from "@/apis/queries/profile/getTravelStats";
import { useLineMapQuery } from "@/apis/queries/profile/useLineMapQuery";
import { useTravelStatsQuery } from "@/apis/queries/profile/useTravelStatsQuery";
import { Chip } from "@/common/components/Chip";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { formatDistanceKm } from "@/common/utils/format";
import { visitedLineIds, visitedMapData } from "@/features/map/mapData";
import { VWorldMap } from "@/features/map/VWorldMap";
import { lineRows, PERIODS } from "@/features/timeline/timelineView";
import { cn } from "@/lib/cn";
import { getLineInfo } from "@/theme";

export function MoveMapScreen() {
  const [period, setPeriod] = useState<TravelStatsPeriod>("WEEK");
  const [focus, setFocus] = useState<string | undefined>();
  const lineMap = useLineMapQuery(period);
  const stats = useTravelStatsQuery(period);

  const data = useMemo(() => visitedMapData(lineMap.data, focus), [lineMap.data, focus]);
  const visited = visitedLineIds(lineMap.data);
  const rows = lineRows(stats.data?.lineBreakdown);

  const changePeriod = (next: TravelStatsPeriod) => {
    setPeriod(next);
    setFocus(undefined);
  };

  return (
    <Screen edges={[]}>
      <VWorldMap data={data} className="flex-1" />

      <View className="gap-3 border-t border-border bg-bg px-5 pb-4 pt-3">
        <View className="flex-row gap-2">
          {PERIODS.map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              selected={item.value === period}
              onPress={() => changePeriod(item.value)}
            />
          ))}
        </View>

        <View className="flex-row items-baseline justify-between">
          <Text className="text-body-sm text-text-secondary">
            {stats.data?.totalTravelCount ?? 0}회 탑승 · 환승 {stats.data?.transferCount ?? 0}회
          </Text>
          <Text className="text-title font-sans-extrabold">
            {formatDistanceKm(stats.data?.totalDistanceKm ?? 0)}
          </Text>
        </View>

        {visited.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            <Chip label="전체" selected={!focus} onPress={() => setFocus(undefined)} />
            {visited.map((lineId) => (
              <Chip
                key={lineId}
                label={getLineInfo(lineId).name}
                selected={focus === lineId}
                onPress={() => setFocus(lineId)}
              />
            ))}
          </ScrollView>
        ) : (
          <Text className="text-body-sm text-text-secondary">이 기간에는 방문한 역이 없어요</Text>
        )}

        {rows.map((row) => (
          <Pressable
            key={row.lineId}
            accessibilityRole="button"
            onPress={() => setFocus(row.lineId)}
            className={cn("flex-row items-center justify-between", focus && focus !== row.lineId && "opacity-40")}
          >
            <Text className="text-body-sm">{row.name}</Text>
            <Text className="text-body-sm text-text-secondary">{formatDistanceKm(row.distanceKm)}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
