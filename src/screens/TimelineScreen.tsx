import React, { useState } from "react";
import { Text, View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { TravelStatsPeriod } from "@/apis/queries/profile/getTravelStats";
import { useTimelineQuery } from "@/apis/queries/profile/useTimelineQuery";
import { useTravelStatsQuery } from "@/apis/queries/profile/useTravelStatsQuery";
import { Button } from "@/common/components/Button";
import { Chip } from "@/common/components/Chip";
import { Screen } from "@/common/components/Screen";
import { formatDistanceKm } from "@/common/utils/format";
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
import { useTheme } from "@/theme";

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text }}>{value}</Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary }}>{label}</Text>
    </View>
  );
}

export function TimelineScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isSignedIn } = useAuth();
  const [period, setPeriod] = useState<TravelStatsPeriod>("WEEK");
  const stats = useTravelStatsQuery(period);
  const timeline = useTimelineQuery(kstYearMonth(Date.now()));

  if (!isSignedIn) {
    return (
      <Screen edges={[]} contentStyle={{ paddingHorizontal: 24, justifyContent: "center", gap: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>로그인이 필요해요</Text>
        <Text style={{ color: colors.textSecondary }}>로그인하면 이동 기록이 여기에 쌓여요</Text>
        <Button label="로그인" onPress={() => navigation.navigate("Login")} />
      </Screen>
    );
  }

  const data = stats.data;
  const bars = chartBars(period, data?.buckets);
  const lines = lineRows(data?.lineBreakdown);
  const empty = !stats.isLoading && (data?.totalTravelCount ?? 0) === 0;

  return (
    <Screen edges={[]} scroll contentStyle={{ paddingHorizontal: 20, gap: 20 }}>
      <View style={{ flexDirection: "row", gap: 8, paddingTop: 16 }}>
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
        <View style={{ alignItems: "center", gap: 12, paddingVertical: 48 }}>
          <Text style={{ fontSize: 32, fontWeight: "800", color: colors.text }}>0.0</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>킬로미터</Text>
          <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text }}>아직 탄 기록이 없어요</Text>
          <Text style={{ textAlign: "center", color: colors.textSecondary }}>
            지하철을 타면 이동한 구간이 호선 색으로 여기에 그려져요
          </Text>
          <Button label="첫 경로 찾아보기" onPress={() => navigation.navigate("Search")} />
        </View>
      ) : (
        <>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 40, fontWeight: "800", color: colors.text }}>
              {(data?.totalDistanceKm ?? 0).toFixed(1)}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>킬로미터</Text>
          </View>

          <View style={{ flexDirection: "row" }}>
            <Stat label="이용 횟수" value={String(data?.totalTravelCount ?? 0)} />
            <Stat label="환승" value={String(data?.transferCount ?? 0)} />
            <Stat label="탑승 시간" value={formatHoursMinutes(data?.totalRideDurationSec ?? 0)} />
          </View>

          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: period === "MONTH" ? 2 : 8, height: 110 }}>
            {bars.map((bar) => (
              <View key={bar.key} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                <View
                  style={{
                    width: "100%",
                    height: Math.max(3, Math.round(bar.ratio * 84)),
                    borderRadius: 3,
                    backgroundColor: bar.ratio > 0 ? colors.primary : colors.border,
                  }}
                />
                <Text style={{ fontSize: period === "MONTH" ? 8 : 11, color: colors.textSecondary }}>
                  {bar.label}
                </Text>
              </View>
            ))}
          </View>

          {lines.length > 0 ? (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>이용 호선</Text>
              {lines.map((line) => (
                <View key={line.lineId} style={{ gap: 4 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 13, color: colors.text }}>{line.name}</Text>
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                      {formatDistanceKm(line.distanceKm)}
                    </Text>
                  </View>
                  <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surface }}>
                    <View
                      style={{
                        height: 6,
                        borderRadius: 3,
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
        <View style={{ gap: 4, paddingBottom: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>최근 활동</Text>
          {timeline.data?.logs.map((log) => (
            <View
              key={log.id}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{logDateLabel(log.traveledAt)}</Text>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
                  {log.originStationName} → {log.destStationName}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>{logSummary(log)}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                {formatDistanceKm(log.distanceKm)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {stats.error ? (
        <Text style={{ color: colors.error }}>기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</Text>
      ) : null}
    </Screen>
  );
}
