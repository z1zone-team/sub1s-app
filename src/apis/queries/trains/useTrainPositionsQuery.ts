import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { shouldRetry } from "@/apis/retry";
import { queryKeys } from "@/constants/queryKeys";
import { getTrainPositions, type LineTrainPositions } from "./getTrainPositions";

/** 서버는 이미 모아 둔 값을 돌려줄 뿐이라 자주 읽어도 서울시 호출 예산을 쓰지 않는다 */
const REFRESH_MS = 20_000;

export const useTrainPositionsQuery = (
  lineId: string | undefined,
  options?: { enabled?: boolean }
): UseQueryResult<LineTrainPositions, Error> => {
  return useQuery({
    queryKey: queryKeys.trains.positions(lineId ?? ""),
    queryFn: ({ signal }) => getTrainPositions(lineId as string, { signal }),
    enabled: Boolean(lineId) && (options?.enabled ?? true),
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS,
    retry: shouldRetry,
  });
};
