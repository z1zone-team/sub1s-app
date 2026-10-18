/**
 * 시트의 네 위치. 전체는 지도를 덮을 만큼 올라온 상태, 위는 기본으로 펼친 상태(디폴트),
 * 중간은 제목 줄만 보이는 접힘, 아래는 손잡이만 남아 지도만 보이는 상태다.
 * 전체가 필요 없는 시트는 전체와 위가 같은 높이라 위 하나로 합쳐진다
 */
export type SheetPosition = "FULL" | "TOP" | "MIDDLE" | "BOTTOM";

export const SHEET_POSITIONS: readonly SheetPosition[] = ["FULL", "TOP", "MIDDLE", "BOTTOM"];

/** 위치마다 열린 위치(0)에서 얼마나 아래로 내려가 있는지(px). 값이 클수록 아래다 */
export type SheetOffsets = Record<SheetPosition, number>;

/** 이만큼(px) 이상 움직여야 끌기로 본다 */
export const DRAG_START_DISTANCE = 6;
/** 이 속도(px/ms)보다 빠르게 쓸면 거리와 상관없이 쓴 방향으로 한 칸 움직인다 */
export const FLING_VELOCITY = 0.5;
/** 이만큼(px) 이상 끌고 놓으면 가까운 위치와 상관없이 끈 방향으로 한 칸 움직인다 */
export const INTENT_DISTANCE = 48;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

/**
 * 위치마다 내려간 정도. 시트 전체 높이에서 각 위치에 화면에 보이는 높이를 뺀 값이다.
 * 전체는 항상 0이고, 위(디폴트)에 보이는 높이를 주지 않으면 시트 전체가 보이는 것으로 보아 전체와 같다.
 * 시트가 작아 겹치는 위치는 같은 값이 된다
 */
export function sheetOffsets(
  sheetHeight: number,
  middleVisible: number,
  bottomVisible: number,
  topVisible: number = sheetHeight
): SheetOffsets {
  const height = Math.max(0, sheetHeight);
  const bottom = clamp(height - bottomVisible, 0, height);
  const top = clamp(height - topVisible, 0, bottom);
  const middle = clamp(height - middleVisible, top, bottom);
  return { FULL: 0, TOP: top, MIDDLE: middle, BOTTOM: bottom };
}

/**
 * 지금 위치(offset)에서 가장 가까운 시트 위치. 같은 거리면 더 위쪽이다.
 * 다만 전체와 위가 같은 높이로 합쳐진 시트는 위로 돌려준다
 */
export function nearestPosition(offset: number, offsets: SheetOffsets): SheetPosition {
  let best: SheetPosition = "FULL";
  for (const position of SHEET_POSITIONS) {
    if (Math.abs(offsets[position] - offset) < Math.abs(offsets[best] - offset)) best = position;
  }
  return best === "FULL" && offsets.FULL === offsets.TOP ? "TOP" : best;
}

/**
 * 현재 위치에서 위나 아래로 한 칸. 위치가 겹쳐 같은 높이면 그 너머로 건너뛰고, 더 갈 곳이 없으면 그대로다.
 * 위로 갈 때 도착한 높이에 겹친 위치가 여럿이면 가장 위의 이름을 돌려준다
 */
export function stepPosition(from: SheetPosition, direction: "UP" | "DOWN", offsets: SheetOffsets): SheetPosition {
  const step = direction === "UP" ? -1 : 1;
  let index = SHEET_POSITIONS.indexOf(from) + step;
  while (index >= 0 && index < SHEET_POSITIONS.length) {
    if (offsets[SHEET_POSITIONS[index]] !== offsets[from]) {
      // 전체가 위와 합쳐진 시트는 위에서 멈춘다(전체가 따로 없는 시트다)
      const topmost = offsets.FULL === offsets.TOP ? 1 : 0;
      while (step < 0 && index > topmost && offsets[SHEET_POSITIONS[index - 1]] === offsets[SHEET_POSITIONS[index]])
        index -= 1;
      return SHEET_POSITIONS[index];
    }
    index += step;
  }
  return from;
}

interface CaptureInput {
  dx: number;
  dy: number;
  position: SheetPosition;
  offsets: SheetOffsets;
  /** 시트 안 목록이 맨 위인지. 스크롤이 없는 시트는 항상 true */
  scrollAtTop: boolean;
  /** true면 펼친(전체, 위) 시트에서 내용을 위로 끄는 것은 스크롤이다. 시트를 올리려면 손잡이를 끌어야 한다 */
  contentFirst?: boolean;
  /** 끌기가 손잡이에서 시작했는지. 손잡이는 내용 스크롤과 상관없이 시트를 움직인다 */
  fromHandle?: boolean;
}

/**
 * 시트가 끌기를 가져가야 하는지. 세로로 충분히 움직였을 때만이고, 위로 끌 때는 더 올라갈 곳이 있을 때,
 * 아래로 끌 때는 더 내려갈 곳이 있고 펼친 시트라면 목록이 맨 위일 때만 가져간다. 목록이 스크롤 중이면 스크롤이 우선이다
 */
export function shouldCaptureDrag({
  dx,
  dy,
  position,
  offsets,
  scrollAtTop,
  contentFirst = false,
  fromHandle = false,
}: CaptureInput): boolean {
  if (Math.abs(dy) <= DRAG_START_DISTANCE || Math.abs(dy) <= Math.abs(dx)) return false;
  const expanded = position === "FULL" || position === "TOP";
  if (dy < 0) {
    if (contentFirst && !fromHandle && expanded) return false;
    return stepPosition(position, "UP", offsets) !== position;
  }
  if (!fromHandle && expanded && !scrollAtTop) return false;
  return stepPosition(position, "DOWN", offsets) !== position;
}

interface ReleaseInput {
  /** 끌기를 시작한 위치 */
  from: SheetPosition;
  dy: number;
  /** 속도(px/ms). 아래로 쓸면 양수 */
  vy: number;
  offsets: SheetOffsets;
}

/**
 * 손을 뗐을 때 자리 잡을 위치. 빠르게 쓸었으면 그 방향으로 한 칸, 일정 거리 이상 끌었으면 끈 방향으로 한 칸이고,
 * 그보다 더 끌어 다른 위치에 가까워졌으면 그 위치다. 조금만 움직였으면 원래 위치로 돌아간다
 */
export function positionAfterRelease({ from, dy, vy, offsets }: ReleaseInput): SheetPosition {
  if (vy <= -FLING_VELOCITY) return stepPosition(from, "UP", offsets);
  if (vy >= FLING_VELOCITY) return stepPosition(from, "DOWN", offsets);

  const nearest = nearestPosition(clamp(offsets[from] + dy, 0, offsets.BOTTOM), offsets);
  if (Math.abs(dy) < INTENT_DISTANCE) return nearest;

  const intended = stepPosition(from, dy < 0 ? "UP" : "DOWN", offsets);
  // 끈 방향으로 더 멀리 간 쪽을 고른다
  return dy < 0
    ? offsets[intended] <= offsets[nearest]
      ? intended
      : nearest
    : offsets[intended] >= offsets[nearest]
      ? intended
      : nearest;
}

/**
 * 손잡이를 눌렀을 때: 접힌 시트는 한 칸 펼치고, 디폴트(위)에서는 전체가 있으면 전체로, 없으면 한 칸 접는다.
 * 전체에서는 디폴트로 돌아간다
 */
export function positionAfterTap(from: SheetPosition, offsets: SheetOffsets): SheetPosition {
  if (from === "FULL") return stepPosition(from, "DOWN", offsets);
  if (from === "TOP") {
    const up = stepPosition(from, "UP", offsets);
    return up !== from ? up : stepPosition(from, "DOWN", offsets);
  }
  return stepPosition(from, "UP", offsets);
}
