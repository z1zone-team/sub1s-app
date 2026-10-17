import type { PathSegmentDto, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { WALK_LINE_ID } from "@/theme";

export interface Stop {
  stationId: string;
  /** 탑승 시각 기준으로 이 역에 닿는 예상 시점(초) */
  atSec: number;
  /** 이 역에서 출발하는 구간의 번호. 도착역에는 없다 */
  segmentIndex?: number;
  /** 이 역에서 열차를 갈아타거나 내린다 */
  event?: "TRANSFER" | "ALIGHT";
}

function proportional(stationIds: string[], totalSec: number): number[] {
  const last = Math.max(stationIds.length - 1, 1);
  return stationIds.map((_, index) => (totalSec * index) / last);
}

/** 구간에 속하지 않는 역(환승 걷기 등)은 앞뒤로 시간이 정해진 역 사이를 고르게 나눠 채운다 */
function interpolate(times: Array<number | undefined>, totalSec: number): number[] {
  const filled = [...times];
  if (filled[0] === undefined) filled[0] = 0;
  if (filled[filled.length - 1] === undefined) filled[filled.length - 1] = totalSec;

  let previous = 0;
  for (let index = 1; index < filled.length; index += 1) {
    if (filled[index] === undefined) continue;
    const gap = index - previous;
    for (let step = 1; step < gap; step += 1) {
      filled[previous + step] =
        (filled[previous] as number) + (((filled[index] as number) - (filled[previous] as number)) * step) / gap;
    }
    previous = index;
  }
  return filled as number[];
}

/**
 * 경로의 역 목록에 도착 예상 시점을 붙인다. 구간이 지나는 역 사이에 구간 소요 시간을 고르게 나누고,
 * 구간이 역 목록과 맞지 않으면 전체 소요 시간을 역 수로 나눈다.
 */
export function buildStops(option: SubwayRouteOptionDto, stationIds: string[]): Stop[] {
  const count = stationIds.length;
  if (count === 0) return [];

  const times: Array<number | undefined> = new Array(count).fill(undefined);
  const segmentOf: Array<number | undefined> = new Array(count).fill(undefined);
  const lastRideIndex = option.segments.reduce(
    (found, segment, index) => (segment.lineId === WALK_LINE_ID ? found : index),
    -1
  );
  const events: Array<Stop["event"]> = new Array(count).fill(undefined);

  let cursor = 0;
  let startSec = 0;
  let matched = 0;

  option.segments.forEach((segment, segmentIndex) => {
    const from = stationIds.indexOf(segment.fromStationId, cursor);
    const to = stationIds.indexOf(segment.toStationId, Math.max(from, cursor));
    if (from < 0 || to < 0) {
      return;
    }
    matched += 1;
    const steps = to - from;
    for (let step = 0; step <= steps; step += 1) {
      const index = from + step;
      if (times[index] === undefined) times[index] = startSec + (segment.durationSec * step) / Math.max(steps, 1);
      if (step < steps || steps === 0) segmentOf[index] = segmentIndex;
    }
    if (segment.lineId !== WALK_LINE_ID) {
      events[to] = segmentIndex === lastRideIndex ? "ALIGHT" : "TRANSFER";
    }
    startSec += segment.durationSec;
    cursor = to;
  });

  const filled = matched === 0 ? proportional(stationIds, option.totalDurationSec) : interpolate(times, option.totalDurationSec);

  let previous = 0;
  return stationIds.map((stationId, index) => {
    previous = Math.max(previous, filled[index]);
    return {
      stationId,
      atSec: previous,
      segmentIndex: index === count - 1 ? undefined : segmentOf[index],
      event: events[index] ?? (index === count - 1 ? "ALIGHT" : undefined),
    };
  });
}

export interface Anchor {
  /** 사용자가 알려 주거나 위치로 확인한 역의 순번 */
  index: number;
  atMs: number;
}

export interface GuideProgress {
  currentIndex: number;
  nextIndex: number;
  stopsLeft: number;
  remainingSec: number;
  /** 도착역은 사용자가 도착을 확인해야 하므로 추정만으로 마지막 역에 닿았다고 하지 않는다 */
  atFinalStop: boolean;
}

function effectiveElapsedSec(stops: Stop[], startedAtMs: number, nowMs: number, anchor?: Anchor): number {
  if (anchor && stops[anchor.index]) {
    return stops[anchor.index].atSec + Math.max(0, nowMs - anchor.atMs) / 1000;
  }
  return Math.max(0, nowMs - startedAtMs) / 1000;
}

/**
 * 지금까지의 진행. gate는 아직 타지 않은 다음 열차를 타는 역의 순번이다. 타기 전에는 그 역에서 더 가지 않고,
 * 거기 닿으면 기다리는 동안 남은 시간이 줄지 않는다.
 */
export function guideProgress(
  stops: Stop[],
  startedAtMs: number,
  nowMs: number,
  anchor?: Anchor,
  gate?: number
): GuideProgress {
  const finalIndex = stops.length - 1;
  if (finalIndex <= 0) {
    return { currentIndex: 0, nextIndex: 0, stopsLeft: 0, remainingSec: 0, atFinalStop: true };
  }

  const elapsed = effectiveElapsedSec(stops, startedAtMs, nowMs, anchor);
  let estimated = 0;
  for (let index = 0; index < stops.length; index += 1) {
    if (stops[index].atSec <= elapsed) estimated = index;
  }

  const floor = anchor && stops[anchor.index] ? anchor.index : 0;
  const atFinalStop = anchor?.index === finalIndex;
  const unclamped = atFinalStop ? finalIndex : Math.min(Math.max(estimated, floor), finalIndex - 1);
  const waiting = gate !== undefined && stops[gate] !== undefined && unclamped >= gate;
  const currentIndex = waiting ? (gate as number) : unclamped;
  const nextIndex = Math.min(currentIndex + 1, finalIndex);

  return {
    currentIndex,
    nextIndex,
    stopsLeft: finalIndex - currentIndex,
    remainingSec: waiting
      ? Math.max(0, Math.round(stops[finalIndex].atSec - stops[gate as number].atSec))
      : Math.max(0, Math.round(stops[finalIndex].atSec - elapsed)),
    atFinalStop: waiting ? false : atFinalStop,
  };
}

export interface UpcomingAction {
  kind: "TRANSFER" | "ALIGHT";
  /** 이 순번의 역에서 갈아타거나 내린다 */
  index: number;
  stopsAway: number;
}

/** 지금 역 다음부터 처음 만나는 환승 또는 하차 */
export function upcomingAction(stops: Stop[], currentIndex: number): UpcomingAction | null {
  for (let index = currentIndex + 1; index < stops.length; index += 1) {
    const event = stops[index].event;
    if (event) return { kind: event, index, stopsAway: index - currentIndex };
  }
  return null;
}

/** 지금 타고 있는 구간 */
export function currentSegment(
  option: SubwayRouteOptionDto,
  stops: Stop[],
  currentIndex: number
): PathSegmentDto | undefined {
  for (let index = currentIndex; index < stops.length; index += 1) {
    const segmentIndex = stops[index].segmentIndex;
    if (segmentIndex === undefined) continue;
    const segment = option.segments[segmentIndex];
    if (segment.lineId !== WALK_LINE_ID) return segment;
  }
  return undefined;
}

export interface Coordinate {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_M = 6_371_000;

export function distanceMeters(a: Coordinate, b: Coordinate): number {
  const toRad = (degree: number) => (degree * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** 경로의 역 중 위치에서 가장 가까운 역의 순번. 기준 거리 안에 없으면 -1 */
export function nearestStopIndex(
  position: Coordinate,
  coordinates: Array<Coordinate | undefined>,
  maxMeters: number
): number {
  let best = -1;
  let bestDistance = maxMeters;
  coordinates.forEach((coordinate, index) => {
    if (!coordinate) return;
    const distance = distanceMeters(position, coordinate);
    if (distance <= bestDistance) {
      best = index;
      bestDistance = distance;
    }
  });
  return best;
}

/**
 * 환승역은 호선마다 역 ID가 달라 목록에 같은 이름이 연달아 나온다. 보여 줄 때는 앞의 하나만 남기고,
 * 남은 역 수도 이 기준으로 센다. 돌려주는 값은 보여 줄 역의 순번이다.
 */
export function visibleStopIndexes(names: string[]): number[] {
  const visible: number[] = [];
  names.forEach((name, index) => {
    if (index === 0 || !name || name !== names[index - 1]) visible.push(index);
  });
  return visible;
}
