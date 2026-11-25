import type { FavoriteEndpointBody } from "@/apis/queries/users/favoriteRoutes";
import type { FavoritePlace } from "@/apis/queries/users/favoritePlaces";
import { CURRENT_LOCATION_NAME, isValidEndpoint, type RouteEndpoint } from "./endpoint";
import { favoriteEndpoint, pointKey, toBody } from "./favoriteRoutes";

/** 홈에 칩으로 보이는 장소 즐겨찾기 수. 나머지는 즐겨찾기 시트에서 본다 */
export const MAX_PLACE_CHIPS = 3;

/** 이 장소가 이미 즐겨찾기면 그 항목. 서버와 같은 규칙(역 ID, 또는 소수 넷째 자리 좌표)으로 같은 곳을 판단한다 */
export function findFavoritePlace(
  places: FavoritePlace[] | undefined,
  endpoint: RouteEndpoint | undefined
): FavoritePlace | undefined {
  if (!endpoint) return undefined;
  const key = pointKey(endpoint);
  if (!key) return undefined;
  return places?.find((place) => pointKey(place) === key);
}

/** 저장 요청. 현재 위치처럼 매번 달라지는 곳이나 위치를 모르는 곳이면 null */
export function toPlaceBody(endpoint: RouteEndpoint): FavoriteEndpointBody | null {
  if (!isValidEndpoint(endpoint) || endpoint.name === CURRENT_LOCATION_NAME) return null;
  return toBody(endpoint);
}

export interface PlaceChip {
  id: string;
  label: string;
  endpoint: RouteEndpoint;
  place: FavoritePlace;
}

/** 홈 칩. 최근에 저장한 순서대로 limit개 */
export function toPlaceChips(places: FavoritePlace[] | undefined, limit: number = MAX_PLACE_CHIPS): PlaceChip[] {
  return (places ?? []).slice(0, limit).map((place) => ({
    id: `place:${place.id}`,
    label: place.name,
    endpoint: favoriteEndpoint(place),
    place,
  }));
}
