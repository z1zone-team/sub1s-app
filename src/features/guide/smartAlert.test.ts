import {
  SMART_ALERT_BANNER_MS,
  smartAlertBody,
  smartAlertKind,
  smartAlertShowsBanner,
  smartAlertTitle,
} from "./smartAlert";

describe("smartAlertKind", () => {
  it("환승 알림 둘은 환승, 하차 준비는 하차로 가른다", () => {
    expect(smartAlertKind("TRANSFER_PREPARE")).toBe("TRANSFER");
    expect(smartAlertKind("TRANSFER_NOW")).toBe("TRANSFER");
    expect(smartAlertKind("ALIGHT_PREPARE")).toBe("ALIGHT");
  });
});

describe("smartAlertTitle", () => {
  it("종류마다 제목이 다르다", () => {
    expect(smartAlertTitle("TRANSFER_PREPARE")).toBe("곧 환승해요");
    expect(smartAlertTitle("TRANSFER_NOW")).toBe("지금 환승하세요");
    expect(smartAlertTitle("ALIGHT_PREPARE")).toBe("곧 내려요");
  });
});

describe("smartAlertBody", () => {
  it("추천 문이 있으면 서버 문구에 칸과 문 번호를 덧붙인다", () => {
    expect(
      smartAlertBody({ type: "TRANSFER_PREPARE", message: "다음 역 강남역에서 환승이에요", recommendedDoor: "6-2" })
    ).toBe("다음 역 강남역에서 환승이에요 · 6번째 칸 2번 문");
  });

  it("추천 문이 비어 있으면 서버 문구만 쓴다", () => {
    expect(smartAlertBody({ type: "ALIGHT_PREPARE", message: "다음 역 선릉역에서 내려요", recommendedDoor: "" })).toBe(
      "다음 역 선릉역에서 내려요"
    );
  });
});

describe("smartAlertShowsBanner", () => {
  it("앱이 켜져 있을 때만 알림과 함께 배너도 보여 준다", () => {
    expect(smartAlertShowsBanner("active")).toBe(true);
    expect(smartAlertShowsBanner("background")).toBe(false);
    expect(smartAlertShowsBanner("inactive")).toBe(false);
  });
});

describe("SMART_ALERT_BANNER_MS", () => {
  it("배너는 몇 초 동안만 보인다", () => {
    expect(SMART_ALERT_BANNER_MS).toBeGreaterThanOrEqual(3000);
    expect(SMART_ALERT_BANNER_MS).toBeLessThanOrEqual(15000);
  });
});
