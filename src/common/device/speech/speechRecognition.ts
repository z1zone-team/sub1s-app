/**
 * 기기 음성 인식(`expo-speech-recognition`)의 결과와 오류를 음성 화면이 쓰는 꼴로 바꾸는 순수 함수.
 * 네이티브 모듈 없이 시험할 수 있게 훅(useSpeechRecognizer)과 나눴다
 */

/** 인식이 끝났을 때 화면이 할 일 */
export type SpeechOutcome =
  | { kind: "text"; transcript: string; timing: SpeechTiming }
  /** 말이 없거나 알아듣지 못함. 지금처럼 "다시 말씀해 주세요" */
  | { kind: "no-speech" }
  /** 마이크나 음성 인식 권한이 없음 */
  | { kind: "permission-denied" }
  /** 기기 인식을 쓸 수 없음(서비스 없음, 네트워크, 언어 미지원 등). 녹음 파일을 올리는 방식으로 다시 한다 */
  | { kind: "unavailable"; reason: string }
  /** 화면을 닫거나 사용자가 취소함 */
  | { kind: "aborted" };

export interface SpeechTiming {
  /** 듣기 시작부터 마지막 결과까지(ms) */
  totalMs: number;
  /** 말이 끝난 뒤(소리 끝 이벤트) 마지막 결과가 나오기까지(ms). 이벤트가 없으면 null */
  afterSpeechMs: number | null;
}

/** 라이브러리 오류 코드(ExpoSpeechRecognitionErrorCode)를 화면이 할 일로 나눈다 */
export function classifySpeechError(code: string): Exclude<SpeechOutcome, { kind: "text" }> {
  switch (code) {
    case "no-speech":
    case "speech-timeout":
    case "nomatch":
      return { kind: "no-speech" };
    case "not-allowed":
      return { kind: "permission-denied" };
    case "aborted":
      return { kind: "aborted" };
    default:
      // network, service-not-allowed, language-not-supported, audio-capture, busy, client, unknown ...
      return { kind: "unavailable", reason: code || "unknown" };
  }
}

interface ResultLike {
  isFinal: boolean;
  results: { transcript: string; confidence?: number }[];
}

/** 결과 이벤트에서 화면에 보일 문장을 고른다. 첫 후보가 가장 그럴듯한 것이다 */
export function transcriptOf(event: ResultLike): string {
  return (event.results[0]?.transcript ?? "").trim();
}

/**
 * 라이브러리 음량(대략 -2~10, 말하지 않으면 0 아래)을 물결 표시용 0~1로 바꾼다.
 * 녹음 방식의 `level`과 같은 범위를 쓴다
 */
export function volumeToLevel(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value / 10));
}

/** 시작, 소리 끝, 마지막 결과 시각(ms)으로 걸린 시간을 만든다 */
export function timingOf(startedAt: number, speechEndedAt: number | null, finishedAt: number): SpeechTiming {
  return {
    totalMs: Math.max(0, finishedAt - startedAt),
    afterSpeechMs: speechEndedAt === null ? null : Math.max(0, finishedAt - speechEndedAt),
  };
}
