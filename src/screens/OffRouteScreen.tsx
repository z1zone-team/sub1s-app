import React from "react";
import { View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useStartTrackingMutation } from "@/apis/mutations/tracking/useStartTrackingMutation";
import { Button } from "@/common/components/Button";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { formatClockKst } from "@/common/utils/format";
import { delayText } from "@/features/guide/offRoute";
import { useOffRouteStore } from "@/features/guide/offroute-store";
import { SegmentDetail } from "@/features/routing/components/SegmentDetail";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { WALK_LINE_ID } from "@/theme";

export function OffRouteScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "OffRoute">) {
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
    <Screen scroll contentClassName="gap-4 px-6">
      <View className="items-center gap-2 pt-6">
        <Text className="text-hero font-sans-extrabold text-error">!</Text>
        <Text className="text-headline font-sans-extrabold">경로를 이탈했어요</Text>
        <Text className="text-center text-body text-text-secondary">{alert.message}</Text>
      </View>

      <View className="gap-1 rounded-lg bg-surface p-4">
        <Text className="text-body-sm font-sans-bold text-primary">새 경로</Text>
        <Text className="text-title font-sans-extrabold">
          {formatClockKst(option.estimatedArrivalTimestamp)} 도착 ·{" "}
          {delayText(option.totalDurationSec, remainingSec)}
        </Text>
        <Text className="mt-2 text-body">{alert.detectedStationName} 하차 · 맞은편 승강장으로 이동</Text>
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

      <Text className="text-small text-text-secondary">
        잘못 탄 게 아니라면 맞게 탔어요를 눌러 주세요. 다음 역 정차 정보로 다시 확인할게요.
      </Text>
      {startTracking.error ? (
        <Text className="text-center text-body-sm text-error">새 경로를 시작하지 못했어요. 다시 시도해 주세요.</Text>
      ) : null}

      <View className="gap-2 pb-4">
        <Button label="새 경로로 안내" onPress={startReroute} loading={startTracking.isPending} />
        <Button label="맞게 탔어요" variant="secondary" onPress={keepRoute} />
      </View>
    </Screen>
  );
}
