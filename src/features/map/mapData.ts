import type { LineMapResponseDto } from "@/apis/queries/profile/getLineMap";
import { LINES } from "@/theme";
import type { MapData, MapLine, MapMarker } from "./mapHtml";

const DIMMED_OPACITY = 0.25;

/** 호선 색. 서버가 준 색이 있으면 그 값을 쓰고 없으면 앱의 호선 색을 쓴다 */
const colorOf = (lineId: string, serverColor: string | undefined): string =>
  serverColor || LINES[lineId]?.color || "#B0B8C1";

/**
 * 방문한 역을 호선 순서대로 이어 선으로 만들고 점을 찍는다. 방문하지 않은 역에서 선이 끊긴다.
 * focusLineId가 있으면 그 호선만 진하게 그리고 나머지는 흐리게 그린다. 방문한 역이 없으면 빈 지도다
 */
export function visitedMapData(lineMap: LineMapResponseDto | undefined, focusLineId?: string): MapData {
  const lines: MapLine[] = [];
  const markers: MapMarker[] = [];

  for (const line of lineMap?.lines ?? []) {
    const color = colorOf(line.lineId, line.colorHex);
    const opacity = focusLineId && focusLineId !== line.lineId ? DIMMED_OPACITY : 1;
    const stations = [...line.stations].sort((a, b) => a.lineSeq - b.lineSeq);

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
}

/** 내 위치 색은 쓰이지 않지만 마커 형식상 필요하다. 내 위치는 캐릭터로 그린다 */
const ME_COLOR = "#002968";

/**
 * 홈 지도는 프로토타입처럼 내 위치를 캐릭터로 표시하고, 지도 검색에서 고른 장소가 있으면 핀을 더한다.
 * 고른 장소가 있으면 그곳을, 없으면 내 위치를, 둘 다 없으면 기본 위치를 보여 준다
 */
export function homeMapData({ me, pin }: HomeMapInput): MapData {
  const markers: MapMarker[] = [];
  if (me) markers.push({ lat: me.lat, lng: me.lng, color: ME_COLOR, kind: "me" });
  if (pin) markers.push({ lat: pin.lat, lng: pin.lng, color: ME_COLOR, kind: "pin" });

  const focus = pin ?? me;
  if (!focus) return { markers, lines: [], fit: false };
  return {
    markers,
    lines: [],
    fit: false,
    center: [focus.lat, focus.lng],
    zoom: pin ? 16 : 15,
  };
}
