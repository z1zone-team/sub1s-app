import {
  createLevelMeter,
  LEVEL_CEIL_DB,
  LEVEL_FLOOR_DB,
  LEVEL_SAMPLE_MS,
  LEVEL_GAMMA,
  levelFromDb,
  NOISE_MARGIN_DB,
  NOISE_WINDOW_MS,
} from "./speechLevel";

describe("levelFromDb", () => {
  it("바닥 값 이하는 0, 천장 값 이상은 1이다", () => {
    expect(levelFromDb(LEVEL_FLOOR_DB)).toBe(0);
    expect(levelFromDb(LEVEL_FLOOR_DB - 30)).toBe(0);
    expect(levelFromDb(LEVEL_CEIL_DB)).toBe(1);
    expect(levelFromDb(0)).toBe(1);
  });

  it("그 사이는 크기에 비례한다", () => {
    expect(levelFromDb((LEVEL_FLOOR_DB + LEVEL_CEIL_DB) / 2)).toBeCloseTo(0.5);
    expect(levelFromDb(-40)).toBeLessThan(levelFromDb(-25));
    expect(levelFromDb(-25)).toBeLessThan(levelFromDb(-15));
  });

  it("무음(-160dB)은 0이다", () => {
    expect(levelFromDb(-160)).toBe(0);
  });

  it("값이 없거나 숫자가 아니면 조용한 것으로 본다", () => {
    expect(levelFromDb(undefined)).toBe(0);
    expect(levelFromDb(Number.NaN)).toBe(0);
    expect(levelFromDb(-Infinity)).toBe(0);
    expect(levelFromDb(Infinity)).toBe(0);
  });

  it("범위를 바꿀 수 있다", () => {
    expect(levelFromDb(-30, -60, 0)).toBeCloseTo(0.5);
  });

  it("천장이 바닥 이하이면 바닥을 넘는 값은 1, 아니면 0이다", () => {
    expect(levelFromDb(-5, -10, -10)).toBe(1);
    expect(levelFromDb(-15, -10, -10)).toBe(0);
  });
});

describe("createLevelMeter", () => {
  const feed = (meter: ReturnType<typeof createLevelMeter>, db: number, count: number): number[] =>
    Array.from({ length: count }, () => meter.push(db));

  it("조용한 방의 소리는 선(0)이고 말소리는 크게 나온다", () => {
    const meter = createLevelMeter();
    feed(meter, -50, 20);

    expect(meter.push(-50)).toBe(0);
    expect(meter.push(-45)).toBe(0);
    expect(meter.push(-15)).toBeGreaterThan(0.7);
    expect(meter.push(-5)).toBe(1);
  });

  it("지하철처럼 계속 시끄러운 곳에서는 소음 바닥이 올라가 소음은 선이고 목소리만 파형이 된다", () => {
    const meter = createLevelMeter();
    feed(meter, -28, NOISE_WINDOW_MS / LEVEL_SAMPLE_MS + 5);

    expect(meter.floorDb()).toBe(-28);
    expect(meter.push(-28)).toBe(0);
    expect(meter.push(-24)).toBe(0);
    expect(meter.push(-8)).toBeGreaterThan(0.5);
  });

  it("주변이 조용했다가 시끄러워지면 구간이 지난 뒤 소음 바닥이 따라 올라간다", () => {
    const meter = createLevelMeter();
    feed(meter, -50, 30);
    expect(meter.floorDb()).toBe(-50);

    feed(meter, -30, NOISE_WINDOW_MS / LEVEL_SAMPLE_MS + 1);

    expect(meter.floorDb()).toBe(-30);
  });

  it("순간적으로 큰 소리(버튼 소리, 말소리)는 소음 바닥을 올리지 못한다", () => {
    const meter = createLevelMeter();
    feed(meter, -50, 20);
    feed(meter, -20, 10);

    expect(meter.floorDb()).toBe(-50);
  });

  it("소음 바닥보다 여유(NOISE_MARGIN_DB)까지는 선이고 그 위부터 올라간다", () => {
    const meter = createLevelMeter();
    feed(meter, -50, 10);

    expect(meter.push(-50 + NOISE_MARGIN_DB)).toBe(0);
    expect(meter.push(-50 + NOISE_MARGIN_DB + 5)).toBeGreaterThan(0);
  });

  it("소음 바닥이 아주 높아도 파형의 폭은 남아 목소리가 위로 올라갈 수 있다", () => {
    const meter = createLevelMeter();
    feed(meter, -20, 50);

    expect(meter.push(-5)).toBeGreaterThan(0.5);
  });

  it("소음 바닥이 0dB 가까이 올라가도 값이 깨지지 않고 천장은 0dB를 넘지 않는다", () => {
    const meter = createLevelMeter();
    feed(meter, -3, 50);

    expect(meter.push(-3)).toBe(0);
    expect(Number.isFinite(meter.push(0))).toBe(true);
    expect(meter.push(0)).toBe(0);
  });

  it("값이 없거나 숫자가 아니면 0이고 소음 바닥을 바꾸지 않는다", () => {
    const meter = createLevelMeter();
    feed(meter, -45, 5);

    expect(meter.push(undefined)).toBe(0);
    expect(meter.push(Number.NaN)).toBe(0);
    expect(meter.push(-Infinity)).toBe(0);
    expect(meter.floorDb()).toBe(-45);
  });

  it("녹음을 막 시작할 때 들어오는 -160dB는 소음 바닥으로 보지 않는다", () => {
    const meter = createLevelMeter();
    feed(meter, -160, 3);
    feed(meter, -36, 20);

    expect(meter.floorDb()).toBe(-36);
    expect(meter.push(-36)).toBe(0);
    expect(meter.push(-10)).toBeGreaterThan(0.7);
  });

  it("녹음 시작 때 튀는 낮은 값 하나가 소음 바닥을 오래 붙잡지 않는다", () => {
    const meter = createLevelMeter();
    meter.push(-53);
    feed(meter, -37, 10);

    expect(meter.floorDb()).toBe(-37);
  });

  it("처음에는 기본 바닥(-50dB)을 쓰고 reset하면 처음으로 돌아간다", () => {
    const meter = createLevelMeter();
    expect(meter.floorDb()).toBe(LEVEL_FLOOR_DB);

    feed(meter, -30, 10);
    meter.reset();

    expect(meter.floorDb()).toBe(LEVEL_FLOOR_DB);
  });

  it("중간 크기는 지수(LEVEL_GAMMA)만큼 키워서 돌려준다", () => {
    const meter = createLevelMeter();
    feed(meter, -50, 20);
    const raw = levelFromDb(-30, -50 + NOISE_MARGIN_DB, LEVEL_CEIL_DB);

    expect(meter.push(-30)).toBeCloseTo(Math.pow(raw, LEVEL_GAMMA));
    expect(meter.push(-30)).toBeGreaterThan(raw);
  });

  it("천장은 소음 바닥이 낮을 때 기본 천장(-10dB)이다", () => {
    const meter = createLevelMeter();
    feed(meter, -55, 10);

    expect(meter.push(LEVEL_CEIL_DB)).toBe(1);
  });
});
