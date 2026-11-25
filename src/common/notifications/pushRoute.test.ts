import { isEasProjectId, pushTargetOf } from "./pushRoute";

describe("isEasProjectId", () => {
  it("UUID만 프로젝트 ID로 본다", () => {
    expect(isEasProjectId("0c6d4a3e-1b2f-4c8a-9d3e-5f6a7b8c9d0e")).toBe(true);
  });

  it("자리표시와 빈 값은 아니다", () => {
    expect(isEasProjectId("sub1s-mobile-project-id")).toBe(false);
    expect(isEasProjectId("")).toBe(false);
    expect(isEasProjectId(undefined)).toBe(false);
  });
});

describe("pushTargetOf", () => {
  it("월말정산 알림은 타임라인으로 간다", () => {
    expect(pushTargetOf({ type: "MONTHLY_SETTLEMENT", periodKey: "2026-09", screen: "timeline" })).toEqual({ screen: "Timeline", periodKey: "2026-09" });
    expect(pushTargetOf({ screen: "timeline" })).toEqual({ screen: "Timeline" });
  });

  it("연도가 다른 정산 월도 보존하고 유효하지 않은 키는 일반 진입으로 대체한다", () => {
    expect(pushTargetOf({ type: "MONTHLY_SETTLEMENT", periodKey: "2025-12" })).toEqual({ screen: "Timeline", periodKey: "2025-12" });
    for (const periodKey of [undefined, null, 202610, "", "2026-00", "2026-13", "2026-1", "1999-12", "2101-01", "2026-10-01"]) {
      expect(pushTargetOf({ type: "MONTHLY_SETTLEMENT", periodKey })).toEqual({ screen: "Timeline" });
    }
  });

  it("모르는 알림이나 잘못된 data는 이동하지 않는다", () => {
    expect(pushTargetOf({ type: "OTHER" })).toBeNull();
    expect(pushTargetOf(undefined)).toBeNull();
    expect(pushTargetOf("x")).toBeNull();
  });
});
