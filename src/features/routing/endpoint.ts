import type {
  PlaceSearchItem,
  StationSearchItem,
} from "@/apis/queries/places/searchPlaces";
import type {
  RouteMode,
  RouteSearchRequest,
} from "@/apis/queries/routing/searchRoutes";

export const CURRENT_LOCATION_NAME = "현재 위치";

/** 출발지나 도착지. 역이면 stationId, 장소와 현재 위치면 좌표를 가진다 */
export interface RouteEndpoint {
  name: string;
  stationId?: string;
  lat?: number;
  lng?: number;
}

const isCoordinate = (value: number | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function endpointFromStation(item: StationSearchItem): RouteEndpoint {
  return { name: item.name, stationId: item.stationId };
}

/** 장소는 좌표와 이름을 경로 검색에 넘기고, 가까운 역과 도보 구간은 서버가 붙인다 */
export function endpointFromPlace(item: Pick<PlaceSearchItem, "name" | "lat" | "lng">): RouteEndpoint {
  return { name: item.name, lat: item.lat, lng: item.lng };
}

export function endpointFromCoords(lat: number, lng: number): RouteEndpoint {
  return { name: CURRENT_LOCATION_NAME, lat, lng };
}

/** 좌표로 정한 출발지나 도착지의 좌표. 역으로 정했으면 없다 */
export function endpointCoords(endpoint: RouteEndpoint | undefined): { lat: number; lng: number } | undefined {
  return endpoint && isCoordinate(endpoint.lat) && isCoordinate(endpoint.lng)
    ? { lat: endpoint.lat, lng: endpoint.lng }
    : undefined;
}

export function isValidEndpoint(endpoint: RouteEndpoint | undefined): endpoint is RouteEndpoint {
  if (!endpoint) return false;
  return (
    Boolean(endpoint.stationId) ||
    (isCoordinate(endpoint.lat) && isCoordinate(endpoint.lng))
  );
}

/** 같은 역(또는 같은 좌표)이면 true. 서버는 같은 역 사이 검색을 400으로 거절한다 */
export function isSameEndpoint(a: RouteEndpoint, b: RouteEndpoint): boolean {
  if (a.stationId && b.stationId) return a.stationId === b.stationId;
  if (isCoordinate(a.lat) && isCoordinate(a.lng) && isCoordinate(b.lat) && isCoordinate(b.lng)) {
    return a.lat === b.lat && a.lng === b.lng;
  }
  return false;
}

/** 목록에서 같은 도착지를 하나로 합치기 위한 키 */
export function endpointKey(endpoint: RouteEndpoint): string {
  if (endpoint.stationId) return `station:${endpoint.stationId}`;
  if (isCoordinate(endpoint.lat) && isCoordinate(endpoint.lng)) {
    return `place:${endpoint.lat.toFixed(5)},${endpoint.lng.toFixed(5)}`;
  }
  return `name:${endpoint.name}`;
}

/** 역이면 역 ID만, 아니면 좌표와 이름을 서버 경로 검색 요청 형태로 바꾼다 */
export function toRouteSearchRequest(
  origin: RouteEndpoint,
  destination: RouteEndpoint,
  routeMode?: RouteMode,
  /** 출발 시각(ms). 없으면 지금 출발이라 서버가 현재 시각을 쓴다 */
  departureMs?: number
): RouteSearchRequest {
  const request: RouteSearchRequest = {};

  if (origin.stationId) {
    request.originStationId = origin.stationId;
  } else {
    request.originLat = origin.lat;
    request.originLng = origin.lng;
    request.originName = origin.name;
  }

  if (destination.stationId) {
    request.destinationStationId = destination.stationId;
  } else {
    request.destinationLat = destination.lat;
    request.destinationLng = destination.lng;
    request.destinationName = destination.name;
  }

  if (routeMode) request.routeMode = routeMode;
  if (departureMs !== undefined) request.departureAt = new Date(departureMs).toISOString();
  return request;
}

/** 딥링크 `sub1s://route?origin=09_925&destination=02_222`의 값은 역 ID다. 이름은 화면에서 역 조회로 채운다 */
export function parseEndpointParam(value: string | undefined): RouteEndpoint | undefined {
  const stationId = value?.trim();
  return stationId ? { name: "", stationId } : undefined;
}

export function stringifyEndpointParam(endpoint: RouteEndpoint): string {
  return endpoint.stationId ?? "";
}
