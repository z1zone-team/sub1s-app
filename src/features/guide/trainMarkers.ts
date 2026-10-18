import type { LineTrainPositions, TrainPosition } from "@/apis/queries/trains/getTrainPositions";
import type { MapMarker } from "@/features/map/mapHtml";
import type { Stop } from "./progress";

type Coords = { lat: number; lng: number };

/** 이보다 오래된 위치는 보여 주지 않는다. 잘못된 위치를 보여 주느니 안 보여 주는 편이 낫다 */
export const MAX_POSITION_AGE_SEC = 10 * 60;

/** 출발 직후와 전역출발 때 열차를 역 사이 어디쯤에 그릴지(앞 역에서 뒤 역까지의 비율) */
const DEPARTED_FRACTION = 0.25;
const LEFT_PREVIOUS_FRACTION = 0.7;

const lerp = (from: Coords, to: Coords, fraction: number): Coords => ({
  lat: from.lat + (to.lat - from.lat) * fraction,
  lng: from.lng + (to.lng - from.lng) * fraction,
});

/** 서버 위치가 아직 보여 줄 만큼 새로운지 */
export function isFreshPositions(positions: LineTrainPositions | undefined): positions is LineTrainPositions {
  return (
    positions !== undefined &&
    positions.status === "OK" &&
    positions.ageSec !== null &&
    positions.ageSec <= MAX_POSITION_AGE_SEC
  );
}

/** "방금 전", "4분 전"처럼 위치를 받은 지 얼마나 됐는지 */
export function positionAgeLabel(ageSec: number): string {
  if (ageSec < 60) return "방금 전";
  return `${Math.round(ageSec / 60)}분 전`;
}

/**
 * 안내 중 타는 호선의 열차를 지도 점으로 만든다. 내가 가는 방향의 열차만, 안내 경로가 지나는 역 위의 것만 보여 준다.
 * 진입과 도착은 역 위에, 출발은 역에서 다음 역 쪽으로 조금, 전역출발은 앞 역에서 이 역 쪽으로 많이 간 곳에 그린다
 */
export function trainMarkers(
  trains: TrainPosition[],
  options: {
    /** 지금 타는 구간의 호선 ID(예: "02")와 방향 */
    lineId: string;
    direction: TrainPosition["direction"];
    stops: Stop[];
    stations: ReadonlyMap<string, Coords>;
    color: string;
  }
): MapMarker[] {
  // 이 호선의 역만 경로 순서대로. 역 ID는 호선코드_번호 형식이다
  const line = options.stops.filter((stop) => stop.stationId.startsWith(`${options.lineId}_`));
  const indexOf = new Map(line.map((stop, index) => [stop.stationId, index]));

  return trains.flatMap((train) => {
    if (train.direction !== options.direction || !train.stationId) return [];
    const index = indexOf.get(train.stationId);
    if (index === undefined) return [];
    const here = options.stations.get(train.stationId);
    if (!here) return [];

    const previous = index > 0 ? options.stations.get(line[index - 1].stationId) : undefined;
    const next = index < line.length - 1 ? options.stations.get(line[index + 1].stationId) : undefined;

    let point = here;
    if (train.status === "DEPARTED" && next) point = lerp(here, next, DEPARTED_FRACTION);
    if (train.status === "LEFT_PREVIOUS" && previous) point = lerp(previous, here, LEFT_PREVIOUS_FRACTION);
    if (train.status === "UNKNOWN") return [];

    return [{ lat: point.lat, lng: point.lng, color: options.color, radius: 8 }];
  });
}
