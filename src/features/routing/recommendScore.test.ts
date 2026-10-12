import type { RecommendationMeta, RouteMode, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import {
  BASE_FACTOR_WEIGHTS,
  factorWeights,
  pickRecommended,
  scoreOptions,
} from "./recommendScore";

const ride = (durationSec: number, congestionRate: number) => ({
  lineId: "02",
  durationSec,
  congestionRate,
});

const option = (
  mode: RouteMode,
  fields: { time: number; fare: number; transfers: number; crowd: number; walk?: number }
): SubwayRouteOptionDto =>
  ({
    mode,
    totalDurationSec: fields.time,
    totalFare: fields.fare,
    transferCount: fields.transfers,
    totalWalkDurationSec: fields.walk ?? 0,
    segments: [ride(fields.time, fields.crowd)],
    highlights: [],
  }) as unknown as SubwayRouteOptionDto;

const meta = (patch: Partial<RecommendationMeta> = {}): RecommendationMeta => ({
  context: "WEEKDAY_MIDDAY",
  reasons: [],
  usedHistory: false,
  fareSensitive: false,
  weights: { congestion: 1.5, transferSec: 240 },
  ...patch,
});

// 서울역 → 잠실 같은 구간: 빠르지만 붐비는 후보, 느리지만 한산한 후보, 싸지만 환승이 많은 후보
const fast = option("OPTIMAL", { time: 1440, fare: 1750, transfers: 1, crowd: 80 });
const calm = option("COMFORTABLE", { time: 1680, fare: 1750, transfers: 1, crowd: 40 });
const cheap = option("CHEAPEST", { time: 1500, fare: 1550, transfers: 3, crowd: 70 });

describe("factorWeights", () => {
  it("서버 근거가 없으면 기본 가중치다", () => {
    expect(factorWeights(undefined)).toEqual(BASE_FACTOR_WEIGHTS);
    expect(factorWeights(meta())).toEqual(BASE_FACTOR_WEIGHTS);
  });

  it("근거 코드마다 해당 항목의 가중치를 곱한다", () => {
    const weights = factorWeights(meta({ reasons: ["PREF_UNCROWDED", "CONTEXT_RUSH"] }));

    expect(weights.crowd).toBeCloseTo(0.4 * 1.8 * 1.3);
    expect(weights.time).toBe(1.0);
  });

  it("심야는 혼잡을 덜 따진다", () => {
    expect(factorWeights(meta({ reasons: ["CONTEXT_NIGHT"] })).crowd).toBeCloseTo(0.2);
  });

  it("요금 민감이면 요금 가중치를 2.5배로 한다", () => {
    expect(factorWeights(meta({ fareSensitive: true })).fare).toBeCloseTo(0.75);
  });

  it("알 수 없는 코드는 무시한다", () => {
    expect(factorWeights(meta({ reasons: ["SOMETHING_NEW"] }))).toEqual(BASE_FACTOR_WEIGHTS);
  });
});

describe("scoreOptions", () => {
  it("항목마다 후보 사이에서 0(좋음)~1(나쁨)로 맞춘다", () => {
    const scored = scoreOptions([fast, calm, cheap], BASE_FACTOR_WEIGHTS);
    const byMode = (mode: RouteMode) => scored.find((item) => item.option.mode === mode)!;

    expect(byMode("OPTIMAL").parts.time).toBe(0);
    expect(byMode("COMFORTABLE").parts.time).toBe(1);
    expect(byMode("CHEAPEST").parts.fare).toBe(0);
    expect(byMode("COMFORTABLE").parts.crowd).toBe(0);
    expect(byMode("OPTIMAL").parts.crowd).toBe(1);
    expect(byMode("CHEAPEST").parts.transfers).toBe(1);
  });

  it("후보들이 같은 값이면 그 항목은 점수에 영향이 없다", () => {
    const scored = scoreOptions([fast, calm], BASE_FACTOR_WEIGHTS);

    expect(scored.every((item) => item.parts.fare === 0)).toBe(true);
    expect(scored.every((item) => item.parts.transfers === 0)).toBe(true);
  });

  it("도보만 가는 후보는 점수를 매기지 않는다", () => {
    const walkOnly = { ...fast, mode: "ONLY_WALK" } as SubwayRouteOptionDto;

    expect(scoreOptions([walkOnly, calm], BASE_FACTOR_WEIGHTS)).toHaveLength(1);
    expect(scoreOptions([walkOnly], BASE_FACTOR_WEIGHTS)).toEqual([]);
  });

  it("후보가 하나뿐이면 점수는 0이다", () => {
    expect(scoreOptions([fast], BASE_FACTOR_WEIGHTS)[0].score).toBe(0);
  });

  it("도보 시간이 응답에 없으면 전체 시간에서 탑승 시간을 뺀다", () => {
    const withWalk = {
      ...fast,
      totalWalkDurationSec: undefined,
      totalDurationSec: 1740,
    } as unknown as SubwayRouteOptionDto;
    const scored = scoreOptions([withWalk, calm], BASE_FACTOR_WEIGHTS);

    // fast의 탑승 시간은 1440초라 도보는 300초, calm은 0초
    expect(scored[0].parts.walk).toBe(1);
    expect(scored[1].parts.walk).toBe(0);
  });
});

describe("pickRecommended", () => {
  const pick = (weights: ReturnType<typeof factorWeights>) =>
    pickRecommended(scoreOptions([fast, calm, cheap], weights))?.option.mode;

  it("기본 가중치에서는 시간이 가장 좋은 후보가 고른다", () => {
    expect(pick(BASE_FACTOR_WEIGHTS)).toBe("OPTIMAL");
  });

  it("덜 붐비게를 원하고 혼잡한 시간대이며 이력도 여유를 골랐다면 한산한 후보를 고른다", () => {
    const weights = factorWeights(meta({ reasons: ["PREF_UNCROWDED", "PREF_WEAK_AC", "CONTEXT_RUSH", "HISTORY_COMFORT"] }));

    expect(pick(weights)).toBe("COMFORTABLE");
  });

  it("덜 붐비게만으로는 시간 차이가 클 때 빠른 후보가 이길 수 있다(시간의 가중치가 가장 크다)", () => {
    expect(pick(factorWeights(meta({ reasons: ["PREF_UNCROWDED"] })))).toBe("OPTIMAL");
  });

  it("요금을 자주 아꼈으면 요금이 낮은 후보에 유리하다", () => {
    const base = scoreOptions([fast, calm, cheap], BASE_FACTOR_WEIGHTS);
    const sensitive = scoreOptions([fast, calm, cheap], factorWeights(meta({ fareSensitive: true })));
    const cheapScore = (list: typeof base) => list.find((item) => item.option.mode === "CHEAPEST")!.score;
    const fastScore = (list: typeof base) => list.find((item) => item.option.mode === "OPTIMAL")!.score;

    // 요금 가중치가 커질수록 최소 비용 후보가 최적 후보보다 상대적으로 좋아진다
    expect(cheapScore(sensitive) - fastScore(sensitive)).toBeLessThan(cheapScore(base) - fastScore(base));
  });

  it("점수가 같으면 서버가 개인화한 추천 후보를 고른다", () => {
    const a = option("OPTIMAL", { time: 1500, fare: 1750, transfers: 1, crowd: 50 });
    const b = option("PERSONAL", { time: 1500, fare: 1750, transfers: 1, crowd: 50 });

    expect(pickRecommended(scoreOptions([a, b], BASE_FACTOR_WEIGHTS))?.option.mode).toBe("PERSONAL");
  });

  it("후보가 없으면 없다", () => {
    expect(pickRecommended([])).toBeUndefined();
  });
});

describe("체감하기 어려운 작은 차이", () => {
  // 서울역 → 잠실에서 본 실제 사례: 최소 비용 경로가 48초 빠르지만 환승이 1회 많고 더 붐빈다
  const cheapFast = option("CHEAPEST", { time: 1416, fare: 1750, transfers: 2, crowd: 47 });
  const steady = option("OPTIMAL", { time: 1464, fare: 1750, transfers: 1, crowd: 32 });

  it("3분보다 작은 시간 차이는 환승과 혼잡의 큰 차이를 뒤집지 못한다", () => {
    const weights = factorWeights(meta({ reasons: ["PREF_FAST", "CONTEXT_RUSH"] }));

    expect(pickRecommended(scoreOptions([cheapFast, steady], weights))?.option.mode).toBe("OPTIMAL");
  });

  it("작은 차이는 기준 대비 비율만큼만 점수 차이로 반영한다", () => {
    const scored = scoreOptions([cheapFast, steady], BASE_FACTOR_WEIGHTS);
    const slow = scored.find((item) => item.option.mode === "OPTIMAL")!;

    // 48초는 기준 180초의 약 0.27
    expect(slow.parts.time).toBeCloseTo(48 / 180);
  });

  it("차이가 기준보다 크면 지금처럼 0~1로 맞춘다", () => {
    const slowTrip = option("COMFORTABLE", { time: 1980, fare: 1750, transfers: 1, crowd: 32 });
    const scored = scoreOptions([cheapFast, slowTrip], BASE_FACTOR_WEIGHTS);

    expect(scored.find((item) => item.option.mode === "COMFORTABLE")!.parts.time).toBe(1);
  });
});
