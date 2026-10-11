import { remainingText, upcomingMessage } from "./guideText";

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
