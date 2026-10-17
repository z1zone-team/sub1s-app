import type { PathSegmentDto, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import type { MapData, MapLine, MapMarker } from "@/features/map/mapHtml";
import { formatClock24Kst } from "@/common/utils/format";
import { getLineInfo, WALK_LINE_ID } from "@/theme";

const isRide = (segment: PathSegmentDto): boolean => segment.lineId !== WALK_LINE_ID;

export type TimelineRow =
  /** 걷기로 시작하는 경로의 출발점 */
  | { kind: "depart"; key: string; timeMs?: number }
  /** 열차를 타는 역. 이 구간의 정보(칸별 혼잡도 등)가 붙는다 */
  | { kind: "board"; key: string; timeMs?: number; segment: PathSegmentDto; isFirstRide: boolean }
  /** 열차에서 내리는 역. 다음이 열차면 환승이다 */
  | { kind: "alight"; key: string; timeMs?: number; segment: PathSegmentDto; transfer: boolean }
  /** 걷는 구간 */
  | { kind: "walk"; key: string; segment: PathSegmentDto }
  | { kind: "arrive"; key: string; timeMs?: number };

/** 시각 열에 쓰는 "14:17". 시각을 모르면 빈 문자열 */
export function timeLabel(timeMs: number | undefined): string {
  return timeMs === undefined ? "" : formatClock24Kst(timeMs);
}

/**
 * 프로토타입 경로 상세의 타임라인 행들. 도착 시각에서 소요 시간을 거꾸로 빼 출발 시각을 구하고,
 * 구간 소요 시간을 차례로 더해 승차, 하차 시각을 정한다. 도착 시각이 없으면 시각을 비운다.
 * 환승이 있으면 구간마다 승차, 하차 행이 이어진다
 */
export function buildTimeline(option: SubwayRouteOptionDto): TimelineRow[] {
  const arrival = Date.parse(option.estimatedArrivalTimestamp);
  const known = !Number.isNaN(arrival);
  let cursor = known ? arrival - option.totalDurationSec * 1000 : undefined;
  const advance = (seconds: number) => {
    if (cursor !== undefined) cursor += seconds * 1000;
  };

  const rows: TimelineRow[] = [];
  const firstRideIndex = option.segments.findIndex(isRide);

  option.segments.forEach((segment, index) => {
    const key = `${segment.lineId}-${index}`;
    if (!isRide(segment)) {
      if (index === 0) rows.push({ kind: "depart", key: `depart-${index}`, timeMs: cursor });
      rows.push({ kind: "walk", key, segment });
      advance(segment.durationSec);
      return;
    }
    rows.push({ kind: "board", key: `board-${key}`, timeMs: cursor, segment, isFirstRide: index === firstRideIndex });
    advance(segment.durationSec);
    const next = option.segments[index + 1];
    rows.push({ kind: "alight", key: `alight-${key}`, timeMs: cursor, segment, transfer: Boolean(next && isRide(next)) });
  });

  rows.push({ kind: "arrive", key: "arrive", timeMs: known ? arrival : undefined });
  return rows;
}

/** "오후 2:17 - 2:51". 오전, 오후가 같으면 뒤쪽은 시각만 쓴다 */
export function clockRangeShort(option: SubwayRouteOptionDto, formatClock: (ms: number) => string): string {
  const arrival = Date.parse(option.estimatedArrivalTimestamp);
  if (Number.isNaN(arrival)) return "";
  const departure = arrival - option.totalDurationSec * 1000;
  const from = formatClock(departure);
  const to = formatClock(arrival);
  const [fromPeriod] = from.split(" ");
  const [toPeriod, toTime] = to.split(" ");
  return fromPeriod === toPeriod && toTime ? `${from} - ${toTime}` : `${from} - ${to}`;
}

const MAX_LOOKUP = 20;

/**
 * 지도에 선을 그리기 위해 좌표를 조회할 역 ID. 역 조회는 한 번에 20개까지라서,
 * 많으면 구간의 처음과 끝 역을 먼저 넣고 남는 자리를 중간역에서 일정 간격으로 채운다
 */
export function mapStationIds(option: SubwayRouteOptionDto, max: number = MAX_LOOKUP): string[] {
  const all = option.stationIds ?? [];
  if (all.length <= max) return [...new Set(all)];

  const chosen = new Set<string>();
  for (const segment of option.segments) {
    chosen.add(segment.fromStationId);
    chosen.add(segment.toStationId);
  }
  const rest = all.filter((id) => !chosen.has(id));
  const room = Math.max(0, max - chosen.size);
  if (room > 0 && rest.length > 0) {
    const step = Math.max(1, Math.floor(rest.length / room));
    for (let i = 0; i < rest.length && chosen.size < max; i += step) chosen.add(rest[i]);
  }
  return [...chosen].slice(0, max);
}

export type StationCoords = ReadonlyMap<string, { lat: number; lng: number }>;

/** 서버가 좌표로 요청한 출발지와 도착지를 걷기 구간에서 부르는 가짜 역 ID */
const ORIGIN_COORDINATE_ID = "ORIGIN_COORDINATE";
const DESTINATION_COORDINATE_ID = "DEST_COORDINATE";

export interface RouteEndpointCoords {
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
}

const WALK_COLOR = "#B0B8C1";
const ENDPOINT_COLOR = "#191F28";

/**
 * 경로 상세 위쪽 지도 데이터. 탑승 구간은 호선 색 선으로, 도보는 회색 점선으로 잇고,
 * 승하차역에는 호선 색 점을, 처음과 끝에는 진한 점을 찍는다. 좌표를 모르는 역은 건너뛴다.
 * 좌표로 정한 출발지와 도착지(걷기 구간의 ORIGIN_COORDINATE, DEST_COORDINATE)는 endpoints로 좌표를 풀어 준다
 */
export function routeMapData(option: SubwayRouteOptionDto, coords: StationCoords, endpoints: RouteEndpointCoords = {}): MapData {
  const ids = option.stationIds ?? [];
  const lines: MapLine[] = [];
  const markers: MapMarker[] = [];

  const point = (id: string): [number, number] | undefined => {
    const endpoint =
      id === ORIGIN_COORDINATE_ID ? endpoints.origin : id === DESTINATION_COORDINATE_ID ? endpoints.destination : undefined;
    const found = endpoint ?? coords.get(id);
    return found ? [found.lat, found.lng] : undefined;
  };

  let searchFrom = 0;
  for (const segment of option.segments) {
    const ride = isRide(segment);
    let points: Array<[number, number]> = [];

    const start = ids.indexOf(segment.fromStationId, searchFrom);
    const end = start >= 0 ? ids.indexOf(segment.toStationId, start) : -1;
    if (ride && start >= 0 && end > start) {
      points = ids.slice(start, end + 1).map(point).filter((p): p is [number, number] => Boolean(p));
      searchFrom = end;
    }
    if (points.length < 2) {
      points = [point(segment.fromStationId), point(segment.toStationId)].filter((p): p is [number, number] => Boolean(p));
    }

    const color = ride ? getLineInfo(segment.lineId).color : WALK_COLOR;
    if (points.length >= 2) lines.push({ color, points, weight: ride ? 6 : 4, dashed: !ride });

    if (ride) {
      for (const id of [segment.fromStationId, segment.toStationId]) {
        const p = point(id);
        if (p) markers.push({ lat: p[0], lng: p[1], color, radius: 5 });
      }
    }
  }

  const first = option.segments[0];
  const last = option.segments[option.segments.length - 1];
  const startPoint = first && point(first.fromStationId);
  const endPoint = last && point(last.toStationId);
  if (startPoint) markers.push({ lat: startPoint[0], lng: startPoint[1], color: ENDPOINT_COLOR, radius: 7 });
  if (endPoint) markers.push({ lat: endPoint[0], lng: endPoint[1], color: ENDPOINT_COLOR, radius: 7 });

  return { lines, markers, fit: lines.length > 0 || markers.length > 0 };
}
