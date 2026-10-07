import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import {
  getTrainCongestion,
  type TrainCongestionQuery,
  type TrainCongestionResponse,
} from "./getTrainCongestion";

export interface UseTrainCongestionQueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * 열차 칸별 혼잡도 조회 React Query 훅
 * - lineId와 trainId가 유효할 때 실행됩니다.
 * - 기본 30초마다 자동 갱신(refetchInterval: 30_000)
 */
export const useTrainCongestionQuery = (
  params: TrainCongestionQuery,
  options?: UseTrainCongestionQueryOptions
): UseQueryResult<TrainCongestionResponse, Error> => {
  const isEnabled =
    Boolean(params.lineId && params.trainId && params.stationId) &&
    (options?.enabled ?? true);

  return useQuery({
    queryKey: queryKeys.congestion.train(params.lineId, params.trainId),
    queryFn: ({ signal }) => getTrainCongestion(params, { signal }),
    enabled: isEnabled,
    staleTime: 15_000,
    refetchInterval: options?.refetchInterval ?? 30_000,
  });
};
