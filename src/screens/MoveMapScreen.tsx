import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLineMapQuery } from "@/apis/queries/profile/useLineMapQuery";
import { useTimelineQuery } from "@/apis/queries/profile/useTimelineQuery";
import { useTravelStatsQuery } from "@/apis/queries/profile/useTravelStatsQuery";
import { DesignIcon } from "@/common/components/DesignIcon";
import { Text } from "@/common/components/Text";
import { formatDistanceKm } from "@/common/utils/format";
import { valueParts } from "@/features/guide/arrivedView";
import { visitedMapData } from "@/features/map/mapData";
import { VWorldMap } from "@/features/map/VWorldMap";
import { ActivityRow } from "@/features/timeline/components/ActivityRow";
import {
  kstYearMonth,
  lineRows,
  logDateLabel,
  logMatchesLine,
  logsForPeriod,
  logSummary,
  periodName,
} from "@/features/timeline/timelineView";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { cn } from "@/lib/cn";
import { getLineInfo, lineTextColor, useTheme } from "@/theme";

const SHEET_RADIUS = 24;
const SHEET_MAX_RATIO = 0.55;

/** 프로토타입 MoveMap.dc.html: 전체 화면 지도 위에 둥근 뒤로 버튼과 제목, 아래에 이동 요약 시트 */
export function MoveMapScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, "MoveMap">) {
  const { period } = route.params;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [focus, setFocus] = useState<string | undefined>();
  const [sheetHeight, setSheetHeight] = useState(0);
  const lineMap = useLineMapQuery(period);
  const stats = useTravelStatsQuery(period);
  const timeline = useTimelineQuery(kstYearMonth(Date.now()));

  const data = useMemo(
    () => ({ ...visitedMapData(lineMap.data, focus), bottomInset: sheetHeight }),
    [lineMap.data, focus, sheetHeight]
  );
  const rows = lineRows(stats.data?.lineBreakdown);
  const logs = logsForPeriod(timeline.data?.logs ?? [], period, stats.data?.buckets);
  const [distance] = valueParts(formatDistanceKm(stats.data?.totalDistanceKm ?? 0));

  return (
    <View className="flex-1 bg-surface">
      <VWorldMap data={data} className="absolute inset-0" />

      <View className="absolute left-4 right-4 flex-row items-center gap-2.5" style={{ top: insets.top + 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          onPress={() => navigation.goBack()}
          className="h-control w-control items-center justify-center rounded-pill border border-border bg-bg"
        >
          <DesignIcon name="back" size={22} strokeWidth={2} />
        </Pressable>
        <View className="h-control justify-center rounded-pill border border-border bg-bg px-4">
          <Text className="text-subtitle font-sans-bold">이동 지도</Text>
        </View>
      </View>

      <View
        onLayout={(event) => setSheetHeight(Math.round(event.nativeEvent.layout.height))}
        className="absolute inset-x-0 bottom-0 border-t border-border bg-bg px-5 pt-2.5"
        style={{ borderTopLeftRadius: SHEET_RADIUS, borderTopRightRadius: SHEET_RADIUS, paddingBottom: Math.max(insets.bottom, 12) + 10 }}
      >
        <View className="mb-4 h-1 w-9 self-center rounded-pill bg-border" />
        <View className="flex-row items-baseline justify-between">
          <Text className="text-body-sm font-sans-semibold text-text-secondary">{periodName(period, Date.now())}</Text>
          <Text className="text-body-sm text-text-secondary">
            {stats.data?.totalTravelCount ?? 0}회 탑승 · 환승 {stats.data?.transferCount ?? 0}회
          </Text>
        </View>
        <View className="mt-0.5 flex-row items-baseline">
          <Text
            className="text-hero font-sans-bold"
            style={{ letterSpacing: -1.5, transform: [{ skewX: "-4deg" }], transformOrigin: "left" }}
          >
            {distance.number}
          </Text>
          <Text className="ml-1 text-subtitle font-sans-semibold text-text-secondary">{distance.unit}</Text>
        </View>

        <View className="mt-3.5 flex-row flex-wrap gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: !focus }}
            onPress={() => setFocus(undefined)}
            className={cn("h-8.5 justify-center rounded-pill border px-3.5", !focus ? "border-primary bg-primary" : "border-border bg-bg")}
          >
            <Text className={cn("text-body-sm font-sans-bold", !focus ? "text-on-primary" : "text-text")}>전체</Text>
          </Pressable>
          {rows.map((row) => (
            <Pressable
              key={row.lineId}
              accessibilityRole="button"
              accessibilityState={{ selected: focus === row.lineId }}
              onPress={() => setFocus(row.lineId)}
              className="h-8.5 justify-center rounded-pill border px-3.5"
              style={{ backgroundColor: row.color, borderColor: focus === row.lineId ? colors.text : "transparent" }}
            >
              <Text className="text-body-sm font-sans-bold" style={{ color: lineTextColor(row.color) }}>
                {row.name} {formatDistanceKm(row.distanceKm)}
              </Text>
            </Pressable>
          ))}
        </View>

        {logs.length > 0 ? (
          <ScrollView className="mt-4" style={{ maxHeight: height * SHEET_MAX_RATIO - 220 }} showsVerticalScrollIndicator={false}>
            {logs.map((log, index) => (
              <View key={log.id} style={{ opacity: logMatchesLine(log, focus) ? 1 : 0.25 }}>
                <ActivityRow
                  compact
                  color={getLineInfo(log.lineIds[0] ?? "").color}
                  date={logDateLabel(log.traveledAt)}
                  route={`${log.originStationName} → ${log.destStationName}`}
                  summary={logSummary(log)}
                  distanceKm={log.distanceKm}
                  last={index === logs.length - 1}
                />
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text className="mt-4 text-body-sm text-text-secondary">이 기간에는 이동 기록이 없어요</Text>
        )}
      </View>
    </View>
  );
}
