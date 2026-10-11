import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { shouldRetry } from "@/apis/retry";
import { queryKeys } from "@/constants/queryKeys";
import { getStationFacilities, type StationFacilities } from "./getStationFacilities";

export const useStationFacilitiesQuery = (
  stationId: string | undefined,
  options?: { enabled?: boolean }
): UseQueryResult<StationFacilities, Error> => {
  return useQuery({
    queryKey: queryKeys.stations.facilities(stationId ?? ""),
    queryFn: ({ signal }) => getStationFacilities(stationId as string, { signal }),
    enabled: Boolean(stationId) && (options?.enabled ?? true),
    // 편의시설은 분기 단위로 바뀌는 자료라 오래 캐시한다
    staleTime: 24 * 60 * 60_000,
    retry: shouldRetry,
  });
};
