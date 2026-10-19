/** 이 크기(0~1, 소음에 맞춘 파형 크기) 이상이면 말소리로 본다 */
export const SPEECH_LEVEL = 0.25;
/** 말소리가 이만큼(ms) 이어져야 말이 시작된 것으로 본다. 버튼을 누를 때 나는 소리 같은 순간 소리를 거른다 */
export const MIN_SPEECH_RUN_MS = 300;
/** 말이 시작되기를 기다리는 시간(ms). 이 시간까지 말이 없으면 끝낸다 */
export const INITIAL_WAIT_MS = 5000;
/** 말이 시작된 뒤 이만큼(ms) 조용하면 말이 끝난 것으로 보고 끝낸다 */
export const SILENCE_STOP_MS = 1000;

export interface SilenceStopOptions {
  speechLevel?: number;
  minSpeechRunMs?: number;
  initialWaitMs?: number;
  silenceMs?: number;
}

export interface SilenceStop {
  /** 녹음을 시작하고 elapsedMs가 지난 시점의 입력 크기(0~1)를 넣는다. 지금 녹음을 끝내야 하면 true */
  push(level: number, elapsedMs: number): boolean;
  /** 말이 한 번이라도 시작됐는지 */
  heardSpeech(): boolean;
  reset(): void;
}

/**
 * 녹음 중 입력 크기를 보고 언제 끝낼지 정한다. 말이 시작되기 전에는 INITIAL_WAIT_MS까지 길게 기다리고,
 * 말이 시작된 뒤에는 SILENCE_STOP_MS 동안 조용하면 끝낸다. 말 사이의 짧은 쉼은 마지막 말소리 시각이 계속 갱신되어 넘어간다
 */
export function createSilenceStop(options: SilenceStopOptions = {}): SilenceStop {
  const speechLevel = options.speechLevel ?? SPEECH_LEVEL;
  const minRunMs = options.minSpeechRunMs ?? MIN_SPEECH_RUN_MS;
  const initialWaitMs = options.initialWaitMs ?? INITIAL_WAIT_MS;
  const silenceMs = options.silenceMs ?? SILENCE_STOP_MS;

  let runStartedAt: number | null = null;
  let lastLoudAt: number | null = null;
  let heard = false;

  return {
    push(level, elapsedMs) {
      const loud = Number.isFinite(level) && level >= speechLevel;
      if (loud) {
        if (runStartedAt === null) runStartedAt = elapsedMs;
        if (!heard && elapsedMs - runStartedAt >= minRunMs) heard = true;
        if (heard) lastLoudAt = elapsedMs;
      } else {
        runStartedAt = null;
      }

      if (!heard) return elapsedMs >= initialWaitMs;
      return lastLoudAt !== null && elapsedMs - lastLoudAt >= silenceMs;
    },
    heardSpeech: () => heard,
    reset() {
      runStartedAt = null;
      lastLoudAt = null;
      heard = false;
    },
  };
}
