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
    expect(pushTargetOf({ type: "MONTHLY_SETTLEMENT", periodKey: "2026-09", screen: "timeline" })).toEqual({ screen: "Timeline" });
    expect(pushTargetOf({ screen: "timeline" })).toEqual({ screen: "Timeline" });
  });

  it("모르는 알림이나 잘못된 data는 이동하지 않는다", () => {
    expect(pushTargetOf({ type: "OTHER" })).toBeNull();
    expect(pushTargetOf(undefined)).toBeNull();
    expect(pushTargetOf("x")).toBeNull();
  });
});
