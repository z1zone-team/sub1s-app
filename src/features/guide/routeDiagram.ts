import type { SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { getLineInfo, WALK_LINE_ID } from "@/theme";
import type { Stop } from "./progress";

/** 도보 구간을 잇는 색 */
export const DIAGRAM_WALK_COLOR = "#B0B8C1";
/** 점이 놓이는 양 끝에서 화면 가장자리까지의 여백(px) */
export const DIAGRAM_SIDE = 34;
/** 줄이 꺾일 때 바깥으로 불룩하게 나가는 정도(px) */
export const DIAGRAM_BEND = 16;
/** 위아래 여백(px) */
export const DIAGRAM_PADDING = 22;
/** 점이 놓인 선에서 세로쓰기 이름이 시작하기까지의 높이(px) */
export const DIAGRAM_DOT_BAND = 22;
/** 세로쓰기 이름 글자 하나가 차지하는 높이(px) */
export const DIAGRAM_LABEL_STEP = 14;
/** 한 줄 아래에 이름이 길어도 이만큼(글자 수)만 쓰고 나머지는 줄인다 */
export const DIAGRAM_MAX_LABEL = 6;
/** 줄이 꺾이는 곳 근처에 환승 표시를 둘 높이(px) */
export const DIAGRAM_TRANSFER_BAND = 30;
/** 한 줄에서 역 사이의 최소 간격(px). 세로쓰기 이름이 겹치지 않는 폭이고, 이보다 좁아지면 줄을 나눈다 */
export const DIAGRAM_MIN_SPACING = 20;

export type DiagramNodeState = "passed" | "current" | "upcoming";
export type DiagramNodeKind = "start" | "stop" | "transfer" | "end";

export interface DiagramNode {
  key: string;
  /** 경로의 역 목록(stops)에서의 순번. 역을 눌렀을 때 지도를 이 역으로 확대하는 데 쓴다 */
  index: number;
  /** 줄이 몇 번째인지(0부터). 열차 구간마다 한 줄이고, 역이 많아 한 줄에 다 못 담으면 같은 구간이 다음 줄로 이어진다 */
  row: number;
  /** 전체 이름 */
  name: string;
  /** 세로로 쓸 이름. 길면 줄인다 */
  label: string;
  x: number;
  y: number;
  color: string;
  kind: DiagramNodeKind;
  state: DiagramNodeState;
}

export interface DiagramRow {
  index: number;
  /** 점이 놓인 선의 세로 위치 */
  y: number;
  /** 이 줄이 흐르는 방향. 줄마다 번갈아 가며 꺾여 이어진다 */
  direction: "right" | "left";
  color: string;
  /** 이 줄에서 세로로 쓴 이름이 차지하는 높이 */
  labelHeight: number;
  /** 이 줄이 속한 열차 구간의 순번. 같은 구간이 여러 줄로 이어지면 같은 값이다 */
  run: number;
}

export interface DiagramLink {
  key: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  /** 줄이 끝나 아래 줄로 꺾여 넘어가는 구간. 바깥쪽(side)으로 불룩하게 이어진다 */
  turn?: { side: 1 | -1 };
  /** 도보나 호선이 바뀌는 환승 구간. 점선으로 그린다 */
  dashed: boolean;
  /** 이미 지나온 구간 */
  passed: boolean;
}

/** 줄이 꺾이는 환승역 옆에 붙이는 "3호선 환승" 표시 */
export interface DiagramTransfer {
  key: string;
  /** 꺾이는 쪽 끝의 가로 위치와 표시를 놓을 세로 위치 */
  x: number;
  y: number;
  /** 표시를 점 안쪽(화면 가운데 쪽)으로 펼칠지 */
  align: "left" | "right";
  label: string;
  color: string;
}

export interface RouteDiagramModel {
  nodes: DiagramNode[];
  rows: DiagramRow[];
  links: DiagramLink[];
  transfers: DiagramTransfer[];
  height: number;
}

interface DiagramInput {
  option: SubwayRouteOptionDto;
  stops: Stop[];
  /** stops와 같은 순서의 역 이름 */
  names: string[];
  /** 보여 줄 역의 순번(같은 이름이 이어지는 환승역은 하나만). 보통 visibleStopIndexes의 결과다 */
  visible: number[];
  /** visible 안에서 지금 있는 역의 순번 */
  currentPosition: number;
  /** 노선도를 그릴 너비(px) */
  width: number;
}

const lineColor = (option: SubwayRouteOptionDto, segmentIndex: number): string => {
  const segment = option.segments[segmentIndex];
  return !segment || segment.lineId === WALK_LINE_ID ? DIAGRAM_WALK_COLOR : getLineInfo(segment.lineId).color;
};

/** 세로로 쓸 이름. 너무 길면 줄이고 …를 붙인다 */
export function diagramLabel(name: string): string {
  const chars = [...name];
  return chars.length > DIAGRAM_MAX_LABEL ? `${chars.slice(0, DIAGRAM_MAX_LABEL - 1).join("")}…` : name;
}

/**
 * 노선도에 그릴 역의 순번. 같은 열차 안에서 이름이 이어서 같은 역(중복)은 하나만 두되,
 * 열차가 바뀌는 환승역은 두 노선의 역을 모두 남긴다(예: 에버라인 기흥과 수인분당선 기흥).
 * 호선이 바뀌는 곳을 점선으로 이어 환승으로 보이게 하려는 것이다
 */
export function diagramStopIndexes(stops: Stop[], names: string[]): number[] {
  const kept: number[] = [];
  let previousSegment = 0;
  let keptSegment = -1;
  stops.forEach((stop, index) => {
    const segmentIndex = stop.segmentIndex ?? previousSegment;
    previousSegment = segmentIndex;
    const last = kept[kept.length - 1];
    const sameStop = last !== undefined && names[index] === names[last] && segmentIndex === keptSegment;
    if (sameStop) return;
    kept.push(index);
    keptSegment = segmentIndex;
  });
  return kept;
}

/**
 * 안내 중 노선도의 배치. 열차 구간마다 가로 한 줄이고, 첫 줄은 왼쪽에서 오른쪽으로 흐르다 끝에서 꺾여
 * 다음 줄은 오른쪽에서 왼쪽으로, 그다음은 다시 왼쪽에서 오른쪽으로 이어지는 S자(뱀) 모양이다.
 * 열차를 하나만 타면 한 줄 직선이다. 한 줄 안의 역은 같은 간격으로 놓고 이름은 세로쓰기로 모두 쓴다.
 * 도보는 앞 탑승 구간과 같은 줄에서 점선으로 잇는다
 */
export function buildRouteDiagram({ option, stops, names, visible, currentPosition, width }: DiagramInput): RouteDiagramModel {
  if (visible.length === 0) return { nodes: [], rows: [], links: [], transfers: [], height: 0 };
  const leftX = DIAGRAM_SIDE;
  const rightX = Math.max(width - DIAGRAM_SIDE, leftX + 1);

  // 역마다 속한 구간. 구간 정보가 없는 역(환승 걷기 등)은 앞 역의 구간을 따른다
  let previousSegment = 0;
  let rideCount = 0;
  let previousRide = -1;
  const placed = visible.map((index) => {
    const segmentIndex = stops[index]?.segmentIndex ?? previousSegment;
    previousSegment = segmentIndex;
    const isWalk = option.segments[segmentIndex]?.lineId === WALK_LINE_ID;
    // 탑승 구간이 바뀔 때마다 새 줄이다. 도보는 앞 탑승 구간의 줄을 그대로 쓴다
    if (!isWalk && segmentIndex !== previousRide) {
      rideCount += 1;
      previousRide = segmentIndex;
    }
    return { index, segmentIndex, isWalk, row: Math.max(rideCount - 1, 0) };
  });

  // 같은 구간(열차)의 역을 모은다
  const runCount = placed[placed.length - 1].row + 1;
  const runs: number[][] = Array.from({ length: runCount }, () => []);
  placed.forEach((item, position) => runs[item.row].push(position));

  // 한 줄에 놓을 수 있는 역 수: 역 사이가 DIAGRAM_MIN_SPACING보다 좁아지면 이름이 겹치므로 줄을 나눈다.
  // 나눌 때는 줄마다 역 수가 고르도록 한다
  const maxPerRow = Math.max(2, Math.floor((rightX - leftX) / DIAGRAM_MIN_SPACING) + 1);
  const chunks: Array<{ run: number; positions: number[] }> = [];
  runs.forEach((positions, run) => {
    const pieces = Math.max(1, Math.ceil(positions.length / maxPerRow));
    const base = Math.floor(positions.length / pieces);
    const extra = positions.length % pieces;
    let start = 0;
    for (let piece = 0; piece < pieces; piece += 1) {
      const size = base + (piece < extra ? 1 : 0);
      chunks.push({ run, positions: positions.slice(start, start + size) });
      start += size;
    }
  });
  const rowCount = chunks.length;

  const rows: DiagramRow[] = [];
  const nodes: DiagramNode[] = new Array(placed.length);
  let y = DIAGRAM_PADDING;

  chunks.forEach(({ run, positions }, rowIndex) => {
    const direction: DiagramRow["direction"] = rowIndex % 2 === 0 ? "right" : "left";
    const startX = direction === "right" ? leftX : rightX;
    const endX = direction === "right" ? rightX : leftX;
    const labelHeight = Math.max(...positions.map((p) => [...diagramLabel(names[placed[p].index] ?? "")].length)) * DIAGRAM_LABEL_STEP + 6;
    const rowSegment = placed[positions[0]].segmentIndex;
    // 줄의 색은 그 줄의 탑승 구간 색이다(앞에 도보가 붙은 줄은 탑승 구간을 찾는다)
    const rideSegment = positions.map((p) => placed[p].segmentIndex).find((s) => option.segments[s]?.lineId !== WALK_LINE_ID) ?? rowSegment;
    rows.push({ index: rowIndex, y, direction, color: lineColor(option, rideSegment), labelHeight, run });

    positions.forEach((position, order) => {
      const item = placed[position];
      const fraction = positions.length === 1 ? 0 : order / (positions.length - 1);
      const first = position === 0;
      const last = position === placed.length - 1;
      // 줄이 꺾이는 곳 중 호선이 바뀌는 곳만 환승이다. 같은 열차가 다음 줄로 이어지는 곳은 보통 역이다
      const startsNewLine = order === 0 && rowIndex > 0 && chunks[rowIndex - 1].run !== run;
      const endsOldLine = order === positions.length - 1 && rowIndex < rowCount - 1 && chunks[rowIndex + 1].run !== run;
      nodes[position] = {
        key: `${item.index}-${position}`,
        index: item.index,
        row: rowIndex,
        name: names[item.index] ?? "",
        label: diagramLabel(names[item.index] ?? ""),
        x: startX + (endX - startX) * fraction,
        y,
        color: lineColor(option, item.segmentIndex),
        kind: first ? "start" : last ? "end" : startsNewLine || endsOldLine ? "transfer" : "stop",
        state: position < currentPosition ? "passed" : position === currentPosition ? "current" : "upcoming",
      };
    });

    const isLastRow = rowIndex === rowCount - 1;
    const nextIsNewLine = !isLastRow && chunks[rowIndex + 1].run !== run;
    // 호선이 바뀌는 꺾임만 환승 표시 자리를 더 둔다
    y += DIAGRAM_DOT_BAND + labelHeight + (isLastRow ? 0 : nextIsNewLine ? DIAGRAM_TRANSFER_BAND : DIAGRAM_TRANSFER_BAND / 2);
  });

  const links: DiagramLink[] = [];
  for (let position = 0; position < nodes.length - 1; position += 1) {
    const from = nodes[position];
    const to = nodes[position + 1];
    const isTurn = to.row !== from.row;
    const nextItem = placed[position + 1];
    // 호선이 바뀌는 곳(환승)과 도보는 점선이다. 같은 열차가 역이 많아 다음 줄로 넘어가는 곳은 호선 색 실선을 유지한다
    const lineChange = isTurn && rows[to.row].run !== rows[from.row].run;
    const dashed = lineChange || nextItem.isWalk || placed[position].isWalk;
    links.push({
      key: `${from.key}>${to.key}`,
      from: { x: from.x, y: from.y },
      to: { x: to.x, y: to.y },
      // 줄이 넘어가는 곳은 새로 타는 열차의 색이다
      color: dashed ? DIAGRAM_WALK_COLOR : rows[from.row].color,
      turn: isTurn ? { side: rows[from.row].direction === "right" ? 1 : -1 } : undefined,
      dashed,
      passed: position + 1 <= currentPosition,
    });
  }

  const transfers: DiagramTransfer[] = [];
  for (let rowIndex = 0; rowIndex < rowCount - 1; rowIndex += 1) {
    // 같은 열차가 다음 줄로 이어지는 꺾임에는 환승 표시를 붙이지 않는다
    if (chunks[rowIndex + 1].run === chunks[rowIndex].run) continue;
    const lastNode = nodes[chunks[rowIndex].positions[chunks[rowIndex].positions.length - 1]];
    const nextPositions = chunks[rowIndex + 1].positions;
    const nextRide =
      nextPositions.map((p) => placed[p].segmentIndex).find((s) => option.segments[s]?.lineId !== WALK_LINE_ID) ??
      placed[nextPositions[0]].segmentIndex;
    const lineName = getLineInfo(option.segments[nextRide]?.lineId ?? "").name;
    transfers.push({
      key: `transfer-${rowIndex}`,
      x: lastNode.x,
      y: rows[rowIndex].y + DIAGRAM_DOT_BAND + rows[rowIndex].labelHeight + DIAGRAM_TRANSFER_BAND / 2,
      align: rows[rowIndex].direction === "right" ? "right" : "left",
      label: `${lastNode.name} ${lineName} 환승`,
      color: lineColor(option, nextRide),
    });
  }

  const lastRow = rows[rows.length - 1];
  const height = lastRow.y + DIAGRAM_DOT_BAND + lastRow.labelHeight + DIAGRAM_PADDING;
  return { nodes, rows, links, transfers, height };
}

/** 한 구간의 SVG 경로. 같은 줄은 직선이고, 줄이 넘어가는 곳은 바깥으로 불룩한 U자로 아래 줄에 이어진다 */
export function linkPath(link: DiagramLink): string {
  const { from, to } = link;
  if (!link.turn) return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  const out = from.x + link.turn.side * DIAGRAM_BEND * 2;
  return `M ${from.x} ${from.y} C ${out} ${from.y}, ${out} ${to.y}, ${to.x} ${to.y}`;
}
