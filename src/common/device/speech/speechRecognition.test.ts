import { classifySpeechError, timingOf, transcriptOf, volumeToLevel } from "./speechRecognition";

describe("classifySpeechError", () => {
  it("말이 없거나 알아듣지 못하면 다시 말해 달라고 한다", () => {
    expect(classifySpeechError("no-speech")).toEqual({ kind: "no-speech" });
    expect(classifySpeechError("speech-timeout")).toEqual({ kind: "no-speech" });
  });

  it("권한이 없으면 권한 안내", () => {
    expect(classifySpeechError("not-allowed")).toEqual({ kind: "permission-denied" });
  });

  it("취소는 따로 구분한다", () => {
    expect(classifySpeechError("aborted")).toEqual({ kind: "aborted" });
  });

  it("서비스, 네트워크, 언어 문제는 녹음 업로드로 대체한다", () => {
    for (const code of ["network", "service-not-allowed", "language-not-supported", "audio-capture", "busy", "client", "unknown"]) {
      expect(classifySpeechError(code)).toEqual({ kind: "unavailable", reason: code });
    }
    expect(classifySpeechError("")).toEqual({ kind: "unavailable", reason: "unknown" });
  });
});

describe("transcriptOf", () => {
  it("첫 후보의 문장을 앞뒤 공백 없이 쓴다", () => {
    expect(
      transcriptOf({ isFinal: true, results: [{ transcript: " 강남역 가자 " }, { transcript: "강남 역 가자" }] })
    ).toBe("강남역 가자");
  });

  it("결과가 없으면 빈 문자열", () => {
    expect(transcriptOf({ isFinal: false, results: [] })).toBe("");
  });
});

describe("volumeToLevel", () => {
  it("-2~10 음량을 0~1로 바꾼다", () => {
    expect(volumeToLevel(-2)).toBe(0);
    expect(volumeToLevel(5)).toBe(0.5);
    expect(volumeToLevel(12)).toBe(1);
    expect(volumeToLevel(Number.NaN)).toBe(0);
  });
});

describe("timingOf", () => {
  it("시작과 말이 끝난 뒤부터의 시간을 잰다", () => {
    expect(timingOf(1_000, 3_000, 3_400)).toEqual({ totalMs: 2_400, afterSpeechMs: 400 });
  });

  it("소리 끝 이벤트가 없으면 afterSpeechMs는 null", () => {
    expect(timingOf(1_000, null, 2_000)).toEqual({ totalMs: 1_000, afterSpeechMs: null });
  });
});
