import { useCallback, useEffect, useMemo } from "react";
import { useStationsQuery } from "@/apis/queries/stations/useStationsQuery";
import { useRecentRoutes } from "@/common/storage/useRecentRoutes";
import {
  staleStationIds,
  toRecentDestinations,
  type RecentDestination,
} from "./recentDestinations";

/**
 * 최근 도착지 목록. 저장된 경로를 도착지 기준으로 합치고, 역의 호선 배지는 서버에서 최신 값으로 가져온다.
 * 서버에 없는 역은 폐지되거나 이름이 바뀐 것이라 저장 목록에서 지운다 (API_SPEC 2.2.2)
 */
export function useRecentDestinations() {
  const { routes, isLoading, addRoute, removeRoute, clearRoutes, reload } = useRecentRoutes();

  const destinations = useMemo(() => toRecentDestinations(routes), [routes]);
  const stationIds = useMemo(
    () =>
      destinations
        .map((destination) => destination.endpoint.stationId)
        .filter((id): id is string => Boolean(id)),
    [destinations]
  );
  const stations = useStationsQuery(stationIds);

  const linesOfStation = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const item of stations.data?.items ?? []) {
      map.set(item.stationId, item.lines.map((line) => line.lineId));
    }
    return map;
  }, [stations.data]);

  const remove = useCallback(
    (destination: RecentDestination) => {
      for (const id of destination.routeIds) void removeRoute(id);
    },
    [removeRoute]
  );

  // 조회가 성공했을 때만 정리한다. 실패했을 때 목록을 지우면 안 된다
  useEffect(() => {
    if (!stations.data) return;
    const known = new Set(stations.data.items.map((item) => item.stationId));
    const stale = new Set(staleStationIds(destinations, known));
    if (stale.size === 0) return;
    for (const destination of destinations) {
      if (destination.endpoint.stationId && stale.has(destination.endpoint.stationId)) {
        remove(destination);
      }
    }
  }, [stations.data, destinations, remove]);

  return {
    destinations,
    linesOfStation,
    isLoading,
    addRoute,
    remove,
    clear: clearRoutes,
    reload,
  };
}
