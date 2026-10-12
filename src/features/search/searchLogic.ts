import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { formatClock24Kst, formatDurationSec } from "@/common/utils/format";
import { WALK_LINE_ID } from "@/theme";
import { isSameEndpoint, isValidEndpoint, type RouteEndpoint } from "@/features/routing/endpoint";
import type { SearchRow } from "@/features/routing/searchRows";
import type { RecentDestination } from "@/features/routing/recentDestinations";
import { walkSeconds, type RouteGroup } from "@/features/routing/routeView";

/** 출발지와 도착지를 서로 바꾼다. 한쪽이 비어 있으면 빈 채로 따라간다 */
export function swapEndpoints(
  origin: RouteEndpoint | undefined,
  destination: RouteEndpoint | undefined
): { origin: RouteEndpoint | undefined; destination: RouteEndpoint | undefined } {
  return { origin: destination, destination: origin };
}

export interface RecommendedPair {
  origin: RouteEndpoint;
  destination: RouteEndpoint;
}

/**
 * 추천 경로의 출발과 도착. 출발은 지금의 출발지(보통 현재 위치), 도착은 가장 최근에 찾은 도착지다.
 * 둘 중 하나가 없거나 같은 곳이면 추천하지 않는다
 */
export function recommendedPair(
  origin: RouteEndpoint | undefined,
  destinations: RecentDestination[]
): RecommendedPair | undefined {
  const destination = destinations[0]?.endpoint;
  if (!isValidEndpoint(origin) || !isValidEndpoint(destination)) return undefined;
  if (isSameEndpoint(origin, destination)) return undefined;
  return { origin, destination };
}

/** 추천 경로 섹션에 보일 카드. 최적을 맨 위에 두고, 다른 경로라면 여유를 하나 더 보여 준다 */
export function pickRecommendedGroups(groups: RouteGroup[]): RouteGroup[] {
  const optimal = groups.find((group) => group.modes.includes("OPTIMAL"));
  const comfortable = groups.find((group) => group.modes.includes("COMFORTABLE") && group !== optimal);
  if (optimal && comfortable) return [optimal, comfortable];
  if (optimal) return [optimal];
  return groups.slice(0, 1);
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
