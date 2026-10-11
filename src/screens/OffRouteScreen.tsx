import React from "react";
import { Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useStartTrackingMutation } from "@/apis/mutations/tracking/useStartTrackingMutation";
import { Button } from "@/common/components/Button";
import { Screen } from "@/common/components/Screen";
import { formatClockKst } from "@/common/utils/format";
import { delayText } from "@/features/guide/offRoute";
import { useOffRouteStore } from "@/features/guide/offroute-store";
import { SegmentDetail } from "@/features/routing/components/SegmentDetail";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { useTheme, WALK_LINE_ID } from "@/theme";

export function OffRouteScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "OffRoute">) {
  const { colors } = useTheme();
  const { alert, remainingSec } = route.params;
  const option = alert.rerouteOption;
  const startTracking = useStartTrackingMutation();
  const firstRideIndex = option.segments.findIndex((segment) => segment.lineId !== WALK_LINE_ID);

  const startReroute = () => {
    if (startTracking.isPending) return;
    startTracking.mutate(
      { routeOption: option, stationIds: option.stationIds },
      {
        onSuccess: (session) => {
          useOffRouteStore.getState().reset();
          navigation.reset({
            index: 1,
            routes: [
              { name: "MainTabs" },
              {
                name: "LiveNav",
                params: { sessionId: session.sessionId, option, startedAtMs: Date.now() },
              },
            ],
          });
        },
      }
    );
  };

  const keepRoute = () => {
    useOffRouteStore.getState().dismiss();
    navigation.goBack();
  };

  return (
    <Screen scroll contentStyle={{ paddingHorizontal: 24, gap: 16 }}>
      <View style={{ alignItems: "center", gap: 8, paddingTop: 24 }}>
        <Text style={{ fontSize: 40, fontWeight: "800", color: colors.error }}>!</Text>
        <Text style={{ fontSize: 22, fontWeight: "800", color: colors.text }}>경로를 이탈했어요</Text>
        <Text style={{ fontSize: 14, textAlign: "center", color: colors.textSecondary }}>
          {alert.message}
        </Text>
      </View>

      <View style={{ padding: 16, gap: 4, borderRadius: 16, backgroundColor: colors.surface }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.primary }}>새 경로</Text>
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>
          {formatClockKst(option.estimatedArrivalTimestamp)} 도착 ·{" "}
          {delayText(option.totalDurationSec, remainingSec)}
        </Text>
        <Text style={{ marginTop: 8, fontSize: 14, color: colors.text }}>
          {alert.detectedStationName} 하차 · 맞은편 승강장으로 이동
        </Text>
        {option.segments.map((segment, index) =>
          segment.lineId === WALK_LINE_ID ? null : (
            <SegmentDetail
              key={`${segment.lineId}-${index}`}
              segment={segment}
              showNextTrain={index === firstRideIndex}
            />
          )
        )}
      </View>

      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
        잘못 탄 게 아니라면 맞게 탔어요를 눌러 주세요. 다음 역 정차 정보로 다시 확인할게요.
      </Text>
      {startTracking.error ? (
        <Text style={{ fontSize: 13, textAlign: "center", color: colors.error }}>
          새 경로를 시작하지 못했어요. 다시 시도해 주세요.
        </Text>
      ) : null}

      <View style={{ gap: 8, paddingBottom: 16 }}>
        <Button label="새 경로로 안내" onPress={startReroute} loading={startTracking.isPending} />
        <Button label="맞게 탔어요" variant="secondary" onPress={keepRoute} />
      </View>
    </Screen>
  );
}
