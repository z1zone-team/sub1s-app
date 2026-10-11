import { get, type RequestOptions } from "@/apis/client";

export const MAX_PLACE_QUERY_LENGTH = 50;

export interface LineRef {
  lineId: string;
  lineName: string;
  colorHex: string;
}

export interface StationSearchItem {
  type: "STATION";
  /** 호선별 역 노드 ID. 환승역은 호선마다 한 건씩 나오며 경로 탐색에 이 ID를 쓴다 */
  stationId: string;
  name: string;
  lat: number;
  lng: number;
  /** 이 항목의 호선 */
  line: LineRef;
  /** 같은 역을 지나는 전체 호선 */
  lines: LineRef[];
}

export interface PlaceSearchItem {
  type: "PLACE";
  name: string;
  address: string;
  category?: string;
  lat: number;
  lng: number;
  nearestStation: {
    stationId: string;
    name: string;
    walkDistanceM: number;
    walkDurationSec: number;
  };
}

export type PlaceSearchResultItem = StationSearchItem | PlaceSearchItem;

export interface PlaceSearchResult {
  items: PlaceSearchResultItem[];
}

export interface PlaceSearchParams {
  q: string;
  lat?: number;
  lng?: number;
  limit?: number;
}

/** 공백을 정리하고 서버 한도(50자)에 맞춘다. 빈 문자열이면 검색하지 않는다 */
export function normalizePlaceQuery(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_PLACE_QUERY_LENGTH);
}

/**
 * 역·장소 검색 (자동완성)
 * GET /api/v1/places/search
 */
export const searchPlaces = (
  params: PlaceSearchParams,
  options?: RequestOptions
): Promise<PlaceSearchResult> => {
  return get<PlaceSearchResult>(
    "/places/search",
    { ...params, q: normalizePlaceQuery(params.q) },
    options
  );
};
