import {
  BUBBLE_SIZE,
  bubbleBounds,
  clampToBounds,
  defaultBubblePosition,
  endDropPosition,
  endTargetCenter,
  endTargetTop,
  isOverEndTarget,
  snapX,
} from "./bubbleGeometry";

// 프로토타입 화면: 폭 393, 접힌 시트의 위쪽 629, 버튼 위 한계 176
const WIDTH = 393;
const SHEET_TOP = 629;
const bounds = bubbleBounds(WIDTH, SHEET_TOP, 176);

describe("bubbleBounds", () => {
  it("프로토타입과 같은 범위다", () => {
    expect(bounds).toEqual({ minX: 16, maxX: 309, minY: 176, maxY: 545 });
  });

  it("범위를 뒤집지 않는다(시트가 위 한계보다 위에 있어도)", () => {
    const small = bubbleBounds(WIDTH, 100, 176);
    expect(small.maxY).toBeGreaterThanOrEqual(small.minY);
  });
});

describe("clampToBounds", () => {
  it("범위 밖으로 나가지 않는다", () => {
    expect(clampToBounds({ x: -50, y: 9999 }, bounds)).toEqual({ x: 16, y: 545 });
    expect(clampToBounds({ x: 9999, y: 0 }, bounds)).toEqual({ x: 309, y: 176 });
  });

  it("범위 안이면 그대로다", () => {
    expect(clampToBounds({ x: 100, y: 300 }, bounds)).toEqual({ x: 100, y: 300 });
  });
});

describe("defaultBubblePosition", () => {
  it("오른쪽 가장자리, 시트 위 197px이다", () => {
    expect(defaultBubblePosition(bounds, SHEET_TOP)).toEqual({ x: 309, y: 432 });
  });
});

describe("끝내기 원", () => {
  const target = endTargetCenter(WIDTH, SHEET_TOP);

  it("가운데 아래, 프로토타입의 522에서 시작하는 64px 원이다", () => {
    expect(endTargetTop(SHEET_TOP)).toBe(522);
    expect(target).toEqual({ x: 196.5, y: 554 });
  });

  it("버튼 중심이 60px 안이면 위에 있다고 본다", () => {
    const onTarget = endDropPosition(target);
    expect(isOverEndTarget(onTarget, target)).toBe(true);
    expect(isOverEndTarget({ x: onTarget.x + 59, y: onTarget.y }, target)).toBe(true);
    expect(isOverEndTarget({ x: onTarget.x + 60, y: onTarget.y }, target)).toBe(false);
  });

  it("처음 자리는 끝내기 원에서 멀다", () => {
    expect(isOverEndTarget(defaultBubblePosition(bounds, SHEET_TOP), target)).toBe(false);
  });

  it("빨려 들어갈 자리는 원의 한가운데다", () => {
    const drop = endDropPosition(target);
    expect(drop.x + BUBBLE_SIZE / 2).toBe(target.x);
    expect(drop.y + BUBBLE_SIZE / 2).toBe(target.y);
  });
});

describe("snapX", () => {
  it("중심이 왼쪽 절반이면 왼쪽, 오른쪽 절반이면 오른쪽에 붙는다", () => {
    expect(snapX(100, WIDTH, bounds)).toBe(16);
    expect(snapX(200, WIDTH, bounds)).toBe(309);
  });

  it("딱 가운데면 오른쪽에 붙는다", () => {
    expect(snapX(WIDTH / 2 - BUBBLE_SIZE / 2, WIDTH, bounds)).toBe(309);
  });
});
