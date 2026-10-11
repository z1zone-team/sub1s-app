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
  endpoint: RouteEndpoint;
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
        endpoint: endpointFromStation(item),
      };
    }

    const walk = formatDurationSec(item.nearestStation.walkDurationSec);
    return {
      key: `place:${item.lat},${item.lng}:${item.name}`,
      kind: "PLACE",
      title: item.name,
      subtitle: item.address || undefined,
      hint: `${item.nearestStation.name}역에서 도보 ${walk}`,
      lineIds: [],
      endpoint: endpointFromPlace(item),
    };
  });
}
