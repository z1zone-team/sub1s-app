import { get, type RequestOptions } from "@/apis/client";
import type { StationSearchItem } from "@/apis/queries/places/searchPlaces";

export const MAX_STATION_LOOKUP_IDS = 20;

export interface StationLookupResult {
  items: StationSearchItem[];
}

/**
 * 역 ID 목록으로 이름, 좌표, 호선 배지를 한 번에 조회
 * GET /api/v1/stations?ids=
 * - 요청한 순서를 유지하고 중복은 한 번만 돌려준다.
 * - 없는 ID는 응답에서 빠진다. 호출하는 쪽이 저장 목록에서 지우면 된다.
 */
export const getStations = (
  ids: string[],
  options?: RequestOptions
): Promise<StationLookupResult> => {
  const unique = [...new Set(ids)].slice(0, MAX_STATION_LOOKUP_IDS);
  return get<StationLookupResult>("/stations", { ids: unique.join(",") }, options);
};
