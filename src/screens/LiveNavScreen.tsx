import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { useCreateTravelLogMutation } from "@/apis/mutations/travel/useCreateTravelLogMutation";
import { useDeviateCheckMutation } from "@/apis/mutations/tracking/useDeviateCheckMutation";
import { useStationFacilitiesQuery } from "@/apis/queries/stations/useStationFacilitiesQuery";
import { useTrainPositionsQuery } from "@/apis/queries/trains/useTrainPositionsQuery";
import { Button } from "@/common/components/Button";
import { DesignIcon } from "@/common/components/DesignIcon";
import { DraggableSheet, SHEET_FULL_HANDLE_HEIGHT, type DraggableSheetHandle } from "@/common/components/DraggableSheet";
import { Screen } from "@/common/components/Screen";
import { Text } from "@/common/components/Text";
import { formatDurationSec } from "@/common/utils/format";
import { ArrivalPopup } from "@/features/guide/components/ArrivalPopup";
import { GuideBannerCompact, GUIDE_BANNER_COMPACT_HEIGHT } from "@/features/guide/components/GuideBannerCompact";
import { RouteDiagram } from "@/features/guide/components/RouteDiagram";
import { buildRouteDiagram } from "@/features/guide/routeDiagram";
import { GuideBanner } from "@/features/guide/components/GuideBanner";
import { SmartAlertBanner } from "@/features/guide/components/SmartAlertBanner";
import { PhaseCard } from "@/features/guide/components/PhaseCard";
import { ProgressTrack } from "@/features/guide/components/ProgressTrack";
import { guideMapData } from "@/features/guide/guideMap";
import {
  phaseBannerLabel,
  phaseTitle,
  remainingParts,
  rideDetail,
  upcomingMessage,
  walkDetail,
} from "@/features/guide/guideText";
import { isOffRouteAlert } from "@/features/guide/offRoute";
import { visibleStopIndexes } from "@/features/guide/progress";
import { pickTrackStops, trackFill } from "@/features/guide/progressTrack";
import { useActiveGuideStore } from "@/features/guide/active-guide-store";
import { smartAlertBody, smartAlertTitle } from "@/features/guide/smartAlert";
import { isFreshPositions, positionAgeLabel, trainMarkers } from "@/features/guide/trainMarkers";
import { useGuide } from "@/features/guide/useGuide";
import { useSmartAlert } from "@/features/guide/useSmartAlert";
import { VWorldMap } from "@/features/map/VWorldMap";
import { RideBadge } from "@/features/routing/components/RideBadge";
import { endpointCoords, type RouteEndpoint } from "@/features/routing/endpoint";
import { describeDoor } from "@/features/routing/routeView";
import type { RootStackParamList } from "@/navigation/navigation-types";
import { getLineInfo } from "@/theme";
import { cn } from "@/lib/cn";

type Props = NativeStackScreenProps<RootStackParamList, "LiveNav">;

/** 안내 배너가 상태 표시줄 아래에서 떨어진 거리 */
const BANNER_TOP_OFFSET = 4;

export function LiveNavScreen({ navigation, route }: Props) {
  const { sessionId, option, startedAtMs, origin, destination } = route.params;

  if (!option || !startedAtMs) {
    return (
      <Screen edges={[]} contentClassName="items-center justify-center gap-4 p-6">
        <Text className="text-center">진행 중인 안내를 찾지 못했어요.</Text>
        <Button label="홈으로" onPress={() => navigation.navigate("MainTabs", { screen: "HomeTab", params: { recenterRequest: Date.now() } })} />
      </Screen>
    );
  }

  return (
    <Guide
      navigation={navigation}
      sessionId={sessionId}
      option={option}
      startedAtMs={startedAtMs}
      origin={origin}
      destination={destination}
    />
  );
}

interface GuideProps {
  navigation: Props["navigation"];
  sessionId: string;
  option: SubwayRouteOptionDto;
  startedAtMs: number;
  origin?: RouteEndpoint;
  destination?: RouteEndpoint;
}

/** 프로토타입 Guide.dc.html의 안내 중 화면. 전체 화면 지도 위에 다음 역 배너, 하차 알림, 아래 진행 시트가 올라온다 */
function Guide({ navigation, sessionId, option, startedAtMs, origin, destination: destinationEndpoint }: GuideProps) {
  const insets = useSafeAreaInsets();
  const guide = useGuide({ option, sessionId, startedAtMs, originCoords: endpointCoords(origin) });
  const createLog = useCreateTravelLogMutation();
  const deviate = useDeviateCheckMutation();
  const [picking, setPicking] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(0);
  const [popupHeight, setPopupHeight] = useState(0);
  const [bannerHeight, setBannerHeight] = useState(0);
  // 시트를 전체로 올리면 큰 배너 대신 한 줄 배너를 보여 준다
  const [sheetFull, setSheetFull] = useState(false);
  // 진행 표시에서 누른 역(경로의 순번). 있으면 지도가 그 역으로 확대된다
  const [focusedStop, setFocusedStop] = useState<number | null>(null);
  const sheetControl = useRef<DraggableSheetHandle | null>(null);
  // 전체 단계의 노선도가 놓일 자리: 시트 제목 줄 아래부터 아래 고정 영역 위까지
  const [sheetHeaderHeight, setSheetHeaderHeight] = useState(0);
  const [dockHeight, setDockHeight] = useState(0);
  const [diagramWidth, setDiagramWidth] = useState(0);
  // 시트가 올라온 정도(0 디폴트, 1 전체). 끄는 동안 계속 바뀌어 배너가 시트와 같은 속도로 바뀐다
  const [fullAnim, setFullAnim] = useState<Animated.Value | Animated.AnimatedInterpolation<number>>(
    () => new Animated.Value(0)
  );

  // 홈으로 나가도 안내가 이어지도록 진행 중인 안내를 기억한다
  useEffect(() => {
    useActiveGuideStore.getState().begin({ sessionId, option, startedAtMs, origin, destination: destinationEndpoint });
  }, [sessionId, option, startedAtMs, origin, destinationEndpoint]);

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

  const smartAlert = useSmartAlert();

  const { stops, info, progress, nowMs, segment, upcoming, coords, phase, boardingIndex } = guide;
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

  // 타는 호선의 열차 위치(서버가 모아 둔 값)를 지도에 점으로 보여 준다. 서버가 모으지 않는 호선이면 아무것도 안 보인다
  const trainLineId = segment && segment.lineId !== "WALK" ? segment.lineId : undefined;
  const trainPositions = useTrainPositionsQuery(trainLineId).data;
  const freshTrains = isFreshPositions(trainPositions) ? trainPositions : undefined;
  const trainPoints = useMemo(
    () =>
      freshTrains && trainLineId && segment && segment.direction !== "NONE"
        ? trainMarkers(freshTrains.trains, {
            lineId: trainLineId,
            direction: segment.direction,
            stops,
            stations: info,
            color: lineColor,
          })
        : [],
    [freshTrains, trainLineId, segment, stops, info, lineColor]
  );

  // 지도: 경로 선과 내 위치 (역 좌표는 안내 로직이 이미 조회해 둔 값)
  // 누른 역으로 지도를 확대한다. 같은 역을 다시 누르면 내 위치를 따라가는 지도로 돌아간다
  const focusStop = (stop: number) => {
    setFocusedStop((current) => (current === stop ? null : stop));
    sheetControl.current?.snapTo("TOP");
  };
  const focusedPoint = focusedStop !== null ? info.get(stops[focusedStop]?.stationId ?? "") : undefined;
  const mapData = useMemo(() => {
    const data = guideMapData(
      option,
      info,
      coords ? { lat: coords.latitude, lng: coords.longitude } : undefined,
      { origin: endpointCoords(origin), destination: endpointCoords(destinationEndpoint) },
      { top: insets.top + BANNER_TOP_OFFSET + bannerHeight, bottom: sheetVisible + popupHeight },
      trainPoints
    );
    return focusedPoint ? { ...data, focus: [[focusedPoint.lat, focusedPoint.lng] as [number, number]] } : data;
  }, [
    option,
    info,
    coords,
    origin,
    destinationEndpoint,
    sheetVisible,
    popupHeight,
    bannerHeight,
    insets.top,
    trainPoints,
    focusedPoint,
  ]);

  // 전체 단계의 노선도. 환승이 없으면 일직선, 있으면 S자
  const diagram = useMemo(
    () =>
      diagramWidth > 0
        ? buildRouteDiagram({ option, stops, names, visible, currentPosition: stripCurrent, width: diagramWidth })
        : undefined,
    // names, visible은 stops와 info에서 나오는 값이라 이 둘이 바뀔 때 다시 만든다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [option, stops, info, stripCurrent, diagramWidth]
  );
  const diagramTop = insets.top + BANNER_TOP_OFFSET + GUIDE_BANNER_COMPACT_HEIGHT + 4 + SHEET_FULL_HANDLE_HEIGHT + sheetHeaderHeight;

  // 진행 막대: 역이 많아도 6개만 보여 준다
  const trackIndexes = pickTrackStops(visible.length, stripCurrent);
  const trackNames = trackIndexes.map((position) => names[visible[position]]);
  const trackReached = Math.max(0, trackIndexes.filter((position) => position <= stripCurrent).length - 1);
  const fill = trackFill(trackIndexes, stripCurrent);

  // 하차 1개 역 전 알림: 빠른 하차(엘리베이터 인접 문) 또는 빠른 환승 문
  // 열차를 타기 전(걷는 중, 승강장 대기)에는 하차나 환승 알림을 띄우지 않는다
  const riding = phase === "RIDING";
  const showAlight = riding && upcoming?.kind === "ALIGHT" && upcomingAway === 1;
  const showTransfer = riding && upcoming?.kind === "TRANSFER" && upcomingAway === 1;
  const arrivedAtEnd = stopsLeft <= 0;
  const alightStationId = showAlight ? stops[upcoming.index]?.stationId : undefined;
  const facilities = useStationFacilitiesQuery(alightStationId);
  const alightDoors = facilities.data?.available ? facilities.data.elevatorDoors : [];
  const alightExits = facilities.data?.available ? facilities.data.exits : [];
  const popupDetail = showAlight
    ? [
        alightDoors.length > 0 ? `빠른 하차 · 엘리베이터 · ${alightDoors.map(describeDoor).join(", ")}` : "",
        alightExits.length > 0 ? `출구 ${alightExits.map((exit) => exit.exitNo).join(", ")}번` : "",
      ]
        .filter(Boolean)
        .join(" · ")
    : showTransfer && doors.length > 0
      ? `빠른 환승 · ${doors.map(describeDoor).join(", ")}`
      : "";

  const bottomPadding = Math.max(insets.bottom, 12) + 10;
  const hasPopup = showAlight || showTransfer || arrivedAtEnd;
  // 알림이 사라지면 그 높이를 지도 계산에서 뺀다
  useEffect(() => {
    if (!hasPopup) setPopupHeight(0);
  }, [hasPopup]);

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

      <DraggableSheet
        label="안내"
        controlRef={sheetControl}
        className="px-5"
        scrollable
        expandable
        contentFirst
        // 전체로 올리면 위에는 한 줄 배너만 남으므로 그 아래부터 내용이 시작한다
        fullTopInset={insets.top + BANNER_TOP_OFFSET + GUIDE_BANNER_COMPACT_HEIGHT + 4}
        onPositionChange={(position) => setSheetFull(position === "FULL")}
        onFullProgress={setFullAnim}
        bottomDock={
          <View onLayout={(event) => setDockHeight(Math.round(event.nativeEvent.layout.height))}>
            {phase === "WALK_TO_STATION" && boardingIndex !== undefined ? (
              <PhaseCard
                title={phaseTitle(phase, nameAt(boardingIndex))}
                detail={walkDetail(guide.walkDistanceM)}
                actionLabel="역에 도착했어요"
                onAction={guide.reachStation}
                hint={guide.locationGranted ? "역 근처에 오면 자동으로 알려 줘요" : undefined}
              />
            ) : null}
            {phase === "WAITING" && boardingIndex !== undefined ? (
              <PhaseCard
                title={phaseTitle(phase, nameAt(boardingIndex))}
                detail={segment ? rideDetail(getLineInfo(segment.lineId).name, segment.toStationName) : undefined}
                actionLabel="열차에 탔어요"
                onAction={guide.board}
              />
            ) : null}

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

            {riding ? (
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
            ) : null}
            {deviate.error ? (
              <Text className="mt-1.5 text-center text-body-sm text-error">경로를 다시 찾지 못했어요. 잠시 후 다시 시도해 주세요.</Text>
            ) : null}

            <View className="mt-2 flex-row gap-2">
              <Pressable
                accessibilityRole="button"
                onPress={() => navigation.navigate("MainTabs", { screen: "HomeTab", params: { recenterRequest: Date.now() } })}
                className="h-14 flex-1 items-center justify-center rounded-lg bg-surface"
              >
                <Text className="text-base font-sans-semibold">홈 보기</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  useActiveGuideStore.getState().end();
                  navigation.navigate("MainTabs", { screen: "HomeTab", params: { recenterRequest: Date.now() } });
                }}
                className="h-14 flex-1 items-center justify-center rounded-lg bg-surface"
              >
                <Text className="text-base font-sans-semibold text-error">안내 끝내기</Text>
              </Pressable>
            </View>
        
          </View>
        }
        bottomInset={bottomPadding}
        coverBottom
        onVisibleHeightChange={setSheetVisible}
        above={
          hasPopup ? (
            <View className="mx-3 mb-3" onLayout={(event) => setPopupHeight(Math.round(event.nativeEvent.layout.height))}>
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
          ) : null
        }
        header={
              <View
                onLayout={(event) => setSheetHeaderHeight(Math.round(event.nativeEvent.layout.height))}
                className="flex-row items-baseline justify-between"
              >
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
        }
      >
        <ProgressTrack
          names={trackNames}
          reachedIndex={trackReached}
          fill={fill}
          color={lineColor}
          onSelect={(trackIndex) => focusStop(visible[trackIndexes[trackIndex]])}
        />
      </DraggableSheet>

      {/* 전체 단계에서만 위쪽 진행 표시 자리를 덮는 노선도. 시트와 함께 올라오는 동안 서서히 나타난다 */}
      <Animated.View
        pointerEvents={sheetFull ? "auto" : "none"}
        onLayout={(event) => setDiagramWidth(Math.round(event.nativeEvent.layout.width))}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: diagramTop,
          bottom: dockHeight + bottomPadding,
          opacity: fullAnim.interpolate({ inputRange: [0.6, 1], outputRange: [0, 1], extrapolate: "clamp" }),
        }}
        className="bg-bg"
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {diagram ? <RouteDiagram model={diagram} width={diagramWidth} onSelect={focusStop} /> : null}
        </ScrollView>
      </Animated.View>

      {/* 시트를 전체로 올려도 안내 배너가 시트 위에 보이도록 시트보다 나중에 그린다 */}
      <View
        style={{ top: insets.top + BANNER_TOP_OFFSET }}
        className="absolute inset-x-3"
        onLayout={(event) => setBannerHeight(Math.round(event.nativeEvent.layout.height))}
      >
        {/* 전체로 올리면 큰 배너는 위로 사라지고 한 줄 배너가 아래에서 올라오며 바뀐다 */}
        <Animated.View
          pointerEvents={sheetFull ? "none" : "auto"}
          style={{
            // 시트가 절반쯤 올라올 때까지 큰 배너가 위로 사라지고, 그 뒤에 한 줄 배너가 나타나 두 배너가 겹쳐 보이지 않는다
            opacity: fullAnim.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: "clamp" }),
            transform: [{ translateY: fullAnim.interpolate({ inputRange: [0, 0.5], outputRange: [0, -12], extrapolate: "clamp" }) }],
          }}
        >
          <GuideBanner
            label={phaseBannerLabel(phase)}
            nextStationName={riding || boardingIndex === undefined ? nameAt(nextVisible) : nameAt(boardingIndex)}
            destinationName={destination}
            stopsLeft={stopsLeft}
            remainingLabel={progress.remainingSec > 0 ? `약 ${formatDurationSec(progress.remainingSec)}` : ""}
            weakAcCars={weakAcCars}
            onBack={() => navigation.navigate("MainTabs", { screen: "HomeTab", params: { recenterRequest: Date.now() } })}
          />
        </Animated.View>
        <Animated.View
          pointerEvents={sheetFull ? "auto" : "none"}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            opacity: fullAnim.interpolate({ inputRange: [0.5, 1], outputRange: [0, 1], extrapolate: "clamp" }),
            transform: [{ translateY: fullAnim.interpolate({ inputRange: [0.5, 1], outputRange: [12, 0], extrapolate: "clamp" }) }],
          }}
        >
          <GuideBannerCompact
            nextStationName={riding || boardingIndex === undefined ? nameAt(nextVisible) : nameAt(boardingIndex)}
            stopsLeft={stopsLeft}
            remainingLabel={progress.remainingSec > 0 ? `약 ${formatDurationSec(progress.remainingSec)}` : ""}
            onBack={() => navigation.navigate("MainTabs", { screen: "HomeTab", params: { recenterRequest: Date.now() } })}
          />
        </Animated.View>
        {trainPoints.length > 0 && freshTrains ? (
          <Animated.View
            pointerEvents="none"
            style={{ opacity: fullAnim.interpolate({ inputRange: [0, 0.5], outputRange: [1, 0], extrapolate: "clamp" }) }}
          >
            <Text className="mt-2 self-start rounded-pill bg-bg px-3 py-1.5 text-small font-sans-semibold text-text-secondary">
              {`열차 위치 · ${freshTrains.source === "MOCK" ? "시연용" : positionAgeLabel(freshTrains.ageSec ?? 0)} 기준`}
            </Text>
          </Animated.View>
        ) : null}
        {smartAlert.alert ? (
          <SmartAlertBanner
            title={smartAlertTitle(smartAlert.alert.type)}
            body={smartAlertBody(smartAlert.alert)}
            onDismiss={smartAlert.dismiss}
          />
        ) : null}
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
