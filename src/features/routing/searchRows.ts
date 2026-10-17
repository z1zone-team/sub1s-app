import type { ReversePlaceItem } from "@/apis/queries/places/reversePlace";
import type {
  PlaceSearchResultItem,
} from "@/apis/queries/places/searchPlaces";
import { formatDurationSec } from "@/common/utils/format";
import {
  endpointFromPlace,
  endpointFromStation,
  type RouteEndpoint,
} from "./endpoint";

export interface SearchRow {
  key: string;
  kind: "STATION" | "PLACE";
  title: string;
  /** 장소는 주소, 역은 없음 */
  subtitle?: string;
  /** 장소를 골랐을 때 서버가 붙여 줄 도보 구간 안내 */
  hint?: string;
  /** 배지로 보여 줄 호선. 역은 이 항목의 호선 하나 */
  lineIds: string[];
  /** 지도에 핀을 찍을 위치. 최근 검색에서 온 역처럼 모르면 없다 */
  coords?: { lat: number; lng: number };
  endpoint: RouteEndpoint;
}

/** 장소 한 건의 행. 가까운 역이 없으면(지도에서 직접 고른 먼 곳) 걸어서 안내한다는 문구를 붙인다 */
export function toPlaceRow(item: ReversePlaceItem): SearchRow {
  const nearest = item.nearestStation;
  return {
    key: `place:${item.lat},${item.lng}:${item.name}`,
    kind: "PLACE",
    title: item.name,
    subtitle: item.address || undefined,
    hint: nearest
      ? `${nearest.name}역에서 도보 ${formatDurationSec(nearest.walkDurationSec)}`
      : "가까운 지하철역이 없어요. 걸어서 안내해 드려요.",
    lineIds: [],
    coords: { lat: item.lat, lng: item.lng },
    endpoint: endpointFromPlace(item),
  };
}

/** 서버가 이미 정렬(역 먼저, 장소 다음)해서 주므로 순서는 바꾸지 않는다 */
export function toSearchRows(items: PlaceSearchResultItem[]): SearchRow[] {
  return items.map((item): SearchRow => {
    if (item.type === "STATION") {
      return {
        key: item.stationId,
        kind: "STATION",
        title: item.name,
        lineIds: [item.line.lineId],
        coords: { lat: item.lat, lng: item.lng },
        endpoint: endpointFromStation(item),
      };
    }

    return toPlaceRow(item);
  });
}
