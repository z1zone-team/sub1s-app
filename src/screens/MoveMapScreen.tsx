import React, { useMemo, useState } from "react";
import { Pressable, useWindowDimensions, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLineMapQuery } from "@/apis/queries/profile/useLineMapQuery";
import { useTimelineQuery } from "@/apis/queries/profile/useTimelineQuery";
import { useTravelStatsQuery } from "@/apis/queries/profile/useTravelStatsQuery";
import { BackButton } from "@/common/components/BackButton";
import { DraggableSheet } from "@/common/components/DraggableSheet";
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
  logIsHighlighted,
  logsForPeriod,
  logSummary,
  periodName,
} from "@/features/timeline/timelineView";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { cn } from "@/lib/cn";
import { getLineInfo, lineTextColor, useTheme } from "@/theme";

const SHEET_MAX_RATIO = 0.7;
/** 지도 위쪽 뒤로 가기 버튼과 제목 칩이 덮는 높이(상태 표시줄 아래). 지도를 맞출 때 이만큼 비운다 */
const HEADER_OVERLAY_HEIGHT = 64;

/** 프로토타입 MoveMap.dc.html: 전체 화면 지도 위에 둥근 뒤로 버튼과 제목, 아래에 이동 요약 시트 */
export function MoveMapScreen({ navigation, route }: NativeStackScreenProps<RootStackParamList, "MoveMap">) {
  const { period } = route.params;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [focus, setFocus] = useState<string | undefined>();
  const [selectedLogId, setSelectedLogId] = useState<string | undefined>();
  const [sheetHeight, setSheetHeight] = useState(0);
  const lineMap = useLineMapQuery(period);
  const stats = useTravelStatsQuery(period);
  const timeline = useTimelineQuery(kstYearMonth(Date.now()));

  const rows = lineRows(stats.data?.lineBreakdown);
  const logs = logsForPeriod(timeline.data?.logs ?? [], period, stats.data?.buckets);
  const selectedLog = logs.find((log) => log.id === selectedLogId);
  const data = useMemo(
    () => ({ ...visitedMapData(lineMap.data, focus, selectedLog?.stationIds), bottomInset: sheetHeight, topInset: insets.top + HEADER_OVERLAY_HEIGHT }),
    [lineMap.data, focus, selectedLog, sheetHeight, insets.top]
  );
  const bottomPadding = Math.max(insets.bottom, 12) + 10;
  const [distance] = valueParts(formatDistanceKm(stats.data?.totalDistanceKm ?? 0));

  return (
    <View className="flex-1 bg-surface">
      <VWorldMap data={data} className="absolute inset-0" />

      <View className="absolute left-4 right-4 flex-row items-center gap-2.5" style={{ top: insets.top + 8 }}>
        <BackButton onPress={() => navigation.goBack()} variant="floating" iconSize={22} strokeWidth={2} />
        <View className="h-control justify-center rounded-pill border border-border bg-bg px-4">
          <Text className="text-subtitle font-sans-bold">이동 지도</Text>
        </View>
      </View>

      <DraggableSheet
        label="이동 요약"
        className="px-5"
        bottomInset={bottomPadding}
        coverBottom
        maxHeight={height * SHEET_MAX_RATIO}
        scrollable
        onVisibleHeightChange={setSheetHeight}
        header={
          <View>
            <View className="flex-row items-baseline justify-between">
              <Text className="text-body-sm font-sans-semibold text-text-secondary">{periodName(period, Date.now())}</Text>
              <Text className="text-body-sm text-text-secondary">
                {stats.data?.totalTravelCount ?? 0}회 탑승 · 환승 {stats.data?.transferCount ?? 0}회
              </Text>
            </View>
            <View className="mt-0.5 flex-row items-baseline">
              <Text
                className="text-hero font-sans-bold"
                style={{ letterSpacing: -1.5 }}
              >
                {distance.number}
              </Text>
              <Text className="ml-1 text-subtitle font-sans-semibold text-text-secondary">{distance.unit}</Text>
            </View>
          </View>
        }
      >
        <View className="mt-3.5 flex-row flex-wrap gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: !focus }}
            onPress={() => {
              setFocus(undefined);
              setSelectedLogId(undefined);
            }}
            className={cn("h-11 justify-center rounded-pill border px-3.5", !focus ? "border-primary bg-primary" : "border-border bg-bg")}
          >
            <Text className={cn("text-body-sm font-sans-bold", !focus ? "text-on-primary" : "text-text")}>전체</Text>
          </Pressable>
          {rows.map((row) => (
            <Pressable
              key={row.lineId}
              accessibilityRole="button"
              accessibilityState={{ selected: focus === row.lineId }}
              onPress={() => {
                setFocus(row.lineId);
                setSelectedLogId(undefined);
              }}
              className="h-11 justify-center rounded-pill border px-3.5"
              style={{ backgroundColor: row.color, borderColor: focus === row.lineId ? colors.text : "transparent" }}
            >
              <Text className="text-body-sm font-sans-bold" style={{ color: lineTextColor(row.color) }}>
                {row.name} {formatDistanceKm(row.distanceKm)}
              </Text>
            </Pressable>
          ))}
        </View>
        {logs.length > 0 ? (
          <>
          <Text className="mt-4.5 text-body-sm font-sans-semibold text-text-secondary">최근 이동</Text>
          <View className="mt-1">
            {logs.map((log, index) => (
              <Pressable
                key={log.id}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedLogId === log.id }}
                onPress={() => setSelectedLogId((current) => (current === log.id ? undefined : log.id))}
                style={{ opacity: logIsHighlighted(log, selectedLogId, focus) ? 1 : 0.25 }}
              >
                <ActivityRow
                  compact
                  color={getLineInfo(log.lineIds[0] ?? "").color}
                  date={logDateLabel(log.traveledAt)}
                  route={`${log.originStationName} → ${log.destStationName}`}
                  summary={logSummary(log)}
                  distanceKm={log.distanceKm}
                  last={index === logs.length - 1}
                />
              </Pressable>
            ))}
          </View>
          </>
        ) : (
          <Text className="mt-4 text-body-sm text-text-secondary">이 기간에는 이동 기록이 없어요</Text>
        )}
        <View style={{ height: bottomPadding }} />
      </DraggableSheet>
    </View>
  );
}
