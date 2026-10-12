import type { PathSegmentDto, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { WALK_LINE_ID } from "@/theme";

export type RerouteRow =
  /** 이탈을 알아챈 역에서 내려 맞은편 승강장으로 건너간다. 걷는 구간이 앞에 있으면 그 시간을 준다 */
  | { kind: "leave"; key: string; stationName: string; walkMinutes?: number }
  /** 새 경로에서 열차를 타는 역 */
  | { kind: "board"; key: string; segment: PathSegmentDto; isFirstRide: boolean }
  /** 새 경로의 도착역에서 내린다. 뒤에 도보가 있으면 도보 시간과 목적지를 준다 */
  | { kind: "arrive"; key: string; stationId?: string; stationName: string; walkMinutes?: number; walkTo?: string };

const isRide = (segment: PathSegmentDto): boolean => segment.lineId !== WALK_LINE_ID;
const minutesOf = (segment: PathSegmentDto): number => Math.max(1, Math.round(segment.durationSec / 60));

/**
 * 이탈 화면의 새 경로 타임라인 행들. 프로토타입처럼 "이탈한 역 하차 → 새 열차 승차 → 도착역 하차" 순서이다.
 * 새 경로의 첫 구간이 도보(맞은편 승강장 이동)면 그 시간을 첫 행에 붙이고, 탑승 구간은 구간마다 승차 행을 만든다
 */
export function buildRerouteRows(option: SubwayRouteOptionDto, detectedStationName: string): RerouteRow[] {
  const segments = option.segments;
  const first = segments[0];
  const rows: RerouteRow[] = [
    {
      kind: "leave",
      key: "leave",
      stationName: detectedStationName,
      walkMinutes: first && !isRide(first) ? minutesOf(first) : undefined,
    },
  ];

  const firstRideIndex = segments.findIndex(isRide);
  segments.forEach((segment, index) => {
    if (!isRide(segment)) return;
    rows.push({ kind: "board", key: `board-${segment.lineId}-${index}`, segment, isFirstRide: index === firstRideIndex });
  });

  const rides = segments.filter(isRide);
  const lastRide = rides[rides.length - 1];
  const last = segments[segments.length - 1];
  if (lastRide) {
    const trailingWalk = last && !isRide(last) && last !== first ? last : undefined;
    rows.push({
      kind: "arrive",
      key: "arrive",
      stationId: lastRide.toStationId,
      stationName: lastRide.toStationName,
      walkMinutes: trailingWalk ? minutesOf(trailingWalk) : undefined,
      walkTo: trailingWalk?.toStationName,
    });
  }
  return rows;
}
