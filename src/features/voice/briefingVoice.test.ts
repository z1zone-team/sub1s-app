import { canSpeakBriefing } from "./briefingVoice";

describe("canSpeakBriefing", () => {
  it("문장이 있으면 읽을 수 있다", () => {
    expect(canSpeakBriefing({ briefingText: "안내합니다" })).toBe(true);
  });

  it("문장이 비어 있으면 읽을 수 없다", () => {
    expect(canSpeakBriefing({ briefingText: "  " })).toBe(false);
  });
});
