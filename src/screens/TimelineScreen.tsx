import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useAuth } from "@clerk/expo";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { TravelStatsPeriod } from "@/apis/queries/profile/getTravelStats";
import { useLineMapQuery } from "@/apis/queries/profile/useLineMapQuery";
import { useTimelineQuery } from "@/apis/queries/profile/useTimelineQuery";
import { useTravelStatsQuery } from "@/apis/queries/profile/useTravelStatsQuery";
import { BackButton } from "@/common/components/BackButton";
import { Bob } from "@/common/components/Bob";
import { DesignIcon } from "@/common/components/DesignIcon";
import { LoadingGhost } from "@/common/components/LoadingGhost";
import { LoginRequired } from "@/common/components/LoginRequired";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { formatDistanceKm } from "@/common/utils/format";
import { parseMonthKey } from "@/common/utils/monthKey";
import { visitedMapData } from "@/features/map/mapData";
import { VWorldMap } from "@/features/map/VWorldMap";
import { ActivityRow } from "@/features/timeline/components/ActivityRow";
import { BarChart } from "@/features/timeline/components/BarChart";
import { EmptyMascot } from "@/features/timeline/components/EmptyMascot";
import { PeriodTabs } from "@/features/timeline/components/PeriodTabs";
import {
  chartBars,
  formatHoursMinutes,
  kstYearMonth,
  lineRows,
  logDateLabel,
  logSummary,
  periodName,
} from "@/features/timeline/timelineView";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { getLineInfo, lineTextColor, useTheme } from "@/theme";

/** 프로토타입의 88px 기울인 숫자: 글자 간격 -4, 줄 높이 88, 왼쪽을 기준으로 -4도 기울임. 글꼴에 기울임체가 없어 transform으로 만든다 */
const BIG_NUMBER = {
  letterSpacing: -4,
  lineHeight: 88,
  transform: [{ skewX: "-4deg" }],
  transformOrigin: "left",
} as const;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1">
      <Text className="text-headline font-sans-bold">{value}</Text>
      <Text className="mt-0.5 text-body-sm text-text-secondary">{label}</Text>
    </View>
  );
}

/** 프로토타입 Timeline.dc.html, TimelineEmpty.dc.html. 기록이 없으면 회색 숫자와 흐린 지도로 바뀐다 */
export function TimelineScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "Timeline">>();
  const { colors } = useTheme();
  const { isSignedIn } = useAuth();
  const requestedMonth = parseMonthKey(route.params?.periodKey);
  const requestedKey = requestedMonth ? route.params?.periodKey : undefined;
  const [period, setPeriod] = useState<TravelStatsPeriod>(() => requestedKey ? "MONTH" : "WEEK");
  useEffect(() => {
    setPeriod(requestedKey ? "MONTH" : "WEEK");
  }, [requestedKey, route.params?.pushOpenedAt]);
  const selectedMonth = period === "MONTH" ? requestedMonth : undefined;
  const monthQuery = selectedMonth ? { periodKey: requestedKey } : undefined;
  const stats = useTravelStatsQuery(period, monthQuery);
  const timeline = useTimelineQuery(selectedMonth ?? kstYearMonth(Date.now()));
  const lineMap = useLineMapQuery(period, monthQuery);
  const mapData = useMemo(() => visitedMapData(lineMap.data), [lineMap.data]);

  const back = (
    <BackButton onPress={() => navigation.goBack()} iconSize={24} strokeWidth={2} className="ml-3" />
  );

  if (!isSignedIn) {
    return (
      <Screen>
        {back}
        <LoginRequired edges={[]} description="로그인하면 이동 기록이 여기에 쌓여요" />
      </Screen>
    );
  }

  const data = stats.data;
  const bars = chartBars(period, data?.buckets);
  const lines = lineRows(data?.lineBreakdown);
  const empty = !stats.isLoading && (data?.totalTravelCount ?? 0) === 0;
  const name = selectedMonth ? `${selectedMonth.year}년 ${selectedMonth.month}월` : periodName(period, Date.now());
  const title = <Text className="mx-5 mt-1 text-display-lg font-sans-bold">타임라인</Text>;
  const tabs = (
    <View className="mx-5 mt-4.5">
      <PeriodTabs value={period} onChange={setPeriod} />
    </View>
  );

  if (empty) {
    return (
      <Screen edges={["top", "bottom"]}>
        {back}
        {title}
        {tabs}
        <Text className="mx-5 mt-5.5 text-base font-sans-bold">{name}</Text>
        <View className="mx-5 mt-1.5">
          <Text className="text-display-xl font-sans-bold text-border" style={BIG_NUMBER}>
            0.0
          </Text>
          <Text className="mt-1.5 text-subtitle font-sans-semibold text-text-secondary">킬로미터</Text>
        </View>
        <View className="mx-5 mt-7 overflow-hidden rounded-lg border border-border bg-surface">
          <VWorldMap data={mapData} className="h-62.5" />
          <View className="absolute inset-0 items-center justify-center gap-3" style={{ backgroundColor: `${colors.surface}99` }}>
            <Bob lift={5} periodMs={2600}>
              <EmptyMascot size={64} />
            </Bob>
            <Text className="text-title font-sans-bold">아직 탄 기록이 없어요</Text>
            <Text className="text-center text-body-sm leading-normal text-text-secondary">
              {"지하철을 타면 이동한 구간이\n호선 색으로 여기에 그려져요"}
            </Text>
          </View>
        </View>
        <View className="flex-1" />
        <View className="px-5 pb-4">
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate("Search")}
            className="h-14 items-center justify-center rounded-lg bg-primary"
          >
            <Text className="text-base font-sans-bold text-on-primary">첫 경로 찾아보기</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const logs = timeline.data?.logs ?? [];
  return (
    <Screen edges={["top", "bottom"]}>
      {back}
      <ScrollView className="flex-1" contentContainerClassName="pb-12" showsVerticalScrollIndicator={false}>
        {title}
        {tabs}
        {stats.isLoading ? (
          <LoadingGhost minHeight={420} />
        ) : (
          <>
        <Text className="mx-5 mt-5.5 text-base font-sans-bold">{name}</Text>

        <View className="mx-5 mt-1.5">
          <Text className="text-display-xl font-sans-bold" style={BIG_NUMBER}>
            {(data?.totalDistanceKm ?? 0).toFixed(1)}
          </Text>
          <Text className="mt-1.5 text-subtitle font-sans-semibold text-text-secondary">킬로미터</Text>
        </View>

        <View className="mx-5 mt-6 flex-row gap-3">
          <Stat label="이용 횟수" value={String(data?.totalTravelCount ?? 0)} />
          <Stat label="환승" value={String(data?.transferCount ?? 0)} />
          <Stat label="탑승 시간" value={formatHoursMinutes(data?.totalRideDurationSec ?? 0)} />
        </View>

        <View className="mx-5 mt-7">
          <BarChart bars={bars} scrollable={period === "MONTH"} />
        </View>

        <Text className="mx-5 mt-9 text-title-lg font-sans-bold">이동 지도</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이동 지도 크게 보기"
          onPress={() => navigation.navigate("MoveMap", { period, ...monthQuery })}
          className="mx-5 mt-3.5 overflow-hidden rounded-lg border border-border bg-surface"
        >
          <VWorldMap data={mapData} className="h-75" />
          <View className="absolute right-2.5 top-2.5 h-7.5 flex-row items-center gap-1 rounded-pill border border-border bg-bg px-2.5">
            <DesignIcon name="expand" size={13} />
            <Text className="text-small font-sans-bold">크게 보기</Text>
          </View>
        </Pressable>

        {lines.length > 0 ? (
          <View className="mx-5 mt-3 flex-row flex-wrap items-center gap-2">
            <Text className="mr-0.5 text-small font-sans-semibold text-text-secondary">이용 호선</Text>
            {lines.map((line) => (
              <View
                key={line.lineId}
                className="h-6.5 flex-row items-center gap-1 rounded-pill px-2.5"
                style={{ backgroundColor: line.color }}
              >
                <Text className="text-small font-sans-bold" style={{ color: lineTextColor(line.color) }}>
                  {line.name}
                </Text>
                <Text className="text-small font-sans-semibold" style={{ color: lineTextColor(line.color) }}>
                  {formatDistanceKm(line.distanceKm)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {logs.length > 0 ? (
          <>
            <Text className="mx-5 mb-1.5 mt-10 text-title-lg font-sans-bold">최근 활동</Text>
            <View className="px-5">
              {logs.map((log, index) => (
                <ActivityRow
                  key={log.id}
                  color={getLineInfo(log.lineIds[0] ?? "").color}
                  date={logDateLabel(log.traveledAt)}
                  route={`${log.originStationName} → ${log.destStationName}`}
                  summary={logSummary(log)}
                  distanceKm={log.distanceKm}
                  last={index === logs.length - 1}
                />
              ))}
            </View>
          </>
        ) : null}

          </>
        )}

        {stats.error ? (
          <Text className="mx-5 mt-4 text-error">기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</Text>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
