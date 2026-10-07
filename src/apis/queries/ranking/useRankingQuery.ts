import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { useAuthToken } from "@/hooks/useAuthToken";
import {
  getRanking,
  type RankingQueryDto,
  type RankingResponseDto,
} from "./getRanking";

export interface UseRankingQueryOptions {
  enabled?: boolean;
}

/**
 * 랭킹 리더보드 조회 React Query 훅
 * - 로그인된 상태에서만 조회를 수행합니다.
 */
export const useRankingQuery = (
  query?: RankingQueryDto,
  options?: UseRankingQueryOptions
): UseQueryResult<RankingResponseDto, Error> => {
  const { isSignedIn } = useAuthToken();

  return useQuery({
    queryKey: queryKeys.ranking.leaderboard(
      query?.periodType ?? "MONTHLY",
      query?.periodKey,
      query?.friendsOnly,
      query?.page,
      query?.limit
    ),
    queryFn: ({ signal }) => getRanking(query, { signal }),
    enabled: Boolean(isSignedIn) && (options?.enabled ?? true),
    staleTime: 60_000,
  });
};
