import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { shouldRetry } from "@/apis/retry";
import { queryKeys } from "@/constants/queryKeys";
import {
  getNextTrains,
  type NextTrainsParams,
  type NextTrainsResult,
} from "./getNextTrains";

export interface UseNextTrainsQueryOptions {
  enabled?: boolean;
  /** 남은 시간이 흐르므로 이 간격(ms)으로 다시 가져온다. 기본 1분, 끄려면 false */
  refetchIntervalMs?: number | false;
}

const DEFAULT_REFETCH_MS = 60_000;

export const useNextTrainsQuery = (
  params: NextTrainsParams,
  options?: UseNextTrainsQueryOptions
): UseQueryResult<NextTrainsResult, Error> => {
  return useQuery({
    queryKey: queryKeys.stations.nextTrains(params.stationId, params.limit),
    queryFn: ({ signal }) => getNextTrains(params, { signal }),
    enabled: Boolean(params.stationId) && (options?.enabled ?? true),
    staleTime: 30_000,
    refetchInterval: options?.refetchIntervalMs ?? DEFAULT_REFETCH_MS,
    retry: shouldRetry,
  });
};
