import { createSpeechDetector, SPEECH_HOLD_MS, SPEECH_THRESHOLD_DB } from "./speechLevel";

describe("createSpeechDetector", () => {
  it("처음에는 말하는 중이 아니다", () => {
    const detector = createSpeechDetector();

    expect(detector.update(undefined, 0)).toBe(false);
  });

  it("녹음을 시작하며 버튼을 누를 때의 순간 소리(-33dB)는 말소리로 보지 않는다", () => {
    const detector = createSpeechDetector();

    expect(detector.update(-33, 0)).toBe(false);
  });

  it("조용한 방의 소리(-50dB)는 말소리로 보지 않는다", () => {
    const detector = createSpeechDetector();

    for (let t = 0; t < 2000; t += 100) {
      expect(detector.update(-50, t)).toBe(false);
    }
  });

  it("무음(-160dB)도 말소리가 아니다", () => {
    const detector = createSpeechDetector();

    expect(detector.update(-160, 0)).toBe(false);
  });

  it("임계값 이상이면 말하는 중이다", () => {
    const detector = createSpeechDetector();

    expect(detector.update(-12, 0)).toBe(true);
    expect(detector.update(SPEECH_THRESHOLD_DB, 100)).toBe(true);
  });

  it("임계값 바로 아래는 말소리가 아니다", () => {
    const detector = createSpeechDetector();

    expect(detector.update(SPEECH_THRESHOLD_DB - 0.1, 0)).toBe(false);
  });

  it("말 사이의 짧은 쉼에서는 계속 말하는 중으로 본다", () => {
    const detector = createSpeechDetector();
    detector.update(-25, 0);

    expect(detector.update(-60, 100)).toBe(true);
    expect(detector.update(-60, SPEECH_HOLD_MS)).toBe(true);
  });

  it("쉼이 유지 시간을 넘으면 말하는 중이 아니게 된다", () => {
    const detector = createSpeechDetector();
    detector.update(-25, 0);

    expect(detector.update(-60, SPEECH_HOLD_MS + 1)).toBe(false);
  });

  it("다시 소리가 들어오면 유지 시간이 새로 시작된다", () => {
    const detector = createSpeechDetector();
    detector.update(-25, 0);
    detector.update(-25, 400);

    expect(detector.update(-60, 800)).toBe(true);
    expect(detector.update(-60, 400 + SPEECH_HOLD_MS + 1)).toBe(false);
  });

  it("값이 없거나 숫자가 아니면 조용한 것으로 본다(유지 시간은 따른다)", () => {
    const detector = createSpeechDetector();
    detector.update(-25, 0);

    expect(detector.update(undefined, 100)).toBe(true);
    expect(detector.update(Number.NaN, SPEECH_HOLD_MS + 1)).toBe(false);
    expect(detector.update(-Infinity, SPEECH_HOLD_MS + 2)).toBe(false);
  });

  it("reset하면 바로 조용해진다", () => {
    const detector = createSpeechDetector();
    detector.update(-25, 0);

    detector.reset();

    expect(detector.update(-60, 50)).toBe(false);
  });

  it("임계값과 유지 시간을 바꿀 수 있다", () => {
    const detector = createSpeechDetector(-20, 100);

    expect(detector.update(-30, 0)).toBe(false);
    expect(detector.update(-10, 10)).toBe(true);
    expect(detector.update(-60, 111)).toBe(false);
  });
});
