import { arrivalDeltaText, minutesLabel, remainingText, upcomingMessage } from "./guideText";

describe("upcomingMessage", () => {
  it("바로 다음 역에서 내리면 내릴 준비를 안내한다", () => {
    expect(upcomingMessage({ kind: "ALIGHT", index: 5, stopsAway: 1 }, "신논현")).toBe(
      "다음 역 신논현, 내릴 준비하세요"
    );
  });

  it("멀면 남은 역 수를 알려 준다", () => {
    expect(upcomingMessage({ kind: "ALIGHT", index: 5, stopsAway: 3 }, "신논현")).toBe(
      "신논현에서 내려요 · 3개 역 남음"
    );
    expect(upcomingMessage({ kind: "TRANSFER", index: 2, stopsAway: 2 }, "당산")).toBe(
      "당산에서 갈아타요 · 2개 역 남음"
    );
  });

  it("바로 다음 역에서 갈아타면 갈아타라고 안내한다", () => {
    expect(upcomingMessage({ kind: "TRANSFER", index: 2, stopsAway: 1 }, "당산")).toBe(
      "다음 역 당산에서 갈아타세요"
    );
  });

  it("할 일이 없으면 빈 문구다", () => {
    expect(upcomingMessage(null, "")).toBe("");
  });
});

describe("remainingText", () => {
  it("남은 시간과 한국 시간 도착 시각을 보여 준다", () => {
    // 2026-10-11T05:20:00Z = 한국 시간 14:20
    const now = Date.parse("2026-10-11T05:20:00Z");
    expect(remainingText(31 * 60, now)).toBe("31분 남음 · 오후 2:51 도착");
  });

  it("다 지나면 곧 도착한다고 한다", () => {
    expect(remainingText(0, 0)).toBe("곧 도착해요");
  });
});

describe("arrivalDeltaText", () => {
  it("일찍과 늦게를 구분한다", () => {
    expect(arrivalDeltaText(-60)).toBe("1분 일찍 도착");
    expect(arrivalDeltaText(300)).toBe("5분 늦게 도착");
  });

  it("30초 안이면 예정대로라고 한다", () => {
    expect(arrivalDeltaText(20)).toBe("예정대로 도착");
    expect(arrivalDeltaText(-29)).toBe("예정대로 도착");
  });

  it("값이 없으면 빈 문구다", () => {
    expect(arrivalDeltaText(undefined)).toBe("");
  });
});

describe("minutesLabel", () => {
  it("분으로 반올림하고 1분 미만도 1분으로 보여 준다", () => {
    expect(minutesLabel(31 * 60)).toBe("31분");
    expect(minutesLabel(20)).toBe("1분");
    expect(minutesLabel(0)).toBe("1분");
  });
});
