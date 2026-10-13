/**
 * 마이크 입력 크기(dB, 0이 최대)가 이 값 이상이면 말소리가 들어온 것으로 본다.
 * Android는 최근 100ms의 최대 진폭을 dBFS(20 log10(진폭 / 32767))로 준다. 실기기(SM-G981N)에서 측정한 값은
 * 조용한 방 -45 ~ -55dB, 녹음을 시작하며 버튼을 누를 때 순간 -33dB, 말소리 -5 ~ -25dB(드물게 -30 ~ -40)였다.
 * 그래서 터치 소리는 거르고 말소리는 놓치지 않는 -30dB로 둔다. 말 사이의 짧은 쉼은 아래 유지 시간이 메운다
 */
export const SPEECH_THRESHOLD_DB = -30;
/** 소리가 한 번 들어온 뒤 이 시간 동안은 말하는 중으로 본다. 말 사이의 짧은 쉼에서 파형이 깜빡이지 않게 한다 */
export const SPEECH_HOLD_MS = 450;
/** 마이크 입력 크기를 읽는 간격 */
export const SPEECH_SAMPLE_MS = 100;

export interface SpeechDetector {
  /** 지금 입력 크기를 넣고 말하는 중인지 돌려준다. 값이 없거나 숫자가 아니면 조용한 것으로 본다 */
  update(metering: number | undefined, nowMs: number): boolean;
  reset(): void;
}

export function createSpeechDetector(thresholdDb: number = SPEECH_THRESHOLD_DB, holdMs: number = SPEECH_HOLD_MS): SpeechDetector {
  let lastLoudAt: number | null = null;

  return {
    update(metering, nowMs) {
      if (typeof metering === "number" && Number.isFinite(metering) && metering >= thresholdDb) {
        lastLoudAt = nowMs;
      }
      return lastLoudAt !== null && nowMs - lastLoudAt <= holdMs;
    },
    reset() {
      lastLoudAt = null;
    },
  };
}
