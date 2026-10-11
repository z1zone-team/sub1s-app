import React, { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { TravelStatsPeriod } from "@/apis/queries/profile/getTravelStats";
import { useLineMapQuery } from "@/apis/queries/profile/useLineMapQuery";
import { useTimelineQuery } from "@/apis/queries/profile/useTimelineQuery";
import { useTravelStatsQuery } from "@/apis/queries/profile/useTravelStatsQuery";
import { Button } from "@/common/components/Button";
import { Chip } from "@/common/components/Chip";
import { LoginRequired } from "@/common/components/LoginRequired";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { formatDistanceKm } from "@/common/utils/format";
import { visitedMapData } from "@/features/map/mapData";
import { VWorldMap } from "@/features/map/VWorldMap";
import {
  chartBars,
  formatHoursMinutes,
  kstYearMonth,
  lineRows,
  logDateLabel,
  logSummary,
  PERIODS,
} from "@/features/timeline/timelineView";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { cn } from "@/lib/cn";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 gap-0.5">
      <Text className="text-heading font-sans-extrabold">{value}</Text>
      <Text className="text-small text-text-secondary">{label}</Text>
    </View>
  );
}

export function TimelineScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isSignedIn } = useAuth();
  const [period, setPeriod] = useState<TravelStatsPeriod>("WEEK");
  const stats = useTravelStatsQuery(period);
  const timeline = useTimelineQuery(kstYearMonth(Date.now()));
  const lineMap = useLineMapQuery(period);
  const mapData = useMemo(() => visitedMapData(lineMap.data), [lineMap.data]);

  if (!isSignedIn) {
    return <LoginRequired edges={[]} description="로그인하면 이동 기록이 여기에 쌓여요" />;
  }

  const data = stats.data;
  const bars = chartBars(period, data?.buckets);
  const lines = lineRows(data?.lineBreakdown);
  const empty = !stats.isLoading && (data?.totalTravelCount ?? 0) === 0;

  return (
    <Screen edges={[]} scroll contentClassName="gap-5 px-5">
      <View className="flex-row gap-2 pt-4">
        {PERIODS.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            selected={item.value === period}
            onPress={() => setPeriod(item.value)}
          />
        ))}
      </View>

      {empty ? (
        <View className="items-center gap-3 py-12">
          <Text className="text-display-md font-sans-extrabold">0.0</Text>
          <Text className="text-small text-text-secondary">킬로미터</Text>
          <Text className="text-heading font-sans-extrabold">아직 탄 기록이 없어요</Text>
          <Text className="text-center text-text-secondary">
            지하철을 타면 이동한 구간이 호선 색으로 여기에 그려져요
          </Text>
          <Button label="첫 경로 찾아보기" onPress={() => navigation.navigate("Search")} />
        </View>
      ) : (
        <>
          <View className="gap-1">
            <Text className="text-hero font-sans-extrabold">{(data?.totalDistanceKm ?? 0).toFixed(1)}</Text>
            <Text className="text-body-sm text-text-secondary">킬로미터</Text>
          </View>

          <View className="flex-row">
            <Stat label="이용 횟수" value={String(data?.totalTravelCount ?? 0)} />
            <Stat label="환승" value={String(data?.transferCount ?? 0)} />
            <Stat label="탑승 시간" value={formatHoursMinutes(data?.totalRideDurationSec ?? 0)} />
          </View>

          <View className={cn("h-27.5 flex-row items-end", period === "MONTH" ? "gap-0.5" : "gap-2")}>
            {bars.map((bar) => (
              <View key={bar.key} className="flex-1 items-center gap-1.5">
                <View
                  className={cn("w-full rounded-2xs", bar.ratio > 0 ? "bg-primary" : "bg-border")}
                  style={{ height: Math.max(3, Math.round(bar.ratio * 84)) }}
                />
                <Text className={cn("text-text-secondary", period === "MONTH" ? "text-nano" : "text-caption")}>
                  {bar.label}
                </Text>
              </View>
            ))}
          </View>

          <View className="gap-2.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-subtitle font-sans-bold">이동 지도</Text>
              <Pressable accessibilityRole="button" onPress={() => navigation.navigate("MoveMap")}>
                <Text className="text-body-sm text-primary">크게 보기</Text>
              </Pressable>
            </View>
            <VWorldMap data={mapData} className="h-48 rounded-md" />
          </View>

          {lines.length > 0 ? (
            <View className="gap-2.5">
              <Text className="text-subtitle font-sans-bold">이용 호선</Text>
              {lines.map((line) => (
                <View key={line.lineId} className="gap-1">
                  <View className="flex-row justify-between">
                    <Text className="text-body-sm">{line.name}</Text>
                    <Text className="text-body-sm text-text-secondary">{formatDistanceKm(line.distanceKm)}</Text>
                  </View>
                  <View className="h-1.5 rounded-2xs bg-surface">
                    <View
                      className="h-1.5 rounded-2xs"
                      style={{
                        width: `${Math.max(2, Math.round(line.ratio * 100))}%`,
                        backgroundColor: line.color,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </>
      )}

      {(timeline.data?.logs.length ?? 0) > 0 ? (
        <View className="gap-1 pb-4">
          <Text className="text-subtitle font-sans-bold">최근 활동</Text>
          {timeline.data?.logs.map((log) => (
            <View
              key={log.id}
              className="flex-row items-center justify-between border-b border-border py-3"
            >
              <View className="flex-1 gap-0.5">
                <Text className="text-small text-text-secondary">{logDateLabel(log.traveledAt)}</Text>
                <Text className="text-subtitle font-sans-bold">
                  {log.originStationName} → {log.destStationName}
                </Text>
                <Text className="text-small text-text-secondary">{logSummary(log)}</Text>
              </View>
              <Text className="text-body font-sans-bold">{formatDistanceKm(log.distanceKm)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {stats.error ? (
        <Text className="text-error">기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</Text>
      ) : null}
    </Screen>
  );
}
