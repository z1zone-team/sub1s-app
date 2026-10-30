import type { LineMapResponseDto } from "@/apis/queries/profile/getLineMap";
import { LINES } from "@/theme";
import type { GhostMood } from "./ghostMarker";
import type { MapData, MapLine, MapMarker } from "./mapHtml";

const DIMMED_OPACITY = 0.25;

/** 호선 색. 서버가 준 색이 있으면 그 값을 쓰고 없으면 앱의 호선 색을 쓴다 */
const colorOf = (lineId: string, serverColor: string | undefined): string =>
  serverColor || LINES[lineId]?.color || "#B0B8C1";

/**
 * 서버가 준 링크(이어서 지난 역 쌍)가 있으면 그것으로 선을 만들고, 없으면(구버전 서버) 방문한 역을 호선 번호 순서로 이어
 * 방문하지 않은 역에서 끊는다. 방문한 역마다 점을 찍는다.
 * focusLineId가 있으면 그 호선만 진하게 그리고 나머지는 흐리게 그린다. 방문한 역이 없으면 빈 지도다
 */
export function visitedMapData(
  lineMap: LineMapResponseDto | undefined,
  focusLineId?: string,
  tripStationIds?: string[]
): MapData {
  const lines: MapLine[] = [];
  const markers: MapMarker[] = [];

  for (const line of lineMap?.lines ?? []) {
    const color = colorOf(line.lineId, line.colorHex);
    const opacity = focusLineId && focusLineId !== line.lineId ? DIMMED_OPACITY : 1;
    const stations = [...line.stations].sort((a, b) => a.lineSeq - b.lineSeq);

    if (line.links) {
      // 지선이 있는 호선은 번호가 본선과 지선을 섞어 매겨져 번호 이웃으로는 이을 수 없어서 실제로 지난 쌍을 쓴다
      const byId = new Map(stations.map((station) => [station.stationId, station]));
      for (const link of line.links) {
        const from = byId.get(link.fromStationId);
        const to = byId.get(link.toStationId);
        if (from && to) {
          lines.push({
            color,
            points: [
              [from.lat, from.lng],
              [to.lat, to.lng],
            ],
            opacity,
          });
        }
      }
      for (const station of stations) {
        if (station.visited) markers.push({ lat: station.lat, lng: station.lng, color, radius: 4 });
      }
      continue;
    }

    let piece: Array<[number, number]> = [];
    const flush = () => {
      if (piece.length >= 2) lines.push({ color, points: piece, opacity });
      piece = [];
    };

    for (const station of stations) {
      if (!station.visited) {
        flush();
        continue;
      }
      piece.push([station.lat, station.lng]);
      markers.push({ lat: station.lat, lng: station.lng, color, radius: 4 });
    }
    flush();
  }

  if (tripStationIds && tripStationIds.length >= 2) {
    const trip = tripMapData(lineMap, tripStationIds);
    // 고른 이동만 진하게, 나머지 호선 선은 흐리게 배경으로 깔고 지도는 고른 이동에 맞춘다
    if (trip.lines.length > 0) {
      const background = lines.map((line) => ({ ...line, opacity: DIMMED_OPACITY, noFit: true }));
      return { lines: [...background, ...trip.lines], markers: trip.markers, fit: true };
    }
  }

  return { lines, markers, fit: markers.length > 0 };
}

/** 호선이 바뀌는 곳(환승)을 잇는 점선 색 */
const TRANSFER_LINK_COLOR = "#B0B8C1";

/**
 * 이동 한 건이 지난 역을 순서대로 호선 구간별 선으로 만든다. 호선이 바뀌면 환승으로 보고 점선으로 잇는다.
 * 지도에 없는 역은 건너뛴다. 급행은 정차역만 있어 정차역끼리 곧게 이어진다
 */
export function tripMapData(lineMap: LineMapResponseDto | undefined, stationIds: string[]): MapData {
  const known = new Map<string, { lat: number; lng: number; lineId: string; color: string }>();
  for (const line of lineMap?.lines ?? []) {
    const color = colorOf(line.lineId, line.colorHex);
    for (const station of line.stations) {
      known.set(station.stationId, { lat: station.lat, lng: station.lng, lineId: line.lineId, color });
    }
  }

  const lines: MapLine[] = [];
  const markers: MapMarker[] = [];
  let piece: Array<[number, number]> = [];
  let pieceLineId: string | undefined;
  let pieceColor = "";
  let lastPoint: [number, number] | undefined;

  const flush = () => {
    if (piece.length >= 2) lines.push({ color: pieceColor, points: piece, weight: 7 });
    piece = [];
  };

  for (const id of stationIds) {
    const station = known.get(id);
    if (!station) continue;
    const point: [number, number] = [station.lat, station.lng];
    markers.push({ lat: station.lat, lng: station.lng, color: station.color, radius: 6 });

    if (pieceLineId !== undefined && station.lineId !== pieceLineId) {
      flush();
      if (lastPoint) lines.push({ color: TRANSFER_LINK_COLOR, points: [lastPoint, point], dashed: true });
    }
    pieceLineId = station.lineId;
    pieceColor = station.color;
    piece.push(point);
    lastPoint = point;
  }
  flush();

  return { lines, markers, fit: markers.length > 0 };
}

/** 방문한 역이 하나라도 있는 호선. 호선 필터에 쓴다 */
export function visitedLineIds(lineMap: LineMapResponseDto | undefined): string[] {
  return (lineMap?.lines ?? [])
    .filter((line) => line.stations.some((station) => station.visited))
    .map((line) => line.lineId);
}

export interface HomeMapInput {
  me?: { lat: number; lng: number };
  /** 지도 검색에서 고른 장소. 있으면 그곳을 중심으로 보여 준다 */
  pin?: { lat: number; lng: number };
  /** 내 캐릭터의 표정. 이번 달 이동 거리로 정한다 */
  mood?: GhostMood;
}

/** 내 위치 색은 쓰이지 않지만 마커 형식상 필요하다. 내 위치는 캐릭터로 그린다 */
const ME_COLOR = "#002968";

/**
 * 홈 지도는 프로토타입처럼 내 위치를 캐릭터로 표시하고, 지도 검색에서 고른 장소가 있으면 핀을 더한다.
 * 고른 장소가 있으면 그곳을, 없으면 내 위치를, 둘 다 없으면 기본 위치를 보여 준다
 */
export function homeMapData({ me, pin, mood }: HomeMapInput): MapData {
  const markers: MapMarker[] = [];
  if (me) markers.push({ lat: me.lat, lng: me.lng, color: ME_COLOR, kind: "me", mood });
  if (pin) markers.push({ lat: pin.lat, lng: pin.lng, color: ME_COLOR, kind: "pin" });

  const focus = pin ?? me;
  if (!focus) return { markers, lines: [], fit: false };
  return {
    markers,
    lines: [],
    fit: false,
    center: [focus.lat, focus.lng],
    zoom: 16,
  };
}
