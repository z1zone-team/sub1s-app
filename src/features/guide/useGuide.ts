import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OffRouteAlert } from "@/apis/queries/tracking/getTrackingSession";
import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { useReportPositionMutation } from "@/apis/mutations/tracking/useReportPositionMutation";
import { useReportLocationMutation } from "@/apis/mutations/tracking/useReportLocationMutation";
import { newerCoords, useGuideLocationStore } from "@/common/device/location/guideLocationTask";
import { useForegroundLocation } from "@/common/device/location/useForegroundLocation";
import {
  buildStops,
  currentSegment,
  distanceMeters,
  guideProgress,
  nearestStopIndex,
  upcomingAction,
  type Anchor,
  type Coordinate,
} from "./progress";
import { useActiveGuideStore } from "./active-guide-store";
import {
  boardingStopIndexes,
  guidePhase,
  needsWalkToStation,
  nextBoardingIndex,
  ridesBoardedBy,
  walkPhaseRemainingSec,
  type PhaseState,
} from "./guidePhase";
import { isOffRouteAlert, shouldShowAlert } from "./offRoute";
import { useOffRouteStore } from "./offroute-store";
import { useGuideNotices } from "./useGuideNotices";
import { useStopInfo } from "./useStopInfo";

const TICK_MS = 15_000;
const GPS_MAX_ACCURACY_M = 100;
const GPS_MAX_DISTANCE_M = 250;
/** 안내 시작 뒤 첫 위치를 기다리는 시간. 이 동안은 걷기, 승차 알림을 미뤄 위치를 모른 채 "타세요"를 먼저 보내지 않는다 */
const FIRST_FIX_WAIT_MS = 15_000;

interface UseGuideArgs {
  option: SubwayRouteOptionDto;
  sessionId: string;
  startedAtMs: number;
  /** 출발지가 좌표(현재 위치나 장소)일 때의 좌표. 역이면 없다. 걷는 단계는 지금 위치를 먼저 보고, 위치를 모를 때만 이 값을 쓴다 */
  originCoords?: Coordinate;
}

export function useGuide({ option, sessionId, startedAtMs, originCoords }: UseGuideArgs) {
  const stationIds = option.stationIds ?? [];
  const stops = useMemo(() => buildStops(option, stationIds), [option, stationIds]);
  const info = useStopInfo(stationIds);
  const report = useReportLocationMutation();
  const reportRef = useRef(report.mutate);
  reportRef.current = report.mutate;

  const positionReport = useReportPositionMutation();
  const [alert, setAlert] = useState<OffRouteAlert | null>(null);

  useEffect(() => {
    useOffRouteStore.getState().reset();
  }, []);

  const [nowMs, setNowMs] = useState(() => Date.now());
  // 홈에 다녀와 안내 화면을 다시 열어도 단계가 이어지도록 저장소에서 읽는다
  const [saved] = useState(() => {
    const active = useActiveGuideStore.getState().guide;
    return active?.sessionId === sessionId ? active.progress : undefined;
  });
  const [anchor, setAnchor] = useState<Anchor | undefined>(saved?.anchor);
  const [phaseState, setPhaseState] = useState<PhaseState>(saved?.phase ?? { boardedRides: 0, stationReached: false });

  useEffect(() => {
    useActiveGuideStore.getState().setProgress({ anchor, phase: phaseState });
  }, [anchor, phaseState]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const boardingIndexes = useMemo(() => boardingStopIndexes(option, stops), [option, stops]);
  const gate = nextBoardingIndex(boardingIndexes, phaseState.boardedRides);
  const baseProgress = guideProgress(stops, startedAtMs, nowMs, anchor, gate);

  const confirmStop = useCallback(
    (index: number, source: "user" | "gps" = "user") => {
      const stop = stops[index];
      if (!stop) return;
      if (gate !== undefined && index > gate) {
        // 위치만으로 승차를 판단하지 않는다. 사용자가 더 뒤의 역에 있다고 알리면 그만큼 탄 것으로 본다
        if (source === "gps") return;
        setPhaseState((previous) => ({
          boardedRides: Math.max(previous.boardedRides, ridesBoardedBy(boardingIndexes, index)),
          stationReached: true,
        }));
      } else if (gate !== undefined && index === gate) {
        setPhaseState((previous) => (previous.stationReached ? previous : { ...previous, stationReached: true }));
      }
      const now = Date.now();
      setAnchor({ index, atMs: now });
      setNowMs(now);
      reportRef.current({ sessionId, currentStationId: stop.stationId });
    },
    [stops, sessionId, gate, boardingIndexes]
  );

  /** "열차에 탔어요": 지금 기다리던 열차를 탄 것으로 보고 이 역에서부터 시간을 센다 */
  const board = useCallback(() => {
    if (gate === undefined || !stops[gate]) return;
    const now = Date.now();
    setPhaseState((previous) => ({ boardedRides: previous.boardedRides + 1, stationReached: true }));
    setAnchor({ index: gate, atMs: now });
    setNowMs(now);
    reportRef.current({ sessionId, currentStationId: stops[gate].stationId });
  }, [gate, stops, sessionId]);

  /** "역에 도착했어요": 첫 탑승역까지 걷는 단계를 마치고 승강장 대기로 넘어간다 */
  const reachStation = useCallback(() => {
    setPhaseState((previous) => (previous.stationReached ? previous : { ...previous, stationReached: true }));
  }, []);

  const location = useForegroundLocation({ autoStart: true, timeInterval: TICK_MS, distanceInterval: 30, lastKnownMaxAgeMs: 60_000 });
  // 다시 연 안내는 이미 단계가 정해져 있어 기다리지 않는다
  const [fixWaitOver, setFixWaitOver] = useState(() => Boolean(saved));
  useEffect(() => {
    if (fixWaitOver) return;
    const timer = setTimeout(() => setFixWaitOver(true), FIRST_FIX_WAIT_MS);
    return () => clearTimeout(timer);
  }, [fixWaitOver]);
  // 앱이 백그라운드로 가면 포그라운드 서비스가 보내는 위치가 더 최근이다
  const backgroundCoords = useGuideLocationStore((state) => state.latest);
  const coords = newerCoords(location.coords, backgroundCoords);
  const lastGpsIndex = useRef(-1);

  useEffect(() => {
    if (!coords || coords.accuracy === null || coords.accuracy > GPS_MAX_ACCURACY_M) return;

    if (!positionReport.isPending) {
      positionReport.mutate(
        { sessionId, lat: coords.latitude, lng: coords.longitude },
        {
          onSuccess: (response) => {
            if (isOffRouteAlert(response)) {
              if (shouldShowAlert(useOffRouteStore.getState().dismissed)) setAlert(response);
            } else if (!response.isOffRoute) {
              useOffRouteStore.getState().reset();
            }
          },
        }
      );
    }

    const index = nearestStopIndex(
      { lat: coords.latitude, lng: coords.longitude },
      stops.map((stop) => {
        const item = info.get(stop.stationId);
        return item ? { lat: item.lat, lng: item.lng } : undefined;
      }),
      GPS_MAX_DISTANCE_M
    );
    if (index < 0 || index >= stops.length - 1 || index === lastGpsIndex.current) return;
    lastGpsIndex.current = index;
    confirmStop(index, "gps");
  }, [coords, info, stops, confirmStop]);

  const boardingStation = gate !== undefined ? info.get(stops[gate]?.stationId ?? "") : undefined;
  const boardingCoords = boardingStation ? { lat: boardingStation.lat, lng: boardingStation.lng } : undefined;
  const position = coords ? { lat: coords.latitude, lng: coords.longitude } : undefined;
  // 걷는 단계는 믿을 만한 위치로만 정한다. 정확도가 나쁘면 위치를 모르는 것으로 본다
  const accuratePosition =
    position && coords?.accuracy !== null && coords?.accuracy !== undefined && coords.accuracy <= GPS_MAX_ACCURACY_M ? position : undefined;
  const phaseKnown = Boolean(accuratePosition) || fixWaitOver || location.error !== null;
  const phase = guidePhase({
    boardingIndexes,
    state: phaseState,
    currentIndex: baseProgress.currentIndex,
    walkNeeded: needsWalkToStation(originCoords, accuratePosition, boardingCoords, GPS_MAX_DISTANCE_M),
  });
  // 걷는 동안은 걷는 시간까지 더한 남은 시간을 보여 준다
  const progress =
    phase === "WALK_TO_STATION"
      ? {
          ...baseProgress,
          remainingSec: walkPhaseRemainingSec(baseProgress.remainingSec, option.totalDurationSec, (nowMs - startedAtMs) / 1000),
        }
      : baseProgress;
  const from = position ?? originCoords;
  const walkDistanceM = from && boardingCoords ? Math.round(distanceMeters(from, boardingCoords)) : undefined;

  // 단계가 바뀌면 걷기, 승차 알림을 띄운다
  const boardingSegment = gate !== undefined ? option.segments[stops[gate]?.segmentIndex ?? -1] : undefined;
  useGuideNotices(sessionId, {
    phase,
    boardedRides: phaseState.boardedRides,
    boarding: phaseKnown && boardingStation && boardingSegment ? { stationName: boardingStation.name, segment: boardingSegment } : undefined,
    distanceToStationM: walkDistanceM,
  });

  return {
    stops,
    info,
    progress,
    nowMs,
    confirmStop,
    phase,
    /** 지금 기다리거나 걸어가는 대상인 탑승역의 순번. 모두 탔으면 없다 */
    boardingIndex: gate,
    /** 탈 열차 구간. 탑승역에서 방향과 급행 여부로 다음 열차를 고를 때 쓴다 */
    boardingSegment,
    /** 첫 탑승역까지 남은 거리(m). 걷는 단계에서 보여 준다. 위치와 출발지를 모르면 없다 */
    walkDistanceM,
    board,
    reachStation,
    segment: currentSegment(option, stops, progress.currentIndex),
    upcoming: upcomingAction(stops, progress.currentIndex),
    alert,
    /** 안내 지도에 내 위치를 그리는 데 쓴다. 위치를 모르면 null */
    coords,
    clearAlert: () => setAlert(null),
    locationGranted: location.permissionStatus === "granted",
  };
}
