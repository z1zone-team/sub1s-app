import { markNoticeSent, resetSentNotices } from "./useGuideNotices";

describe("markNoticeSent", () => {
  beforeEach(() => resetSentNotices());

  it("같은 안내의 같은 알림은 한 번만 true다", () => {
    expect(markNoticeSent("s1", "walk:0")).toBe(true);
    expect(markNoticeSent("s1", "walk:0")).toBe(false);
  });

  it("같은 안내라도 다른 알림은 따로 보낸다", () => {
    expect(markNoticeSent("s1", "walk:0")).toBe(true);
    expect(markNoticeSent("s1", "board:0")).toBe(true);
  });

  it("다른 안내가 시작되면 이전 안내의 기록은 지워져 같은 id도 다시 보낸다", () => {
    expect(markNoticeSent("s1", "walk:0")).toBe(true);
    expect(markNoticeSent("s2", "walk:0")).toBe(true);
    expect(markNoticeSent("s1", "walk:0")).toBe(true);
  });
});
