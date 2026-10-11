import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { shouldRetry } from "@/apis/retry";
import { queryKeys } from "@/constants/queryKeys";
import {
  getStations,
  MAX_STATION_LOOKUP_IDS,
  type StationLookupResult,
} from "./getStations";

export const useStationsQuery = (
  ids: string[]
): UseQueryResult<StationLookupResult, Error> => {
  const unique = [...new Set(ids)].slice(0, MAX_STATION_LOOKUP_IDS);

  return useQuery({
    queryKey: queryKeys.stations.lookup(unique),
    queryFn: ({ signal }) => getStations(unique, { signal }),
    enabled: unique.length > 0,
    staleTime: 60 * 60_000,
    retry: shouldRetry,
  });
};
