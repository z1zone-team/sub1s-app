import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import type { MapData, MapMarker } from "@/features/map/mapHtml";
import { type RouteEndpointCoords, routeMapData } from "@/features/routing/routeTimeline";

const ME_COLOR = "#002968";
const GUIDE_ZOOM = 15;

/**
 * 안내 중 지도: 경로 선과 승하차역 점에, 위치를 알면 내 위치 캐릭터를 더한다.
 * 위치를 알면 그 주변을 보여 주고(지도가 사용자를 따라간다), 모르면 경로 전체가 보이게 맞춘다
 */
export function guideMapData(
  option: SubwayRouteOptionDto,
  stations: ReadonlyMap<string, { lat: number; lng: number }>,
  me?: { lat: number; lng: number },
  endpoints?: RouteEndpointCoords,
  /** 위의 배너와 아래의 시트가 지도를 덮은 높이(px). 내 위치가 그 사이 보이는 영역의 가운데에 오게 한다 */
  insets?: { top?: number; bottom?: number },
  /** 서버가 알려 준 열차 위치 점. 내 위치 캐릭터보다 아래에 그린다 */
  trains: MapMarker[] = []
): MapData {
  const base = routeMapData(option, stations, endpoints);
  const route = trains.length > 0 ? { ...base, markers: [...base.markers, ...trains] } : base;
  if (!me) return route;

  return {
    ...route,
    markers: [...route.markers, { lat: me.lat, lng: me.lng, color: ME_COLOR, kind: "me" }],
    fit: false,
    center: [me.lat, me.lng],
    zoom: GUIDE_ZOOM,
    bottomInset: insets?.bottom,
    topInset: insets?.top,
  };
}
