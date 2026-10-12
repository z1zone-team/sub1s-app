import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { useCreateTravelLogMutation } from "@/apis/mutations/travel/useCreateTravelLogMutation";
import { useDeviateCheckMutation } from "@/apis/mutations/tracking/useDeviateCheckMutation";
import { useStationFacilitiesQuery } from "@/apis/queries/stations/useStationFacilitiesQuery";
import { Button } from "@/common/components/Button";
import { DesignIcon } from "@/common/components/DesignIcon";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { formatDurationSec } from "@/common/utils/format";
import { ArrivalPopup } from "@/features/guide/components/ArrivalPopup";
import { GuideBanner } from "@/features/guide/components/GuideBanner";
import { ProgressTrack } from "@/features/guide/components/ProgressTrack";
import { guideMapData } from "@/features/guide/guideMap";
import { remainingParts, upcomingMessage } from "@/features/guide/guideText";
import { isOffRouteAlert } from "@/features/guide/offRoute";
import { visibleStopIndexes } from "@/features/guide/progress";
import { pickTrackStops, trackFill } from "@/features/guide/progressTrack";
import { useActiveGuideStore } from "@/features/guide/active-guide-store";
import { useGuide } from "@/features/guide/useGuide";
import { VWorldMap } from "@/features/map/VWorldMap";
import { RideBadge } from "@/features/routing/components/RideBadge";
import { describeDoor } from "@/features/routing/routeView";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { getLineInfo } from "@/theme";
import { cn } from "@/lib/cn";

type Props = NativeStackScreenProps<RootStackParamList, "LiveNav">;

export function LiveNavScreen({ navigation, route }: Props) {
  const { sessionId, option, startedAtMs } = route.params;

  if (!option || !startedAtMs) {
    return (
      <Screen edges={[]} contentClassName="items-center justify-center gap-4 p-6">
        <Text className="text-center">진행 중인 안내를 찾지 못했어요.</Text>
        <Button label="홈으로" onPress={() => navigation.navigate("MainTabs", { screen: "HomeTab" })} />
      </Screen>
    );
  }

  return (
    <Guide navigation={navigation} sessionId={sessionId} option={option} startedAtMs={startedAtMs} />
  );
}

interface GuideProps {
  navigation: Props["navigation"];
  sessionId: string;
  option: SubwayRouteOptionDto;
  startedAtMs: number;
}

/** 프로토타입 Guide.dc.html의 안내 중 화면. 전체 화면 지도 위에 다음 역 배너, 하차 알림, 아래 진행 시트가 올라온다 */
function Guide({ navigation, sessionId, option, startedAtMs }: GuideProps) {
  const insets = useSafeAreaInsets();
  const guide = useGuide({ option, sessionId, startedAtMs });
  const createLog = useCreateTravelLogMutation();
  const deviate = useDeviateCheckMutation();
  const [picking, setPicking] = useState(false);

  // 홈으로 나가도 안내가 이어지도록 진행 중인 안내를 기억한다
  useEffect(() => {
    useActiveGuideStore.getState().begin({ sessionId, option, startedAtMs });
  }, [sessionId, option, startedAtMs]);

  useEffect(() => {
    useActiveGuideStore.getState().setRemaining(guide.progress.remainingSec);
  }, [guide.progress.remainingSec]);

  useEffect(() => {
    if (!guide.alert) return;
    navigation.navigate("OffRoute", {
      alert: guide.alert,
      remainingSec: guide.progress.remainingSec,
    });
    guide.clearAlert();
  }, [guide.alert]);

  const { stops, info, progress, nowMs, segment, upcoming, coords } = guide;
  const nameAt = (index: number) => info.get(stops[index]?.stationId ?? "")?.name ?? "";
  const names = stops.map((_, index) => nameAt(index));
  const destination = nameAt(stops.length - 1);
  const visible = visibleStopIndexes(names);
  const stripCurrent = visible.filter((index) => index <= progress.currentIndex).length - 1;
  const stopsLeft = visible.filter((index) => index > progress.currentIndex).length;
  const nextVisible = visible.find((index) => index > progress.currentIndex) ?? progress.nextIndex;
  const upcomingAway = upcoming
    ? visible.filter((index) => index > progress.currentIndex && index <= upcoming.index).length
    : 0;
  const weakAcCars = (segment?.cars ?? []).filter((car) => car.isWeakAirConditioned).map((car) => car.carNo);
  const doors = segment?.recommendedDoors ?? [];
  const nearEnd = stopsLeft <= 1;
  const lineColor = getLineInfo(segment?.lineId ?? option.segments.find((s) => s.lineId !== "WALK")?.lineId ?? "").color;

  // 지도: 경로 선과 내 위치 (역 좌표는 안내 로직이 이미 조회해 둔 값)
  const mapData = useMemo(
    () =>
      guideMapData(
        option,
        info,
        coords ? { lat: coords.latitude, lng: coords.longitude } : undefined
      ),
    [option, info, coords]
  );

  // 진행 막대: 역이 많아도 6개만 보여 준다
  const trackIndexes = pickTrackStops(visible.length, stripCurrent);
  const trackNames = trackIndexes.map((position) => names[visible[position]]);
  const trackReached = Math.max(0, trackIndexes.filter((position) => position <= stripCurrent).length - 1);
  const fill = trackFill(trackIndexes, stripCurrent);

  // 하차 1개 역 전 알림: 내릴 역의 엘리베이터와 가까운 문, 환승이면 갈아타기 빠른 문
  const showAlight = upcoming?.kind === "ALIGHT" && upcomingAway === 1;
  const showTransfer = upcoming?.kind === "TRANSFER" && upcomingAway === 1;
  const arrivedAtEnd = stopsLeft <= 0;
  const alightStationId = showAlight ? stops[upcoming.index]?.stationId : undefined;
  const facilities = useStationFacilitiesQuery(alightStationId);
  const alightDoors = facilities.data?.available ? facilities.data.elevatorDoors : [];
  const alightExits = facilities.data?.available ? facilities.data.exits : [];
  const popupDetail = showAlight
    ? [
        alightDoors.length > 0 ? `${alightDoors.map(describeDoor).join(", ")} 문에서 내리면 엘리베이터가 가까워요` : "",
        alightExits.length > 0 ? `출구 ${alightExits.map((exit) => exit.exitNo).join(", ")}번` : "",
      ]
        .filter(Boolean)
        .join(" · ")
    : showTransfer && doors.length > 0
      ? `갈아타기 빠른 문 ${doors.map(describeDoor).join(", ")}`
      : "";

  const arrive = () => {
    const origin = stops[0]?.stationId;
    const dest = stops[stops.length - 1]?.stationId;
    if (!origin || !dest || createLog.isPending) return;
    createLog.mutate(
      { originStationId: origin, destStationId: dest, sessionId },
      {
        onSuccess: (log) => {
          useActiveGuideStore.getState().end();
          navigation.replace("Arrived", { log, destinationName: destination, arrivedAtMs: Date.now() });
        },
      }
    );
  };

  // 반대 방향 열차를 탔을 때: 사용자가 확정하면 서버가 지금 역에서 바로 회차 경로를 만들어 준다
  const reportWrongDirection = () => {
    const stop = stops[progress.currentIndex];
    if (!stop || deviate.isPending) return;
    deviate.mutate(
      { sessionId, detectedStationId: stop.stationId, isUserConfirmed: true },
      {
        onSuccess: (response) => {
          if (isOffRouteAlert(response)) {
            navigation.navigate("OffRoute", { alert: response, remainingSec: progress.remainingSec });
          }
        },
      }
    );
  };

  const parts = remainingParts(progress.remainingSec, nowMs);

  return (
    <View className="flex-1 bg-surface">
      <VWorldMap data={mapData} className="absolute inset-0" />

      <View style={{ top: insets.top + 8 }} className="absolute inset-x-3">
        <GuideBanner
          nextStationName={nameAt(nextVisible)}
          destinationName={destination}
          stopsLeft={stopsLeft}
          remainingLabel={progress.remainingSec > 0 ? `약 ${formatDurationSec(progress.remainingSec)}` : ""}
          weakAcCars={weakAcCars}
          onBack={() => navigation.navigate("MainTabs", { screen: "HomeTab" })}
        />
      </View>

      <View className="absolute inset-x-0 bottom-0">
        {showAlight || showTransfer || arrivedAtEnd ? (
          <View className="mx-3 mb-3">
            <ArrivalPopup
              title={
                arrivedAtEnd
                  ? `${destination || "도착역"}에 도착했어요`
                  : upcomingMessage({ ...upcoming!, stopsAway: upcomingAway }, nameAt(upcoming!.index))
              }
              detail={arrivedAtEnd ? "" : popupDetail}
              onArrive={showAlight || arrivedAtEnd ? arrive : undefined}
              loading={createLog.isPending}
            />
            {createLog.error ? (
              <Text className="mt-1.5 text-center text-body-sm text-error">이동 기록을 저장하지 못했어요. 다시 시도해 주세요.</Text>
            ) : null}
          </View>
        ) : null}

        <View
          style={{ paddingBottom: Math.max(insets.bottom, 12) + 10 }}
          className="rounded-t-xl border-t border-border bg-bg px-5 pt-2.5"
        >
          <View className="mb-3.5 h-1 w-9 self-center rounded-pill bg-border" />
          <View className="flex-row items-baseline justify-between">
            <View className="flex-row items-baseline">
              <Text className="text-headline font-sans-bold">{parts.amount}</Text>
              <Text className="ml-1.5 text-body-sm text-text-secondary">{parts.rest}</Text>
            </View>
            {segment ? (
              <RideBadge
                lineId={segment.lineId}
                kind={segment.isExpress ? "급행" : segment.lineId === "09" ? "일반" : undefined}
                size="md"
                full
              />
            ) : null}
          </View>

          <ProgressTrack names={trackNames} reachedIndex={trackReached} fill={fill} color={lineColor} />

          {!guide.locationGranted ? (
            <Text className="mt-2 text-small text-text-secondary">
              위치 권한이 없어 시간표로 위치를 추정하고 있어요.
            </Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => setPicking((value) => !value)}
            className="mt-1 items-center py-1.5"
          >
            <Text className="text-body-sm text-text-secondary">
              {picking ? "역 목록 닫기" : "지금 있는 역을 직접 알려주기"}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: deviate.isPending }}
            disabled={deviate.isPending}
            onPress={reportWrongDirection}
            className={cn("mt-1.5 h-11 flex-row items-center justify-center gap-1.5 rounded-md bg-surface", deviate.isPending ? "opacity-50" : "")}
          >
            <DesignIcon name="undo" size={16} />
            <Text className="text-body font-sans-bold">반대 방향 열차를 탔어요</Text>
          </Pressable>
          {deviate.error ? (
            <Text className="mt-1.5 text-center text-body-sm text-error">경로를 다시 찾지 못했어요. 잠시 후 다시 시도해 주세요.</Text>
          ) : null}

          <View className="mt-2 flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate("MainTabs", { screen: "HomeTab" })}
              className="h-14 flex-1 items-center justify-center rounded-lg bg-surface"
            >
              <Text className="text-base font-sans-semibold">홈 보기</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                useActiveGuideStore.getState().end();
                navigation.navigate("MainTabs", { screen: "HomeTab" });
              }}
              className="h-14 flex-1 items-center justify-center rounded-lg bg-surface"
            >
              <Text className="text-base font-sans-semibold text-error">안내 끝내기</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {picking ? (
        <View style={{ top: insets.top + 130 }} className="absolute inset-x-3 max-h-80 rounded-lg border border-border bg-bg">
          <ScrollView>
            {visible.slice(0, -1).map((index) => (
              <Pressable
                key={`${stops[index].stationId}-${index}`}
                accessibilityRole="button"
                onPress={() => {
                  guide.confirmStop(index);
                  setPicking(false);
                }}
                className="flex-row justify-between px-4 py-3"
              >
                <Text
                  className={cn(
                    "text-subtitle",
                    index === visible[stripCurrent] ? "font-sans-bold" : "font-sans-medium",
                    index < progress.currentIndex ? "text-text-secondary" : "text-text"
                  )}
                >
                  {names[index]}
                </Text>
                {index === visible[stripCurrent] ? <Text className="text-small text-primary">현재 추정</Text> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
