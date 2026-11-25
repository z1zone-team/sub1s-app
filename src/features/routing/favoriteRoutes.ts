import type { FavoriteEndpoint, FavoriteEndpointBody, FavoriteRoute, SaveFavoriteRouteBody } from "@/apis/queries/users/favoriteRoutes";
import { CURRENT_LOCATION_NAME, isSameEndpoint, isValidEndpoint, type RouteEndpoint } from "./endpoint";
import { toRecentRouteChips } from "./recentDestinations";
import type { RecentRouteItem } from "@/common/storage/useRecentRoutes";

export const MAX_ROUTE_CHIPS = 2;

/** 서버가 같은 경로를 판단하는 규칙과 같다. 역은 역 ID, 장소는 소수 4자리 좌표(약 11m). 이름은 보지 않는다 */
export function pointKey(endpoint: { stationId?: string | null; lat?: number | null; lng?: number | null }): string | null {
  if (endpoint.stationId) return `S:${endpoint.stationId}`;
  if (typeof endpoint.lat === "number" && typeof endpoint.lng === "number") {
    return `P:${endpoint.lat.toFixed(4)},${endpoint.lng.toFixed(4)}`;
  }
  return null;
}

export function favoriteKey(
  origin: { stationId?: string | null; lat?: number | null; lng?: number | null },
  destination: { stationId?: string | null; lat?: number | null; lng?: number | null }
): string | null {
  const from = pointKey(origin);
  const to = pointKey(destination);
  return from && to ? `${from}>${to}` : null;
}

export function favoriteEndpoint(endpoint: FavoriteEndpoint): RouteEndpoint {
  return {
    name: endpoint.name,
    ...(endpoint.stationId ? { stationId: endpoint.stationId } : {}),
    ...(endpoint.lat !== null && endpoint.lng !== null ? { lat: endpoint.lat, lng: endpoint.lng } : {}),
  };
}

export function favoriteLabel(favorite: Pick<FavoriteRoute, "origin" | "destination">): string {
  return `${favorite.origin.name} → ${favorite.destination.name}`;
}

/** 현재 위치는 매번 달라지는 좌표라 즐겨찾기로 둘 수 없다 */
export function canFavorite(origin: RouteEndpoint, destination: RouteEndpoint): boolean {
  return (
    isValidEndpoint(origin) &&
    isValidEndpoint(destination) &&
    origin.name !== CURRENT_LOCATION_NAME &&
    destination.name !== CURRENT_LOCATION_NAME &&
    !isSameEndpoint(origin, destination)
  );
}

export const toBody = (endpoint: RouteEndpoint): FavoriteEndpointBody =>
  endpoint.stationId
    ? { name: endpoint.name, stationId: endpoint.stationId }
    : { name: endpoint.name, lat: endpoint.lat, lng: endpoint.lng };

/** 저장 요청. 저장할 수 없는 경로면 null */
export function toSaveBody(origin: RouteEndpoint, destination: RouteEndpoint): SaveFavoriteRouteBody | null {
  if (!canFavorite(origin, destination)) return null;
  return { origin: toBody(origin), destination: toBody(destination) };
}

/** 이 경로가 이미 즐겨찾기면 그 항목 */
export function findFavorite(
  favorites: FavoriteRoute[] | undefined,
  origin: RouteEndpoint,
  destination: RouteEndpoint
): FavoriteRoute | undefined {
  const key = favoriteKey(origin, destination);
  if (!key) return undefined;
  return favorites?.find((favorite) => favoriteKey(favorite.origin, favorite.destination) === key);
}

export interface HomeRouteChip {
  id: string;
  label: string;
  origin: RouteEndpoint;
  destination: RouteEndpoint;
  /** 즐겨찾기면 true, 최근 경로로 채운 칩이면 false */
  favorite: boolean;
}

/** 홈 칩. 즐겨찾기를 먼저 보이고 모자라면 최근 경로로 채운다(이미 즐겨찾기인 경로는 건너뜀) */
export function toHomeRouteChips(
  favorites: FavoriteRoute[] | undefined,
  recentRoutes: RecentRouteItem[],
  limit: number = MAX_ROUTE_CHIPS
): HomeRouteChip[] {
  const chips: HomeRouteChip[] = (favorites ?? []).slice(0, limit).map((favorite) => ({
    id: `favorite:${favorite.id}`,
    label: favoriteLabel(favorite),
    origin: favoriteEndpoint(favorite.origin),
    destination: favoriteEndpoint(favorite.destination),
    favorite: true,
  }));
  if (chips.length >= limit) return chips;

  const saved = new Set((favorites ?? []).map((favorite) => favoriteKey(favorite.origin, favorite.destination)));
  const seen = new Set<string>();
  for (const chip of toRecentRouteChips(recentRoutes, recentRoutes.length)) {
    if (chips.length >= limit) break;
    const key = favoriteKey(chip.origin, chip.destination);
    if (key && (saved.has(key) || seen.has(key))) continue;
    if (key) seen.add(key);
    chips.push({ ...chip, id: `recent:${chip.id}`, favorite: false });
  }
  return chips;
}
