import React from "react";
import { Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button } from "@/common/components/Button";
import { Screen } from "@/common/components/Screen";
import { formatClockKst, formatDistanceKm, formatDurationSec } from "@/common/utils/format";
import { arrivalDeltaText } from "@/features/guide/guideText";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { useTheme } from "@/theme";

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 4 }}>
      <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>{value}</Text>
      <Text style={{ fontSize: 12, color: colors.textSecondary }}>{label}</Text>
    </View>
  );
}

export function ArrivedScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "Arrived">) {
  const { colors } = useTheme();
  const { log, destinationName, arrivedAtMs } = route.params;
  const delta = arrivalDeltaText(log.arrivalDeltaSec);

  return (
    <Screen edges={[]} scroll contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ alignItems: "center", gap: 8, paddingVertical: 32 }}>
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
          {[formatClockKst(arrivedAtMs), delta].filter(Boolean).join(" · ")}
        </Text>
        <Text style={{ fontSize: 26, fontWeight: "800", color: colors.text }}>
          {destinationName || "목적지"} 도착!
        </Text>
      </View>

      <View style={{ padding: 20, gap: 12, borderRadius: 16, backgroundColor: colors.surface }}>
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>이번 이동으로 받은 점수</Text>
        <Text style={{ fontSize: 32, fontWeight: "800", color: colors.primary }}>
          +{log.earnedPoints.toLocaleString("en-US")}점
        </Text>
        <Text style={{ fontSize: 13, color: colors.text }}>
          이동 거리 {formatDistanceKm(log.totalDistanceKm)} × 10 · {log.distancePoints.toLocaleString("en-US")}점
        </Text>
        {log.onTimeBonus > 0 ? (
          <Text style={{ fontSize: 13, color: colors.text }}>
            예상 시간 ±5분 안에 도착 · +{log.onTimeBonus}점
          </Text>
        ) : null}
      </View>

      <View style={{ flexDirection: "row", paddingVertical: 24 }}>
        <Stat label="이동 거리" value={formatDistanceKm(log.totalDistanceKm)} />
        {log.rideDurationSec !== undefined ? (
          <Stat label="탑승 시간" value={formatDurationSec(log.rideDurationSec)} />
        ) : null}
        <Stat label="환승" value={`${log.transferCount}회`} />
      </View>

      <View style={{ alignItems: "center", gap: 4, paddingBottom: 24 }}>
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>이번 달 누적</Text>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>
          {log.monthlyTotalPoints.toLocaleString("en-US")}점
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <Button label="타임라인에서 보기" variant="secondary" onPress={() => navigation.replace("Timeline")} />
        <Button label="홈으로" onPress={() => navigation.navigate("MainTabs", { screen: "HomeTab" })} />
      </View>
    </Screen>
  );
}
