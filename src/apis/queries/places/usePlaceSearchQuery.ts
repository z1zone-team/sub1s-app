import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import { shouldRetry } from "@/apis/retry";
import { queryKeys } from "@/constants/queryKeys";
import {
  normalizePlaceQuery,
  searchPlaces,
  type PlaceSearchParams,
  type PlaceSearchResult,
} from "./searchPlaces";

/**
 * 역·장소 검색 훅
 * - 검색어가 비어 있으면 호출하지 않는다.
 * - 입력하는 동안 이전 결과를 유지해 목록이 깜빡이지 않게 한다.
 * - 호출은 입력이 멈춘 뒤에 하도록 호출하는 쪽에서 디바운스한 검색어를 넘긴다 (서버는 IP당 분당 60건 제한).
 */
export const usePlaceSearchQuery = (
  params: PlaceSearchParams
): UseQueryResult<PlaceSearchResult, Error> => {
  const q = normalizePlaceQuery(params.q);

  return useQuery({
    queryKey: queryKeys.places.search(q, params.lat, params.lng),
    queryFn: ({ signal }) => searchPlaces({ ...params, q }, { signal }),
    enabled: q.length > 0,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: shouldRetry,
  });
};
