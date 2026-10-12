import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bob } from "@/common/components/Bob";
import { DesignIcon } from "@/common/components/DesignIcon";
import { RiseIn } from "@/common/components/RiseIn";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { formatClockKst, formatDistanceKm, formatDurationSec } from "@/common/utils/format";
import { valueParts } from "@/features/guide/arrivedView";
import { ArrivedMascot } from "@/features/guide/components/ArrivedMascot";
import { arrivalDeltaText } from "@/features/guide/guideText";
import type { RootStackParamList } from "@/navigation/navigation-types";

/** 프로토타입 Arrived.dc.html에서 항목이 차례로 나타나는 간격 (.05초씩) */
const STAGGER_MS = 50;
const UP_FROM = 16;
const UP_MS = 450;

function Up({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <RiseIn from={UP_FROM} durationMs={UP_MS} delayMs={step * STAGGER_MS}>
      {children}
    </RiseIn>
  );
}

/** "14.6km"를 큰 숫자 "14.6"과 작은 단위 "km"로 그린 통계 칸 */
function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-md bg-surface px-3 py-3.5">
      <View className="flex-row flex-wrap items-baseline">
        {valueParts(value).map((part, index) => (
          <Text key={`${part.number}-${index}`} className="text-title-lg font-sans-bold">
            {part.number}
            <Text className="text-small font-sans-bold">{part.unit}</Text>
            {index < valueParts(value).length - 1 ? " " : ""}
          </Text>
        ))}
      </View>
      <Text className="mt-0.5 text-small text-text-secondary">{label}</Text>
    </View>
  );
}

/** 프로토타입의 도착 화면. 떠다니는 캐릭터, 점수 카드, 통계 3칸, 이번 달 누적이 차례로 올라온다 */
export function ArrivedScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "Arrived">) {
  const { log, destinationName, arrivedAtMs } = route.params;
  const insets = useSafeAreaInsets();
  const delta = arrivalDeltaText(log.arrivalDeltaSec);
  const goHome = () => navigation.navigate("MainTabs", { screen: "HomeTab" });

  return (
    <Screen>
      <View className="flex-row justify-end px-4 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="닫기"
          onPress={goHome}
          className="h-control w-control items-center justify-center"
        >
          <DesignIcon name="close" size={22} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-4" showsVerticalScrollIndicator={false}>
        <View className="items-center px-6 pt-3">
          <Bob>
            <ArrivedMascot size={112} />
          </Bob>
          <View className="mt-4.5 items-center">
            <Up step={0}>
              <Text className="text-subtitle font-sans-semibold text-text-secondary">
                {[formatClockKst(arrivedAtMs), delta].filter(Boolean).join(" · ")}
              </Text>
            </Up>
            <View className="mt-1.5">
              <Up step={1}>
                <Text className="text-display-sm font-sans-bold">{destinationName || "목적지"} 도착!</Text>
              </Up>
            </View>
          </View>
        </View>

        <View className="mx-5 mt-7">
          <Up step={2}>
            <View className="rounded-lg bg-primary p-5">
              <Text className="text-body-sm font-sans-semibold text-on-primary opacity-85">이번 이동으로 받은 점수</Text>
              <View className="mt-1 flex-row items-baseline gap-1">
                <Text className="text-hero-lg font-sans-bold italic text-on-primary">
                  +{log.earnedPoints.toLocaleString("en-US")}
                </Text>
                <Text className="text-base font-sans-bold text-on-primary">점</Text>
              </View>
              <View
                className="mt-3.5 gap-1.5 border-t pt-3.5"
                style={{ borderTopColor: "rgba(255,255,255,0.2)" }}
              >
                <View className="flex-row justify-between">
                  <Text className="text-body-sm text-on-primary opacity-85">
                    이동 거리 {formatDistanceKm(log.totalDistanceKm)} × 10
                  </Text>
                  <Text className="text-body-sm font-sans-bold text-on-primary">
                    {log.distancePoints.toLocaleString("en-US")}점
                  </Text>
                </View>
                {log.onTimeBonus > 0 ? (
                  <View className="flex-row justify-between">
                    <Text className="text-body-sm text-on-primary opacity-85">예상 시간 ±5분 안에 도착</Text>
                    <Text className="text-body-sm font-sans-bold text-on-primary">+{log.onTimeBonus}점</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Up>
        </View>

        <View className="mx-5 mt-3">
          <Up step={3}>
            <View className="flex-row gap-2">
              <StatTile label="이동 거리" value={formatDistanceKm(log.totalDistanceKm)} />
              {log.rideDurationSec !== undefined ? (
                <StatTile label="탑승 시간" value={formatDurationSec(log.rideDurationSec)} />
              ) : null}
              <StatTile label="환승" value={`${log.transferCount}회`} />
            </View>
          </Up>
        </View>

        <View className="mx-5 mt-3">
          <Up step={4}>
            <View className="flex-row items-center justify-between rounded-md border border-border px-4 py-3.5">
              <Text className="text-body text-text-secondary">이번 달 누적</Text>
              <Text className="text-body font-sans-bold">{log.monthlyTotalPoints.toLocaleString("en-US")}점</Text>
            </View>
          </Up>
        </View>
      </ScrollView>

      <View style={{ paddingBottom: Math.max(insets.bottom, 12) + 10 }} className="gap-2 px-5">
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.replace("Timeline")}
          className="h-14 items-center justify-center rounded-md bg-primary"
        >
          <Text className="text-base font-sans-bold text-on-primary">타임라인에서 보기</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={goHome}
          className="h-13 items-center justify-center rounded-md border border-border bg-bg"
        >
          <Text className="text-subtitle font-sans-semibold">홈으로</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
