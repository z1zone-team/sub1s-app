import { SPLASH_MIN_MS, splashRemainingMs } from "./splashTiming";

describe("splashRemainingMs", () => {
  it("시작 직후에는 최소 표시 시간이 그대로 남는다", () => {
    expect(splashRemainingMs(1000, 1000)).toBe(SPLASH_MIN_MS);
  });

  it("지난 만큼 줄어든다", () => {
    expect(splashRemainingMs(1500, 1000, 1500)).toBe(1000);
  });

  it("최소 표시 시간이 지나면 0이다", () => {
    expect(splashRemainingMs(5000, 1000, 1500)).toBe(0);
  });
});
