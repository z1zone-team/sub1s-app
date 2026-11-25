import type { RecommendationMeta, SubwayRouteOptionDto } from "@/apis/queries/routing/searchRoutes";
import { WALK_LINE_ID } from "@/theme";

/** 점수 항목. 값이 작을수록 좋다 */
export type ScoreFactor = "time" | "fare" | "transfers" | "crowd" | "walk";

export type FactorWeights = Record<ScoreFactor, number>;

/** 서버 근거 코드가 없을 때의 기본 가중치 */
export const BASE_FACTOR_WEIGHTS: FactorWeights = {
  time: 1.0,
  fare: 0.3,
  transfers: 0.4,
  crowd: 0.4,
  walk: 0.2,
};

/** 서버 `recommendation.reasons` 코드마다 곱하는 배수 */
const REASON_MULTIPLIERS: Record<string, Partial<FactorWeights>> = {
  PREF_FAST: { time: 1.5 },
  PREF_FEW_TRANSFERS: { transfers: 1.8 },
  PREF_UNCROWDED: { crowd: 1.8 },
  // 좌석 자료가 없어 서버는 앉아서 가기를 덜 붐비는 경로로 근사한다
  PREF_SEAT: { crowd: 1.8 },
  PREF_WEAK_AC: { crowd: 1.8 },
  PREF_LESS_WALK: { walk: 2.0 },
  CONTEXT_RUSH: { crowd: 1.3 },
  CONTEXT_NIGHT: { crowd: 0.5 },
  HISTORY_COMFORT: { crowd: 1.3 },
  HISTORY_FAST: { time: 1.3 },
};

/** 요금을 자주 아낀 사용자는 요금 가중치를 이만큼 곱한다 */
const FARE_SENSITIVE_MULTIPLIER = 2.5;

/** 서버가 준 근거(설문, 이동 목적, 시간대, 이력)로 가중치를 만든다. 메타가 없으면 기본값이다 */
export function factorWeights(meta: RecommendationMeta | undefined): FactorWeights {
  const weights = { ...BASE_FACTOR_WEIGHTS };
  if (!meta) return weights;
  for (const reason of meta.reasons) {
    // 서버가 두 취향을 혼잡 하나로 합치므로 함께 있으면 한 번만 곱한다
    if (reason === "PREF_SEAT" && meta.reasons.includes("PREF_UNCROWDED")) continue;
    const multipliers = REASON_MULTIPLIERS[reason];
    if (!multipliers) continue;
    for (const [factor, multiplier] of Object.entries(multipliers) as Array<[ScoreFactor, number]>) {
      weights[factor] *= multiplier;
    }
  }
  if (meta.fareSensitive) weights.fare *= FARE_SENSITIVE_MULTIPLIER;
  return weights;
}

/** 탑승 구간 평균 혼잡도(0~100)를 소요 시간으로 가중 평균한다. 탑승 구간이 없으면 0 */
function crowdRate(option: SubwayRouteOptionDto): number {
  const rides = option.segments.filter((segment) => segment.lineId !== WALK_LINE_ID);
  if (rides.length === 0) return 0;
  const weight = rides.reduce((sum, segment) => sum + Math.max(0, segment.durationSec), 0);
  if (weight === 0) return rides.reduce((sum, segment) => sum + segment.congestionRate, 0) / rides.length;
  return rides.reduce((sum, segment) => sum + segment.congestionRate * Math.max(0, segment.durationSec), 0) / weight;
}

/** 출발·도착 도보와 환승 도보를 합친 시간(초). 전체 시간에서 탑승 시간을 뺀 값 */
function walkSec(option: SubwayRouteOptionDto): number {
  if (option.totalWalkDurationSec !== undefined) return option.totalWalkDurationSec;
  const ride = option.segments
    .filter((segment) => segment.lineId !== WALK_LINE_ID)
    .reduce((sum, segment) => sum + segment.durationSec, 0);
  return Math.max(0, option.totalDurationSec - ride);
}

const RAW: Record<ScoreFactor, (option: SubwayRouteOptionDto) => number> = {
  time: (option) => option.totalDurationSec,
  fare: (option) => option.totalFare,
  transfers: (option) => option.transferCount,
  crowd: crowdRate,
  walk: walkSec,
};

/**
 * 항목마다 "사용자가 체감하는 최소 차이". 후보들의 최댓값과 최솟값 차이가 이보다 작으면 같은 값으로 본다.
 * 이게 없으면 24분과 24.8분 같은 작은 차이가 "가장 빠름 대 가장 느림"으로 부풀려져 추천이 엉뚱해진다
 */
export const MIN_MEANINGFUL_SPAN: Record<ScoreFactor, number> = {
  time: 180, // 3분
  fare: 200, // 200원
  transfers: 1, // 환승 1회
  crowd: 10, // 혼잡도 10%p
  walk: 180, // 3분
};

/**
 * 후보들 사이에서 최솟값을 0, 최댓값을 1로 맞춘다. 차이가 없거나 체감할 만큼 크지 않으면 모두 0이다.
 * 차이가 체감 기준보다 작아도 클 때는 기준 대비 비율만큼만 벌려(예: 기준의 절반이면 최대 0.5) 부풀리지 않는다
 */
function normalize(values: number[], minSpan: number): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  if (span < 1e-9) return values.map(() => 0);
  const scale = Math.max(span, minSpan);
  return values.map((value) => (value - min) / scale);
}

export interface ScoredOption {
  option: SubwayRouteOptionDto;
  /** 가중합. 낮을수록 좋다 */
  score: number;
  /** 항목별 정규화 값(0 좋음, 1 나쁨) */
  parts: Record<ScoreFactor, number>;
}

/**
 * 후보 경로마다 시간, 요금, 환승, 혼잡, 도보를 후보들 사이에서 0~1로 맞춘 값(차이가 작으면 그 비율만큼만)의 가중합을 구한다.
 * 도보만 가는 후보(`ONLY_WALK`)는 지하철 경로와 비교할 수 없어 점수를 매기지 않는다
 */
export function scoreOptions(options: SubwayRouteOptionDto[], weights: FactorWeights): ScoredOption[] {
  const comparable = options.filter((option) => option.mode !== "ONLY_WALK");
  if (comparable.length === 0) return [];

  const factors = Object.keys(RAW) as ScoreFactor[];
  const normalized = Object.fromEntries(
    factors.map((factor) => [factor, normalize(comparable.map((option) => RAW[factor](option)), MIN_MEANINGFUL_SPAN[factor])])
  ) as Record<ScoreFactor, number[]>;

  return comparable.map((option, index) => {
    const parts = Object.fromEntries(factors.map((factor) => [factor, normalized[factor][index]])) as Record<
      ScoreFactor,
      number
    >;
    const score = factors.reduce((sum, factor) => sum + weights[factor] * parts[factor], 0);
    return { option, score, parts };
  });
}

/**
 * 최고점(점수가 가장 낮은) 후보. 점수가 같으면 서버가 개인화해서 준 추천(`PERSONAL`)을 먼저,
 * 그다음 소요 시간이 짧은 후보를 고른다
 */
export function pickRecommended(scored: ScoredOption[]): ScoredOption | undefined {
  if (scored.length === 0) return undefined;
  return [...scored].sort((a, b) => {
    if (Math.abs(a.score - b.score) > 1e-9) return a.score - b.score;
    const personal = Number(b.option.mode === "PERSONAL") - Number(a.option.mode === "PERSONAL");
    if (personal !== 0) return personal;
    return a.option.totalDurationSec - b.option.totalDurationSec;
  })[0];
}
