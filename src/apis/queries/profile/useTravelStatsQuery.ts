import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  getTravelStats,
  type TravelStatsPeriod,
  type TravelStatsQueryDto,
  type TravelStatsResponseDto,
} from "./getTravelStats";

export interface UseTravelStatsQueryOptions {
  enabled?: boolean;
}

/**
 * 주/월/년/전체 기간별 주행 통계 조회 React Query 훅
 */
export const useTravelStatsQuery = (
  period: TravelStatsPeriod = "ALL",
  query?: Omit<TravelStatsQueryDto, "period">,
  options?: UseTravelStatsQueryOptions
): UseQueryResult<TravelStatsResponseDto, Error> => {
  const { isSignedIn } = useAuthToken();

  return useQuery({
    queryKey: queryKeys.profile.stats(period),
    queryFn: ({ signal }) =>
      getTravelStats({ period, ...query }, { signal }),
    enabled: Boolean(isSignedIn) && (options?.enabled ?? true),
    staleTime: 5 * 60_000,
  });
};
