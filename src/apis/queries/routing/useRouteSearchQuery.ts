import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import {
  searchRoutes,
  type RouteSearchRequest,
  type RouteSearchResult,
} from "./searchRoutes";

export interface UseRouteSearchQueryOptions {
  enabled?: boolean;
  staleTime?: number;
}

/**
 * 지하철 및 도보 복합 경로 탐색 React Query 훅
 * - 출발지(역 ID 또는 좌표)와 도착지(역 ID 또는 좌표)가 유효할 때 자동 실행됩니다.
 */
export const useRouteSearchQuery = (
  params: RouteSearchRequest,
  options?: UseRouteSearchQueryOptions
): UseQueryResult<RouteSearchResult, Error> => {
  const hasOrigin = Boolean(
    params.originStationId ||
      (params.originLat !== undefined && params.originLng !== undefined)
  );
  const hasDest = Boolean(
    params.destinationStationId ||
      (params.destinationLat !== undefined &&
        params.destinationLng !== undefined)
  );
  const isEnabled = hasOrigin && hasDest && (options?.enabled ?? true);

  const originKey =
    params.originStationId ??
    `${params.originLat ?? 0},${params.originLng ?? 0}`;
  const destKey =
    params.destinationStationId ??
    `${params.destinationLat ?? 0},${params.destinationLng ?? 0}`;

  return useQuery({
    queryKey: queryKeys.routes.optimal(originKey, destKey, params.routeMode),
    queryFn: ({ signal }) => searchRoutes(params, { signal }),
    enabled: isEnabled,
    staleTime: options?.staleTime ?? 60_000,
  });
};
