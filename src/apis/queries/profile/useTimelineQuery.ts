import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  getTimeline,
  type TimelineQueryDto,
  type TimelineResponseDto,
} from "./getTimeline";

export interface UseTimelineQueryOptions {
  enabled?: boolean;
}

/**
 * 월간 이동 기록 타임라인 React Query 훅
 * - 로그인된 상태에서만 조회합니다.
 */
export const useTimelineQuery = (
  query: TimelineQueryDto,
  options?: UseTimelineQueryOptions
): UseQueryResult<TimelineResponseDto, Error> => {
  const { isSignedIn } = useAuthToken();

  return useQuery({
    queryKey: queryKeys.profile.timeline(query.year, query.month),
    queryFn: ({ signal }) => getTimeline(query, { signal }),
    enabled: Boolean(isSignedIn) && (options?.enabled ?? true),
    staleTime: 60_000,
  });
};
