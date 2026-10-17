/**
 * 마이크 입력 크기(dB, 0이 최대)를 파형 높이(0~1)로 바꿀 때의 범위. 이 값 이하는 0, 이상은 1이다.
 * Android는 최근 100ms의 최대 진폭을 dBFS(20 log10(진폭 / 32767))로 준다. 실기기(SM-G981N)에서 측정한 값은
 * 조용한 방 -45 ~ -55dB, 녹음을 시작하며 버튼을 누를 때 순간 -33dB, 말소리 -5 ~ -25dB(드물게 -30 ~ -40)였다
 */
export const LEVEL_FLOOR_DB = -50;
export const LEVEL_CEIL_DB = -10;
/** 마이크 입력 크기를 읽는 간격 */
export const LEVEL_SAMPLE_MS = 100;

/** 입력 크기(dB)를 0~1로 바꾼다. 값이 없거나 숫자가 아니면 조용한 것(0)으로 본다 */
export function levelFromDb(
  db: number | undefined,
  floorDb: number = LEVEL_FLOOR_DB,
  ceilDb: number = LEVEL_CEIL_DB
): number {
  if (typeof db !== "number" || !Number.isFinite(db)) return 0;
  if (ceilDb <= floorDb) return db > floorDb ? 1 : 0;
  const level = (db - floorDb) / (ceilDb - floorDb);
  return Math.min(1, Math.max(0, level));
}

/** 소음 바닥을 찾는 구간. 이 시간 동안 입력을 낮은 순으로 세워 아래에서 NOISE_PERCENTILE 위치의 값을 주변 소음으로 본다 */
export const NOISE_WINDOW_MS = 5000;
/** 최솟값은 녹음 시작 때의 튀는 값 하나에 휘둘리므로 아래에서 20% 위치의 값을 쓴다. 말이 구간의 80%를 넘지 않으면 말소리가 바닥을 올리지 못한다 */
export const NOISE_PERCENTILE = 0.2;
/** 소음 바닥보다 이만큼(dB) 위까지는 소음의 흔들림으로 보고 선으로 둔다 */
export const NOISE_MARGIN_DB = 8;
/** 소음 바닥이 올라가도 파형이 이만큼(dB)의 폭은 남도록 천장을 소음 바닥 위로 맞춘다. 천장은 0dB(최대 진폭)를 넘지 않는다 */
export const MIN_SPAN_DB = 20;
const MAX_DB = 0;
/** 작은 소리도 눈에 띄게 하려고 0~1 크기에 곱하는 지수. 1보다 작으면 중간 크기가 커진다(0.5가 약 0.66이 된다) */
export const LEVEL_GAMMA = 0.6;
/** 이보다 낮은 값은 소리가 아니라 아직 신호가 없는 것(녹음을 막 시작하면 -160dB가 몇 번 들어온다)이라 소음 바닥에 넣지 않는다 */
export const MIN_VALID_DB = -80;

export interface LevelMeter {
  /** 지금 입력 크기(dB)를 넣고 주변 소음에 맞춘 0~1 크기를 돌려준다. 값이 없거나 숫자가 아니거나 신호가 없으면(-80dB 미만) 0 */
  push(db: number | undefined): number;
  /** 지금 추정한 소음 바닥(dB) */
  floorDb(): number;
  reset(): void;
}

/**
 * 파형 크기를 주변 소음에 맞춰 자동으로 조절한다. 녹음에 보내는 오디오는 바꾸지 않고 화면의 기준만 바꾼다.
 * 최근 NOISE_WINDOW_MS 동안 입력의 아래쪽(NOISE_PERCENTILE)을 소음 바닥으로 보므로, 말이나 버튼 소리 같은 순간적인 소리는 바닥을 올리지 못하고
 * 지하철처럼 계속 시끄러운 곳에서는 바닥이 따라 올라가 소음은 선으로, 목소리는 파형으로 보인다
 */
export function createLevelMeter(
  windowMs: number = NOISE_WINDOW_MS,
  sampleMs: number = LEVEL_SAMPLE_MS,
  marginDb: number = NOISE_MARGIN_DB
): LevelMeter {
  const capacity = Math.max(1, Math.round(windowMs / sampleMs));
  let recent: number[] = [];

  const floorDb = () => {
    if (recent.length === 0) return LEVEL_FLOOR_DB;
    const sorted = [...recent].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * NOISE_PERCENTILE))];
  };

  return {
    push(db) {
      if (typeof db !== "number" || !Number.isFinite(db) || db < MIN_VALID_DB) return 0;
      recent = [...recent, db].slice(-capacity);
      const floor = floorDb() + marginDb;
      const level = levelFromDb(db, floor, Math.min(MAX_DB, Math.max(LEVEL_CEIL_DB, floor + MIN_SPAN_DB)));
      return Math.pow(level, LEVEL_GAMMA);
    },
    floorDb,
    reset() {
      recent = [];
    },
  };
}
