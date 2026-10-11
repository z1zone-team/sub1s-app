import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { shouldRetry } from "@/apis/retry";
import { getStations, MAX_STATION_LOOKUP_IDS } from "@/apis/queries/stations/getStations";
import type { StationSearchItem } from "@/apis/queries/places/searchPlaces";
import { queryKeys } from "@/constants/queryKeys";

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

/** 경로의 역은 20개를 넘을 수 있어 나눠서 조회하고 합친다 */
export function useStopInfo(stationIds: string[]): Map<string, StationSearchItem> {
  const key = stationIds.join(",");
  const chunks = useMemo(
    () => chunk([...new Set(stationIds)], MAX_STATION_LOOKUP_IDS),
    [key]
  );

  const results = useQueries({
    queries: chunks.map((ids) => ({
      queryKey: queryKeys.stations.lookup(ids),
      queryFn: ({ signal }: { signal?: AbortSignal }) => getStations(ids, { signal }),
      staleTime: 60 * 60_000,
      retry: shouldRetry,
    })),
  });

  const loaded = results.map((result) => result.data).filter((data) => data !== undefined);
  return useMemo(() => {
    const byId = new Map<string, StationSearchItem>();
    loaded.forEach((data) => data?.items.forEach((item) => byId.set(item.stationId, item)));
    return byId;
  }, [loaded.length, key]);
}
