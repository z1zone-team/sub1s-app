import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  getLineMap,
  type LineMapQueryDto,
  type LineMapResponseDto,
} from "./getLineMap";
import type { TravelStatsPeriod } from "./getTravelStats";

export interface UseLineMapQueryOptions {
  enabled?: boolean;
}

/**
 * 호선별 노선도 및 역 방문 현황 조회 React Query 훅
 */
export const useLineMapQuery = (
  period: TravelStatsPeriod = "ALL",
  query?: Omit<LineMapQueryDto, "period">,
  options?: UseLineMapQueryOptions
): UseQueryResult<LineMapResponseDto, Error> => {
  const { isSignedIn } = useAuthToken();

  return useQuery({
    queryKey: queryKeys.linemap.period(period, query?.periodKey),
    queryFn: ({ signal }) =>
      getLineMap({ period, ...query }, { signal }),
    enabled: Boolean(isSignedIn) && (options?.enabled ?? true),
    staleTime: 5 * 60_000,
  });
};
