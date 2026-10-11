import React from "react";
import { View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button } from "@/common/components/Button";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { formatClockKst, formatDistanceKm, formatDurationSec } from "@/common/utils/format";
import { arrivalDeltaText } from "@/features/guide/guideText";
import type { RootStackParamList } from "@/navigation/navigation-types";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center gap-1">
      <Text className="text-title font-sans-extrabold">{value}</Text>
      <Text className="text-small text-text-secondary">{label}</Text>
    </View>
  );
}

export function ArrivedScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "Arrived">) {
  const { log, destinationName, arrivedAtMs } = route.params;
  const delta = arrivalDeltaText(log.arrivalDeltaSec);

  return (
    <Screen edges={[]} scroll contentClassName="px-5">
      <View className="items-center gap-2 py-8">
        <Text className="text-body-sm text-text-secondary">
          {[formatClockKst(arrivedAtMs), delta].filter(Boolean).join(" · ")}
        </Text>
        <Text className="text-headline-lg font-sans-extrabold">{destinationName || "목적지"} 도착!</Text>
      </View>

      <View className="gap-3 rounded-lg bg-surface p-5">
        <Text className="text-body-sm text-text-secondary">이번 이동으로 받은 점수</Text>
        <Text className="text-display-md font-sans-extrabold text-primary">
          +{log.earnedPoints.toLocaleString("en-US")}점
        </Text>
        <Text className="text-body-sm">
          이동 거리 {formatDistanceKm(log.totalDistanceKm)} × 10 · {log.distancePoints.toLocaleString("en-US")}점
        </Text>
        {log.onTimeBonus > 0 ? (
          <Text className="text-body-sm">예상 시간 ±5분 안에 도착 · +{log.onTimeBonus}점</Text>
        ) : null}
      </View>

      <View className="flex-row py-6">
        <Stat label="이동 거리" value={formatDistanceKm(log.totalDistanceKm)} />
        {log.rideDurationSec !== undefined ? (
          <Stat label="탑승 시간" value={formatDurationSec(log.rideDurationSec)} />
        ) : null}
        <Stat label="환승" value={`${log.transferCount}회`} />
      </View>

      <View className="items-center gap-1 pb-6">
        <Text className="text-body-sm text-text-secondary">이번 달 누적</Text>
        <Text className="text-headline font-sans-extrabold">{log.monthlyTotalPoints.toLocaleString("en-US")}점</Text>
      </View>

      <View className="gap-2.5">
        <Button label="타임라인에서 보기" variant="secondary" onPress={() => navigation.replace("Timeline")} />
        <Button label="홈으로" onPress={() => navigation.navigate("MainTabs", { screen: "HomeTab" })} />
      </View>
    </Screen>
  );
}
