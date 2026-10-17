import React, { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { useAuth } from "@clerk/expo";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStartTrackingMutation } from "@/apis/mutations/tracking/useStartTrackingMutation";
import { useStationsQuery } from "@/apis/queries/stations/useStationsQuery";
import { BackButton } from "@/common/components/BackButton";
import { DesignIcon } from "@/common/components/DesignIcon";
import { DraggableSheet } from "@/common/components/DraggableSheet";
import { Text } from "@/common/components/Text";
import { formatClockKst, formatDurationSec, formatFare } from "@/common/utils/format";
import { VWorldMap } from "@/features/map/VWorldMap";
import { RouteTimeline } from "@/features/routing/components/RouteTimeline";
import { splitDuration } from "@/features/routing/routeCardView";
import { endpointCoords } from "@/features/routing/endpoint";
import { clockRangeShort, mapStationIds, routeMapData } from "@/features/routing/routeTimeline";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { WALK_LINE_ID } from "@/theme";

/** 프로토타입 RouteDetail.dc.html에서 시트가 펼쳐졌을 때 위쪽에 남기는 지도의 높이 */
const SHEET_TOP = 372;

export function RouteDetailScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, "RouteDetail">) {
  const { option, title, tagline, origin, destination } = route.params;
  const insets = useSafeAreaInsets();
  const [areaHeight, setAreaHeight] = useState(0);
  const [footerHeight, setFooterHeight] = useState(0);
  const [sheetVisible, setSheetVisible] = useState(0);

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
    return {
      ...routeMapData(option, coords, {
        origin: endpointCoords(origin),
        destination: endpointCoords(destination),
      }),
      // 시트가 덮은 아래를 빼고 남은 지도에 경로가 보이게 맞춘다
      bottomInset: sheetVisible,
    };
  }, [option, stations.data, origin, destination, sheetVisible]);

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
    <View className="flex-1 bg-surface" onLayout={(event) => setAreaHeight(Math.round(event.nativeEvent.layout.height))}>
      <VWorldMap data={mapData} className="absolute inset-0" />

      <BackButton onPress={() => navigation.goBack()} variant="floating" iconSize={22} style={{ top: insets.top + 10 }} className="absolute left-4" />

      <DraggableSheet
        label="경로 상세"
        className="px-5"
        height={Math.max(areaHeight - SHEET_TOP, 0)}
        bottomInset={footerHeight}
        scrollable
        onVisibleHeightChange={setSheetVisible}
        header={
          <View className="pt-3.5">
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
          </View>
        }
      >
      <RouteTimeline option={option} destinationName={destination.name || lastRide?.toStationName || "도착지"} />
        <View style={{ height: footerHeight + 16 }} />
      </DraggableSheet>

      <View
        onLayout={(event) => setFooterHeight(Math.round(event.nativeEvent.layout.height))}
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
