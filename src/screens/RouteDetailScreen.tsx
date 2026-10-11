import React from "react";
import { View } from "react-native";
import { useAuth } from "@clerk/clerk-expo";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useStationFacilitiesQuery } from "@/apis/queries/stations/useStationFacilitiesQuery";
import { useStartTrackingMutation } from "@/apis/mutations/tracking/useStartTrackingMutation";
import { Button } from "@/common/components/Button";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { formatDurationSec, formatFare } from "@/common/utils/format";
import { SegmentDetail } from "@/features/routing/components/SegmentDetail";
import { clockRange, describeDoor, walkSeconds } from "@/features/routing/routeView";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { WALK_LINE_ID } from "@/theme";

export function RouteDetailScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "RouteDetail">) {
  const { option, title, tagline, destination } = route.params;

  const lastRide = [...option.segments].reverse().find((segment) => segment.lineId !== WALK_LINE_ID);
  const firstRideIndex = option.segments.findIndex((segment) => segment.lineId !== WALK_LINE_ID);
  const facilities = useStationFacilitiesQuery(lastRide?.toStationId);
  const walk = walkSeconds(option);
  const { isSignedIn } = useAuth();
  const startTracking = useStartTrackingMutation();
  const canGuide = firstRideIndex >= 0 && (option.stationIds?.length ?? 0) > 1;

  const startGuide = () => {
    if (startTracking.isPending) return;
    if (!isSignedIn) {
      navigation.navigate("Login");
      return;
    }
    startTracking.mutate(
      { routeOption: option, stationIds: option.stationIds },
      {
        onSuccess: (session) =>
          navigation.navigate("LiveNav", {
            sessionId: session.sessionId,
            option,
            startedAtMs: Date.now(),
          }),
      }
    );
  };

  return (
    <Screen edges={[]} scroll contentClassName="px-5">
      <View className="gap-1.5 py-4">
        <Text className="text-body-sm font-sans-extrabold text-primary">{title}</Text>
        {tagline ? <Text className="text-body-sm text-text-secondary">{tagline}</Text> : null}
        <Text className="text-display-sm font-sans-extrabold">
          {formatDurationSec(option.totalDurationSec)}
        </Text>
        <Text className="text-body-sm text-text-secondary">
          {[
            clockRange(option),
            `환승 ${option.transferCount}회`,
            formatFare(option.totalFare),
            walk > 0 ? `도보 ${formatDurationSec(walk)}` : "",
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>

      {option.segments.map((segment, index) => (
        <View key={`${segment.lineId}-${index}`} className={index === 0 ? "" : "border-t border-border"}>
          <SegmentDetail segment={segment} showNextTrain={index === firstRideIndex} />
        </View>
      ))}

      <View className="gap-1.5 border-t border-border py-4">
        <Text className="text-heading font-sans-extrabold">
          {destination.name || lastRide?.toStationName || "도착"} 도착
        </Text>
        {lastRide && facilities.data?.available && facilities.data.elevatorDoors.length > 0 ? (
          <Text className="text-body-sm text-text-secondary">
            {lastRide.toStationName}역 엘리베이터와 가까운 문{" "}
            {facilities.data.elevatorDoors.map(describeDoor).join(", ")}
          </Text>
        ) : null}
        {lastRide && facilities.data?.available && facilities.data.exits.length > 0 ? (
          <Text className="text-body-sm text-text-secondary">
            출구 {facilities.data.exits.map((exit) => exit.exitNo).join(", ")}번
          </Text>
        ) : null}
      </View>

      {canGuide ? (
        <View className="gap-2 pb-2">
          <Button label="안내 시작" onPress={startGuide} loading={startTracking.isPending} />
          {startTracking.error ? (
            <Text className="text-center text-body-sm text-error">
              안내를 시작하지 못했어요. 다시 시도해 주세요.
            </Text>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}
