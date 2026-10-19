import type { PathSegmentDto, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import type { MapData, MapLine, MapMarker } from "@/features/map/mapHtml";
import { formatClock24Kst } from "@/common/utils/format";
import { getLineInfo, WALK_LINE_ID } from "@/theme";
import { decodePolyline } from "./polyline";

const isRide = (segment: PathSegmentDto): boolean => segment.lineId !== WALK_LINE_ID;

/** 타임라인에서 누른 칸. 지도를 이 위치로 확대하는 데 쓴다 */
export type TimelineTarget =
  /** 탑승이나 도보 구간 */
  | { kind: "segment"; segment: PathSegmentDto }
  /** 하차나 환승 역 */
  | { kind: "station"; stationId: string }
  | { kind: "depart" }
  | { kind: "arrive" };

export type TimelineRow =
  /** 걷기로 시작하는 경로의 출발점 */
  | { kind: "depart"; key: string; timeMs?: number }
  /** 열차를 타는 역. 이 구간의 정보(칸별 혼잡도 등)가 붙는다 */
  | { kind: "board"; key: string; timeMs?: number; segment: PathSegmentDto; isFirstRide: boolean }
  /** 열차에서 내리는 역. 다음이 열차면 환승이고, transferWalkSec는 다음 열차를 타러 걷는 시간(모르면 없음) */
  | { kind: "alight"; key: string; timeMs?: number; segment: PathSegmentDto; transfer: boolean; transferWalkSec?: number }
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
 * 환승이 있으면 구간마다 승차, 하차 행이 이어진다.
 * 서버가 주는 승차 시각(boardingAt)에는 앞선 환승 걷기가 들어 있어서 있으면 그 값을 쓰고, 없으면 소요 시간만 더한다
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
    const boardingMs = segment.boardingAt ? Date.parse(segment.boardingAt) : Number.NaN;
    if (!Number.isNaN(boardingMs)) cursor = boardingMs;
    rows.push({ kind: "board", key: `board-${key}`, timeMs: cursor, segment, isFirstRide: index === firstRideIndex });
    advance(segment.durationSec);
    const next = option.segments[index + 1];
    const transfer = Boolean(next && isRide(next));
    const nextBoardingMs = transfer && next.boardingAt ? Date.parse(next.boardingAt) : Number.NaN;
    const transferWalkSec =
      cursor !== undefined && !Number.isNaN(nextBoardingMs) ? Math.max(0, Math.round((nextBoardingMs - cursor) / 1000)) : undefined;
    rows.push({
      kind: "alight",
      key: `alight-${key}`,
      timeMs: cursor,
      segment,
      transfer,
      ...(transferWalkSec !== undefined ? { transferWalkSec } : {}),
    });
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

/** 역 ID를 지도 좌표로 바꾼다. 좌표로 정한 출발지와 도착지는 endpoints로 푼다. 모르면 undefined */
export function pointLookup(coords: StationCoords, endpoints: RouteEndpointCoords = {}) {
  return (id: string): [number, number] | undefined => {
    const endpoint =
      id === ORIGIN_COORDINATE_ID ? endpoints.origin : id === DESTINATION_COORDINATE_ID ? endpoints.destination : undefined;
    const found = endpoint ?? coords.get(id);
    return found ? [found.lat, found.lng] : undefined;
  };
}

/**
 * 구간마다 지도에서 지나는 좌표. 탑승은 실제 선로 모양(있으면)을, 없으면 지나는 역을 잇고,
 * 도보는 실제 보행 경로(있으면)를 잇고, 모르면 처음과 끝 좌표다. 좌표를 모르는 곳은 빠지므로 비어 있을 수 있다
 */
export function routeSegmentPoints(
  option: SubwayRouteOptionDto,
  coords: StationCoords,
  endpoints: RouteEndpointCoords = {}
): Array<Array<[number, number]>> {
  const ids = option.stationIds ?? [];
  const point = pointLookup(coords, endpoints);
  const result: Array<Array<[number, number]>> = [];

  let searchFrom = 0;
  for (const segment of option.segments) {
    const ride = isRide(segment);
    let points: Array<[number, number]> = [];

    const start = ids.indexOf(segment.fromStationId, searchFrom);
    const end = start >= 0 ? ids.indexOf(segment.toStationId, start) : -1;
    if (ride && start >= 0 && end > start) {
      searchFrom = end;
      // 서버가 준 실제 선로 모양. 양 끝이 역 좌표라서 이어 붙이지 않고 그대로 쓴다
      const track = segment.path ? decodePolyline(segment.path) : [];
      points =
        track.length >= 2
          ? track
          : ids.slice(start, end + 1).map(point).filter((p): p is [number, number] => Boolean(p));
    }
    if (!ride && segment.path) {
      // 실제 보행 경로 선. 선 끝은 가장 가까운 보행로에 붙은 점이라 출발지와 역 좌표를 양 끝에 이어 붙인다
      const route = decodePolyline(segment.path);
      if (route.length >= 2) {
        const from = point(segment.fromStationId);
        const to = point(segment.toStationId);
        points = [...(from ? [from] : []), ...route, ...(to ? [to] : [])];
      }
    }
    if (points.length < 2) {
      points = [point(segment.fromStationId), point(segment.toStationId)].filter((p): p is [number, number] => Boolean(p));
    }
    result.push(points);
  }
  return result;
}

/**
 * 경로 상세 위쪽 지도 데이터. 탑승 구간은 호선 색 선으로, 도보는 회색 점선으로 잇고,
 * 승하차역에는 호선 색 점을, 처음과 끝에는 진한 점을 찍는다. 좌표를 모르는 역은 건너뛴다.
 * 좌표로 정한 출발지와 도착지(걷기 구간의 ORIGIN_COORDINATE, DEST_COORDINATE)는 endpoints로 좌표를 풀어 준다
 */
export function routeMapData(option: SubwayRouteOptionDto, coords: StationCoords, endpoints: RouteEndpointCoords = {}): MapData {
  const lines: MapLine[] = [];
  const markers: MapMarker[] = [];
  const point = pointLookup(coords, endpoints);
  const segmentPoints = routeSegmentPoints(option, coords, endpoints);

  option.segments.forEach((segment, index) => {
    const ride = isRide(segment);
    const points = segmentPoints[index];
    const color = ride ? getLineInfo(segment.lineId).color : WALK_COLOR;
    if (points.length >= 2) lines.push({ color, points, weight: ride ? 6 : 4, dashed: !ride });

    if (ride) {
      for (const id of [segment.fromStationId, segment.toStationId]) {
        const p = point(id);
        if (p) markers.push({ lat: p[0], lng: p[1], color, radius: 5 });
      }
    }
  });

  const first = option.segments[0];
  const last = option.segments[option.segments.length - 1];
  const startPoint = first && point(first.fromStationId);
  const endPoint = last && point(last.toStationId);
  if (startPoint) markers.push({ lat: startPoint[0], lng: startPoint[1], color: ENDPOINT_COLOR, radius: 7 });
  if (endPoint) markers.push({ lat: endPoint[0], lng: endPoint[1], color: ENDPOINT_COLOR, radius: 7 });

  return { lines, markers, fit: lines.length > 0 || markers.length > 0 };
}

/**
 * 누른 칸을 지도에서 보여 줄 좌표. 구간은 그 구간이 지나는 좌표 전체(한눈에 보이게 확대),
 * 역과 출발, 도착은 한 점이다. 좌표를 모르면 undefined
 */
export function targetFocusPoints(
  option: SubwayRouteOptionDto,
  coords: StationCoords,
  endpoints: RouteEndpointCoords,
  target: TimelineTarget
): Array<[number, number]> | undefined {
  const point = pointLookup(coords, endpoints);
  const single = (id: string | undefined) => {
    const found = id ? point(id) : undefined;
    return found ? [found] : undefined;
  };

  if (target.kind === "station") return single(target.stationId);
  if (target.kind === "depart") return single(option.segments[0]?.fromStationId);
  if (target.kind === "arrive") return single(option.segments[option.segments.length - 1]?.toStationId);

  let index = option.segments.indexOf(target.segment);
  if (index < 0) {
    index = option.segments.findIndex(
      (segment) =>
        segment.fromStationId === target.segment.fromStationId &&
        segment.toStationId === target.segment.toStationId &&
        segment.lineId === target.segment.lineId
    );
  }
  const points = index >= 0 ? routeSegmentPoints(option, coords, endpoints)[index] : undefined;
  return points && points.length > 0 ? points : undefined;
}

/** 두 칸이 같은 칸인지. 같은 칸을 다시 누르면 확대를 풀어 전체 경로로 돌아가는 데 쓴다 */
export function sameTarget(a: TimelineTarget | null, b: TimelineTarget): boolean {
  if (!a || a.kind !== b.kind) return false;
  if (a.kind === "station" && b.kind === "station") return a.stationId === b.stationId;
  if (a.kind === "segment" && b.kind === "segment") {
    return a.segment.fromStationId === b.segment.fromStationId && a.segment.toStationId === b.segment.toStationId && a.segment.lineId === b.segment.lineId;
  }
  return true;
}
