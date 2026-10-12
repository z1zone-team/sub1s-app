import { pickTrackStops, trackFill } from "./progressTrack";

describe("pickTrackStops", () => {
  it("역이 6개 이하면 전부 보여 준다", () => {
    expect(pickTrackStops(6, 1)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(pickTrackStops(3, 0)).toEqual([0, 1, 2]);
  });

  it("많으면 처음, 지금, 다음, 마지막을 넣고 6개로 줄인다", () => {
    const picked = pickTrackStops(30, 10);
    expect(picked).toHaveLength(6);
    expect(picked).toEqual(expect.arrayContaining([0, 10, 11, 29]));
    expect([...picked].sort((a, b) => a - b)).toEqual(picked);
  });

  it("지금이 마지막 역이어도 6개를 넘지 않는다", () => {
    const picked = pickTrackStops(30, 29);
    expect(picked.length).toBeLessThanOrEqual(6);
    expect(picked).toContain(29);
    expect(picked).toContain(0);
  });

  it("역이 없으면 빈 목록이다", () => {
    expect(pickTrackStops(0, 0)).toEqual([]);
  });
});

describe("trackFill", () => {
  it("처음이면 0, 마지막이면 1이다", () => {
    expect(trackFill([0, 1, 2, 3, 4, 5], 0)).toBe(0);
    expect(trackFill([0, 1, 2, 3, 4, 5], 5)).toBe(1);
  });

  it("점에 있으면 그 점의 위치까지 채운다", () => {
    expect(trackFill([0, 1, 2, 3, 4, 5], 1)).toBeCloseTo(0.2);
  });

  it("두 점 사이면 순번 차이만큼 보간한다", () => {
    // 점이 0, 10, 20이고 지금 5번째면 첫 구간의 절반
    expect(trackFill([0, 10, 20], 5)).toBeCloseTo(0.25);
  });

  it("점이 하나뿐이면 0이다", () => {
    expect(trackFill([0], 0)).toBe(0);
  });
});
