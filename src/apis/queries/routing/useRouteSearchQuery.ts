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
 * 지하철 경로 탐색 React Query 훅
 * - 출발역과 도착역이 모두 존재할 때만 자동 실행됩니다.
 * - 기본 staleTime 1분 (실시간 혼잡도 반영)
 */
export const useRouteSearchQuery = (
  params: RouteSearchRequest,
  options?: UseRouteSearchQueryOptions
): UseQueryResult<RouteSearchResult, Error> => {
  const isEnabled =
    Boolean(params.originStationId && params.destinationStationId) &&
    (options?.enabled ?? true);

  return useQuery({
    queryKey: queryKeys.routes.optimal(
      params.originStationId,
      params.destinationStationId,
      params.routeMode
    ),
    queryFn: ({ signal }) => searchRoutes(params, { signal }),
    enabled: isEnabled,
    staleTime: options?.staleTime ?? 60_000,
  });
};
