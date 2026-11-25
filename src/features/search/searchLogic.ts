import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { formatClock24Kst, formatDurationSec } from "@/common/utils/format";
import { WALK_LINE_ID } from "@/theme";
import type { RouteEndpoint } from "@/features/routing/endpoint";
import type { SearchRow } from "@/features/routing/searchRows";
import { walkSeconds } from "@/features/routing/routeView";

/** 출발지와 도착지를 서로 바꾼다. 한쪽이 비어 있으면 빈 채로 따라간다 */
export function swapEndpoints(
  origin: RouteEndpoint | undefined,
  destination: RouteEndpoint | undefined
): { origin: RouteEndpoint | undefined; destination: RouteEndpoint | undefined } {
  return { origin: destination, destination: origin };
}

/**
 * 출발지를 현재 위치로 잡지 못했을 때 대체 안내(저장한 집, 지도에서 선택)를 보일지.
 * 사용자가 출발지를 정했거나 위치가 이미 잡혔으면 보이지 않는다
 */
export function shouldOfferOriginFallback(input: {
  fixTimedOut: boolean;
  locationDenied: boolean;
  originChosenByUser: boolean;
  origin: RouteEndpoint | undefined;
}): boolean {
  if (input.originChosenByUser || input.origin) return false;
  return input.fixTimedOut || input.locationDenied;
}

/** "환승 0회 · 도보 8분" */
export function transferAndWalkText(option: SubwayRouteOptionDto): string {
  const walk = walkSeconds(option);
  return [`환승 ${option.transferCount}회`, walk > 0 ? `도보 ${formatDurationSec(walk)}` : ""]
    .filter(Boolean)
    .join(" · ");
}

/** "14:51 도착" */
export function arrivalText(option: SubwayRouteOptionDto): string {
  const clock = formatClock24Kst(option.estimatedArrivalTimestamp);
  return clock ? `${clock} 도착` : "";
}

export interface RideSummary {
  lineId: string;
  isExpress: boolean;
  from: string;
  to: string;
}

/** 카드 요약 줄. 탑승 구간(호선, 출발역 → 도착역)들과 마지막에 도보로 가는 곳(없으면 undefined) */
export function summarizeRoute(option: SubwayRouteOptionDto): { rides: RideSummary[]; walkTo?: string } {
  const rides: RideSummary[] = option.segments
    .filter((segment) => segment.lineId !== WALK_LINE_ID)
    .map((segment) => ({
      lineId: segment.lineId,
      isExpress: segment.isExpress,
      from: segment.fromStationName,
      to: segment.toStationName,
    }));
  const last = option.segments[option.segments.length - 1];
  const walkTo = last && last.lineId === WALK_LINE_ID ? last.toStationName : undefined;
  return { rides, walkTo };
}

/** 최근 검색에서 고른 도착지를 지도 검색 결과 한 줄과 같은 모양으로 바꾼다. 역이면 호선 배지를 붙인다 */
export function rowFromEndpoint(endpoint: RouteEndpoint, lineIds: string[] = []): SearchRow {
  const isStation = Boolean(endpoint.stationId);
  return {
    key: isStation ? `station:${endpoint.stationId}` : `place:${endpoint.lat},${endpoint.lng}:${endpoint.name}`,
    kind: isStation ? "STATION" : "PLACE",
    title: endpoint.name,
    lineIds: isStation ? lineIds : [],
    ...(endpoint.lat !== undefined && endpoint.lng !== undefined ? { coords: { lat: endpoint.lat, lng: endpoint.lng } } : {}),
    endpoint,
  };
}
