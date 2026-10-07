import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import {
  getTrackingSession,
  type TrackingSession,
} from "./getTrackingSession";

export interface UseTrackingSessionQueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * 주행 세션 상태 조회 React Query 훅
 * - sessionId가 존재할 때 활성화됩니다.
 * - 주행 중 실시간 폴링을 지원합니다.
 */
export const useTrackingSessionQuery = (
  sessionId?: string,
  options?: UseTrackingSessionQueryOptions
): UseQueryResult<TrackingSession, Error> => {
  return useQuery({
    queryKey: queryKeys.tracking.session(sessionId),
    queryFn: ({ signal }) => getTrackingSession(sessionId!, { signal }),
    enabled: Boolean(sessionId) && (options?.enabled ?? true),
    staleTime: 5_000,
    refetchInterval: options?.refetchInterval,
  });
};
