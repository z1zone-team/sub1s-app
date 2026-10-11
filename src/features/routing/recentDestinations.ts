import type { RecentRouteItem } from "@/common/storage/useRecentRoutes";
import { endpointKey, type RouteEndpoint } from "./endpoint";

export interface RecentDestination {
  endpoint: RouteEndpoint;
  /** 마지막으로 검색한 시각 (ISO) */
  searchedAt: string;
  /** 이 도착지로 합쳐진 최근 경로 기록 ID들. 목록에서 지울 때 모두 지운다 */
  routeIds: string[];
}

export const MAX_RECENT_DESTINATIONS = 10;

/** 최근 경로를 도착지 기준으로 합쳐 최신순으로 돌려준다. 같은 도착지는 가장 최근 것 하나만 남긴다 */
export function toRecentDestinations(
  routes: RecentRouteItem[],
  limit: number = MAX_RECENT_DESTINATIONS
): RecentDestination[] {
  const sorted = [...routes].sort((a, b) => b.searchedAt.localeCompare(a.searchedAt));
  const byKey = new Map<string, RecentDestination>();

  for (const route of sorted) {
    const endpoint: RouteEndpoint = {
      name: route.destination,
      stationId: route.destStationId,
      lat: route.destLat,
      lng: route.destLng,
    };
    const key = endpointKey(endpoint);
    const existing = byKey.get(key);
    if (existing) {
      existing.routeIds.push(route.id);
    } else {
      byKey.set(key, { endpoint, searchedAt: route.searchedAt, routeIds: [route.id] });
    }
  }
  return [...byKey.values()].slice(0, limit);
}

/**
 * 서버 역 조회에 없는 역 ID는 폐지되거나 이름이 바뀐 것이라 저장 목록에서 지운다 (API_SPEC 2.2.2).
 * 좌표만 있는 장소와 역 ID가 없는 항목은 서버가 판단할 수 없으므로 남긴다
 */
export function staleStationIds(
  destinations: RecentDestination[],
  existingStationIds: ReadonlySet<string>
): string[] {
  return destinations
    .map((destination) => destination.endpoint.stationId)
    .filter((id): id is string => Boolean(id) && !existingStationIds.has(id as string));
}
