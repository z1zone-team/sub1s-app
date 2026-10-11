import React from "react";
import { Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useStationFacilitiesQuery } from "@/apis/queries/stations/useStationFacilitiesQuery";
import { Screen } from "@/common/components/Screen";
import { formatDurationSec, formatFare } from "@/common/utils/format";
import { SegmentDetail } from "@/features/routing/components/SegmentDetail";
import { clockRange, describeDoor, walkSeconds } from "@/features/routing/routeView";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { useTheme, WALK_LINE_ID } from "@/theme";

export function RouteDetailScreen({
  route,
}: NativeStackScreenProps<RootStackParamList, "RouteDetail">) {
  const { colors } = useTheme();
  const { option, title, tagline, destination } = route.params;

  const lastRide = [...option.segments].reverse().find((segment) => segment.lineId !== WALK_LINE_ID);
  const firstRideIndex = option.segments.findIndex((segment) => segment.lineId !== WALK_LINE_ID);
  const facilities = useStationFacilitiesQuery(lastRide?.toStationId);
  const walk = walkSeconds(option);

  return (
    <Screen edges={[]} scroll contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ paddingVertical: 16, gap: 6 }}>
        <Text style={{ fontSize: 13, fontWeight: "800", color: colors.primary }}>{title}</Text>
        {tagline ? <Text style={{ fontSize: 13, color: colors.textSecondary }}>{tagline}</Text> : null}
        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text }}>
          {formatDurationSec(option.totalDurationSec)}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
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
        <View
          key={`${segment.lineId}-${index}`}
          style={{ borderTopWidth: index === 0 ? 0 : 1, borderTopColor: colors.border }}
        >
          <SegmentDetail segment={segment} showNextTrain={index === firstRideIndex} />
        </View>
      ))}

      <View style={{ paddingVertical: 16, gap: 6, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 17, fontWeight: "800", color: colors.text }}>
          {destination.name || lastRide?.toStationName || "도착"} 도착
        </Text>
        {lastRide && facilities.data?.available && facilities.data.elevatorDoors.length > 0 ? (
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            {lastRide.toStationName}역 엘리베이터와 가까운 문{" "}
            {facilities.data.elevatorDoors.map(describeDoor).join(", ")}
          </Text>
        ) : null}
        {lastRide && facilities.data?.available && facilities.data.exits.length > 0 ? (
          <Text style={{ fontSize: 13, color: colors.textSecondary }}>
            출구 {facilities.data.exits.map((exit) => exit.exitNo).join(", ")}번
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}
