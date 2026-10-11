import type { PlaceKind, SavePlaceBody, UserPlace } from "@/apis/queries/users/places";
import { isValidEndpoint, type RouteEndpoint } from "@/features/routing/endpoint";

export const PLACE_LABEL: Record<PlaceKind, string> = { HOME: "집", SCHOOL: "학교" };
export const PLACE_KINDS: PlaceKind[] = ["HOME", "SCHOOL"];

/** 저장된 장소를 경로의 도착지로 쓴다. 이름은 사용자가 정한 이름 그대로 보여 준다 */
export function placeToEndpoint(place: UserPlace): RouteEndpoint {
  return {
    name: place.name,
    ...(place.stationId ? { stationId: place.stationId } : {}),
    ...(place.lat !== null && place.lng !== null ? { lat: place.lat, lng: place.lng } : {}),
  };
}

/** 검색에서 고른 출발지나 도착지를 저장 요청으로 바꾼다. 역이면 역 ID만, 장소면 좌표를 보낸다. 쓸 수 없으면 null */
export function endpointToSaveBody(endpoint: RouteEndpoint): SavePlaceBody | null {
  if (!isValidEndpoint(endpoint)) return null;
  if (endpoint.stationId) return { name: endpoint.name, stationId: endpoint.stationId };
  return { name: endpoint.name, lat: endpoint.lat, lng: endpoint.lng };
}

/** 종류별로 저장된 장소. 없으면 undefined */
export function placeOfKind(places: UserPlace[] | undefined, kind: PlaceKind): UserPlace | undefined {
  return places?.find((place) => place.kind === kind);
}
