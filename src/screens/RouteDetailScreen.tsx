import React, { useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useAuth } from "@clerk/expo";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStartTrackingMutation } from "@/apis/mutations/tracking/useStartTrackingMutation";
import { useStationsQuery } from "@/apis/queries/stations/useStationsQuery";
import { BackButton } from "@/common/components/BackButton";
import { DesignIcon } from "@/common/components/DesignIcon";
import { Text } from "@/common/components/Text";
import { formatClockKst, formatDurationSec, formatFare } from "@/common/utils/format";
import { VWorldMap } from "@/features/map/VWorldMap";
import { RouteTimeline } from "@/features/routing/components/RouteTimeline";
import { splitDuration } from "@/features/routing/routeCardView";
import { endpointCoords } from "@/features/routing/endpoint";
import { clockRangeShort, mapStationIds, routeMapData } from "@/features/routing/routeTimeline";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { WALK_LINE_ID } from "@/theme";

/** 프로토타입 RouteDetail.dc.html의 위쪽 지도 높이와, 그 위로 48px 겹쳐 올라오는 시트의 위치 */
const MAP_HEIGHT = 420;
const SHEET_TOP = 372;

export function RouteDetailScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "RouteDetail">) {
  const { option, title, tagline, origin, destination } = route.params;
  const insets = useSafeAreaInsets();

  const lastRide = [...option.segments].reverse().find((segment) => segment.lineId !== WALK_LINE_ID);
  const firstRideIndex = option.segments.findIndex((segment) => segment.lineId !== WALK_LINE_ID);
  const { isSignedIn } = useAuth();
  const startTracking = useStartTrackingMutation();
  const canGuide = firstRideIndex >= 0 && (option.stationIds?.length ?? 0) > 1;
  const canWalkGuide =
    firstRideIndex < 0 && option.segments.length > 0 && Boolean(endpointCoords(origin)) && Boolean(endpointCoords(destination));

  // 지도: 경로가 지나는 역의 좌표를 받아 호선 색 선으로 잇는다
  const stationIds = useMemo(() => mapStationIds(option), [option]);
  const stations = useStationsQuery(stationIds);
  const mapData = useMemo(() => {
    const coords = new Map((stations.data?.items ?? []).map((item) => [item.stationId, { lat: item.lat, lng: item.lng }]));
    return routeMapData(option, coords, {
      origin: endpointCoords(origin),
      destination: endpointCoords(destination),
    });
  }, [option, stations.data, origin, destination]);

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
            origin,
            destination,
          }),
      }
    );
  };

  const { hours, minutes } = splitDuration(option.totalDurationSec);

  return (
    <View className="flex-1 bg-surface">
      <View className="absolute inset-x-0 top-0" style={{ height: MAP_HEIGHT }}>
        <VWorldMap data={mapData} className="flex-1" />
      </View>

      <BackButton onPress={() => navigation.goBack()} variant="floating" iconSize={22} style={{ top: insets.top + 10 }} className="absolute left-4" />

      <View style={{ top: SHEET_TOP }} className="absolute inset-x-0 bottom-0 rounded-t-xl border-t border-border bg-bg">
        <View className="mb-0.5 mt-2.5 h-1 w-9 self-center rounded-pill bg-border" />
        <ScrollView contentContainerClassName="px-5 pb-27.5 pt-3.5" showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center gap-1.5">
            <View className="h-6 justify-center rounded-xs-plus bg-primary px-2.25">
              <Text className="text-caption font-sans-bold text-on-primary">{title}</Text>
            </View>
            {tagline ? (
              <Text numberOfLines={1} className="shrink text-small font-sans-semibold text-text-secondary">
                {tagline}
              </Text>
            ) : null}
          </View>

          <View className="mt-2.5 flex-row flex-wrap items-baseline gap-0.5">
            {hours > 0 ? (
              <>
                <Text className="text-display-lg font-sans-bold">{hours}</Text>
                <Text className="mr-1 text-base font-sans-bold">시간</Text>
              </>
            ) : null}
            {minutes > 0 || hours === 0 ? (
              <>
                <Text className="text-display-lg font-sans-bold">{minutes}</Text>
                <Text className="text-base font-sans-bold">분</Text>
              </>
            ) : null}
            <Text className="ml-2.5 shrink text-body text-text-secondary">
              {[clockRangeShort(option, formatClockKst), `환승 ${option.transferCount}회`].filter(Boolean).join(" · ")} ·{" "}
              <Text className="text-body font-sans-bold text-text">{formatFare(option.totalFare)}</Text>
            </Text>
          </View>

          <RouteTimeline option={option} destinationName={destination.name || lastRide?.toStationName || "도착지"} />
        </ScrollView>
      </View>

      <View
        style={{ paddingBottom: Math.max(insets.bottom, 12) + 10 }}
        className="absolute inset-x-0 bottom-0 flex-row gap-2 bg-bg px-4 pt-3"
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          className="h-14 flex-1 items-center justify-center rounded-lg bg-surface"
        >
          <Text className="text-base font-sans-semibold">다른 경로</Text>
        </Pressable>
        {canGuide || canWalkGuide ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: startTracking.isPending }}
            disabled={startTracking.isPending}
            onPress={canGuide ? startGuide : () => navigation.navigate("WalkNav", { option, origin, destination })}
            style={{ flex: 2 }}
            className="h-14 flex-row items-center justify-center gap-1.5 rounded-lg bg-primary"
          >
            <DesignIcon name="navigate" size={16} tone="onPrimary" />
            <Text className="text-base font-sans-bold text-on-primary">
              {formatDurationSec(option.totalDurationSec)} {canGuide ? "안내 시작" : "걸어서 안내 시작"}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {startTracking.error ? (
        <Text
          style={{ bottom: Math.max(insets.bottom, 12) + 84 }}
          className="absolute inset-x-5 text-center text-body-sm text-error"
        >
          안내를 시작하지 못했어요. 다시 시도해 주세요.
        </Text>
      ) : null}
    </View>
  );
}
