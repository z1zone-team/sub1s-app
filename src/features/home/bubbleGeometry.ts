/** 안내 복귀 버튼의 지름(px) */
export const BUBBLE_SIZE = 68;
/** 화면 가장자리와 버튼, 시트 사이 최소 간격 */
export const BUBBLE_MARGIN = 16;
/** 버튼 중심이 끝내기 원 중심에서 이 거리 안이면 "놓으면 끝내요" 상태가 된다 */
export const END_TARGET_RADIUS = 60;
/** 끝내기 원의 지름 */
export const END_TARGET_SIZE = 64;
/** 이만큼 움직여야 끌기로 본다(탭과 구분) */
export const DRAG_START_DISTANCE = 6;
/** 시트가 접힌 위치 위로 끝내기 원이 뜨는 간격: 프로토타입의 629 - 522 */
const END_TARGET_ABOVE_SHEET = 107;
/** 기본 위치는 시트 위로 이만큼 떠 있다: 프로토타입의 629 - 432 */
const DEFAULT_ABOVE_SHEET = 197;

export interface Point {
  x: number;
  y: number;
}

export interface BubbleBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * 버튼이 움직일 수 있는 범위(왼쪽 위 모서리 기준).
 * 가로는 양쪽 16px 안쪽, 세로는 위 한계부터 접힌 시트 위 16px까지다
 */
export function bubbleBounds(width: number, sheetTop: number, topLimit: number): BubbleBounds {
  const maxY = Math.max(topLimit, sheetTop - BUBBLE_MARGIN - BUBBLE_SIZE);
  return {
    minX: BUBBLE_MARGIN,
    maxX: Math.max(BUBBLE_MARGIN, width - BUBBLE_MARGIN - BUBBLE_SIZE),
    minY: topLimit,
    maxY,
  };
}

export const clampToBounds = (point: Point, bounds: BubbleBounds): Point => ({
  x: Math.max(bounds.minX, Math.min(bounds.maxX, point.x)),
  y: Math.max(bounds.minY, Math.min(bounds.maxY, point.y)),
});

/** 처음 놓이는 자리: 오른쪽 가장자리, 시트 위로 197px */
export function defaultBubblePosition(bounds: BubbleBounds, sheetTop: number): Point {
  return clampToBounds({ x: bounds.maxX, y: sheetTop - DEFAULT_ABOVE_SHEET }, bounds);
}

/** 끝내기 원의 중심 */
export function endTargetCenter(width: number, sheetTop: number): Point {
  return { x: width / 2, y: sheetTop - END_TARGET_ABOVE_SHEET + END_TARGET_SIZE / 2 };
}

/** 끝내기 원의 위쪽 가장자리 y */
export const endTargetTop = (sheetTop: number): number => sheetTop - END_TARGET_ABOVE_SHEET;

/** 버튼(왼쪽 위 모서리 기준)의 중심이 끝내기 원 가까이 있는가 */
export function isOverEndTarget(bubble: Point, target: Point): boolean {
  const dx = bubble.x + BUBBLE_SIZE / 2 - target.x;
  const dy = bubble.y + BUBBLE_SIZE / 2 - target.y;
  return Math.sqrt(dx * dx + dy * dy) < END_TARGET_RADIUS;
}

/** 놓았을 때 붙는 쪽: 버튼 중심이 화면 가운데보다 왼쪽이면 왼쪽, 아니면 오른쪽 가장자리 */
export function snapX(bubbleX: number, width: number, bounds: BubbleBounds): number {
  return bubbleX + BUBBLE_SIZE / 2 < width / 2 ? bounds.minX : bounds.maxX;
}

/** 끝내기 원에 놓았을 때 버튼이 빨려 들어가 멈추는 자리(왼쪽 위 모서리 기준) */
export const endDropPosition = (target: Point): Point => ({
  x: target.x - BUBBLE_SIZE / 2,
  y: target.y - BUBBLE_SIZE / 2,
});
