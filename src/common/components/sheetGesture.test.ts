import {
  FLING_VELOCITY,
  INTENT_DISTANCE,
  nearestPosition,
  positionAfterRelease,
  positionAfterTap,
  sheetOffsets,
  shouldCaptureDrag,
  stepPosition,
} from "./sheetGesture";

// 시트 높이 600, 중간에는 200, 아래에는 30만 보인다 -> 위 0, 중간 400, 아래 570
const OFFSETS = sheetOffsets(600, 200, 30);

describe("sheetOffsets", () => {
  it("세 위치에서 보이는 높이를 빼 내려간 정도를 만든다", () => {
    expect(OFFSETS).toEqual({ TOP: 0, MIDDLE: 400, BOTTOM: 570 });
  });

  it("시트가 작아 보이는 높이보다 낮으면 겹쳐 모두 0이다", () => {
    expect(sheetOffsets(100, 200, 30)).toEqual({ TOP: 0, MIDDLE: 0, BOTTOM: 70 });
    expect(sheetOffsets(20, 200, 30)).toEqual({ TOP: 0, MIDDLE: 0, BOTTOM: 0 });
  });

  it("중간이 아래보다 더 내려가지 않는다", () => {
    expect(sheetOffsets(600, 10, 30)).toEqual({ TOP: 0, MIDDLE: 570, BOTTOM: 570 });
  });
});

describe("nearestPosition", () => {
  it("가장 가까운 위치를 고른다", () => {
    expect(nearestPosition(100, OFFSETS)).toBe("TOP");
    expect(nearestPosition(250, OFFSETS)).toBe("MIDDLE");
    expect(nearestPosition(520, OFFSETS)).toBe("BOTTOM");
  });

  it("같은 거리면 더 위쪽이다", () => {
    expect(nearestPosition(200, OFFSETS)).toBe("TOP");
  });
});

describe("stepPosition", () => {
  it("위로 한 칸, 아래로 한 칸 움직인다", () => {
    expect(stepPosition("BOTTOM", "UP", OFFSETS)).toBe("MIDDLE");
    expect(stepPosition("MIDDLE", "UP", OFFSETS)).toBe("TOP");
    expect(stepPosition("TOP", "DOWN", OFFSETS)).toBe("MIDDLE");
    expect(stepPosition("MIDDLE", "DOWN", OFFSETS)).toBe("BOTTOM");
  });

  it("끝에서는 더 가지 않는다", () => {
    expect(stepPosition("TOP", "UP", OFFSETS)).toBe("TOP");
    expect(stepPosition("BOTTOM", "DOWN", OFFSETS)).toBe("BOTTOM");
  });

  it("높이가 같은 위치는 건너뛴다", () => {
    const merged = sheetOffsets(100, 200, 30); // TOP 0, MIDDLE 0, BOTTOM 70
    expect(stepPosition("TOP", "DOWN", merged)).toBe("BOTTOM");
    expect(stepPosition("BOTTOM", "UP", merged)).toBe("TOP");
  });
});

describe("shouldCaptureDrag", () => {
  const base = { dx: 0, position: "MIDDLE" as const, offsets: OFFSETS, scrollAtTop: true };

  it("중간 위치에서는 위로도 아래로도 끌 수 있다", () => {
    expect(shouldCaptureDrag({ ...base, dy: -20 })).toBe(true);
    expect(shouldCaptureDrag({ ...base, dy: 20 })).toBe(true);
  });

  it("아래 위치에서는 위로만, 위 위치에서는 아래로만 끌 수 있다", () => {
    expect(shouldCaptureDrag({ ...base, position: "BOTTOM", dy: -20 })).toBe(true);
    expect(shouldCaptureDrag({ ...base, position: "BOTTOM", dy: 20 })).toBe(false);
    expect(shouldCaptureDrag({ ...base, position: "TOP", dy: 20 })).toBe(true);
    expect(shouldCaptureDrag({ ...base, position: "TOP", dy: -20 })).toBe(false);
  });

  it("펼친 시트의 목록이 스크롤 중이면 아래로 끌어도 스크롤이 우선이다", () => {
    expect(shouldCaptureDrag({ ...base, position: "TOP", scrollAtTop: false, dy: 20 })).toBe(false);
  });

  it("조금 움직인 것은 탭으로 보고, 옆으로 더 많이 움직이면 가져가지 않는다", () => {
    expect(shouldCaptureDrag({ ...base, dy: -4 })).toBe(false);
    expect(shouldCaptureDrag({ ...base, dx: 40, dy: -20 })).toBe(false);
  });

  it("움직일 곳이 없는 시트는 가져가지 않는다", () => {
    const fixed = sheetOffsets(20, 200, 30);
    expect(shouldCaptureDrag({ ...base, offsets: fixed, dy: -20 })).toBe(false);
    expect(shouldCaptureDrag({ ...base, offsets: fixed, dy: 20 })).toBe(false);
  });
});

describe("positionAfterRelease", () => {
  it("빠르게 위로 쓸면 한 칸 올라가고, 아래로 쓸면 한 칸 내려간다", () => {
    expect(positionAfterRelease({ from: "BOTTOM", dy: -10, vy: -FLING_VELOCITY, offsets: OFFSETS })).toBe("MIDDLE");
    expect(positionAfterRelease({ from: "MIDDLE", dy: 10, vy: FLING_VELOCITY, offsets: OFFSETS })).toBe("BOTTOM");
    expect(positionAfterRelease({ from: "TOP", dy: 10, vy: FLING_VELOCITY, offsets: OFFSETS })).toBe("MIDDLE");
  });

  it("조금만 움직이면 원래 위치로 돌아간다", () => {
    expect(positionAfterRelease({ from: "MIDDLE", dy: 30, vy: 0, offsets: OFFSETS })).toBe("MIDDLE");
    expect(positionAfterRelease({ from: "TOP", dy: INTENT_DISTANCE - 1, vy: 0, offsets: OFFSETS })).toBe("TOP");
  });

  it("일정 거리 이상 끌면 가까운 위치와 상관없이 끈 방향으로 한 칸 간다", () => {
    expect(positionAfterRelease({ from: "TOP", dy: INTENT_DISTANCE, vy: 0, offsets: OFFSETS })).toBe("MIDDLE");
    expect(positionAfterRelease({ from: "MIDDLE", dy: -INTENT_DISTANCE, vy: 0, offsets: OFFSETS })).toBe("TOP");
    expect(positionAfterRelease({ from: "MIDDLE", dy: INTENT_DISTANCE, vy: 0, offsets: OFFSETS })).toBe("BOTTOM");
    expect(positionAfterRelease({ from: "BOTTOM", dy: -100, vy: 0, offsets: OFFSETS })).toBe("MIDDLE");
  });

  it("그보다 더 끌어 다른 위치에 가까워졌으면 그 위치까지 간다", () => {
    expect(positionAfterRelease({ from: "BOTTOM", dy: -500, vy: 0, offsets: OFFSETS })).toBe("TOP");
    expect(positionAfterRelease({ from: "TOP", dy: 500, vy: 0, offsets: OFFSETS })).toBe("BOTTOM");
  });

  it("범위를 넘게 끌어도 세 위치 안에서 정한다", () => {
    expect(positionAfterRelease({ from: "TOP", dy: -500, vy: 0, offsets: OFFSETS })).toBe("TOP");
    expect(positionAfterRelease({ from: "BOTTOM", dy: 500, vy: 0, offsets: OFFSETS })).toBe("BOTTOM");
  });
});

describe("positionAfterTap", () => {
  it("펼친 시트는 한 칸 접고, 접힌 시트는 한 칸 펼친다", () => {
    expect(positionAfterTap("TOP", OFFSETS)).toBe("MIDDLE");
    expect(positionAfterTap("MIDDLE", OFFSETS)).toBe("TOP");
    expect(positionAfterTap("BOTTOM", OFFSETS)).toBe("MIDDLE");
  });

  it("중간이 위와 겹치면 펼친 시트를 눌렀을 때 아래로 접는다", () => {
    expect(positionAfterTap("TOP", sheetOffsets(100, 200, 30))).toBe("BOTTOM");
  });
});
