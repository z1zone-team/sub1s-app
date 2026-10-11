import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OffRouteAlert } from "@/apis/queries/tracking/getTrackingSession";
import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { useReportPositionMutation } from "@/apis/mutations/tracking/useReportPositionMutation";
import { useReportLocationMutation } from "@/apis/mutations/tracking/useReportLocationMutation";
import { useForegroundLocation } from "@/common/device/location/useForegroundLocation";
import {
  buildStops,
  currentSegment,
  guideProgress,
  nearestStopIndex,
  upcomingAction,
  type Anchor,
} from "./progress";
import { isOffRouteAlert, shouldShowAlert } from "./offRoute";
import { useOffRouteStore } from "./offroute-store";
import { useStopInfo } from "./useStopInfo";

const TICK_MS = 15_000;
const GPS_MAX_ACCURACY_M = 100;
const GPS_MAX_DISTANCE_M = 250;

interface UseGuideArgs {
  option: SubwayRouteOptionDto;
  sessionId: string;
  startedAtMs: number;
}

export function useGuide({ option, sessionId, startedAtMs }: UseGuideArgs) {
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
  const [anchor, setAnchor] = useState<Anchor | undefined>();

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const progress = guideProgress(stops, startedAtMs, nowMs, anchor);

  const confirmStop = useCallback(
    (index: number) => {
      const stop = stops[index];
      if (!stop) return;
      const now = Date.now();
      setAnchor({ index, atMs: now });
      setNowMs(now);
      reportRef.current({ sessionId, currentStationId: stop.stationId });
    },
    [stops, sessionId]
  );

  const location = useForegroundLocation({ autoStart: true, timeInterval: TICK_MS, distanceInterval: 30 });
  const coords = location.coords;
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
    confirmStop(index);
  }, [coords, info, stops, confirmStop]);

  return {
    stops,
    info,
    progress,
    nowMs,
    confirmStop,
    segment: currentSegment(option, stops, progress.currentIndex),
    upcoming: upcomingAction(stops, progress.currentIndex),
    alert,
    clearAlert: () => setAlert(null),
    locationGranted: location.permissionStatus === "granted",
  };
}
